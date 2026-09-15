import { test, expect } from '@playwright/test'
import { loginAsTestUser } from '../helpers/auth'

// tests/dashboard-customers.spec.ts

test.beforeEach(async ({ page }) => {
  await loginAsTestUser(page)
  await page.getByText('Clientes', { exact: true }).first().click()
  await expect(page.locator('.hd-title')).toHaveText('Clientes')
})

test('sin clientes registrados, muestra el estado vacío con CTA al formulario', async ({ page }) => {
  await expect(page.getByText('Todavía no tenés clientes registrados')).toBeVisible({ timeout: 10000 })
  await expect(page.getByRole('button', { name: 'Ver formulario' })).toBeVisible()
})

test('el CTA del estado vacío lleva al tab de Formulario', async ({ page }) => {
  await page.getByRole('button', { name: 'Ver formulario' }).click()
  await expect(page.locator('.hd-title')).toHaveText('Formulario')
})