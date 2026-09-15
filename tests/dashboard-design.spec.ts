import { test, expect } from '@playwright/test'
import { loginAsTestUser } from './helpers/auth'

// tests/dashboard-design.spec.ts

test.beforeEach(async ({ page }) => {
  await loginAsTestUser(page)
  await page.getByText('Diseño', { exact: true }).first().click()
  await expect(page.locator('.hd-title')).toHaveText('Diseño')
})

test('muestra la barra de plan y la tarjeta de sellos existente', async ({ page }) => {
  await expect(page.getByText(/tarjeta.* activa.* — Plan/i)).toBeVisible({ timeout: 10000 })
})