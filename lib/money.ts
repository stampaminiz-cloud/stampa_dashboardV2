// lib/money.ts — moneda del negocio y montos en texto. Espejo de
// utils/money.js del backend: Argentina en pesos, el resto en euros.
export type Currency = 'ARS' | 'EUR'
export const currencyFor = (region?: string | null): Currency => ((region || 'AR') === 'AR' ? 'ARS' : 'EUR')

export function formatMoney(amount: number, currency: Currency = 'ARS') {
  const n = Number(amount) || 0
  const decimals = Number.isInteger(n) ? 0 : 2
  const num = n.toLocaleString('es-AR', { minimumFractionDigits: decimals, maximumFractionDigits: 2 })
  return currency === 'EUR' ? `${num} €` : `$${num}`
}

export interface PointsRule { pointsMode?: string | null; pointsPerVisit?: number | null; pointsPerAmount?: number | null; pointsAmountUnit?: number | null }

// "10 pts por visita" / "1 pt cada $1.000"
export function pointsRuleText(r: PointsRule, currency: Currency, long = false) {
  if (r.pointsMode === 'amount') {
    const per = r.pointsPerAmount || 1
    return `${per} ${long ? (per === 1 ? 'punto' : 'puntos') : 'pt' + (per === 1 ? '' : 's')} cada ${formatMoney(r.pointsAmountUnit || 1000, currency)}`
  }
  const per = r.pointsPerVisit || 10
  return `${per} ${long ? (per === 1 ? 'punto' : 'puntos') : 'pts'} por visita`
}
