'use client'
import React, { useState } from 'react'
import { Icon } from '@/components/ui/Icon'

// Gráficos de la última ronda (Analítica e Inicio). Datos de
// /analytics/detailed: newVsReturning, progressDistribution, formAnswers,
// cardComparison. Colores: coral = clientes que vuelven / magnitud, azul =
// clientes nuevos (par validado para daltonismo). El texto nunca va en el
// color de la serie.

export interface NvrBucket { label: string; newCustomers: number; returning: number }
export interface ProgressDist { kind: 'stamp' | 'points'; segments: { label: string; count: number }[] }
// active, avgVisits y redeemed: qué hace cada grupo (backend: analytics.js, extraCharts).
export interface FormAnswer { fieldId: string; label: string; cardName: string; total: number; options: { value: string; count: number; active?: number; avgVisits?: number; redeemed?: number }[] }
export interface CardRow { cardId: string; name: string; type: string; color: string; isActive: boolean; visits: number; redeems: number; signups: number; customers: number }

// Estado vacío único (todas las secciones de Analítica): la mascota y un
// título corto, mismo tamaño de letra en todos lados.
export function EmptyState({ title, text, compact = false }: { title: string; text?: string; compact?: boolean }) {
  return (
    <div className={`ch-empty${compact ? ' ch-empty--sm' : ''}`}>
      <style dangerouslySetInnerHTML={{ __html: EMPTY_CSS }} />
      <span className="ch-empty-art">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/stampa-mascot-coral.png" alt="" width={34} height={32} />
      </span>
      <div className="ch-empty-title">{title}</div>
      {text && <div className="ch-empty-text">{text}</div>}
    </div>
  )
}
const EMPTY_CSS = `
  .ch-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:6px;padding:26px 12px;}
  .ch-empty--sm{padding:14px 8px;}
  .ch-empty-art{width:58px;height:58px;border-radius:50%;background:#FBF1EC;display:flex;align-items:center;justify-content:center;margin-bottom:4px;}
  .ch-empty-art img{opacity:.75;}
  .ch-empty-title{font-family:var(--font-body);font-size:13px;font-weight:600;color:#2B2620;}
  .ch-empty-text{font-family:var(--font-body);font-size:12px;color:rgba(43,38,32,.5);max-width:300px;line-height:1.45;}
`

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

