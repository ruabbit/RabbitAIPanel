import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode || 'production', process.cwd(), '')
  const envJson = {
    VITE_API_BASE: env.VITE_API_BASE || '',
    VITE_DEBUG: env.VITE_DEBUG || '',
    MODE: mode || '',
  }

  const healthz = {
    name: 'healthz-endpoint',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/healthz') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            env: envJson,
            dev: true,
            prod: false,
            time: new Date().toISOString(),
          }))
          return
        }
        next()
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/healthz') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            env: envJson,
            dev: false,
            prod: true,
            time: new Date().toISOString(),
          }))
          return
        }
        next()
      })
    },
  }

  return {
    plugins: [react(), healthz],
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        // optional: you can uncomment to proxy API during dev
        // '/v1': 'http://localhost:8000',
        // '/auth': 'http://localhost:8000',
      },
    },
  }
})
