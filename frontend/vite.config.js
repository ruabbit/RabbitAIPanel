import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Allow passing flags via npm run: e.g. `npm run dev -- --write-env --debug`
  const argv = process.argv
  const define = {}
  if (argv.includes('--write-env')) {
    define['import.meta.env.VITE_WRITE_ENV_ON_START'] = JSON.stringify('1')
  }
  if (argv.includes('--debug')) {
    define['import.meta.env.VITE_DEBUG'] = JSON.stringify('1')
  }
  return {
    plugins: [react()],
    define,
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
