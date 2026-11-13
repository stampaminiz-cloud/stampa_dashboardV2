'use client'
// Escáner web (/escaner): la app Stampa Escáner en el navegador, para los
// locales que no la pueden bajar. Copia la app pantalla por pantalla (mismos
// colores, medidas y textos; sin íconos ni emojis) y suma la pestaña Hoy, la
// búsqueda por teléfono y la regla de frecuencia.
//
// Pantallas: bienvenida → vincular (link o QR de Equipo) → PIN, o dueño con
// email → bienvenida de 5 páginas (una vez por persona) → escáner con tres
// pestañas: Escanear, Buscar y Hoy. El consejo de agregarlo a la pantalla de
// inicio sale una sola vez, ya adentro, después de la bienvenida.
import { useCallback, useEffect, useRef, useState } from 'react'
import { Camara } from './Camara'
import { Cliente } from './Cliente'
import {
  escaner, EscanerError, beep, formatMoney, getDevice, setDevice, getToken, setToken, sawWelcome, markWelcome, tipPending, setTipPending, setUnauthorizedHandler,
  type CustomerView, type Device, type LocationChoice, type Me, type SearchResult, type TodayItem,
} from '@/lib/escaner'
import { ESCANER_CSS } from './estilos'

type Phase = 'boot' | 'welcome' | 'link' | 'login' | 'owner' | 'onboarding' | 'app'
type Tab = 'scan' | 'search' | 'today'
type Status = { kind: 'idle' } | { kind: 'searching' } | { kind: 'error'; message: string; ok?: boolean; retry?: string; action?: { label: string; run: () => void } }

