import { Page } from '@playwright/test'

// tests/helpers/auth.ts
//
// Login reutilizable para cualquier test que necesite entrar al dashboard.
// Usa la cuenta dedicada de test (ver .env.test) — nunca una cuenta real.

export async function loginAsTestUser(page: Page) {
  const email = process.env.TEST_USER_EMAIL
  const password = process.env.TEST_USER_PASSWORD

  if (!email || !password) {
    throw new Error(
      'Faltan TEST_USER_EMAIL / TEST_USER_PASSWORD — revisá que exista .env.test con las credenciales de la cuenta de test.'
    )
  }

  await page.goto('/login')
  await page.getByPlaceholder('tu@negocio.com').fill(email)
  await page.getByPlaceholder('••••••••').fill(password)
  await page.getByRole('button', { name: /Ingresar al dashboard/i }).click()

  await page.waitForURL('**/dashboard', { timeout: 15000 })

  // El dashboard tiene una carga inicial grande (trae equipo, tarjetas,
  // analíticas, clientes, notificaciones y premios de una vez) que puede
  // tardar varios segundos — esperamos a que termine ACÁ, una sola vez,
  // para que el resto de cada test no tenga que lidiar con este delay por
  // su cuenta.
  await page.getByText('Cargando...').first().waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {})
}