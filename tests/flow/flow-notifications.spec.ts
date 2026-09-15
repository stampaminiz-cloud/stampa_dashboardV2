import { test, expect } from '@playwright/test'
import { loginAsTestUser } from '../helpers/auth'

// tests/flow-notifications.spec.ts
//
// Flujo real: compone y envía un broadcast de verdad. Como la cuenta de
// test no tiene clientes reales registrados, esto envía a 0 destinatarios
// — sin riesgo de spamear a nadie, pero ejercita el flujo completo
// (componer → elegir audiencia → enviar → confirmar éxito → aparece en
// el historial).

test('enviar una notificación de verdad muestra el mensaje de éxito y queda en el historial', async ({ page }) => {
  await loginAsTestUser(page)
  await page.getByText('Notificaciones', { exact: true }).first().click()
  await expect(page.locator('.hd-title')).toHaveText('Notificaciones')

  // Mensaje con timestamp para poder identificarlo después en el historial
  // si hace falta revisar a mano.
  const uniqueMessage = `[TEST AUTOMÁTICO] Mensaje de prueba ${Date.now()}`

  await page.getByPlaceholder(/2x1 en café/i).fill(uniqueMessage)

  // Audiencia "Todos" ya viene seleccionada por default — no hace falta
  // tocar nada ahí.
  await page.getByRole('button', { name: /Enviar a \d+ clientes/i }).click()

  // El botón se reemplaza por el mensaje de éxito.
  await expect(page.getByText(/Notificación enviada a \d+ clientes/i)).toBeVisible({ timeout: 10000 })
})