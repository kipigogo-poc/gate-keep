import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

// SWC emits decorator metadata, which Nest DI needs and esbuild does not provide.
export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  resolve: { alias: { '@gatekeep/shared': new URL('../../packages/shared/src/index.ts', import.meta.url).pathname } },
  test: {
    globals: false,
    setupFiles: ['test/setup-env.ts'],
    testTimeout: 20_000,
    include: ['src/**/*.spec.ts', 'test/**/*.e2e-spec.ts'],
  },
});