export function EscanerApp() {
  const [phase, setPhase] = useState<Phase>('boot')
  const [device, setDev] = useState<Device | null>(null)
  const [me, setMe] = useState<Me | null>(null)
  const [tab, setTab] = useState<Tab>('scan')
  const [view, setView] = useState<CustomerView | null>(null)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [notice, setNotice] = useState<string | null>(null)
  const [help, setHelp] = useState(false)
  const [tip, setTip] = useState(false)
  const [locs, setLocs] = useState<LocationChoice[] | null>(null)

  const saveDevice = (d: Device | null) => { setDevice(d); setDev(d) }
  const unlinkedPhase = (d: Device | null): Phase => (d ? 'login' : 'welcome')

  const enter = useCallback(async () => {
    const m = await escaner.me()
    setMe(m)
    setPhase(sawWelcome(`${m.business.id}:${m.scanner.id}`) ? 'app' : 'onboarding')
  }, [])

  // Arranque: sesión guardada → adentro; si no, PIN o bienvenida.
  useEffect(() => {
    const d = getDevice()
    setDev(d)
    setUnauthorizedHandler(() => { setToken(null); setMe(null); setView(null); setPhase(unlinkedPhase(getDevice())) })
    if (!getToken()) { setPhase(unlinkedPhase(d)); return }
    enter().catch((e: EscanerError) => {
      if (e.code === 'device_removed') { saveDevice(null); setNotice(e.message) }
      setToken(null)
      setPhase(unlinkedPhase(getDevice()))
    })
    return () => setUnauthorizedHandler(null)
  }, [enter])

  // El consejo de "agregar a inicio" sale una vez, ya adentro y con la bienvenida hecha.
  useEffect(() => { if (phase === 'app' && tipPending()) setTip(true) }, [phase])
  function closeTip() { setTipPending(false); setTip(false) }

  const isStaff = !me?.scanner.role || me.scanner.role === 'scanner'
  function logout() {
    const msg = isStaff ? '¿Cerrar sesión? El próximo empleado entra con su PIN.' : '¿Cerrar sesión en este celular?'
    if (!window.confirm(msg)) return
    setToken(null); setMe(null); setView(null); setTab('scan'); setStatus({ kind: 'idle' })
    setPhase(unlinkedPhase(device))
  }
  function unlink() {
    if (!window.confirm('Activar otro negocio\n\nEste celular deja de estar vinculado' + (device?.businessName ? ` a ${device.businessName}` : '') + '. Después vas a abrir el link o escanear el código de activación del otro negocio.')) return
    setToken(null); saveDevice(null); setMe(null); setPhase('welcome')
  }

  // ── Lectura de un QR ────────────────────────────────────────────────────────
  async function lookup(text: string) {
    setStatus({ kind: 'searching' })
    try {
      const v = await escaner.lookup(text)
      beep(true)
      setView(v)
      setStatus({ kind: 'idle' })
    } catch (e) {
      beep(false)
      const err = e as EscanerError
      if (err.isUnauthorized) return
      const loc = err.code === 'device_qr' ? err.data?.location : null
      setStatus({
        kind: 'error',
        message: err.code === 'not_found' ? 'Este código no es de una tarjeta de este negocio. Pedile al cliente la tarjeta de este local.' : err.message,
        retry: err.status === 0 ? text : undefined,
        action: loc ? { label: `Pasar este celular a ${loc.name}`, run: () => switchTo(loc.id) } : undefined,
      })
    }
  }

  async function switchTo(locationId: string) {
    try {
      const r = await escaner.switchLocation(locationId)
      setToken(r.token)
      if (device) saveDevice({ ...device, locationId: r.location.id, locationName: r.location.name })
      setLocs(null)
      await enter()
      setStatus({ kind: 'error', ok: true, message: `Listo: este celular ahora suma en ${r.location.name}.` })
    } catch (e) { setStatus({ kind: 'error', message: (e as EscanerError).message }) }
  }
  async function openLocations() {
    try { setLocs((await escaner.locations()).locations) } catch (e) { setStatus({ kind: 'error', message: (e as EscanerError).message }) }
  }
  const refreshMe = () => { escaner.me().then(setMe).catch(() => {}) }
  const closeCustomer = () => { setView(null); setStatus({ kind: 'idle' }); refreshMe() }

  let screen: React.ReactNode = null
  if (phase === 'boot') screen = <div className="esc-screen"><div className="esc-center"><div className="esc-spinner" aria-label="Cargando" /></div></div>
  else if (phase === 'welcome') screen = <Welcome notice={notice} onOwner={() => setPhase('owner')} onEmployee={() => setPhase('link')} onHelp={() => setHelp(true)} />
  else if (phase === 'link') screen = <LinkDevice onBack={() => setPhase('welcome')} onHelp={() => setHelp(true)} onLinked={d => { saveDevice(d); setTipPending(true); setPhase('login') }} />
  else if (phase === 'login' && device) screen = (
    <Login device={device} onHelp={() => setHelp(true)} onOwner={() => setPhase('owner')} onUnlink={unlink}
      onDone={async token => { setToken(token); setNotice(null); await enter() }}
      onRemoved={msg => { saveDevice(null); setNotice(msg); setPhase('welcome') }} />
  )
  else if (phase === 'owner') screen = (
    <OwnerLogin device={device} onBack={() => setPhase(unlinkedPhase(device))} onHelp={() => setHelp(true)}
      onDone={async (token, d) => { setToken(token); if (!device) saveDevice(d); else if (d.locationId !== device.locationId) saveDevice({ ...device, locationId: d.locationId, locationName: d.locationName }); await enter() }}
      onRemoved={msg => { saveDevice(null); setNotice(msg); setPhase('welcome') }} />
  )
  else if (phase === 'onboarding' && me) screen = <Onboarding me={me} onDone={() => { markWelcome(`${me.business.id}:${me.scanner.id}`); setPhase('app') }} />
  else if (phase === 'app' && me) {
    const roleLabel = me.scanner.role === 'owner' ? ' · Dueño' : me.scanner.role === 'manager' ? ' · Encargado' : ''
    screen = (
      <div className="esc-screen">
        <div className="esc-head">
          <div className="esc-head-main">
            <div className="esc-biz">{me.business.name}{me.location.multi ? ` · ${me.location.name}` : ''}</div>
            <div className="esc-who">{me.scanner.fullName}{roleLabel}</div>
            {me.location.multi && <button className="esc-link esc-link--coral" onClick={openLocations}>Cambiar sucursal</button>}
          </div>
          <button className="esc-logout" onClick={logout}>{isStaff ? 'Cambiar de empleado' : 'Salir'}</button>
          <button className="esc-help" onClick={() => setHelp(true)} aria-label="Ayuda">?</button>
        </div>

        <div className="esc-today" aria-label={`Hoy: ${me.today.mine} escaneos tuyos, ${me.today.total} en el local`}>
          <div><b>{me.today.mine}</b><span>{me.today.mine === 1 ? 'escaneo tuyo hoy' : 'escaneos tuyos hoy'}</span></div>
          <i />
          <div><b>{me.today.total}</b><span>{me.location.multi ? 'en esta sucursal' : 'en todo el local'}</span></div>
        </div>

        <div className="esc-main">
          {tab === 'scan' && (
            <div className="esc-cam-wrap" style={{ display: 'flex', flex: 1, position: 'relative' }}>
              <Camara onCode={lookup} paused={!!view || status.kind !== 'idle'} />
              {status.kind === 'searching' && <div className="esc-cam-over" style={{ borderRadius: 24 }}><div className="esc-spinner" />Buscando cliente...</div>}
            </div>
          )}
          {tab === 'search' && <Buscar onOpen={async id => { try { setView(await escaner.customer(id)) } catch (e) { setStatus({ kind: 'error', message: (e as EscanerError).message }) } }} />}
          {tab === 'today' && <Hoy onChanged={refreshMe} />}
        </div>

        {tab === 'scan' && (
          <div className="esc-foot">
            {status.kind === 'error' ? (
              <div className={`esc-alert${status.ok ? ' esc-alert--ok' : ''}`}>
                <p>{status.message}</p>
                <div className="esc-alert-actions">
                  {status.action && <button className="esc-pill esc-pill--coral" onClick={status.action.run}>{status.action.label}</button>}
                  {status.retry && <button className="esc-pill esc-pill--coral" onClick={() => lookup(status.retry!)}>Reintentar</button>}
                  <button className="esc-pill" onClick={() => setStatus({ kind: 'idle' })}>Escanear otro</button>
                </div>
              </div>
            ) : <div className="esc-foot-hint">Apuntá al código QR de la tarjeta del cliente</div>}
          </div>
        )}

        <nav className="esc-tabs" aria-label="Secciones">
          {([['scan', 'Escanear'], ['search', 'Buscar'], ['today', 'Hoy']] as const).map(([k, l]) => (
            <button key={k} className={tab === k ? 'on' : ''} onClick={() => { setTab(k); setStatus({ kind: 'idle' }) }} aria-current={tab === k ? 'page' : undefined}>{l}</button>
          ))}
        </nav>

        {view && <div className="esc-overlay"><Cliente initial={view} onClose={closeCustomer} onChanged={refreshMe} /></div>}
        {locs && (
          <Sheet title="Cambiar sucursal" onClose={() => setLocs(null)}>
            {locs.map(l => (
              <button key={l.id} className="esc-menu-opt" onClick={() => switchTo(l.id)} disabled={l.id === me.location.id}>
                {l.name}<span>{l.id === me.location.id ? 'Estás acá' : l.address || ''}</span>
              </button>
            ))}
          </Sheet>
        )}
        {tip && <TipModal onClose={closeTip} />}
      </div>
    )
  }

  return (
    <div className="esc-root">
      <style>{ESCANER_CSS}</style>
      {screen}
      {help && <Ayuda logged={phase === 'app'} onClose={() => setHelp(false)} />}
    </div>
  )
}

