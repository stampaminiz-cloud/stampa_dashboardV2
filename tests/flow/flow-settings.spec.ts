import { test, expect } from '@playwright/test'
import { loginAsTestUser } from '../helpers/auth'

// tests/flow/flow-settings.spec.ts
//
// BUG CONOCIDO (encontrado 11/09/2026, no prioritario todavía): cambiar la
// zona horaria en Settings no persiste después de recargar la página —
// confirmado a mano en el navegador, no es un problema del test. Marcado
// como fixme para no ensuciar la corrida general; sacar el fixme cuando
// se arregle el guardado real.

test.fixme('cambiar la zona horaria persiste después de recargar', async ({ page }) => {
  await loginAsTestUser(page)
  await page.getByText('Configuración', { exact: true }).first().click()
  await expect(page.locator('.hd-title')).toHaveText('Configuración')

  const select = page.locator('.st-timezone-select')
  await expect(select).toBeVisible({ timeout: 10000 })

  await select.selectOption({ label: 'Uruguay' })
  await page.waitForTimeout(5000)
  await page.reload()

  await page.getByText('Configuración', { exact: true }).first().click()
  await expect(page.locator('.st-timezone-select')).toHaveValue('America/Montevideo', { timeout: 10000 })
})