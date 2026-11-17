'use client'
// Pantalla Stampa (/pantalla): una tablet o un celular fijo en el mostrador,
// con la cámara mirando al cliente. Lee el QR del pase y suma sin empleado.
// Todo lo decide el backend (/api/screen/scan): acá solo se dibuja el resultado
// según el tipo de tarjeta (sellos, puntos o niveles).
//
// Pensada para quedarse prendida todo el día: pide que la pantalla no se
// apague, vuelve a consultar al backend cada minuto (se entera si el dueño la
// desactivó o la quitó) y se recarga sola de vez en cuando.
import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon, type IconName } from '@/components/ui/Icon'
import { beep } from '@/lib/escaner'
import { getScreen, setScreen, pantalla, ScreenError, type ScanResult, type ScreenStatus } from '@/lib/pantalla'

const SHOW_MS = 4500       // cuánto se ve el resultado
const ERROR_MS = 3500
const SAME_CODE_MS = 3000  // el mismo QR apenas leído no se vuelve a procesar
const STATUS_EVERY_MS = 60 * 1000
const RELOAD_AFTER_MS = 12 * 60 * 60 * 1000

type Phase =
  | { t: 'loading' }
  | { t: 'unlinked' }
  | { t: 'off'; message: string }
  | { t: 'wait' }
  | { t: 'busy' }
  | { t: 'result'; r: ScanResult }
  | { t: 'error'; message: string }

// ─── Qué se dice en cada estado, según el tipo de tarjeta ───────────────────
interface View { tone: 'ok' | 'warn' | 'prize' | 'info'; icon: IconName; title: string; lines: string[]; bar?: number }

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
const hhmm = (iso: string | null | undefined) => iso ? new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }) : ''

export function viewOf(r: ScanResult): View {
  const hi = r.name ? `, ${r.name}` : ''
  const { stamp, points, membership } = r

  if (r.state === 'needs_staff') {
    return { tone: 'info', icon: 'escanear', title: `Hola${hi}`, lines: [r.message || 'Pedile al empleado que sume tu compra.'] }
  }

  if (r.state === 'limit') {
    const hours = r.limit?.rule === 'hours'
    const where = stamp ? [`${stamp.stamps} de ${stamp.required} sellos`]
      : points ? [`Tenés ${plural(points.balance, 'punto', 'puntos')}`]
      : membership?.tier ? [`Nivel ${membership.tier.name}`] : []
    return {
      tone: 'warn', icon: 'hora',
      title: hours ? 'Sumaste hace poco' : 'Hoy ya sumaste',
      lines: [hours && r.limit?.nextAt ? `Podés volver a sumar desde las ${hhmm(r.limit.nextAt)}` : 'Volvé mañana', ...where],
      bar: stamp ? stamp.stamps / stamp.required : undefined,
    }
  }

  if (stamp) {
    if (r.state === 'prize') {
      return { tone: 'prize', icon: 'premios', title: stamp.completed && r.message ? 'Ya completaste la tarjeta' : '¡Completaste la tarjeta!', lines: [stamp.reward ? `${stamp.reward}. Pedilo en la caja` : 'Pedí tu premio en la caja'], bar: 1 }
    }
    return { tone: 'ok', icon: 'hecho', title: `¡Sumaste${hi}!`, lines: [`${stamp.stamps} de ${stamp.required} sellos`, stamp.remaining > 0 ? `Te ${stamp.remaining === 1 ? 'falta 1' : `faltan ${stamp.remaining}`}` : ''], bar: stamp.stamps / stamp.required }
  }

  if (points) {
    if (r.state === 'prize' && points.redeem) {
      return { tone: 'prize', icon: 'premios', title: 'Ya podés canjear', lines: [`${points.redeem.name} por ${plural(points.redeem.pointsCost, 'punto', 'puntos')}. Pedilo en la caja`, `Tenés ${plural(points.balance, 'punto', 'puntos')}`] }
    }
    return { tone: 'ok', icon: 'hecho', title: points.added != null ? `+${plural(points.added, 'punto', 'puntos')}` : `¡Sumaste${hi}!`, lines: [`Tenés ${plural(points.balance, 'punto', 'puntos')}`] }
  }

  if (membership) {
    if (r.state === 'tier_up' && membership.tierUp) {
      return { tone: 'prize', icon: 'nivel', title: `¡Subiste a ${membership.tierUp.name}!`, lines: [membership.tierUp.perk ? `${membership.tierUp.perk}. Mostrá tu pase en la caja` : 'Mostrá tu pase en la caja'] }
    }
    const next = membership.nextTier && membership.visitsToNext != null ? `Te ${membership.visitsToNext === 1 ? 'falta 1' : `faltan ${membership.visitsToNext}`} para ${membership.nextTier.name}` : 'Ya estás en el nivel más alto'
    return { tone: 'ok', icon: 'hecho', title: `Visita ${membership.totalVisits}`, lines: [membership.tier ? `Nivel ${membership.tier.name}` : '', next] }
  }

  return { tone: 'ok', icon: 'hecho', title: `¡Sumaste${hi}!`, lines: [] }
}

