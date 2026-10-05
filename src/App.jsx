import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext.jsx';
import { useLanguage } from './context/languageContext';
import { CatalogProvider } from './context/CatalogContext.jsx';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AILayout from './components/AILayout';
import MarkdownView from './components/MarkdownView';
import { SITE_URL, SITE_NAME } from './lib/site';
import HomePage from './pages/HomePage';
import MachineryPage from './pages/MachineryPage';
import MaterialsPage from './pages/MaterialsPage';
import ProductDetailPage from './pages/ProductDetailPage';

const AdminApp = lazy(() => import('./admin/AdminApp'));

// Wraps a page in the semantic layout and fills in its <head> metadata.
function Page({ name, path, schema, children }) {
  const { t } = useLanguage();
  return (
    <AILayout
      title={name === 'home' ? undefined : `${t(`${name}.title`)} · ${SITE_NAME}`}
      description={name === 'home' ? t('hero.description') : t(`pages.${name}.description`)}
      path={path}
      schema={schema}
    >
      {children}
    </AILayout>
  );
}

const HOME_SCHEMA = [
  {
    type: 'Organization',
    data: {
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/assets/composytex-logo.svg`,
      email: 'composytex@gmail.com',
      telephone: '+52 56 6468 1475',
      address: { '@type': 'PostalAddress', addressLocality: 'Iztapalapa, Mexico City', addressCountry: 'MX' },
    },
  },
  { type: 'WebSite', data: { name: SITE_NAME, url: SITE_URL, inLanguage: ['en', 'es'] } },
];

function PublicLayout() {
  const { pathname, search } = useLocation();
  const params = new URLSearchParams(search);
  const markdown = params.get('format') === 'md';

  return (
    <LanguageProvider>
      <CatalogProvider>
        {markdown ? (
          <MarkdownView pathname={pathname} productId={params.get('id')} />
        ) : (
          <>
            <Navbar />
            <Outlet />
            <Footer />
          </>
        )}
      </CatalogProvider>
    </LanguageProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Page name="home" path="/" schema={HOME_SCHEMA}><HomePage /></Page>} />
          <Route path="/machinery" element={<Page name="machinery" path="/machinery"><MachineryPage /></Page>} />
          <Route path="/materials" element={<Page name="materials" path="/materials"><MaterialsPage /></Page>} />
          <Route path="/products" element={<AILayout><ProductDetailPage /></AILayout>} />
        </Route>
        <Route path="/admin/*" element={<Suspense fallback={null}><AdminApp /></Suspense>} />
      </Routes>
    </BrowserRouter>
  );
}
