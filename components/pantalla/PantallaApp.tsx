'use client'
// Pantalla Stampa (/pantalla): una tablet o un celular fijo en el mostrador,
// con la cámara mirando al cliente. Lee el QR del pase y suma sin empleado.
// Todo lo decide el backend (/api/screen/scan): acá solo se dibuja el resultado
// según el tipo de tarjeta (sellos, puntos o niveles).
//
// La pantalla se viste con la marca del negocio: colores, logo, íconos de sello
// e imagen del premio salen de lo que el dueño configuró en la tarjeta (Diseño).
// Stampa queda en un renglón chico al pie.
//
// Pensada para quedarse prendida todo el día: pide que la pantalla no se
// apague, vuelve a consultar al backend cada minuto (se entera si el dueño la
// desactivó o la quitó) y se recarga sola de vez en cuando.
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { Icon } from '@/components/ui/Icon'
import { beep } from '@/lib/escaner'
import { getScreen, setScreen, pantalla, ScreenError, type BrandCard, type CatalogRow, type ScanResult, type ScreenStatus, type TierLook } from '@/lib/pantalla'

const SHOW_MS = 4500       // cuánto se ve el resultado
const ERROR_MS = 3500
const SAME_CODE_MS = 3000  // el mismo QR apenas leído no se vuelve a procesar
const STATUS_EVERY_MS = 60 * 1000
const RELOAD_AFTER_MS = 12 * 60 * 60 * 1000
const BRAND_EVERY_MS = 10 * 60 * 1000 // por si el dueño cambia colores o imágenes
const K_BRAND = 'stampa_pantalla_marca' // última marca, para no arrancar con colores genéricos

type Phase =
  | { t: 'loading' }
  | { t: 'unlinked' }
  | { t: 'off'; message: string }
  | { t: 'wait' }
  | { t: 'busy' }
  | { t: 'result'; r: ScanResult }
  | { t: 'error'; message: string }

// ─── Colores de la marca ────────────────────────────────────────────────────
// Fondo = color de la tarjeta, texto = el color de texto de la tarjeta. En los
// estados "importantes" (premio, ya sumó hoy) se invierten. Si el color de
// texto o el segundo color no se leen sobre el fondo, se cae a blanco o negro.
interface Theme { bg: string; fg: string; acc: string }
const HEX = /^#[0-9a-fA-F]{6}$/
const hex = (v: string | null | undefined, d: string) => (v && HEX.test(v) ? v : d)

function lum(h: string) {
  const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
export function contrast(a: string, b: string) {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}
const readable = (fg: string, bg: string, min = 4.5) => (contrast(fg, bg) >= min ? fg : contrast('#FFFFFF', bg) >= contrast('#111111', bg) ? '#FFFFFF' : '#111111')

const DEFAULT_THEME: Theme = { bg: '#E6EEE6', fg: '#1D2A1D', acc: '#1D2A1D' }

export function themeFor(card: { color?: string | null; secondColor?: string | null; textColor?: string | null } | null | undefined, inverted: boolean): Theme {
  if (!card) return DEFAULT_THEME
  const color = hex(card.color, '#1E3329')
  const text = readable(hex(card.textColor, '#FFFFFF'), color)
  const second = hex(card.secondColor, color)
  if (!inverted) return { bg: color, fg: text, acc: contrast(second, color) >= 3 ? second : text }
  // Invertido: el segundo color pasa a fondo si se distingue del color; si no, el texto.
  const bg = contrast(second, color) >= 3 ? second : text
  const fg = readable(color, bg)
  return { bg, fg, acc: fg }
}

// ─── Qué se dice en cada estado, según el tipo de tarjeta ───────────────────
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
const hhmm = (iso: string | null | undefined) => iso ? new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }) : ''

export type Block =
  | { k: 'strip'; stamps: number; required: number; fresh: boolean; all?: boolean }
  | { k: 'prize-img'; required: number }
  | { k: 'points'; added: number | null }
  | { k: 'catalog'; title: string; rows: CatalogRow[]; balance: number }
  | { k: 'tier'; tier: TierLook }
  | { k: 'bar'; value: number }
  | { k: 'line'; text: string; strong?: boolean }

