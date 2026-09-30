import { Link } from 'react-router-dom';
import { useLanguage } from '../context/languageContext';
import { localize, TAG_KEYS } from '../lib/catalog';

export default function ServiceCard({ product }) {
  const { t, lang } = useLanguage();
  const { id, icon, name, desc, tags, code } = localize(product, lang);

  return (
    <Link to={`/products?id=${id}`} className="service-card">
      <div className="card-icon">
        <i className={icon}></i>
      </div>
      {code && <span className="code-badge">{code}</span>}
      <h3>{name}</h3>
      <p>{desc}</p>
      <div className="app-tags">
        {tags.map(tag => (
          <span key={tag} className={`app-tag ${tag}`}>{t(TAG_KEYS[tag])}</span>
        ))}
      </div>
      <span className="card-cta">
        {t('common.viewDetails')} <i className="fas fa-arrow-right"></i>
      </span>
    </Link>
  );
}
