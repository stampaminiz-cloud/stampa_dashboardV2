'use client'

// Panel del dueño de Stampa: la plata y cómo usan el servicio los negocios.
// Mismo lenguaje visual que la pestaña Analítica del panel de los negocios.
// Solo para los emails de ADMIN_EMAILS (el backend responde 404 al resto),
// solo lectura y sin datos de los clientes finales.
// Backend: routes/admin.js, services/adminMetrics.js.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiAdminBusiness, apiAdminOverview, getToken, type AdminBusinessDetail, type AdminBusinessRow, type AdminOverview, type Money } from '@/lib/api'

const COUNTRY: Record<string, string> = { AR: 'Argentina', ES: 'España', UY: 'Uruguay', CL: 'Chile', MX: 'México' }
const ACCESS: Record<string, string> = { trial: 'En prueba', active: 'Pagando', legacy: 'Acceso completo', paused: 'Pausada' }
const STATUS: Record<string, string> = { active: 'pagando', past_due: 'cobro fallido', paused: 'pausada', cancelled: 'cancelada', trialing: 'en prueba', legacy: 'acceso completo' }
const CARD_TYPE: Record<string, string> = { stamp: 'Sellos', points: 'Puntos', membership: 'Niveles' }
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const CORAL = '#C75D3A', GREEN = '#1B412F'

const n = (x: number) => x.toLocaleString('es-AR')
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'
const short = (iso: string) => { const d = new Date(iso); return `${d.getUTCDate()}/${d.getUTCMonth() + 1}` }
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

type Filter = 'all' | 'risk' | 'upsell' | 'trial' | 'active'

export default function AdminPage() {
  const [days, setDays] = useState(30)
  const [country, setCountry] = useState('all')
  const [data, setData] = useState<AdminOverview | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'notfound' | 'error'>('loading')
  const [open, setOpen] = useState<string | null>(null)

  const load = useCallback(async (d: number, c: string) => {
    setState(s => (s === 'ok' ? 'ok' : 'loading'))
    try {
      setData(await apiAdminOverview(d, c))
      setState('ok')
    } catch (err) {
      setState((err as { status?: number })?.status === 404 ? 'notfound' : 'error')
    }
  }, [])

  useEffect(() => {
    if (!getToken()) { window.location.href = '/login'; return }
    load(days, country)
  }, [load, days, country])

  if (state === 'notfound') return <Center><h1 className="t" style={{ fontSize: 22 }}>Página no encontrada</h1><a href="/dashboard" style={{ color: CORAL }}>Volver al panel</a></Center>
  if (state === 'error') return <Center><p>No se pudieron cargar los números.</p><button className="sa-btn" onClick={() => load(days, country)}>Reintentar</button></Center>
  if (!data) return <Center><p style={{ color: 'rgba(43,38,32,.5)' }}>Calculando…</p></Center>

  return (
    <div className="sa">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <header className="sa-head">
        <div>
          <h1 className="t">Stampa · tus números</h1>
          <p className="sa-muted">Solo vos ves esta página · actualizado {ago(data.generatedAt)}</p>
        </div>
        <div className="sa-tools">
          {data.countries.length > 1 && (
            <div className="sa-pills">
              {['all', ...data.countries].map(c => (
                <button key={c} className={`sa-gp${country === c ? ' is-on' : ''}`} aria-pressed={country === c} onClick={() => setCountry(c)}>{c === 'all' ? 'Todos' : COUNTRY[c] || c}</button>
              ))}
            </div>
          )}
          <div className="sa-pills">
            {[7, 30, 90].map(d => (
              <button key={d} className={`sa-rp${days === d ? ' is-on' : ''}`} aria-pressed={days === d} onClick={() => setDays(d)}>{d} días</button>
            ))}
          </div>
          <a className="sa-ghost" href="/dashboard">Ir a mi panel</a>
        </div>
      </header>

      <MoneySection data={data} />
      <UsageSection data={data} onOpen={setOpen} />

      {open && <Detail id={open} days={days} onClose={() => setOpen(null)} />}
    </div>
  )
}

