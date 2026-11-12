'use client'
// Escáner web (/escaner): la app Stampa Escáner en el navegador, para los
// locales que no la pueden bajar (Android, compu de la caja, celulares sin
// App Store). Tiene todo lo que tiene la app — vincular el celular, PIN,
// dueño con email, sucursales, bienvenida, ayuda, cámara con sonido,
// buscar, sellos, puntos, membresía, cumpleaños, deshacer — y suma la
// pestaña Hoy, la búsqueda por teléfono y la regla de frecuencia.
//
// Fases: sin vincular → PIN (o email) → bienvenida (una vez por persona)
// → escáner con tres pestañas: Escanear, Buscar y Hoy.
import { useCallback, useEffect, useRef, useState } from 'react'
import { Camara } from './Camara'
import { Cliente } from './Cliente'
import {
  escaner, EscanerError, beep, formatMoney, getDevice, setDevice, getToken, setToken, sawWelcome, markWelcome, setUnauthorizedHandler,
  type CustomerView, type Device, type Me, type SearchResult, type TodayItem, type LocationChoice,
} from '@/lib/escaner'
import { ESCANER_CSS } from './estilos'

type Phase = 'boot' | 'unlinked' | 'link-qr' | 'pin' | 'owner' | 'welcome' | 'app'
type Tab = 'scan' | 'search' | 'today'

