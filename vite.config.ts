/// <reference types="vitest/config" />
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vite'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// /api est relayé vers le backend : le navigateur ne voit qu'une origine, pas de CORS à configurer.
const server = {
  port: 5138,
  proxy: { '/api': process.env.VITE_API_URL ?? 'http://localhost:8080' },
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
