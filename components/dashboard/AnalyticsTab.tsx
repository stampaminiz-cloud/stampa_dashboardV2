'use client'
import { Icon, type IconName } from '@/components/ui/Icon'
import { PillSelect } from '@/components/ui/PillSelect'
import React, { useState, useEffect, useRef } from 'react'
import { readCache, getJson } from '@/lib/cache'
import { withLoc } from '@/lib/location'
import { MascotLoader } from '@/components/ui/MascotLoader'
import { EmptyState, RetentionRing, ProgressDistribution, FormAnswers, CardComparison, LocationComparison, type LocationRow, type NvrBucket, type Retention, type ProgressDist, type FormAnswer as FormAnswerData, type CardRow } from './charts'
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
interface Hourly      { visits: number[][]; redeems: number[][]; signups: number[][]; weekdayCount: number[]; open?: boolean[][] | null }
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
  newVsReturning?: NvrBucket[]
  retention?: Retention
  progressByCard?: { cardId: string; name: string; type: CardType; total: number | null; segments: { label: string; count: number }[] }[]
  progressDistribution?: ProgressDist | null
  formAnswers?: FormAnswerData[]
  whatsappTaps?: { label: string; count: number }[]
  cardComparison?: CardRow[]
  locationComparison?: LocationRow[]
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
      <div className="an-bars" data-many={data.length > 8 ? '1' : undefined} data-dense={data.length > 16 ? '1' : undefined}>
        {data.map((b, i) => (
          <div key={i} className="an-bar-col" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => setHover(hover === i ? null : i)}>
            {hover === i && <div className="an-bar-tip">{tooltip(b, values[i])}</div>}
            <div className="an-bar-track">
              <div className={`an-bar-fill${hover === i ? ' an-bar-fill--on' : ''}`} style={{ height: `${(values[i] / max) * 100}%` }} />
            </div>
            {/* Con muchas barras (30 días) se muestra una etiqueta cada 5. */}
            <div className="an-bar-label">{data.length <= 16 || i % 5 === 0 || i === data.length - 1 ? b.day : ''}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── ¿Cuándo viene tu gente? ─────────────────────────────────────────────────
// Un solo gráfico de líneas: visitas, canjes y registros por horario (franjas
// de 2 hs), en promedio por día del período. Si el negocio cargó horarios, solo
// las franjas en que abre (hourly.open, del backend). Va debajo de los
// destacados, que ya dicen el momento más fuerte y el día más flojo.
const DAYS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const DAYS_SINGULAR = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
const slotLabel = (s: number) => `${s * 2}–${s * 2 + 2}`
const fmt1 = (n: number) => (Math.round(n * 10) / 10).toLocaleString('es-AR')
const LINES = [
  { key: 'visits', label: 'Visitas', unit: ['visita', 'visitas'], color: 'var(--s-pino)', width: 3 },
  { key: 'redeems', label: 'Canjes', unit: ['canje', 'canjes'], color: 'var(--s-brasa)', width: 2.5 },
  { key: 'signups', label: 'Registros', unit: ['registro', 'registros'], color: '#D4A24C', width: 2.5 },
] as const

function niceStep(max: number) {
  const raw = max / 4
  const pow = Math.pow(10, Math.floor(Math.log10(raw || 1)))
  const n = raw / pow
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * pow
}

function HoursLines({ hourly, withRedeems }: { hourly: Hourly; withRedeems: boolean }) {
  // El gráfico toma el ancho real de la tarjeta (así las letras no se agrandan
  // en pantallas anchas).
  const boxRef = useRef<HTMLDivElement>(null)
  const [boxW, setBoxW] = useState(640)
  useEffect(() => {
    const el = boxRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([e]) => setBoxW(Math.max(280, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  })
  const open = hourly.open || null
  const daysInRange = hourly.weekdayCount.reduce((a, b) => a + b, 0) || 1
  const series = LINES.filter(l => l.key !== 'redeems' || withRedeems)
  const has = (b: number) => series.some(l => hourly[l.key].some(row => row[b] > 0))
  let bands = Array.from({ length: 12 }, (_, b) => b).filter(b => (open ? open.some(row => row[b]) : false) || has(b))
  if (!open && bands.length) bands = Array.from({ length: bands[bands.length - 1] - bands[0] + 1 }, (_, i) => bands[0] + i)
  const vals = Object.fromEntries(series.map(l => [l.key, bands.map(b => hourly[l.key].reduce((a, row) => a + row[b], 0) / daysInRange)])) as Record<string, number[]>
  const empty = !bands.length || !series.some(l => vals[l.key].some(v => v > 0))

  const W = boxW, H = 240, L = 40, R = 16, T = 26, B = 30
  const max = Math.max(0.0001, ...series.flatMap(l => vals[l.key]))
  const step = niceStep(max), top = Math.ceil(max / step) * step
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step)
  const x = (i: number) => (bands.length === 1 ? (L + W - R) / 2 : L + 10 + (i * (W - L - R - 20)) / (bands.length - 1))
  const y = (v: number) => T + (1 - v / top) * (H - T - B)
  const peak = (k: string) => { const a = vals[k] || []; const i = a.indexOf(Math.max(...a)); return a[i] > 0 ? i : -1 }
  const pv = peak('visits'), pr = withRedeems ? peak('redeems') : -1

  return (
    <div className="an-card">
      <div className="an-ctitle">¿Cuándo viene tu gente?</div>
      <div className="an-csub">Promedio por día, por horario{open ? ' · solo el horario en que abrís' : ''}</div>
      {empty ? <EmptyState title="Todavía sin movimiento" text="Aparece cuando escaneás tarjetas o se registran clientes." compact /> : <>
        <div className="an-hl-legend">
          {series.map(l => <span key={l.key}><i style={{ background: l.color }} />{l.label}</span>)}
        </div>
        <div ref={boxRef}>
        <svg className="an-hlines" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img"
          aria-label={`Por horario: visitas con el pico de ${slotLabel(bands[Math.max(pv, 0)])} hs${pr >= 0 ? `, canjes de ${slotLabel(bands[pr])} hs` : ''}`}>
          {ticks.map(t => (
            <g key={t}>
              <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="rgba(34,32,27,.08)" />
              <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="rgba(34,32,27,.5)">{fmt1(t)}</text>
            </g>
          ))}
          {bands.map((b, i) => <text key={b} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="rgba(34,32,27,.55)">{slotLabel(b)}</text>)}
          {series.map(l => (
            <g key={l.key}>
              <polyline fill="none" stroke={l.color} strokeWidth={l.width} strokeLinejoin="round" strokeLinecap="round"
                points={vals[l.key].map((v, i) => `${x(i)},${y(v)}`).join(' ')} />
              {vals[l.key].map((v, i) => (
                <circle key={i} cx={x(i)} cy={y(v)} r={l.key === 'visits' && i === pv ? 5 : 3} fill={l.color}>
                  <title>{`${slotLabel(bands[i])} hs · ${fmt1(v)} ${v === 1 ? l.unit[0] : l.unit[1]} por día`}</title>
                </circle>
              ))}
            </g>
          ))}
          {pv >= 0 && <text x={x(pv)} y={y(vals.visits[pv]) - 11} textAnchor="middle" fontSize="11.5" fontWeight="600" fill="var(--s-pino)">{fmt1(vals.visits[pv])} visitas</text>}
          {pr >= 0 && <text x={x(pr)} y={y(vals.redeems[pr]) + (pr === pv ? 20 : -11)} textAnchor="middle" fontSize="11.5" fontWeight="600" fill="var(--s-brasa-2)">{fmt1(vals.redeems[pr])} canjes</text>}
        </svg>
        </div>
      </>}
    </div>
  )
}

// Íconos de los datos destacados (sistema: components/ui/Icon).
function HlIcon({ name }: { name: 'repeat' | 'flame' | 'moon' }) {
  return <Icon name={name === 'repeat' ? 'vuelve' : name === 'flame' ? 'fuerte' : 'flojo'} size={16} />
}

// Misma escala que ProgressDistribution (más oscuro = más cerca del premio).
const PSEQ = ['#F3D6CB', '#E6AE98', '#D98565', '#C75D3A', '#8E3B20']

// ─── Funnel ───────────────────────────────────────────────────────────────────
// Barras de un solo color; abajo de cada una, en gris, el porcentaje sobre la
// etapa anterior dicho con palabras ("97% de los registrados").
const FUNNEL_NAMES = ['Se registraron', 'Primera visita', 'Volvieron', 'Canjearon']
const FUNNEL_OF = ['', 'de los registrados', 'de los que vinieron', 'de los que volvieron']
function Funnel({ data }: { data: FunnelStage[] }) {
  const max = data[0]?.value || 1
  return (
    <div className="an-funnel">
      {data.map((stage, i) => {
        const conv = i > 0 && data[i - 1].value > 0 ? Math.round((stage.value / data[i - 1].value) * 100) : null
        return (
          <div key={stage.stage} className="an-fstage">
            <span className="an-fname">{FUNNEL_NAMES[i] || stage.stage}</span>
            <div className="an-fbar-wrap"><div className="an-fbar" style={{ width: `${Math.round((stage.value / max) * 100)}%` }} /></div>
            <span className="an-fval">{stage.value.toLocaleString('es-AR')}</span>
            {conv !== null && <span className="an-fconv">{conv}% {FUNNEL_OF[i]}</span>}
          </div>
        )
      })}
    </div>
  )
}

// ─── Clientes por nivel (membresía) ───────────────────────────────────────────
// Una barra dividida por nivel y la leyenda en una fila (compacto, se
// acomoda solo de 2 a 6 niveles). Color de cada nivel: el más "con color" de
// sus dos colores (ej. Oro = dorado, Black = negro).
function tierSwatch(t: { color: string; bg: string }) {
  const rgb = (h: string) => { const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})/i.exec(h || ''); return m ? [m[1], m[2], m[3]].map(x => parseInt(x, 16)) : null }
  const a = rgb(t.bg), b = rgb(t.color)
  if (!a || !b) return b ? t.color : a ? t.bg : '#C75D3A'
  const chroma = (c: number[]) => Math.max(...c) - Math.min(...c)
  const lum = (c: number[]) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]
  if (chroma(a) < 30 && chroma(b) < 30) return lum(a) < lum(b) ? t.bg : t.color
  return chroma(a) >= chroma(b) ? t.bg : t.color
}
function TierDistribution({ tiers }: { tiers: { name: string; color: string; bg: string; count: number }[] }) {
  if (!tiers.length) return <EmptyState title="Todavía sin miembros" compact />
  const total = tiers.reduce((a, t) => a + t.count, 0)
  return (
    <div className="an-tiers">
      <div className="an-tiers-bar" role="img" aria-label={tiers.map(t => `${t.name}: ${t.count}`).join(', ')}>
        {total === 0
          ? <span style={{ flex: 1, background: 'rgba(43,38,32,.07)' }} />
          : tiers.filter(t => t.count > 0).map(t => <span key={t.name} title={`${t.name}: ${t.count}`} style={{ flex: t.count, background: tierSwatch(t) }} />)}
      </div>
      <div className="an-tiers-legend">
        {tiers.map(t => (
          <span key={t.name} className="an-tiers-item">
            <i style={{ background: tierSwatch(t) }} />{t.name} <strong>{t.count}</strong>
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Ranking de clientes (nombres clickeables) ───────────────────────────────
function Ranking<T extends Person>({ rows, value, unit, sub, onOpen, empty }: {
  rows: T[]; value: (r: T) => number; unit: (n: number) => string; sub?: (r: T) => string
  onOpen?: (email: string) => void; empty: string
}) {
  if (!rows.length) return <EmptyState title={empty} />
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
    'Recorrido: registro, primera visita, vuelve y premio',
    'Tus clientes más fieles y los que más canjean',
    'Exportar los movimientos a Excel (CSV)',
  ]
  return (
    <div className="an-content">
      <div className="an-card" style={{ padding: '36px 28px', textAlign: 'center', maxWidth: 560, margin: '24px auto', width: '100%' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--s-brasa-suave)', color: 'var(--s-brasa)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <Icon name="candado" size={20} />
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 800, color: 'var(--s-tinta)', marginBottom: 6 }}>Analítica está disponible desde Growth</div>
        <div style={{ fontSize: 13, color: 'rgba(43,38,32,.55)', marginBottom: 18, lineHeight: 1.55 }}>En Inicio tenés el resumen del día. Con Growth ves cómo rinde tu programa en detalle:</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 22px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FEATURES.map(f => (
            <li key={f} style={{ display: 'flex', gap: 9, fontSize: 13, color: 'var(--s-tinta)', lineHeight: 1.4 }}>
              <span style={{ color: 'var(--s-tinta-3)', display: 'inline-flex' }}><Icon name="listo" size={14} /></span>{f}
            </li>
          ))}
        </ul>
        {isManager
          ? <div style={{ fontSize: 12.5, color: 'rgba(43,38,32,.5)' }}>Pedile al dueño de la cuenta que mejore el plan.</div>
          : <button onClick={onChoosePlan} style={{ background: 'var(--s-brasa)', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 24px', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>Ver planes</button>}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function AnalyticsTab({ analyticsData, cards, isManager = false, onChoosePlan, onOpenCustomer, onNotifyAnswer }: {
  analyticsData?: any; cards?: any[]; isManager?: boolean
  onChoosePlan: () => void
  onOpenCustomer?: (email: string) => void
  onNotifyAnswer?: (fieldId: string, answer: string) => void
}) {
  const { can } = usePlan()
  const fullAnalytics = can('analyticsLevel')
  const [range, setRange] = useState<Range>('30d')
  // Sección elegida (se recuerda entre visitas) y opciones de cada una.
  // Programa: ¿funciona mi tarjeta? (lo que antes era Resumen, Horarios y
  // Tarjetas). Clientes: ¿quiénes son y cuáles vuelven? Pedidos se suma
  // cuando el negocio los use (docs/whatsapp-y-pedidos.md del backend).
  type Section = 'program' | 'customers'
  const [section, setSection] = useState<Section>(() => {
    try { return localStorage.getItem('stampa_analytics_section') === 'customers' ? 'customers' : 'program' } catch { return 'program' }
  })
  const pickSection = (sec: Section) => { setSection(sec); try { localStorage.setItem('stampa_analytics_section', sec) } catch { /* sin storage */ } }
  const [rankScope, setRankScope] = useState<'period' | 'all' | 'redeems'>('period')
  const activeCards: CardDesign[] = (cards || []).filter((c: any) => c.isActive)
  const [selectedCardId, setSelectedCardId] = useState<string>('all')
  const selectedCard = activeCards.find(c => c.id === selectedCardId) || null
  const cardQuery = selectedCard ? selectedCard.id : ''

  // ── /analytics/detailed (depende del rango y de la tarjeta) ──
  // Lo último cargado (o precargado por Inicio) se muestra al instante y se
  // actualiza en silencio (lib/cache).
  const detailedPath = (r: string, c: string) => {
    const params = new URLSearchParams({ range: r })
    if (c) params.set('cardId', c)
    return withLoc(`/api/businesses/${typeof window !== 'undefined' ? localStorage.getItem('stampa_business_id') : ''}/analytics/detailed?${params.toString()}`)
  }
  // Si la respuesta no trae lo esperado (error del servidor, o un backend
  // viejo durante un deploy) se muestra el error en vez de romper la pantalla.
  const isDetailed = (d: any): d is Detailed => !!d?.hourly?.visits && Array.isArray(d.visitsOverTime) && Array.isArray(d.funnel)
  const [detailed, setDetailed] = useState<Detailed | null>(() => { const c = readCache<Detailed>(detailedPath(range, cardQuery)); return isDetailed(c) ? c : null })
  const [detailedKey, setDetailedKey] = useState(() => (detailed ? `${range}|${cardQuery}` : ''))
  const [detailedError, setDetailedError] = useState(false)
  const [retry, setRetry] = useState(0)
  const wantedDetailedKey = `${range}|${cardQuery}`
  const detailedLoading = detailedKey !== wantedDetailedKey
  useEffect(() => {
    const businessId = localStorage.getItem('stampa_business_id')
    if (!businessId || !fullAnalytics) return
    let cancelled = false
    setDetailedError(false)
    const path = detailedPath(range, cardQuery)
    const cached = readCache(path)
    if (isDetailed(cached)) { setDetailed(cached); setDetailedKey(`${range}|${cardQuery}`) }
    getJson(path)
      .then(d => { if (!isDetailed(d)) throw new Error('detailed: respuesta inesperada'); return d })
      .then(d => { if (!cancelled) { setDetailed(d); setDetailedKey(`${range}|${cardQuery}`) } })
      .catch(err => {
        console.error('Error loading detailed analytics:', err)
        // Si ya se estaba mostrando lo guardado, se queda eso.
        if (!cancelled && !isDetailed(cached)) { setDetailed(null); setDetailedError(true); setDetailedKey(`${range}|${cardQuery}`) }
      })
    return () => { cancelled = true }
  }, [range, cardQuery, fullAnalytics, retry])

  // ── /analytics (estado actual; depende solo de la tarjeta) ──
  // Con "Todas" alcanza con lo que ya cargó el dashboard.
  const [cardMetrics, setCardMetrics] = useState<{ id: string; data: any } | null>(null)
  useEffect(() => {
    const businessId = localStorage.getItem('stampa_business_id')
    if (!businessId || !cardQuery || !fullAnalytics) return
    let cancelled = false
    const path = withLoc(`/api/businesses/${businessId}/analytics?cardId=${cardQuery}`)
    const cached = readCache(path)
    if (cached) setCardMetrics({ id: cardQuery, data: cached })
    getJson(path)
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
      const res = await fetch(`${BASE_URL}${withLoc(`/api/businesses/${businessId}/analytics/export?${params.toString()}`)}`, {
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
      <style>{`.an-content{flex:1;overflow-y:auto;padding:20px 24px;display:flex;flex-direction:column;} .an-card{background:#FFFFFF;border:1px solid rgba(34,32,27,.07);border-radius:14px;box-shadow:0 1px 8px rgba(34,32,27,.04);} @media(max-width:768px){.an-content{padding:14px 16px;}}`}</style>
      <AnalyticsLocked isManager={isManager} onChoosePlan={onChoosePlan} />
    </>
  )

  // ── Tipos en juego (una tarjeta o todas) ──
  const types: CardType[] = selectedCard ? [selectedCard.type]
    : (m?.cardTypes?.length ? m.cardTypes : [...new Set(activeCards.map(c => c.type))])
  const chart = CHART[selectedCard ? selectedCard.type : (types.length === 1 ? types[0] : 'all')]
  const multiType = !selectedCard && types.length > 1

  const segTotal = (m?.active ?? 0) + (m?.inactive ?? 0)
  const pctOf = (v: number) => segTotal >= 5 ? `${Math.round((v / segTotal) * 100)}%` : ''

  // Con menos de 5 clientes los porcentajes no dicen nada: se muestra "—".
  const few = segTotal < 5
  const pctV = (v?: number | null) => (few ? '—' : `${v ?? 0}%`)
  const PROGRAM = ([
    { v: pctV(m?.recurringRate), l: 'Clientes que volvieron', sub: 'vinieron 2 veces o más', color: 'var(--s-listo)', icon: 'vuelve' },
    types.some(t => t !== 'membership') && { v: pctV(m?.redemptionRate), l: 'Tasa de canje', sub: 'canjearon al menos una vez', color: 'var(--s-brasa)', icon: 'premios' },
    types.includes('stamp') && m?.avgStampProgress != null && { v: pctV(m.avgStampProgress), l: 'Progreso promedio', sub: 'de la tarjeta de sellos', color: 'var(--s-info)', icon: 'sello' },
    types.includes('stamp') && { v: `${m?.nearPrize ?? 0}`, l: 'A 1–2 sellos del premio', sub: `${m?.toDeliver ?? 0} con la tarjeta completa`, color: 'var(--s-aviso)', icon: 'objetivo' },
    types.includes('points') && { v: `${m?.canRedeem ?? 0}`, l: 'Pueden canjear un premio', sub: 'ya les alcanzan los puntos', color: 'var(--s-aviso)', icon: 'puntos' },
    types.includes('membership') && { v: `${m?.nearLevel ?? 0}`, l: 'Cerca de subir de nivel', sub: 'a 2 visitas o menos', color: 'var(--s-pino)', icon: 'membresia' },
  ].filter(Boolean)) as { v: string; l: string; sub: string; color: string; icon: IconName }[]

  const inactiveDays = m?.inactiveDays ?? 60
  const SEGMENTS = [
    { label: 'Activos',          desc: `Vinieron en los últimos ${inactiveDays} días`, color: '#5B8C5A', bg: 'rgba(91,140,90,.1)',  val: m?.active ?? 0,       pct: true },
    { label: 'Inactivos',        desc: `Más de ${inactiveDays} días sin venir`,        color: '#B23B3B', bg: 'rgba(178,59,59,.08)', val: m?.inactive ?? 0,     pct: true },
    { label: 'Nuevos este mes',  desc: 'Se registraron este mes',                       color: '#185FA5', bg: 'rgba(24,95,165,.1)',  val: m?.newThisMonth ?? 0, pct: false },
    { label: 'Con la tarjeta en el Wallet', desc: 'La guardaron en Apple o Google Wallet', color: '#1B412F', bg: 'rgba(27,65,47,.08)', val: m?.withDevice ?? 0,   pct: false },
  ]

  const d = detailedLoading ? null : detailed
  const Loading = () => detailedError && !detailedLoading
    ? <EmptyState title="No se pudo cargar" compact />
    : <div className="an-skel" style={{ height: 120 }} />
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

  // "Tarjetas" solo si hay 2 o más y no se está filtrando por una.
  const showCards = activeCards.length >= 2 && !selectedCard
  const SECTIONS: { key: Section; label: string }[] = [{ key: 'program', label: 'Programa' }, { key: 'customers', label: 'Clientes' }]
  const view = section

  const onlyMembership = types.length > 0 && types.every(t => t === 'membership')
  const scope = onlyMembership && rankScope === 'redeems' ? 'period' : rankScope

  // Datos destacados del Resumen (ícono + dato grande), en vez de frases.
  type Highlight = { icon: 'repeat' | 'flame' | 'moon'; k: string; v: string; sub: string; tone?: 'up' | 'down' }
  const highlights: Highlight[] = []
  if (d) {
    const rc = d.retention?.current
    if (rc && rc.returning + rc.newCustomers > 0) {
      const share = Math.round((rc.returning / (rc.returning + rc.newCustomers)) * 100)
      highlights.push({ icon: 'repeat', k: 'Gente que vuelve', v: `${share}%`, sub: 'del movimiento del período', tone: share >= 50 ? 'up' : 'down' })
    }
    const avg = d.hourly.visits.map((row, di) => row.map(v => d.hourly.weekdayCount[di] > 0 ? v / d.hourly.weekdayCount[di] : 0))
    let best = { di: 0, sl: 0, v: 0 }
    avg.forEach((row, di) => row.forEach((v, sl) => { if (v > best.v) best = { di, sl, v } }))
    if (best.v > 0) highlights.push({ icon: 'flame', k: 'Momento más fuerte', v: `${DAYS_SHORT[best.di]} ${slotLabel(best.sl)} hs`, sub: `${fmt1(best.v)} visitas por día` })
    const dayTot = avg.map(row => row.reduce((a, b) => a + b, 0))
    const open = dayTot.map((v, di) => ({ v, di })).filter(x => x.v > 0)
    if (open.length >= 2) {
      const worst = open.reduce((a, b) => (b.v < a.v ? b : a))
      if (worst.di !== best.di) highlights.push({ icon: 'moon', k: 'Día más flojo', v: DAYS_SINGULAR[worst.di][0].toUpperCase() + DAYS_SINGULAR[worst.di].slice(1), sub: 'ideal para un día con sello doble' })
    }
  }

  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

  return (
    <>
      <style>{`
        .an-content{flex:1;overflow-y:auto;padding:20px 24px;display:flex;flex-direction:column;gap:14px;}
        .an-lbl{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:rgba(34,32,27,.38);font-weight:600;display:flex;align-items:center;gap:10px;}
        .an-lbl::after{content:'';flex:1;height:1px;background:rgba(34,32,27,.1);}
        .an-block-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:6px;}
        .an-block-title{font-family:var(--font-display);font-size:16px;font-weight:800;color:var(--s-tinta);}
        .an-block-sub{font-size:11.5px;color:rgba(34,32,27,.45);margin-top:2px;}
        .an-block-tools{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
        .an-card{background:#FFFFFF;border:1px solid rgba(34,32,27,.07);border-radius:14px;padding:16px;box-shadow:0 1px 8px rgba(34,32,27,.04);min-width:0;}
        .an-card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap;margin-bottom:12px;}
        .an-ctitle{font-family:var(--font-display);font-weight:700;font-size:13px;color:var(--s-tinta);margin-bottom:2px;}
        .an-csub{font-size:11px;color:rgba(34,32,27,.45);margin-bottom:12px;}
        .an-card-head .an-csub{margin-bottom:0;}
        .an-empty-note{font-size:12px;color:rgba(34,32,27,.4);padding:20px 0;text-align:center;}
        .an-loading{animation:anPulse 1.2s ease-in-out infinite;}
        @keyframes anPulse{0%,100%{opacity:.4}50%{opacity:1}}
        .an-skel{background:rgba(34,32,27,.07);border-radius:6px;animation:anPulse 1.2s ease-in-out infinite;}

        /* ── Toolbar ── */
        .an-card-selector{display:flex;gap:6px;flex-wrap:wrap;}
        .an-card-pill{display:flex;align-items:center;gap:6px;font-size:12px;padding:7px 14px;border-radius:20px;border:1.5px solid rgba(34,32,27,.12);background:#FFFFFF;color:rgba(34,32,27,.55);cursor:pointer;transition:all .15s;font-family:var(--font-body);}
        .an-card-pill:hover{border-color:rgba(34,32,27,.25);}
        .an-card-pill--on{background:var(--s-pino);border-color:var(--s-pino);color:#F7F0E4;font-weight:600;}
        .an-rpill{font-size:11px;padding:6px 12px;border-radius:20px;border:1px solid rgba(34,32,27,.12);background:#FFFFFF;color:rgba(34,32,27,.5);cursor:pointer;font-family:var(--font-body);transition:all .15s;}
        .an-rpill:hover{border-color:rgba(34,32,27,.25);}
        .an-rpill--on{background:rgba(199,93,58,.1);border-color:var(--s-brasa);color:var(--s-brasa);font-weight:600;}
        .an-export{display:flex;align-items:center;gap:6px;font-size:11.5px;font-weight:600;padding:6px 12px;border-radius:20px;border:1px solid rgba(34,32,27,.15);background:#fff;color:var(--s-tinta);cursor:pointer;font-family:var(--font-body);}
        .an-export--icon{width:34px;height:34px;padding:0;justify-content:center;}
        .an-export:hover{border-color:rgba(34,32,27,.3);}
        .an-export:disabled{opacity:.6;cursor:default;}
        .an-export-err{font-size:11px;color:var(--s-error);}
        .an-error{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;background:rgba(178,59,59,.07);border:1px solid rgba(178,59,59,.2);color:var(--s-error);border-radius:12px;padding:10px 14px;font-size:12.5px;}
        .an-error button{background:#fff;border:1px solid rgba(178,59,59,.3);color:var(--s-error);border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;}

        /* ── Grids ── */
        .an-2col{display:grid;grid-template-columns:1.7fr 1fr;gap:12px;}
        .an-2even{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
        .an-program{display:grid;grid-template-columns:repeat(var(--cols),1fr);gap:12px;}
        .an-4col{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}

        /* ── Métricas ── */
        .an-stat-ic{width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;margin-bottom:10px;}
        .an-stat-now{font-family:var(--font-display);font-size:24px;font-weight:800;color:var(--s-tinta);}
        .an-stat-name{font-size:12px;font-weight:600;color:var(--s-tinta);margin-top:4px;}
        .an-stat-label{font-size:10.5px;color:rgba(34,32,27,.45);}
        .an-stat-prev{font-size:11px;color:rgba(34,32,27,.35);margin-left:5px;}
        .an-stat-delta{font-size:11px;font-weight:700;margin-top:5px;}
        .an-delta-up{color:var(--s-listo);}
        .an-delta-down{color:var(--s-error);}
        .an-delta-flat{color:rgba(34,32,27,.4);}
        .an-comp{display:flex;flex-direction:column;gap:10px;}
        .an-comp .an-card{padding:12px 14px;}

        /* ── Segmentos ── */
        .an-seg-card{border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:4px;}
        .an-seg-top{display:flex;align-items:baseline;gap:5px;}
        .an-seg-val{font-family:var(--font-display);font-size:24px;font-weight:800;color:var(--s-tinta);}
        .an-seg-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;vertical-align:1px;}
        .an-seg-pct{font-size:11px;color:var(--s-tinta-2);}
        .an-seg-name{font-size:12px;font-weight:700;color:var(--s-tinta);}
        .an-seg-desc{font-size:11px;color:var(--s-tinta-2);line-height:1.35;}

        /* ── Funnel ── */
        .an-funnel{display:flex;flex-direction:column;gap:12px;}
        .an-fstage{display:grid;grid-template-columns:minmax(96px,auto) 1fr 44px;gap:4px 12px;align-items:center;}
        .an-fname{font-size:12.5px;color:var(--s-tinta);}
        .an-fbar-wrap{height:20px;background:var(--s-hueco);border-radius:4px;overflow:hidden;}
        .an-fbar{height:100%;background:var(--s-pino);border-radius:4px;transition:width .4s;}
        .an-fval{font-size:13px;font-weight:600;color:var(--s-tinta);text-align:right;font-variant-numeric:tabular-nums;}
        .an-fconv{grid-column:2 / 4;font-size:11.5px;color:var(--s-tinta-2);}

        /* ── Barras ── */
        .an-bars-wrap{display:flex;gap:8px;height:170px;}
        .an-bars-axis{display:flex;flex-direction:column;justify-content:space-between;font-size:9.5px;color:rgba(34,32,27,.35);padding-bottom:20px;text-align:right;min-width:18px;}
        .an-bars{flex:1;display:flex;align-items:stretch;gap:6px;min-width:0;}
        .an-bars[data-dense]{gap:3px;}
        .an-bar-col{flex:1;display:flex;flex-direction:column;align-items:center;position:relative;cursor:default;min-width:0;}
        .an-bar-track{flex:1;width:100%;display:flex;align-items:flex-end;justify-content:center;}
        .an-bar-fill{width:100%;max-width:38px;min-height:2px;background:rgba(199,93,58,.55);border-radius:5px 5px 2px 2px;transition:background .15s;}
        .an-bar-fill--on{background:var(--s-brasa);}
        .an-bar-label{font-size:9.5px;color:rgba(34,32,27,.4);margin-top:6px;height:14px;white-space:nowrap;}
        .an-bar-tip{position:absolute;bottom:calc(100% - 6px);left:50%;transform:translateX(-50%);background:var(--s-tinta);color:#F7F0E4;font-size:11px;padding:6px 9px;border-radius:7px;white-space:nowrap;z-index:5;pointer-events:none;}

        /* ── ¿Cuándo viene tu gente? ── */
        .an-seg-switch{display:flex;background:rgba(34,32,27,.05);border-radius:10px;padding:3px;gap:2px;}
        .an-seg-switch button{border:none;background:none;font-size:11.5px;padding:5px 11px;border-radius:8px;color:rgba(34,32,27,.55);cursor:pointer;font-family:var(--font-body);}
        .an-seg-switch button.on{background:#fff;color:var(--s-tinta);font-weight:600;box-shadow:0 1px 3px rgba(34,32,27,.12);}
        .an-when-insights{display:flex;flex-direction:column;gap:6px;margin-bottom:14px;font-size:12.5px;color:var(--s-tinta);line-height:1.45;}
        .an-when-dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:8px;vertical-align:middle;}
        .an-when-dot--up{background:var(--s-listo);}
        .an-when-dot--down{background:#D4A24C;}
        .an-when-scroll{overflow-x:auto;}
        .an-pbc{display:flex;flex-direction:column;gap:9px;}
        .an-pbc-row{display:flex;align-items:center;gap:12px;font-size:12.5px;}
        .an-pbc-name{width:120px;flex-shrink:0;color:var(--s-tinta);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .an-pbc-note{color:rgba(34,32,27,.45);font-size:12px;}
        .an-pbc-bar{flex:1;display:flex;gap:2px;height:10px;border-radius:5px;overflow:hidden;}
        .an-pbc-total{width:76px;text-align:right;color:rgba(34,32,27,.55);font-size:11.5px;flex-shrink:0;}
        .an-tiers{display:flex;flex-direction:column;gap:12px;}
        .an-tiers-bar{display:flex;gap:2px;height:14px;border-radius:7px;overflow:hidden;}
        .an-tiers-legend{display:flex;flex-wrap:wrap;gap:8px 22px;}
        .an-tiers-item{display:flex;align-items:center;gap:7px;font-size:12.5px;color:rgba(34,32,27,.75);}
        .an-tiers-item i{width:10px;height:10px;border-radius:50%;flex-shrink:0;}
        .an-tiers-item strong{color:var(--s-tinta);font-weight:700;}
        .an-tabsbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:4px 0 14px;}
        .an-tabs{display:flex;gap:4px;background:rgba(34,32,27,.05);border-radius:12px;padding:4px;}
        .an-tab{border:none;background:transparent;border-radius:9px;padding:8px 16px;font-size:13px;font-weight:600;color:rgba(34,32,27,.55);cursor:pointer;font-family:var(--font-body);}
        .an-tab--on{background:#fff;color:var(--s-tinta);box-shadow:0 1px 4px rgba(34,32,27,.1);}
        .an-highlights{display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:12px;}
        .an-hl{background:#FFFBF5;border-color:rgba(199,93,58,.16);}
        .an-hl-k{display:flex;align-items:center;gap:7px;font-size:12px;color:rgba(34,32,27,.6);}
        .an-hl-k svg{color:var(--s-brasa);flex-shrink:0;}
        .an-hl-v{font-family:var(--font-display);font-size:22px;font-weight:800;color:var(--s-tinta);margin-top:6px;}
        .an-hl-v--up{color:var(--s-tinta);}
        .an-hl-v--down{color:var(--s-tinta);}
        .an-hl-s{font-size:11.5px;color:rgba(34,32,27,.45);margin-top:2px;}
        @media(max-width:768px){.an-highlights{grid-template-columns:1fr;}}
        .an-subhead{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:rgba(34,32,27,.45);margin:18px 0 10px;}
        .an-dh-lbl{font-size:11.5px;color:rgba(34,32,27,.55);margin:12px 0 8px;}
        .an-dh-days{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px;height:110px;}
        .an-dh-col{display:flex;flex-direction:column;align-items:center;gap:5px;}
        .an-dh-col span{font-size:11px;color:rgba(34,32,27,.5);}
        .an-dh-track{flex:1;width:100%;display:flex;align-items:flex-end;}
        .an-dh-track div{width:100%;border-radius:5px 5px 2px 2px;}
        .an-dh-hours{display:flex;gap:3px;}
        .an-dh-hours span{flex:1;height:20px;border-radius:4px;}
        .an-dh-ends{display:flex;justify-content:space-between;font-size:10.5px;color:rgba(34,32,27,.4);margin-top:4px;}
        .an-skel{background:rgba(34,32,27,.06);border-radius:10px;animation:anPulse 1.2s ease-in-out infinite;}
        @keyframes anPulse{0%,100%{opacity:1}50%{opacity:.5}}
        .an-when-pair{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
        @media(max-width:900px){.an-when-pair{grid-template-columns:1fr;}}
        .an-when{display:grid;gap:4px;align-items:center;min-width:min-content;width:100%;}
        .an-when-h{font-size:9.5px;color:rgba(34,32,27,.4);text-align:center;white-space:nowrap;}
        .an-when-d{font-size:10px;color:rgba(34,32,27,.5);font-weight:600;}
        .an-when-cell{height:24px;border-radius:5px;}
        .an-hlegend{display:flex;align-items:center;gap:8px;margin-top:10px;font-size:9.5px;color:rgba(34,32,27,.4);}
        .an-hscale{display:flex;gap:3px;}
        .an-hsdot{width:14px;height:10px;border-radius:2px;}

        /* ── Rankings ── */
        .an-tr{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(34,32,27,.06);}
        .an-tr:last-child{border-bottom:none;}
        .an-trk{width:22px;height:22px;border-radius:7px;background:rgba(34,32,27,.06);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:rgba(34,32,27,.4);flex-shrink:0;}
        .an-trk--1{background:rgba(199,93,58,.12);color:var(--s-brasa);}
        .an-tn{font-size:12px;color:var(--s-tinta);font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .an-tn--link{background:none;border:none;padding:0;cursor:pointer;font-family:inherit;text-align:left;}
        .an-tn--link:hover{color:var(--s-brasa);text-decoration:underline;}
        .an-tv{font-size:12px;font-weight:700;color:var(--s-brasa);white-space:nowrap;}
        .an-tbar{height:4px;background:rgba(34,32,27,.06);border-radius:2px;overflow:hidden;margin-top:3px;}
        .an-tfill{height:100%;background:var(--s-pino);border-radius:2px;}
        .an-tsub{font-size:10.5px;color:rgba(34,32,27,.45);margin-top:3px;}

        /* ── Frecuencia ── */
        .an-freq-stat{font-family:var(--font-display);font-size:28px;font-weight:800;color:var(--s-tinta);}
        .an-freq-unit{font-size:13px;color:rgba(34,32,27,.45);}
        .an-hl-legend{display:flex;gap:16px;flex-wrap:wrap;font-size:12px;color:var(--s-tinta-2);margin:10px 0 2px;}
        .an-hl-legend i{display:inline-block;width:12px;height:3px;border-radius:2px;margin-right:6px;vertical-align:3px;}
        .an-hlines{display:block;max-width:100%;}
        .an-wb-note{font-size:12.5px;color:var(--s-tinta-2);margin:10px 0 4px;}
        .an-wb{display:grid;grid-template-columns:minmax(0,7fr) minmax(0,9fr);gap:28px;margin-top:8px;}
        .an-wb-chart{min-width:0;}
        .an-wb-lbl{font-size:11px;color:var(--s-tinta-3);margin-bottom:8px;}
        .an-wb-bars{display:flex;gap:6px;align-items:flex-end;}
        .an-wb-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;min-width:0;}
        .an-wb-col span{font-size:10.5px;color:var(--s-tinta-2);white-space:nowrap;font-variant-numeric:tabular-nums;}
        .an-wb-track{width:100%;height:110px;display:flex;align-items:flex-end;background:var(--s-hueco);border-radius:4px;overflow:hidden;}
        .an-wb-track div{width:100%;background:rgba(27,65,47,.38);border-radius:4px 4px 0 0;}
        .an-wb-track div.is-top{background:var(--s-pino);}
        .an-when-pair .an-wb{grid-template-columns:1fr;gap:18px;}
        .an-when-pair .an-wb-track{height:80px;}
        @media(max-width:700px){.an-wb{grid-template-columns:1fr;gap:18px;}.an-wb-col span{font-size:9.5px;}}
        .an-freq-trend{font-size:12px;color:var(--s-tinta-2);margin-bottom:12px;}
        .an-freq-bars{display:flex;flex-direction:column;gap:6px;}
        .an-freq-row{display:flex;align-items:center;gap:8px;}
        .an-freq-lbl{font-size:10.5px;color:rgba(34,32,27,.5);width:92px;flex-shrink:0;}
        .an-freq-bar{flex:1;height:9px;background:rgba(34,32,27,.06);border-radius:4px;overflow:hidden;}
        .an-freq-fill{height:100%;background:var(--s-pino);border-radius:4px;}
        .an-freq-cnt{font-size:10.5px;font-weight:600;color:rgba(34,32,27,.5);width:22px;text-align:right;}

        @media(max-width:900px){
          .an-2col,.an-2even{grid-template-columns:1fr;}
          .an-4col,.an-program{grid-template-columns:1fr 1fr;}
        }
        @media(max-width:768px){
          .an-content{padding:14px 16px;}
          .an-bars[data-many]:not([data-dense]) .an-bar-col:nth-child(even) .an-bar-label{visibility:hidden;}
        }
        @media(max-width:480px){
          .an-rpill{font-size:10.5px;padding:5px 9px;}
          .an-card-pill{font-size:11px;padding:6px 10px;}
          .an-bar-label{font-size:8.5px;}
        }
      `}</style>

      <div className="an-content">

        {detailedError && !detailedLoading && (
          <div className="an-error">
            <span>No pudimos cargar parte de la analítica. Revisá tu conexión y probá de nuevo.</span>
            <button onClick={() => { setDetailedKey(''); setRetry(n => n + 1) }}>Reintentar</button>
          </div>
        )}

        {/* Secciones a la izquierda; a la derecha, la tarjeta y el período
            (aplican a todas las secciones) y exportar. La sucursal se elige
            en la barra lateral. */}
        <div className="an-tabsbar">
          <div className="an-tabs" role="tablist">
            {SECTIONS.map(sec => (
              <button key={sec.key} role="tab" aria-selected={view === sec.key} className={`an-tab${view === sec.key ? ' an-tab--on' : ''}`} onClick={() => pickSection(sec.key)}>{sec.label}</button>
            ))}
          </div>
          <div className="an-block-tools">
            {activeCards.length > 1 && (
              <PillSelect ariaLabel="Tarjeta" value={selectedCard?.id || 'all'} onChange={setSelectedCardId}
                options={[{ id: 'all', label: 'Todas las tarjetas' }, ...activeCards.map(c => ({ id: c.id, label: c.name }))]} />
            )}
            <PillSelect ariaLabel="Período" value={range} onChange={v => setRange(v as Range)}
              options={RANGES.map(r => ({ id: r.key, label: `Últimos ${r.label}` }))} />
            <button className="an-export an-export--icon" onClick={exportCsv} disabled={exporting} title="Exportar CSV: los movimientos del período, para Excel" aria-label="Exportar CSV">
              {exporting ? '…' : <Icon name="descargar" size={16} />}
            </button>
          </div>
        </div>
        {exportError && <div className="an-export-err">{exportError}</div>}

        {/* ═══════════════ PROGRAMA ═══════════════ */}
        {view === 'program' && <>
          {d && highlights.length > 0 && (
            <div className="an-highlights" style={{ ['--n' as any]: highlights.length }}>
              {highlights.map(h => (
                <div key={h.k} className="an-card an-hl">
                  <div className="an-hl-k"><HlIcon name={h.icon} />{h.k}</div>
                  <div className={`an-hl-v${h.tone ? ` an-hl-v--${h.tone}` : ''}`}>{h.v}</div>
                  <div className="an-hl-s">{h.sub}</div>
                </div>
              ))}
            </div>
          )}
          {!d ? <div className="an-card"><div className="an-ctitle">¿Cuándo viene tu gente?</div><Loading /></div>
            : <HoursLines hourly={d.hourly} withRedeems={!onlyMembership} />}
          <div className="an-program" style={{ ['--cols' as any]: PROGRAM.length <= 4 ? PROGRAM.length : 3 }}>
            {PROGRAM.map(p => (
              <div key={p.l} className="an-card">
                <div className="an-stat-ic" style={{ background: `color-mix(in srgb, ${p.color} 12%, transparent)`, color: p.color }}><Icon name={p.icon} size={18} /></div>
                {metricsLoading
                  ? <div className="an-skel" style={{ width: 54, height: 26 }} />
                  : <div className="an-stat-now">{p.v}</div>}
                <div className="an-stat-name">{p.l}</div>
                <div className="an-stat-label">{p.sub}</div>
              </div>
            ))}
          </div>
          <div className="an-2col">
            <div className="an-card">
              <div className="an-ctitle">{chart.title}</div>
              <div className="an-csub">{range === '90d' ? 'Por semana' : 'Por día'} · pasá el mouse por una barra para ver el detalle</div>
              {!d ? (detailedError && !detailedLoading ? <Loading /> : <MascotLoader text="Armando tus números…" size={44} minHeight={170} />) : chartEmpty
                ? <EmptyState title="Todavía sin movimientos" text="Aparecen cuando escaneás tarjetas con la app." />
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
          {/* Mismo anillo que Inicio. */}
          <div className="an-card">
            <div className="an-ctitle">¿Tu programa retiene?</div>
            <div className="an-csub">Clientes que volvieron vs clientes nuevos, en los últimos {range.replace('d', '')} días</div>
            {!d ? <Loading /> : d.retention && (d.retention.current.returning + d.retention.current.newCustomers) > 0
              ? <RetentionRing data={d.retention} />
              : <EmptyState title="Todavía sin movimientos" text="Aparece cuando tus clientes vuelvan o se registren." />}
          </div>
          {/* Multilocal: con "Todas" y 2+ sucursales, cómo le va a cada una. */}
          {(d?.locationComparison?.length || 0) >= 2 && (
            <div className="an-card">
              <div className="an-ctitle">Comparación entre sucursales</div>
              <div className="an-csub">En los últimos {range.replace('d', '')} días · nuevos: según el QR de sucursal con el que se registraron (el link general cuenta en la principal)</div>
              <LocationComparison data={d!.locationComparison!} />
            </div>
          )}
        </>}

        {/* ═══════════════ CLIENTES ═══════════════ */}
        {view === 'customers' && <>
          <div className="an-4col">
            {SEGMENTS.map(({ label, desc, color, val, pct }) => (
              <div key={label} className="an-card an-seg-card">
                <div className="an-seg-top">
                  {metricsLoading
                    ? <div className="an-skel" style={{ width: 36, height: 24 }} />
                    : <span className="an-seg-val">{val.toLocaleString('es-AR')}</span>}
                  {pct && !metricsLoading && <span className="an-seg-pct">{pctOf(val)}</span>}
                </div>
                <div className="an-seg-name"><i className="an-seg-dot" style={{ background: color }} />{label}</div>
                <div className="an-seg-desc">{desc}</div>
              </div>
            ))}
          </div>
          {/* "¿Hasta dónde llegan?" y el ranking, uno al lado del otro. */}
          <div className="an-2even">
            {/* Progreso + embudo: los dos responden "¿hasta dónde llegan?" */}
            <div className="an-card">
              <div className="an-ctitle">¿Hasta dónde llegan tus clientes?</div>
              <div className="an-csub">{!selectedCard ? 'Todas las tarjetas' : !d?.progressDistribution ? 'Desde que se registraron' : d.progressDistribution.kind === 'points' ? 'Según sus puntos, hoy' : 'Según cuántos sellos tienen, hoy'}</div>
              {!d ? <Loading /> : !(d.funnel[0]?.value > 0)
                ? <EmptyState title="Todavía sin clientes" text="Aparece cuando se registren en tus tarjetas." />
                : !selectedCard && d.progressByCard?.length
                ? <>
                    {/* Todas las tarjetas: el progreso de cada una con su nombre
                        y el embudo sumando todas, bien rotulado. */}
                    <div className="an-subhead" style={{ marginTop: 4 }}>Progreso hoy, por tarjeta</div>
                    <div className="an-pbc">
                      {d.progressByCard.map(c => (
                        <div key={c.cardId} className="an-pbc-row">
                          <span className="an-pbc-name">{c.name}</span>
                          {c.type === 'membership'
                            ? <span className="an-pbc-note">Va por niveles: mirá Clientes por nivel</span>
                            : !c.total
                            ? <span className="an-pbc-note">Todavía sin clientes</span>
                            : <>
                                <span className="an-pbc-bar" role="img" aria-label={c.segments.map(x => `${x.label}: ${x.count}`).join(', ')}>
                                  {c.segments.map((x, i) => x.count > 0 && <span key={x.label} title={`${x.label}: ${x.count}`} style={{ flex: x.count, background: (c.segments.length === 3 ? [PSEQ[0], PSEQ[2], PSEQ[4]] : PSEQ)[i] }} />)}
                                </span>
                                <span className="an-pbc-total">{c.total} {c.total === 1 ? 'cliente' : 'clientes'}</span>
                              </>}
                        </div>
                      ))}
                    </div>
                    <div className="an-subhead">Todas tus tarjetas, desde que se registraron</div>
                    <Funnel data={d.funnel} />
                  </>
                : <>
                    {d.progressDistribution && <ProgressDistribution data={d.progressDistribution} />}
                    {d.progressDistribution && <div className="an-subhead">Desde que se registraron</div>}
                    <Funnel data={d.funnel} />
                  </>}
            </div>

          {/* Un solo ranking (antes eran tres bloques: más activos del período,
              más fieles y los que más canjearon). */}
          <div className="an-card">
              <div className="an-card-head">
                <div>
                  <div className="an-ctitle">Tus mejores clientes</div>
                  <div className="an-csub">{scope === 'period' ? `Por visitas en los últimos ${range.replace('d', '')} días` : scope === 'redeems' ? 'Por premios canjeados, desde que empezaste' : 'Por visitas totales, desde que empezaste'}</div>
                </div>
                <div className="an-seg-switch">
                  <button className={rankScope === 'period' ? 'on' : ''} onClick={() => setRankScope('period')}>En el período</button>
                  <button className={rankScope === 'all' ? 'on' : ''} onClick={() => setRankScope('all')}>Desde siempre</button>
                  {!onlyMembership && <button className={rankScope === 'redeems' ? 'on' : ''} onClick={() => setRankScope('redeems')}>Más canjes</button>}
                </div>
              </div>
              {!d ? <Loading /> : scope === 'redeems'
                ? <Ranking rows={d.topRedeemers} value={r => r.redemptions} unit={n => plural(n, 'canje', 'canjes')}
                    onOpen={onOpenCustomer} empty="Todavía sin premios entregados" />
                : scope === 'period'
                ? <Ranking rows={d.topCustomers} value={r => r.visits} unit={n => plural(n, 'visita', 'visitas')}
                    sub={r => `${activeCards.length > 1 ? `${r.cardName} · ` : ''}${r.progress} · última visita ${r.lastVisit}`}
                    onOpen={onOpenCustomer} empty="Todavía sin visitas en el período" />
                : <Ranking rows={d.mostLoyal} value={r => r.totalVisits} unit={n => plural(n, 'visita', 'visitas')}
                    sub={r => `última visita ${r.lastVisit}`} onOpen={onOpenCustomer} empty="Todavía sin visitas" />}
          </div>
          </div>

          <div className="an-2even">
            <div className="an-card">
              <div className="an-ctitle">Frecuencia de visita</div>
              <div className="an-csub">Cada cuántos días vuelve un mismo cliente</div>
            {!d ? <Loading /> : d.frequency.distribution.some(b => b.count > 0) ? <>
              <div style={{ marginBottom: 4 }}>
                <span className="an-freq-stat">{d.frequency.avgDays.toLocaleString('es-AR')}</span>
                <span className="an-freq-unit"> días en promedio</span>
              </div>
              <div className="an-freq-trend">
                {d.frequency.trend < 0
                  ? `Vuelven ${Math.abs(d.frequency.trend).toLocaleString('es-AR')} días antes que en el período anterior.`
                  : d.frequency.trend > 0
                  ? `Tardan ${d.frequency.trend.toLocaleString('es-AR')} días más en volver que en el período anterior.`
                  : 'Sin datos del período anterior para comparar.'}
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
            </> : <EmptyState title="Todavía sin datos" text="Aparece cuando un mismo cliente vuelve en el período." />}
            </div>
            <div className="an-card">
              <div className="an-ctitle">Respuestas del formulario</div>
              <div className="an-csub">Lo que contestaron al registrarse, y cuáles vuelven más</div>
              {!d ? <Loading /> : <FormAnswers data={d.formAnswers || []} onNotify={onNotifyAnswer} />}
            </div>
          </div>
          <div className="an-card">
            <div className="an-ctitle">Toques en WhatsApp</div>
            <div className="an-csub">Veces que tocaron los botones de WhatsApp de su tarjeta, en los últimos {range.replace('d', '')} días</div>
            {!d ? <Loading /> : (d.whatsappTaps || []).length
              ? (() => { const taps = d.whatsappTaps!; const max = Math.max(1, ...taps.map(t => t.count)); return (
                  <div className="an-freq-bars" style={{ marginTop: 12 }}>
                    {taps.map(t => (
                      <div key={t.label} className="an-freq-row">
                        <span className="an-freq-lbl" style={{ width: 130 }}>{t.label}</span>
                        <div className="an-freq-bar"><div className="an-freq-fill" style={{ width: `${(t.count / max) * 100}%` }} /></div>
                        <span className="an-freq-cnt">{t.count}</span>
                      </div>
                    ))}
                  </div>
                ) })()
              : <EmptyState title="Todavía sin toques" text="Aparece cuando tus clientes toquen los botones de WhatsApp de su tarjeta. El número se carga en Configuración." />}
          </div>
          {types.includes('membership') && (
            <div className="an-card">
              <div className="an-ctitle">Clientes por nivel</div>
              <div className="an-csub">Miembros en cada nivel hoy{m?.tierDistribution?.length ? ` · ${(m.tierDistribution as any[]).reduce((a: number, t: any) => a + t.count, 0)} en total` : ''}</div>
              {metricsLoading ? <Loading /> : <TierDistribution tiers={m?.tierDistribution ?? []} />}
            </div>
          )}
        </>}

        {/* ═══════════════ PROGRAMA: tarjetas (2 o más, sin filtro) ═══════════════ */}
        {view === 'program' && showCards && (
          <div className="an-card">
            <div className="an-ctitle">Comparación entre tarjetas</div>
            <div className="an-csub">En los últimos {range.replace('d', '')} días (clientes: total)</div>
            {!d ? <Loading /> : (d.cardComparison?.length || 0) >= 2
              ? <CardComparison data={d.cardComparison!} />
              : <EmptyState title="Necesitás 2 o más tarjetas" />}
          </div>
        )}

      </div>
    </>
  )
}
