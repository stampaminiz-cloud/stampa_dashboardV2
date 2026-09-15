import { test, expect } from '@playwright/test'
import { loginAsTestUser } from './helpers/auth'

// tests/dashboard-settings.spec.ts

test.beforeEach(async ({ page }) => {
  await loginAsTestUser(page)
  await page.getByText('Configuración', { exact: true }).first().click()
  await expect(page.locator('.hd-title')).toHaveText('Configuración')
})

test('muestra las secciones principales de Settings', async ({ page }) => {
  await expect(page.getByText('Perfil del negocio')).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('Reglas del programa')).toBeVisible()
  await expect(page.getByText('Mis alertas')).toBeVisible()
  await expect(page.getByText('Plan y facturación')).toBeVisible()
  await expect(page.getByText('Zona de peligro')).toBeVisible()
})