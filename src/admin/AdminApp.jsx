import { useCallback, useEffect, useState } from 'react';
import { loadSession, signOut } from './auth';
import { api, UnauthorizedError } from './api';
import { API_URL, COGNITO_CLIENT_ID } from './config';
import LoginPage from './LoginPage';
import ProductList from './ProductList';
import ProductForm from './ProductForm';
import './admin.css';

export default function AdminApp() {
  const [session, setSession] = useState(loadSession);
  const [catalog, setCatalog] = useState(null);
  const [editing, setEditing] = useState(null); // null | { product } | { product: null } for a new one
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = 'Administración · Composytex';
    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex, nofollow';
    document.head.appendChild(robots);
    return () => robots.remove();
  }, []);

  const logout = useCallback(() => {
    signOut();
    setSession(null);
    setCatalog(null);
    setEditing(null);
  }, []);

  // Runs an API call and handles the shared error/expiry behavior.
  // Errors are shown globally unless `inline` is set (the caller shows them itself).
  const run = useCallback(async (call, successMessage, { inline = false } = {}) => {
    setError(null);
    setNotice(null);
    try {
      const result = await call();
      if (result?.products) setCatalog(result);
      if (successMessage) setNotice(successMessage);
      return result;
    } catch (err) {
      if (err instanceof UnauthorizedError) logout();
      else if (!inline) setError(err.message);
      throw err;
    }
  }, [logout]);

  useEffect(() => {
    if (!session) return;
    api.getCatalog()
      .then(setCatalog)
      .catch(err => (err instanceof UnauthorizedError ? logout() : setError(err.message)));
  }, [session, logout]);

  if (!API_URL || !COGNITO_CLIENT_ID) {
    return (
      <div className="adm-center">
        <div className="adm-card">
          <h1>Configuración incompleta</h1>
          <p>Define <code>VITE_API_URL</code> y <code>VITE_COGNITO_CLIENT_ID</code> en <code>.env.production</code> y vuelve a compilar.</p>
        </div>
      </div>
    );
  }

  if (!session) return <LoginPage onSignedIn={setSession} />;

  return (
    <div className="adm">
      <header className="adm-header">
        <div className="adm-brand">
          <img src="/assets/composytex-mark.svg" alt="" />
          <span>Catálogo Composytex</span>
        </div>
        <div className="adm-header-actions">
          <a href="/" target="_blank" rel="noopener noreferrer">Ver sitio <i className="fas fa-external-link-alt"></i></a>
          <span className="adm-user">{session.email}</span>
          <button className="adm-btn adm-btn-ghost" onClick={logout}>Cerrar sesión</button>
        </div>
      </header>

      <main className="adm-main">
        {notice && <div className="adm-alert adm-alert-ok" role="status">{notice}</div>}
        {error && <div className="adm-alert adm-alert-error" role="alert">{error}</div>}

        {!catalog && !error && <p className="adm-muted">Cargando catálogo…</p>}

        {catalog && !editing && (
          <ProductList
            products={catalog.products}
            onNew={() => { setNotice(null); setEditing({ product: null }); }}
            onEdit={product => { setNotice(null); setEditing({ product }); }}
            onDelete={id => run(() => api.deleteProduct(id), 'Producto eliminado.')}
            onReorder={ids => run(() => api.saveOrder(ids), 'Orden actualizado.')}
          />
        )}

        {catalog && editing && (
          <ProductForm
            product={editing.product}
            existingIds={catalog.products.map(p => p.id)}
            onCancel={() => setEditing(null)}
            onUpload={(...args) => run(() => api.uploadImage(...args), null, { inline: true })}
            onSave={async (id, product) => {
              await run(
                () => api.saveProduct(id, product, !editing.product),
                'Guardado. Los cambios aparecerán en el sitio en aproximadamente un minuto.',
                { inline: true },
              );
              setEditing(null);
            }}
          />
        )}
      </main>
    </div>
  );
}
