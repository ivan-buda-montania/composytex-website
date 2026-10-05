import { Link } from 'react-router-dom';
import { useLanguage } from '../context/languageContext';
import { useCatalog } from '../context/catalogContext';
import ServiceCard from '../components/ServiceCard';
import PresenceMap from '../components/PresenceMap';
import { PHONE } from '../data/contact';

export default function HomePage() {
  const { t } = useLanguage();
  const { products } = useCatalog();
  return (
    <>
      {/* ── HERO ── */}
      <div className="hero" style={{ position: 'relative', minHeight: '88vh', display: 'flex', alignItems: 'center', background: "url('/assets/composytex-wallpaper1.jpg') center center / cover no-repeat", backgroundAttachment: 'fixed' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(120deg, rgba(3,28,46,0.82) 40%, rgba(0,90,140,0.55) 100%)' }}></div>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '5rem 3rem', display: 'flex', alignItems: 'center', gap: '4rem', width: '100%', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 480px', maxWidth: 620 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)', color: '#a8d8ff', fontSize: '0.82rem', fontWeight: 600, padding: '0.4rem 1rem', borderRadius: 50, letterSpacing: '0.5px', marginBottom: '1.4rem' }}>
              <i className="fas fa-certificate"></i> {t('hero.badge')}
            </div>
            <h1 style={{ fontSize: '3.8rem', fontWeight: 900, lineHeight: 1.12, letterSpacing: -2, color: '#fff', marginBottom: '1.2rem' }}>
              {t('hero.title')}<br /><span style={{ color: '#48cae4' }}>{t('hero.titleAccent')}</span>
            </h1>
            <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.8)', maxWidth: 500, marginBottom: '2rem', lineHeight: 1.7 }}>
              {t('hero.description')}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              <Link to="/machinery" className="btn-primary">
                <i className="fas fa-cog"></i> {t('hero.viewMachinery')}
              </Link>
              <Link to="/#contact" className="btn-ghost">
                <i className="fas fa-envelope"></i> {t('hero.contactUs')}
              </Link>
            </div>
          </div>

          <div className="hero-stats-grid">
            {[['25+', 'yearsExperience'], ['200+', 'projectsCompleted'], ['24h', 'responseTime']].map(([num, labelKey]) => (
              <div key={labelKey} className="stat-box">
                <div className="stat-box-num">{num}</div>
                <div className="stat-box-label">{t(`hero.${labelKey}`)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── INDUSTRY STRIP ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e0eef7', padding: '1rem 3rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '2.5rem', overflowX: 'auto' }}>
        {[
          ['fas fa-tablets', 'pharmaceutical'],
          ['fas fa-cat', 'veterinary'],
          ['fas fa-eye', 'cosmetics'],
          ['fas fa-utensils', 'foodBeverage'],
          ['fas fa-dna', 'biotechnology'],
          ['fas fa-tooth', 'dental'],
        ].map(([icon, industryKey]) => (
          <span key={industryKey} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted)', fontWeight: 600, fontSize: '0.9rem' }}>
            <i className={icon} style={{ color: 'var(--blue)', fontSize: '1.1rem' }}></i> {t(`industries.${industryKey}`)}
          </span>
        ))}
      </div>

      {/* ── ABOUT ── */}
      <div id="about" style={{ background: '#fff', borderTop: '1px solid #e4eff8', borderBottom: '1px solid #e4eff8' }}>
        <div className="section grid-2col" style={{ alignItems: 'start' }}>
          <div className="about-text">
            <span className="section-label">{t('about.label')}</span>
            <h2 className="section-title">{t('about.title')}<br />{t('about.titleLine2')}</h2>
            <p className="section-sub">
              {t('about.description1')}
            </p>
            <p className="section-sub" style={{ marginTop: '1rem' }}>
              {t('about.description2')}
            </p>
          </div>
          <div className="grid-2col"  style={{ gap: '1rem' }}>
            {[
              ['fas fa-calendar-check', '25+', 'yearsInBusiness'],
              ['fas fa-cog', '200+', 'installations'],
              ['fas fa-certificate', 'GMP/FDA', 'certifiedSolutions'],
              ['fas fa-globe', 'USA, MX, CO', 'serviceCoverage'],
            ].map(([icon, num, labelKey]) => (
              <div key={labelKey} style={{ background: 'linear-gradient(135deg, #f0f7ff, #e6f2fa)', border: '1px solid #cde3f2', borderRadius: 18, padding: '1.4rem', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'transform 0.2s, box-shadow 0.2s' }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.1rem', flexShrink: 0 }}>
                  <i className={icon}></i>
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--navy)', lineHeight: 1 }}>{num}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 500 }}>{t(`about.${labelKey}`)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SERVICE LOCATIONS ── */}
      <div style={{ background: 'var(--bg)', padding: '3rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span className="section-label">{t('globalPresence.label')}</span>
            <h2 className="section-title">{t('globalPresence.title')}</h2>
          </div>
          <PresenceMap />
        </div>
      </div>

      {/* ── MACHINERY SECTION ── */}
      <div id="machinery" style={{ background: 'var(--bg)' }}>
        <div className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
            <div>
              <span className="section-label">{t('machinery.label')}</span>
              <h2 className="section-title">{t('machinery.title')}</h2>
              <p className="section-sub">{t('machinery.description')}</p>
            </div>
            <Link to="/machinery" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.2rem', border: '2px solid var(--blue)', borderRadius: 50, color: 'var(--blue)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', transition: 'background 0.2s, color 0.2s' }}>
              {t('common.viewAll')} <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
          <div className="cards-grid">
            {products.filter(p => p.section === 'machinery').map(product => (
              <ServiceCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>

      {/* ── MATERIALS SECTION ── */}
      <div id="materials" style={{ background: '#fff', borderTop: '1px solid #e4eff8' }}>
        <div className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
            <div>
              <span className="section-label">{t('materials.label')}</span>
              <h2 className="section-title">{t('materials.title')}</h2>
              <p className="section-sub">{t('materials.description')}</p>
            </div>
            <Link to="/materials" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.2rem', border: '2px solid var(--blue)', borderRadius: 50, color: 'var(--blue)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', transition: 'background 0.2s, color 0.2s' }}>
              {t('common.viewAll')} <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
          <div className="cards-grid">
            {products.filter(p => p.section === 'materials').map(product => (
              <ServiceCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA BANNER ── */}
      <div style={{ background: 'linear-gradient(120deg, #03283c 0%, #0b3a52 100%)', padding: '5rem 3rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.4rem', fontWeight: 900, color: '#fff', letterSpacing: -1, marginBottom: '1rem' }}>
          {t('cta.title')}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', maxWidth: 500, margin: '0 auto 2rem', lineHeight: 1.7 }}>
          {t('cta.description')}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <a href={`https://wa.me/${PHONE}?text=Hello%2C%20I%20need%20information%20about%20your%20products.`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', background: '#25d366', color: '#fff', fontWeight: 700, fontSize: '1rem', padding: '0.9rem 2.2rem', borderRadius: 50, textDecoration: 'none', boxShadow: '0 8px 24px rgba(37,211,102,0.4)' }}>
            <i className="fab fa-whatsapp"></i> WhatsApp
          </a>
          <a href="mailto:composytex@gmail.com" className="btn-ghost">
            <i className="fas fa-envelope"></i> Send Email
          </a>
        </div>
      </div>

      {/* ── CONTACT ── */}
      <div id="contact" style={{ background: '#fff', borderTop: '1px solid #e4eff8' }}>
        <div className="section contact-grid">
          <div>
            <span className="section-label">{t('contact.label')}</span>
            <h2 className="section-title">{t('contact.title')}</h2>
            <p className="section-sub" style={{ marginBottom: '2rem' }}>{t('contact.description')}</p>
            {[
              ['fas fa-phone-alt', '+52 56 6468 1475', `tel:+${PHONE}`],
              ['fab fa-whatsapp', 'WhatsApp', `https://wa.me/${PHONE}`],
              ['fas fa-envelope', 'composytex@gmail.com', 'mailto:composytex@gmail.com'],
              ['fas fa-map-marker-alt', 'Iztapalapa, Mexico City', null],
            ].map(([icon, text, href]) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.2rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(0,119,182,0.08)', border: '1px solid rgba(0,119,182,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)', fontSize: '1.1rem', flexShrink: 0 }}>
                  <i className={icon}></i>
                </div>
                {href ? (
                  <a href={href} style={{ color: 'var(--navy)', textDecoration: 'none', fontWeight: 600 }}>{text}</a>
                ) : (
                  <span style={{ color: 'var(--navy)', fontWeight: 600 }}>{text}</span>
                )}
              </div>
            ))}
          </div>
          <div style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid #dce9f4', boxShadow: '0 8px 32px rgba(0,40,80,0.08)' }}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d60282.82271484948!2d-99.10295744863278!3d19.356819642960285!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d1fe872de9a74f%3A0x5e42fa12ee12e7e9!2sIztapalapa%2C%20Mexico%20City%2C%20CDMX!5e0!3m2!1sen!2smx!4v1700000000000!5m2!1sen!2smx"
              width="100%"
              height="360"
              style={{ border: 0, display: 'block' }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Composytex Location"
            ></iframe>
          </div>
        </div>
      </div>
    </>
  );
}