export interface View { inverted: boolean; title: string; blocks: Block[] }

export function viewOf(r: ScanResult): View {
  const hi = r.name ? `, ${r.name}` : ''
  const { stamp, points, membership } = r

  if (r.state === 'needs_staff') {
    return { inverted: false, title: `Hola${r.name ? `, ${r.name}` : ''}`, blocks: [{ k: 'line', text: r.message || 'Pedile al empleado que sume tu compra.' }] }
  }

  if (r.state === 'limit') {
    const hours = r.limit?.rule === 'hours'
    const blocks: Block[] = [{ k: 'line', text: hours && r.limit?.nextAt ? `Podés volver a sumar desde las ${hhmm(r.limit.nextAt)}` : 'Volvé mañana' }]
    if (stamp) blocks.push({ k: 'strip', stamps: stamp.stamps, required: stamp.required, fresh: false })
    else if (points) blocks.push({ k: 'line', text: `Tenés ${plural(points.balance, 'punto', 'puntos')}` })
    else if (membership?.tier) blocks.push({ k: 'line', text: `Nivel ${membership.tier.name}` })
    return { inverted: true, title: hours ? 'Sumaste hace poco' : 'Hoy ya sumaste', blocks }
  }

  if (stamp) {
    if (r.state === 'prize') {
      const blocks: Block[] = [{ k: 'prize-img', required: stamp.required }]
      if (stamp.reward) blocks.push({ k: 'line', text: stamp.reward, strong: true })
      return { inverted: true, title: r.card.flipMessage || '¡Felicitaciones!', blocks }
    }
    return {
      inverted: false, title: `¡Sumaste${hi}!`,
      blocks: [
        { k: 'strip', stamps: stamp.stamps, required: stamp.required, fresh: !r.repeat },
        { k: 'line', text: `${stamp.stamps} de ${stamp.required}${stamp.remaining > 0 ? `. Te ${stamp.remaining === 1 ? 'falta 1' : `faltan ${stamp.remaining}`}` : ''}` },
      ],
    }
  }

  if (points) {
    const n = points.unlocked.length
    const balance = { k: 'line', text: `Tenés ${plural(points.balance, 'punto', 'puntos')}` } as const
    if (r.state === 'prize' && n > 0) {
      return { inverted: true, title: n === 1 ? `¡Desbloqueaste ${points.unlocked[0]}!` : `¡Desbloqueaste ${n} premios!`, blocks: [balance, { k: 'catalog', title: 'Para canjear ahora', rows: points.catalog, balance: points.balance }] }
    }
    const blocks: Block[] = [{ k: 'points', added: points.added }, balance]
    if (points.catalog.length) blocks.push({ k: 'catalog', title: 'Premios', rows: points.catalog, balance: points.balance })
    return { inverted: false, title: `¡Sumaste${hi}!`, blocks }
  }

  if (membership) {
    if (r.state === 'tier_up' && membership.tierUp) {
      const blocks: Block[] = [{ k: 'tier', tier: membership.tierUp }]
      if (membership.tierUp.perk) blocks.push({ k: 'line', text: membership.tierUp.perk, strong: true })
      return { inverted: true, title: `¡Subiste a ${membership.tierUp.name}!`, blocks }
    }
    const blocks: Block[] = []
    if (membership.tier) blocks.push({ k: 'tier', tier: membership.tier })
    if (membership.nextTier && membership.progress != null) blocks.push({ k: 'bar', value: membership.progress })
    blocks.push({ k: 'line', text: membership.nextTier && membership.visitsToNext != null ? `Te ${membership.visitsToNext === 1 ? 'falta 1' : `faltan ${membership.visitsToNext}`} para ${membership.nextTier.name}` : 'Ya estás en el nivel más alto' })
    return { inverted: false, title: `Visita ${membership.totalVisits}`, blocks }
  }

  return { inverted: false, title: `¡Sumaste${hi}!`, blocks: [] }
}

