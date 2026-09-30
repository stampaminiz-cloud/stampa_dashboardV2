'use client'
import React, { useState, useEffect } from 'react'
import { usePlan } from '@/data/plans'
import { BASE_URL } from '@/lib/api'

// Analítica (Growth, Pro, Enterprise). Dos bloques:
//   Hoy          estado actual e historial — no depende de fechas
//   En el período lo que pasó en los últimos 7/30/90 días
// Todo sigue al selector de tarjeta ("Todas" = el negocio entero, igual que
// Inicio). Sale de /analytics (estado actual) y /analytics/detailed.

// ─── Types ────────────────────────────────────────────────────────────────────
interface Bucket      { day: string; label: string; total: number; visits: number; stamp: number; points: number; visit: number; redeem: number }
interface Person      { id: string; name: string; email: string }
interface TopCustomer extends Person { visits: number; lastVisit: string; memberSince: string; cardName: string; progress: string }
interface LoyalCustomer extends Person { totalVisits: number; lastVisit: string }
interface Redeemer extends Person { redemptions: number }
interface FunnelStage { stage: string; value: number }
interface CompItem    { label: string; current: number; previous: number; unit: string }
interface FreqBucket  { label: string; count: number }
interface Hourly      { visits: number[][]; redeems: number[][]; signups: number[][]; weekdayCount: number[] }
interface CardDesign  { id: string; name: string; type: CardType; isActive: boolean }
interface Detailed {
  visitsOverTime: Bucket[]
  hourly: Hourly
  topCustomers: TopCustomer[]
  mostLoyal: LoyalCustomer[]
  topRedeemers: Redeemer[]
  funnel: FunnelStage[]
  comparison: CompItem[]
  frequency: { avgDays: number; trend: number; distribution: FreqBucket[] }
}

type Range = '7d' | '30d' | '90d'
type CardType = 'stamp' | 'points' | 'membership'

const RANGES: { key: Range; label: string }[] = [
  { key: '7d', label: '7 días' }, { key: '30d', label: '30 días' }, { key: '90d', label: '90 días' },
]

// Mismos títulos que el gráfico de Inicio. `key` es el campo del bucket.
const CHART: Record<CardType | 'all', { title: string; unit: string; key: keyof Bucket }> = {
  stamp:      { title: 'Sellos otorgados',    unit: 'sellos',      key: 'stamp' },
  points:     { title: 'Visitas con puntos',  unit: 'visitas',     key: 'points' },
  membership: { title: 'Visitas registradas', unit: 'visitas',     key: 'visit' },
  all:        { title: 'Actividad',           unit: 'movimientos', key: 'total' },
}

const TYPE_ICONS: Record<CardType, string> = { stamp: '☕', points: '🪙', membership: '🎫' }

function pctChange(cur: number, prev: number) {
  if (prev === 0) return null
  return Math.round(((cur - prev) / prev) * 100)
}

