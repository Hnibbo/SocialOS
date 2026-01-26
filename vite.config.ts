import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";
import { VitePWA } from 'vite-plugin-pwa';
import { compression } from 'vite-plugin-compression2';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig(() => ({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    setupFiles: path.resolve(__dirname, './src/test/setup.ts'),
    environmentOptions: {
      jsdom: {
        resources: 'usable',
      },
    },
    define: {
      'process.env.NODE_ENV': '"development"',
    },
  },
  server: {
    host: "::",
    port: 8082,
    hmr: {
      clientPort: 8082,
    },
  },
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
      includeAssets: ['favicon.ico', 'logo.png', 'logo.svg'],
      manifest: {
        name: 'SocialOS',
        short_name: 'SocialOS',
        description: 'Your personal social operating system',
        theme_color: '#1e1b4b',
        background_color: '#030712',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'logo.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['framer-motion', 'lucide-react'],
          'vendor-charts': ['recharts'],
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
    chunkSizeWarningLimit: 300, // Reduced warning limit to encourage smaller chunks
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
}));
