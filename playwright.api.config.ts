import { defineConfig, devices } from '@playwright/test'

// Tests de bout en bout contre le vrai backend (front + API + base).
// Prérequis : backend lancé et `npm run seed` exécuté. Voir README, section Tests.
const PORT = 5141
const API_URL = process.env.API_URL ?? 'http://localhost:8080'

export default defineConfig({
  testDir: './e2e-api',
  // Les tests partagent une base et règlent la simulation de pannes : ils s'exécutent un par un.
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    env: { VITE_API_URL: API_URL },
    reuseExistingServer: false,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
