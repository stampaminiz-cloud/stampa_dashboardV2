'use client'
// Regla de una tarjeta de puntos: fijos por visita, o según el monto de la
// compra ("N puntos cada $X"). La usan Diseño y el onboarding.
import { useState } from 'react'
import { NumberStepper } from '@/components/ui/NumberStepper'
import { formatMoney, type Currency } from '@/lib/money'

export interface PointsRuleValue { pointsMode: 'visit' | 'amount'; pointsPerVisit: number; pointsPerAmount: number; pointsAmountUnit: number }

export const DEFAULT_UNIT: Record<Currency, number> = { ARS: 1000, EUR: 1 }

export function pointsRuleValid(v: PointsRuleValue) {
  return v.pointsMode === 'amount'
    ? Number.isInteger(v.pointsPerAmount) && v.pointsPerAmount >= 1 && v.pointsPerAmount <= 1000 && v.pointsAmountUnit > 0 && v.pointsAmountUnit <= 10000000
    : Number.isInteger(v.pointsPerVisit) && v.pointsPerVisit >= 1 && v.pointsPerVisit <= 1000
}

export function PointsRuleEditor({ value, onChange, currency }: { value: PointsRuleValue; onChange: (v: PointsRuleValue) => void; currency: Currency }) {
  const set = (p: Partial<PointsRuleValue>) => onChange({ ...value, ...p })
  const unit = value.pointsAmountUnit
  // Texto del monto tal como se escribe ("12," mientras se cargan centavos).
  const [unitText, setUnitText] = useState(unit ? String(unit).replace('.', ',') : '')
  // Ejemplo con una compra de 4,5 veces la unidad.
  const sample = Math.round(unit * 4.5 * 100) / 100
  const samplePts = Math.floor(sample / unit + 1e-9) * value.pointsPerAmount
  return (
    <div className="pr-box">
      <style>{CSS}</style>
      <div className="pr-modes" role="radiogroup" aria-label="Cómo se suman los puntos">
        {([['visit', 'Por visita', 'Cada escaneo suma lo mismo'], ['amount', 'Por monto de la compra', 'Suma según lo que gasta']] as const).map(([m, t, d]) => (
          <button key={m} type="button" role="radio" aria-checked={value.pointsMode === m} className={`pr-mode${value.pointsMode === m ? ' pr-mode--on' : ''}`}
            onClick={() => { if (m === 'amount' && !unit) { set({ pointsMode: m, pointsAmountUnit: DEFAULT_UNIT[currency] }); setUnitText(String(DEFAULT_UNIT[currency])) } else set({ pointsMode: m }) }}>
            <strong>{t}</strong><small>{d}</small>
          </button>
        ))}
      </div>
      {value.pointsMode === 'visit' ? (
        <div className="pr-stack">
          <span className="pr-label">Puntos por visita</span>
          <NumberStepper value={value.pointsPerVisit} onChange={n => set({ pointsPerVisit: Math.max(1, Math.min(1000, Math.round(n) || 1)) })} min={1} max={1000} suffix="pts" presets={[5, 10, 20, 50]} size="sm" ariaLabel="Puntos por visita" />
        </div>
      ) : (
        <>
          <div className="pr-row pr-row--wrap">
            <NumberStepper value={value.pointsPerAmount} onChange={n => set({ pointsPerAmount: Math.max(1, Math.min(1000, Math.round(n) || 1)) })} min={1} max={1000} suffix={value.pointsPerAmount === 1 ? 'punto' : 'puntos'} size="sm" ariaLabel="Puntos" />
            <span>cada</span>
            <label className="pr-money">
              {currency === 'ARS' && <span>$</span>}
              <input id="pr-unit" inputMode="decimal" value={unitText} aria-label="Monto"
                onChange={e => { const t = e.target.value.replace(/[^\d.,]/g, ''); setUnitText(t); const n = Number(t.replace(/\./g, '').replace(',', '.')); set({ pointsAmountUnit: Number.isFinite(n) ? Math.round(n * 100) / 100 : 0 }) }} />
              {currency === 'EUR' && <span>€</span>}
            </label>
          </div>
          <div className="pr-note">
            {unit > 0 ? <>Ej: una compra de {formatMoney(sample, currency)} suma <strong>{samplePts} {samplePts === 1 ? 'punto' : 'puntos'}</strong>. El empleado carga el monto en la app al escanear (necesita la última versión de Stampa Escáner).</> : 'Escribí cada cuánto suma.'}
          </div>
        </>
      )}
    </div>
  )
}

const CSS = `
  .pr-box{display:flex;flex-direction:column;gap:12px;}
  .pr-modes{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
  .pr-mode{text-align:left;display:flex;flex-direction:column;gap:2px;border:1.5px solid rgba(43,38,32,.12);border-radius:10px;padding:9px 11px;background:#fff;cursor:pointer;font-family:inherit;}
  .pr-mode strong{font-size:12.5px;color:#2B2620;}
  .pr-mode small{font-size:11px;color:rgba(43,38,32,.55);}
  .pr-mode--on{border-color:#C75D3A;background:rgba(199,93,58,.05);}
  .pr-row{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:12.5px;color:#2B2620;}
  .pr-stack{display:flex;flex-direction:column;align-items:flex-start;gap:8px;margin-top:4px;}
  .pr-label{font-size:12.5px;color:#2B2620;font-weight:500;}
  .pr-row--wrap{justify-content:flex-start;flex-wrap:wrap;}
  .pr-money{display:inline-flex;align-items:center;gap:4px;border:1px solid rgba(43,38,32,.18);border-radius:8px;padding:5px 9px;background:#fff;font-size:13px;}
  .pr-money input{border:none;outline:none;width:90px;font:inherit;background:transparent;}
  .pr-note{font-size:11.5px;color:rgba(43,38,32,.6);line-height:1.5;}
  @media (max-width:520px){.pr-modes{grid-template-columns:1fr;}}
`
