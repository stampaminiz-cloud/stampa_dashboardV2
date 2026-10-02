'use client'
import React, { useState } from 'react'

// Gráficos de la última ronda (Analítica e Inicio). Datos de
// /analytics/detailed: newVsReturning, progressDistribution, formAnswers,
// cardComparison. Colores: coral = clientes que vuelven / magnitud, azul =
// clientes nuevos (par validado para daltonismo). El texto nunca va en el
// color de la serie.

export interface NvrBucket { label: string; newCustomers: number; returning: number }
export interface ProgressDist { kind: 'stamp' | 'points'; segments: { label: string; count: number }[] }
export interface FormAnswer { fieldId: string; label: string; cardName: string; total: number; options: { value: string; count: number }[] }
export interface CardRow { cardId: string; name: string; type: string; color: string; isActive: boolean; visits: number; redeems: number; signups: number; customers: number }

const CORAL = '#C75D3A'
const BLUE = '#185FA5'
const pct = (n: number, t: number) => (t > 0 ? Math.round((n / t) * 100) : 0)

// ── Nuevos vs que vuelven: barras apiladas ───────────────────────────────────
export function NewVsReturning({ data }: { data: NvrBucket[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...data.map(b => b.newCustomers + b.returning))
  const totNew = data.reduce((a, b) => a + b.newCustomers, 0)
  const totRet = data.reduce((a, b) => a + b.returning, 0)
  return (
    <div className="ch">
      <style>{CSS}</style>
      <div className="ch-legend">
        <span><i style={{ background: CORAL }} />Volvieron <strong>{totRet}</strong></span>
        <span><i style={{ background: BLUE }} />Nuevos <strong>{totNew}</strong></span>
      </div>
      <div className="ch-stack">
        {data.map((b, i) => {
          const tot = b.newCustomers + b.returning
          return (
            <div key={i} className="ch-stack-col" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => setHover(hover === i ? null : i)}>
              {hover === i && <div className="ch-tip">{b.label}: {b.returning} volvieron · {b.newCustomers} nuevos</div>}
              <div className="ch-stack-track">
                <div className="ch-stack-bar" style={{ height: `${(tot / max) * 100}%` }}>
                  {b.returning > 0 && <div style={{ flex: b.returning, background: CORAL, borderRadius: b.newCustomers ? '0 0 2px 2px' : '4px 4px 2px 2px' }} />}
                  {b.newCustomers > 0 && <div style={{ flex: b.newCustomers, background: BLUE, borderRadius: '4px 4px 0 0' }} />}
                </div>
              </div>
              <div className="ch-stack-label">{data.length <= 10 || i % 5 === 0 ? b.label : ''}</div>
            </div>
          )
        })}
      </div>
      <div className="ch-note">
        {totNew + totRet === 0 ? 'Todavía no hay movimientos en este período.'
          : totRet >= totNew ? `${pct(totRet, totNew + totRet)}% de tu movimiento es gente que vuelve: el programa está reteniendo.`
          : `Hay más clientes nuevos que gente que vuelve. Probá una notificación a "Inactivos" o a los que están cerca del premio.`}
      </div>
    </div>
  )
}