// ─── Gráfico de barras (mismo estilo que Inicio) ─────────────────────────────
function BarChart({ data, valueKey, tooltip }: { data: Bucket[]; valueKey: keyof Bucket; tooltip: (b: Bucket, v: number) => string }) {
  const [hover, setHover] = useState<number | null>(null)
  const values = data.map(b => Number(b[valueKey]) || 0)
  const max = Math.max(1, ...values)
  const ticks = [max, Math.round(max / 2), 0]
  return (
    <div className="an-bars-wrap">
      <div className="an-bars-axis">{ticks.map((t, i) => <span key={i}>{t}</span>)}</div>
      <div className="an-bars" data-many={data.length > 8 ? '1' : undefined}>
        {data.map((b, i) => (
          <div key={i} className="an-bar-col" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => setHover(hover === i ? null : i)}>
            {hover === i && <div className="an-bar-tip">{tooltip(b, values[i])}</div>}
            <div className="an-bar-track">
              <div className={`an-bar-fill${hover === i ? ' an-bar-fill--on' : ''}`} style={{ height: `${(values[i] / max) * 100}%` }} />
            </div>
            <div className="an-bar-label">{b.day}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── ¿Cuándo viene tu gente? ─────────────────────────────────────────────────
// Día × franja de 2 hs, en promedio por día (en 30/90 días no todos los días
// de la semana aparecen la misma cantidad de veces). Solo se muestran las
// franjas donde hubo algo, así no quedan filas vacías de madrugada.
const DAYS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const DAYS_PLURAL = ['los lunes', 'los martes', 'los miércoles', 'los jueves', 'los viernes', 'los sábados', 'los domingos']
const DAYS_SINGULAR = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
type HeatMode = 'visits' | 'redeems' | 'signups'
const HEAT_MODES: { key: HeatMode; label: string; unit: [string, string] }[] = [
  { key: 'visits',  label: 'Visitas',   unit: ['visita', 'visitas'] },
  { key: 'redeems', label: 'Canjes',    unit: ['canje', 'canjes'] },
  { key: 'signups', label: 'Registros', unit: ['registro', 'registros'] },
]
const slotLabel = (s: number) => `${s * 2}–${s * 2 + 2}`
const fmt1 = (n: number) => (Math.round(n * 10) / 10).toLocaleString('es-AR')

function WhenHeatmap({ hourly }: { hourly: Hourly }) {
  const [mode, setMode] = useState<HeatMode>('visits')
  const grid = hourly[mode]
  const unit = HEAT_MODES.find(m => m.key === mode)!.unit
  const avg = grid.map((row, d) => row.map(v => hourly.weekdayCount[d] > 0 ? v / hourly.weekdayCount[d] : 0))
  const slotTotals = Array.from({ length: 12 }, (_, s) => grid.reduce((a, row) => a + row[s], 0))
  const first = slotTotals.findIndex(v => v > 0)
  const last = 11 - [...slotTotals].reverse().findIndex(v => v > 0)
  const empty = first === -1
  const slots = empty ? [] : Array.from({ length: last - first + 1 }, (_, i) => first + i)
  const max = Math.max(0.0001, ...avg.flat())

  let best = { d: 0, s: 0, v: -1 }
  avg.forEach((row, d) => row.forEach((v, s) => { if (v > best.v) best = { d, s, v } }))
  // Día más flojo: entre los días que tuvieron movimiento (un día en 0 puede
  // ser que el local cierra).
  const dayAvg = avg.map(row => row.reduce((a, b) => a + b, 0))
  const openDays = dayAvg.map((v, d) => ({ v, d })).filter(x => x.v > 0)
  const worst = openDays.length >= 2 ? openDays.reduce((a, b) => (b.v < a.v ? b : a)) : null
  const verb = mode === 'visits' ? 'Tu momento más fuerte' : mode === 'redeems' ? 'Se canjea más' : 'Se registran más'

  return (
    <div className="an-card">
      <div className="an-card-head">
        <div>
          <div className="an-ctitle">¿Cuándo viene tu gente?</div>
          <div className="an-csub">Promedio por día, según la hora de los escaneos (y de los registros)</div>
        </div>
        <div className="an-seg-switch">
          {HEAT_MODES.map(m => (
            <button key={m.key} className={mode === m.key ? 'on' : ''} onClick={() => setMode(m.key)}>{m.label}</button>
          ))}
        </div>
      </div>
      {empty
        ? <div className="an-empty-note">Todavía no hay {unit[1]} en este período.</div>
        : <>
            <div className="an-when-insights">
              <div><span className="an-when-dot an-when-dot--up" />{verb}: <strong>{DAYS_PLURAL[best.d]} de {slotLabel(best.s)} hs</strong> ({fmt1(best.v)} {best.v === 1 ? unit[0] : unit[1]} por día)</div>
              {mode === 'visits' && worst && worst.d !== best.d && (
                <div><span className="an-when-dot an-when-dot--down" />El día más flojo: <strong>{DAYS_PLURAL[worst.d]}</strong> — buen momento para una promo o una notificación.</div>
              )}
            </div>
            <div className="an-when-scroll">
              <div className="an-when" style={{ gridTemplateColumns: `34px repeat(${slots.length}, minmax(30px, 72px))` }}>
                <div />
                {slots.map(s => <div key={s} className="an-when-h">{slotLabel(s)}</div>)}
                {DAYS_SHORT.map((dn, d) => (
                  <React.Fragment key={dn}>
                    <div className="an-when-d">{dn}</div>
                    {slots.map(s => {
                      const v = avg[d][s]
                      return (
                        <div key={s} className="an-when-cell"
                          title={`${DAYS_SINGULAR[d][0].toUpperCase() + DAYS_SINGULAR[d].slice(1)} ${slotLabel(s)} hs · ${fmt1(v)} ${v === 1 ? unit[0] : unit[1]} por día en promedio`}
                          style={{ background: v > 0 ? `rgba(199,93,58,${(0.12 + (v / max) * 0.88).toFixed(2)})` : 'rgba(43,38,32,.04)' }} />
                      )
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div className="an-hlegend">
              <span>Menos</span>
              <div className="an-hscale">{[.12, .34, .56, .78, 1].map(o => <div key={o} className="an-hsdot" style={{ background: `rgba(199,93,58,${o})` }} />)}</div>
              <span>Más</span>
            </div>
          </>
      }
    </div>
  )
}

// ─── Funnel ───────────────────────────────────────────────────────────────────
function Funnel({ data }: { data: FunnelStage[] }) {
  const max = data[0]?.value || 1
  return (
    <div className="an-funnel">
      {data.map((stage, i) => {
        const pct = Math.round((stage.value / max) * 100)
        const conv = i > 0 ? (data[i - 1].value > 0 ? Math.round((stage.value / data[i - 1].value) * 100) : 0) : null
        return (
          <div key={stage.stage} className="an-fstage">
            {conv !== null && (
              <div className="an-fconv">
                <span className="an-fconv-line" />
                <span className="an-fconv-pct">{conv}% llegó a esta etapa</span>
                <span className="an-fconv-line" />
              </div>
            )}
            <div className="an-fbar-wrap"><div className="an-fbar" style={{ width: `${pct}%` }} /></div>
            <div className="an-finfo">
              <span className="an-fname">{stage.stage}</span>
              <span className="an-fval">{stage.value.toLocaleString('es-AR')}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Clientes por nivel (membresía) ───────────────────────────────────────────
function TierDistribution({ tiers }: { tiers: { name: string; color: string; bg: string; count: number }[] }) {
  if (!tiers.length) return <div className="an-empty-note">Todavía no hay clientes en esta membresía.</div>
  const total = tiers.reduce((a, t) => a + t.count, 0) || 1
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {tiers.map((t) => (
        <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: t.bg, border: `2px solid ${t.color}`, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#2B2620', minWidth: 52 }}>{t.name}</span>
          <div style={{ flex: 1, height: 10, background: 'rgba(43,38,32,.06)', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(t.count / total) * 100}%`, background: t.bg, borderRadius: 5, border: t.count ? `1px solid ${t.color}40` : 'none' }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#2B2620', width: 28, textAlign: 'right' }}>{t.count}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Ranking de clientes (nombres clickeables) ───────────────────────────────
function Ranking<T extends Person>({ rows, value, unit, sub, onOpen, empty }: {
  rows: T[]; value: (r: T) => number; unit: (n: number) => string; sub?: (r: T) => string
  onOpen?: (email: string) => void; empty: string
}) {
  if (!rows.length) return <div className="an-empty-note">{empty}</div>
  const max = value(rows[0]) || 1
  return (
    <>
      {rows.map((r, i) => (
        <div key={r.id || i} className="an-tr">
          <div className={`an-trk${i === 0 ? ' an-trk--1' : ''}`}>{i + 1}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              {onOpen && r.email
                ? <button className="an-tn an-tn--link" onClick={() => onOpen(r.email)} title="Ver en Clientes">{r.name}</button>
                : <span className="an-tn">{r.name}</span>}
              <span className="an-tv">{unit(value(r))}</span>
            </div>
            <div className="an-tbar"><div className="an-tfill" style={{ width: `${(value(r) / max) * 100}%` }} /></div>
            {sub && <div className="an-tsub">{sub(r)}</div>}
          </div>
        </div>
      ))}
    </>
  )
}

// ─── Starter: Analítica es desde Growth ──────────────────────────────────────
function AnalyticsLocked({ isManager, onChoosePlan }: { isManager: boolean; onChoosePlan: () => void }) {
  const FEATURES = [
    'Evolución de tu programa en 7, 30 y 90 días',
    'Tasa de canje, progreso promedio y clientes por nivel',
    '¿Cuándo viene tu gente? Tus días y horarios fuertes y flojos',
    'Funnel: registro → 1ra visita → vuelve → premio',
    'Tus clientes más fieles y los que más canjean',
    'Exportar los movimientos a Excel (CSV)',
  ]
  return (
    <div className="an-content">
      <div className="an-card" style={{ padding: '36px 28px', textAlign: 'center', maxWidth: 560, margin: '24px auto', width: '100%' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(199,93,58,.1)', color: '#C75D3A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 17, fontWeight: 800, color: '#2B2620', marginBottom: 6 }}>Analítica está disponible desde Growth</div>
        <div style={{ fontSize: 13, color: 'rgba(43,38,32,.55)', marginBottom: 18, lineHeight: 1.55 }}>En Inicio tenés el resumen del día. Con Growth ves cómo rinde tu programa en detalle:</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 22px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FEATURES.map(f => (
            <li key={f} style={{ display: 'flex', gap: 9, fontSize: 13, color: '#2B2620', lineHeight: 1.4 }}>
              <span style={{ color: '#5B8C5A', fontWeight: 800 }}>✓</span>{f}
            </li>
          ))}
        </ul>
        {isManager
          ? <div style={{ fontSize: 12.5, color: 'rgba(43,38,32,.5)' }}>Pedile al dueño de la cuenta que mejore el plan.</div>
          : <button onClick={onChoosePlan} style={{ background: '#C75D3A', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 24px', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>Ver planes</button>}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function AnalyticsTab({ analyticsData, cards, isManager = false, onChoosePlan, onOpenCustomer }: {
  analyticsData?: any; cards?: any[]; isManager?: boolean
  onChoosePlan: () => void
  onOpenCustomer?: (email: string) => void
}) {
  const { can } = usePlan()
  const fullAnalytics = can('analyticsLevel')
  const [range, setRange] = useState<Range>('30d')
  const activeCards: CardDesign[] = (cards || []).filter((c: any) => c.isActive)
  const [selectedCardId, setSelectedCardId] = useState<string>('all')
  const selectedCard = activeCards.find(c => c.id === selectedCardId) || null
  const cardQuery = selectedCard ? selectedCard.id : ''

  // ── /analytics/detailed (depende del rango y de la tarjeta) ──
  const [detailed, setDetailed] = useState<Detailed | null>(null)
  const [detailedKey, setDetailedKey] = useState('')
  const wantedDetailedKey = `${range}|${cardQuery}`
  const detailedLoading = detailedKey !== wantedDetailedKey
  useEffect(() => {
    const businessId = localStorage.getItem('stampa_business_id')
    if (!businessId || !fullAnalytics) return
    let cancelled = false
    const params = new URLSearchParams({ range })
    if (cardQuery) params.set('cardId', cardQuery)
    fetch(`${BASE_URL}/api/businesses/${businessId}/analytics/detailed?${params.toString()}`, {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('stampa_token') }
    })
      .then(r => r.json())
      .then(d => { if (!cancelled) { setDetailed(d); setDetailedKey(`${range}|${cardQuery}`) } })
      .catch(err => { console.error('Error loading detailed analytics:', err); if (!cancelled) setDetailedKey(`${range}|${cardQuery}`) })
    return () => { cancelled = true }
  }, [range, cardQuery, fullAnalytics])

  // ── /analytics (estado actual; depende solo de la tarjeta) ──
  // Con "Todas" alcanza con lo que ya cargó el dashboard.
  const [cardMetrics, setCardMetrics] = useState<{ id: string; data: any } | null>(null)
  useEffect(() => {
    const businessId = localStorage.getItem('stampa_business_id')
    if (!businessId || !cardQuery || !fullAnalytics) return
    let cancelled = false
    fetch(`${BASE_URL}/api/businesses/${businessId}/analytics?cardId=${cardQuery}`, {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('stampa_token') }
    })
      .then(r => r.json())
      .then(d => { if (!cancelled) setCardMetrics({ id: cardQuery, data: d }) })
      .catch(err => console.error('Error loading analytics:', err))
    return () => { cancelled = true }
  }, [cardQuery, fullAnalytics])
  const m = cardQuery ? (cardMetrics?.id === cardQuery ? cardMetrics.data : null) : analyticsData
  const metricsLoading = !m

  // ── Exportar CSV ──
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  async function exportCsv() {
    const businessId = localStorage.getItem('stampa_business_id')
    if (!businessId) return
    setExporting(true); setExportError('')
    try {
      const params = new URLSearchParams({ range })
      if (cardQuery) params.set('cardId', cardQuery)
      const res = await fetch(`${BASE_URL}/api/businesses/${businessId}/analytics/export?${params.toString()}`, {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('stampa_token') }
      })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const name = /filename="([^"]+)"/.exec(res.headers.get('Content-Disposition') || '')?.[1] || `stampa-${range}.csv`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = name
      document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch {
      setExportError('No pudimos generar el archivo. Probá de nuevo.')
    } finally {
      setExporting(false)
    }
  }

  if (!fullAnalytics) return (
    <>
      <style>{`.an-content{flex:1;overflow-y:auto;padding:20px 24px;display:flex;flex-direction:column;} .an-card{background:#FFFFFF;border:1px solid rgba(43,38,32,.07);border-radius:14px;box-shadow:0 1px 8px rgba(43,38,32,.04);} @media(max-width:768px){.an-content{padding:14px 16px;}}`}</style>
      <AnalyticsLocked isManager={isManager} onChoosePlan={onChoosePlan} />
    </>
  )

  // ── Tipos en juego (una tarjeta o todas) ──
  const types: CardType[] = selectedCard ? [selectedCard.type]
    : (m?.cardTypes?.length ? m.cardTypes : [...new Set(activeCards.map(c => c.type))])
  const chart = CHART[selectedCard ? selectedCard.type : (types.length === 1 ? types[0] : 'all')]
  const multiType = !selectedCard && types.length > 1

  const segTotal = (m?.active ?? 0) + (m?.inactive ?? 0)
  const pctOf = (v: number) => segTotal > 0 ? `${Math.round((v / segTotal) * 100)}%` : '0%'

  const PROGRAM = ([
    { v: `${m?.recurringRate ?? 0}%`, l: 'Clientes que volvieron', sub: 'vinieron 2 veces o más', color: '#5B8C5A' },
    types.some(t => t !== 'membership') && { v: `${m?.redemptionRate ?? 0}%`, l: 'Tasa de canje', sub: 'canjearon al menos una vez', color: '#C75D3A' },
    types.includes('stamp') && m?.avgStampProgress != null && { v: `${m.avgStampProgress}%`, l: 'Progreso promedio', sub: 'de la tarjeta de sellos', color: '#185FA5' },
    types.includes('stamp') && { v: `${m?.nearPrize ?? 0}`, l: 'A 1–2 sellos del premio', sub: `${m?.toDeliver ?? 0} con la tarjeta completa`, color: '#9C7530' },
    types.includes('points') && { v: `${m?.canRedeem ?? 0}`, l: 'Pueden canjear un premio', sub: 'ya les alcanzan los puntos', color: '#9C7530' },
    types.includes('membership') && { v: `${m?.nearLevel ?? 0}`, l: 'Cerca de subir de nivel', sub: 'a 2 visitas o menos', color: '#533FB7' },
  ].filter(Boolean)) as { v: string; l: string; sub: string; color: string }[]

  const inactiveDays = m?.inactiveDays ?? 60
  const SEGMENTS = [
    { label: 'Activos',          desc: `Vinieron en los últimos ${inactiveDays} días`, color: '#5B8C5A', bg: 'rgba(91,140,90,.1)',  val: m?.active ?? 0,       pct: true },
    { label: 'Inactivos',        desc: `Más de ${inactiveDays} días sin venir`,        color: '#B23B3B', bg: 'rgba(178,59,59,.08)', val: m?.inactive ?? 0,     pct: true },
    { label: 'Nuevos este mes',  desc: 'Se registraron este mes',                       color: '#185FA5', bg: 'rgba(24,95,165,.1)',  val: m?.newThisMonth ?? 0, pct: false },
    { label: 'Con Apple Wallet', desc: 'Guardaron la tarjeta en el iPhone',             color: '#533FB7', bg: 'rgba(83,63,183,.08)', val: m?.withDevice ?? 0,   pct: false },
  ]

  const d = detailedLoading ? null : detailed
  const Loading = () => <div className="an-empty-note an-loading">Cargando…</div>
  const chartTip = (b: Bucket, v: number) => {
    if (!multiType) return `${b.label} · ${v} ${chart.unit}`
    const parts = [
      b.stamp ? `${b.stamp} sello${b.stamp === 1 ? '' : 's'}` : null,
      b.points ? `${b.points} con puntos` : null,
      b.visit ? `${b.visit} visita${b.visit === 1 ? '' : 's'}` : null,
      b.redeem ? `${b.redeem} canje${b.redeem === 1 ? '' : 's'}` : null,
    ].filter(Boolean)
    return `${b.label} · ${parts.length ? parts.join(' · ') : 'sin movimientos'}`
  }
  const chartEmpty = !d || d.visitsOverTime.every(b => !Number(b[chart.key]))
  const freqMax = Math.max(1, ...(d?.frequency.distribution ?? []).map(b => b.count))
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

  return (
    <>
      <style>{`
        .an-content{flex:1;overflow-y:auto;padding:20px 24px;display:flex;flex-direction:column;gap:14px;}
        .an-lbl{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:rgba(43,38,32,.38);font-weight:600;display:flex;align-items:center;gap:10px;}
        .an-lbl::after{content:'';flex:1;height:1px;background:rgba(43,38,32,.1);}
        .an-block-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:6px;}
        .an-block-title{font-family:'Plus Jakarta Sans',sans-serif;font-size:16px;font-weight:800;color:#2B2620;}
        .an-block-sub{font-size:11.5px;color:rgba(43,38,32,.45);margin-top:2px;}
        .an-block-tools{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
        .an-card{background:#FFFFFF;border:1px solid rgba(43,38,32,.07);border-radius:14px;padding:16px;box-shadow:0 1px 8px rgba(43,38,32,.04);min-width:0;}
        .an-card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap;margin-bottom:12px;}
        .an-ctitle{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:13px;color:#2B2620;margin-bottom:2px;}
        .an-csub{font-size:11px;color:rgba(43,38,32,.45);margin-bottom:12px;}
        .an-card-head .an-csub{margin-bottom:0;}
        .an-empty-note{font-size:12px;color:rgba(43,38,32,.4);padding:20px 0;text-align:center;}
        .an-loading{animation:anPulse 1.2s ease-in-out infinite;}
        @keyframes anPulse{0%,100%{opacity:.4}50%{opacity:1}}
        .an-skel{background:rgba(43,38,32,.07);border-radius:6px;animation:anPulse 1.2s ease-in-out infinite;}

        /* ── Toolbar ── */
        .an-card-selector{display:flex;gap:6px;flex-wrap:wrap;}
        .an-card-pill{display:flex;align-items:center;gap:6px;font-size:12px;padding:7px 14px;border-radius:20px;border:1.5px solid rgba(43,38,32,.12);background:#FFFFFF;color:rgba(43,38,32,.55);cursor:pointer;transition:all .15s;font-family:'Inter',sans-serif;}
        .an-card-pill:hover{border-color:rgba(43,38,32,.25);}
        .an-card-pill--on{background:#1B412F;border-color:#1B412F;color:#F7F0E4;font-weight:600;}
        .an-rpill{font-size:11px;padding:6px 12px;border-radius:20px;border:1px solid rgba(43,38,32,.12);background:#FFFFFF;color:rgba(43,38,32,.5);cursor:pointer;font-family:'Inter',sans-serif;transition:all .15s;}
        .an-rpill:hover{border-color:rgba(43,38,32,.25);}
        .an-rpill--on{background:rgba(199,93,58,.1);border-color:#C75D3A;color:#C75D3A;font-weight:600;}
        .an-export{display:flex;align-items:center;gap:6px;font-size:11.5px;font-weight:600;padding:6px 12px;border-radius:20px;border:1px solid rgba(43,38,32,.15);background:#fff;color:#2B2620;cursor:pointer;font-family:'Inter',sans-serif;}
        .an-export:hover{border-color:rgba(43,38,32,.3);}
        .an-export:disabled{opacity:.6;cursor:default;}
        .an-export-err{font-size:11px;color:#B23B3B;}

        /* ── Grids ── */
        .an-2col{display:grid;grid-template-columns:1.7fr 1fr;gap:12px;}
        .an-2even{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
        .an-program{display:grid;grid-template-columns:repeat(var(--cols),1fr);gap:12px;}
        .an-4col{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}

        /* ── Métricas ── */
        .an-stat-now{font-family:'Plus Jakarta Sans',sans-serif;font-size:24px;font-weight:800;color:#2B2620;}
        .an-stat-name{font-size:12px;font-weight:600;color:#2B2620;margin-top:4px;}
        .an-stat-label{font-size:10.5px;color:rgba(43,38,32,.45);}
        .an-stat-prev{font-size:11px;color:rgba(43,38,32,.35);margin-left:5px;}
        .an-stat-delta{font-size:11px;font-weight:700;margin-top:5px;}
        .an-delta-up{color:#5B8C5A;}
        .an-delta-down{color:#B23B3B;}
        .an-delta-flat{color:rgba(43,38,32,.4);}
        .an-comp{display:flex;flex-direction:column;gap:10px;}
        .an-comp .an-card{padding:12px 14px;}

        /* ── Segmentos ── */
        .an-seg-card{border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:4px;}
        .an-seg-top{display:flex;align-items:baseline;gap:5px;}
        .an-seg-val{font-family:'Plus Jakarta Sans',sans-serif;font-size:24px;font-weight:800;}
        .an-seg-pct{font-size:10px;font-weight:600;opacity:.7;}
        .an-seg-name{font-size:12px;font-weight:700;}
        .an-seg-desc{font-size:10px;opacity:.7;line-height:1.3;}

        /* ── Funnel ── */
        .an-funnel{display:flex;flex-direction:column;gap:6px;}
        .an-fstage{display:flex;flex-direction:column;gap:5px;}
        .an-fconv{display:flex;align-items:center;gap:8px;}
        .an-fconv-line{flex:1;height:1px;background:rgba(43,38,32,.08);}
        .an-fconv-pct{font-size:10px;color:#5B8C5A;font-weight:700;white-space:nowrap;flex-shrink:0;}
        .an-fbar-wrap{height:11px;background:rgba(43,38,32,.06);border-radius:6px;overflow:hidden;}
        .an-fbar{height:100%;background:linear-gradient(90deg,#C75D3A,#D4A24C);border-radius:6px;transition:width .4s;}
        .an-finfo{display:flex;justify-content:space-between;margin-top:1px;}
        .an-fname{font-size:11px;color:rgba(43,38,32,.55);}
        .an-fval{font-size:11px;font-weight:700;color:#2B2620;}

        /* ── Barras ── */
        .an-bars-wrap{display:flex;gap:8px;height:170px;}
        .an-bars-axis{display:flex;flex-direction:column;justify-content:space-between;font-size:9.5px;color:rgba(43,38,32,.35);padding-bottom:20px;text-align:right;min-width:18px;}
        .an-bars{flex:1;display:flex;align-items:stretch;gap:6px;min-width:0;}
        .an-bar-col{flex:1;display:flex;flex-direction:column;align-items:center;position:relative;cursor:default;min-width:0;}
        .an-bar-track{flex:1;width:100%;display:flex;align-items:flex-end;justify-content:center;}
        .an-bar-fill{width:100%;max-width:38px;min-height:2px;background:rgba(199,93,58,.55);border-radius:5px 5px 2px 2px;transition:background .15s;}
        .an-bar-fill--on{background:#C75D3A;}
        .an-bar-label{font-size:9.5px;color:rgba(43,38,32,.4);margin-top:6px;height:14px;white-space:nowrap;}
        .an-bar-tip{position:absolute;bottom:calc(100% - 6px);left:50%;transform:translateX(-50%);background:#2B2620;color:#F7F0E4;font-size:11px;padding:6px 9px;border-radius:7px;white-space:nowrap;z-index:5;pointer-events:none;}

        /* ── ¿Cuándo viene tu gente? ── */
        .an-seg-switch{display:flex;background:rgba(43,38,32,.05);border-radius:10px;padding:3px;gap:2px;}
        .an-seg-switch button{border:none;background:none;font-size:11.5px;padding:5px 11px;border-radius:8px;color:rgba(43,38,32,.55);cursor:pointer;font-family:'Inter',sans-serif;}
        .an-seg-switch button.on{background:#fff;color:#2B2620;font-weight:600;box-shadow:0 1px 3px rgba(43,38,32,.12);}
        .an-when-insights{display:flex;flex-direction:column;gap:6px;margin-bottom:14px;font-size:12.5px;color:#2B2620;line-height:1.45;}
        .an-when-dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:8px;vertical-align:middle;}
        .an-when-dot--up{background:#5B8C5A;}
        .an-when-dot--down{background:#D4A24C;}
        .an-when-scroll{overflow-x:auto;}
        .an-when{display:grid;gap:4px;align-items:center;min-width:min-content;}
        .an-when-h{font-size:9.5px;color:rgba(43,38,32,.4);text-align:center;white-space:nowrap;}
        .an-when-d{font-size:10px;color:rgba(43,38,32,.5);font-weight:600;}
        .an-when-cell{height:24px;border-radius:5px;}
        .an-hlegend{display:flex;align-items:center;gap:8px;margin-top:10px;font-size:9.5px;color:rgba(43,38,32,.4);}
        .an-hscale{display:flex;gap:3px;}
        .an-hsdot{width:14px;height:10px;border-radius:2px;}

        /* ── Rankings ── */
        .an-tr{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(43,38,32,.06);}
        .an-tr:last-child{border-bottom:none;}
        .an-trk{width:22px;height:22px;border-radius:7px;background:rgba(43,38,32,.06);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:rgba(43,38,32,.4);flex-shrink:0;}
        .an-trk--1{background:rgba(199,93,58,.12);color:#C75D3A;}
        .an-tn{font-size:12px;color:#2B2620;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .an-tn--link{background:none;border:none;padding:0;cursor:pointer;font-family:inherit;text-align:left;}
        .an-tn--link:hover{color:#C75D3A;text-decoration:underline;}
        .an-tv{font-size:12px;font-weight:700;color:#C75D3A;white-space:nowrap;}
        .an-tbar{height:4px;background:rgba(43,38,32,.06);border-radius:2px;overflow:hidden;margin-top:3px;}
        .an-tfill{height:100%;background:linear-gradient(90deg,#C75D3A,#D4A24C);border-radius:2px;}
        .an-tsub{font-size:10.5px;color:rgba(43,38,32,.45);margin-top:3px;}

        /* ── Frecuencia ── */
        .an-freq-stat{font-family:'Plus Jakarta Sans',sans-serif;font-size:28px;font-weight:800;color:#2B2620;}
        .an-freq-unit{font-size:13px;color:rgba(43,38,32,.45);}
        .an-freq-trend{font-size:11px;font-weight:700;margin-bottom:12px;}
        .an-freq-bars{display:flex;flex-direction:column;gap:6px;}
        .an-freq-row{display:flex;align-items:center;gap:8px;}
        .an-freq-lbl{font-size:10.5px;color:rgba(43,38,32,.5);width:92px;flex-shrink:0;}
        .an-freq-bar{flex:1;height:9px;background:rgba(43,38,32,.06);border-radius:4px;overflow:hidden;}
        .an-freq-fill{height:100%;background:linear-gradient(90deg,#185FA5,#5B8C5A);border-radius:4px;}
        .an-freq-cnt{font-size:10.5px;font-weight:600;color:rgba(43,38,32,.5);width:22px;text-align:right;}

        @media(max-width:900px){
          .an-2col,.an-2even{grid-template-columns:1fr;}
          .an-4col,.an-program{grid-template-columns:1fr 1fr;}
        }
        @media(max-width:768px){
          .an-content{padding:14px 16px;}
          .an-bars[data-many] .an-bar-col:nth-child(even) .an-bar-label{visibility:hidden;}
        }
        @media(max-width:480px){
          .an-rpill{font-size:10.5px;padding:5px 9px;}
          .an-card-pill{font-size:11px;padding:6px 10px;}
          .an-bar-label{font-size:8.5px;}
        }
      `}</style>

      <div className="an-content">

        {/* ── Tarjeta ── */}
        {activeCards.length > 1 && (
          <div className="an-card-selector">
            <button className={`an-card-pill${!selectedCard ? ' an-card-pill--on' : ''}`} onClick={() => setSelectedCardId('all')}>Todas las tarjetas</button>
            {activeCards.map(card => (
              <button key={card.id} className={`an-card-pill${selectedCard?.id === card.id ? ' an-card-pill--on' : ''}`} onClick={() => setSelectedCardId(card.id)}>
                {TYPE_ICONS[card.type]} {card.name}
              </button>
            ))}
          </div>
        )}

        {/* ═══════════════ HOY ═══════════════ */}
        <div className="an-block-head">
          <div>
            <div className="an-block-title">Hoy</div>
            <div className="an-block-sub">Cómo está tu programa ahora y desde que empezaste — no depende de fechas</div>
          </div>
        </div>

        <div className="an-program" style={{ ['--cols' as any]: PROGRAM.length <= 4 ? PROGRAM.length : 3 }}>
          {PROGRAM.map(p => (
            <div key={p.l} className="an-card" style={{ borderTop: `3px solid ${p.color}` }}>
              {metricsLoading
                ? <div className="an-skel" style={{ width: 54, height: 26 }} />
                : <div className="an-stat-now" style={{ color: p.color }}>{p.v}</div>}
              <div className="an-stat-name">{p.l}</div>
              <div className="an-stat-label">{p.sub}</div>
            </div>
          ))}
        </div>

        <div className="an-4col">
          {SEGMENTS.map(({ label, desc, color, bg, val, pct }) => (
            <div key={label} className="an-card an-seg-card" style={{ background: bg, border: `1px solid ${color}22` }}>
              <div className="an-seg-top">
                {metricsLoading
                  ? <div className="an-skel" style={{ width: 36, height: 24 }} />
                  : <span className="an-seg-val" style={{ color }}>{val.toLocaleString('es-AR')}</span>}
                {pct && !metricsLoading && <span className="an-seg-pct" style={{ color }}>({pctOf(val)})</span>}
              </div>
              <div className="an-seg-name" style={{ color }}>{label}</div>
              <div className="an-seg-desc" style={{ color }}>{desc}</div>
            </div>
          ))}
        </div>

        <div className={types.includes('membership') ? 'an-2even' : ''}>
          <div className="an-card">
            <div className="an-ctitle">Funnel de tu programa</div>
            <div className="an-csub">De cada etapa, cuántos llegaron a la siguiente (desde que empezaste)</div>
            {!d ? <Loading /> : d.funnel.length > 0 && d.funnel[0].value > 0
              ? <Funnel data={d.funnel} />
              : <div className="an-empty-note">Todavía no hay clientes registrados.</div>}
          </div>
          {types.includes('membership') && (
            <div className="an-card">
              <div className="an-ctitle">Clientes por nivel</div>
              <div className="an-csub">Miembros en cada nivel hoy</div>
              {metricsLoading ? <Loading /> : <TierDistribution tiers={m?.tierDistribution ?? []} />}
            </div>
          )}
        </div>

        <div className="an-2even">
          <div className="an-card">
            <div className="an-ctitle">Clientes más fieles</div>
            <div className="an-csub">Por visitas totales, desde que empezaste</div>
            {!d ? <Loading /> : <Ranking rows={d.mostLoyal} value={r => r.totalVisits} unit={n => plural(n, 'visita', 'visitas')}
              sub={r => `última visita ${r.lastVisit}`} onOpen={onOpenCustomer} empty="Todavía no hay visitas registradas." />}
          </div>
          <div className="an-card">
            <div className="an-ctitle">Los que más canjearon</div>
            <div className="an-csub">Premios entregados, desde que empezaste</div>
            {!d ? <Loading /> : types.every(t => t === 'membership')
              ? <div className="an-empty-note">La membresía no tiene canjes: los beneficios se aplican por nivel.</div>
              : <Ranking rows={d.topRedeemers} value={r => r.redemptions} unit={n => plural(n, 'canje', 'canjes')}
                  onOpen={onOpenCustomer} empty="Todavía no hay premios entregados." />}
          </div>
        </div>

        {/* ═══════════════ EN EL PERÍODO ═══════════════ */}
        <div className="an-block-head" style={{ marginTop: 14 }}>
          <div>
            <div className="an-block-title">En el período</div>
            <div className="an-block-sub">Lo que pasó en los últimos {range.replace('d', '')} días, comparado con los {range.replace('d', '')} anteriores</div>
          </div>
          <div className="an-block-tools">
            {RANGES.map(({ key, label }) => (
              <button key={key} className={`an-rpill${range === key ? ' an-rpill--on' : ''}`} onClick={() => setRange(key)}>{label}</button>
            ))}
            <button className="an-export" onClick={exportCsv} disabled={exporting} title="Descargar los movimientos del período para Excel">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {exporting ? 'Generando…' : 'Exportar CSV'}
            </button>
          </div>
        </div>
        {exportError && <div className="an-export-err">{exportError}</div>}

        <div className="an-2col">
          <div className="an-card">
            <div className="an-ctitle">{chart.title}</div>
            <div className="an-csub">{range === '7d' ? 'Por día' : 'Por semana'} · pasá el mouse por una barra para ver el detalle</div>
            {!d ? <Loading /> : chartEmpty
              ? <div className="an-empty-note">Todavía no hay movimientos en este período. Aparecen cuando escaneás tarjetas con la app.</div>
              : <BarChart data={d.visitsOverTime} valueKey={chart.key} tooltip={chartTip} />}
          </div>
          <div className="an-comp">
            {(d?.comparison ?? [{ label: 'Nuevos clientes' }, { label: 'Visitas' }, { label: 'Premios entregados' }] as any[]).map((item: CompItem) => {
              const delta = d ? pctChange(item.current, item.previous) : null
              return (
                <div key={item.label} className="an-card">
                  <div className="an-stat-label">{item.label}</div>
                  {!d
                    ? <div className="an-skel" style={{ width: 70, height: 22, marginTop: 4 }} />
                    : <>
                        <div>
                          <span className="an-stat-now">{item.current.toLocaleString('es-AR')}</span>
                          <span className="an-stat-prev">vs {item.previous.toLocaleString('es-AR')} antes</span>
                        </div>
                        <div className={`an-stat-delta ${delta == null || delta === 0 ? 'an-delta-flat' : delta > 0 ? 'an-delta-up' : 'an-delta-down'}`}>
                          {delta == null ? (item.current > 0 ? 'Nuevo en este período' : 'Sin cambios') : delta === 0 ? 'Igual que el período anterior' : `${delta > 0 ? '↑' : '↓'} ${Math.abs(delta)}% vs período anterior`}
                        </div>
                      </>}
                </div>
              )
            })}
          </div>
        </div>

        {!d ? <div className="an-card"><div className="an-ctitle">¿Cuándo viene tu gente?</div><Loading /></div> : <WhenHeatmap hourly={d.hourly} />}

        <div className="an-2even">
          <div className="an-card">
            <div className="an-ctitle">Más activos del período</div>
            <div className="an-csub">Por cantidad de visitas en los últimos {range.replace('d', '')} días</div>
            {!d ? <Loading /> : <Ranking rows={d.topCustomers} value={r => r.visits} unit={n => plural(n, 'visita', 'visitas')}
              sub={r => `${activeCards.length > 1 ? `${r.cardName} · ` : ''}${r.progress} · última visita ${r.lastVisit}`}
              onOpen={onOpenCustomer} empty="Todavía no hay visitas en este período." />}
          </div>
          <div className="an-card">
            <div className="an-ctitle">Frecuencia de visita</div>
            <div className="an-csub">Cada cuántos días vuelve un mismo cliente</div>
            {!d ? <Loading /> : d.frequency.distribution.some(b => b.count > 0) ? <>
              <div style={{ marginBottom: 4 }}>
                <span className="an-freq-stat">{d.frequency.avgDays.toLocaleString('es-AR')}</span>
                <span className="an-freq-unit"> días en promedio</span>
              </div>
              <div className={`an-freq-trend ${d.frequency.trend < 0 ? 'an-delta-up' : d.frequency.trend > 0 ? 'an-delta-down' : 'an-delta-flat'}`}>
                {d.frequency.trend < 0
                  ? `↓ ${Math.abs(d.frequency.trend).toLocaleString('es-AR')} días menos que antes — vuelven más seguido`
                  : d.frequency.trend > 0
                  ? `↑ ${d.frequency.trend.toLocaleString('es-AR')} días más que antes — tardan más en volver`
                  : 'Sin datos del período anterior para comparar'}
              </div>
              <div className="an-freq-bars">
                {d.frequency.distribution.map(b => (
                  <div key={b.label} className="an-freq-row">
                    <span className="an-freq-lbl">{b.label}</span>
                    <div className="an-freq-bar"><div className="an-freq-fill" style={{ width: `${(b.count / freqMax) * 100}%` }} /></div>
                    <span className="an-freq-cnt">{b.count}</span>
                  </div>
                ))}
              </div>
            </> : <div className="an-empty-note">Aparece cuando un mismo cliente vuelve al menos una vez en el período.</div>}
          </div>
        </div>

      </div>
    </>
  )
}
