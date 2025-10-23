import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
    include: ['packages/**/__tests__/*.test.ts', 'packages/**/__tests__/*.test.tsx'],
  },
});
