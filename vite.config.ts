import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// NOTE: This project previously had TWO vite configs (vite.config.js and
// vite.config.ts). Vite only loads one of them (the .js file, silently
// ignoring this one), which meant `base: './'` below was never actually
// applied to builds. Merged into a single canonical config.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    target: ['chrome80', 'safari13.1', 'ios13'],
    outDir: 'dist',
    sourcemap: false, // don't expose raw source in production builds
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            return 'vendor';
          }
        }
      }
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
})
