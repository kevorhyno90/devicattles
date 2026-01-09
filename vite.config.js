import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer'

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
    visualizer({ filename: 'dist/bundle-report.html', open: false }),
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
    // Disable HMR in Codespaces to avoid WebSocket connection errors
    // Use `DEV_PERSISTENT=1 npm run dev` to enable a more persistent dev mode
    hmr: false,
    fs: {
      strict: true
    },
    watch: {
      // Reduce resource usage to avoid Codespaces restarts
      usePolling: false,
      interval: 300,
      ignored: (function() {
        const base = [
          '**/node_modules/**',
          '**/.git/**',
          '**/dist/**',
          '**/.vite/**',
          'assets/**',
          'attached_assets/**',
          'public/assets/**',
          // Ignore generated public files (service worker, manifest, preview helpers)
          'public/firebase-messaging-sw.js',
          'public/manifest.webmanifest',
          'public/*.html',
          'public/workers/**',
          'public/icons/**',
          '**/*.log',
          '**/*.tmp',
          '**/*.swp',
          '.vscode/**'
        ]
        const persistent = process.env.DEV_PERSISTENT === '1' || process.env.DEV_PERSISTENT === 'true'
        if (persistent) {
          // In persistent dev mode, ignore lib and heavy component folders to avoid automatic restarts
          base.push('src/lib/**')
          base.push('src/components/**')
          base.push('src/main.jsx')
          base.push('index.html')
        }
        return base
      })()
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
        manualChunks: (id) => {
          if (!id) return
          if (id.includes('node_modules')) {
            if (id.includes('node_modules/docx')) return 'docx-lib'
            if (id.includes('node_modules/html2canvas')) return 'html2canvas-lib'
            if (id.includes('node_modules/jspdf') || id.includes('node_modules/jspdf-autotable')) return 'pdf-lib'
            if (id.includes('node_modules/xlsx') || id.includes('node_modules/sheetjs')) return 'xlsx-lib'
            if (id.includes('node_modules/firebase')) return 'firebase'
            if (id.includes('node_modules/chart.js') || id.includes('node_modules/react-chartjs-2')) return 'charts'
            if (id.includes('node_modules/papaparse')) return 'analytics-libs'
            if (id.includes('node_modules/zustand')) return 'state'
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'react-vendor'
            // default vendor fallback: split by package to avoid single huge vendor bundle
            try {
              const rel = id.split('node_modules/')[1]
              if (!rel) return 'vendor'
              const parts = rel.split('/')
              const pkg = parts[0].startsWith('@') ? parts.slice(0,2).join('_') : parts[0]
              return `vendor-${pkg}`
            } catch (e) {
              return 'vendor'
            }
          }
          // Keep app modules in their own chunk by filename
          if (id.includes('/src/lib/')) return 'lib'
          if (id.includes('/src/components/')) return 'components'
          return undefined
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