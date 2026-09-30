import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { products, PHONE, EMAIL } from '../data/products';

// Map product IDs to translation keys
const PRODUCT_TRANSLATION_MAP = {
  'fillers': 'peristalticFillers',
  'reactors': 'reactors',
  'capping-sealing': 'cappingSealing',
  'quality-control': 'qualityControl',
  'food-freeze-dryer': 'foodFreezeDryer',
  'pharma-freeze-dryer': 'pharmaFreezeDryer',
  'vial-filling-capping': 'vialFillingCapping',
  'conveyor-belts': 'conveyorBelts',
  'co2-incubators': 'co2Incubators',
  'peristaltic-fillers': 'peristalticFillers',
  'suction-hoses': 'suctionHoses',
  'polyurethane-tubing': 'polyurethaneTubing',
  'flexible-pvc': 'pvcPolyethylene',
  'nylon-tubing': 'nylonTubing',
  'dental-hoses': 'dentalHoses',
  'pneumatic-hoses': 'pneumaticHoses',
};

export default function ProductDetailPage() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const product = products[id];

  // Get translated product name and lead
  const translationKey = PRODUCT_TRANSLATION_MAP[id];
  const translatedName = translationKey ? t(`productDescriptions.${translationKey}.name`) : product?.name;
  const translatedDesc = translationKey ? t(`productDescriptions.${translationKey}.desc`) : product?.lead;

  useEffect(() => {
    if (product) {
      document.title = `${product.name} · Composytex`;
    } else {
      document.title = 'Product Not Found · Composytex';
    }
    return () => { document.title = 'Composytex · Pharmaceutical Engineering'; };
  }, [product]);

  if (!product) {
    return (
      <div style={{ textAlign: 'center', padding: '8rem 2rem' }}>
        <i className="fas fa-box-open" style={{ fontSize: '4rem', color: '#c8dde9', marginBottom: '1.5rem', display: 'block' }}></i>
        <h2 style={{ fontSize: '2rem', color: 'var(--navy)', marginBottom: '0.8rem' }}>{t('productDetail.notFound')}</h2>
        <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>{t('productDetail.notFoundMsg')}</p>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--blue)', color: '#fff', fontWeight: 700, padding: '0.8rem 1.8rem', borderRadius: 50, textDecoration: 'none' }}>
          <i className="fas fa-arrow-left"></i> {t('breadcrumb.back')}
        </Link>
      </div>
    );
  }

  const isMaterial = product.category.includes('Materials');
  const productPageUrl = `${window.location.origin}/products?id=${id}`;
  const waMessage = t('productDetail.waMessage').replace('{product}', translatedName) + `\n\n${t('productDetail.waProductPage')} ${productPageUrl}`;
  const waText = encodeURIComponent(waMessage);
  const waLink = `https://wa.me/${PHONE}?text=${waText}`;
  const mailSub = encodeURIComponent(t('productDetail.emailSubject').replace('{product}', translatedName));
  const mailBody = encodeURIComponent(t('productDetail.emailBody').replace('{product}', translatedName));

  return (
    <>
      {/* Breadcrumb */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.2rem 3rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
        <Link to="/" style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: 600 }}>{t('breadcrumb.home')}</Link>
        <i className="fas fa-chevron-right" style={{ fontSize: '0.7rem', color: '#9ab5cc' }}></i>
        <Link to={isMaterial ? '/materials' : '/machinery'} style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: 600 }}>{product.category}</Link>
        <i className="fas fa-chevron-right" style={{ fontSize: '0.7rem', color: '#9ab5cc' }}></i>
        <span>{translatedName}</span>
      </div>

      {/* Product Hero */}
      <div style={{ background: '#fff', borderBottom: '1px solid #dce9f4' }}>
        <div className="product-hero-grid">
          <div style={{ width: 90, height: 90, background: 'linear-gradient(135deg, var(--blue), #0096d6)', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '2.4rem', boxShadow: '0 12px 32px rgba(0,119,182,0.3)', flexShrink: 0 }}>
            <i className={product.icon}></i>
          </div>
          <div>
            <span style={{ display: 'inline-block', color: 'var(--blue)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{product.category}</span>
            <h1 style={{ fontSize: '2.6rem', fontWeight: 900, letterSpacing: -1, lineHeight: 1.15, marginBottom: '0.8rem', color: 'var(--navy)' }}>{translatedName}</h1>
            <p style={{ fontSize: '1.1rem', color: 'var(--muted)', maxWidth: 650, lineHeight: 1.7, marginBottom: '1.2rem' }}>{translatedDesc}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {product.tags.map(([cls, label]) => (
                <span key={cls} className={`app-tag ${cls}`}>{label}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Product Image Section */}
      {id === 'co2-incubators' && (
        <div style={{ background: '#f4f9fe', padding: '2rem 3rem', borderTop: '1px solid #dce9f4', borderBottom: '1px solid #dce9f4' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <img
              src="https://drive.google.com/thumbnail?id=14IDzHfj45bozlMDGiBhuot34Tf8sIau2&sz=w1000"
              alt="CO2 Incubator"
              style={{
                width: '100%',
                maxWidth: 700,
                height: 'auto',
                borderRadius: 20,
                boxShadow: '0 8px 32px rgba(0,119,182,0.15)',
                display: 'block',
                margin: '0 auto',
                animation: 'slideUp 0.8s ease-out'
              }}
            />
          </div>
        </div>
      )}

      {/* Body */}
      <div className="product-body-grid">
        {/* Left: details */}
        <div>
          {/* Overview */}
          <div style={{ background: '#fff', border: '1px solid #dce9f4', borderRadius: 20, padding: '2rem 2.2rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--navy)', marginBottom: '1.2rem', paddingBottom: '0.6rem', borderBottom: '2px solid #e4eff8', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <i className="fas fa-align-left" style={{ color: 'var(--blue)', fontSize: '1rem' }}></i> {t('productDetail.overview')}
            </h2>
            <div style={{ color: '#2e4a5f', lineHeight: 1.8, fontSize: '0.97rem' }} dangerouslySetInnerHTML={{ __html: product.description }} />
          </div>

          {/* Features */}
          <div style={{ background: '#fff', border: '1px solid #dce9f4', borderRadius: 20, padding: '2rem 2.2rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--navy)', marginBottom: '1.2rem', paddingBottom: '0.6rem', borderBottom: '2px solid #e4eff8', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <i className="fas fa-check-circle" style={{ color: 'var(--blue)', fontSize: '1rem' }}></i> {t('productDetail.features')}
            </h2>
            <ul style={{ listStyle: 'none', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem 0.5rem' }}>
              {product.features.map((f, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.9rem', color: '#2e4a5f', lineHeight: 1.5 }}>
                  <i className="fas fa-check-circle" style={{ color: 'var(--blue)', marginTop: '0.2rem', flexShrink: 0, fontSize: '0.85rem' }}></i>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Specs */}
          <div style={{ background: '#fff', border: '1px solid #dce9f4', borderRadius: 20, padding: '2rem 2.2rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--navy)', marginBottom: '1.2rem', paddingBottom: '0.6rem', borderBottom: '2px solid #e4eff8', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <i className="fas fa-table" style={{ color: 'var(--blue)', fontSize: '1rem' }}></i> {t('productDetail.specifications')}
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {product.specs.map(([k, v], i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e8f0f8' }}>
                    <td style={{ padding: '0.7rem 0.4rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--muted)', width: '40%' }}>{k}</td>
                    <td style={{ padding: '0.7rem 0.4rem', fontSize: '0.9rem', color: 'var(--navy)' }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: sticky CTA */}
        <div className="product-cta-col">
          <div style={{ background: '#fff', border: '1px solid #dce9f4', borderRadius: 20, padding: '2rem', boxShadow: '0 8px 32px rgba(0,40,80,0.07)', marginBottom: '1.2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy)', marginBottom: '0.5rem' }}>{t('productDetail.interested')}</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>{t('productDetail.description')}</p>

            <a href={waLink} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.7rem', background: '#25d366', color: '#fff', fontWeight: 700, fontSize: '1rem', padding: '0.9rem 1.5rem', borderRadius: 14, textDecoration: 'none', boxShadow: '0 6px 20px rgba(37,211,102,0.35)', marginBottom: '0.8rem' }}>
              <i className="fab fa-whatsapp" style={{ fontSize: '1.3rem' }}></i>
              {t('productDetail.askWhatsapp')}
            </a>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', margin: '0.8rem 0', color: 'var(--muted)', fontSize: '0.8rem', fontWeight: 600 }}>
              <div style={{ flex: 1, height: 1, background: '#dce9f4' }}></div>
              {t('common.or')}
              <div style={{ flex: 1, height: 1, background: '#dce9f4' }}></div>
            </div>

            <a href={`mailto:${EMAIL}?subject=${mailSub}&body=${mailBody}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.7rem', background: '#f0f7ff', border: '1.5px solid #c8dff0', color: 'var(--navy)', fontWeight: 700, fontSize: '0.95rem', padding: '0.85rem 1.5rem', borderRadius: 14, textDecoration: 'none' }}>
              <i className="fas fa-envelope"></i>
              {t('productDetail.sendEmail')}
            </a>
          </div>

          <div style={{ background: '#f4f9fe', border: '1px solid #dce9f4', borderRadius: 14, padding: '1.2rem 1.4rem' }}>
            {[
              ['fas fa-clock', t('productDetail.responseWithin')],
              ['fas fa-phone', t('common.phone')],
              ['fas fa-map-marker-alt', t('common.location')],
              ['fas fa-truck', t('common.delivery')],
            ].map(([icon, text]) => (
              <p key={text} style={{ fontSize: '0.82rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem', fontWeight: 500 }}>
                <i className={icon} style={{ color: 'var(--blue)', width: 16, flexShrink: 0 }}></i>
                {text}
              </p>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