export function PantallaApp() {
  const [phase, setPhase] = useState<Phase>({ t: 'loading' })
  const [status, setStatus] = useState<ScreenStatus | null>(null)
  const keyRef = useRef<string | null>(null)
  const phaseRef = useRef<Phase>(phase)
  const lastCode = useRef<{ text: string; at: number } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  phaseRef.current = phase

  const goWait = useCallback(() => setPhase(p => (p.t === 'unlinked' || p.t === 'off' ? p : { t: 'wait' })), [])

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
      if (e instanceof ScreenError && (e.status === 401 || e.code === 'screen_removed')) { setScreen(null); keyRef.current = null; setPhase({ t: 'unlinked' }) }
      else if (phaseRef.current.t === 'loading') setPhase({ t: 'wait' })
    }
  }, [])

  useEffect(() => {
    keyRef.current = getScreen()?.key || null
    if (!keyRef.current) { setPhase({ t: 'unlinked' }); return }
    refresh()
    const id = setInterval(refresh, STATUS_EVERY_MS)
    const reload = setTimeout(() => { if (phaseRef.current.t === 'wait') window.location.reload() }, RELOAD_AFTER_MS)
    return () => { clearInterval(id); clearTimeout(reload) }
  }, [refresh])

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
      showFor({ t: 'result', r }, SHOW_MS)
    } catch (e) {
      beep(false)
      if (e instanceof ScreenError && e.status === 401) { setScreen(null); keyRef.current = null; setPhase({ t: 'unlinked' }); return }
      if (e instanceof ScreenError && e.code === 'screen_off') { refresh(); return }
      showFor({ t: 'error', message: e instanceof ScreenError && e.status > 0 && e.message ? e.message : 'No pudimos leer el pase. Probá de nuevo.' }, ERROR_MS)
    }
  }, [refresh, showFor])

  const v = phase.t === 'result' ? viewOf(phase.r) : null
  const waiting = phase.t === 'wait'

  return (
    <div className="pan-root">
      <style>{PANTALLA_CSS}</style>

      <header className="pan-top">
        <span className="pan-biz">{status?.business.name || getScreen()?.businessName || ''}</span>
      </header>

      <main className={`pan-main${v ? ` pan-${v.tone}` : phase.t === 'error' ? ' pan-warn' : ''}`} aria-live="polite">
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
            <div className="pan-cam-wrap">
              <PantallaCamara active={waiting} onCode={onCode} />
            </div>
            <h1>{phase.t === 'busy' ? 'Leyendo tu pase...' : 'Acercá tu pase'}</h1>
            <p>Abrilo en tu Wallet y mostralo a la cámara</p>
          </div>
        )}

        {v && <Resultado v={v} />}

        {phase.t === 'error' && (
          <div className="pan-msg">
            <Icon name="atencion" size={28} className="pan-big-icon" />
            <h1>No pudimos sumar</h1>
            <p>{phase.message}</p>
          </div>
        )}
      </main>
    </div>
  )
}

