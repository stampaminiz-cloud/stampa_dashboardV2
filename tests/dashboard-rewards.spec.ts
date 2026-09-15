import { test, expect } from '@playwright/test'
import { loginAsTestUser } from './helpers/auth'

// tests/dashboard-rewards.spec.ts
//
// Premios fue el tab con más bugs reales hoy (points-catalog y membership
// tiers faltantes en el backend, doble loading, autoFocus rompiendo un
// campo). Este test es más específico que el smoke test genérico de
// dashboard-tabs.spec.ts, justamente por ese historial.
//
// La cuenta de test tiene una tarjeta de tipo SELLOS — si en el futuro se
// prueban también puntos/membresía, van a hacer falta cuentas de test
// adicionales con esos tipos de tarjeta.

test.beforeEach(async ({ page }) => {
  await loginAsTestUser(page)
  await page.getByText('Premios', { exact: true }).first().click()
  await expect(page.locator('.hd-title')).toHaveText('Premios')
})

test('Premios (sellos) muestra el contenido sin quedarse en un loading duplicado', async ({ page }) => {
  // Con la precarga que armamos hoy, el contenido debería aparecer rápido,
  // sin pasar por un segundo "Cargando..." propio del tab.
  await expect(page.getByText('Cargando...')).not.toBeVisible({ timeout: 5000 })
  await expect(page.getByText('Premios pendientes de canjear')).toBeVisible()
})

test('no aparece contenido de otro tipo de tarjeta (puntos o membresía) en una cuenta de sellos', async ({ page }) => {
  await expect(page.getByText('Beneficios de cada nivel')).not.toBeVisible()
  await expect(page.getByText('Catálogo de premios')).not.toBeVisible()
})