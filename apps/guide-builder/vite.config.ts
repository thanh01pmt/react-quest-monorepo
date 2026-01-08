import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      '@repo/quest-player': path.resolve(__dirname, '../../packages/quest-player/src')
    }
  },
  server: {
    port: 3002,
    fs: {
      allow: ['../../']
    }
  }
});