export function EscanerApp({ justLinked = false }: { justLinked?: boolean }) {
  const [phase, setPhase] = useState<Phase>('boot')
  const [device, setDev] = useState<Device | null>(null)
  const [me, setMe] = useState<Me | null>(null)
  const [tab, setTab] = useState<Tab>('scan')
  const [view, setView] = useState<CustomerView | null>(null)
  const [banner, setBanner] = useState<{ kind: 'warn' | 'ok'; text: string; action?: { label: string; run: () => void } } | null>(null)
  const [help, setHelp] = useState(false)
  const [menu, setMenu] = useState(false)
  const [installHint, setInstallHint] = useState(justLinked)
  const [paused, setPaused] = useState(false)
  const [locs, setLocs] = useState<LocationChoice[] | null>(null)

  const saveDevice = (d: Device | null) => { setDevice(d); setDev(d) }

  const enter = useCallback(async () => {
    const m = await escaner.me()
    setMe(m)
    const who = `${m.business.id}:${m.scanner.id}`
    setPhase(sawWelcome(who) ? 'app' : 'welcome')
  }, [])

  // Arranque: sesión guardada → adentro; si no, PIN o "sin vincular".
  useEffect(() => {
    const d = getDevice()
    setDev(d)
    setUnauthorizedHandler(() => { setToken(null); setMe(null); setView(null); setPhase(getDevice() ? 'pin' : 'unlinked') })
    if (!getToken()) { setPhase(d ? 'pin' : 'unlinked'); return }
    enter().catch((e: EscanerError) => {
      if (e.code === 'device_removed') { saveDevice(null); setBanner({ kind: 'warn', text: e.message }) }
      setToken(null)
      setPhase(getDevice() ? 'pin' : 'unlinked')
    })
    return () => setUnauthorizedHandler(null)
  }, [enter])

  function logout() {
    setMenu(false); setToken(null); setMe(null); setView(null); setTab('scan')
    setPhase(device ? 'pin' : 'unlinked')
  }
  function unlink() {
    if (!window.confirm('¿Desvincular este celular del local?\n\nPara volver a usarlo vas a necesitar un link nuevo del dueño (o entrar con email).')) return
    setToken(null); saveDevice(null); setMe(null); setMenu(false); setPhase('unlinked')
  }

  // ── Lectura de un QR ────────────────────────────────────────────────────────
  async function onCode(text: string) {
    setPaused(true); setBanner(null)
    try {
      const v = await escaner.lookup(text)
      beep(true)
      setView(v)
    } catch (e) {
      beep(false)
      const err = e as EscanerError
      if (err.isUnauthorized) return
      const loc = err.code === 'device_qr' ? err.data?.location : null
      setBanner({
        kind: 'warn',
        text: err.code === 'not_found' ? 'Este código no es de una tarjeta de este negocio. Pedile al cliente la tarjeta de este local.' : err.message,
        action: loc ? { label: `Pasar este celular a ${loc.name}`, run: () => switchTo(loc.id) } : undefined,
      })
      setTimeout(() => setPaused(false), 1800)
    }
  }

  async function switchTo(locationId: string) {
    try {
      const r = await escaner.switchLocation(locationId)
      setToken(r.token)
      if (device) saveDevice({ ...device, locationId: r.location.id, locationName: r.location.name })
      setLocs(null); setBanner({ kind: 'ok', text: `Listo: este celular ahora suma en ${r.location.name}.` })
      await enter()
    } catch (e) { setBanner({ kind: 'warn', text: (e as EscanerError).message }) }
  }

  async function openLocations() {
    try { const r = await escaner.locations(); setLocs(r.locations) } catch (e) { setBanner({ kind: 'warn', text: (e as EscanerError).message }) }
  }

  const refreshMe = () => { escaner.me().then(setMe).catch(() => {}) }
  const closeCustomer = () => { setView(null); setPaused(false); refreshMe() }

  let screen: React.ReactNode = null
  if (phase === 'boot') screen = <div className="esc-center"><div className="esc-spinner" aria-label="Cargando" /></div>
  else if (phase === 'unlinked') screen = <Unlinked banner={banner} onOwner={() => setPhase('owner')} onScanQr={() => setPhase('link-qr')} onHelp={() => setHelp(true)} />
  else if (phase === 'link-qr') screen = <LinkByQr onBack={() => setPhase('unlinked')} onLinked={d => { saveDevice(d); setInstallHint(true); setPhase('pin') }} />
  else if (phase === 'pin' && device) screen = (
    <PinScreen device={device} installHint={installHint} onDismissHint={() => setInstallHint(false)} onHelp={() => setHelp(true)}
      onOwner={() => setPhase('owner')} onUnlink={unlink}
      onDone={async token => { setToken(token); setBanner(null); await enter() }}
      onRemoved={msg => { saveDevice(null); setBanner({ kind: 'warn', text: msg }); setPhase('unlinked') }} />
  )
  else if (phase === 'owner') screen = (
    <OwnerLogin device={device} onBack={() => setPhase(device ? 'pin' : 'unlinked')} onHelp={() => setHelp(true)}
      onDone={async (token, d) => { setToken(token); if (!device) saveDevice(d); else if (d.locationId !== device.locationId) saveDevice({ ...device, locationId: d.locationId, locationName: d.locationName }); await enter() }}
      onRemoved={msg => { saveDevice(null); setBanner({ kind: 'warn', text: msg }); setPhase('unlinked') }} />
  )
  else if (phase === 'welcome' && me) screen = <Welcome me={me} onDone={() => { markWelcome(`${me.business.id}:${me.scanner.id}`); setPhase('app') }} />
  else if (phase === 'app' && me) screen = (
    <div className="esc-app">
      <header className="esc-head">
        <div style={{ minWidth: 0 }}>
          <div className="esc-hello">Hola, {me.scanner.fullName.split(' ')[0]}</div>
          <div className="esc-biz">{me.business.name}</div>
        </div>
        <div className="esc-head-end">
          <button className="esc-chip" onClick={me.location.multi ? openLocations : undefined} aria-label={me.location.multi ? 'Cambiar sucursal' : 'Sucursal'}>
            {me.location.name}{me.location.multi ? ' ▾' : ''}
          </button>
          <button className="esc-round" onClick={() => setHelp(true)} aria-label="Ayuda">?</button>
          <button className="esc-round" onClick={() => setMenu(m => !m)} aria-label="Menú" aria-expanded={menu}>☰</button>
        </div>
        {menu && (
          <div className="esc-menu" role="menu">
            <button role="menuitem" onClick={logout}>Salir (otro empleado)</button>
            <button role="menuitem" onClick={unlink}>Desvincular este celular</button>
          </div>
        )}
      </header>

      <div className="esc-today" aria-label={`Hoy: ${me.today.mine} tuyos, ${me.today.total} en total`}>
        <span><b>{me.today.mine}</b> {me.today.mine === 1 ? 'escaneo tuyo hoy' : 'escaneos tuyos hoy'}</span>
        <i />
        <span><b>{me.today.total}</b> {me.location.multi ? 'en esta sucursal' : 'en todo el local'}</span>
      </div>

      {me.location.status === 'paused' && <div className="esc-banner esc-banner--warn">Esta sucursal está pausada porque el plan del negocio no la incluye. Avisale al dueño.</div>}
      {banner && (
        <div className={`esc-banner esc-banner--${banner.kind}`}>
          {banner.text}
          {banner.action && <button className="esc-link" onClick={banner.action.run}>{banner.action.label}</button>}
        </div>
      )}

      <main className="esc-main">
        {tab === 'scan' && <Camara onCode={onCode} paused={paused || !!view} hint="Apuntá al QR de la tarjeta del cliente" />}
        {tab === 'search' && <Buscar onOpen={async id => { try { setView(await escaner.customer(id)) } catch (e) { setBanner({ kind: 'warn', text: (e as EscanerError).message }) } }} />}
        {tab === 'today' && <Hoy onChanged={refreshMe} />}
      </main>

      <nav className="esc-nav">
        {([['scan', '⌖', 'Escanear'], ['search', '⌕', 'Buscar'], ['today', '☰', 'Hoy']] as const).map(([k, i, l]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => { setTab(k); setBanner(null); setPaused(false) }} aria-current={tab === k ? 'page' : undefined}><span aria-hidden>{i}</span>{l}</button>
        ))}
      </nav>

      {view && <div className="esc-overlay"><Cliente initial={view} onClose={closeCustomer} onChanged={refreshMe} /></div>}
      {locs && (
        <Sheet title="¿En qué sucursal estás?" onClose={() => setLocs(null)}>
          {locs.map(l => (
            <button key={l.id} className="esc-option" onClick={() => switchTo(l.id)} disabled={l.id === me.location.id}>
              <b>{l.name}</b>{l.address && <span>{l.address}</span>}{l.id === me.location.id && <span>Estás acá</span>}
            </button>
          ))}
        </Sheet>
      )}
    </div>
  )

  return (
    <div className="esc-root">
      <style>{ESCANER_CSS}</style>
      {screen}
      {help && <Ayuda logged={phase === 'app'} onClose={() => setHelp(false)} />}
    </div>
  )
}

