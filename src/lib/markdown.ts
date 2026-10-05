import { SITE_URL } from './site';

type Translate = (key: string) => string;

export interface MarkdownProduct {
  id: string;
  section: string;
  code?: string | null;
  name: string;
  desc: string;
  lead?: string;
  description?: string[];
  features?: string[];
  specs?: [string, string][];
}

interface MarkdownInput {
  pathname: string;
  productId?: string | null;
  t: Translate;
  products?: MarkdownProduct[];
}

const CONTACT_EMAIL = 'composytex@gmail.com';
const CONTACT_PHONE = '+52 56 6468 1475';

function list(items: string[]) {
  return items.map(item => `- ${item}`).join('\n');
}

function productLine(p: MarkdownProduct) {
  const code = p.code ? ` (${p.code})` : '';
  return `- [${p.name}](${SITE_URL}/products?id=${p.id})${code}: ${p.desc}`;
}

function productMarkdown(p: MarkdownProduct, t: Translate) {
  const parts = [`# ${p.name}`, `> ${p.lead ?? p.desc}`];
  if (p.code) parts.push(`Code: ${p.code}`);
  parts.push(`Category: ${t(`categories.${p.section}`)}`);
  if (p.description?.length) parts.push(p.description.join('\n\n'));
  if (p.features?.length) parts.push(`## Features\n\n${list(p.features)}`);
  if (p.specs?.length) {
    parts.push(`## Specifications\n\n${p.specs.map(([k, v]) => `- ${k}: ${v}`).join('\n')}`);
  }
  parts.push(`## Contact\n\n- Phone and WhatsApp: ${CONTACT_PHONE}\n- Email: ${CONTACT_EMAIL}\n- Page: ${SITE_URL}/products?id=${p.id}`);
  return parts.join('\n\n');
}

function catalogSection(
  title: string,
  intro: string,
  products: MarkdownProduct[] | undefined,
  section: string,
) {
  const items = products?.filter(p => p.section === section) ?? [];
  const body = items.length ? items.map(productLine).join('\n') : `Product list: ${SITE_URL}/data/catalog.json`;
  return `# ${title}\n\n> ${intro}\n\n${body}`;
}

function homeMarkdown(t: Translate) {
  const industries = ['pharmaceutical', 'veterinary', 'cosmetics', 'foodBeverage', 'biotechnology', 'dental']
    .map(key => t(`industries.${key}`));
  const countries = ['canada', 'usa', 'mexico', 'colombia', 'brazil', 'chile', 'spain']
    .map(key => t(`globalPresence.${key}.country`));
  return [
    `# ${t('about.label')}`,
    `> ${t('hero.description')}`,
    t('about.description1'),
    t('about.description2'),
    `## Industries\n\n${list(industries)}`,
    `## ${t('globalPresence.title')}\n\n${list(countries)}`,
    `## Products\n\n- [${t('nav.machinery')}](${SITE_URL}/machinery)\n- [${t('nav.materials')}](${SITE_URL}/materials)`,
    `## ${t('contact.title')}\n\n- Phone and WhatsApp: ${CONTACT_PHONE}\n- Email: ${CONTACT_EMAIL}\n- ${t('contact.location')}\n- ${t('contact.responseTime')}`,
  ].join('\n\n');
}

// Pure so the same function renders the ?format=md view in the browser and the static
// files emitted at build time. Without `products` the lists point at the live JSON catalog.
export function buildMarkdown({ pathname, productId, t, products }: MarkdownInput): string {
  const path = pathname.replace(/\/$/, '') || '/';

  if (path === '/products') {
    const product = products?.find(p => p.id === productId);
    return product ? productMarkdown(product, t) : `# ${t('productDetail.notFound')}\n\n${t('productDetail.notFoundMsg')}`;
  }
  if (path === '/machinery') {
    return catalogSection(t('machinery.title'), t('pages.machinery.description'), products, 'machinery');
  }
  if (path === '/materials') {
    return catalogSection(t('materials.title'), t('pages.materials.description'), products, 'materials');
  }
  return homeMarkdown(t);
}
