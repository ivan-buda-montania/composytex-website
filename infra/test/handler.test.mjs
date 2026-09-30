// Tests for the catalog Lambda with AWS clients mocked in memory. Run: npm test
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { S3Client } from '@aws-sdk/client-s3';
import { CloudFrontClient } from '@aws-sdk/client-cloudfront';
import { TranslateClient } from '@aws-sdk/client-translate';
import { validateProduct } from '../src/validate.mjs';

const SEED = JSON.parse(readFileSync(new URL('../../seed/data/catalog.json', import.meta.url)));

let store, etag, invalidations, translated, deleted, conflicts;

S3Client.prototype.send = async function send(command) {
  const { Key, Body, IfMatch, IfNoneMatch } = command.input;
  const current = store.get(Key);
  switch (command.constructor.name) {
    case 'GetObjectCommand':
      if (!current) throw Object.assign(new Error('NoSuchKey'), { name: 'NoSuchKey' });
      return { Body: { transformToString: async () => current.body }, ETag: current.etag };
    case 'PutObjectCommand':
      if (IfMatch && conflicts > 0) {
        conflicts--;
        throw Object.assign(new Error('PreconditionFailed'), { $metadata: { httpStatusCode: 412 } });
      }
      if ((IfMatch && current?.etag !== IfMatch) || (IfNoneMatch === '*' && current)) {
        throw Object.assign(new Error('PreconditionFailed'), { $metadata: { httpStatusCode: 412 } });
      }
      store.set(Key, { body: Body, etag: `"${++etag}"`, input: command.input });
      return {};
    case 'DeleteObjectCommand':
      deleted.push(Key);
      store.delete(Key);
      return {};
  }
};
CloudFrontClient.prototype.send = async command => {
  invalidations.push(command.input.InvalidationBatch.Paths.Items);
  return {};
};
TranslateClient.prototype.send = async command => {
  translated.push(command.input.Text);
  return { TranslatedText: `EN:${command.input.Text}` };
};

process.env.BUCKET = 'bucket';
process.env.BUCKET_REGION = 'us-east-2';
process.env.DISTRIBUTION_ID = 'DIST';
const { handler } = await import('../src/handler.mjs');

beforeEach(() => {
  store = new Map([['data/catalog.json', { body: JSON.stringify(SEED), etag: '"1"' }]]);
  etag = 1;
  invalidations = [];
  translated = [];
  deleted = [];
  conflicts = 0;
});

async function call(routeKey, { id, body } = {}) {
  const res = await handler({ routeKey, pathParameters: id ? { id } : undefined, body: body && JSON.stringify(body) });
  return { status: res.statusCode, body: JSON.parse(res.body) };
}
const catalog = () => JSON.parse(store.get('data/catalog.json').body);
const editable = p => ({ section: p.section, code: p.code, icon: p.icon, tags: p.tags, keywords: p.keywords, image: p.image, es: p.es });
const NEW_PRODUCT = {
  section: 'materials', code: 'COMP-X', icon: 'fas fa-flask', tags: ['lab'], keywords: 'x', image: null,
  es: { name: 'Nuevo', desc: 'Corta', lead: 'Intro', description: ['Párrafo'], features: ['Uno'], specs: [['Certificaciones', 'ISO 9001']] },
};

test('seed catalog passes validation', () => {
  for (const p of SEED.products) assert.deepEqual(validateProduct(editable(p)), [], p.id);
});

test('GET /catalog returns the stored catalog', async () => {
  const r = await call('GET /catalog');
  assert.equal(r.status, 200);
  assert.equal(r.body.products.length, SEED.products.length);
});

test('GET /catalog returns an empty catalog when none exists', async () => {
  store.clear();
  assert.deepEqual((await call('GET /catalog')).body, { products: [] });
});

test('editing one field only translates that field and keeps existing English', async () => {
  const co2 = SEED.products.find(p => p.id === 'co2-incubators');
  const product = { ...editable(co2), es: { ...co2.es, name: 'Incubadoras de CO₂ Pro' } };
  conflicts = 1; // first write loses a race and is retried
  const r = await call('PUT /products/{id}', { id: co2.id, body: { product } });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.deepEqual(translated, ['Incubadoras de CO₂ Pro']);
  const saved = catalog().products.find(p => p.id === co2.id);
  assert.equal(saved.en.name, 'EN:Incubadoras de CO₂ Pro');
  assert.equal(saved.en.lead, co2.en.lead);
  assert.deepEqual(saved.en.specs, co2.en.specs);
  assert.deepEqual(invalidations.at(-1), ['/data/catalog.json']);
  assert.equal(store.get('data/catalog.json').input.CacheControl, 'public, max-age=60');
});

test('creating a product reuses known translations from other products', async () => {
  const r = await call('PUT /products/{id}', { id: 'nuevo', body: { product: NEW_PRODUCT, create: true } });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.deepEqual(catalog().products.at(-1).en.specs, [['Certifications', 'EN:ISO 9001']]);
  assert.ok(!translated.includes('Certificaciones'));
});

test('create/update conflicts and invalid input are rejected', async () => {
  const existing = SEED.products[0].id;
  assert.equal((await call('PUT /products/{id}', { id: existing, body: { product: NEW_PRODUCT, create: true } })).status, 409);
  assert.equal((await call('PUT /products/{id}', { id: 'missing', body: { product: NEW_PRODUCT } })).status, 404);
  assert.equal((await call('PUT /products/{id}', { id: 'Bad Id', body: { product: NEW_PRODUCT, create: true } })).status, 400);
  const bad = await call('PUT /products/{id}', { id: 'x', body: { product: { ...NEW_PRODUCT, icon: '"><script>', tags: ['zzz'] }, create: true } });
  assert.equal(bad.status, 400);
  assert.match(bad.body.error, /Ícono inválido/);
  assert.equal((await handler({ routeKey: 'PUT /order', body: '{bad' })).statusCode, 400);
  assert.equal((await call('GET /nope')).status, 404);
});

test('image upload names files safely and rejects other types', async () => {
  const r = await call('POST /media', { body: { name: 'Ñandú Foto', contentType: 'image/webp', data: Buffer.from('abc').toString('base64') } });
  assert.equal(r.status, 201);
  assert.match(r.body.url, /^\/media\/nandu-foto-[0-9a-f]{8}\.webp$/);
  assert.equal((await call('POST /media', { body: { contentType: 'image/gif', data: 'YQ==' } })).status, 400);
});

test('replacing or deleting a product removes its unused image', async () => {
  const co2 = SEED.products.find(p => p.id === 'co2-incubators');
  const upload = await call('POST /media', { body: { name: 'x', contentType: 'image/png', data: 'YQ==' } });
  await call('PUT /products/{id}', { id: co2.id, body: { product: { ...editable(co2), image: upload.body.url } } });
  assert.deepEqual(deleted, ['media/co2-incubators.jpeg']);
  const r = await call('DELETE /products/{id}', { id: co2.id });
  assert.equal(r.status, 200);
  assert.equal(deleted.at(-1), upload.body.url.slice(1));
  assert.equal((await call('DELETE /products/{id}', { id: co2.id })).status, 404);
});

test('reorder requires every product exactly once', async () => {
  const ids = catalog().products.map(p => p.id).reverse();
  assert.equal((await call('PUT /order', { body: { ids } })).status, 200);
  assert.deepEqual(catalog().products.map(p => p.id), ids);
  assert.equal((await call('PUT /order', { body: { ids: ids.slice(1) } })).status, 400);
});
