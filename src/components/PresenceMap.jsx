import { useState } from 'react';
import { useLanguage } from '../context/languageContext';
import { MAP_WIDTH, MAP_HEIGHT, MAP_COUNTRIES, MAP_MARKERS } from '../data/presenceMap';

// The Americas north to south, so the list reads in the same order as the map, then Spain.
const COUNTRY_KEYS = ['canada', 'usa', 'mexico', 'colombia', 'brazil', 'chile', 'spain'];
const HQ_KEY = 'mexico';

export default function PresenceMap() {
  const { t } = useLanguage();
  const [active, setActive] = useState(null);

  return (
    <div className="presence-grid">
      <div className="presence-map-wrap">
        <svg
          className="presence-map"
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          role="img"
          aria-label={t('globalPresence.mapLabel')}
        >
          {/* Fade out the left and right edges, where Asia, Europe and Africa are cut off by the frame */}
          <defs>
            <linearGradient id="presence-fade-x">
              <stop offset="0" stopColor="#000" />
              <stop offset="0.04" stopColor="#fff" />
              <stop offset="0.93" stopColor="#fff" />
              <stop offset="1" stopColor="#000" />
            </linearGradient>
            <mask id="presence-fade" maskUnits="userSpaceOnUse" x="0" y="0" width={MAP_WIDTH} height={MAP_HEIGHT}>
              <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#presence-fade-x)" />
            </mask>
          </defs>
          <g mask="url(#presence-fade)">
            {MAP_COUNTRIES.map(({ key, d }, i) => (
              <path
                key={key || i}
                d={d}
                className={key ? `served${active === key ? ' active' : ''}` : undefined}
                onMouseEnter={key ? () => setActive(key) : undefined}
                onMouseLeave={key ? () => setActive(null) : undefined}
              />
            ))}
          </g>
          {COUNTRY_KEYS.map(key => {
            const [x, y] = MAP_MARKERS[key];
            return (
              <g key={key} className="presence-marker" transform={`translate(${x} ${y})`}>
                {key === HQ_KEY && <circle className="presence-pulse" r="7" />}
                <circle r={key === HQ_KEY ? 7 : 5} />
              </g>
            );
          })}
        </svg>
      </div>

      <ul className="presence-list">
        {COUNTRY_KEYS.map(key => (
          <li
            key={key}
            className={active === key ? 'active' : undefined}
            onMouseEnter={() => setActive(key)}
            onMouseLeave={() => setActive(null)}
          >
            <span className="presence-dot"></span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--navy)', lineHeight: 1.3 }}>{t(`globalPresence.${key}.country`)}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--blue)', fontWeight: 600, letterSpacing: '0.5px' }}>{t(`globalPresence.${key}.region`)}</div>
            </div>
            {key === HQ_KEY && <span className="presence-hq">{t('globalPresence.hq')}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
