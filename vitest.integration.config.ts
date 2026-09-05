import { defineConfig } from 'vitest/config';

// Never runs as part of `npm test`/git hooks -- opt-in only
// (`npm run test:integration`), and each test skips itself when its
// required API key/local server isn't present. See test/integration/README.md.
export default defineConfig({
  test: {
    include: ['test/integration/**/*.test.ts'],
    testTimeout: 30_000,
  },
});