function Center({ children }: { children: React.ReactNode }) {
  return <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', justifyContent: 'center', background: '#FBF6EE', color: '#2B2620', padding: 16, textAlign: 'center', fontFamily: 'Inter, sans-serif' }}><style dangerouslySetInnerHTML={{ __html: CSS }} />{children}</div>
}

function Delta({ v, suffix = '%', invert = false }: { v: number | null | undefined; suffix?: string; invert?: boolean }) {
  if (v == null) return null
  const good = invert ? v < 0 : v > 0
  return <div className={`sa-delta ${v === 0 ? '' : good ? 'up' : 'dn'}`}>{v > 0 ? '+' : ''}{v}{suffix} vs período anterior</div>
}

function Stat({ label, value, sub, extra }: { label: string; value: React.ReactNode; sub?: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div className="sa-card">
      <div className="sa-k">{label}</div>
      <div className="sa-v">{value}</div>
      {sub && <div className="sa-sub">{sub}</div>}
      {extra}
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
      {legend && <div className="sa-legend">{legend.map((x, j) => <span key={x}><i style={{ background: colors[j] }} />{x}</span>)}</div>}
    </div>
  )
}

function Meter({ label, value, color = CORAL }: { label: string; value: number | null; color?: string }) {
  return (
    <div className="sa-meter">
      <div className="sa-meter-top"><span>{label}</span><b>{value == null ? '—' : `${value}%`}</b></div>
      <div className="sa-track"><i style={{ width: `${value || 0}%`, background: color }} /></div>
    </div>
  )
}

