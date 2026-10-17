import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') }
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules', 'dist', '**/*.d.ts', '**/*.config.*',
        'tests', 'src/main.ts', 'src/types/**'
      ],
      thresholds: { lines: 80, functions: 80, branches: 70, statements: 80 }
    }
  }
});