import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Pulse.Api's "http" launch profile (see src/Pulse.Api/Properties/launchSettings.json).
const apiDevOrigin = 'http://localhost:5059'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
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
})
