/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// Pulse.Api's "http" launch profile (see src/Pulse.Api/Properties/launchSettings.json).
const apiDevOrigin = 'http://localhost:5059'

// https://vite.dev/config/
export default defineConfig({
  plugins: [TanStackRouterVite({ target: 'react', autoCodeSplitting: true }), react()],
  resolve: { alias: { '@': path.resolve(dirname, './src') } },
  server: {
    port: 5173,
    proxy: {
      // Same-origin relative URLs (/api/*, /hub/*) are used everywhere in the app so
      // it works unmodified behind Caddy in prod. In dev, forward those paths to the
      // locally running Pulse.Api process instead.
      '/api': {
        target: apiDevOrigin,
        changeOrigin: true,
      },
      '/hub': {
        target: apiDevOrigin,
        changeOrigin: true,
        ws: true,
      },
    },
  },
  test: { environment: 'jsdom', globals: true, setupFiles: ['./src/test/setup.ts'], css: false },
})