function Top({ onHelp }: { onHelp: () => void }) {
  return (
    <div className="esc-top">
      <span className="esc-wm" role="img" aria-label="Stampa" />
      <button className="esc-help" onClick={onHelp} aria-label="Ayuda">?</button>
    </div>
  )
}

// ─── Bienvenida (celular sin vincular) ───────────────────────────────────────
function Welcome({ notice, onOwner, onEmployee, onHelp }: { notice: string | null; onOwner: () => void; onEmployee: () => void; onHelp: () => void }) {
  return (
    <div className="esc-screen">
      <Top onHelp={onHelp} />
      <div className="esc-body" style={{ paddingTop: 36 }}>
        <h1 className="esc-title">Bienvenido a Stampa Escáner</h1>
        <p className="esc-sub" style={{ marginBottom: 18 }}>Sumá sellos, puntos y visitas escaneando la tarjeta de tus clientes. ¿Cómo vas a entrar?</p>
        {notice && <p className="esc-error" style={{ marginBottom: 14 }}>{notice}</p>}
        <div className="esc-stack">
          <button className="esc-option esc-option--main" onClick={onOwner}>
            <div><b>Soy dueño o administrador</b><span>Con el email y la contraseña del dashboard. No hace falta vincular nada.</span></div><i>›</i>
          </button>
          <button className="esc-option" onClick={onEmployee}>
            <div><b>Soy empleado</b><span>Vinculá este celular al local una sola vez. Después entrás con tu PIN.</span></div><i>›</i>
          </button>
        </div>
      </div>
    </div>
  )
}

