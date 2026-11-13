import { test, expect } from '@playwright/test'

// tests/login.spec.ts
//
// Smoke test básico: la página de login carga con todo lo esperado, y
// muestra un error claro si las credenciales están mal (sin romper la
// página ni quedarse colgada).

test('la página de login muestra el formulario completo', async ({ page }) => {
  await page.goto('/login')

  await expect(page.getByRole('heading', { name: 'Ingresar' })).toBeVisible()
  await expect(page.getByPlaceholder('tu@negocio.com')).toBeVisible()
  await expect(page.getByPlaceholder('Tu contraseña')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Ingresar', exact: true })).toBeVisible()
  await expect(page.getByText('Olvidé mi contraseña')).toBeVisible()
})

test('con credenciales inválidas muestra un mensaje de error en español', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder('tu@negocio.com').fill('noexiste@stampa-test.com')
  await page.getByPlaceholder('Tu contraseña').fill('contraseña-incorrecta-123')
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click()

  await expect(page.getByText('Email o contraseña incorrectos')).toBeVisible({ timeout: 10000 })
})