// ─── Sin vincular ─────────────────────────────────────────────────────────────
function Unlinked({ banner, onOwner, onScanQr, onHelp }: { banner: { kind: string; text: string } | null; onOwner: () => void; onScanQr: () => void; onHelp: () => void }) {
  return (
    <div className="esc-page">
      <div className="esc-brand"><b>Stampa</b><span>Escáner</span></div>
      <button className="esc-round esc-help-corner" onClick={onHelp} aria-label="Ayuda">?</button>
      {banner && <div className={`esc-banner esc-banner--${banner.kind}`}>{banner.text}</div>}
      <h1 className="esc-h1">Sumá sellos, puntos y visitas desde el navegador</h1>
      <p className="esc-p">Este celular todavía no está vinculado a un local.</p>
      <div className="esc-stack">
        <div className="esc-box">
          <b>Soy empleado</b>
          <span>Pedile al dueño el link del escáner (en el panel: Equipo → Escáner web) y abrilo en este celular. Después entrás con tu PIN.</span>
          <button className="esc-btn esc-btn--line" onClick={onScanQr}>Tengo el QR de activación</button>
        </div>
        <button className="esc-btn" onClick={onOwner}>Soy dueño o administrador · entrar con email</button>
      </div>
    </div>
  )
}

// Vincular escaneando el QR de "Activar dispositivo" (el mismo que usa la app).
function LinkByQr({ onBack, onLinked }: { onBack: () => void; onLinked: (d: Device) => void }) {
  const [error, setError] = useState<string | null>(null)
  const [paused, setPaused] = useState(false)
  async function onCode(text: string) {
    const m = /^stampa-device:([a-f0-9]{24})(?::([a-f0-9]{24}))?$/i.exec(text.trim())
    if (!m) { beep(false); setError('Ese no es el QR de activación. Está en el panel: Equipo → Activar dispositivo.'); setTimeout(() => setPaused(false), 1500); return }
    try {
      const r = await escaner.publicBusiness(m[1], m[2] || null)
      beep(true)
      onLinked({ businessId: m[1], businessName: r.business.name, locationId: m[2] || null, locationName: r.location?.name || null })
    } catch {
      beep(false); setError('No encontramos ese local. Pedile al dueño que genere el QR de nuevo.'); setTimeout(() => setPaused(false), 1500)
    }
  }
  return (
    <div className="esc-app">
      <header className="esc-head"><button className="esc-link" onClick={onBack}>← Volver</button><div className="esc-biz">Vincular este celular</div><span /></header>
      {error && <div className="esc-banner esc-banner--warn">{error}</div>}
      <main className="esc-main"><Camara onCode={t => { setPaused(true); setError(null); onCode(t) }} paused={paused} hint="Apuntá al QR de Equipo → Activar dispositivo" /></main>
    </div>
  )
}

