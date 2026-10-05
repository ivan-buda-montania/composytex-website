export const SITE_URL = 'https://composytex.com';
export const SITE_NAME = 'Composytex';

// Pages with a static Markdown twin at /md/{name}.md, emitted by the markdownPages plugin in vite.config.js.
// CloudFront serves them to `Accept: text/markdown`; keep the SpaRewriteFunction in infra/template.yaml in sync.
export const MARKDOWN_PAGES: Record<string, string> = { '/': 'index', '/machinery': 'machinery', '/materials': 'materials' };
