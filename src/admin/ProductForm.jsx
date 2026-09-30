import { useState } from 'react';
import { MEDIA_BASE, SECTIONS, TAGS } from './config';
import { prepareImage } from './image';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const slugify = text => text
  .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

function toForm(p) {
  return {
    id: p?.id ?? '',
    section: p?.section ?? 'machinery',
    code: p?.code ?? '',
    icon: p?.icon ?? 'fas fa-cog',
    tags: p?.tags ?? [],
    keywords: p?.keywords ?? '',
    image: p?.image ?? null,
    name: p?.es.name ?? '',
    desc: p?.es.desc ?? '',
    lead: p?.es.lead ?? '',
    description: p?.es.description.join('\n\n') ?? '',
    features: p?.es.features.join('\n') ?? '',
    specs: p?.es.specs.length ? p.es.specs : [['', '']],
  };
}

function toProduct(f) {
  const lines = text => text.split('\n').map(s => s.trim()).filter(Boolean);
  return {
    section: f.section,
    code: f.code.trim() || null,
    icon: f.icon.trim(),
    tags: f.tags,
    keywords: f.keywords.trim(),
    image: f.image,
    es: {
      name: f.name.trim(),
      desc: f.desc.trim(),
      lead: f.lead.trim(),
      description: f.description.split(/\n\s*\n/).map(s => s.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean),
      features: lines(f.features),
      specs: f.specs.map(([k, v]) => [k.trim(), v.trim()]).filter(([k, v]) => k && v),
    },
  };
}