function MoneySection({ data }: { data: AdminOverview }) {
  const m = data.money
  const mrr = moneyList(m.mrr)
  const left = Math.max(0, 30 - data.historyDays)
  const pending = `Se completa con 30 días de historial (faltan ${left})`
  const mrrDelta = (() => {
    if (!m.mrrPrev || !mrr.length) return null
    const [cur, v] = mrr[0]
    const prev = m.mrrPrev[cur] || 0
    return prev ? Math.round(((v - prev) / prev) * 100) : null
  })()
  const plans = Object.entries(m.planCount).map(([p, c]) => `${c} ${p}`).join(' · ')
  const moneyValue = (x: Money | null) => {
    const list = moneyList(x)
    return list.length ? <>{money(list[0][1], list[0][0])}{list.slice(1).map(([c, v]) => <div key={c} className="sa-v2">+ {money(v, c)}</div>)}</> : '—'
  }
  const heat = (v: number | null) => v == null ? <span className="sa-muted">—</span> : <span className="sa-heat" style={{ background: `rgba(27,65,47,${0.25 + (v / 100) * 0.75})` }}>{v}%</span>
  return (
    <section>
      <div className="sa-lbl">Plata</div>
      <div className="sa-g5">
        <Stat label="Ingreso mensual" value={moneyValue(m.mrr)}
          sub={m.mrrUnknown ? `${m.mrrUnknown} pago${m.mrrUnknown === 1 ? '' : 's'} sin precio en Mercado Pago` : 'Suscripciones que renuevan'}
          extra={mrrDelta != null ? <div className={`sa-delta ${mrrDelta > 0 ? 'up' : mrrDelta < 0 ? 'dn' : ''}`}>{mrrDelta > 0 ? '+' : ''}{mrrDelta}% vs hace 30 días</div> : null} />
        <Stat label="Proyección próximo mes" value={moneyValue(m.projection)}
          sub={m.projection ? `Lo que renueva + pruebas que vencen × ${m.conversion?.rate}%` : 'Cuando terminen las primeras pruebas'} />
        <Stat label="Pagando" value={m.paying} sub={plans || 'Nadie todavía'} />
        <Stat label="En prueba" value={m.trials} sub={m.trialsEnding7 ? `${m.trialsEnding7} vence${m.trialsEnding7 === 1 ? '' : 'n'} en 7 días` : 'Ninguna vence esta semana'} />
        <Stat label="Prueba → pago" value={m.conversion ? `${m.conversion.rate}%` : '—'} sub={m.conversion ? `de ${m.conversion.of} pruebas terminadas (90 días)` : 'Todavía no terminó ninguna prueba'} />
      </div>
      <div className="sa-g4">
        <Stat label="Ingreso promedio por negocio" value={moneyValue(Object.keys(m.arpu).length ? m.arpu : null)} sub="Por mes, de los que pagan" />
        <Stat label="Tiempo promedio pagando" value={m.lifetimeMonths ? `${m.lifetimeMonths} meses` : '—'} sub={m.lifetimeMonths ? 'Según las bajas del último mes' : m.churn === 0 ? 'Sin bajas en el último mes' : pending} />
        <Stat label="Cuánto deja cada negocio" value={moneyValue(m.ltv)} sub={m.ltv ? 'Ingreso promedio × tiempo pagando' : m.churn === 0 ? 'Sin bajas todavía para calcularlo' : pending} />
        <Stat label="Bajas por mes" value={m.churn != null ? `${m.churn}%` : '—'} sub={m.churn != null ? 'De los que pagaban hace 30 días' : pending} />
      </div>
      <div className="sa-g2">
        <div className="sa-card">
          <div className="sa-ct">Cuentas nuevas y bajas por semana</div>
          <div className="sa-csub">Últimas 8 semanas · las bajas se registran desde el 6/10/2026</div>
          <Bars labels={m.weeks} series={[m.signups, m.cancels]} colors={[GREEN, CORAL]} legend={['Nuevas', 'Bajas']}
            tip={i => `Semana del ${short(m.weeks[i])}: ${m.signups[i]} nueva${m.signups[i] === 1 ? '' : 's'}, ${m.cancels[i]} baja${m.cancels[i] === 1 ? '' : 's'}`} />
        </div>
        <div className="sa-card">
          <div className="sa-ct">Retención por mes de alta</div>
          <div className="sa-csub">% de cuentas que siguen escaneando a los 30, 60 y 90 días</div>
          {m.retention.length ? (
            <table className="sa-table sa-ret">
              <thead><tr><th>Alta</th><th className="num">Cuentas</th><th>30 días</th><th>60 días</th><th>90 días</th></tr></thead>
              <tbody>{m.retention.map(r => (
                <tr key={r.month}><td>{MONTHS[Number(r.month.slice(5)) - 1]}</td><td className="num">{r.accounts}</td><td>{heat(r.d30)}</td><td>{heat(r.d60)}</td><td>{heat(r.d90)}</td></tr>
              ))}</tbody>
            </table>
          ) : <p className="sa-muted">Todavía no hay cuentas para medir.</p>}
          <div className="sa-csub" style={{ marginTop: 8, marginBottom: 0 }}>— = todavía no cumplieron esa antigüedad</div>
        </div>
      </div>
      {m.legacy > 0 && <p className="sa-note">{m.legacy} cuenta{m.legacy === 1 ? '' : 's'} con acceso completo sin cobro (legacy o de prueba) no suman al ingreso.</p>}
    </section>
  )
}