// ── Anillo de retención (Inicio) ─────────────────────────────────────────────
// Qué parte del movimiento es gente que vuelve, con la frase grande y la
// comparación con el período anterior. El detalle por semana está en Analítica.
export interface Retention { current: { returning: number; newCustomers: number }; previous: { returning: number; newCustomers: number } }
export function RetentionRing({ data }: { data: Retention }) {
  const { returning: r, newCustomers: n } = data.current
  const total = r + n
  const share = total ? Math.round((r / total) * 100) : 0
  const pt = data.previous.returning + data.previous.newCustomers
  // Con menos de 5 clientes no se muestra porcentaje (ni la comparación).
  const prevShare = pt >= 5 ? Math.round((data.previous.returning / pt) * 100) : null
  const diff = prevShare == null ? null : share - prevShare
  const R = 46, C = 2 * Math.PI * R
  const retLen = total ? (r / total) * C : 0
  const gap = r && n ? 3 : 0
  return (
    <div className="ch-ring">
      <style>{CSS}</style>
      <svg width="120" height="120" viewBox="0 0 120 120" role="img" aria-label={`${share}% volvieron, ${100 - share}% nuevos`}>
        <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(43,38,32,.07)" strokeWidth="14" />
        {total > 0 && <>
          <circle cx="60" cy="60" r={R} fill="none" stroke={BLUE} strokeWidth="14" strokeDasharray={`${Math.max(0, C - retLen - gap * 2)} ${C}`} strokeDashoffset={-(retLen + gap)} transform="rotate(-90 60 60)" strokeLinecap="butt" />
          <circle cx="60" cy="60" r={R} fill="none" stroke={CORAL} strokeWidth="14" strokeDasharray={`${Math.max(0, retLen - gap)} ${C}`} transform="rotate(-90 60 60)" strokeLinecap="butt" />
        </>}
      </svg>
      {/* Sin frase: el número ya está en el anillo; al costado, los datos. */}
      <div className="ch-ring-tiles">
        <div className="ch-tile"><div className="ch-tile-k"><i style={{ background: CORAL }} />Volvieron</div><div className="ch-tile-v">{r}</div><div className="ch-tile-s">ya eran clientes</div></div>
        <div className="ch-tile"><div className="ch-tile-k"><i style={{ background: BLUE }} />Nuevos</div><div className="ch-tile-v">{n}</div><div className="ch-tile-s">se registraron</div></div>
        <div className="ch-tile">
          {/* Antes decía "−14 pts" (puntos porcentuales) y se confundía con los puntos de las tarjetas. */}
          <div className="ch-tile-k">Período anterior</div>
          <div className="ch-tile-v">{prevShare == null ? '—' : `${prevShare}%`}</div>
          <div className="ch-tile-s">{prevShare == null ? (pt ? 'pocos clientes para comparar' : 'sin datos para comparar') : diff === 0 ? 'igual que ahora' : total < 5 ? 'ahora hay pocos clientes' : `ahora ${share}%`}</div>
        </div>
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
  if (!total) return <EmptyState title="Todavía sin clientes" text="Aparece cuando se registren en tus tarjetas." />
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

// ── Respuestas del formulario: tabla por pregunta ───────────────────────────
// Por respuesta: clientes, % activos, visitas promedio y canjes. Con menos de
// MIN_GROUP clientes no se muestran porcentajes ni promedios (no dicen nada).
// La cantidad de clientes es el botón para mandarles un aviso.
const MIN_GROUP = 5
export function FormAnswers({ data, onNotify }: { data: FormAnswer[]; onNotify?: (fieldId: string, value: string) => void }) {
  const [idx, setIdx] = useState(0)
  if (!data.length) return <EmptyState title="Todavía sin respuestas" text="Aparece cuando respondan preguntas de lista del formulario, como talle o bebida favorita." />
  const f = data[Math.min(idx, data.length - 1)]
  const max = Math.max(1, ...f.options.map(o => o.count))
  const withStats = f.options.some(o => o.active != null)
  const small = f.options.some(o => o.count < MIN_GROUP)
  return (
    <div className="ch">
      <style>{CSS}</style>
      {data.length > 1 && (
        <select className="ch-select" value={idx} onChange={e => setIdx(Number(e.target.value))} aria-label="Pregunta">
          {data.map((q, i) => <option key={q.fieldId} value={i}>{q.label}{q.cardName ? ` · ${q.cardName}` : ''}</option>)}
        </select>
      )}
      {data.length === 1 && <div className="ch-q">{f.label}</div>}
      <div className="ch-at" role="table" aria-label={f.label}>
        <div className="ch-at-row ch-at-head" role="row">
          <span role="columnheader">Respuesta</span>
          {withStats && <><span role="columnheader">Activos</span><span role="columnheader">Visitas prom.</span><span role="columnheader">Canjearon</span></>}
          <span role="columnheader">Clientes</span>
        </div>
        {f.options.slice(0, 8).map(o => {
          const show = o.count >= MIN_GROUP
          return (
            <div key={o.value} className="ch-at-row" role="row">
              <span className="ch-at-name" role="cell">{o.value}<span className="ch-at-bar"><i style={{ width: `${(o.count / max) * 100}%` }} /></span></span>
              {withStats && <>
                <span role="cell">{show ? `${pct(o.active || 0, o.count)}%` : '—'}</span>
                <span role="cell">{show ? String(o.avgVisits ?? 0).replace('.', ',') : '—'}</span>
                <span role="cell">{show ? o.redeemed || 0 : '—'}</span>
              </>}
              <span role="cell">
                {onNotify
                  ? <button type="button" className="ch-at-cnt" onClick={() => onNotify(f.fieldId, o.value)} title={`Mandar un aviso a los ${o.count} que respondieron "${o.value}"`} aria-label={`${o.count} clientes. Mandarles un aviso`}>{o.count}<Icon name="notificaciones" size={12} /></button>
                  : o.count}
              </span>
            </div>
          )
        })}
      </div>
      {insight(f) && <div className="ch-note">{insight(f)}</div>}
      <div className="ch-note">{onNotify ? 'Tocá la cantidad de clientes para mandarles un aviso.' : `${f.total} respuestas.`}{withStats && small ? ` Con menos de ${MIN_GROUP} clientes no se muestran porcentajes ni promedios.` : ''}</div>
    </div>
  )
}

const fmtVisits = (n: number) => `${String(n).replace('.', ',')} ${n === 1 ? 'visita' : 'visitas'}`

// El grupo que más vuelve frente al resto, solo con grupos de MIN_GROUP o más
// clientes y una diferencia clara (no se destaca un empate).
function insight(f: FormAnswer): string | null {
  const opts = f.options.filter(o => o.count >= MIN_GROUP && o.avgVisits != null)
  if (opts.length < 2) return null
  const best = opts.reduce((a, b) => ((b.avgVisits || 0) > (a.avgVisits || 0) ? b : a))
  const rest = opts.filter(o => o !== best)
  const restAvg = rest.reduce((a, o) => a + (o.avgVisits || 0) * o.count, 0) / rest.reduce((a, o) => a + o.count, 0)
  if (!restAvg || (best.avgVisits || 0) < restAvg * 1.3) return null
  return `Los que respondieron "${best.value}" vienen ${fmtVisits(best.avgVisits || 0)} en promedio; el resto, ${fmtVisits(Math.round(restAvg * 10) / 10)}.`
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
  .ch-ring{display:flex;align-items:center;gap:20px;flex-wrap:wrap;}
  .ch-ring-tiles{flex:1;min-width:240px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;}
  .ch-tile{background:#F1F3EE;border-radius:12px;padding:12px 14px;}
  .ch-tile-k{display:flex;align-items:center;font-size:11.5px;color:rgba(43,38,32,.6);font-family:var(--font-body);}
  .ch-tile-k i{display:inline-block;flex-shrink:0;width:9px;height:9px;border-radius:3px;margin-right:6px;}
  .ch-tile-v{font-family:var(--font-display);font-size:22px;font-weight:800;color:#2B2620;margin-top:4px;}
  .ch-tile-v.up{color:#2E7D4F;}
  .ch-tile-v.down{color:#B4442A;}
  .ch-tile-s{font-size:11px;color:rgba(43,38,32,.45);font-family:var(--font-body);}
  @media(max-width:600px){.ch-ring-tiles{grid-template-columns:1fr 1fr;}}
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
  .ch-at{display:flex;flex-direction:column;}
  .ch-at-row{display:grid;grid-template-columns:minmax(0,1fr) repeat(3,minmax(52px,auto)) 64px;gap:10px;align-items:center;padding:8px 0;border-top:1px solid var(--s-linea);font-size:12.5px;color:var(--s-tinta);font-variant-numeric:tabular-nums;}
  .ch-at-row>span:not(:first-child){text-align:right;}
  .ch-at-head{border-top:none;padding-top:0;font-size:11px;color:var(--s-tinta-3);}
  .ch-at-name{display:flex;flex-direction:column;gap:5px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .ch-at-bar{display:block;height:4px;background:var(--s-hueco);border-radius:2px;}
  .ch-at-bar i{display:block;height:100%;background:var(--s-pino);border-radius:2px;}
  .ch-at-cnt{display:inline-flex;align-items:center;gap:4px;font:inherit;font-weight:600;color:var(--s-tinta);background:var(--s-blanco);border:1px solid var(--s-linea);border-radius:6px;padding:3px 7px;cursor:pointer;}
  .ch-at-cnt:hover{border-color:rgba(34,32,27,.3);}
  .ch-at-cnt:focus-visible{outline:2px solid var(--s-brasa);outline-offset:2px;}
  @media(max-width:480px){.ch-at-row{grid-template-columns:minmax(0,1fr) 44px 44px 44px 56px;gap:6px;font-size:12px;}}
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

// ── Comparación entre sucursales (multilocal, con "Todas"): misma tabla ──────
export interface LocationRow { locationId: string; name: string; status: 'active' | 'paused' | 'off'; visits: number; redeems: number; signups: number }
const LOC_METRICS: { key: 'visits' | 'redeems' | 'signups'; label: string }[] = [
  { key: 'visits', label: 'Visitas' }, { key: 'redeems', label: 'Canjes' }, { key: 'signups', label: 'Nuevos' },
]
export function LocationComparison({ data }: { data: LocationRow[] }) {
  const max = Object.fromEntries(LOC_METRICS.map(m => [m.key, Math.max(1, ...data.map(r => r[m.key] || 0))]))
  return (
    <div className="ch">
      <style>{CSS}</style>
      <div className="ch-table" style={{ gridTemplateColumns: `minmax(120px,1.2fr) repeat(${LOC_METRICS.length}, minmax(70px,1fr))` }}>
        <div className="ch-th" />
        {LOC_METRICS.map(m => <div key={m.key} className="ch-th">{m.label}</div>)}
        {data.map(r => (
          <React.Fragment key={r.locationId}>
            <div className="ch-card">{r.name}{r.status === 'paused' && <em>pausada</em>}</div>
            {LOC_METRICS.map(m => {
              const v = r[m.key] || 0
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