export function PantallaApp() {
  const [phase, setPhase] = useState<Phase>({ t: 'loading' })
  const [status, setStatus] = useState<ScreenStatus | null>(null)
  const [brand, setBrand] = useState<BrandCard[]>([])
  const keyRef = useRef<string | null>(null)
  const phaseRef = useRef<Phase>(phase)
  const brandRef = useRef<BrandCard[]>([])
  const lastCode = useRef<{ text: string; at: number } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  phaseRef.current = phase
  brandRef.current = brand

  const goWait = useCallback(() => setPhase(p => (p.t === 'unlinked' || p.t === 'off' ? p : { t: 'wait' })), [])

  // La marca del local (colores, logo, íconos, imagen del premio). Si falla, la
  // pantalla sigue andando con los colores que vengan en cada resultado.
  const loadBrand = useCallback(async () => {
    const key = keyRef.current
    if (!key) return
    try {
      const cards = (await pantalla.brand(key)).cards
      setBrand(cards)
      try { localStorage.setItem(K_BRAND, JSON.stringify(cards)) } catch { /* sin lugar o modo privado: no pasa nada */ }
    } catch { /* se reintenta en el próximo ciclo */ }
  }, [])

  // Estado inicial y cada minuto: si la quitaron, se desvincula; si la
  // desactivaron, lo avisa. Una caída de internet no cambia lo que se ve.
  const refresh = useCallback(async () => {
    const key = keyRef.current
    if (!key) return
    try {
      const s = await pantalla.status(key)
      setStatus(s)
      setPhase(p => !s.active ? { t: 'off', message: s.message || 'La pantalla está desactivada.' } : p.t === 'off' || p.t === 'loading' ? { t: 'wait' } : p)
    } catch (e) {
      if (e instanceof ScreenError && (e.status === 401 || e.code === 'screen_removed')) { setScreen(null); keyRef.current = null; try { localStorage.removeItem(K_BRAND) } catch { /* nada */ } setPhase({ t: 'unlinked' }) }
      else if (phaseRef.current.t === 'loading') setPhase({ t: 'wait' })
    }
  }, [])

  useEffect(() => {
    keyRef.current = getScreen()?.key || null
    if (!keyRef.current) { setPhase({ t: 'unlinked' }); return }
    try { const saved = localStorage.getItem(K_BRAND); if (saved) setBrand(JSON.parse(saved)) } catch { /* se baja de nuevo */ }
    refresh()
    loadBrand()
    const id = setInterval(refresh, STATUS_EVERY_MS)
    const bid = setInterval(loadBrand, BRAND_EVERY_MS)
    const reload = setTimeout(() => { if (phaseRef.current.t === 'wait') window.location.reload() }, RELOAD_AFTER_MS)
    return () => { clearInterval(id); clearInterval(bid); clearTimeout(reload) }
  }, [refresh, loadBrand])

  // Que la pantalla no se apague.
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null
    const ask = async () => { try { lock = await (navigator as any).wakeLock?.request('screen') } catch { /* no todos los navegadores */ } }
    ask()
    const onVisible = () => { if (document.visibilityState === 'visible') ask() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { document.removeEventListener('visibilitychange', onVisible); lock?.release().catch(() => {}) }
  }, [])

  const showFor = useCallback((next: Phase, ms: number) => {
    if (timer.current) clearTimeout(timer.current)
    setPhase(next)
    timer.current = setTimeout(goWait, ms)
  }, [goWait])
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const onCode = useCallback(async (text: string) => {
    const key = keyRef.current
    const now = Date.now()
    if (!key || phaseRef.current.t !== 'wait') return
    if (lastCode.current && lastCode.current.text === text && now - lastCode.current.at < SAME_CODE_MS) return
    lastCode.current = { text, at: now }
    setPhase({ t: 'busy' })
    try {
      const r = await pantalla.scan(key, text)
      beep(r.state === 'ok' || r.state === 'prize' || r.state === 'tier_up')
      // Una tarjeta nueva que todavía no bajamos: trae las imágenes para la próxima.
      if (!brandRef.current.some(c => c.id === r.card.id)) loadBrand()
      showFor({ t: 'result', r }, SHOW_MS)
    } catch (e) {
      beep(false)
      if (e instanceof ScreenError && e.status === 401) { setScreen(null); keyRef.current = null; setPhase({ t: 'unlinked' }); return }
      if (e instanceof ScreenError && e.code === 'screen_off') { refresh(); return }
      showFor({ t: 'error', message: e instanceof ScreenError && e.status > 0 && e.message ? e.message : 'No pudimos leer el pase. Probá de nuevo.' }, ERROR_MS)
    }
  }, [refresh, showFor, loadBrand])

  const v = phase.t === 'result' ? viewOf(phase.r) : null
  const waiting = phase.t === 'wait'
  const first = brand[0] || null
  // La tarjeta del cliente que escaneó; mientras espera, la primera del local.
  const card: BrandCard | (ScanResult['card'] & Partial<BrandCard>) | null = phase.t === 'result' ? (brand.find(c => c.id === phase.r.card.id) || phase.r.card) : first
  const theme = phase.t === 'unlinked' || phase.t === 'off' || phase.t === 'loading' ? DEFAULT_THEME : themeFor(card, !!v?.inverted)
  const brandCard = card as Partial<BrandCard> | null
  const bizName = status?.business.name || getScreen()?.businessName || ''
  const style = { '--bg': theme.bg, '--fg': theme.fg, '--acc': theme.acc } as CSSProperties

  return (
    <div className="pan-root" style={style}>
      <style>{PANTALLA_CSS}</style>

      <header className="pan-top">
        {brandCard?.logoUrl
          ? <img className="pan-logo-img" src={brandCard.logoUrl} alt="" />
          : bizName && phase.t !== 'unlinked' && phase.t !== 'off' && phase.t !== 'loading' ? <span className="pan-logo-dot" aria-hidden>{bizName.trim().charAt(0).toUpperCase()}</span> : null}
        <span className="pan-biz">{bizName}</span>
      </header>

      <main className="pan-main" aria-live="polite">
        {phase.t === 'loading' && <div className="pan-spin" role="status" aria-label="Cargando" />}

        {phase.t === 'unlinked' && (
          <div className="pan-msg">
            <Icon name="pantalla" size={28} />
            <h1>Esta pantalla no está vinculada</h1>
            <p>Pedile al dueño que genere un link en Configuración, Pantallas del local, y abrilo acá.</p>
          </div>
        )}

        {phase.t === 'off' && (
          <div className="pan-msg">
            <Icon name="atencion" size={28} />
            <h1>Pantalla desactivada</h1>
            <p>{phase.message}</p>
          </div>
        )}

        {/* La cámara queda prendida siempre (arrancarla tarda); solo se esconde
            mientras se muestra un resultado. */}
        {phase.t !== 'unlinked' && phase.t !== 'off' && (
          <div className="pan-msg" style={waiting || phase.t === 'busy' ? undefined : { display: 'none' }}>
            <PantallaCamara active={waiting} onCode={onCode} />
            <h1>{phase.t === 'busy' ? 'Leyendo tu pase' : 'Acercá tu pase'}</h1>
            {phase.t === 'busy' && <div className="pan-bar pan-load"><i /></div>}
          </div>
        )}

        {v && phase.t === 'result' && <Resultado v={v} brand={brandCard} fresh={!phase.r.repeat} />}

        {phase.t === 'error' && (
          <div className="pan-msg">
            <Icon name="atencion" size={28} className="pan-big-icon" />
            <h1>No pudimos sumar</h1>
            <p>{phase.message}</p>
          </div>
        )}
      </main>

      <footer className="pan-foot">con Stampa</footer>
    </div>
  )
}

