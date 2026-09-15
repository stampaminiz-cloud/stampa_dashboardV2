import { test, expect } from '@playwright/test'
import { loginAsTestUser } from '../helpers/auth'

// tests/dashboard-analytics.spec.ts

test.beforeEach(async ({ page }) => {
  await loginAsTestUser(page)
  await page.getByText('Analítica', { exact: true }).first().click()
  await expect(page.locator('.hd-title')).toHaveText('Analítica')
})

test('sin clientes registrados, muestra el estado vacío con CTA al formulario', async ({ page }) => {
  await expect(page.getByText('Las métricas aparecen cuando tenés clientes')).toBeVisible({ timeout: 10000 })
  await expect(page.getByRole('button', { name: 'Ver formulario' })).toBeVisible()
})