import { useEffect } from 'react';

interface SchemaInjectorProps {
  /** schema.org type, e.g. 'Organization', 'WebSite', 'Article'. */
  type: string;
  data: Record<string, unknown>;
}

// React 19 only hoists <title>, <meta> and <link>, so JSON-LD is appended to <head> by hand.
export default function SchemaInjector({ type, data }: SchemaInjectorProps) {
  // "<" is escaped so a value like "</script>" cannot close the tag early.
  const json = JSON.stringify({ '@context': 'https://schema.org', '@type': type, ...data }).replace(/</g, '\\u003c');

  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = json;
    document.head.appendChild(script);
    return () => script.remove();
  }, [json]);

  return null;
}
