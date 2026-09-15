import { test, expect } from '@playwright/test'
import { loginAsTestUser } from '../helpers/auth'

// tests/dashboard-users.spec.ts

test.beforeEach(async ({ page }) => {
  await loginAsTestUser(page)
  await page.getByText('Equipo', { exact: true }).first().click()
  await expect(page.locator('.hd-title')).toHaveText('Equipo')
})

test('muestra la sección de roles y permisos, con la tarjeta de Owner', async ({ page }) => {
  await expect(page.getByText('Roles y permisos')).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('Owner', { exact: true }).first()).toBeVisible()
})