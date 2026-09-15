import { test, expect } from '@playwright/test'
import { loginAsTestUser } from '../helpers/auth'

// tests/dashboard-tabs.spec.ts
//
// Smoke test genérico: entra al dashboard y recorre cada tab de la barra
// lateral, confirmando que:
//   1. El título del header cambia al esperado (en español).
//   2. No queda una pantalla de "Cargando..." colgada después de un rato.
//   3. No aparece ningún mensaje de error visible.
//
// No valida el contenido específico de cada tab en detalle — eso va en
// archivos de test dedicados por tab (ver dashboard-rewards.spec.ts).

const TABS: Array<{ navLabel: string; headerTitle: string }> = [
  { navLabel: 'Inicio',         headerTitle: 'Inicio' },
  { navLabel: 'Clientes',       headerTitle: 'Clientes' },
  { navLabel: 'Analítica',      headerTitle: 'Analítica' },
  { navLabel: 'Premios',        headerTitle: 'Premios' },
  { navLabel: 'Notificaciones', headerTitle: 'Notificaciones' },
  { navLabel: 'Formulario',     headerTitle: 'Formulario' },
  { navLabel: 'Diseño',         headerTitle: 'Diseño' },
  { navLabel: 'Equipo',         headerTitle: 'Equipo' },
  { navLabel: 'Configuración',  headerTitle: 'Configuración' },
]

test.beforeEach(async ({ page }) => {
  await loginAsTestUser(page)
})

for (const tab of TABS) {
  test(`el tab "${tab.navLabel}" carga sin romperse`, async ({ page }) => {
    await page.getByText(tab.navLabel, { exact: true }).first().click()

    // El título del header confirma que el tab correcto quedó activo.
    await expect(page.locator('.hd-title')).toHaveText(tab.headerTitle, { timeout: 10000 })

    // Le damos un momento a que termine cualquier carga propia del tab, y
    // confirmamos que no quede un "Cargando..." colgado indefinidamente.
    await page.waitForTimeout(3000)
    await expect(page.getByText('Cargando...')).not.toBeVisible()

    // Ningún mensaje de error genérico visible.
    await expect(page.getByText(/Error al cargar|No se pud[oe]/i)).not.toBeVisible()
  })
}