// ─── Resultado ──────────────────────────────────────────────────────────────
export function Resultado({ v, brand, fresh }: { v: View; brand: Partial<BrandCard> | null; fresh: boolean }) {
  return (
    <div className="pan-msg pan-result">
      <h1>{v.title}</h1>
      {v.blocks.map((b, i) => <BlockView key={i} b={b} brand={brand} fresh={fresh} />)}
    </div>
  )
}

function BlockView({ b, brand, fresh }: { b: Block; brand: Partial<BrandCard> | null; fresh: boolean }) {
  switch (b.k) {
    case 'strip': return <Strip n={b.stamps} required={b.required} fresh={b.fresh && fresh} all={b.all} brand={brand} />
    case 'prize-img':
      return brand?.flipImageUrl ? <div className="pan-prz"><img src={brand.flipImageUrl} alt="" /></div> : <Strip n={b.required} required={b.required} fresh={false} all brand={brand} />
    case 'points':
      return (
        <div className="pan-pts">
          {brand?.pointsIcon && <img src={brand.pointsIcon} alt="" />}
          <span className="pan-big">{b.added != null ? `+${b.added}` : ''}</span>
        </div>
      )
    case 'catalog':
      return (
        <div className="pan-cat">
          <h2>{b.title}</h2>
          {b.rows.map(row => (
            <div key={row.name} className={row.unlocked ? 'is-new' : row.affordable ? 'is-ok' : ''}>
              {row.name}<span>{row.affordable ? 'Para canjear' : `Faltan ${row.pointsCost - b.balance}`}</span>
            </div>
          ))}
        </div>
      )
    case 'tier': return <Tier t={b.tier} />
    case 'bar': return <div className="pan-bar"><i style={{ width: `${Math.round(Math.min(1, Math.max(0, b.value)) * 100)}%` }} /></div>
    case 'line': return <p className={b.strong ? 'pan-line1' : undefined}>{b.text}</p>
  }
}

