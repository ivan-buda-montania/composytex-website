import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';
import { TranslateClient, TranslateTextCommand } from '@aws-sdk/client-translate';
import { randomBytes } from 'node:crypto';
import { validateProduct, validateOrder, SLUG_RE } from './validate.mjs';

const { BUCKET, BUCKET_REGION, DISTRIBUTION_ID } = process.env;
const CATALOG_KEY = 'data/catalog.json';
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const IMAGE_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

const s3 = new S3Client({ region: BUCKET_REGION });
const cloudfront = new CloudFrontClient({});
const translate = new TranslateClient({});

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const json = (status, body) => ({
  statusCode: status,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

export async function handler(event) {
  try {
    const body = event.body
      ? JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body)
      : {};
    const id = event.pathParameters?.id;

    switch (event.routeKey) {
      case 'GET /catalog':
        return json(200, (await readCatalog()).catalog);
      case 'PUT /products/{id}': {
        const translated = new Map(); // survives conflict retries so nothing is translated twice
        return json(200, await mutate(catalog => upsertProduct(catalog, id, body, translated)));
      }
      case 'DELETE /products/{id}':
        return json(200, await mutate(catalog => deleteProduct(catalog, id)));
      case 'PUT /order':
        return json(200, await mutate(catalog => reorder(catalog, body)));
      case 'POST /media':
        return json(201, await uploadMedia(body));
      default:
        return json(404, { error: 'Ruta no encontrada' });
    }
  } catch (err) {
    if (err instanceof HttpError) return json(err.status, { error: err.message });
    if (err instanceof SyntaxError) return json(400, { error: 'JSON inválido' });
    console.error(err);
    return json(500, { error: 'Error interno del servidor' });
  }
}

// ── Catalog storage ─────────────────────────────────────────────────────────

async function readCatalog() {
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: CATALOG_KEY }));
    return { catalog: JSON.parse(await res.Body.transformToString()), etag: res.ETag };
  } catch (err) {
    if (err.name === 'NoSuchKey') return { catalog: { products: [] }, etag: null };
    throw err;
  }
}

// Read-modify-write with an S3 conditional put so concurrent edits never overwrite each other.
async function mutate(change, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    const { catalog, etag } = await readCatalog();
    const removedImages = await change(catalog);
    catalog.updatedAt = new Date().toISOString();
    try {
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: CATALOG_KEY,
        Body: JSON.stringify(catalog),
        ContentType: 'application/json; charset=utf-8',
        CacheControl: 'public, max-age=60',
        ...(etag ? { IfMatch: etag } : { IfNoneMatch: '*' }),
      }));
    } catch (err) {
      if (err.$metadata?.httpStatusCode === 412 && i < attempts - 1) continue;
      throw err;
    }
    await Promise.all([invalidate(['/' + CATALOG_KEY]), deleteUnusedImages(catalog, removedImages)]);
    return catalog;
  }
}

async function invalidate(paths) {
  await cloudfront.send(new CreateInvalidationCommand({
    DistributionId: DISTRIBUTION_ID,
    InvalidationBatch: {
      CallerReference: `${Date.now()}-${randomBytes(4).toString('hex')}`,
      Paths: { Quantity: paths.length, Items: paths },
    },
  }));
}

async function deleteUnusedImages(catalog, candidates = []) {
  const inUse = new Set(catalog.products.map(p => p.image));
  await Promise.all(candidates
    .filter(src => src?.startsWith('/media/') && !inUse.has(src))
    .map(src => s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: src.slice(1) }))));
}

// ── Operations ──────────────────────────────────────────────────────────────

async function upsertProduct(catalog, id, body, translated) {
  if (!SLUG_RE.test(id ?? '')) throw new HttpError(400, 'Identificador inválido');
  const errors = validateProduct(body.product);
  if (errors.length) throw new HttpError(400, errors.join('. '));

  const index = catalog.products.findIndex(p => p.id === id);
  if (body.create && index !== -1) throw new HttpError(409, `Ya existe un producto con el identificador "${id}"`);
  if (!body.create && index === -1) throw new HttpError(404, 'Producto no encontrado');

  const { section, code, icon, tags, keywords, image, es } = body.product;
  const product = {
    id,
    section,
    code: code || null,
    icon,
    tags,
    keywords: keywords || '',
    image: image || null,
    es,
    en: await translateContent(es, catalog, translated),
  };

  if (index === -1) {
    catalog.products.push(product);
    return [];
  }
  const previousImage = catalog.products[index].image;
  catalog.products[index] = product;
  return [previousImage];
}

function deleteProduct(catalog, id) {
  const index = catalog.products.findIndex(p => p.id === id);
  if (index === -1) throw new HttpError(404, 'Producto no encontrado');
  const [removed] = catalog.products.splice(index, 1);
  return [removed.image];
}

function reorder(catalog, body) {
  const errors = validateOrder(body.ids, catalog.products);
  if (errors.length) throw new HttpError(400, errors.join('. '));
  const byId = new Map(catalog.products.map(p => [p.id, p]));
  catalog.products = body.ids.map(id => byId.get(id));
  return [];
}

async function uploadMedia(body) {
  const ext = IMAGE_TYPES[body.contentType];
  if (!ext) throw new HttpError(400, 'Formato de imagen no permitido (JPG, PNG o WebP)');
  const data = Buffer.from(body.data ?? '', 'base64');
  if (!data.length) throw new HttpError(400, 'Imagen vacía');
  if (data.length > MAX_IMAGE_BYTES) throw new HttpError(413, 'La imagen supera 4 MB');

  const base = String(body.name ?? 'imagen')
    .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'imagen';
  const key = `media/${base}-${randomBytes(4).toString('hex')}.${ext}`;

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: data,
    ContentType: body.contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  }));
  return { url: '/' + key };
}

// ── Spanish → English ───────────────────────────────────────────────────────

// Reuse English text for any Spanish string that already exists in the catalog
// (keeps the hand-written English), and machine-translate only what is new.
async function translateContent(es, catalog, translated) {
  const known = new Map(translated);
  const remember = (a, b) => {
    if (typeof a === 'string') {
      if (a && typeof b === 'string' && !known.has(a)) known.set(a, b);
    } else if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
      a.forEach((v, i) => remember(v, b[i]));
    } else if (a && b && typeof a === 'object') {
      for (const k of Object.keys(a)) remember(a[k], b[k]);
    }
  };
  for (const p of catalog.products) remember(p.es, p.en);

  const pending = new Map();
  const walk = value => {
    if (typeof value === 'string') {
      if (value && !known.has(value)) pending.set(value, null);
    } else if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === 'object') Object.values(value).forEach(walk);
  };
  walk(es);

  const texts = [...pending.keys()];
  for (let i = 0; i < texts.length; i += 8) {
    await Promise.all(texts.slice(i, i + 8).map(async text => {
      const res = await translate.send(new TranslateTextCommand({
        Text: text,
        SourceLanguageCode: 'es',
        TargetLanguageCode: 'en',
      }));
      known.set(text, res.TranslatedText);
      translated.set(text, res.TranslatedText);
    }));
  }

  const build = value => {
    if (typeof value === 'string') return value ? known.get(value) : '';
    if (Array.isArray(value)) return value.map(build);
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, build(v)]));
  };
  return build(es);
}
