import { test, expect } from '@playwright/test'
import { loginAsTestUser } from '../helpers/auth'

// tests/flow/flow-form.spec.ts
//
// La cuenta de test no tiene campos "opcionales" predefinidos activados,
// solo campos personalizados — así que el flujo real que probamos acá es
// cambiar CUÁL de los 2 campos personalizados es el campo de premio (la
// estrella "Usar como campo de premio"), guardar, y confirmar que persiste.

test('cambiar cuál campo personalizado es el premio persiste después de guardar y recargar', async ({ page }) => {
  await loginAsTestUser(page)
  await page.getByText('Formulario', { exact: true }).first().click()
  await expect(page.locator('.hd-title')).toHaveText('Formulario')

  await expect(page.getByText('Campos personalizados', { exact: true })).toBeVisible({ timeout: 10000 })

  const stars = page.locator('.fm-reward-toggle')
  await expect(stars).toHaveCount(2, { timeout: 10000 })

  // Tocamos la estrella que NO esté activa hoy — así el test funciona sin
  // importar cuál de las 2 sea el premio actual.
  const firstIsOn = await stars.nth(0).evaluate(el => el.classList.contains('fm-reward-toggle--on'))
  const targetIndex = firstIsOn ? 1 : 0
  await stars.nth(targetIndex).click()

  await page.getByRole('button', { name: /Guardar cambios/i }).click()
  await expect(page.getByRole('button', { name: /✓ Guardado/i })).toBeVisible({ timeout: 10000 })

  await page.reload()
  await page.getByText('Formulario', { exact: true }).first().click()
  await expect(page.getByText('Campos personalizados', { exact: true })).toBeVisible({ timeout: 10000 })

  await expect(page.locator('.fm-reward-toggle').nth(targetIndex)).toHaveClass(/fm-reward-toggle--on/, { timeout: 10000 })
})