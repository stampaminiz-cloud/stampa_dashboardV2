'use client'

// Panel del dueño de Stampa: los ingresos y cómo usan el servicio los
// negocios, en cuatro pestañas (Resumen, Ingresos, Uso, Negocios). Mismo
// lenguaje visual que el panel de los negocios. Solo para los emails de
// ADMIN_EMAILS (el backend responde 404 al resto), solo lectura y sin datos
// de los clientes finales. Backend: routes/admin.js, services/adminMetrics.js.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiAdminBusiness, apiAdminOverview, getToken, type AdminBusinessDetail, type AdminBusinessRow, type AdminOverview, type Money } from '@/lib/api'

const COUNTRY: Record<string, string> = { AR: 'Argentina', ES: 'España', UY: 'Uruguay', CL: 'Chile', MX: 'México' }
const ACCESS: Record<string, string> = { trial: 'En prueba', active: 'Pagando', legacy: 'Acceso completo', paused: 'Pausada' }
const STATUS: Record<string, string> = { active: 'pagando', past_due: 'cobro fallido', paused: 'pausada', cancelled: 'cancelada', trialing: 'en prueba', legacy: 'acceso completo' }
const CARD_TYPE: Record<string, string> = { stamp: 'Sellos', points: 'Puntos', membership: 'Niveles' }
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const CORAL = '#C75D3A', GREEN = '#1B412F', SAND = '#D9C9AE', GREY = '#B9B0A3'

type Tab = 'summary' | 'income' | 'usage' | 'businesses'
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'summary', label: 'Resumen', icon: 'M3 12h4l3-8 4 16 3-8h4' },
  { id: 'income', label: 'Ingresos', icon: 'M12 3v18M17 7H9.5a3 3 0 0 0 0 6h5a3 3 0 0 1 0 6H6' },
  { id: 'usage', label: 'Uso', icon: 'M4 20V10M10 20V4M16 20v-7M22 20H2' },
  { id: 'businesses', label: 'Negocios', icon: 'M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6' },
]
// Uso y Negocios dependen del período; Resumen e Ingresos usan 30 días fijos.
const HAS_PERIOD: Tab[] = ['usage', 'businesses']