// Insignia del nivel con los colores que el negocio le puso (texto y fondo).
// El fondo suele ser translúcido, así que se apoya sobre un fondo claro.
function Tier({ t }: { t: TierLook }) {
  const col = hex(t.color, '#2B2620')
  const bg = t.bg || 'rgba(43,38,32,.08)'
  return (
    <span className="pan-tier" style={{ color: col, background: `linear-gradient(${bg},${bg}), #fff` }}>
      {t.icon && <img src={t.icon} alt="" />}
      {t.name}
    </span>
  )
}

// Tira de sellos con los íconos del negocio (sello lleno / vacío).
function Strip({ n, required, fresh, all, brand }: { n: number; required: number; fresh: boolean; all?: boolean; brand: Partial<BrandCard> | null }) {
  const total = required
  const done = all ? total : n
  const cols = total <= 8 ? 4 : total <= 10 ? 5 : 6
  return (
    <div className="pan-strip" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: total }, (_, i) => {
        const on = i < done
        const isNew = fresh && on && i === done - 1
        const cls = `${on ? 'on' : ''}${isNew ? ' new' : ''}`
        if (on && brand?.earnedIcon) return <span key={i} className={`has-icon ${cls}`}><img src={brand.earnedIcon} alt="" /></span>
        if (!on && brand?.emptyIcon) return <span key={i} className="has-icon off"><img src={brand.emptyIcon} alt="" /></span>
        return <span key={i} className={cls}>{on && <Check />}</span>
      })}
    </div>
  )
}
const Check = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>

// ─── Cámara ─────────────────────────────────────────────────────────────────
// Cámara delantera (la que mira al cliente), en un visor cuadrado con las
// esquinas marcadas, para que se vea y se acomode. Se carga recién en el
// navegador. Lee sin parar mientras `active`; si no se puede usar la cámara,
// lo dice.
type QrScannerLike = { start(): Promise<void>; destroy(): void }

