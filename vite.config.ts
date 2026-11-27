/// <reference types="vitest/config" />
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig, type ServerOptions } from 'vite'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// /api est relayé vers le backend : le navigateur ne voit qu'une origine.
// Le relais retire l'en-tête Origin : le CORS du backend n'autorise que les ports 5101 à 5111 et
// répondrait 403, alors que ces appels sont de même origine pour le navigateur.
const server: ServerOptions = {
  port: 5138,
  proxy: {
    '/api': {
      target: process.env.VITE_API_URL ?? 'http://localhost:8080',
      configure: (proxy) => {
        proxy.on('proxyReq', (request) => request.removeHeader('origin'))
      },
    },
  },
}

export default defineConfig({
  plugins: [react()],
  server,
  preview: server,
  test: {
    projects: [
      {
        // Chaque story devient un test : rendu, fonction play, contrôle d'accessibilité.
        extends: true,
        plugins: [storybookTest({ configDir: path.join(dirname, '.storybook') })],
        test: {
          name: 'storybook',
          testTimeout: 30_000,
          browser: { enabled: true, headless: true, provider: playwright({}), instances: [{ browser: 'chromium' }] },
        },
      },
    ],
  },
})
