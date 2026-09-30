import { useEffect, useState } from 'react';
import { CatalogContext } from './catalogContext';
import { CATALOG_URL } from '../lib/catalog';

export function CatalogProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', products: [] });

  useEffect(() => {
    fetch(CATALOG_URL)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => setState({ status: 'ready', products: data.products }))
      .catch(() => setState({ status: 'error', products: [] }));
  }, []);

  return <CatalogContext.Provider value={state}>{children}</CatalogContext.Provider>;
}