// ─── PIN ──────────────────────────────────────────────────────────────────────
function PinScreen({ device, installHint, onDismissHint, onHelp, onOwner, onUnlink, onDone, onRemoved }: {
  device: Device; installHint: boolean; onDismissHint: () => void; onHelp: () => void; onOwner: () => void; onUnlink: () => void
  onDone: (token: string) => Promise<void>; onRemoved: (msg: string) => void
}) {
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sending = useRef(false)

  const submit = useCallback(async (p: string) => {
    if (sending.current) return
    sending.current = true; setBusy(true); setError(null)
    try {
      const r = await escaner.login(device, p)
      await onDone(r.token)
    } catch (e) {
      const err = e as EscanerError
      if (err.code === 'device_removed') { onRemoved(err.message); return }
      setError(err.message); setPin('')
    } finally { sending.current = false; setBusy(false) }
  }, [device, onDone, onRemoved])

  function press(k: string) {
    if (busy) return
    setError(null)
    if (k === '⌫') { setPin(p => p.slice(0, -1)); return }
    const next = (pin + k).slice(0, 4)
    setPin(next)
    if (next.length === 4) submit(next)
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (/^\d$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') press('⌫') }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="esc-page">
      <div className="esc-brand"><b>Stampa</b><span>Escáner</span></div>
      <button className="esc-round esc-help-corner" onClick={onHelp} aria-label="Ayuda">?</button>
      {installHint && (
        <div className="esc-banner esc-banner--ok">
          <b>✓ Este celular quedó vinculado.</b> Agregalo a la pantalla de inicio para abrirlo como una app: en iPhone, Compartir → &quot;Agregar a inicio&quot;; en Android, el menú ⋮ → &quot;Agregar a la pantalla principal&quot;.
          <button className="esc-link" onClick={onDismissHint}>Entendido</button>
        </div>
      )}
      <div className="esc-where"><b>{device.businessName}</b>{device.locationName && <span className="esc-chip">{device.locationName}</span>}</div>
      <div className="esc-h1" style={{ textAlign: 'center' }}>Tu PIN</div>
      <div className="esc-dots" aria-label={`${pin.length} de 4 números`}>{[0, 1, 2, 3].map(i => <span key={i} className={i < pin.length ? 'on' : ''} />)}</div>
      {error && <div className="esc-error" role="alert">{error}</div>}
      <div className="esc-pad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) => k
          ? <button key={i} onClick={() => press(k)} disabled={busy} aria-label={k === '⌫' ? 'Borrar' : k}>{k}</button>
          : <span key={i} />)}
      </div>
      <button className="esc-link" onClick={onOwner}>Soy dueño o administrador · entrar con email</button>
      <button className="esc-link esc-link--soft" onClick={onUnlink}>Este no es mi local</button>
    </div>
  )
}

// ─── Dueño o administrador con email ──────────────────────────────────────────
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
    <div className="esc-page">
      <div className="esc-h1">{choose.kind === 'business' ? '¿En qué negocio vas a escanear?' : '¿En qué sucursal estás?'}</div>
      <div className="esc-stack">
        {choose.items.map(it => (
          <button key={it.id} className="esc-option" disabled={busy} onClick={() => { const p = choose.kind === 'business' ? { businessId: it.id } : { ...pick, locationId: it.id }; setPick(p); setChoose(null); submit(p) }}>
            <b>{it.name}</b>{it.address && <span>{it.address}</span>}
          </button>
        ))}
      </div>
      <button className="esc-link" onClick={() => setChoose(null)}>← Volver</button>
    </div>
  )

  return (
    <div className="esc-page">
      <button className="esc-link" style={{ alignSelf: 'flex-start' }} onClick={onBack}>← Volver</button>
      <button className="esc-round esc-help-corner" onClick={onHelp} aria-label="Ayuda">?</button>
      <div className="esc-h1">Entrar como dueño o administrador</div>
      <p className="esc-p">Con el mismo email y contraseña del panel.</p>
      <form className="esc-stack" onSubmit={e => { e.preventDefault(); submit() }}>
        <input className="esc-input" type="email" autoComplete="username" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input className="esc-input" type="password" autoComplete="current-password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required />
        {error && <div className="esc-error" role="alert">{error}</div>}
        <button className="esc-btn" type="submit" disabled={busy || !email || !password}>{busy ? 'Entrando…' : 'Entrar'}</button>
      </form>
    </div>
  )
}

