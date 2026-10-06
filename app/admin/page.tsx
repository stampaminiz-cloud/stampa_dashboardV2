'use client'

// Panel interno de Stampa: cómo va el negocio, el uso, a qué negocios hay
// que escribirles y si el sistema anda bien. Solo para los emails de
// ADMIN_EMAILS (el backend responde 404 al resto). Solo lectura y sin datos
// de los clientes finales. Backend: routes/admin.js, services/adminMetrics.js.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiAdminBusiness, apiAdminOverview, getToken, type AdminBusinessDetail, type AdminBusinessRow, type AdminFlag, type AdminOverview } from '@/lib/api'

const FLAG: Record<AdminFlag, { label: string; tone: 'red' | 'amber' | 'green' | 'gray' }> = {
  past_due: { label: 'Cobro fallido', tone: 'red' },
  trial_ending_unused: { label: 'Prueba por vencer sin uso', tone: 'red' },
  near_limit: { label: 'Cerca del límite', tone: 'green' },
  inactive: { label: 'Sin escaneos hace 7+ días', tone: 'amber' },
  never_used: { label: 'Nunca escaneó', tone: 'gray' },
}
const ACCESS: Record<string, string> = { trial: 'En prueba', active: 'Pagando', legacy: 'Acceso completo', paused: 'Pausada' }
const STATUS: Record<string, string> = { active: 'pagando', past_due: 'cobro fallido', paused: 'pausada', cancelled: 'cancelada', trialing: 'en prueba', legacy: 'acceso completo' }
const CARD_TYPE: Record<string, string> = { stamp: 'Sellos', points: 'Puntos', membership: 'Membresía' }

const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'
const fmtNum = (n: number) => n.toLocaleString('es-AR')
function ago(d: string | null) {
  if (!d) return 'nunca'
  const m = Math.round((Date.now() - new Date(d).getTime()) / 60000)
  if (m < 1) return 'recién'
  if (m < 60) return `hace ${m} min`
  const h = Math.round(m / 60)
  if (h < 24) return `hace ${h} h`
  const days = Math.round(h / 24)
  return days === 1 ? 'ayer' : `hace ${days} días`
}
const money = (amount: number, currency: string) => {
  try { return new Intl.NumberFormat('es-AR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount) } catch { return `${currency} ${fmtNum(amount)}` }
}
const weekLabel = (iso: string) => { const d = new Date(iso); return `${d.getUTCDate()}/${d.getUTCMonth() + 1}` }

type Filter = 'all' | 'flags' | 'trial' | 'active' | 'legacy'

export default function AdminPage() {
  const [data, setData] = useState<AdminOverview | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'notfound' | 'error'>('loading')
  const [filter, setFilter] = useState<Filter>('all')
  const [open, setOpen] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setData(await apiAdminOverview())
      setState('ok')
    } catch (err) {
      setState((err as { status?: number })?.status === 404 ? 'notfound' : 'error')
    }
  }, [])

  useEffect(() => {
    if (!getToken()) { window.location.href = '/login'; return }
    load()
  }, [load])

  if (state === 'notfound') return <Center><h1 style={{ fontSize: 22 }}>Página no encontrada</h1><a href="/dashboard" style={{ color: '#C75D3A' }}>Volver al panel</a></Center>
  if (state === 'error') return <Center><p>No se pudieron cargar las métricas.</p><button className="ad-btn" onClick={() => { setState('loading'); load() }}>Reintentar</button><style dangerouslySetInnerHTML={{ __html: CSS }} /></Center>
  if (!data) return <Center><p style={{ color: 'rgba(43,38,32,.6)' }}>Calculando…</p></Center>

  return (
    <div className="ad">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <header className="ad-head">
        <div>
          <h1>Stampa · admin</h1>
          <p className="ad-muted">Actualizado {ago(data.generatedAt)} · solo lo ven las cuentas de ADMIN_EMAILS</p>
        </div>
        <div className="ad-head-actions">
          <a className="ad-btn ad-btn--ghost" href="/dashboard">Ir a mi panel</a>
          <button className="ad-btn" onClick={() => { setState('loading'); load() }}>Actualizar</button>
        </div>
      </header>

      <Money data={data} />
      <Funnel f={data.funnel} />
      <Usage data={data} />
      <Risks rows={data.businesses} onOpen={setOpen} />
      <Businesses rows={data.businesses} filter={filter} setFilter={setFilter} onOpen={setOpen} />
      <Health h={data.health} />

      {open && <Detail id={open} onClose={() => setOpen(null)} />}
    </div>
  )
}

