export const CATALOG_URL = import.meta.env.VITE_CATALOG_URL || '/data/catalog.json';

export const TAG_KEYS = {
  pharma: 'filterTags.pharmaceutical',
  food: 'filterTags.food',
  lab: 'filterTags.laboratory',
  industry: 'filterTags.industrial',
  dental: 'filterTags.dental',
};

// Flatten a catalog product into the requested language (Spanish is the source of truth).
export function localize(product, lang) {
  const { es, en, ...rest } = product;
  return { ...rest, ...es, ...(lang === 'en' ? en : {}) };
}

export function matchesQuery(product, query) {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  return [product.es.name, product.en?.name, product.code, product.keywords]
    .some(field => field?.toLowerCase().includes(q));
}
