import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables from root workspace or frontend dir
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // Dynamic CDN mapping: Base assets path matches CDN URL in production
    base: env.VITE_CDN_URL || '/',
    plugins: [
      react(),
      viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
      }),
      viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
      }),
    ],
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Splitting node_modules packages
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
                return 'vendor-core';
              }
              if (id.includes('react-icons')) {
                return 'vendor-icons';
              }
              if (id.includes('@tanstack')) {
                return 'vendor-query';
              }
              if (id.includes('recharts')) {
                return 'vendor-charts';
              }
              if (id.includes('plyr')) {
                return 'vendor-player';
              }
              return 'vendor-libs';
            }
            // Splitting Admin dashboard pages
            if (id.includes('src/pages/Admin')) {
              return 'chunk-admin';
            }
            // Splitting Instructor dashboard pages
            if (id.includes('src/pages/Instructor')) {
              return 'chunk-instructor';
            }
          }
        }
      }
    }
  };
})
