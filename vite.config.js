import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createApiPlugin } from './src/api/vite-plugin.js';

export default defineConfig({
  plugins: [react(), createApiPlugin()],
});