// ─── Bienvenida (una vez por persona en este celular) ─────────────────────────
const SLIDES = [
  { icon: '●', title: 'Un sello por visita', body: 'Cada vez que el cliente viene, le sumás un sello. Cuando completa la tarjeta, se gana su premio: se lo entregás y tocás Confirmar entrega.' },
  { icon: '★', title: 'Puntos que se canjean', body: 'Cada visita (o cada compra, según el local) suma puntos. Cuando le alcanza para un premio, lo ves marcado con ✓ y lo canjeás en el momento.' },
  { icon: '▲', title: 'Niveles por visitas', body: 'En las membresías cada visita suma. Con suficientes visitas el cliente sube de nivel y gana un beneficio nuevo.' },
  { icon: '⌖', title: 'Apuntá al QR del cliente', body: 'El cliente abre su tarjeta en el Wallet. Apuntá la cámara al código: suena y ves su tarjeta al instante. Si no tiene el celular, usá Buscar.' },
]
function Welcome({ me, onDone }: { me: Me; onDone: () => void }) {
  const [i, setI] = useState(-1)
  if (i === -1) return (
    <div className="esc-page esc-page--center">
      <div className="esc-done-big" aria-hidden>👋</div>
      <div className="esc-h1">Hola, {me.scanner.fullName.split(' ')[0]}</div>
      <p className="esc-p">{me.scanner.role === 'scanner' ? <>Ya formás parte del equipo de <b>{me.business.name}</b>.</> : <>Vas a escanear en <b>{me.business.name}</b>.</>} Te mostramos cómo se usa en 30 segundos.</p>
      <button className="esc-btn" onClick={() => setI(0)}>Empezar</button>
      <button className="esc-link" onClick={onDone}>Saltar</button>
    </div>
  )
  const s = SLIDES[i]
  const last = i === SLIDES.length - 1
  return (
    <div className="esc-page esc-page--center">
      <div className="esc-slide-icon" aria-hidden>{s.icon}</div>
      <div className="esc-h1">{s.title}</div>
      <p className="esc-p">{s.body}</p>
      <div className="esc-dots esc-dots--sm">{SLIDES.map((_, k) => <span key={k} className={k === i ? 'on' : ''} />)}</div>
      <button className="esc-btn" onClick={() => (last ? onDone() : setI(i + 1))}>{last ? 'Listo, a escanear' : 'Siguiente'}</button>
      {!last && <button className="esc-link" onClick={onDone}>Saltar</button>}
    </div>
  )
}

// ─── Buscar ───────────────────────────────────────────────────────────────────
function Buscar({ onOpen }: { onOpen: (id: string) => void }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (q.trim().length < 2) { setResults(null); return }
    const t = setTimeout(() => {
      escaner.search(q.trim()).then(r => { setResults(r.results); setError(null) }).catch((e: EscanerError) => setError(e.message))
    }, 250)
    return () => clearTimeout(t)
  }, [q])
  return (
    <div className="esc-pane">
      <input className="esc-input" autoFocus inputMode="search" placeholder="Nombre, email o últimos dígitos del teléfono" value={q} onChange={e => setQ(e.target.value)} aria-label="Buscar cliente" />
      {error && <div className="esc-error">{error}</div>}
      {results && results.length === 0 && <div className="esc-empty">No encontramos a nadie con eso.</div>}
      {results?.map(r => (
        <button key={r.id} className="esc-row" onClick={() => onOpen(r.id)}>
          <span className="esc-row-dot" style={{ background: r.card.color || '#1B412F' }} />
          <span style={{ flex: 1, minWidth: 0 }}><b>{r.fullName}</b><span className="esc-row-sub">{[r.phone, r.email].filter(Boolean).join(' · ')}</span></span>
          <span className="esc-row-sub">{r.card.name}</span>
        </button>
      ))}
      {!results && <div className="esc-empty">Para cuando el cliente no tiene el celular a mano o el QR no se lee.</div>}
    </div>
  )
}

