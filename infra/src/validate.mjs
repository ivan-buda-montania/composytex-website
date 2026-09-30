export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SECTIONS = ['machinery', 'materials'];
export const TAGS = ['pharma', 'food', 'lab', 'industry', 'dental'];
const ICON_RE = /^fa[bsr]? fa-[a-z0-9-]+$/;
const IMAGE_RE = /^\/media\/[a-z0-9-]+\.(?:jpg|png|webp|jpeg)$/;

const isText = (v, max, required = true) =>
  typeof v === 'string' && v.length <= max && (!required || v.trim().length > 0);

const isTextList = (v, maxItems, maxLen) =>
  Array.isArray(v) && v.length <= maxItems && v.every(s => isText(s, maxLen));

export function validateProduct(p) {
  if (!p || typeof p !== 'object') return ['Falta el producto'];
  const errors = [];
  if (!SECTIONS.includes(p.section)) errors.push('Sección inválida');
  if (p.code != null && !isText(p.code, 20, false)) errors.push('Código inválido');
  if (!ICON_RE.test(p.icon ?? '')) errors.push('Ícono inválido (ej. "fas fa-flask")');
  if (!Array.isArray(p.tags) || !p.tags.every(t => TAGS.includes(t))) errors.push('Etiquetas inválidas');
  if (p.keywords != null && !isText(p.keywords, 500, false)) errors.push('Palabras clave inválidas');
  if (p.image != null && !IMAGE_RE.test(p.image)) errors.push('Imagen inválida');

  const es = p.es;
  if (!es || typeof es !== 'object') return [...errors, 'Falta el contenido en español'];
  if (!isText(es.name, 120)) errors.push('Nombre requerido (máx. 120 caracteres)');
  if (!isText(es.desc, 300)) errors.push('Descripción corta requerida (máx. 300 caracteres)');
  if (!isText(es.lead, 600)) errors.push('Introducción requerida (máx. 600 caracteres)');
  if (!isTextList(es.description, 10, 2000)) errors.push('Descripción: hasta 10 párrafos no vacíos');
  if (!isTextList(es.features, 20, 200)) errors.push('Características: hasta 20, sin vacíos');
  if (!Array.isArray(es.specs) || es.specs.length > 30 ||
      !es.specs.every(s => Array.isArray(s) && s.length === 2 && isText(s[0], 200) && isText(s[1], 200))) {
    errors.push('Especificaciones: hasta 30 filas con nombre y valor');
  }
  return errors;
}

export function validateOrder(ids, products) {
  if (!Array.isArray(ids)) return ['Falta la lista de identificadores'];
  const current = new Set(products.map(p => p.id));
  if (ids.length !== current.size || new Set(ids).size !== ids.length || !ids.every(id => current.has(id))) {
    return ['El orden debe incluir cada producto exactamente una vez'];
  }
  return [];
}