function Resultado({ v }: { v: View }) {
  return (
    <div className="pan-msg pan-result">
      <Icon name={v.icon} size={28} className="pan-big-icon" />
      <h1>{v.title}</h1>
      {v.bar != null && <div className="pan-bar"><i style={{ width: `${Math.round(Math.min(1, v.bar) * 100)}%` }} /></div>}
      {v.lines.filter(Boolean).map((l, i) => <p key={i} className={i === 0 ? 'pan-line1' : undefined}>{l}</p>)}
    </div>
  )
}

// ─── Cámara ─────────────────────────────────────────────────────────────────
// Cámara delantera (la que mira al cliente), con un recuadro chico para que se
// vea y se acomode. Se carga recién en el navegador. Lee sin parar mientras
// `active`; si no se puede usar la cámara, lo dice.
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
      <video ref={video} muted playsInline />
      {state === 'starting' && <span className="pan-cam-msg">Prendiendo la cámara...</span>}
      {state === 'denied' && <span className="pan-cam-msg">Permití la cámara en el navegador y recargá la página.</span>}
      {state === 'none' && <span className="pan-cam-msg">Este dispositivo no tiene cámara.</span>}
    </div>
  )
}

export const PANTALLA_CSS = `
.pan-root{min-height:100dvh;display:flex;flex-direction:column;background:var(--s-salvia);color:var(--s-tinta);font-family:var(--font-body,system-ui);-webkit-text-size-adjust:100%;user-select:none}
.pan-root *{box-sizing:border-box}
.pan-top{display:flex;justify-content:center;padding:calc(env(safe-area-inset-top,0px) + 20px) 24px 0}
.pan-biz{font-family:var(--font-display);font-size:20px;font-weight:700;color:var(--s-tinta-2)}
.pan-main{flex:1;display:flex;align-items:center;justify-content:center;padding:24px;transition:background .2s}
.pan-ok{background:var(--s-listo-suave)}
.pan-warn{background:var(--s-aviso-suave)}
.pan-prize{background:var(--s-brasa-suave)}
.pan-info{background:var(--s-info-suave)}
.pan-msg{display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px;max-width:640px;width:100%}
.pan-msg h1{font-family:var(--font-display);font-size:clamp(34px,6vw,64px);font-weight:800;line-height:1.1;margin:0;color:var(--s-tinta)}
.pan-msg p{font-size:clamp(18px,2.6vw,28px);line-height:1.4;margin:0;color:var(--s-tinta-2)}
.pan-msg p.pan-line1{color:var(--s-tinta);font-weight:600}
.pan-big-icon{width:clamp(64px,10vw,110px)!important;height:clamp(64px,10vw,110px)!important}
.pan-ok .pan-big-icon{color:var(--s-listo)}
.pan-warn .pan-big-icon{color:var(--s-aviso)}
.pan-prize .pan-big-icon{color:var(--s-brasa-2)}
.pan-info .pan-big-icon{color:var(--s-info)}
.pan-msg svg{flex:none}
.pan-bar{width:min(420px,80%);height:12px;border-radius:999px;background:var(--s-linea);overflow:hidden}
.pan-bar i{display:block;height:100%;background:var(--s-listo);border-radius:999px;transition:width .6s}
.pan-prize .pan-bar i{background:var(--s-brasa)}
.pan-warn .pan-bar i{background:var(--s-aviso)}
.pan-cam-wrap{margin-bottom:6px}
.pan-cam{position:relative;width:clamp(160px,26vw,260px);aspect-ratio:1;border-radius:50%;overflow:hidden;border:3px dashed var(--s-tinta-3);background:var(--s-hueco);display:flex;align-items:center;justify-content:center}
.pan-cam video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform:scaleX(-1)}
.pan-cam-msg{position:relative;padding:16px;font-size:14px;color:var(--s-tinta-2);text-align:center}
.pan-spin{width:40px;height:40px;border-radius:50%;border:4px solid var(--s-linea);border-top-color:var(--s-brasa);animation:pan-spin .8s linear infinite}
@keyframes pan-spin{to{transform:rotate(360deg)}}
`