// Vincular con el QR de Equipo → Celulares del local (el mismo que usa la app).
// Con el link que manda el dueño por WhatsApp no pasa por acá: lo abre directo.
function LinkDevice({ onBack, onHelp, onLinked }: { onBack: () => void; onHelp: () => void; onLinked: (d: Device) => void }) {
  const [error, setError] = useState<string | null>(null)
  const [paused, setPaused] = useState(false)
  async function onCode(text: string) {
    setPaused(true); setError(null)
    const m = /^stampa-device:([a-f0-9]{24})(?::([a-f0-9]{24}))?$/i.exec(text.trim())
    if (!m) { beep(false); setError('Ese no es el código de activación. Está en el dashboard: Equipo → Celulares del local.'); setTimeout(() => setPaused(false), 1500); return }
    try {
      const r = await escaner.publicBusiness(m[1], m[2] || null)
      beep(true)
      onLinked({ businessId: m[1], businessName: r.business.name, locationId: m[2] || null, locationName: r.branch?.multi ? r.branch.name : null })
    } catch {
      beep(false); setError('No encontramos ese local. Pedile al dueño que genere el código de nuevo.'); setTimeout(() => setPaused(false), 1500)
    }
  }
  return (
    <div className="esc-screen">
      <Top onHelp={onHelp} />
      <div className="esc-body" style={{ paddingBottom: 8, flex: 'none' }}>
        <h1 className="esc-title">Vinculá este celular al local</h1>
        <p className="esc-sub">Abrí el link que te mandó el encargado por WhatsApp. Si tenés el código QR de <b>Equipo → Celulares del local</b>, apuntale la cámara.</p>
      </div>
      <div className="esc-main" style={{ paddingTop: 12 }}><Camara onCode={onCode} paused={paused} /></div>
      <div className="esc-foot">
        {error ? <p className="esc-error" style={{ textAlign: 'center' }}>{error}</p> : <div className="esc-foot-hint" style={{ fontSize: 14, fontWeight: 400 }}>Se hace una sola vez en este dispositivo.</div>}
        <button className="esc-link" onClick={onBack}>Volver</button>
      </div>
    </div>
  )
}

// ─── Iniciar sesión con PIN ──────────────────────────────────────────────────
const PIN_LENGTH = 4
function Login({ device, onHelp, onOwner, onUnlink, onDone, onRemoved }: {
  device: Device; onHelp: () => void; onOwner: () => void; onUnlink: () => void
  onDone: (token: string) => Promise<void>; onRemoved: (msg: string) => void
}) {
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [business, setBusiness] = useState<{ name: string; branch: string | null } | null>(device.businessName ? { name: device.businessName, branch: null } : null)
  const [missing, setMissing] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const sending = useRef(false)

  useEffect(() => {
    escaner.publicBusiness(device.businessId, device.locationId)
      .then(r => setBusiness({ name: r.business.name, branch: r.branch?.multi && r.branch.name ? r.branch.name : null }))
      .catch((e: EscanerError) => { if (e.status === 404) setMissing(true) })
  }, [device.businessId, device.locationId])

  async function submit(value: string) {
    if (value.length !== PIN_LENGTH || sending.current) return
    sending.current = true; setBusy(true); setError(null)
    try {
      const r = await escaner.login(device, value)
      await onDone(r.token)
    } catch (e) {
      beep(false)
      const err = e as EscanerError
      if (err.code === 'device_removed') { onRemoved(err.message); return }
      setError(err.status === 401 ? 'PIN incorrecto. Probá de nuevo.' : err.message)
      setPin('')
      setTimeout(() => input.current?.focus(), 50)
    } finally { sending.current = false; setBusy(false) }
  }
  function onChange(v: string) {
    const next = v.replace(/\D/g, '').slice(0, PIN_LENGTH)
    setError(null); setPin(next)
    if (next.length === PIN_LENGTH) submit(next)
  }

  return (
    <div className="esc-screen">
      <Top onHelp={onHelp} />
      <div className="esc-body">
        <h1 className="esc-title">Iniciar sesión</h1>
        {business && <div className="esc-business">Local: <b>{business.name}{business.branch ? ` · ${business.branch}` : ''}</b></div>}
        {missing && <p className="esc-error" style={{ marginTop: 10 }}>El negocio de este dispositivo ya no existe. Activalo para otro negocio.</p>}

        <div className="esc-label">Tu PIN</div>
        {/* Las cajitas muestran el PIN; el campo real está encima, transparente,
            así tocar en cualquier caja abre el teclado numérico del celular. */}
        <div className="esc-boxes" onClick={() => input.current?.focus()}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <div key={i} className={`esc-box${i === pin.length && !busy ? ' is-focus' : ''}${error ? ' is-error' : ''}`}>{i < pin.length && <i />}</div>
          ))}
          <input ref={input} value={pin} onChange={e => onChange(e.target.value)} type="password" inputMode="numeric" pattern="[0-9]*" maxLength={PIN_LENGTH}
            autoFocus autoComplete="off" disabled={busy} aria-label="PIN de 4 números" />
        </div>
        <div className="esc-hint">Los 4 números que te dio el encargado del local.</div>

        <div className="esc-status">{busy ? <div className="esc-spinner" /> : error ? <span className="esc-error">{error}</span> : null}</div>

        <button className="esc-btn" onClick={() => submit(pin)} disabled={pin.length !== PIN_LENGTH || busy}>{busy ? 'Entrando...' : 'Entrar'}</button>

        <div className="esc-or"><i /><span>o</span><i /></div>
        <button className="esc-btn esc-btn--line" onClick={onOwner}>Entrar como dueño o administrador</button>

        <button className="esc-link" onClick={onUnlink}>¿Es de otro local? Activar otro negocio</button>
      </div>
    </div>
  )
}

