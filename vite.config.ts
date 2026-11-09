import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0', // Allow LAN access
    proxy: {
      '/api': {
        target: 'http://localhost:4800',
        changeOrigin: true,
        ws: true,
      },
      '/preview': {
        target: 'http://localhost:4800',
        changeOrigin: true,
        ws: true,
      },
      '/mobi-ws': {
        target: 'ws://localhost:4800',
        ws: true,
      }
    }
  }
});
