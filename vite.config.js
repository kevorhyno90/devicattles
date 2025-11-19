import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Listen on all addresses
    port: 5173,
    strictPort: true,
    hmr: {
      protocol: 'wss',
      host: 'probable-space-waffle-g7gvrj9wx6f64p-5173.app.github.dev',
      clientPort: 443
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  publicDir: 'public'
})