function UsageSection({ data, onOpen }: { data: AdminOverview; onOpen: (id: string) => void }) {
  const u = data.usage, f = data.features, e = data.endUsers
  const [filter, setFilter] = useState<Filter>('all')
  const rows = useMemo(() => data.businesses.filter(r =>
    filter === 'all' ? true
      : filter === 'risk' ? r.signals.some(s => s.kind === 'risk')
      : filter === 'upsell' ? r.signals.some(s => s.kind === 'upsell')
      : r.access === filter), [data.businesses, filter])
  const risk = data.businesses.filter(r => r.isActive && r.signals.some(s => s.kind === 'risk'))
  const upsell = data.businesses.filter(r => r.isActive && r.signals.some(s => s.kind === 'upsell'))
  const share = (x: number) => e.passes.total ? Math.round((x / e.passes.total) * 100) : null
  const chips: [Filter, string, number][] = [
    ['all', 'Todos', data.businesses.length], ['risk', 'En riesgo', risk.length], ['upsell', 'Para mejorar plan', upsell.length],
    ['trial', 'En prueba', data.businesses.filter(r => r.access === 'trial').length], ['active', 'Pagando', data.businesses.filter(r => r.access === 'active').length],
  ]
  const period = `${data.days} días`
  return (
    <section>
      <div className="sa-lbl">Uso de tus clientes · últimos {period}</div>
      <div className="sa-g4">
        <Stat label="Escaneos" value={n(u.scans)} extra={<Delta v={u.scansDelta} />} />
        <Stat label="Clientes nuevos" value={n(u.newCustomers)} extra={<Delta v={u.newDelta} />} />
        <Stat label="Premios canjeados" value={n(u.redeems)} extra={<Delta v={u.redeemsDelta} />} />
        <Stat label="Negocios que escanearon" value={`${u.activeBusinesses} de ${u.businesses}`} sub={u.businesses - u.activeBusinesses ? `${u.businesses - u.activeBusinesses} sin uso en el período` : 'Todos usaron Stampa'} />
      </div>
      <div className="sa-card sa-gap">
        <div className="sa-ct">Escaneos por {u.series.weekly ? 'semana' : 'día'}</div>
        <div className="sa-csub">Todos los negocios{data.country !== 'all' ? ` de ${COUNTRY[data.country] || data.country}` : ''}</div>
        <Bars labels={u.series.starts} series={[u.series.values]} colors={[GREEN]} height={120}
          tip={i => `${u.series.weekly ? 'Semana del ' : ''}${short(u.series.starts[i])}: ${n(u.series.values[i])} escaneo${u.series.values[i] === 1 ? '' : 's'}`} />
      </div>

      <div className="sa-card sa-gap">
        <div className="sa-card-head">
          <div><div className="sa-ct">Ranking de negocios</div><div className="sa-csub">Tocá uno para ver su detalle</div></div>
          <div className="sa-pills">
            {chips.map(([k, l, c]) => <button key={k} className={`sa-rp${filter === k ? ' is-on' : ''}`} aria-pressed={filter === k} onClick={() => setFilter(k)}>{l} · {c}</button>)}
          </div>
        </div>
        <div className="sa-table-wrap">
          <table className="sa-table sa-rank">
            <thead><tr><th>Negocio</th><th>Plan</th><th className="num">Escaneos</th><th className="num">vs antes</th><th className="num">Nuevos</th><th className="num">Canjes</th><th className="num">Paga por mes</th><th>Último escaneo</th><th>Señal</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} tabIndex={0} onClick={() => onOpen(r.id)} onKeyDown={ev => { if (ev.key === 'Enter') onOpen(r.id) }}>
                  <td><b>{r.name}</b>{data.countries.length > 1 && <span className="sa-muted"> · {r.country}</span>}<div className="sa-muted sa-email">{r.ownerEmail}</div></td>
                  <td>{r.plan}<div className="sa-muted sa-email">{ACCESS[r.access] || r.access}{r.trialDaysLeft != null ? ` · ${r.trialDaysLeft} d` : ''}</div></td>
                  <td className="num">{n(r.scans)}</td>
                  <td className={`num ${r.scansDelta == null ? '' : r.scansDelta > 0 ? 'up' : r.scansDelta < 0 ? 'dn' : ''}`}>{r.scansDelta == null ? (r.scans ? 'nuevo' : '—') : `${r.scansDelta > 0 ? '+' : ''}${r.scansDelta}%`}</td>
                  <td className="num">{n(r.newCustomers)}</td>
                  <td className="num">{n(r.redeems)}</td>
                  <td className="num">{r.pays ? money(r.pays.monthly, r.pays.currency) : <span className="sa-muted">{r.access === 'trial' ? 'prueba' : '—'}</span>}</td>
                  <td>{ago(r.lastScanAt)}</td>
                  <td>{r.signals.map((s, i) => <span key={i} className={`sa-tag sa-tag--${s.kind}`}>{s.text}</span>)}</td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={9} className="sa-muted">No hay negocios con ese filtro.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sa-g2">
        <SignalList title="En riesgo de darse de baja" sub="Pagan y el uso cayó, falló el cobro o la prueba vence sin uso" rows={risk} kind="risk" empty="Nadie en riesgo ahora." onOpen={onOpen} />
        <SignalList title="Para ofrecer un plan mayor" sub="Cerca del límite de clientes o notificaciones" rows={upsell} kind="upsell" empty="Nadie cerca del límite." onOpen={onOpen} />
      </div>

      <div className="sa-g2">
        <div className="sa-card">
          <div className="sa-ct">Qué funciones usan</div>
          <div className="sa-csub">% de negocios activos</div>
          <Meter label={`Mandaron notificaciones (${period})`} value={f.notifications} />
          <Meter label="Regalo de cumpleaños" value={f.birthday} />
          <Meter label="Sello doble algún día" value={f.doubleDays} />
          <Meter label="Vencimiento por inactividad" value={f.expiry} />
          <Meter label={`Empleados que escanearon (${period})`} value={f.teamScans} />
          <Meter label="Formulario con preguntas propias" value={f.formFields} />
          <Meter label="Más de una sucursal" value={f.locations} />
          <Meter label="Clientes con la tarjeta en Android" value={f.google} />
          <div className="sa-types">Tarjetas activas: sellos {f.cardTypes.stamp ?? 0}% · puntos {f.cardTypes.points ?? 0}% · niveles {f.cardTypes.membership ?? 0}%</div>
        </div>
        <div className="sa-card">
          <div className="sa-ct">Clientes finales</div>
          <div className="sa-csub">Todos los negocios, todo el historial · sin nombres</div>
          <Meter label="Vuelven (2 visitas o más)" value={e.returning} color={GREEN} />
          <Meter label="Canjearon al menos un premio" value={e.redeemed} color={GREEN} />
          <Meter label="Tienen la tarjeta en iPhone" value={share(e.passes.apple)} color={GREEN} />
          <Meter label="Tienen la tarjeta en Android" value={share(e.passes.google)} color={GREEN} />
          <div className="sa-mini">
            <div><span>Visitas promedio por cliente</span><b>{e.avgVisits ?? '—'}</b></div>
            <div><span>Días entre visitas (mediana)</span><b>{e.medianGapDays ?? '—'}</b></div>
            <div><span>Clientes (personas distintas)</span><b>{n(e.people)}</b></div>
            <div><span>Clientes por negocio (promedio)</span><b>{e.perBusiness ?? '—'}</b></div>
            <div><span>Tarjetas guardadas</span><b>{n(e.passes.total)}</b></div>
          </div>
        </div>
      </div>
    </section>
  )
}