function Center({ children }: { children: React.ReactNode }) {
  return <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', justifyContent: 'center', background: '#FBF6EE', color: '#2B2620', padding: 16, textAlign: 'center' }}>{children}</div>
}

function Kpi({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: 'red' | 'green' }) {
  return (
    <div className="ad-card">
      <div className="ad-label">{label}</div>
      <div className={`ad-value${tone ? ` ad-${tone}` : ''}`}>{value}</div>
      {sub && <div className="ad-muted ad-sub">{sub}</div>}
    </div>
  )
}

function Bars({ weeks, series, colors, legend }: { weeks: string[]; series: number[][]; colors: string[]; legend?: string[] }) {
  const max = Math.max(1, ...series.flat())
  return (
    <div>
      <div className="ad-bars">
        {weeks.map((w, i) => (
          <div key={w} className="ad-bar-col" title={`Semana del ${weekLabel(w)}: ${series.map((s, j) => `${legend?.[j] ?? ''} ${s[i]}`).join(' · ')}`}>
            <div className="ad-bar-stack">
              {series.map((s, j) => <i key={j} style={{ height: `${(s[i] / max) * 100}%`, background: colors[j] }} />)}
            </div>
            <span>{weekLabel(w)}</span>
          </div>
        ))}
      </div>
      {legend && <div className="ad-legend">{legend.map((l, j) => <span key={l}><i style={{ background: colors[j] }} />{l}</span>)}</div>}
    </div>
  )
}

function Money({ data }: { data: AdminOverview }) {
  const m = data.money
  const mrr = Object.entries(m.mrr)
  const plans = Object.entries(m.planCount).map(([p, n]) => `${n} ${p}`).join(' · ')
  return (
    <section>
      <h2>Negocio y plata</h2>
      <div className="ad-grid4">
        <Kpi label="Ingreso mensual (MRR)" value={mrr.length ? mrr.map(([c, v]) => <div key={c}>{money(v, c)}</div>) : '—'}
          sub={m.mrrUnknown ? `${m.mrrUnknown} pago${m.mrrUnknown === 1 ? '' : 's'} sin precio de Mercado Pago` : 'Suscripciones que renuevan'} />
        <Kpi label="Pagando" value={m.paying} sub={plans || 'Nadie todavía'} />
        <Kpi label="En prueba" value={m.trials} sub={m.trialsEndingSoon ? `${m.trialsEndingSoon} vence${m.trialsEndingSoon === 1 ? '' : 'n'} en 7 días` : 'Ninguna vence esta semana'} />
        <Kpi label="Prueba → pago" value={m.conversion ? `${m.conversion.rate}%` : '—'}
          sub={m.conversion ? `de ${m.conversion.of} cuentas (prueba terminada, últimos 90 días)` : 'Todavía no hay pruebas terminadas'} />
      </div>
      <div className="ad-grid2">
        <div className="ad-card">
          <div className="ad-label">Cuentas nuevas y bajas por semana</div>
          <Bars weeks={m.weeks} series={[m.signups, m.cancels]} colors={['#1B412F', '#C75D3A']} legend={['Altas', 'Bajas']} />
        </div>
        <div className="ad-card">
          <div className="ad-label">Escaneos por semana (todos los negocios)</div>
          <Bars weeks={m.weeks} series={[data.usage.scansWeekly]} colors={['#1B412F']} />
        </div>
      </div>
      <p className="ad-muted ad-note">{m.legacy} cuenta{m.legacy === 1 ? '' : 's'} con acceso completo sin cobro (legacy). Las bajas se cuentan desde que existe este panel.</p>
    </section>
  )
}

