import { test, expect } from '@playwright/test'
import { loginAsTestUser } from '../helpers/auth'

// tests/flow-design.spec.ts
//
// Flujo real: entra al editor de la tarjeta existente, cambia el color a
// un preset fijo, guarda, y confirma que persiste después de recargar.

test('cambiar el color de la tarjeta persiste después de guardar y recargar', async ({ page }) => {
  await loginAsTestUser(page)
  await page.getByText('Diseño', { exact: true }).first().click()
  await expect(page.locator('.hd-title')).toHaveText('Diseño')

  await page.getByText('Editar →').first().click()

  // "Terracota" como color fijo — idempotente, no importa cuál esté puesto antes.
  const terracotaSwatch = page.getByTitle('Terracota')
  await expect(terracotaSwatch).toBeVisible({ timeout: 10000 })
  await terracotaSwatch.click()

  await page.getByRole('button', { name: /^Guardar$/ }).click()
  await expect(page.getByRole('button', { name: /Guardado/ })).toBeVisible({ timeout: 10000 })

  await page.reload()
  await page.getByText('Diseño', { exact: true }).first().click()
  await page.getByText('Editar →').first().click()

  await expect(page.getByTitle('Terracota')).toHaveClass(/dt-color-dot--on/, { timeout: 10000 })
})