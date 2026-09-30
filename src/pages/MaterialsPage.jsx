import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { materialsCards } from '../data/products';
import ServiceCard from '../components/ServiceCard';
import SearchBar from '../components/SearchBar';

export default function MaterialsPage() {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState('all');

  const TAGS = [
    { id: 'all', label: t('filterTags.all') },
    { id: 'pharma', label: t('filterTags.pharmaceutical') },
    { id: 'food', label: t('filterTags.food') },
    { id: 'lab', label: t('filterTags.laboratory') },
    { id: 'industry', label: t('filterTags.industrial') },
    { id: 'dental', label: t('filterTags.dental') },
  ];

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return materialsCards.filter(card => {
      const matchesQuery = !q || card.searchTerms.includes(q) || card.name.toLowerCase().includes(q);
      const matchesTag = activeTag === 'all' || card.tags.includes(activeTag);
      return matchesQuery && matchesTag;
    });
  }, [query, activeTag]);

  return (
    <>
      <div className="page-hero" style={{ backgroundImage: "url('/assets/composytex-wallpaper3.jpg')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
        <div className="hero-overlay" style={{ background: 'linear-gradient(160deg, rgba(3,28,46,0.78) 30%, rgba(0,70,60,0.60) 100%)' }}></div>
        <div className="hero-inner">
          <div className="breadcrumb">
            <Link to="/">{t('breadcrumb.home')}</Link>
            <i className="fas fa-chevron-right" style={{ fontSize: '0.65rem' }}></i>
            <span>{t('nav.materials')}</span>
          </div>
          <div className="hero-badge"><i className="fas fa-cubes"></i> {t('materials.label')} · {t('pages.materials.badge')}</div>
          <h1>{t('pages.materials.title')} <span className="accent">{t('pages.materials.titleAccent')}</span></h1>
          <p>{t('pages.materials.description')}</p>
        </div>
      </div>

      <div className="cert-banner">
        <div className="cert-item"><i className="fas fa-certificate"></i> {t('certifications.fda')}</div>
        <div className="cert-item"><i className="fas fa-certificate"></i> {t('certifications.iso')}</div>
        <div className="cert-item"><i className="fas fa-certificate"></i> {t('certifications.usp')}</div>
        <div className="cert-item"><i className="fas fa-leaf"></i> {t('certifications.virgin')}</div>
        <div className="cert-item"><i className="fas fa-truck"></i> {t('certifications.delivery')}</div>
      </div>

      <SearchBar
        query={query}
        onQuery={setQuery}
        activeTag={activeTag}
        onTag={setActiveTag}
        count={filtered.length}
        tags={TAGS}
        placeholder={t('searchPlaceholders.materials')}
      />

      <div className="products-wrap">
        <div className="cards-grid">
          {filtered.map(card => (
            <ServiceCard key={card.id} {...card} />
          ))}
          {filtered.length === 0 && (
            <div className="no-results">
              <i className="fas fa-search"></i>
              <h3>{t('noResults.title')}</h3>
              <p>{t('noResults.description')}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