// ─── Hoy ──────────────────────────────────────────────────────────────────────
const KIND: Record<TodayItem['type'], string> = { stamp: 'sello', points: 'puntos', visit: 'visita', redeem: 'premio 🎁' }
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
          <span style={{ flex: 1, minWidth: 0 }}>
            <b>{it.customerName}</b>
            <span className="esc-row-sub">
              {it.type === 'points' && it.delta ? `+${it.delta} puntos` : it.type === 'redeem' ? `entregó ${it.rewardName || 'premio'}` : it.type === 'stamp' && it.delta && it.delta > 1 ? `${it.delta} sellos` : KIND[it.type]}
              {it.purchase ? ` · compra ${formatMoney(it.purchase)}` : ''}{it.overLimit ? ' · fuera de la regla' : ''}
            </span>
          </span>
          <span className="esc-row-sub">{hhmm(it.createdAt)}</span>
          {it.canUndo && <button className="esc-btn esc-btn--sm esc-btn--line" disabled={busy === it.id} onClick={() => undo(it)}>Deshacer</button>}
        </div>
      ))}
      {data && data.items.length > 0 && <div className="esc-empty">Se puede deshacer hasta {data.undoMinutes} minutos después.</div>}
    </div>
  )
}

// ─── Ayuda ────────────────────────────────────────────────────────────────────
const LOGIN_FAQ = [
  { q: '¿Cuál es mi PIN?', a: 'Son 4 números que te da el dueño o encargado del local. Lo crea en el panel, en Equipo.' },
  { q: 'Me dice "PIN incorrecto"', a: 'Revisá que este celular sea del local donde trabajás (lo dice arriba). Si sigue fallando, pedile al encargado que revise tu usuario en Equipo.' },
  { q: 'Soy el dueño o administrador', a: 'Tocá "Soy dueño o administrador" y usá el mismo email y contraseña del panel. No hace falta vincular el celular.' },
  { q: 'Soy empleado y es la primera vez', a: 'Pedile al dueño el link del escáner (Equipo → Escáner web) y abrilo en este celular. También sirve escanear el QR de Equipo → Activar dispositivo. Se hace una sola vez; después entrás con tu PIN.' },
  { q: 'Este celular es de otro local', a: 'Tocá "Este no es mi local" y abrí el link o el QR del local correcto.' },
]
const SCAN_FAQ = [
  { q: 'Cómo sumar', a: 'Apuntá al código QR de la tarjeta del cliente (en su Wallet). Se abre su tarjeta: tocá "+ Sello", "+ Puntos" o "+ Visita".' },
  { q: 'Me equivoqué', a: 'Justo después de sumar aparece "Deshacer". Si ya pasó, andá a la pestaña Hoy: se puede deshacer hasta 10 minutos después. Más tarde, lo corrige el encargado desde el panel.' },
  { q: 'Entregar un premio', a: 'Sellos: cuando la tarjeta está completa, entregá el premio y tocá "Confirmar entrega". Puntos: tocá el premio que elige el cliente en la lista.' },
  { q: 'El cliente no tiene el celular o el QR no se lee', a: 'Andá a Buscar y escribí su nombre, su email o los últimos dígitos de su teléfono.' },
  { q: 'Dice que ya sumó hoy', a: 'El local tiene una regla de cuántas veces por día (o cada cuántas horas) puede sumar un cliente. Si el dueño lo permite, aparece "Sumar igual" y queda marcado en el historial.' },
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
          <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}><b>{it.q}</b><span>{open === i ? '−' : '+'}</span></button>
          {open === i && <p>{it.a}</p>}
        </div>
      ))}
      <p className="esc-empty">¿Algo más? Escribinos a hola@stampaclub.com</p>
    </Sheet>
  )
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="esc-sheet-bg" onClick={onClose}>
      <div className="esc-sheet" role="dialog" aria-label={title} onClick={e => e.stopPropagation()}>
        <div className="esc-sheet-head"><b>{title}</b><button className="esc-link" onClick={onClose}>Cerrar</button></div>
        <div className="esc-stack">{children}</div>
      </div>
    </div>
  )
}
