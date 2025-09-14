import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // optional: you can uncomment to proxy API during dev
      // '/v1': 'http://localhost:8000',
      // '/auth': 'http://localhost:8000',
    },
  },
})
