import { useState } from 'react';
import { SECTIONS, TAGS } from './config';

const TAG_LABELS = Object.fromEntries(TAGS.map(t => [t.id, t.label]));

export default function ProductList({ products, onNew, onEdit, onDelete, onReorder }) {
  const [confirmingId, setConfirmingId] = useState(null);
  const [busy, setBusy] = useState(false);

  const act = async fn => {
    setBusy(true);
    try { await fn(); } catch { /* shown by AdminApp */ } finally { setBusy(false); }
  };

  // Swap a product with its neighbour inside the same section.
  const move = (id, direction) => {
    const ids = products.map(p => p.id);
    const index = ids.indexOf(id);
    const section = products[index].section;
    let target = index + direction;
    while (target >= 0 && target < products.length && products[target].section !== section) target += direction;
    if (target < 0 || target >= products.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    act(() => onReorder(ids));
  };

  return (
    <>
      <div className="adm-toolbar">
        <h1>Productos <span className="adm-muted">({products.length})</span></h1>
        <button className="adm-btn adm-btn-primary" onClick={onNew}>
          <i className="fas fa-plus"></i> Nuevo producto
        </button>
      </div>

      {SECTIONS.map(section => {
        const items = products.filter(p => p.section === section.id);
        return (
          <section key={section.id} className="adm-section">
            <h2>{section.label} <span className="adm-muted">({items.length})</span></h2>
            {items.length === 0 && <p className="adm-muted">Sin productos.</p>}
            <ul className="adm-list">
              {items.map((p, i) => (
                <li key={p.id} className="adm-row">
                  <div className="adm-row-order">
                    <button className="adm-icon-btn" title="Subir" disabled={busy || i === 0} onClick={() => move(p.id, -1)}>
                      <i className="fas fa-chevron-up"></i>
                    </button>
                    <button className="adm-icon-btn" title="Bajar" disabled={busy || i === items.length - 1} onClick={() => move(p.id, 1)}>
                      <i className="fas fa-chevron-down"></i>
                    </button>
                  </div>
                  <div className="adm-row-icon"><i className={p.icon}></i></div>
                  <div className="adm-row-main">
                    <strong>{p.es.name}</strong>
                    {p.code && <span className="adm-badge">{p.code}</span>}
                    {p.image && <span className="adm-badge adm-badge-soft"><i className="fas fa-image"></i> Imagen</span>}
                    <p>{p.es.desc}</p>
                    <div className="adm-tags">
                      {p.tags.map(t => <span key={t} className="adm-tag">{TAG_LABELS[t]}</span>)}
                    </div>
                  </div>
                  <div className="adm-row-actions">
                    <a className="adm-btn adm-btn-ghost" href={`/products?id=${p.id}`} target="_blank" rel="noopener noreferrer" title="Ver en el sitio">
                      <i className="fas fa-eye"></i>
                    </a>
                    <button className="adm-btn adm-btn-ghost" disabled={busy} onClick={() => onEdit(p)}>
                      <i className="fas fa-pen"></i> Editar
                    </button>
                    {confirmingId === p.id ? (
                      <>
                        <button className="adm-btn adm-btn-danger" disabled={busy} onClick={() => act(() => onDelete(p.id)).then(() => setConfirmingId(null))}>
                          Confirmar
                        </button>
                        <button className="adm-btn adm-btn-ghost" disabled={busy} onClick={() => setConfirmingId(null)}>Cancelar</button>
                      </>
                    ) : (
                      <button className="adm-btn adm-btn-ghost adm-danger-text" disabled={busy} onClick={() => setConfirmingId(p.id)}>
                        <i className="fas fa-trash"></i> Eliminar
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