function PantallaCamara({ active, onCode }: { active: boolean; onCode: (text: string) => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const scanner = useRef<QrScannerLike | null>(null)
  const activeRef = useRef(active)
  const onCodeRef = useRef(onCode)
  const [state, setState] = useState<'starting' | 'on' | 'denied' | 'none'>('starting')
  activeRef.current = active
  onCodeRef.current = onCode

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const QrScanner = (await import('qr-scanner')).default
      if (cancelled || !video.current) return
      if (!(await QrScanner.hasCamera())) { setState('none'); return }
      const s = new QrScanner(video.current, r => { if (activeRef.current) onCodeRef.current(r.data) }, {
        returnDetailedScanResult: true, preferredCamera: 'user', maxScansPerSecond: 6, highlightScanRegion: false, highlightCodeOutline: false,
      })
      scanner.current = s as unknown as QrScannerLike
      try { await s.start(); if (!cancelled) setState('on') } catch { if (!cancelled) setState('denied') }
    })()
    return () => { cancelled = true; scanner.current?.destroy(); scanner.current = null }
  }, [])

  return (
    <div className="pan-cam">
      <i /><i /><i /><i />
      <div className="pan-cam-in">
        <video ref={video} muted playsInline />
        {state === 'starting' && <span className="pan-cam-msg">Prendiendo la cámara...</span>}
        {state === 'denied' && <span className="pan-cam-msg">Permití la cámara en el navegador y recargá la página.</span>}
        {state === 'none' && <span className="pan-cam-msg">Este dispositivo no tiene cámara.</span>}
      </div>
    </div>
  )
}

