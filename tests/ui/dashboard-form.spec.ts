import { test, expect } from '@playwright/test'
import { loginAsTestUser } from '../helpers/auth'

// tests/dashboard-form.spec.ts

test.beforeEach(async ({ page }) => {
  await loginAsTestUser(page)
  await page.getByText('Formulario', { exact: true }).first().click()
  await expect(page.locator('.hd-title')).toHaveText('Formulario')
})

test('muestra los campos fijos, opcionales y personalizados', async ({ page }) => {
  await expect(page.getByText('Campos fijos')).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('Nombre completo').first()).toBeVisible()
  await expect(page.getByText('Campos opcionales')).toBeVisible()
  await expect(page.getByText('Campos personalizados', { exact: true })).toBeVisible()
})

test('muestra la sección de compartir el formulario', async ({ page }) => {
  await expect(page.getByText('Compartir')).toBeVisible({ timeout: 10000 })
})