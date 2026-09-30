import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/languageContext';

export default function Navbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { lang, toggleLanguage, t } = useLanguage();

  useEffect(() => {
    if (location.hash) {
      const elementId = location.hash.slice(1);
      const element = document.getElementById(elementId);
      if (element) {
        setTimeout(() => element.scrollIntoView({ behavior: 'smooth' }), 0);
      }
    } else if (location.pathname === '/') {
      window.scrollTo(0, 0);
    }
  }, [location]);

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Close menus on navigation (state adjusted during render, not in an effect).
  const [menuPath, setMenuPath] = useState(location.pathname);
  if (menuPath !== location.pathname) {
    setMenuPath(location.pathname);
    setDropdownOpen(false);
    setMobileOpen(false);
  }

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const isProductsActive = location.pathname === '/machinery' || location.pathname === '/materials';

  const handleAnchorClick = (hash) => (e) => {
    e.preventDefault();
    setMobileOpen(false);
    if (location.pathname !== '/') {
      navigate('/' + hash);
    } else {
      navigate(hash);
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="logo-area">
          <Link to="/">
            <img src="/assets/composytex-logo.png" alt="Composytex" />
          </Link>
        </div>

        {/* Desktop nav */}
        <div className="nav-links">
          <Link to="/" className={`nav-link${location.pathname === '/' ? ' active' : ''}`}>{t('nav.home')}</Link>
          <a href="#about" onClick={handleAnchorClick('#about')} className="nav-link">{t('nav.aboutUs')}</a>

          <div ref={dropdownRef} className={`nav-dropdown${dropdownOpen ? ' open' : ''}`}>
            <span
              className={`nav-link${isProductsActive ? ' active' : ''}`}
              onClick={() => setDropdownOpen(o => !o)}
            >
              {t('nav.products')} <i className="fas fa-chevron-down chevron"></i>
            </span>
            <div className="dropdown-menu">
              <div className="dropdown-menu-inner">
                <Link to="/machinery"><i className="fas fa-cog"></i> {t('nav.machinery')}</Link>
                <Link to="/materials"><i className="fas fa-cubes"></i> {t('nav.materials')}</Link>
              </div>
            </div>
          </div>

          <a href="#contact" onClick={handleAnchorClick('#contact')} className="nav-link">{t('nav.contact')}</a>

          <button
            onClick={toggleLanguage}
            className="lang-toggle"
          >
            {lang.toUpperCase()}
          </button>

          <a href="tel:+525516937705" className="nav-cta">
            <i className="fas fa-phone-alt"></i> {t('nav.phone')}
          </a>
        </div>

        {/* Mobile right side: lang + hamburger */}
        <div className="mobile-nav-right">
          <button onClick={toggleLanguage} className="lang-toggle">
            {lang.toUpperCase()}
          </button>
          <button
            className="hamburger"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <span className={`hamburger-icon${mobileOpen ? ' open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      <div className={`mobile-drawer${mobileOpen ? ' open' : ''}`}>
        <div className="mobile-drawer-inner">
          <Link to="/" className="mobile-link" onClick={() => setMobileOpen(false)}>
            <i className="fas fa-home"></i> {t('nav.home')}
          </Link>
          <a href="#about" className="mobile-link" onClick={handleAnchorClick('#about')}>
            <i className="fas fa-info-circle"></i> {t('nav.aboutUs')}
          </a>
          <div className="mobile-link-group">
            <span className="mobile-link-label">
              <i className="fas fa-box"></i> {t('nav.products')}
            </span>
            <Link to="/machinery" className="mobile-sub-link" onClick={() => setMobileOpen(false)}>
              <i className="fas fa-cog"></i> {t('nav.machinery')}
            </Link>
            <Link to="/materials" className="mobile-sub-link" onClick={() => setMobileOpen(false)}>
              <i className="fas fa-cubes"></i> {t('nav.materials')}
            </Link>
          </div>
          <a href="#contact" className="mobile-link" onClick={handleAnchorClick('#contact')}>
            <i className="fas fa-envelope"></i> {t('nav.contact')}
          </a>
          <a href="tel:+525516937705" className="mobile-cta">
            <i className="fas fa-phone-alt"></i> {t('nav.phone')}
          </a>
        </div>
      </div>
    </>
  );
}