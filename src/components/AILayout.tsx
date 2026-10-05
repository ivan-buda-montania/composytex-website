import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { MARKDOWN_PAGES, SITE_URL } from '../lib/site';
import SchemaInjector from './SchemaInjector';

interface Crumb {
  name: string;
  path: string;
}

interface AILayoutProps {
  /** Omit when the page sets its own title. */
  title?: string;
  description?: string;
  /** Canonical path, e.g. '/machinery'. */
  path?: string;
  breadcrumbs?: Crumb[];
  schema?: { type: string; data: Record<string, unknown> }[];
  children: ReactNode;
}

// One <main><article><section> per page and nothing else around the content, so scrapers
// that extract the main landmark get the page and not the navbar or footer.
export default function AILayout({ title, description, path, breadcrumbs, schema = [], children }: AILayoutProps) {
  const url = path === undefined ? undefined : `${SITE_URL}${path === '/' ? '' : path}`;
  // Only advertise real text/markdown files; ?format=md is an HTML page that needs JavaScript.
  const markdown = path === undefined ? undefined : MARKDOWN_PAGES[path];

  return (
    <main>
      {/* React 19 hoists these into <head> */}
      {title && <title>{title}</title>}
      {description && <meta name="description" content={description} />}
      {url && <link rel="canonical" href={url} />}
      {markdown && <link rel="alternate" type="text/markdown" href={`${SITE_URL}/md/${markdown}.md`} />}

      {schema.map(({ type, data }) => <SchemaInjector key={type} type={type} data={data} />)}
      {breadcrumbs && (
        <>
          <SchemaInjector
            type="BreadcrumbList"
            data={{
              itemListElement: breadcrumbs.map((crumb, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                name: crumb.name,
                item: `${SITE_URL}${crumb.path}`,
              })),
            }}
          />
          <nav aria-label="Breadcrumb">
            <ol style={{ display: 'flex', gap: '0.5rem', listStyle: 'none', padding: '1rem 3rem', margin: 0 }}>
              {breadcrumbs.map(crumb => (
                <li key={crumb.path}><Link to={crumb.path}>{crumb.name}</Link></li>
              ))}
            </ol>
          </nav>
        </>
      )}

      <article>
        <section>{children}</section>
      </article>
    </main>
  );
}
