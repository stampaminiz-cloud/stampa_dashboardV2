'use client'
// Precios públicos de los planes (landing y registro), leídos del backend
// (GET /api/billing/public-plans): en Argentina, pesos de Mercado Pago; en
// Europa (market EU), euros de Stripe, MÁS IVA. Si se cambia el precio en
// MP o en Stripe, la web se actualiza sola.
//
// FALLBACK_PRICES se muestra mientras carga (o si el backend no responde),
// para que nunca haya un precio vacío. Actualizarlo si cambian los precios.
import { useEffect, useState } from 'react'
import { BASE_URL } from './api'
import type { Market } from './market'

export type PlanSlug = 'starter' | 'growth' | 'pro'
export interface PlanPrices { monthly: number | null; annual: number | null; currency: string; taxExcluded?: boolean }

const FALLBACK_PRICES: Record<PlanSlug, PlanPrices> = {
  starter: { monthly: 35000, annual: 348600, currency: 'ARS' },
  growth: { monthly: 59000, annual: 587640, currency: 'ARS' },
  pro: { monthly: 95000, annual: 946200, currency: 'ARS' },
}

const FALLBACK_EUR: Record<PlanSlug, PlanPrices> = {
  starter: { monthly: 29, annual: 288.84, currency: 'EUR', taxExcluded: true },
  growth: { monthly: 49, annual: 488.04, currency: 'EUR', taxExcluded: true },
  pro: { monthly: 79, annual: 786.84, currency: 'EUR', taxExcluded: true },
}

export function usePlanPrices(market: Market = 'AR') {
  const fallback = market === 'EU' ? FALLBACK_EUR : FALLBACK_PRICES
  const [prices, setPrices] = useState<Record<PlanSlug, PlanPrices>>(fallback)

  useEffect(() => {
    let cancelled = false
    setPrices(fallback)
    fetch(`${BASE_URL}/api/billing/public-plans${market === 'EU' ? '?market=eu' : ''}`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (cancelled || !data?.plans?.length) return
        const next = { ...fallback }
        for (const p of data.plans as { plan: PlanSlug; period: 'monthly' | 'annual'; amount: number; currency: string; taxExcluded?: boolean }[]) {
          if (!next[p.plan]) continue
          next[p.plan] = { ...next[p.plan], [p.period]: p.amount, currency: p.currency || fallback[p.plan].currency, ...(p.taxExcluded != null ? { taxExcluded: p.taxExcluded } : {}) }
        }
        setPrices(next)
      })
      .catch(() => {})
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [market])

  return prices
}

export function formatPrice(amount: number | null, currency = 'ARS') {
  if (amount == null) return ''
  // Euros: "29 €" o "24,07 €" (con céntimos solo si los hay). Pesos: sin decimales.
  if (currency === 'EUR') return new Intl.NumberFormat('es-ES', { style: 'currency', currency, minimumFractionDigits: Number.isInteger(amount) ? 0 : 2, maximumFractionDigits: 2 }).format(amount)
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

// "+ IVA" para los precios que no lo incluyen (Europa).
export const taxSuffix = (p: PlanPrices) => (p.taxExcluded ? ' + IVA' : '')

// % que se ahorra pagando anual (redondeado), o null si no hay anual.
export function annualSavingsPct(p: PlanPrices) {
  if (!p.monthly || !p.annual) return null
  return Math.round((1 - p.annual / (p.monthly * 12)) * 100)
}
