import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': fileURLToPath(new URL('../shared', import.meta.url)),
      '@i18n': fileURLToPath(new URL('../i18n', import.meta.url)),
    },
  },
  server: {
    fs: {
      allow: ['..'],
    },
  },
});