function Funnel({ f }: { f: AdminOverview['funnel'] }) {
  const steps = [
    { label: 'Se registraron', n: f.signedUp },
    { label: 'Crearon la tarjeta', n: f.card },
    { label: 'Sumaron un cliente', n: f.customer },
    { label: 'Primer escaneo', n: f.scan },
  ]
  return (
    <section>
      <h2>Embudo de arranque <span className="ad-muted ad-h-sub">cuentas de los últimos 90 días</span></h2>
      <div className="ad-card ad-funnel">
        {steps.map((s, i) => {
          const pct = f.signedUp ? Math.round((s.n / f.signedUp) * 100) : 0
          return (
            <div key={s.label} className="ad-funnel-step">
              <div className="ad-funnel-top"><span>{s.label}</span><b>{s.n}{i > 0 && <em> · {pct}%</em>}</b></div>
              <div className="ad-track"><i style={{ width: `${f.signedUp ? pct : 0}%` }} /></div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function Usage({ data }: { data: AdminOverview }) {
  const u = data.usage
  const share = (n: number) => u.passes.total ? `${Math.round((n / u.passes.total) * 100)}%` : '—'
  return (
    <section>
      <h2>Uso del producto</h2>
      <div className="ad-grid4">
        <Kpi label="Negocios activos (7 días)" value={`${u.activeWeek} de ${u.businesses}`} sub="Con al menos un escaneo" />
        <Kpi label="Clientes" value={fmtNum(u.customers)} sub={`${fmtNum(u.passes.total)} pase${u.passes.total === 1 ? '' : 's'} · iPhone ${share(u.passes.apple)} · Android ${share(u.passes.google)}`} />
        <Kpi label="Escaneos (7 días)" value={fmtNum(u.scansWeek)} />
        <Kpi label="Notificaciones del mes" value={u.notifications.count} sub={`a ${fmtNum(u.notifications.recipients)} clientes`} />
      </div>
    </section>
  )
}

function Tag({ flag }: { flag: AdminFlag }) {
  const f = FLAG[flag]
  return <span className={`ad-tag ad-tag--${f.tone}`}>{f.label}</span>
}

function Risks({ rows, onOpen }: { rows: AdminBusinessRow[]; onOpen: (id: string) => void }) {
  const order: AdminFlag[] = ['past_due', 'trial_ending_unused', 'near_limit', 'inactive']
  const groups = order.map(flag => ({ flag, rows: rows.filter(r => r.isActive && r.flags.includes(flag)) })).filter(g => g.rows.length)
  return (
    <section>
      <h2>Oportunidades y riesgos</h2>
      {!groups.length ? <div className="ad-card ad-muted">Nada para revisar hoy.</div> : (
        <div className="ad-grid2">
          {groups.map(g => (
            <div key={g.flag} className="ad-card">
              <div className="ad-risk-head"><Tag flag={g.flag} /><span className="ad-muted">{g.rows.length}</span></div>
              {g.rows.slice(0, 6).map(r => (
                <button key={r.id} className="ad-risk-row" onClick={() => onOpen(r.id)}>
                  <span>{r.name}</span>
                  <span className="ad-muted">
                    {g.flag === 'near_limit' ? (r.maxCustomers && r.customers >= r.maxCustomers * 0.8 ? `${r.customers}/${r.maxCustomers} clientes` : `${r.notifsUsed}/${r.maxNotifs} notificaciones`)
                      : g.flag === 'trial_ending_unused' ? `${r.trialDaysLeft} día${r.trialDaysLeft === 1 ? '' : 's'}`
                      : g.flag === 'inactive' ? `último ${ago(r.lastScanAt)}` : r.plan}
                  </span>
                </button>
              ))}
              {g.rows.length > 6 && <div className="ad-muted ad-sub">y {g.rows.length - 6} más en la lista</div>}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function Businesses({ rows, filter, setFilter, onOpen }: { rows: AdminBusinessRow[]; filter: Filter; setFilter: (f: Filter) => void; onOpen: (id: string) => void }) {
  const shown = useMemo(() => rows.filter(r =>
    filter === 'all' ? true : filter === 'flags' ? r.flags.some(f => f !== 'never_used') : r.access === filter), [rows, filter])
  const chips: [Filter, string][] = [['all', 'Todos'], ['flags', 'Con aviso'], ['trial', 'En prueba'], ['active', 'Pagando'], ['legacy', 'Acceso completo']]
  return (
    <section>
      <h2>Negocios <span className="ad-muted ad-h-sub">{rows.length}</span></h2>
      <div className="ad-chips">
        {chips.map(([k, l]) => <button key={k} className={`ad-chip${filter === k ? ' is-on' : ''}`} aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}</button>)}
      </div>
      <div className="ad-card ad-table-wrap">
        <table className="ad-table">
          <thead><tr><th>Negocio</th><th>Plan</th><th>Estado</th><th>Alta</th><th className="num">Clientes</th><th>Último escaneo</th><th className="num">7 días</th><th>Avisos</th></tr></thead>
          <tbody>
            {shown.map(r => (
              <tr key={r.id} onClick={() => onOpen(r.id)} tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') onOpen(r.id) }}>
                <td><b>{r.name}</b>{!r.isActive && <span className="ad-muted"> · inactivo</span>}<div className="ad-muted ad-email">{r.ownerEmail}</div></td>
                <td>{r.plan}</td>
                <td>{ACCESS[r.access] || r.access}{r.trialDaysLeft != null && <span className="ad-muted"> · {r.trialDaysLeft} d</span>}</td>
                <td>{fmtDate(r.createdAt)}</td>
                <td className="num">{fmtNum(r.customers)}{r.maxCustomers ? <span className="ad-muted">/{r.maxCustomers}</span> : null}</td>
                <td>{ago(r.lastScanAt)}</td>
                <td className="num">{r.scansWeek}</td>
                <td>{r.flags.map(f => <Tag key={f} flag={f} />)}</td>
              </tr>
            ))}
            {!shown.length && <tr><td colSpan={8} className="ad-muted">No hay negocios con ese filtro.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Health({ h }: { h: AdminOverview['health'] }) {
  const cronMin = h.cronAt ? (Date.now() - new Date(h.cronAt).getTime()) / 60000 : null
  const wallet = h.walletErrors.apple + h.walletErrors.google
  return (
    <section>
      <h2>Salud del sistema</h2>
      <div className="ad-grid4">
        <Kpi label="Cron" value={h.cronAt ? ago(h.cronAt) : 'sin datos'} tone={cronMin == null || cronMin > 15 ? 'red' : undefined} sub="Corre cada 5 minutos" />
        <Kpi label="Mails (7 días)" value={`${h.emails.ok} ok · ${h.emails.failed} fallidos`} tone={h.emails.failed ? 'red' : undefined}
          sub={h.digestFailures ? `${h.digestFailures} negocio${h.digestFailures === 1 ? '' : 's'} con resumen pendiente de reintento` : 'Resúmenes, avisos y cuentas'} />
        <Kpi label="Pases que fallaron (7 días)" value={wallet} tone={wallet ? 'red' : undefined} sub={`iPhone ${h.walletErrors.apple} · Android ${h.walletErrors.google}`} />
        <Kpi label="Notificaciones programadas" value={h.failedScheduled ? `${h.failedScheduled} fallidas` : 'Sin fallas'} tone={h.failedScheduled ? 'red' : undefined}
          sub={<a href={h.backupsUrl} target="_blank" rel="noopener noreferrer">Ver backups en GitHub</a>} />
      </div>
    </section>
  )
}

function Detail({ id, onClose }: { id: string; onClose: () => void }) {
  const [d, setD] = useState<AdminBusinessDetail | null>(null)
  const [err, setErr] = useState(false)
  useEffect(() => {
    let alive = true
    apiAdminBusiness(id).then(r => { if (alive) setD(r) }).catch(() => { if (alive) setErr(true) })
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { alive = false; window.removeEventListener('keydown', onKey) }
  }, [id, onClose])
  const share = (n: number) => d?.passes.total ? `${Math.round((n / d.passes.total) * 100)}%` : '—'
  return (
    <div className="ad-overlay" onClick={onClose}>
      <aside className="ad-drawer" role="dialog" aria-modal="true" aria-label="Detalle del negocio" onClick={e => e.stopPropagation()}>
        <button className="ad-close" onClick={onClose} aria-label="Cerrar">×</button>
        {err ? <p>No se pudo cargar el negocio.</p> : !d ? <p className="ad-muted">Cargando…</p> : (
          <>
            <h2 style={{ marginTop: 0 }}>{d.name}</h2>
            <p className="ad-muted">{d.owner?.email} · alta {fmtDate(d.createdAt)}{!d.isActive && ' · inactivo'}</p>
            <div className="ad-grid2 ad-tight">
              <Kpi label="Plan" value={d.owner?.plan || '—'} sub={`${ACCESS[d.owner?.access || ''] || '—'}${d.owner?.period ? ` · ${d.owner.period === 'annual' ? 'anual' : 'mensual'}` : ''}${d.owner?.nextPaymentDate ? ` · próximo cobro ${fmtDate(d.owner.nextPaymentDate)}` : ''}${d.owner?.access === 'trial' && d.owner.trialEndsAt ? ` · vence ${fmtDate(d.owner.trialEndsAt)}` : ''}`} />
              <Kpi label="Clientes" value={fmtNum(d.customers)} sub={`${d.passes.total} pase${d.passes.total === 1 ? '' : 's'} · iPhone ${share(d.passes.apple)} · Android ${share(d.passes.google)}`} />
            </div>
            <div className="ad-card" style={{ marginTop: 10 }}>
              <div className="ad-label">Escaneos por semana (12 semanas)</div>
              <Bars weeks={d.weeks} series={[d.scansWeekly]} colors={['#1B412F']} />
            </div>
            <h3>Tarjetas y sucursales</h3>
            <p>{d.cards.map(c => `${c.name} (${CARD_TYPE[c.type] || c.type}${c.isActive ? '' : ', inactiva'})`).join(' · ') || 'Sin tarjetas'}<br /><span className="ad-muted">{d.locations} sucursal{d.locations === 1 ? '' : 'es'}</span></p>
            <h3>Notificaciones enviadas</h3>
            {d.notifications.length ? (
              <ul className="ad-list">{d.notifications.map((n, i) => <li key={i}><span>{n.title || 'Sin título'} <span className="ad-muted">· {n.audience}</span></span><span className="ad-muted">{n.recipients ?? '—'} · {fmtDate(n.sentAt)}</span></li>)}</ul>
            ) : <p className="ad-muted">Ninguna todavía.</p>}
            <h3>Historial del plan</h3>
            {d.history.length ? (
              <ul className="ad-list">{d.history.map((h, i) => <li key={i}><span>{h.type === 'signup' ? `Se registró (${h.plan})` : `${STATUS[h.from || ''] || h.from || 'sin estado'} → ${STATUS[h.to || ''] || h.to || 'sin estado'}${h.planFrom !== h.planTo ? ` · ${h.planFrom} → ${h.planTo}` : ''}`}</span><span className="ad-muted">{fmtDate(h.at)}</span></li>)}</ul>
            ) : <p className="ad-muted">Sin cambios registrados (se anotan desde que existe este panel).</p>}
          </>
        )}
      </aside>
    </div>
  )
}

const CSS = `
  body{background:#FBF6EE;}
  .ad{min-height:100vh;background:#FBF6EE;color:#2B2620;font-family:'DM Sans',sans-serif;padding:28px 32px 60px;max-width:1240px;margin:0 auto;box-sizing:border-box;}
  .ad *{box-sizing:border-box;}
  .ad h1{font-family:'Syne',sans-serif;font-size:24px;margin:0;}
  .ad h2{font-family:'Syne',sans-serif;font-size:17px;margin:30px 0 10px;}
  .ad h3{font-size:14px;margin:18px 0 6px;}
  .ad-h-sub{font-family:'DM Sans',sans-serif;font-weight:400;font-size:12px;margin-left:6px;}
  .ad-muted{color:rgba(43,38,32,.6);}
  .ad-head{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap;}
  .ad-head p{margin:4px 0 0;font-size:13px;}
  .ad-head-actions{display:flex;gap:8px;}
  .ad-btn{border:none;background:#C75D3A;color:#fff;font-weight:700;font-size:13px;border-radius:9px;padding:9px 14px;cursor:pointer;font-family:inherit;text-decoration:none;}
  .ad-btn--ghost{background:transparent;color:#2B2620;border:1px solid rgba(43,38,32,.18);}
  .ad-grid4{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;}
  .ad-grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:10px;margin-top:10px;}
  .ad-grid4 + .ad-grid2{margin-top:10px;}
  .ad-tight{grid-template-columns:repeat(auto-fit,minmax(200px,1fr));}
  .ad-card{background:#fff;border:1px solid rgba(43,38,32,.1);border-radius:12px;padding:12px 14px;min-width:0;}
  .ad-label{font-size:12px;color:rgba(43,38,32,.6);}
  .ad-value{font-size:22px;font-weight:700;margin-top:3px;}
  .ad-sub{font-size:12px;margin-top:3px;line-height:1.4;}
  .ad-sub a{color:#C75D3A;}
  .ad-red{color:#B23B3B;}
  .ad-note{font-size:12px;margin:8px 2px 0;}
  .ad-bars{display:flex;gap:6px;height:120px;margin-top:10px;}
  .ad-bar-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0;}
  .ad-bar-col span{font-size:10px;color:rgba(43,38,32,.55);}
  .ad-bar-stack{flex:1;width:100%;display:flex;align-items:flex-end;gap:2px;}
  .ad-bar-stack i{flex:1;border-radius:3px 3px 0 0;min-height:1px;}
  .ad-legend{display:flex;gap:14px;font-size:11px;color:rgba(43,38,32,.6);margin-top:6px;}
  .ad-legend i{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:5px;}
  .ad-funnel{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px 20px;}
  .ad-funnel-top{display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;}
  .ad-funnel-top em{font-style:normal;color:rgba(43,38,32,.6);font-weight:400;}
  .ad-track{height:8px;background:#F1EBE0;border-radius:999px;overflow:hidden;}
  .ad-track i{display:block;height:100%;background:#1B412F;border-radius:999px;}
  .ad-tag{display:inline-block;font-size:11px;padding:2px 8px;border-radius:999px;margin:1px 4px 1px 0;white-space:nowrap;}
  .ad-tag--red{background:#FBE7E1;color:#9A3F22;}
  .ad-tag--amber{background:#FBF1DE;color:#7A5410;}
  .ad-tag--green{background:#E3EFE5;color:#2E5E3A;}
  .ad-tag--gray{background:#F1EBE0;color:#6B635A;}
  .ad-risk-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;}
  .ad-risk-row{display:flex;justify-content:space-between;gap:10px;width:100%;background:none;border:none;border-top:1px solid rgba(43,38,32,.07);padding:8px 0;font:inherit;font-size:13px;color:inherit;text-align:left;cursor:pointer;}
  .ad-risk-row:hover span:first-child{text-decoration:underline;}
  .ad-chips{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;}
  .ad-chip{border:1px solid rgba(43,38,32,.15);background:#fff;border-radius:999px;padding:6px 12px;font:inherit;font-size:12.5px;cursor:pointer;color:#2B2620;}
  .ad-chip.is-on{background:#2B2620;color:#fff;border-color:#2B2620;}
  .ad-table-wrap{padding:0;overflow-x:auto;}
  .ad-table{width:100%;border-collapse:collapse;font-size:13px;min-width:860px;}
  .ad-table th{font-weight:600;font-size:11.5px;color:rgba(43,38,32,.6);text-align:left;padding:10px 12px;border-bottom:1px solid rgba(43,38,32,.1);}
  .ad-table td{padding:9px 12px;border-bottom:1px solid rgba(43,38,32,.06);vertical-align:top;}
  .ad-table tbody tr{cursor:pointer;}
  .ad-table tbody tr:hover,.ad-table tbody tr:focus{background:#FBF8F3;outline:none;}
  .ad-table .num{text-align:right;}
  .ad-email{font-size:11.5px;margin-top:2px;}
  .ad-overlay{position:fixed;inset:0;background:rgba(43,38,32,.35);display:flex;justify-content:flex-end;z-index:50;}
  .ad-drawer{width:min(520px,100%);height:100%;overflow-y:auto;background:#FBF6EE;padding:22px 22px 40px;position:relative;font-size:13.5px;}
  .ad-close{position:absolute;top:12px;right:14px;border:none;background:none;font-size:26px;cursor:pointer;color:#2B2620;}
  .ad-list{list-style:none;padding:0;margin:0;}
  .ad-list li{display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-top:1px solid rgba(43,38,32,.07);}
  @media (max-width:640px){.ad{padding:20px 16px 48px;}.ad-grid2{grid-template-columns:minmax(0,1fr);}.ad-grid4{grid-template-columns:repeat(2,minmax(0,1fr));}.ad-value{font-size:19px;}}
`
