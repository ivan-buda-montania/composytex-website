import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { createReadStream, existsSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import process from 'node:process'

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

export default defineConfig({
  plugins: [react(), tailwindcss(), seedData()],
})
