import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { createReadStream, existsSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import process from 'node:process'
import { buildMarkdown } from './src/lib/markdown.ts'
import { MARKDOWN_PAGES } from './src/lib/site.ts'
import { translations } from './src/data/translations.js'

// The local stack points this at .local-stack/ so admin edits show up on the site.
const DATA_DIR = process.env.LOCAL_STACK_DIR || join(import.meta.dirname, 'seed')
const MIME = { '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }

// In development, serve /data/* and /media/* from disk (in production they live in S3).
function seedData() {
  return {
    name: 'seed-data',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = normalize(decodeURIComponent(req.url.split('?')[0]))
        if (!/^\/(data|media)\//.test(path)) return next()
        const file = join(DATA_DIR, path)
        if (!existsSync(file)) return next()
        res.setHeader('Content-Type', MIME[extname(file)] || 'application/octet-stream')
        createReadStream(file).pipe(res)
      })
    },
  }
}

// Emits /md/*.md for the pages that CloudFront serves to `Accept: text/markdown` requests.
// Products are not baked in (the catalog is edited from /admin); the files link to the live catalog JSON.
function markdownPages() {
  const t = (key) => key.split('.').reduce((value, k) => value?.[k], translations.en) ?? key
  const render = (pathname) => buildMarkdown({ pathname, t }) + '\n'

  // Same negotiation as the CloudFront function, so `curl -H 'Accept: text/markdown'` works locally.
  const negotiate = (req, res, next) => {
    const pathname = req.url.split('?')[0].replace(/\/$/, '') || '/'
    if (!req.headers.accept?.includes('text/markdown') || !MARKDOWN_PAGES[pathname]) return next()
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
    res.end(render(pathname))
  }

  return {
    name: 'markdown-pages',
    configureServer(server) {
      server.middlewares.use(negotiate)
    },
    configurePreviewServer(server) {
      server.middlewares.use(negotiate)
    },
    generateBundle() {
      for (const [pathname, name] of Object.entries(MARKDOWN_PAGES)) {
        this.emitFile({ type: 'asset', fileName: `md/${name}.md`, source: render(pathname) })
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), seedData(), markdownPages()],
})
