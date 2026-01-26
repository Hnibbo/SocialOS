import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import { compression } from 'vite-plugin-compression2';

export default defineConfig({
  plugins: [
    react(),
    compression({
      include: [/\.js$/, /\.css$/, /\.html$/, /\.json$/],
      algorithm: 'gzip',
      threshold: 1024,
    }),
    compression({
      include: [/\.js$/, /\.css$/, /\.html$/, /\.json$/],
      algorithm: 'brotliCompress',
      threshold: 1024,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'SocialOS',
        short_name: 'SocialOS',
        description: 'Your personal social operating system',
        theme_color: '#1e1b4b',
        background_color: '#030712',
        display: 'standalone',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  build: {
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['framer-motion', 'lucide-react', 'recharts'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-tanstack': ['@tanstack/react-query'],
          'vendor-map': ['maplibre-gl'],
          'vendor-livekit': ['livekit-client']
        },
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      },
    },
    chunkSizeWarningLimit: 500,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'lucide-react',
      'recharts',
      '@supabase/supabase-js',
      '@tanstack/react-query'
    ],
    exclude: ['maplibre-gl', 'livekit-client']
  },
  server: {
    port: 5173,
    open: true,
    cors: true
  },
  preview: {
    port: 4173,
    open: true
  }
});