// ─── Dueño o administrador con email ─────────────────────────────────────────
function OwnerLogin({ device, onBack, onHelp, onDone, onRemoved }: {
  device: Device | null; onBack: () => void; onHelp: () => void
  onDone: (token: string, d: Device) => Promise<void>; onRemoved: (msg: string) => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [choose, setChoose] = useState<{ kind: 'business' | 'location'; items: { id: string; name: string; address?: string }[] } | null>(null)
  const [pick, setPick] = useState<{ businessId?: string; locationId?: string }>({})

  async function submit(p = pick) {
    setBusy(true); setError(null)
    try {
      const r = await escaner.ownerLogin(email.trim(), password, device, p)
      await onDone(r.token, { businessId: r.business.id, businessName: r.business.name, locationId: r.location.id, locationName: r.location.name, ...(device?.businessId === r.business.id && device.deviceKey ? { deviceKey: device.deviceKey } : {}) })
    } catch (e) {
      const err = e as EscanerError
      if (err.code === 'device_removed') { onRemoved(err.message); return }
      if (err.code === 'choose_business') setChoose({ kind: 'business', items: err.data?.businesses || [] })
      else if (err.code === 'choose_location') setChoose({ kind: 'location', items: err.data?.locations || [] })
      else setError(err.message)
    } finally { setBusy(false) }
  }

  if (choose) return (
    <div className="esc-screen">
      <Top onHelp={onHelp} />
      <div className="esc-body">
        <h1 className="esc-title">{choose.kind === 'business' ? '¿En qué negocio vas a escanear?' : '¿En qué sucursal estás?'}</h1>
        <div className="esc-stack" style={{ marginTop: 22 }}>
          {choose.items.map(it => (
            <button key={it.id} className="esc-option" disabled={busy} onClick={() => { const np = choose.kind === 'business' ? { businessId: it.id } : { ...pick, locationId: it.id }; setPick(np); setChoose(null); submit(np) }}>
              <div><b>{it.name}</b>{it.address && <span>{it.address}</span>}</div><i>›</i>
            </button>
          ))}
        </div>
        <button className="esc-link" onClick={() => setChoose(null)}>Volver</button>
      </div>
    </div>
  )

  return (
    <div className="esc-screen">
      <Top onHelp={onHelp} />
      <form className="esc-body" onSubmit={e => { e.preventDefault(); submit() }}>
        <h1 className="esc-title">Entrar como dueño o administrador</h1>
        <p className="esc-sub">Con el mismo email y la misma contraseña del dashboard.</p>
        <div className="esc-field"><label htmlFor="esc-email">Email</label><input id="esc-email" className="esc-input" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required /></div>
        <div className="esc-field"><label htmlFor="esc-pass">Contraseña</label><input id="esc-pass" className="esc-input" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required /></div>
        <div className="esc-status">{error && <span className="esc-error" role="alert">{error}</span>}</div>
        <button className="esc-btn" type="submit" disabled={busy || !email || !password}>{busy ? 'Entrando...' : 'Entrar'}</button>
        <button className="esc-link" type="button" onClick={onBack}>Volver</button>
      </form>
    </div>
  )
}

// ─── Bienvenida de 5 páginas (una vez por persona en este celular) ──────────
function Onboarding({ me, onDone }: { me: Me; onDone: () => void }) {
  const first = me.scanner.fullName.split(' ')[0]
  const [page, setPage] = useState(0)
  const pages: { kicker?: string; title: string; body: string; ill: React.ReactNode }[] = [
    { title: `Hola${first ? `, ${first}` : ''}`, ill: <div className="esc-circle"><span className="esc-wm" role="img" aria-label="Stampa" /></div>,
      body: `Ya formás parte del equipo de ${me.business.name}. Con este escáner vas a sumar sellos, puntos y visitas a los clientes escaneando su tarjeta.` },
    { kicker: 'Tarjeta de sellos', title: 'Un sello por visita',
      ill: <div className="esc-demo"><div className="esc-demo-stamps">{Array.from({ length: 8 }).map((_, i) => <i key={i} className={i < 5 ? 'on' : ''} />)}</div><p>5 de 8 sellos</p></div>,
      body: 'Cada vez que el cliente viene, le sumás un sello. Cuando completa la tarjeta, se gana su premio. La tarjeta queda completa hasta que le entregás el premio: ahí tocás Confirmar entrega y vuelve a cero.' },
    { kicker: 'Tarjeta de puntos', title: 'Puntos que se canjean',
      ill: <div className="esc-demo"><p className="esc-demo-big">120 pts</p><div className="esc-demo-row">Café gratis · 100</div><div className="esc-demo-row dim">Torta · 250</div></div>,
      body: 'Cada visita suma puntos. Cuando le alcanza para un premio del catálogo, lo ves marcado y podés canjearlo en el momento.' },
    { kicker: 'Membresía', title: 'Niveles por visitas',
      ill: <div className="esc-demo"><div className="esc-demo-ladder">{['Bronce', 'Plata', 'Oro'].map((n, i) => <div key={n}><i className={i <= 1 ? 'on' : ''} /><span style={i === 1 ? { fontWeight: 800 } : undefined}>{n}</span></div>)}</div><p>3 visitas para Oro</p></div>,
      body: 'Cada visita suma. Con suficientes visitas, el cliente sube de nivel (por ejemplo de Bronce a Plata) y gana un beneficio nuevo.' },
    { kicker: 'Cómo escanear', title: 'Apuntá al QR del cliente',
      ill: <div className="esc-phone"><div><div className="esc-qr">{Array.from({ length: 25 }).map((_, i) => <i key={i} className={[0, 1, 3, 5, 7, 8, 11, 12, 14, 16, 19, 21, 22, 24].includes(i) ? 'on' : ''} />)}</div></div></div>,
      body: 'El cliente abre su tarjeta en el Wallet del celular. Apuntá la cámara al código: vas a ver su tarjeta al instante.' },
  ]
  const last = page === pages.length - 1
  const pg = pages[page]
  return (
    <div className="esc-screen">
      <div className="esc-ob">
        <div className="esc-ob-ill">{pg.ill}</div>
        {pg.kicker && <div className="esc-ob-kicker">{pg.kicker}</div>}
        <h1 className="esc-ob-title">{pg.title}</h1>
        <p className="esc-ob-body">{pg.body}</p>
      </div>
      <div className="esc-ob-foot">
        <div className="esc-dots">{pages.map((_, i) => <i key={i} className={i === page ? 'on' : ''} />)}</div>
        <button className="esc-btn" onClick={() => (last ? onDone() : setPage(page + 1))}>{last ? 'Empezar a escanear' : page === 0 ? 'Ver cómo funciona' : 'Siguiente'}</button>
        {!last && <button className="esc-skip" onClick={onDone}>Saltar</button>}
      </div>
    </div>
  )
}

// ─── Buscar ───────────────────────────────────────────────────────────────────
const TYPE_LABEL = { stamp: 'sellos', points: 'puntos', membership: 'membresía' } as const
function Buscar({ onOpen }: { onOpen: (id: string) => void }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (q.trim().length < 2) { setResults(null); return }
    setLoading(true)
    const t = setTimeout(() => {
      escaner.search(q.trim()).then(r => { setResults(r.results); setError(null) }).catch((e: EscanerError) => setError(e.message)).finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(t)
  }, [q])
  return (
    <div className="esc-pane">
      <input className="esc-input" autoFocus inputMode="search" autoCorrect="off" autoCapitalize="none" placeholder="Nombre, email o teléfono" value={q} onChange={e => setQ(e.target.value)} aria-label="Buscar cliente" />
      {error && <div className="esc-error">{error}</div>}
      {results?.map(r => (
        <button key={r.id} className="esc-row" onClick={() => onOpen(r.id)}>
          <span className="esc-row-sw" style={{ background: r.card.color || '#1B412F', color: r.card.textColor || '#fff' }}>{r.fullName.charAt(0).toUpperCase()}</span>
          <span className="esc-row-main"><div className="esc-row-name">{r.fullName}</div><div className="esc-row-meta">{[r.phone, r.email].filter(Boolean).join(' · ')} · {r.card.name} ({TYPE_LABEL[r.card.type]})</div></span>
        </button>
      ))}
      <div className="esc-empty">
        {q.trim().length < 2 ? 'Escribí al menos 2 letras, o los últimos dígitos de su teléfono.' : loading ? '' : results && results.length === 0 ? 'No encontramos clientes con eso.' : ''}
      </div>
    </div>
  )
}

// ─── Hoy ──────────────────────────────────────────────────────────────────────
const KIND: Record<TodayItem['type'], string> = { stamp: 'sello', points: 'puntos', visit: 'visita', redeem: 'premio entregado' }
function Hoy({ onChanged }: { onChanged: () => void }) {
  const [data, setData] = useState<{ items: TodayItem[]; undoMinutes: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const load = useCallback(() => { escaner.todayList().then(setData).catch((e: EscanerError) => setError(e.message)) }, [])
  useEffect(() => { load() }, [load])
  async function undo(it: TodayItem) {
    if (!window.confirm(`¿Deshacer ${KIND[it.type]} de ${it.customerName}?`)) return
    setBusy(it.id)
    try { await escaner.undo(it.id); onChanged(); load() } catch (e) { setError((e as EscanerError).message) } finally { setBusy(null) }
  }
  const hhmm = (d: string) => new Date(d).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  return (
    <div className="esc-pane">
      {error && <div className="esc-error">{error}</div>}
      {!data && !error && <div className="esc-center"><div className="esc-spinner" /></div>}
      {data && data.items.length === 0 && <div className="esc-empty">Todavía no sumaste nada hoy.</div>}
      {data?.items.map(it => (
        <div key={it.id} className="esc-row">
          <span className="esc-row-main">
            <div className="esc-row-name">{it.customerName}</div>
            <div className="esc-row-meta">
              {it.type === 'points' && it.delta ? `+${it.delta} puntos` : it.type === 'redeem' ? `Entregó ${it.rewardName || 'un premio'}` : it.type === 'stamp' && it.delta && it.delta > 1 ? `${it.delta} sellos` : KIND[it.type]}
              {it.purchase ? ` · compra de ${formatMoney(it.purchase)}` : ''}{it.overLimit ? ' · fuera de la regla' : ''}
            </div>
          </span>
          <span className="esc-row-time">{hhmm(it.createdAt)}</span>
          {it.canUndo && <button className="esc-undo-mini" disabled={busy === it.id} onClick={() => undo(it)}>Deshacer</button>}
        </div>
      ))}
      {data && data.items.length > 0 && <div className="esc-empty">Se puede deshacer hasta {data.undoMinutes} minutos después.</div>}
    </div>
  )
}

// ─── Ayuda (mismas preguntas que la app, más lo del escáner web) ────────────
const LOGIN_FAQ = [
  { q: '¿Cuál es mi PIN?', a: 'Son 4 números que te da el dueño o encargado del local. Lo crea en el dashboard, en Equipo.' },
  { q: 'Me dice "PIN incorrecto"', a: 'Revisá que este celular sea del local donde trabajás (lo dice arriba). Si sigue fallando, pedile al encargado que revise tu usuario en Equipo.' },
  { q: 'Soy el dueño o administrador', a: 'Tocá "Soy dueño o administrador" (o "Entrar como dueño o administrador" en la pantalla del PIN) y usá el mismo email y contraseña del dashboard. No hace falta vincular el celular.' },
  { q: 'Soy empleado y es la primera vez', a: 'Abrí en este celular el link que te mandó el encargado por WhatsApp (en el dashboard: Equipo → Celulares del local). Se hace una sola vez; después entrás con tu PIN.' },
  { q: 'Este celular es de otro local', a: 'Tocá "Activar otro negocio" y abrí el link del local correcto.' },
]
const SCAN_FAQ = [
  { q: 'Cómo sumar', a: 'Apuntá al código QR de la tarjeta del cliente (en su Wallet). Se abre su tarjeta: tocá "+ Sello", "+ Puntos" o "+ Visita".' },
  { q: 'Me equivoqué', a: 'Justo después de sumar aparece "Deshacer". Si ya pasó, andá a la pestaña Hoy: se puede deshacer hasta 10 minutos después. Más tarde, lo corrige el encargado desde el dashboard.' },
  { q: 'Entregar un premio', a: 'Sellos: cuando la tarjeta está completa, entregá el premio y tocá "Confirmar entrega". Puntos: tocá el premio que elige el cliente en la lista.' },
  { q: 'El cliente no tiene el celular o el QR no se lee', a: 'Andá a Buscar y escribí su nombre, su email o los últimos dígitos de su teléfono.' },
  { q: 'Dice que ya sumó', a: 'El local tiene una regla de cuántas veces por día (o cada cuántas horas) puede sumar un cliente. Si el dueño lo permite, aparece "Sumar igual" y queda marcado en el historial.' },
  { q: 'Regalo de cumpleaños y días dobles', a: 'Si el cliente cumple años, aparece el regalo arriba de su tarjeta con el botón "Entregar". Los días dobles cada escaneo suma el doble solo.' },
  { q: 'La cámara no anda', a: 'Revisá que el navegador tenga permiso de cámara (el candado al lado de la dirección) y recargá. Limpiá la lente y probá con más luz.' },
]
function Ayuda({ logged, onClose }: { logged: boolean; onClose: () => void }) {
  const items = logged ? SCAN_FAQ : LOGIN_FAQ
  const [open, setOpen] = useState<number | null>(0)
  return (
    <Sheet title="Ayuda" onClose={onClose}>
      {items.map((it, i) => (
        <div key={i} className="esc-faq">
          <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>{it.q}<span>{open === i ? '−' : '+'}</span></button>
          {open === i && <p>{it.a}</p>}
        </div>
      ))}
      <p className="esc-sheet-foot">¿Algo más? Hablá con el dueño o encargado del local.</p>
    </Sheet>
  )
}

// ─── Consejo: agregarlo a la pantalla de inicio (una sola vez, ya adentro) ──
function TipModal({ onClose }: { onClose: () => void }) {
  const ios = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent)
  const iphone = (
    <div key="ios">
      <h3>En iPhone (Safari)</h3>
      <ol><li>Tocá el botón <b>Compartir</b>, el cuadrado con la flecha hacia arriba.</li><li>Elegí <b>Agregar a inicio</b>.</li><li>Tocá <b>Agregar</b>.</li></ol>
    </div>
  )
  const android = (
    <div key="android">
      <h3>En Android (Chrome)</h3>
      <ol><li>Tocá el menú de los tres puntos, arriba a la derecha.</li><li>Elegí <b>Agregar a la pantalla principal</b> (o <b>Instalar app</b>).</li><li>Confirmá.</li></ol>
    </div>
  )
  return (
    <div className="esc-sheet-bg" onClick={onClose}>
      <div className="esc-sheet esc-sheet--center" role="dialog" aria-label="Agregá el escáner a tu pantalla de inicio" onClick={e => e.stopPropagation()}>
        <div className="esc-tip">
          <h2>Agregalo a tu pantalla de inicio</h2>
          <p>Así abrís el escáner como una app, sin buscar el link cada vez.</p>
          {ios ? [iphone, android] : [android, iphone]}
          <button className="esc-btn" onClick={onClose}>Entendido</button>
        </div>
      </div>
    </div>
  )
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="esc-sheet-bg" onClick={onClose}>
      <div className="esc-sheet" role="dialog" aria-label={title} onClick={e => e.stopPropagation()}>
        <div className="esc-sheet-head"><h2>{title}</h2><button onClick={onClose}>Cerrar</button></div>
        {children}
      </div>
    </div>
  )
}