export default function ProductForm({ product, existingIds, onSave, onCancel, onUpload }) {
  const isNew = !product;
  const [form, setForm] = useState(() => toForm(product));
  const [idTouched, setIdTouched] = useState(false);
  const [busy, setBusy] = useState(null); // null | 'saving' | 'uploading'
  const [error, setError] = useState(null);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const setName = value => setForm(f => ({
    ...f,
    name: value,
    ...(isNew && !idTouched ? { id: slugify(value) } : {}),
  }));

  const toggleTag = tag => set('tags', form.tags.includes(tag) ? form.tags.filter(t => t !== tag) : [...form.tags, tag]);

  const setSpec = (i, j, value) => set('specs', form.specs.map((row, r) => (r === i ? row.map((c, k) => (k === j ? value : c)) : row)));
  const moveSpec = (i, dir) => {
    const specs = [...form.specs];
    [specs[i], specs[i + dir]] = [specs[i + dir], specs[i]];
    set('specs', specs);
  };

  const uploadImage = async e => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy('uploading');
    setError(null);
    try {
      const { contentType, data } = await prepareImage(file);
      const { url } = await onUpload(form.id || form.name || 'producto', contentType, data);
      set('image', url);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const submit = async e => {
    e.preventDefault();
    if (!SLUG_RE.test(form.id)) return setError('El identificador solo puede tener minúsculas, números y guiones.');
    if (isNew && existingIds.includes(form.id)) return setError('Ya existe un producto con ese identificador.');
    setBusy('saving');
    setError(null);
    try {
      await onSave(form.id, toProduct(form));
    } catch (err) {
      setError(err.message);
      setBusy(null);
    }
  };

  return (
    <form className="adm-form" onSubmit={submit}>
      <div className="adm-toolbar">
        <h1>{isNew ? 'Nuevo producto' : `Editar: ${product.es.name}`}</h1>
        <div className="adm-toolbar-actions">
          <button type="button" className="adm-btn adm-btn-ghost" onClick={onCancel} disabled={!!busy}>Cancelar</button>
          <button className="adm-btn adm-btn-primary" disabled={!!busy}>
            {busy === 'saving' ? 'Guardando y traduciendo…' : 'Guardar'}
          </button>
        </div>
      </div>

      {error && <div className="adm-alert adm-alert-error" role="alert">{error}</div>}

      <fieldset className="adm-panel">
        <legend>General</legend>
        <div className="adm-grid">
          <label className="adm-field adm-span-2">
            <span>Nombre *</span>
            <input required maxLength={120} value={form.name} onChange={e => setName(e.target.value)} />
          </label>
          <label className="adm-field">
            <span>Identificador (URL) *</span>
            <input
              required
              maxLength={60}
              value={form.id}
              disabled={!isNew}
              onChange={e => { setIdTouched(true); set('id', e.target.value); }}
            />
            <small>{isNew ? 'Minúsculas y guiones. No se puede cambiar después.' : `/products?id=${form.id}`}</small>
          </label>
          <label className="adm-field">
            <span>Sección *</span>
            <select value={form.section} onChange={e => set('section', e.target.value)}>
              {SECTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </label>
          <label className="adm-field">
            <span>Código de producto</span>
            <input maxLength={20} placeholder="ej. COMP-PU" value={form.code} onChange={e => set('code', e.target.value)} />
          </label>
          <label className="adm-field">
            <span>Ícono (Font Awesome) *</span>
            <div className="adm-icon-input">
              <i className={form.icon}></i>
              <input required value={form.icon} onChange={e => set('icon', e.target.value)} />
            </div>
            <small>ej. <code>fas fa-flask</code> — <a href="https://fontawesome.com/v6/search?o=r&m=free&s=solid" target="_blank" rel="noopener noreferrer">buscar íconos</a></small>
          </label>
          <div className="adm-field adm-span-2">
            <span>Industrias</span>
            <div className="adm-checks">
              {TAGS.map(t => (
                <label key={t.id} className="adm-check">
                  <input type="checkbox" checked={form.tags.includes(t.id)} onChange={() => toggleTag(t.id)} /> {t.label}
                </label>
              ))}
            </div>
          </div>
          <label className="adm-field adm-span-2">
            <span>Palabras clave de búsqueda</span>
            <input maxLength={500} placeholder="ej. llenadora peristáltica viales estéril" value={form.keywords} onChange={e => set('keywords', e.target.value)} />
            <small>Términos adicionales para el buscador del sitio (marcas, sinónimos). No se muestran.</small>
          </label>
        </div>
      </fieldset>

      <fieldset className="adm-panel">
        <legend>Imagen</legend>
        <div className="adm-image">
          {form.image
            ? <img src={MEDIA_BASE + form.image} alt="" />
            : <div className="adm-image-empty"><i className="fas fa-image"></i> Sin imagen</div>}
          <div className="adm-image-actions">
            <label className={`adm-btn adm-btn-ghost${busy ? ' adm-disabled' : ''}`}>
              <i className="fas fa-upload"></i> {busy === 'uploading' ? 'Subiendo…' : form.image ? 'Reemplazar' : 'Subir imagen'}
              <input type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={!!busy} onChange={uploadImage} />
            </label>
            {form.image && (
              <button type="button" className="adm-btn adm-btn-ghost adm-danger-text" disabled={!!busy} onClick={() => set('image', null)}>
                Quitar
              </button>
            )}
            <small>JPG, PNG o WebP. Se optimiza automáticamente.</small>
          </div>
        </div>
      </fieldset>

      <fieldset className="adm-panel">
        <legend>Contenido</legend>
        <p className="adm-muted adm-hint">Escribe en español. La versión en inglés se genera automáticamente al guardar.</p>
        <label className="adm-field">
          <span>Descripción corta (tarjeta) *</span>
          <textarea required rows={2} maxLength={300} value={form.desc} onChange={e => set('desc', e.target.value)} />
        </label>
        <label className="adm-field">
          <span>Introducción (página del producto) *</span>
          <textarea required rows={3} maxLength={600} value={form.lead} onChange={e => set('lead', e.target.value)} />
        </label>
        <label className="adm-field">
          <span>Descripción detallada</span>
          <textarea rows={10} value={form.description} onChange={e => set('description', e.target.value)} />
          <small>Separa los párrafos con una línea en blanco.</small>
        </label>
        <label className="adm-field">
          <span>Características</span>
          <textarea rows={8} value={form.features} onChange={e => set('features', e.target.value)} />
          <small>Una característica por línea.</small>
        </label>
      </fieldset>

      <fieldset className="adm-panel">
        <legend>Especificaciones</legend>
        <div className="adm-specs">
          {form.specs.map(([k, v], i) => (
            <div key={i} className="adm-spec-row">
              <input placeholder="Nombre (ej. Material)" value={k} maxLength={200} onChange={e => setSpec(i, 0, e.target.value)} />
              <input placeholder="Valor (ej. Acero inoxidable 316L)" value={v} maxLength={200} onChange={e => setSpec(i, 1, e.target.value)} />
              <button type="button" className="adm-icon-btn" title="Subir" disabled={i === 0} onClick={() => moveSpec(i, -1)}><i className="fas fa-chevron-up"></i></button>
              <button type="button" className="adm-icon-btn" title="Bajar" disabled={i === form.specs.length - 1} onClick={() => moveSpec(i, 1)}><i className="fas fa-chevron-down"></i></button>
              <button type="button" className="adm-icon-btn" title="Quitar" onClick={() => set('specs', form.specs.filter((_, r) => r !== i))}><i className="fas fa-times"></i></button>
            </div>
          ))}
        </div>
        <button type="button" className="adm-btn adm-btn-ghost" onClick={() => set('specs', [...form.specs, ['', '']])}>
          <i className="fas fa-plus"></i> Agregar fila
        </button>
      </fieldset>
    </form>
  );
}
