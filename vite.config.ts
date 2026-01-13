import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    hmr: {
      overlay: false,
      protocol: 'ws',
      timeout: 30000
    },
    watch: {
      usePolling: false,
      interval: 1000
    },
    // Disable strict port check
    strictPort: false,
    // Prevent multiple connections
    host: true
  },
  build: {
    // Reduce chunk warnings
    chunkSizeWarningLimit: 1000,
    // Better error handling
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        warn(warning);
      }
    }
  }
});
