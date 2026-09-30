import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { CatalogProvider } from './context/CatalogContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import MachineryPage from './pages/MachineryPage';
import MaterialsPage from './pages/MaterialsPage';
import ProductDetailPage from './pages/ProductDetailPage';

const AdminApp = lazy(() => import('./admin/AdminApp'));

function PublicLayout() {
  return (
    <LanguageProvider>
      <CatalogProvider>
        <Navbar />
        <main>
          <Outlet />
        </main>
        <Footer />
      </CatalogProvider>
    </LanguageProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/machinery" element={<MachineryPage />} />
          <Route path="/materials" element={<MaterialsPage />} />
          <Route path="/products" element={<ProductDetailPage />} />
        </Route>
        <Route path="/admin/*" element={<Suspense fallback={null}><AdminApp /></Suspense>} />
      </Routes>
    </BrowserRouter>
  );
}
