import { test, expect } from '@playwright/test'

// tests/login.spec.ts
//
// Smoke test básico: la página de login carga con todo lo esperado, y
// muestra un error claro si las credenciales están mal (sin romper la
// página ni quedarse colgada).

test('la página de login muestra el formulario completo', async ({ page }) => {
  await page.goto('/login')

  await expect(page.getByText('Bienvenido de vuelta')).toBeVisible()
  await expect(page.getByPlaceholder('tu@negocio.com')).toBeVisible()
  await expect(page.getByPlaceholder('••••••••')).toBeVisible()
  await expect(page.getByRole('button', { name: /Ingresar al dashboard/i })).toBeVisible()
  await expect(page.getByText('¿Olvidaste tu contraseña?')).toBeVisible()
})

test('con credenciales inválidas muestra un mensaje de error en español', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder('tu@negocio.com').fill('noexiste@stampa-test.com')
  await page.getByPlaceholder('••••••••').fill('contraseña-incorrecta-123')
  await page.getByRole('button', { name: /Ingresar al dashboard/i }).click()

  await expect(page.getByText('Email o contraseña incorrectos')).toBeVisible({ timeout: 10000 })
})