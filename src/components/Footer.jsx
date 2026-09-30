import { Link } from 'react-router-dom';
import { useLanguage } from '../context/languageContext';

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="footer-main">
      <div className="footer-grid">
        <div className="footer-brand footer-col">
          <img src="/assets/composytex-logo.svg" alt="Composytex" style={{ height: 38, filter: 'brightness(0) invert(1)', opacity: 0.8 }} />
          <p>{t('footer.description')}</p>
        </div>

        <div className="footer-col">
          <h4>{t('footer.navigation')}</h4>
          <Link to="/">{t('nav.home')}</Link>
          <Link to="/#about">{t('nav.aboutUs')}</Link>
          <Link to="/#contact">{t('nav.contact')}</Link>
        </div>

        <div className="footer-col">
          <h4>{t('footer.products')}</h4>
          <Link to="/machinery">{t('nav.machinery')}</Link>
          <Link to="/materials">{t('nav.materials')}</Link>
        </div>

        <div className="footer-col">
          <h4>{t('footer.contactInfo')}</h4>
          <a href="tel:+525516937705">{t('common.phone')}</a>
          <a href="mailto:composytex@gmail.com">{t('footer.email')}</a>
          <p>{t('common.location')}</p>
        </div>
      </div>

      <div className="footer-bottom">
        <span>{t('footer.allRightsReserved')}</span>
        <div className="footer-bottom-links">
          <Link to="/#contact">{t('footer.contactUsLink')}</Link>
        </div>
      </div>
    </footer>
  );
}