export const PANTALLA_CSS = `
.pan-root{min-height:100dvh;display:flex;flex-direction:column;background:var(--bg);color:var(--fg);font-family:var(--font-body,system-ui);-webkit-text-size-adjust:100%;user-select:none;transition:background .25s,color .25s}
.pan-root *{box-sizing:border-box}
.pan-top{display:flex;flex-direction:column;align-items:center;gap:10px;padding:calc(env(safe-area-inset-top,0px) + clamp(18px,4vh,36px)) 24px 0;min-height:24px}
.pan-biz{font-family:var(--font-display);font-size:clamp(22px,3.2vw,34px);font-weight:700;letter-spacing:-.3px}
.pan-logo-img{max-width:min(220px,50vw);max-height:clamp(52px,9vh,84px);object-fit:contain}
.pan-logo-dot{width:clamp(52px,8vw,76px);aspect-ratio:1;border-radius:50%;background:var(--fg);color:var(--bg);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:800;font-size:clamp(24px,3.6vw,34px)}
.pan-main{flex:1;display:flex;align-items:center;justify-content:center;padding:20px 24px}
.pan-msg{display:flex;flex-direction:column;align-items:center;text-align:center;gap:clamp(16px,3.2vh,30px);max-width:640px;width:100%}
.pan-msg h1{font-family:var(--font-display);font-size:clamp(32px,5.2vw,58px);font-weight:800;line-height:1.08;margin:0;letter-spacing:-.8px}
.pan-msg p{font-size:clamp(18px,2.4vw,26px);line-height:1.35;margin:0;opacity:.9}
.pan-msg p.pan-line1{font-weight:700;opacity:1}
.pan-big-icon{width:clamp(64px,10vw,110px)!important;height:clamp(64px,10vw,110px)!important}
.pan-msg svg{flex:none}
.pan-foot{text-align:center;font-size:13px;letter-spacing:.4px;opacity:.55;padding:0 0 calc(env(safe-area-inset-bottom,0px) + 14px)}

.pan-cam{position:relative;width:clamp(190px,32vmin,300px);aspect-ratio:1;color:var(--fg)}
.pan-cam>i{position:absolute;width:18%;height:18%;border:7px solid currentColor;z-index:1}
.pan-cam>i:nth-child(1){top:0;left:0;border-right:0;border-bottom:0;border-radius:20px 0 0 0}
.pan-cam>i:nth-child(2){top:0;right:0;border-left:0;border-bottom:0;border-radius:0 20px 0 0}
.pan-cam>i:nth-child(3){bottom:0;left:0;border-right:0;border-top:0;border-radius:0 0 0 20px}
.pan-cam>i:nth-child(4){bottom:0;right:0;border-left:0;border-top:0;border-radius:0 0 20px 0}
.pan-cam-in{position:absolute;inset:9%;border-radius:12px;overflow:hidden;background:color-mix(in srgb,var(--fg) 12%,transparent);display:flex;align-items:center;justify-content:center}
.pan-cam video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform:scaleX(-1)}
.pan-cam-msg{position:relative;padding:12px;font-size:14px;text-align:center;opacity:.85}

.pan-strip{display:grid;gap:clamp(10px,2vw,20px);width:min(460px,88vw)}
.pan-strip span{aspect-ratio:1;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px dashed color-mix(in srgb,var(--fg) 45%,transparent);color:var(--bg)}
.pan-strip span svg{width:56%;height:56%}
.pan-strip span.on{background:var(--fg);border:3px solid var(--fg)}
.pan-strip span.new{box-shadow:0 0 0 6px color-mix(in srgb,var(--acc) 40%,transparent);animation:pan-pop .7s ease-out}
.pan-strip span.has-icon{border:0;background:color-mix(in srgb,var(--fg) 14%,transparent)}
.pan-strip span.has-icon.on{background:color-mix(in srgb,var(--fg) 14%,transparent)}
.pan-strip span.has-icon.off{opacity:.45}
.pan-strip span.has-icon img{width:78%;height:78%;object-fit:contain}
@keyframes pan-pop{0%{transform:scale(.3)}60%{transform:scale(1.18)}100%{transform:scale(1)}}

.pan-prz{width:clamp(200px,36vmin,340px);aspect-ratio:1;border-radius:28px;overflow:hidden;background:color-mix(in srgb,var(--fg) 14%,transparent);display:flex;align-items:center;justify-content:center;animation:pan-pop .6s ease-out}
.pan-prz img{width:100%;height:100%;object-fit:contain}
.pan-pts{display:flex;align-items:center;gap:16px;animation:pan-pop .6s ease-out}
.pan-pts img{width:clamp(48px,8vw,84px);height:clamp(48px,8vw,84px);object-fit:contain}
.pan-big{font-family:var(--font-display);font-size:clamp(80px,14vw,140px);font-weight:800;line-height:1}
.pan-cat{width:min(500px,88vw);display:flex;flex-direction:column;gap:10px;text-align:left}
.pan-cat h2{font-family:var(--font-display);font-size:clamp(16px,2vw,20px);font-weight:700;margin:0 0 2px;opacity:.75;letter-spacing:.3px}
.pan-cat div{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 18px;border-radius:16px;background:color-mix(in srgb,var(--fg) 13%,transparent);font-weight:600;font-size:clamp(17px,2.2vw,22px)}
.pan-cat div span{font-weight:500;font-size:.8em;opacity:.85;white-space:nowrap}
.pan-cat div.is-ok{background:var(--fg);color:var(--bg)}
.pan-cat div.is-new{background:var(--fg);color:var(--bg);box-shadow:0 0 0 5px color-mix(in srgb,var(--acc) 35%,transparent);animation:pan-pop .6s ease-out}
.pan-tier{display:inline-flex;align-items:center;gap:10px;padding:10px 26px;border-radius:99px;font-family:var(--font-display);font-weight:800;font-size:clamp(24px,3.4vw,36px)}
.pan-tier img{width:1.1em;height:1.1em;object-fit:contain}
.pan-bar{width:min(440px,86vw);height:16px;border-radius:99px;background:color-mix(in srgb,var(--fg) 22%,transparent);overflow:hidden}
.pan-bar i{display:block;height:100%;background:var(--fg);border-radius:99px;transition:width .8s}
.pan-load i{width:40%;animation:pan-load 1s ease-in-out infinite}
@keyframes pan-load{0%{margin-left:-40%}100%{margin-left:100%}}
.pan-spin{width:40px;height:40px;border-radius:50%;border:4px solid color-mix(in srgb,var(--fg) 20%,transparent);border-top-color:var(--fg);animation:pan-spin .8s linear infinite}
@keyframes pan-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.pan-root *{animation:none!important;transition:none!important}}
`
