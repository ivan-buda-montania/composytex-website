import { useLanguage } from '../context/languageContext';
import { useCatalog } from '../context/catalogContext';
import { localize } from '../lib/catalog';
import { buildMarkdown, type MarkdownProduct } from '../lib/markdown';

// Unstyled Markdown rendering of the current page, shown instead of the site for ?format=md.
export default function MarkdownView({ pathname, productId }: { pathname: string; productId: string | null }) {
  const { t, lang } = useLanguage();
  const { status, products } = useCatalog();

  if (status === 'loading') return <pre>Loading…</pre>;

  const markdown = buildMarkdown({
    pathname,
    productId,
    t,
    products: products.map((p: object) => localize(p, lang) as MarkdownProduct),
  });
  return <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', margin: 0, padding: '1rem' }}>{markdown}</pre>;
}
