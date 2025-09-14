import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

function writeEnvFileIfEnabled() {
  try {
    const shouldWrite = process.env.WRITE_ENV_FILE === '1' || process.env.WRITE_ENV_FILE === 'true'
    if (!shouldWrite) return
    const cwd = process.cwd()
    const envPath = path.join(cwd, '.env')

    if (fs.existsSync(envPath)) {
      console.log('[writeenv] .env already exists, skip writing.')
      return
    }

    // Synthesize .env strictly from current process env (no bak copy)
    const lines = []
    const base = process.env.VITE_API_BASE
    const debug = process.env.VITE_DEBUG
    lines.push(`VITE_API_BASE=${base ?? ''}`)
    if (debug !== undefined) lines.push(`VITE_DEBUG=${debug}`)
    fs.writeFileSync(envPath, lines.join('\n') + '\n', 'utf8')
    console.log('[writeenv] Created .env (no bak copy). Keys:', lines.map(l => l.split('=')[0]).join(', '))
  } catch (e) {
    console.warn('[writeenv] Failed to write .env:', e)
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Write .env file on startup if explicitly enabled via env
  writeEnvFileIfEnabled()

  return {
    plugins: [react()],
    define: {},
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
