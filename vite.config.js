import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { createReadStream, existsSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'

const SEED_DIR = join(import.meta.dirname, 'seed')
const MIME = { '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }

// In development, serve /data/* and /media/* from ./seed (in production they live in S3).
function seedData() {
  return {
    name: 'seed-data',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = normalize(decodeURIComponent(req.url.split('?')[0]))
        if (!/^\/(data|media)\//.test(path)) return next()
        const file = join(SEED_DIR, path)
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
