import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

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

export default function ServiceCard({ id, icon, name, desc, tags, code }) {
  const { t } = useLanguage();

  // Get translated name and description if available
  const translationKey = PRODUCT_TRANSLATION_MAP[id];
  const translatedName = translationKey ? t(`productDescriptions.${translationKey}.name`) : name;
  const translatedDesc = translationKey ? t(`productDescriptions.${translationKey}.desc`) : desc;

  const TAG_LABELS = {
    pharma: t('filterTags.pharmaceutical'),
    food: t('filterTags.food'),
    lab: t('filterTags.laboratory'),
    industry: t('filterTags.industrial'),
    dental: t('filterTags.dental'),
  };
  return (
    <Link to={`/products?id=${id}`} className="service-card">
      <div className="card-icon">
        <i className={icon}></i>
      </div>
      {code && <span className="code-badge">{code}</span>}
      <h3>{translatedName}</h3>
      <p>{translatedDesc}</p>
      <div className="app-tags">
        {tags.map(tag => (
          <span key={tag} className={`app-tag ${tag}`}>{TAG_LABELS[tag]}</span>
        ))}
      </div>
      <span className="card-cta">
        {t('common.viewDetails')} <i className="fas fa-arrow-right"></i>
      </span>
    </Link>
  );
}
