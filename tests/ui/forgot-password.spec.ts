import { test, expect } from '@playwright/test'

// tests/forgot-password.spec.ts
//
// Verifica que /forgot-password muestre el formulario correcto (pedir email),
// y no el contenido de otra página por error de copiado — exactamente el tipo
// de bug que tuvimos hoy con reset-password.

test('la página de forgot-password muestra el formulario de pedir email', async ({ page }) => {
  await page.goto('/forgot-password')

  await expect(page.getByText('¿Olvidaste tu contraseña?')).toBeVisible()
  await expect(page.getByPlaceholder('tu@negocio.com')).toBeVisible()
  await expect(page.getByRole('button', { name: /Enviar link/i })).toBeVisible()

  // Negativo: NO debe mostrar el contenido de la página de reset (confirma
  // que no se coló el archivo equivocado, como pasó hoy).
  await expect(page.getByText('Elegí tu nueva contraseña')).not.toBeVisible()
})

test('el formulario pide el email antes de dejar enviar', async ({ page }) => {
  await page.goto('/forgot-password')
  await page.getByRole('button', { name: /Enviar link/i }).click()
  // El aviso de error lleva role="alert" (Next tiene otro alert vacío para el
  // lector de pantalla, por eso se filtra por texto) y "Ingresá tu email"
  // también aparece en el subtítulo.
  await expect(page.getByRole('alert').filter({ hasText: 'Ingresá tu email' })).toHaveText('Ingresá tu email')
})