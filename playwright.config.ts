import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'

// playwright.config.ts
//
// Corre contra el frontend de STAGING por default — nunca contra producción.
// Para correr local, cambiá BASE_URL: BASE_URL=http://localhost:3000 npx playwright test
//
// Las credenciales de la cuenta de test viven en .env.test (no se sube a
// git) — cada persona que corra los tests necesita su propia copia con la
// contraseña real.

dotenv.config({ path: path.resolve(__dirname, '.env.test') })

const BASE_URL = process.env.BASE_URL || 'https://stampa-dashboard-staging.vercel.app'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'html',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})