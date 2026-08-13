// data/plans.ts
// Single source of truth for plan limits across the entire dashboard.
// Usage: const { plan, can, limit, gate } = usePlan()

import React, { createContext, useContext } from 'react'

// ─── Plan types ───────────────────────────────────────────────────────────────
export type Plan = 'Starter' | 'Growth' | 'Pro' | 'Enterprise'

export interface PlanLimits {
  maxActiveCards:   number        // active card types allowed
  customColors:     boolean       // hex + color picker (color 100% libre)
  extraColorPresets:boolean       // los 3 presets extra (8 en vez de 5) — escalón intermedio antes del hex libre
  maxCustomFields:  number        // form builder custom fields
  maxTeamMembers:   number        // managers + scanners
  monthlyNotifs:    number        // push notifications per month
  analyticsLevel:   'basic' | 'full'
  multiLocation:    boolean       // multiple branches
  whiteLabel:       boolean       // remove Stampa branding
  formBranding:     boolean       // logo + color on signup form
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  Starter: {
    maxActiveCards:  1,
    customColors:    false,
    extraColorPresets:false,
    maxCustomFields: 0,
    maxTeamMembers:  1,
    monthlyNotifs:   100,
    analyticsLevel:  'basic',
    multiLocation:   false,
    whiteLabel:      false,
    formBranding:    false,
  },
  Growth: {
    maxActiveCards:  3,
    customColors:    false,       // color libre queda reservado para Pro+ — acá se sube a 8 presets curados
    extraColorPresets:true,
    maxCustomFields: 3,
    maxTeamMembers:  5,
    monthlyNotifs:   1000,
    analyticsLevel:  'full',
    multiLocation:   false,
    whiteLabel:      false,
    formBranding:    true,
  },
  Pro: {
    maxActiveCards:  999,
    customColors:    true,
    extraColorPresets:true,
    maxCustomFields: 3,
    maxTeamMembers:  999,
    monthlyNotifs:   999999,
    analyticsLevel:  'full',
    multiLocation:   false,
    whiteLabel:      false,
    formBranding:    true,
  },
  Enterprise: {
    maxActiveCards:  999,
    customColors:    true,
    extraColorPresets:true,
    maxCustomFields: 10,
    maxTeamMembers:  999,
    monthlyNotifs:   999999,
    analyticsLevel:  'full',
    multiLocation:   true,
    whiteLabel:      true,
    formBranding:    true,
  },
}

// ─── Plan pricing (for upgrade prompts) ──────────────────────────────────────
export const PLAN_PRICE: Record<Plan, string> = {
  Starter:    'Gratis',
  Growth:     '$29/mes',
  Pro:        '$79/mes',
  Enterprise: 'A consultar',
}

// ─── Feature descriptions (for upgrade prompts) ───────────────────────────────
export const FEATURE_LABELS: Record<keyof PlanLimits, string> = {
  maxActiveCards:  'Tipos de tarjeta activos',
  customColors:    'Color 100% libre',
  extraColorPresets:'Paleta ampliada (8 colores)',
  maxCustomFields: 'Campos personalizados en el formulario',
  maxTeamMembers:  'Miembros del equipo',
  monthlyNotifs:   'Notificaciones push por mes',
  analyticsLevel:  'Analítica avanzada',
  multiLocation:   'Multi-sucursal',
  whiteLabel:      'White label (sin marca Stampa)',
  formBranding:    'Logo y color en el formulario de registro',
}

// ─── Plan context ─────────────────────────────────────────────────────────────
interface PlanContextValue {
  plan:   Plan
  limits: PlanLimits
  // can(feature) — returns true if current plan supports this feature
  can:    (feature: keyof PlanLimits) => boolean
  // limit(feature) — returns the numeric limit for this feature
  limit:  (feature: keyof PlanLimits) => number
}

const PlanContext = createContext<PlanContextValue>({
  plan:   'Starter',
  limits: PLAN_LIMITS.Starter,
  can:    () => false,
  limit:  () => 0,
})

