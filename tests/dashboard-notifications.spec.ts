import { test, expect } from '@playwright/test'
import { loginAsTestUser } from './helpers/auth'

// tests/dashboard-notifications.spec.ts

test.beforeEach(async ({ page }) => {
  await loginAsTestUser(page)
  await page.getByText('Notificaciones', { exact: true }).first().click()
  await expect(page.locator('.hd-title')).toHaveText('Notificaciones')
})

test('muestra el compositor de mensajes y las audiencias', async ({ page }) => {
  await expect(page.getByPlaceholder(/2x1 en café/i)).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('Todos los clientes', { exact: true })).toBeVisible()
  await expect(page.getByText('Cerca del premio', { exact: true })).toBeVisible()
})

test('sin nada programado, muestra el estado vacío de programadas', async ({ page }) => {
  await expect(page.getByText('No hay notificaciones programadas')).toBeVisible({ timeout: 10000 })
})