// ── Distribución de progreso: una barra apilada horizontal + filas ──────────
// Escala secuencial de un solo tono (más oscuro = más cerca del premio).
const SEQ = ['#F3D6CB', '#E6AE98', '#D98565', '#C75D3A', '#8E3B20']
export function ProgressDistribution({ data }: { data: ProgressDist }) {
  const total = data.segments.reduce((a, s) => a + s.count, 0)
  const shades = data.segments.length === 3 ? [SEQ[0], SEQ[2], SEQ[4]] : SEQ
  if (!total) return <div className="ch-note">Todavía no hay clientes en tus tarjetas.</div>
  return (
    <div className="ch">
      <style>{CSS}</style>
      <div className="ch-hbar" role="img" aria-label={data.segments.map(s => `${s.label}: ${s.count}`).join(', ')}>
        {data.segments.map((s, i) => s.count > 0 && (
          <div key={s.label} title={`${s.label}: ${s.count} (${pct(s.count, total)}%)`} style={{ flex: s.count, background: shades[i] }} />
        ))}
      </div>
      <div className="ch-rows">
        {data.segments.map((s, i) => (
          <div key={s.label} className="ch-row">
            <i style={{ background: shades[i] }} />
            <span className="ch-row-label">{s.label}</span>
            <span className="ch-row-val">{s.count}</span>
            <span className="ch-row-pct">{pct(s.count, total)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Respuestas del formulario: barras horizontales por pregunta ──────────────
export function FormAnswers({ data }: { data: FormAnswer[] }) {
  const [idx, setIdx] = useState(0)
  if (!data.length) return <div className="ch-note">Aparece cuando tus clientes respondan preguntas de lista del formulario (ej: talle, bebida favorita).</div>
  const f = data[Math.min(idx, data.length - 1)]
  const max = Math.max(1, ...f.options.map(o => o.count))
  return (
    <div className="ch">
      <style>{CSS}</style>
      {data.length > 1 && (
        <select className="ch-select" value={idx} onChange={e => setIdx(Number(e.target.value))} aria-label="Pregunta">
          {data.map((q, i) => <option key={q.fieldId} value={i}>{q.label}{q.cardName ? ` · ${q.cardName}` : ''}</option>)}
        </select>
      )}
      {data.length === 1 && <div className="ch-q">{f.label}</div>}
      <div className="ch-rows">
        {f.options.slice(0, 8).map(o => (
          <div key={o.value} className="ch-ans" title={`${o.value}: ${o.count} (${pct(o.count, f.total)}%)`}>
            <span className="ch-ans-label">{o.value}</span>
            <div className="ch-ans-track"><div style={{ width: `${(o.count / max) * 100}%` }} /></div>
            <span className="ch-row-val">{o.count}</span>
            <span className="ch-row-pct">{pct(o.count, f.total)}%</span>
          </div>
        ))}
      </div>
      <div className="ch-note">{f.total} respuestas. Podés mandarles una notificación según lo que respondieron (Notificaciones → Por respuesta).</div>
    </div>
  )
}

// ── Comparación entre tarjetas: tabla con barra en cada métrica ──────────────
const METRICS: { key: keyof CardRow; label: string }[] = [
  { key: 'visits', label: 'Visitas' }, { key: 'redeems', label: 'Canjes' }, { key: 'signups', label: 'Nuevos' }, { key: 'customers', label: 'Clientes' },
]
export function CardComparison({ data }: { data: CardRow[] }) {
  const max = Object.fromEntries(METRICS.map(m => [m.key, Math.max(1, ...data.map(r => Number(r[m.key]) || 0))]))
  return (
    <div className="ch">
      <style>{CSS}</style>
      <div className="ch-table" style={{ gridTemplateColumns: `minmax(120px,1.2fr) repeat(${METRICS.length}, minmax(70px,1fr))` }}>
        <div className="ch-th" />
        {METRICS.map(m => <div key={m.key} className="ch-th">{m.label}</div>)}
        {data.map(r => (
          <React.Fragment key={r.cardId}>
            <div className="ch-card"><i style={{ background: r.color }} />{r.name}{!r.isActive && <em>inactiva</em>}</div>
            {METRICS.map(m => {
              const v = Number(r[m.key]) || 0
              return (
                <div key={m.key} className="ch-cell" title={`${r.name} · ${m.label}: ${v}`}>
                  <span>{v}</span>
                  <div className="ch-cell-track"><div style={{ width: `${(v / max[m.key]) * 100}%` }} /></div>
                </div>
              )
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

const CSS = `
  .ch{display:flex;flex-direction:column;gap:12px;}
  .ch-legend{display:flex;gap:16px;font-size:11.5px;color:rgba(43,38,32,.65);}
  .ch-legend i,.ch-row i,.ch-card i{display:inline-block;flex-shrink:0;width:9px;height:9px;border-radius:3px;margin-right:6px;vertical-align:middle;}
  .ch-legend strong{color:#2B2620;}
  .ch-stack{display:flex;align-items:stretch;gap:6px;height:160px;}
  .ch-stack-col{flex:1;display:flex;flex-direction:column;align-items:center;position:relative;min-width:0;}
  .ch-stack-track{flex:1;width:100%;display:flex;align-items:flex-end;justify-content:center;}
  .ch-stack-bar{width:100%;max-width:44px;display:flex;flex-direction:column-reverse;gap:2px;min-height:2px;}
  .ch-stack-label{font-size:9.5px;color:rgba(43,38,32,.45);margin-top:6px;height:13px;white-space:nowrap;}
  .ch-tip{position:absolute;bottom:calc(100% - 4px);left:50%;transform:translateX(-50%);background:#2B2620;color:#F7F0E4;font-size:11px;padding:6px 9px;border-radius:7px;white-space:nowrap;z-index:5;pointer-events:none;}
  .ch-note{font-size:11.5px;color:rgba(43,38,32,.55);line-height:1.5;}
  .ch-hbar{display:flex;gap:2px;height:16px;border-radius:5px;overflow:hidden;}
  .ch-rows{display:flex;flex-direction:column;gap:7px;}
  .ch-row{display:flex;align-items:center;font-size:12px;color:rgba(43,38,32,.75);}
  .ch-row-label{flex:1;}
  .ch-row-val{font-weight:700;color:#2B2620;min-width:34px;text-align:right;font-variant-numeric:tabular-nums;}
  .ch-row-pct{color:rgba(43,38,32,.45);min-width:40px;text-align:right;font-size:11px;font-variant-numeric:tabular-nums;}
  .ch-select{align-self:flex-start;font-size:12px;padding:6px 10px;border-radius:8px;border:1px solid rgba(43,38,32,.15);background:#fff;color:#2B2620;font-family:inherit;max-width:100%;}
  .ch-q{font-size:12px;font-weight:600;color:#2B2620;}
  .ch-ans{display:flex;align-items:center;gap:10px;font-size:12px;}
  .ch-ans-label{width:90px;color:rgba(43,38,32,.75);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .ch-ans-track{flex:1;height:10px;background:rgba(43,38,32,.05);border-radius:3px;overflow:hidden;}
  .ch-ans-track div{height:100%;background:#C75D3A;border-radius:0 4px 4px 0;}
  .ch-table{display:grid;gap:10px 14px;align-items:center;font-size:12px;}
  .ch-th{font-size:10.5px;font-weight:700;color:rgba(43,38,32,.45);text-transform:uppercase;letter-spacing:.04em;}
  .ch-card{color:#2B2620;font-weight:600;display:flex;align-items:center;gap:0;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .ch-card em{font-style:normal;font-weight:500;font-size:10px;color:rgba(43,38,32,.4);margin-left:6px;}
  .ch-cell{display:flex;flex-direction:column;gap:4px;}
  .ch-cell span{font-weight:700;color:#2B2620;font-variant-numeric:tabular-nums;}
  .ch-cell-track{height:6px;background:rgba(43,38,32,.05);border-radius:3px;overflow:hidden;}
  .ch-cell-track div{height:100%;background:#C75D3A;border-radius:0 3px 3px 0;}
`