const n = (x: number) => x.toLocaleString('es-AR')
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'
const short = (iso: string) => { const d = new Date(iso); return `${d.getUTCDate()}/${d.getUTCMonth() + 1}` }
const monthName = (key: string) => MONTHS[Number(key.slice(5)) - 1]
function money(amount: number, currency: string) {
  try { return new Intl.NumberFormat('es-AR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount) } catch { return `${currency} ${n(amount)}` }
}
const moneyList = (m: Money | null) => (m ? Object.entries(m).sort((a, b) => b[1] - a[1]) : [])
function ago(d: string | null) {
  if (!d) return 'nunca'
  const m = Math.round((Date.now() - new Date(d).getTime()) / 60000)
  if (m < 60) return m < 1 ? 'recién' : `hace ${m} min`
  const h = Math.round(m / 60)
  if (h < 24) return `hace ${h} h`
  const days = Math.round(h / 24)
  return days === 1 ? 'ayer' : `hace ${days} días`
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('summary')
  const [days, setDays] = useState(30)
  const [country, setCountry] = useState('all')
  const [data, setData] = useState<AdminOverview | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'notfound' | 'error'>('loading')
  const [open, setOpen] = useState<string | null>(null)
  const effectiveDays = HAS_PERIOD.includes(tab) ? days : 30

  const load = useCallback(async (d: number, c: string) => {
    try {
      setData(await apiAdminOverview(d, c))
      setState('ok')
    } catch (err) {
      setState((err as { status?: number })?.status === 404 ? 'notfound' : 'error')
    }
  }, [])

  useEffect(() => {
    if (!getToken()) { window.location.href = '/login'; return }
    load(effectiveDays, country)
  }, [load, effectiveDays, country])

  if (state === 'notfound') return <Center><h1 className="t" style={{ fontSize: 22 }}>Página no encontrada</h1><a href="/dashboard" style={{ color: CORAL }}>Volver al panel</a></Center>
  if (state === 'error') return <Center><p>No se pudieron cargar los números.</p><button className="sa-btn" onClick={() => load(effectiveDays, country)}>Reintentar</button></Center>
  if (!data) return <Center><p style={{ color: 'rgba(43,38,32,.5)' }}>Calculando…</p></Center>

  const attention = data.businesses.filter(r => r.isActive && r.signals.some(s => s.kind === 'risk' || s.kind === 'upsell'))
  const stale = data.days !== effectiveDays

  return (
    <div className="sa-shell">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <nav className="sa-side" aria-label="Secciones">
        <div className="sa-brand"><span className="t">STAMPA</span><small>Tus números</small></div>
        <div className="sa-tabs">
          {TABS.map(t => (
            <button key={t.id} className={`sa-tab${tab === t.id ? ' is-on' : ''}`} aria-current={tab === t.id ? 'page' : undefined} onClick={() => setTab(t.id)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d={t.icon} /></svg>
              <span>{t.label}</span>
              {t.id === 'businesses' && attention.length > 0 && <em>{attention.length}</em>}
            </button>
          ))}
        </div>
        <a className="sa-back" href="/dashboard">← Ir a mi panel</a>
      </nav>

      <main className="sa-main">
        <header className="sa-head">
          <div>
            <h1 className="t">{TABS.find(t => t.id === tab)?.label}</h1>
            <p className="sa-muted">Solo vos ves esta página · actualizado {ago(data.generatedAt)}{!HAS_PERIOD.includes(tab) && tab === 'summary' ? ' · últimos 30 días' : ''}</p>
          </div>
          <div className="sa-tools">
            {data.countries.length > 1 && (
              <div className="sa-pills">
                {['all', ...data.countries].map(c => (
                  <button key={c} className={`sa-gp${country === c ? ' is-on' : ''}`} aria-pressed={country === c} onClick={() => setCountry(c)}>{c === 'all' ? 'Todos' : COUNTRY[c] || c}</button>
                ))}
              </div>
            )}
            {HAS_PERIOD.includes(tab) && (
              <div className="sa-pills">
                {[7, 30, 90].map(d => (
                  <button key={d} className={`sa-rp${days === d ? ' is-on' : ''}`} aria-pressed={days === d} onClick={() => setDays(d)}>{d} días</button>
                ))}
              </div>
            )}
          </div>
        </header>

        <div className={stale ? 'sa-stale' : undefined}>
          {tab === 'summary' && <Summary data={data} attention={attention} onOpen={setOpen} goTo={setTab} />}
          {tab === 'income' && <Income data={data} />}
          {tab === 'usage' && <Usage data={data} />}
          {tab === 'businesses' && <Businesses data={data} onOpen={setOpen} />}
        </div>
      </main>

      {open && <Detail id={open} days={effectiveDays} onClose={() => setOpen(null)} />}
    </div>
  )
}

function Center({ children }: { children: React.ReactNode }) {
  return <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', justifyContent: 'center', background: '#FBF6EE', color: '#2B2620', padding: 16, textAlign: 'center', fontFamily: 'Inter, sans-serif' }}><style dangerouslySetInnerHTML={{ __html: CSS }} />{children}</div>
}

// ─── Piezas ────────────────────────────────────────────────────────────────

function Delta({ v, label = 'vs período anterior' }: { v: number | null | undefined; label?: string }) {
  if (v == null) return null
  return <div className={`sa-delta ${v > 0 ? 'up' : v < 0 ? 'dn' : ''}`}>{v > 0 ? '+' : ''}{v}% {label}</div>
}

function Stat({ label, value, sub, extra, tone }: { label: string; value: React.ReactNode; sub?: React.ReactNode; extra?: React.ReactNode; tone?: 'coral' }) {
  return (
    <div className="sa-card">
      <div className="sa-k">{label}</div>
      <div className="sa-v" style={tone === 'coral' ? { color: CORAL } : undefined}>{value}</div>
      {extra}
      {sub && <div className="sa-sub">{sub}</div>}
    </div>
  )
}

function MoneyValue({ m }: { m: Money | null }) {
  const list = moneyList(m)
  if (!list.length) return <>—</>
  return <>{money(list[0][1], list[0][0])}{list.slice(1).map(([c, v]) => <div key={c} className="sa-v2">+ {money(v, c)}</div>)}</>
}

// Líneas (una o varias series) con área suave y valor al pasar el mouse.
function LineChart({ labels, series, height = 140, tip, area = true }: {
  labels: string[]; series: { values: number[]; color: string; name: string; dashed?: boolean }[]; height?: number; tip: (i: number) => string; area?: boolean
}) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...series.flatMap(s => s.values))
  const W = 600, H = 100, len = labels.length
  const x = (i: number) => (len <= 1 ? W / 2 : (i / (len - 1)) * W)
  const y = (v: number) => H - (v / max) * (H - 6) - 2
  const every = Math.ceil(len / 8)
  // Etiqueta del eje: cada tanto, y la última solo si no pisa a la anterior.
  const showLabel = (i: number) => i === 0 || i === len - 1 || (i % every === 0 && len - 1 - i >= every / 2)
  return (
    <div className="sa-line" style={{ height }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        {[0.25, 0.5, 0.75].map(f => <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="rgba(43,38,32,.06)" vectorEffect="non-scaling-stroke" />)}
        {series.map((s, j) => {
          const pts = s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')
          return (
            <g key={s.name}>
              {area && j === 0 && len > 1 && <polygon points={`0,${H} ${pts} ${W},${H}`} fill={s.color} opacity=".09" />}
              <polyline points={pts} fill="none" stroke={s.color} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" strokeDasharray={s.dashed ? '5 4' : undefined} vectorEffect="non-scaling-stroke" />
            </g>
          )
        })}
        {hover != null && <line x1={x(hover)} x2={x(hover)} y1="0" y2={H} stroke="rgba(43,38,32,.25)" vectorEffect="non-scaling-stroke" />}
      </svg>
      {hover != null && series.map(s => (
        <i key={s.name} className="sa-dot" style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(s.values[hover]) / H) * 100}%`, background: s.color }} />
      ))}
      <div className="sa-hit">
        {labels.map((l, i) => (
          <div key={l} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => setHover(hover === i ? null : i)}>
            {hover === i && <div className={`sa-tip${i > len * 0.7 ? ' is-left' : i < len * 0.3 ? ' is-right' : ''}`}>{tip(i)}</div>}
          </div>
        ))}
      </div>
      <div className="sa-axis">{labels.map((l, i) => <span key={l}>{showLabel(i) ? short(l) : ''}</span>)}</div>
    </div>
  )
}

function Bars({ labels, series, colors, legend, height = 110, tip }: { labels: string[]; series: number[][]; colors: string[]; legend?: string[]; height?: number; tip: (i: number) => string }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...series.flat())
  const every = Math.ceil(labels.length / 10)
  return (
    <div>
      <div className="sa-bars" style={{ height }}>
        {labels.map((l, i) => (
          <div key={l} className="sa-bar-col" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => setHover(hover === i ? null : i)}>
            {hover === i && <div className="sa-tip">{tip(i)}</div>}
            <div className="sa-bar-stack">{series.map((s, j) => <i key={j} style={{ height: `${(s[i] / max) * 100}%`, background: colors[j] }} />)}</div>
            <span>{i % every === 0 || i === labels.length - 1 ? short(l) : ''}</span>
          </div>
        ))}
      </div>
      {legend && <Legend items={legend.map((l, j) => [l, colors[j]])} />}
    </div>
  )
}

function Legend({ items }: { items: [string, string][] }) {
  return <div className="sa-legend">{items.map(([l, c]) => <span key={l}><i style={{ background: c }} />{l}</span>)}</div>
}

// Anillo con partes (torta hueca).
function Donut({ parts, center, size = 120 }: { parts: { label: string; value: number; color: string }[]; center?: React.ReactNode; size?: number }) {
  const total = parts.reduce((t, p) => t + p.value, 0)
  let acc = 0
  return (
    <div className="sa-donut" style={{ width: size, height: size }}>
      <svg viewBox="0 0 42 42" aria-hidden="true">
        <circle cx="21" cy="21" r="15.915" fill="none" stroke="#F1EBE0" strokeWidth="6" />
        {total > 0 && parts.filter(p => p.value > 0).map(p => {
          const len = (p.value / total) * 100
          const el = <circle key={p.label} cx="21" cy="21" r="15.915" fill="none" stroke={p.color} strokeWidth="6" strokeDasharray={`${len} ${100 - len}`} strokeDashoffset={25 - acc} />
          acc += len
          return el
        })}
      </svg>
      {center && <div className="sa-donut-c">{center}</div>}
    </div>
  )
}

function HBar({ label, value, max = 100, suffix = '%', color = CORAL, display }: { label: string; value: number | null; max?: number; suffix?: string; color?: string; display?: React.ReactNode }) {
  return (
    <div className="sa-hbar">
      <span>{label}</span>
      <div><i style={{ width: `${value == null ? 0 : Math.min(100, (value / (max || 1)) * 100)}%`, background: color }} /></div>
      <b>{display ?? (value == null ? '—' : `${value}${suffix}`)}</b>
    </div>
  )
}

function Spark({ values }: { values: number[] }) {
  const max = Math.max(1, ...values)
  const half = Math.floor(values.length / 2)
  const a = values.slice(0, half).reduce((t, v) => t + v, 0), b = values.slice(half).reduce((t, v) => t + v, 0)
  const color = b > a ? '#2E7D4F' : b < a ? '#B4442A' : GREY
  const pts = values.map((v, i) => `${(i / Math.max(1, values.length - 1)) * 80},${18 - (v / max) * 15}`).join(' ')
  return <svg width="80" height="20" viewBox="0 0 80 20" aria-hidden="true"><polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" /></svg>
}

function SignalList({ title, sub, rows, kinds, empty, onOpen, limit = 8 }: { title: string; sub: string; rows: AdminBusinessRow[]; kinds: string[]; empty: string; onOpen: (id: string) => void; limit?: number }) {
  return (
    <div className="sa-card">
      <div className="sa-ct">{title}</div>
      <div className="sa-csub">{sub}</div>
      {rows.length ? rows.slice(0, limit).map(r => (
        <button key={r.id} className="sa-row" onClick={() => onOpen(r.id)}>
          <span>{r.name}<span className="sa-muted"> · {r.plan}</span></span>
          <span>{r.signals.filter(s => kinds.includes(s.kind)).map((s, i) => <span key={i} className={`sa-tag sa-tag--${s.kind}`}>{s.text}</span>)}</span>
        </button>
      )) : (
        <div className="sa-allgood">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M7.5 12.5l3 3 6-6.5" /></svg>
          <p>{empty}</p>
        </div>
      )}
      {rows.length > limit && <div className="sa-csub" style={{ marginTop: 6 }}>y {rows.length - limit} más en Negocios</div>}
    </div>
  )
}

function MrrChart({ m }: { m: AdminOverview['money'] }) {
  const cur = moneyList(m.mrr)[0]?.[0] || moneyList(m.mrrHistory.at(-1)?.value || null)[0]?.[0]
  if (!cur || m.mrrHistory.length < 2) {
    return (
      <div className="sa-mrr-empty">
        <div className="sa-v"><MoneyValue m={m.mrr} /></div>
        <p className="sa-muted">Este mes. La línea de los meses anteriores se arma con el historial de pagos, que se guarda desde el 6/10/2026: el mes que viene vas a ver el primer tramo.</p>
        {m.byPlan.length > 0 && (
          <div className="sa-mini">
            {m.byPlan.map(r => <div key={r.plan}><span>{r.plan} · {r.count} negocio{r.count === 1 ? '' : 's'}</span><b>{moneyList(r.value).map(([c, v]) => money(v, c)).join(' + ') || '—'}</b></div>)}
          </div>
        )}
      </div>
    )
  }
  const labels = m.mrrHistory.map(h => `${h.month}-01`)
  const values = m.mrrHistory.map(h => h.value[cur] || 0)
  return <LineChart labels={labels} series={[{ values, color: GREEN, name: 'Ingreso' }]} tip={i => `${monthName(m.mrrHistory[i].month)}: ${money(values[i], cur)}`} />
}

// ─── Pestañas ─────────────────────────────────────────────────────────────

function Summary({ data, attention, onOpen, goTo }: { data: AdminOverview; attention: AdminBusinessRow[]; onOpen: (id: string) => void; goTo: (t: Tab) => void }) {
  const m = data.money, u = data.usage, e = data.endUsers
  const risk = attention.filter(r => r.signals.some(s => s.kind === 'risk')).length
  const mrrDelta = (() => {
    const [cur, v] = moneyList(m.mrr)[0] || []
    const prev = cur && m.mrrPrev ? m.mrrPrev[cur] : 0
    return prev ? Math.round(((v - prev) / prev) * 100) : null
  })()
  return (
    <>
      <div className="sa-g4">
        <Stat label="Ingreso mensual" value={<MoneyValue m={m.mrr} />} extra={<Delta v={mrrDelta} label="vs hace 30 días" />} sub={mrrDelta == null ? 'Suscripciones que renuevan' : undefined} />
        <Stat label="Negocios pagando" value={m.states.paying} sub={`${m.states.trial} en prueba · ${m.states.legacy} con acceso completo`} />
        <Stat label="Escaneos (30 días)" value={n(u.scans)} extra={<Delta v={u.scansDelta} />} sub={`${u.activeBusinesses} de ${u.businesses} negocios escanearon`} />
        <Stat label="Para atender" value={attention.length} tone={attention.length ? 'coral' : undefined} sub={attention.length ? `${risk} en riesgo · ${attention.length - risk} para mejorar plan` : 'Nada pendiente'} />
      </div>
      <div className="sa-g21">
        <div className="sa-card">
          <div className="sa-card-head"><div><div className="sa-ct">Ingreso mensual</div><div className="sa-csub">Últimos 6 meses</div></div><button className="sa-link" onClick={() => goTo('income')}>Ver ingresos →</button></div>
          <MrrChart m={m} />
        </div>
        <SignalList title="Para atender hoy" sub="Tocá un negocio para ver su detalle" rows={attention} kinds={['risk', 'upsell']} empty="Ningún negocio en riesgo ni cerca del límite." onOpen={onOpen} limit={5} />
      </div>
      <div className="sa-g21">
        <div className="sa-card">
          <div className="sa-card-head"><div><div className="sa-ct">Escaneos por día</div><div className="sa-csub">Todos los negocios</div></div><button className="sa-link" onClick={() => goTo('usage')}>Ver uso →</button></div>
          <LineChart labels={u.series.starts} series={[{ values: u.series.values, color: CORAL, name: 'Escaneos' }]} height={130}
            tip={i => `${short(u.series.starts[i])}: ${n(u.series.values[i])} escaneo${u.series.values[i] === 1 ? '' : 's'}`} />
        </div>
        <div className="sa-card sa-ringcard">
          <Donut size={112} parts={[{ label: 'Vuelven', value: e.returning ?? 0, color: GREEN }, { label: 'Una vez', value: e.returning == null ? 0 : 100 - e.returning, color: '#F1EBE0' }]}
            center={<b className="t">{e.returning == null ? '—' : `${e.returning}%`}</b>} />
          <div>
            <div className="sa-ct">Clientes que vuelven</div>
            <div className="sa-csub">2 visitas o más, en todos los negocios</div>
            <div className="sa-sub">{e.avgVisits ?? '—'} visitas por cliente · cada {e.medianGapDays ?? '—'} días</div>
          </div>
        </div>
      </div>
    </>
  )
}

function Income({ data }: { data: AdminOverview }) {
  const m = data.money
  const left = Math.max(0, 30 - data.historyDays)
  const pending = `Aparece con 30 días de historial (faltan ${left})`
  const plans = Object.entries(m.planCount).map(([p, c]) => `${c} ${p}`).join(' · ')
  const f = m.funnel
  const heat = (v: number | null) => v == null ? <span className="sa-muted">—</span> : <span className="sa-heat" style={{ background: `rgba(27,65,47,${0.25 + (v / 100) * 0.75})` }}>{v}%</span>
  const states = [
    { label: 'Pagando', value: m.states.paying, color: GREEN },
    { label: 'En prueba', value: m.states.trial, color: CORAL },
    { label: 'Acceso completo', value: m.states.legacy, color: SAND },
    { label: 'Pausadas', value: m.states.paused, color: GREY },
  ]
  const totalAccounts = states.reduce((t, s) => t + s.value, 0)
  return (
    <>
      <div className="sa-g5">
        <Stat label="Ingreso mensual" value={<MoneyValue m={m.mrr} />} sub={m.mrrUnknown ? `${m.mrrUnknown} pago${m.mrrUnknown === 1 ? '' : 's'} sin precio en Mercado Pago` : 'Suscripciones que renuevan'} />
        <Stat label="Proyección próximo mes" value={<MoneyValue m={m.projection} />} sub={m.projection ? `Lo que renueva + pruebas que vencen × ${m.conversion?.rate}%` : 'Cuando terminen las primeras pruebas'} />
        <Stat label="Pagando" value={m.paying} sub={plans || 'Nadie todavía'} />
        <Stat label="En prueba" value={m.trials} sub={m.trialsEnding7 ? `${m.trialsEnding7} vence${m.trialsEnding7 === 1 ? '' : 'n'} en 7 días` : 'Ninguna vence esta semana'} />
        <Stat label="Prueba → pago" value={m.conversion ? `${m.conversion.rate}%` : '—'} sub={m.conversion ? `de ${m.conversion.of} pruebas terminadas (90 días)` : 'Todavía no terminó ninguna prueba'} />
      </div>
      <div className="sa-g4 sa-gap">
        <Stat label="Ingreso promedio por negocio" value={<MoneyValue m={Object.keys(m.arpu).length ? m.arpu : null} />} sub="Por mes, de los que pagan" />
        <Stat label="Tiempo promedio pagando" value={m.lifetimeMonths ? `${m.lifetimeMonths} meses` : '—'} sub={m.lifetimeMonths ? 'Según las bajas del último mes' : m.churn === 0 ? 'Sin bajas en el último mes' : pending} />
        <Stat label="Cuánto deja cada negocio" value={<MoneyValue m={m.ltv} />} sub={m.ltv ? 'Ingreso promedio × tiempo pagando' : m.churn === 0 ? 'Sin bajas todavía para calcularlo' : pending} />
        <Stat label="Bajas por mes" value={m.churn != null ? `${m.churn}%` : '—'} sub={m.churn != null ? 'De los que pagaban hace 30 días' : pending} />
      </div>
      <div className="sa-g2">
        <div className="sa-card">
          <div className="sa-ct">Ingreso mensual</div>
          <div className="sa-csub">Últimos 6 meses</div>
          <MrrChart m={m} />
        </div>
        <div className="sa-card">
          <div className="sa-ct">Cuentas nuevas y bajas por semana</div>
          <div className="sa-csub">Últimas 8 semanas · las bajas se registran desde el 6/10/2026</div>
          <Bars labels={m.weeks} series={[m.signups, m.cancels]} colors={[GREEN, CORAL]} legend={['Nuevas', 'Bajas']} height={120}
            tip={i => `Semana del ${short(m.weeks[i])}: ${m.signups[i]} nueva${m.signups[i] === 1 ? '' : 's'}, ${m.cancels[i]} baja${m.cancels[i] === 1 ? '' : 's'}`} />
        </div>
      </div>
      <div className="sa-g2">
        <div className="sa-card sa-ringcard">
          <Donut size={128} parts={states} center={<><b className="t">{totalAccounts}</b><small>cuentas</small></>} />
          <div style={{ flex: 1 }}>
            <div className="sa-ct">Cuentas por estado</div>
            <div className="sa-csub">Hoy</div>
            <div className="sa-legend sa-legend--col">{states.map(s => <span key={s.label}><i style={{ background: s.color }} />{s.label}<b>{s.value}</b></span>)}</div>
          </div>
        </div>
        <div className="sa-card">
          <div className="sa-ct">De la prueba al pago</div>
          <div className="sa-csub">Cuentas de los últimos 90 días</div>
          <HBar label="Se registraron" value={f.signedUp} max={f.signedUp} display={f.signedUp} />
          <HBar label="Crearon la tarjeta" value={f.card} max={f.signedUp} display={f.card} />
          <HBar label="Primer escaneo" value={f.scan} max={f.signedUp} display={f.scan} />
          <HBar label="Pagaron" value={f.paid} max={f.signedUp} display={f.paid} color={GREEN} />
        </div>
      </div>
      <div className="sa-card sa-gap">
        <div className="sa-ct">Retención por mes de alta</div>
        <div className="sa-csub">% de cuentas que siguen escaneando a los 30, 60 y 90 días · — = todavía no cumplieron esa antigüedad</div>
        {m.retention.length ? (
          <table className="sa-table sa-ret">
            <thead><tr><th>Alta</th><th className="num">Cuentas</th><th>30 días</th><th>60 días</th><th>90 días</th></tr></thead>
            <tbody>{m.retention.map(r => (
              <tr key={r.month}><td>{monthName(r.month)}</td><td className="num">{r.accounts}</td><td>{heat(r.d30)}</td><td>{heat(r.d60)}</td><td>{heat(r.d90)}</td></tr>
            ))}</tbody>
          </table>
        ) : <p className="sa-empty">Todavía no hay cuentas para medir.</p>}
      </div>
    </>
  )
}

function Usage({ data }: { data: AdminOverview }) {
  const u = data.usage, f = data.features, e = data.endUsers
  const share = (x: number) => e.passes.total ? Math.round((x / e.passes.total) * 100) : 0
  const period = `${data.days} días`
  const unit = u.series.weekly ? 'Semana del ' : ''
  return (
    <>
      <div className="sa-g4">
        <Stat label="Escaneos" value={n(u.scans)} extra={<Delta v={u.scansDelta} />} />
        <Stat label="Clientes nuevos" value={n(u.newCustomers)} extra={<Delta v={u.newDelta} />} />
        <Stat label="Premios canjeados" value={n(u.redeems)} extra={<Delta v={u.redeemsDelta} />} />
        <Stat label="Negocios que escanearon" value={`${u.activeBusinesses} de ${u.businesses}`} sub={u.businesses - u.activeBusinesses ? `${u.businesses - u.activeBusinesses} sin uso en el período` : 'Todos usaron Stampa'} />
      </div>
      <div className="sa-card sa-gap">
        <div className="sa-card-head">
          <div><div className="sa-ct">Escaneos y clientes nuevos</div><div className="sa-csub">Por {u.series.weekly ? 'semana' : 'día'}, todos los negocios</div></div>
          <Legend items={[['Escaneos', GREEN], ['Clientes nuevos', CORAL]]} />
        </div>
        <LineChart labels={u.series.starts} height={170}
          series={[{ values: u.series.values, color: GREEN, name: 'Escaneos' }, { values: u.series.newCustomers, color: CORAL, name: 'Nuevos', dashed: true }]}
          tip={i => `${unit}${short(u.series.starts[i])}: ${n(u.series.values[i])} escaneos · ${n(u.series.newCustomers[i])} nuevos`} />
      </div>
      <div className="sa-g2">
        <div className="sa-card">
          <div className="sa-ct">Qué funciones usan</div>
          <div className="sa-csub">% de negocios activos</div>
          <HBar label={`Notificaciones (${period})`} value={f.notifications} />
          <HBar label={`Empleados escanean (${period})`} value={f.teamScans} />
          <HBar label="Regalo de cumpleaños" value={f.birthday} />
          <HBar label="Sello doble" value={f.doubleDays} />
          <HBar label="Vencimiento" value={f.expiry} />
          <HBar label="Preguntas propias" value={f.formFields} />
          <HBar label="Varias sucursales" value={f.locations} />
          <div className="sa-types">
            <Donut size={58} parts={[{ label: 'Sellos', value: f.cardTypes.stamp ?? 0, color: GREEN }, { label: 'Puntos', value: f.cardTypes.points ?? 0, color: CORAL }, { label: 'Niveles', value: f.cardTypes.membership ?? 0, color: SAND }]} />
            <div className="sa-legend sa-legend--col"><span><i style={{ background: GREEN }} />Sellos<b>{f.cardTypes.stamp ?? 0}%</b></span><span><i style={{ background: CORAL }} />Puntos<b>{f.cardTypes.points ?? 0}%</b></span><span><i style={{ background: SAND }} />Niveles<b>{f.cardTypes.membership ?? 0}%</b></span></div>
          </div>
        </div>
        <div className="sa-card">
          <div className="sa-ct">Clientes finales</div>
          <div className="sa-csub">Todos los negocios, todo el historial · sin nombres</div>
          <div className="sa-ringcard sa-ringcard--flat">
            <Donut size={112} parts={[{ label: 'iPhone', value: e.passes.apple, color: GREEN }, { label: 'Android', value: e.passes.google, color: CORAL }, { label: 'Sin Wallet', value: Math.max(0, e.passes.total - e.passes.apple - e.passes.google), color: '#E6DED1' }]}
              center={<><b className="t">{n(e.passes.total)}</b><small>tarjetas</small></>} />
            <div className="sa-legend sa-legend--col" style={{ flex: 1 }}>
              <span><i style={{ background: GREEN }} />iPhone<b>{share(e.passes.apple)}%</b></span>
              <span><i style={{ background: CORAL }} />Android<b>{share(e.passes.google)}%</b></span>
              <span><i style={{ background: '#E6DED1' }} />Sin agregar al Wallet<b>{share(Math.max(0, e.passes.total - e.passes.apple - e.passes.google))}%</b></span>
            </div>
          </div>
          <HBar label="Vuelven (2+ visitas)" value={e.returning} color={GREEN} />
          <HBar label="Canjearon un premio" value={e.redeemed} color={GREEN} />
          <div className="sa-mini">
            <div><span>Visitas promedio por cliente</span><b>{e.avgVisits ?? '—'}</b></div>
            <div><span>Días entre visitas (mediana)</span><b>{e.medianGapDays ?? '—'}</b></div>
            <div><span>Clientes (personas distintas)</span><b>{n(e.people)}</b></div>
            <div><span>Clientes por negocio (promedio)</span><b>{e.perBusiness ?? '—'}</b></div>
          </div>
        </div>
      </div>
    </>
  )
}

type Filter = 'all' | 'risk' | 'upsell' | 'trial' | 'active'

function Businesses({ data, onOpen }: { data: AdminOverview; onOpen: (id: string) => void }) {
  const [filter, setFilter] = useState<Filter>('all')
  const rows = useMemo(() => data.businesses.filter(r =>
    filter === 'all' ? true
      : filter === 'risk' ? r.signals.some(s => s.kind === 'risk')
      : filter === 'upsell' ? r.signals.some(s => s.kind === 'upsell')
      : r.access === filter), [data.businesses, filter])
  const risk = data.businesses.filter(r => r.isActive && r.signals.some(s => s.kind === 'risk'))
  const upsell = data.businesses.filter(r => r.isActive && r.signals.some(s => s.kind === 'upsell'))
  const chips: [Filter, string, number][] = [
    ['all', 'Todos', data.businesses.length], ['risk', 'En riesgo', risk.length], ['upsell', 'Para mejorar plan', upsell.length],
    ['trial', 'En prueba', data.businesses.filter(r => r.access === 'trial').length], ['active', 'Pagando', data.businesses.filter(r => r.access === 'active').length],
  ]
  return (
    <>
      <div className="sa-g2" style={{ marginTop: 0 }}>
        <SignalList title="En riesgo de darse de baja" sub="Pagan y el uso cayó, falló el cobro o la prueba vence sin uso" rows={risk} kinds={['risk']} empty="Nadie en riesgo ahora." onOpen={onOpen} />
        <SignalList title="Para ofrecer un plan mayor" sub="Cerca del límite de clientes o notificaciones" rows={upsell} kinds={['upsell']} empty="Nadie cerca del límite." onOpen={onOpen} />
      </div>
      <div className="sa-card sa-gap">
        <div className="sa-card-head">
          <div><div className="sa-ct">Ranking</div><div className="sa-csub">Tocá un negocio para ver su detalle · tendencia = días con escaneos en las últimas 8 semanas</div></div>
          <div className="sa-pills">
            {chips.map(([k, l, c]) => <button key={k} className={`sa-rp${filter === k ? ' is-on' : ''}`} aria-pressed={filter === k} onClick={() => setFilter(k)}>{l} · {c}</button>)}
          </div>
        </div>
        <div className="sa-table-wrap">
          <table className="sa-table sa-rank">
            <thead><tr><th>Negocio</th><th>Plan</th><th className="num">Escaneos</th><th className="num">vs antes</th><th>Tendencia</th><th className="num">Nuevos</th><th className="num">Canjes</th><th className="num">Paga por mes</th><th>Último escaneo</th><th>Señal</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} tabIndex={0} onClick={() => onOpen(r.id)} onKeyDown={ev => { if (ev.key === 'Enter') onOpen(r.id) }}>
                  <td><b>{r.name}</b>{data.countries.length > 1 && <span className="sa-muted"> · {r.country}</span>}<div className="sa-muted sa-email">{r.ownerEmail}</div></td>
                  <td>{r.plan}<div className="sa-muted sa-email">{ACCESS[r.access] || r.access}{r.trialDaysLeft != null ? ` · ${r.trialDaysLeft} d` : ''}</div></td>
                  <td className="num">{n(r.scans)}</td>
                  <td className={`num ${r.scansDelta == null ? '' : r.scansDelta > 0 ? 'up' : r.scansDelta < 0 ? 'dn' : ''}`}>{r.scansDelta == null ? (r.scans ? 'nuevo' : '—') : `${r.scansDelta > 0 ? '+' : ''}${r.scansDelta}%`}</td>
                  <td><Spark values={r.trend} /></td>
                  <td className="num">{n(r.newCustomers)}</td>
                  <td className="num">{n(r.redeems)}</td>
                  <td className="num">{r.pays ? money(r.pays.monthly, r.pays.currency) : <span className="sa-muted">{r.access === 'trial' ? 'prueba' : '—'}</span>}</td>
                  <td>{ago(r.lastScanAt)}</td>
                  <td>{r.signals.map((s, i) => <span key={i} className={`sa-tag sa-tag--${s.kind}`}>{s.text}</span>)}</td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={10} className="sa-muted">No hay negocios con ese filtro.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function Detail({ id, days, onClose }: { id: string; days: number; onClose: () => void }) {
  const [d, setD] = useState<AdminBusinessDetail | null>(null)
  const [err, setErr] = useState(false)
  useEffect(() => {
    let alive = true
    apiAdminBusiness(id, days).then(r => { if (alive) setD(r) }).catch(() => { if (alive) setErr(true) })
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { alive = false; window.removeEventListener('keydown', onKey) }
  }, [id, days, onClose])
  const share = (x: number) => d?.passes.total ? Math.round((x / d.passes.total) * 100) : 0
  const yes = (v: boolean) => <b className={v ? 'up' : 'sa-muted'}>{v ? 'Sí' : 'No'}</b>
  return (
    <div className="sa-overlay" onClick={onClose}>
      <aside className="sa-drawer" role="dialog" aria-modal="true" aria-label="Detalle del negocio" onClick={e => e.stopPropagation()}>
        <button className="sa-close" onClick={onClose} aria-label="Cerrar">×</button>
        {err ? <p>No se pudo cargar el negocio.</p> : !d ? <p className="sa-muted">Cargando…</p> : (
          <>
            <h2 className="t" style={{ margin: '0 0 2px', fontSize: 20 }}>{d.name}</h2>
            <p className="sa-muted" style={{ margin: 0 }}>{d.owner?.email} · {COUNTRY[d.country] || d.country} · alta {fmtDate(d.createdAt)}{!d.isActive && ' · inactivo'}</p>
            <div className="sa-g2 sa-tight">
              <Stat label="Plan" value={d.owner?.plan || '—'}
                sub={[ACCESS[d.owner?.access || ''], d.owner?.pays ? `${money(d.owner.pays.monthly, d.owner.pays.currency)} por mes` : null,
                  d.owner?.nextPaymentDate ? `próximo cobro ${fmtDate(d.owner.nextPaymentDate)}` : null,
                  d.owner?.access === 'trial' && d.owner.trialEndsAt ? `vence ${fmtDate(d.owner.trialEndsAt)}` : null].filter(Boolean).join(' · ')} />
              <Stat label={`Escaneos (${d.period.days} días)`} value={n(d.period.scans)} sub={`${n(d.period.newCustomers)} clientes nuevos · ${n(d.period.redeems)} canjes`} />
            </div>
            <div className="sa-card sa-gap">
              <div className="sa-ct">Escaneos por semana</div>
              <div className="sa-csub">Últimas 12 semanas</div>
              <LineChart labels={d.weeks} series={[{ values: d.scansWeekly, color: GREEN, name: 'Escaneos' }]} height={100} tip={i => `Semana del ${short(d.weeks[i])}: ${d.scansWeekly[i]}`} />
            </div>
            <div className="sa-card sa-gap sa-ringcard">
              <Donut size={96} parts={[{ label: 'iPhone', value: d.passes.apple, color: GREEN }, { label: 'Android', value: d.passes.google, color: CORAL }, { label: 'Sin Wallet', value: Math.max(0, d.passes.total - d.passes.apple - d.passes.google), color: '#E6DED1' }]}
                center={<><b className="t">{n(d.customers)}</b><small>clientes</small></>} />
              <div className="sa-legend sa-legend--col" style={{ flex: 1 }}>
                <span><i style={{ background: GREEN }} />iPhone<b>{share(d.passes.apple)}%</b></span>
                <span><i style={{ background: CORAL }} />Android<b>{share(d.passes.google)}%</b></span>
                <span>Vuelven<b>{d.endUsers.returning != null ? `${d.endUsers.returning}%` : '—'}</b></span>
                <span>Visitas por cliente<b>{d.endUsers.avgVisits ?? '—'}</b></span>
              </div>
            </div>
            <h3>Qué usa</h3>
            <div className="sa-mini sa-mini--plain">
              <div><span>Tarjetas</span><b>{d.features.cards.filter(c => c.isActive).map(c => `${c.name} (${CARD_TYPE[c.type] || c.type})`).join(' · ') || 'Ninguna activa'}</b></div>
              <div><span>Notificaciones ({d.period.days} días)</span><b>{d.features.notifications}</b></div>
              <div><span>Regalo de cumpleaños</span>{yes(d.features.birthday)}</div>
              <div><span>Sello doble</span>{yes(d.features.doubleDays)}</div>
              <div><span>Vencimiento por inactividad</span>{yes(d.features.expiry)}</div>
              <div><span>Equipo</span><b>{d.features.team} persona{d.features.team === 1 ? '' : 's'}{d.features.teamScans ? ' · escanearon' : ''}</b></div>
              <div><span>Sucursales</span><b>{d.features.locations || 1}</b></div>
            </div>
            <h3>Notificaciones enviadas</h3>
            {d.notifications.length ? (
              <ul className="sa-list">{d.notifications.map((x, i) => <li key={i}><span>{x.title || 'Sin título'} <span className="sa-muted">· {x.audience === 'all' ? 'todos' : x.audience}</span></span><span className="sa-muted">{x.recipients ?? '—'} · {fmtDate(x.sentAt)}</span></li>)}</ul>
            ) : <p className="sa-muted">Ninguna todavía.</p>}
            <h3>Historial del plan</h3>
            {d.history.length ? (
              <ul className="sa-list">{d.history.map((h, i) => <li key={i}><span>{h.type === 'signup' ? `Se registró (${h.plan})` : `${STATUS[h.from || ''] || h.from || 'sin estado'} → ${STATUS[h.to || ''] || h.to || 'sin estado'}${h.planFrom !== h.planTo ? ` · ${h.planFrom} → ${h.planTo}` : ''}`}</span><span className="sa-muted">{fmtDate(h.at)}</span></li>)}</ul>
            ) : <p className="sa-muted">Sin cambios registrados (se anotan desde el 6/10/2026).</p>}
          </>
        )}
      </aside>
    </div>
  )
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=Inter:wght@400;500;600;700&display=swap');
  html,body{background:#FBF6EE!important;}
  .t{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;color:#2B2620;}
  .sa-shell{display:flex;min-height:100vh;background:#FBF6EE;color:#2B2620;font-family:'Inter',sans-serif;font-size:13px;}
  .sa-shell *{box-sizing:border-box;}
  .sa-side{width:220px;flex-shrink:0;background:#1B412F;color:#F7F0E4;padding:22px 14px;position:sticky;top:0;height:100vh;display:flex;flex-direction:column;gap:18px;}
  .sa-brand .t{color:#F7F0E4;font-size:20px;letter-spacing:-.01em;display:block;padding:0 8px;}
  .sa-brand small{display:block;font-size:11px;color:rgba(247,240,228,.55);padding:2px 8px 0;}
  .sa-tabs{display:flex;flex-direction:column;gap:4px;}
  .sa-tab{display:flex;align-items:center;gap:10px;width:100%;border:none;background:none;color:rgba(247,240,228,.7);padding:10px 12px;border-radius:10px;font:inherit;font-size:13.5px;cursor:pointer;text-align:left;}
  .sa-tab svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0;}
  .sa-tab:hover{background:rgba(247,240,228,.07);color:#fff;}
  .sa-tab.is-on{background:rgba(247,240,228,.13);color:#fff;font-weight:600;}
  .sa-tab em{margin-left:auto;font-style:normal;background:#C75D3A;color:#fff;border-radius:99px;font-size:10.5px;font-weight:700;padding:1px 7px;}
  .sa-back{margin-top:auto;color:rgba(247,240,228,.6);font-size:12px;text-decoration:none;padding:8px 12px;}
  .sa-back:hover{color:#fff;}
  .sa-main{flex:1;min-width:0;padding:24px 28px 60px;max-width:1240px;}
  .sa-stale{opacity:.55;transition:opacity .2s;}
  .sa h1,.sa-main h1{font-size:22px;margin:0;}
  .sa-main h3,.sa-drawer h3{font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;margin:20px 0 6px;}
  .sa-muted{color:rgba(43,38,32,.5);}
  .sa-head{display:flex;justify-content:space-between;align-items:flex-end;gap:14px;flex-wrap:wrap;margin-bottom:18px;}
  .sa-head p{margin:4px 0 0;font-size:12px;}
  .sa-tools{display:flex;gap:10px;align-items:center;flex-wrap:wrap;}
  .sa-pills{display:flex;gap:6px;flex-wrap:wrap;}
  .sa-gp{font-size:12px;padding:7px 14px;border-radius:20px;border:1.5px solid rgba(43,38,32,.12);background:#fff;color:rgba(43,38,32,.55);cursor:pointer;font-family:inherit;}
  .sa-gp.is-on{background:#1B412F;border-color:#1B412F;color:#F7F0E4;font-weight:600;}
  .sa-rp{font-size:11px;padding:6px 12px;border-radius:20px;border:1px solid rgba(43,38,32,.12);background:#fff;color:rgba(43,38,32,.55);cursor:pointer;font-family:inherit;}
  .sa-rp.is-on{background:rgba(199,93,58,.1);border-color:#C75D3A;color:#C75D3A;font-weight:600;}
  .sa-btn{border:none;background:#C75D3A;color:#fff;font-weight:700;font-size:13px;border-radius:9px;padding:9px 14px;cursor:pointer;font-family:inherit;}
  .sa-link{border:none;background:none;color:#C75D3A;font:inherit;font-size:11.5px;font-weight:600;cursor:pointer;padding:0;}
  .sa-g5{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;}
  .sa-g4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;}
  .sa-g2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px;}
  .sa-g21{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr);gap:12px;margin-top:12px;}
  .sa-gap{margin-top:12px;}
  .sa-card{background:#fff;border:1px solid rgba(43,38,32,.07);border-radius:14px;padding:14px 16px;box-shadow:0 1px 8px rgba(43,38,32,.04);min-width:0;}
  .sa-card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap;margin-bottom:10px;}
  .sa-card-head .sa-csub{margin-bottom:0;}
  .sa-k{font-size:11.5px;color:rgba(43,38,32,.55);}
  .sa-v{font-family:'Plus Jakarta Sans',sans-serif;font-size:22px;font-weight:800;margin-top:4px;line-height:1.2;}
  .sa-v2{font-size:13px;font-weight:700;color:rgba(43,38,32,.7);}
  .sa-sub{font-size:11px;color:rgba(43,38,32,.45);margin-top:4px;line-height:1.4;}
  .sa-delta{font-size:11px;font-weight:700;margin-top:5px;color:rgba(43,38,32,.45);}
  .up{color:#2E7D4F!important;} .dn{color:#B4442A!important;}
  .sa-ct{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:13px;}
  .sa-csub{font-size:11px;color:rgba(43,38,32,.45);margin:2px 0 10px;}
  .sa-empty{font-size:12px;color:rgba(43,38,32,.45);margin:8px 0 0;}
  .sa-line{position:relative;padding-bottom:16px;}
  .sa-line svg{display:block;width:100%;height:calc(100% - 4px);overflow:visible;}
  .sa-hit{position:absolute;inset:0 0 16px 0;display:flex;}
  .sa-hit div{flex:1;position:relative;cursor:default;}
  .sa-dot{position:absolute;width:9px;height:9px;border-radius:50%;border:2px solid #fff;transform:translate(-50%,-50%);pointer-events:none;box-shadow:0 1px 3px rgba(0,0,0,.2);}
  .sa-axis{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:space-between;}
  .sa-axis span{font-size:9.5px;color:rgba(43,38,32,.45);flex:1;text-align:center;white-space:nowrap;}
  .sa-axis span:first-child{text-align:left;} .sa-axis span:last-child{text-align:right;}
  .sa-tip{position:absolute;bottom:calc(100% + 4px);left:50%;transform:translateX(-50%);background:#2B2620;color:#F7F0E4;font-size:11px;padding:6px 9px;border-radius:7px;white-space:nowrap;z-index:5;pointer-events:none;}
  .sa-hit .sa-tip{bottom:auto;top:-6px;}
  .sa-tip.is-left{left:auto;right:0;transform:none;} .sa-tip.is-right{left:0;transform:none;}
  .sa-bars{display:flex;gap:4px;}
  .sa-bar-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0;position:relative;cursor:default;}
  .sa-bar-col span{font-size:9.5px;color:rgba(43,38,32,.45);height:12px;white-space:nowrap;}
  .sa-bar-stack{flex:1;width:100%;display:flex;align-items:flex-end;gap:2px;}
  .sa-bar-stack i{flex:1;border-radius:4px 4px 0 0;min-height:2px;}
  .sa-legend{display:flex;gap:16px;font-size:11.5px;color:rgba(43,38,32,.65);margin-top:8px;flex-wrap:wrap;}
  .sa-legend i{display:inline-block;width:9px;height:9px;border-radius:3px;margin-right:6px;vertical-align:middle;}
  .sa-legend--col{flex-direction:column;gap:7px;margin-top:4px;}
  .sa-legend--col span{display:flex;align-items:center;}
  .sa-legend--col b{margin-left:auto;padding-left:12px;color:#2B2620;}
  .sa-card-head .sa-legend{margin-top:0;}
  .sa-donut{position:relative;flex-shrink:0;}
  .sa-donut svg{width:100%;height:100%;transform:rotate(0deg);}
  .sa-donut-c{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.1;}
  .sa-donut-c b{font-size:18px;} .sa-donut-c small{font-size:10px;color:rgba(43,38,32,.5);}
  .sa-ringcard{display:flex;align-items:center;gap:18px;}
  .sa-ringcard--flat{margin-bottom:6px;}
  .sa-hbar{display:grid;grid-template-columns:minmax(120px,40%) 1fr 44px;align-items:center;gap:10px;margin:8px 0;font-size:12px;}
  .sa-hbar div{height:8px;background:#F1EBE0;border-radius:99px;overflow:hidden;}
  .sa-hbar i{display:block;height:100%;border-radius:99px;}
  .sa-hbar b{text-align:right;}
  .sa-types{display:flex;align-items:center;gap:16px;margin-top:12px;padding-top:12px;border-top:1px solid rgba(43,38,32,.06);}
  .sa-types .sa-legend--col{flex:1;}
  .sa-mrr-empty{padding:6px 0 4px;}
  .sa-allgood{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center;min-height:110px;height:calc(100% - 40px);}
  .sa-allgood svg{width:34px;height:34px;fill:none;stroke:#2E7D4F;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;}
  .sa-allgood p{margin:0;font-size:12px;color:rgba(43,38,32,.55);max-width:220px;}
  .sa-mrr-empty p{font-size:12px;line-height:1.5;margin:8px 0 0;max-width:520px;}
  .sa-table{width:100%;border-collapse:collapse;font-size:12.5px;}
  .sa-table th{font-weight:600;font-size:10.5px;color:rgba(43,38,32,.45);text-align:left;padding:8px 10px;border-bottom:1px solid rgba(43,38,32,.08);white-space:nowrap;}
  .sa-table td{padding:9px 10px;border-bottom:1px solid rgba(43,38,32,.05);vertical-align:middle;}
  .sa-table .num{text-align:right;white-space:nowrap;}
  .sa-ret td,.sa-ret th{padding:7px 8px;}
  .sa-heat{display:inline-block;min-width:56px;text-align:center;color:#fff;font-weight:600;border-radius:6px;padding:4px 6px;font-size:11.5px;}
  .sa-table-wrap{overflow-x:auto;margin:0 -16px -14px;}
  .sa-rank{min-width:980px;}
  .sa-rank th:first-child,.sa-rank td:first-child{padding-left:16px;}
  .sa-rank tbody tr{cursor:pointer;}
  .sa-rank tbody tr:hover,.sa-rank tbody tr:focus{background:#FBF8F3;outline:none;}
  .sa-email{font-size:11px;margin-top:2px;}
  .sa-tag{display:inline-block;font-size:10.5px;padding:2px 8px;border-radius:99px;margin:1px 4px 1px 0;white-space:nowrap;}
  .sa-tag--risk{background:#FBE7E1;color:#9A3F22;}
  .sa-tag--upsell{background:#E3EFE5;color:#2E5E3A;}
  .sa-tag--idle{background:#F1EBE0;color:#6B635A;}
  .sa-row{display:flex;justify-content:space-between;align-items:center;gap:10px;width:100%;background:none;border:none;border-top:1px solid rgba(43,38,32,.06);padding:8px 0;font:inherit;color:inherit;text-align:left;cursor:pointer;}
  .sa-row:hover > span:first-child{text-decoration:underline;}
  .sa-mini{margin-top:10px;}
  .sa-mini div{display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-top:1px solid rgba(43,38,32,.06);font-size:12px;}
  .sa-mini b{text-align:right;}
  .sa-mini--plain{margin-top:0;}
  .sa-overlay{position:fixed;inset:0;background:rgba(43,38,32,.35);display:flex;justify-content:flex-end;z-index:50;}
  .sa-drawer{width:min(560px,100%);height:100%;overflow-y:auto;background:#FBF6EE;padding:22px 22px 40px;position:relative;font-family:'Inter',sans-serif;font-size:13px;color:#2B2620;}
  .sa-drawer *{box-sizing:border-box;}
  .sa-close{position:absolute;top:10px;right:14px;border:none;background:none;font-size:26px;cursor:pointer;color:#2B2620;}
  .sa-tight{grid-template-columns:repeat(2,minmax(0,1fr));}
  .sa-list{list-style:none;padding:0;margin:0;}
  .sa-list li{display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-top:1px solid rgba(43,38,32,.06);font-size:12px;}
  @media (max-width:1180px){
    .sa-g5{grid-template-columns:repeat(6,minmax(0,1fr));}
    .sa-g5>*{grid-column:span 2;} .sa-g5>:nth-child(n+4){grid-column:span 3;}
    .sa-g21{grid-template-columns:minmax(0,1fr);}
  }
  @media (max-width:860px){
    .sa-shell{flex-direction:column;}
    .sa-side{position:sticky;top:0;z-index:20;width:100%;height:auto;flex-direction:row;align-items:center;padding:10px 12px;gap:10px;}
    .sa-brand small,.sa-back{display:none;}
    .sa-brand .t{font-size:16px;padding:0 4px;}
    .sa-tabs{flex-direction:row;overflow-x:auto;gap:2px;scrollbar-width:none;}
    .sa-tabs::-webkit-scrollbar{display:none;}
    .sa-tab{padding:8px 10px;font-size:12.5px;white-space:nowrap;width:auto;}
    .sa-tab svg{display:none;}
    .sa-main{padding:18px 16px 48px;}
    .sa-g5,.sa-g4{grid-template-columns:repeat(2,minmax(0,1fr));}
    .sa-g5>*,.sa-g5>:nth-child(n+4){grid-column:span 1;}
    .sa-g5>:last-child{grid-column:span 2;}
    .sa-g2,.sa-tight{grid-template-columns:minmax(0,1fr);}
    .sa-v{font-size:19px;}
    .sa-ringcard{gap:14px;}
  }
`
