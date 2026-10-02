'use client'
// Precios públicos de los planes (landing y registro), en pesos argentinos,
// leídos del backend (GET /api/billing/public-plans), que a su vez los lee
// de Mercado Pago: si se cambia el precio en MP, la web se actualiza sola.
//
// FALLBACK_PRICES se muestra mientras carga (o si el backend no responde),
// para que nunca haya un precio vacío. Actualizarlo si cambian los precios.
import { useEffect, useState } from 'react'
import { BASE_URL } from './api'

export type PlanSlug = 'starter' | 'growth' | 'pro'
export interface PlanPrices { monthly: number | null; annual: number | null; currency: string }

const FALLBACK_PRICES: Record<PlanSlug, PlanPrices> = {
  starter: { monthly: 29000, annual: 288840, currency: 'ARS' },
  growth: { monthly: 49000, annual: 488040, currency: 'ARS' },
  pro: { monthly: 79000, annual: 786840, currency: 'ARS' },
}

export function usePlanPrices() {
  const [prices, setPrices] = useState<Record<PlanSlug, PlanPrices>>(FALLBACK_PRICES)

  useEffect(() => {
    let cancelled = false
    fetch(`${BASE_URL}/api/billing/public-plans`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (cancelled || !data?.plans?.length) return
        const next = { ...FALLBACK_PRICES }
        for (const p of data.plans as { plan: PlanSlug; period: 'monthly' | 'annual'; amount: number; currency: string }[]) {
          if (!next[p.plan]) continue
          next[p.plan] = { ...next[p.plan], [p.period]: p.amount, currency: p.currency || 'ARS' }
        }
        setPrices(next)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  return prices
}

export function formatPrice(amount: number | null, currency = 'ARS') {
  if (amount == null) return ''
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

// % que se ahorra pagando anual (redondeado), o null si no hay anual.
export function annualSavingsPct(p: PlanPrices) {
  if (!p.monthly || !p.annual) return null
  return Math.round((1 - p.annual / (p.monthly * 12)) * 100)
}
