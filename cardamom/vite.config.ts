import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: { assetsInlineLimit: 0, chunkSizeWarningLimit: 2000 },
  server: { port: 5178 },
});
