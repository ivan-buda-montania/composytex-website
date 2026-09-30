import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import MachineryPage from './pages/MachineryPage';
import MaterialsPage from './pages/MaterialsPage';
import ProductDetailPage from './pages/ProductDetailPage';

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/machinery" element={<MachineryPage />} />
            <Route path="/materials" element={<MaterialsPage />} />
            <Route path="/products" element={<ProductDetailPage />} />
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
    </LanguageProvider>
  );
}
