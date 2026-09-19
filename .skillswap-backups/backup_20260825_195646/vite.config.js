import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Explicitly target older mobile browser versions for compatibility
    target: ['chrome80', 'safari13.1', 'ios13'],
    outDir: 'dist',
    sourcemap: false, // Prevent exposing raw source code in production builds
    rollupOptions: {
      output: {
        // Ensure proper chunking to prevent vendor bloat on mobile network connections
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth'],
        },
      },
    },
  },
  define: {
    // Avoid binding process.env directly in client code
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
});