function SignalList({ title, sub, rows, kind, empty, onOpen }: { title: string; sub: string; rows: AdminBusinessRow[]; kind: 'risk' | 'upsell'; empty: string; onOpen: (id: string) => void }) {
  return (
    <div className="sa-card">
      <div className="sa-ct">{title}</div>
      <div className="sa-csub">{sub}</div>
      {rows.length ? rows.slice(0, 8).map(r => (
        <button key={r.id} className="sa-row" onClick={() => onOpen(r.id)}>
          <span>{r.name}<span className="sa-muted"> · {r.plan}</span></span>
          <span>{r.signals.filter(s => s.kind === kind).map((s, i) => <span key={i} className={`sa-tag sa-tag--${kind}`}>{s.text}</span>)}</span>
        </button>
      )) : <p className="sa-muted" style={{ margin: '6px 0 0' }}>{empty}</p>}
      {rows.length > 8 && <div className="sa-csub" style={{ marginTop: 6 }}>y {rows.length - 8} más en el ranking</div>}
    </div>
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
  const share = (x: number) => d?.passes.total ? Math.round((x / d.passes.total) * 100) : null
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
              <Stat label="Clientes" value={n(d.customers)} sub={`${n(d.passes.total)} tarjeta${d.passes.total === 1 ? '' : 's'} · iPhone ${share(d.passes.apple) ?? 0}% · Android ${share(d.passes.google) ?? 0}%`} />
              <Stat label={`Escaneos (${d.period.days} días)`} value={n(d.period.scans)} sub={`${n(d.period.newCustomers)} clientes nuevos · ${n(d.period.redeems)} canjes`} />
              <Stat label="Vuelven" value={d.endUsers.returning != null ? `${d.endUsers.returning}%` : '—'} sub={`${d.endUsers.avgVisits ?? '—'} visitas por cliente · cada ${d.endUsers.medianGapDays ?? '—'} días`} />
            </div>
            <div className="sa-card sa-gap">
              <div className="sa-ct">Escaneos por semana</div>
              <div className="sa-csub">Últimas 12 semanas</div>
              <Bars labels={d.weeks} series={[d.scansWeekly]} colors={[GREEN]} height={90} tip={i => `Semana del ${short(d.weeks[i])}: ${d.scansWeekly[i]}`} />
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
  body{background:#FBF6EE;}
  .t{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;color:#2B2620;}
  .sa{min-height:100vh;background:#FBF6EE;color:#2B2620;font-family:'Inter',sans-serif;font-size:13px;padding:24px 28px 60px;max-width:1280px;margin:0 auto;box-sizing:border-box;}
  .sa *{box-sizing:border-box;}
  .sa h1{font-size:22px;margin:0;}
  .sa h3{font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;margin:20px 0 6px;}
  .sa-muted{color:rgba(43,38,32,.5);}
  .sa-head{display:flex;justify-content:space-between;align-items:flex-end;gap:14px;flex-wrap:wrap;}
  .sa-head p{margin:4px 0 0;font-size:12px;}
  .sa-tools{display:flex;gap:10px;align-items:center;flex-wrap:wrap;}
  .sa-pills{display:flex;gap:6px;flex-wrap:wrap;}
  .sa-gp{font-size:12px;padding:7px 14px;border-radius:20px;border:1.5px solid rgba(43,38,32,.12);background:#fff;color:rgba(43,38,32,.55);cursor:pointer;font-family:inherit;}
  .sa-gp.is-on{background:#1B412F;border-color:#1B412F;color:#F7F0E4;font-weight:600;}
  .sa-rp{font-size:11px;padding:6px 12px;border-radius:20px;border:1px solid rgba(43,38,32,.12);background:#fff;color:rgba(43,38,32,.55);cursor:pointer;font-family:inherit;}
  .sa-rp.is-on{background:rgba(199,93,58,.1);border-color:#C75D3A;color:#C75D3A;font-weight:600;}
  .sa-ghost{font-size:11.5px;font-weight:600;padding:7px 12px;border-radius:20px;border:1px solid rgba(43,38,32,.15);background:#fff;color:#2B2620;text-decoration:none;}
  .sa-btn{border:none;background:#C75D3A;color:#fff;font-weight:700;font-size:13px;border-radius:9px;padding:9px 14px;cursor:pointer;font-family:inherit;}
  .sa-lbl{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:rgba(43,38,32,.4);font-weight:600;margin:26px 0 10px;}
  .sa-g5{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;}
  .sa-g4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:12px;}
  .sa-lbl + .sa-g4{margin-top:0;}
  .sa-g2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px;}
  .sa-gap{margin-top:12px;}
  .sa-card{background:#fff;border:1px solid rgba(43,38,32,.07);border-radius:14px;padding:14px 16px;box-shadow:0 1px 8px rgba(43,38,32,.04);min-width:0;}
  .sa-card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap;margin-bottom:10px;}
  .sa-k{font-size:11.5px;color:rgba(43,38,32,.55);}
  .sa-v{font-family:'Plus Jakarta Sans',sans-serif;font-size:22px;font-weight:800;margin-top:4px;line-height:1.2;}
  .sa-v2{font-size:13px;font-weight:700;color:rgba(43,38,32,.7);}
  .sa-sub{font-size:11px;color:rgba(43,38,32,.45);margin-top:4px;line-height:1.4;}
  .sa-delta{font-size:11px;font-weight:700;margin-top:5px;color:rgba(43,38,32,.45);}
  .up{color:#2E7D4F!important;} .dn{color:#B4442A!important;}
  .sa-ct{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:13px;}
  .sa-csub{font-size:11px;color:rgba(43,38,32,.45);margin:2px 0 10px;}
  .sa-card-head .sa-csub{margin-bottom:0;}
  .sa-note{font-size:11.5px;color:rgba(43,38,32,.45);margin:10px 2px 0;}
  .sa-bars{display:flex;gap:4px;}
  .sa-bar-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0;position:relative;cursor:default;}
  .sa-bar-col span{font-size:9.5px;color:rgba(43,38,32,.45);height:12px;white-space:nowrap;}
  .sa-bar-stack{flex:1;width:100%;display:flex;align-items:flex-end;gap:2px;}
  .sa-bar-stack i{flex:1;border-radius:4px 4px 0 0;min-height:2px;}
  .sa-bar-col:hover .sa-bar-stack i{opacity:.8;}
  .sa-tip{position:absolute;bottom:calc(100% - 4px);left:50%;transform:translateX(-50%);background:#2B2620;color:#F7F0E4;font-size:11px;padding:6px 9px;border-radius:7px;white-space:nowrap;z-index:5;pointer-events:none;}
  .sa-legend{display:flex;gap:16px;font-size:11.5px;color:rgba(43,38,32,.65);margin-top:8px;}
  .sa-legend i{display:inline-block;width:9px;height:9px;border-radius:3px;margin-right:6px;vertical-align:middle;}
  .sa-table{width:100%;border-collapse:collapse;font-size:12.5px;}
  .sa-table th{font-weight:600;font-size:10.5px;color:rgba(43,38,32,.45);text-align:left;padding:8px 10px;border-bottom:1px solid rgba(43,38,32,.08);white-space:nowrap;}
  .sa-table td{padding:9px 10px;border-bottom:1px solid rgba(43,38,32,.05);vertical-align:top;}
  .sa-table .num{text-align:right;white-space:nowrap;}
  .sa-ret td,.sa-ret th{padding:7px 6px;}
  .sa-heat{display:inline-block;min-width:52px;text-align:center;color:#fff;font-weight:600;border-radius:6px;padding:3px 6px;font-size:11.5px;}
  .sa-table-wrap{overflow-x:auto;margin:0 -16px -14px;}
  .sa-rank{min-width:900px;}
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
  .sa-meter{margin-top:9px;}
  .sa-meter-top{display:flex;justify-content:space-between;gap:10px;font-size:12px;margin-bottom:4px;}
  .sa-track{height:6px;background:#F1EBE0;border-radius:99px;overflow:hidden;}
  .sa-track i{display:block;height:100%;border-radius:99px;}
  .sa-types{font-size:11.5px;color:rgba(43,38,32,.55);margin-top:12px;}
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
  @media (max-width:1100px){.sa-g5{grid-template-columns:repeat(6,minmax(0,1fr));}.sa-g5>*{grid-column:span 2;}.sa-g5>:nth-child(n+4){grid-column:span 3;}}
  @media (max-width:760px){
    .sa{padding:18px 16px 48px;}
    .sa-g5,.sa-g4{grid-template-columns:repeat(2,minmax(0,1fr));}
    .sa-g5>*,.sa-g5>:nth-child(n+4){grid-column:span 1;}
    .sa-g5>:last-child{grid-column:span 2;}
    .sa-g2{grid-template-columns:minmax(0,1fr);}
    .sa-tight{grid-template-columns:minmax(0,1fr);}
    .sa-v{font-size:19px;}
  }
`
