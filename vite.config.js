import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  // Set the base path for deployment to a subdirectory (GitHub Pages)
  // For Vercel, use root path
  base: process.env.VERCEL ? '/' : '/devicattles/', 

  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Let the plugin automatically handle the scope based on the 'base' config
      // This ensures the service worker controls the correct path
      includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Devins Farm',
        short_name: 'DevinsFarm',
        description: 'A modern, offline-first farm management application.',
        theme_color: '#ffffff',
        display: 'standalone',
        // The start_url will be automatically prefixed with the 'base' path
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: true,
    allowedHosts: true,
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
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Core React - keep together
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react'
          }
          
          // Chart.js - only loaded when needed
          if (id.includes('node_modules/chart.js') || id.includes('node_modules/react-chartjs-2')) {
            return 'vendor-charts'
          }
          
          // Firebase - lazy load
          if (id.includes('node_modules/firebase') || id.includes('@firebase')) {
            return 'vendor-firebase'
          }
          
          // PDF Export - heavy, lazy load
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/jspdf-autotable')) {
            return 'vendor-pdf'
          }
          
          // DOCX - heavy, lazy load
          if (id.includes('node_modules/docx')) {
            return 'vendor-docx'
          }
          
          // Group heavy libraries
          if (id.includes('src/lib/pdfExport')) {
            return 'lib-pdf'
          }
          
          if (id.includes('src/lib/firebase') || id.includes('src/lib/firebaseAuth') || id.includes('src/lib/sync')) {
            return 'lib-firebase'
          }
          
          // Core utilities used everywhere
          if (id.includes('src/lib/auth') || id.includes('src/lib/storage') || id.includes('src/lib/analytics')) {
            return 'lib-core'
          }
          
          // Export/Import utilities
          if (id.includes('src/lib/exportImport') || id.includes('src/lib/backup')) {
            return 'lib-export'
          }
          
          // Notification system
          if (id.includes('src/lib/notifications') || id.includes('src/lib/autoNotifications')) {
            return 'lib-notifications'
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    // Minification settings
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    // Enable CSS code splitting
    cssCodeSplit: true
  },
  publicDir: 'public',
});
