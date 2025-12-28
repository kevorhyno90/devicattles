import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  // Set the base path for deployment to a subdirectory (GitHub Pages)
  // For Vercel, use root path
  base: '/',
  
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom'
    ],
    exclude: [
      '@vite-pwa/assets-generator',
      'chart.js',
      'react-chartjs-2',
      'zustand',
      'zustand/middleware'
    ],
    // Force optimization even on hard reload
    force: false
  },

  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      strategies: 'generateSW',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,json}'],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        // Offline-first caching strategies
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            urlPattern: /\.(?:js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          }
        ],
        navigateFallback: null, // Don't redirect to index for offline
      },
      devOptions: {
        enabled: false,
        type: 'module'
      },
      includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png', 'icons/*.svg', 'icons/*.png'],
      manifest: {
        name: 'Devins Farm',
        short_name: 'DevinsFarm',
        description: 'A modern, offline-first farm management application.',
        theme_color: '#10b981',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        orientation: 'portrait-primary',
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
    strictPort: false,
    allowedHosts: true,
    hmr: false, // Disable HMR in Codespaces to avoid WebSocket connection errors
    fs: {
      strict: true
    },
    watch: {
      // Reduce resource usage to avoid Codespaces restarts
      usePolling: false,
      interval: 300,
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/.vite/**',
        'assets/**',
        'attached_assets/**',
        'public/assets/**'
      ]
    }
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
    chunkSizeWarningLimit: 500, // Reduce from 1000 to catch large chunks earlier
    // Minification settings
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    },
    // Enable CSS code splitting
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Optimize asset inlining
    assetsInlineLimit: 4096, // Inline assets < 4kb
    // Manual chunk splitting for better caching and lazy loading
    rollupOptions: {
      output: {
        manualChunks: {
          // Core vendor chunks - keep small
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          // Separate heavy libraries - load on demand only
          'charts': ['chart.js', 'react-chartjs-2'],
          'firebase': ['firebase/app', 'firebase/firestore', 'firebase/auth', 'firebase/analytics', 'firebase/messaging'],
          'state': ['zustand'],
          // Very heavy libraries - must be separate
          'pdf-lib': ['jspdf', 'jspdf-autotable'],
          'docx-lib': ['docx'],
          'html2canvas-lib': ['html2canvas'],
          // Split components by feature for better granularity
          'analytics-libs': ['papaparse']
        },
        // Better chunk naming for debugging
        chunkFileNames: (chunkInfo) => {
          // Create descriptive names for module chunks
          const name = chunkInfo.name;
          if (name.includes('node_modules')) {
            return 'assets/vendor-[name]-[hash].js';
          }
          if (name.includes('modules')) {
            return 'assets/module-[name]-[hash].js';
          }
          if (name.includes('components')) {
            return 'assets/component-[name]-[hash].js';
          }
          return 'assets/[name]-[hash].js';
        }
      }
    },
    // Enable module preloading for faster hard reloads
    modulePreload: {
      polyfill: true,
      resolveDependencies: (filename, deps, { hostId, hostType }) => {
        // Only preload critical dependencies
        return deps.filter(dep => {
          // Preload only react and core routing
          return dep.includes('react') || dep.includes('router');
        });
      }
    },
    // Enable source map for better debugging (only in dev)
    sourcemap: false
  },
  publicDir: 'public',
});