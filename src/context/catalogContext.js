import { createContext, useContext, useMemo } from 'react';

export const CatalogContext = createContext();

export function useCatalog(section) {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error('useCatalog must be used within CatalogProvider');
  }
  const products = useMemo(
    () => (section ? context.products.filter(p => p.section === section) : context.products),
    [context.products, section],
  );
  return { status: context.status, products };
}
