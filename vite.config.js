import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  // Set the base path for deployment to a subdirectory (GitHub Pages)
  // For Vercel, use root path
  base: '/', 

  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Let the plugin automatically handle the scope based on the 'base' config
      // This ensures the service worker controls the correct path
      includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png', 'icons/icon-192.svg', 'icons/icon-512.svg'],
      manifest: {
        name: 'Devins Farm',
        short_name: 'DevinsFarm',
        description: 'A modern, offline-first farm management application.',
        theme_color: '#ffffff',
        display: 'standalone',
        // The start_url will be automatically prefixed with the 'base' path
        icons: [
          {
            src: 'icons/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: 'icons/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
          {
            src: 'icons/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
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