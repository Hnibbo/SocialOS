import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    setupFiles: resolve(__dirname, '../src/test/setup.ts'),
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../src'),
    },
  },
});