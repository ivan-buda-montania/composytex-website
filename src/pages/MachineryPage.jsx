import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { machineryCards } from '../data/products';
import ServiceCard from '../components/ServiceCard';
import SearchBar from '../components/SearchBar';

export default function MachineryPage() {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState('all');

  const TAGS = [
    { id: 'all', label: t('filterTags.all') },
    { id: 'pharma', label: t('filterTags.pharmaceutical') },
    { id: 'food', label: t('filterTags.food') },
    { id: 'lab', label: t('filterTags.laboratory') },
    { id: 'industry', label: t('filterTags.industrial') },
  ];

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return machineryCards.filter(card => {
      const matchesQuery = !q || card.searchTerms.includes(q) || card.name.toLowerCase().includes(q);
      const matchesTag = activeTag === 'all' || card.tags.includes(activeTag);
      return matchesQuery && matchesTag;
    });
  }, [query, activeTag]);

  return (
    <>
      <div className="page-hero" style={{ backgroundImage: "url('/assets/composytex-wallpaper2.jpg')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
        <div className="hero-overlay"></div>
        <div className="hero-inner">
          <div className="breadcrumb">
            <Link to="/">{t('breadcrumb.home')}</Link>
            <i className="fas fa-chevron-right" style={{ fontSize: '0.65rem' }}></i>
            <span>{t('nav.machinery')}</span>
          </div>
          <div className="hero-badge"><i className="fas fa-cog"></i> {t('pages.machinery.badge')}</div>
          <h1>{t('pages.machinery.title')} <span className="accent">{t('pages.machinery.titleAccent')}</span></h1>
          <p>{t('pages.machinery.description')}</p>
        </div>
      </div>

      <SearchBar
        query={query}
        onQuery={setQuery}
        activeTag={activeTag}
        onTag={setActiveTag}
        count={filtered.length}
        tags={TAGS}
        placeholder={t('searchPlaceholders.machinery')}
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
