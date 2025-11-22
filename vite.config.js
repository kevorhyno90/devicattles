import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: true,
    allowedHosts: true
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Cross-Origin-Embedder-Policy': 'unsafe-none'
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React
          'vendor-react': ['react', 'react-dom'],
          // Firebase (if large)
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          // Auth & Core libs
          'lib-core': ['./src/lib/auth.js', './src/lib/storage.js', './src/lib/analytics.js'],
          // Export/Import utilities
          'lib-export': ['./src/lib/exportImport.js', './src/lib/backup.js'],
          // Notification system
          'lib-notifications': ['./src/lib/notifications.js', './src/lib/autoNotifications.js'],
          // Module integration
          'lib-integration': ['./src/lib/moduleIntegration.js', './src/lib/sync.js'],
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  publicDir: 'public'
})
