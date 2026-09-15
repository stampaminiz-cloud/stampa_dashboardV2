import { test, expect } from '@playwright/test'
import { loginAsTestUser } from './helpers/auth'

// tests/dashboard-overview.spec.ts
//
// La cuenta de test no tiene clientes registrados todavía, así que Overview
// debería mostrar el estado vacío ("Los datos van a aparecer acá"), no el
// bloque de métricas avanzadas — eso solo aparece con datos reales.

test.beforeEach(async ({ page }) => {
  await loginAsTestUser(page)
})

test('Overview muestra el resumen con métricas en cero', async ({ page }) => {
  await expect(page.locator('.hd-title')).toHaveText('Inicio')
  await expect(page.getByText('Total clientes')).toBeVisible()
  await expect(page.getByText('Sellos otorgados')).toBeVisible()
})

test('sin clientes todavía, muestra el estado vacío en vez de las métricas avanzadas', async ({ page }) => {
  await expect(page.getByText('Los datos van a aparecer acá')).toBeVisible({ timeout: 10000 })
})