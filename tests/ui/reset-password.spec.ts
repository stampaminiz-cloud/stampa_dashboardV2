import { test, expect } from '@playwright/test'

// tests/reset-password.spec.ts
//
// Este test existe específicamente porque hoy /reset-password mostraba por
// error el contenido de /forgot-password (archivo duplicado sin querer).
// Si eso vuelve a pasar, este test falla y avisa antes de llegar a producción.

test('la página de reset-password muestra el formulario de nueva contraseña, no el de forgot-password', async ({ page }) => {
  await page.goto('/reset-password?token=test-token-invalido')

  await expect(page.getByText('Elegí tu nueva contraseña')).toBeVisible()
  await expect(page.getByPlaceholder('••••••••').first()).toBeVisible()
  await expect(page.getByRole('button', { name: /Restablecer contraseña/i })).toBeVisible()

  // Negativo: NO debe mostrar el contenido de forgot-password.
  await expect(page.getByText('¿Olvidaste tu contraseña?')).not.toBeVisible()
})

test('sin token en la URL, igual muestra el formulario (no rompe la página)', async ({ page }) => {
  await page.goto('/reset-password')
  await expect(page.getByText('Elegí tu nueva contraseña')).toBeVisible()
})