export function PlanProvider({ plan, children }: { plan: Plan; children: React.ReactNode }) {
  const limits = PLAN_LIMITS[plan]

  function can(feature: keyof PlanLimits): boolean {
    const val = limits[feature]
    if (typeof val === 'boolean') return val
    if (typeof val === 'number')  return val > 0
    return val === 'full'
  }

  function limit(feature: keyof PlanLimits): number {
    const val = limits[feature]
    if (typeof val === 'number') return val
    return 0
  }

  return React.createElement(PlanContext.Provider, { value: { plan, limits, can, limit } }, children)
}

export function usePlan() { return useContext(PlanContext) }

// ─── PlanGate component ───────────────────────────────────────────────────────
// Wraps any feature and shows an upgrade prompt if the plan doesn't support it.
//
// Usage:
//   <PlanGate feature="customColors" requiredPlan="Growth">
//     <ColorPicker ... />
//   </PlanGate>

interface PlanGateProps {
  feature:      keyof PlanLimits
  requiredPlan: Plan
  children:     React.ReactNode
  inline?:      boolean   // show inline lock badge instead of overlay
}

export function PlanGate({ feature, requiredPlan, children, inline = false }: PlanGateProps) {
  const { can } = usePlan()
  if (can(feature)) return React.createElement(React.Fragment, null, children)
  if (inline) return React.createElement(InlineLock, { requiredPlan })
  return React.createElement(OverlayLock, { feature, requiredPlan, children })
}

function InlineLock({ requiredPlan }: { requiredPlan: Plan }) {
  return React.createElement('div', { className: 'pg-inline-lock' },
    React.createElement('svg', { width: 11, height: 11, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      React.createElement('rect', { x: 3, y: 11, width: 18, height: 11, rx: 2 }),
      React.createElement('path', { d: 'M7 11V7a5 5 0 0 1 10 0v4' })
    ),
    `Plan ${requiredPlan}`
  )
}

function OverlayLock({ feature, requiredPlan, children }: { feature: keyof PlanLimits; requiredPlan: Plan; children: React.ReactNode }) {
  return React.createElement('div', { className: 'pg-overlay-wrap' },
    React.createElement('div', { className: 'pg-overlay-blur' }, children),
    React.createElement('div', { className: 'pg-overlay-gate' },
      React.createElement('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: '#C75D3A', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
        React.createElement('rect', { x: 3, y: 11, width: 18, height: 11, rx: 2 }),
        React.createElement('path', { d: 'M7 11V7a5 5 0 0 1 10 0v4' })
      ),
      React.createElement('div', { className: 'pg-gate-text' }, FEATURE_LABELS[feature]),
      React.createElement('div', { className: 'pg-gate-sub' }, `Disponible desde el plan ${requiredPlan}`),
      React.createElement('button', { className: 'pg-upgrade-btn' }, `Mejorar a ${requiredPlan} →`)
    )
  )
}

// ─── CSS (inject once) ────────────────────────────────────────────────────────
export const PLAN_GATE_CSS = `
  .pg-inline-lock{display:inline-flex;align-items:center;gap:4px;font-size:10.5px;color:rgba(43,38,32,.4);background:rgba(43,38,32,.06);border:1px solid rgba(43,38,32,.12);border-radius:20px;padding:3px 10px;font-weight:600;}
  .pg-overlay-wrap{position:relative;border-radius:12px;overflow:hidden;}
  .pg-overlay-blur{opacity:.25;pointer-events:none;user-select:none;filter:blur(2px);}
  .pg-overlay-gate{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:rgba(251,246,238,.92);backdrop-filter:blur(2px);}
  .pg-gate-text{font-size:13px;font-weight:700;color:#2B2620;text-align:center;}
  .pg-gate-sub{font-size:11.5px;color:rgba(43,38,32,.5);text-align:center;}
  .pg-upgrade-btn{background:#C75D3A;color:#fff;border:none;border-radius:9px;padding:8px 18px;font-size:12px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;}
  .pg-upgrade-btn:hover{background:#B14F2F;}
`