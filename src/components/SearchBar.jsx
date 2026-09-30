import { useLanguage } from '../context/LanguageContext';

export default function SearchBar({ query, onQuery, activeTag, onTag, count, tags, placeholder }) {
  const { t } = useLanguage();
  return (
    <div className="search-bar-wrap">
      <div className="search-inner">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder={placeholder || 'Search…'}
            value={query}
            onChange={e => onQuery(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="filter-tags">
          {tags.map(({ id, label }) => (
            <span
              key={id}
              className={`filter-tag${activeTag === id ? ' active' : ''}`}
              data-tag={id}
              onClick={() => onTag(id)}
            >
              {label}
            </span>
          ))}
        </div>
        <span className="results-count">{count} {count !== 1 ? t('common.products') : t('common.product')}</span>
      </div>
    </div>
  );
}
