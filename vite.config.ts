import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
  },
  optimizeDeps: {
    exclude: ['@base-org/account'],
    esbuildOptions: {
      target: 'es2022',
      supported: {
        'import-assertions': true,
      },
    },
  },
  build: {
    target: 'es2022',
  },
  server: {
    headers: {
      'Content-Security-Policy': "script-src 'self' 'unsafe-eval' 'unsafe-inline'; object-src 'none';"
    }
  }
})
