import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

// SWC emits decorator metadata, which Nest DI needs and esbuild does not provide.
export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    globals: false,
    include: ['src/**/*.spec.ts', 'test/**/*.e2e-spec.ts'],
  },
});
