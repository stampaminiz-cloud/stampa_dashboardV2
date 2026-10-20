'use client'
// Selector de color de la tarjeta (fondo, texto, etiquetas). Un botón con el
// color actual que abre un panel con: los colores del logo, la paleta
// sugerida y un selector libre (cuadro + barra de tono). Color libre en todos
// los planes. Si se pasa `contrastWith`, avisa cuando el texto no se va a leer.
import { Icon } from '@/components/ui/Icon'
import { useEffect, useRef, useState } from 'react'

const isHex = (v?: string | null) => !!v && /^#[0-9A-Fa-f]{6}$/.test(v)

// ─── Contraste (WCAG) ─────────────────────────────────────────────────────────
function luminance(hex: string) {
  const c = hex.replace('#', '')
  const ch = (i: number) => { const v = parseInt(c.slice(i, i + 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
  return 0.2126 * ch(0) + 0.7152 * ch(2) + 0.0722 * ch(4)
}
export function contrastRatio(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}

// El logo casi no se ve sobre ese fondo: su color principal (el que más
// aparece) casi no contrasta. Los acentos chicos no alcanzan para leerlo.
export function logoFadesOn(logoColors: string[], bg: string) {
  return logoColors.length > 0 && isHex(bg) && contrastRatio(logoColors[0], bg) < 2
}

// ─── HSV ↔ hex ────────────────────────────────────────────────────────────────
function hexToHsv(hex: string) {
  const c = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map(i => parseInt(c.slice(i, i + 2), 16) / 255)
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  let h = 0
  if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return { h: (h * 60 + 360) % 360, s: max ? d / max : 0, v: max }
}
function hsvToHex(h: number, s: number, v: number) {
  const f = (n: number) => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)) }
  return '#' + [f(5), f(3), f(1)].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('').toUpperCase()
}

// ─── Colores del logo ─────────────────────────────────────────────────────────
// Los colores que más aparecen en el logo (sin lo transparente), distintos
// entre sí. Se calcula en el navegador con una copia chica de la imagen.
const logoCache = new Map<string, string[]>()
export function useLogoColors(src?: string | null) {
  const [colors, setColors] = useState<string[]>(() => (src && logoCache.get(src)) || [])
  useEffect(() => {
    if (!src) { setColors([]); return }
    const hit = logoCache.get(src)
    if (hit) { setColors(hit); return }
    let cancelled = false
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const S = 64, cv = document.createElement('canvas'); cv.width = S; cv.height = S
        const ctx = cv.getContext('2d', { willReadFrequently: true })!
        const k = Math.min(S / img.width, S / img.height)
        ctx.drawImage(img, 0, 0, Math.max(1, img.width * k), Math.max(1, img.height * k))
        const px = ctx.getImageData(0, 0, S, S).data
        const buckets = new Map<string, { n: number; r: number; g: number; b: number }>()
        for (let i = 0; i < px.length; i += 4) {
          if (px[i + 3] < 160) continue
          const key = `${px[i] >> 4}-${px[i + 1] >> 4}-${px[i + 2] >> 4}`
          const e = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 }
          e.n++; e.r += px[i]; e.g += px[i + 1]; e.b += px[i + 2]
          buckets.set(key, e)
        }
        const out: number[][] = []
        for (const e of [...buckets.values()].sort((a, b) => b.n - a.n)) {
          const c = [e.r / e.n, e.g / e.n, e.b / e.n]
          if (out.every(o => Math.hypot(o[0] - c[0], o[1] - c[1], o[2] - c[2]) > 56)) out.push(c)
          if (out.length >= 6) break
        }
        const hexes = out.map(c => '#' + c.map(x => Math.round(x).toString(16).padStart(2, '0')).join('').toUpperCase())
        logoCache.set(src, hexes)
        if (!cancelled) setColors(hexes)
      } catch { if (!cancelled) setColors([]) }
    }
    img.onerror = () => { if (!cancelled) setColors([]) }
    img.src = src
    return () => { cancelled = true }
  }, [src])
  return colors
}

// ─── Selector libre ───────────────────────────────────────────────────────────
function FreePicker({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const [hsv, setHsv] = useState(() => hexToHsv(isHex(value) ? value : '#1B412F'))
  const [hexText, setHexText] = useState(isHex(value) ? value.toUpperCase() : '')
  // Si el color cambia desde afuera (un sugerido), se mueve el cursor.
  const last = useRef(value)
  useEffect(() => {
    if (value === last.current || !isHex(value)) return
    last.current = value; setHsv(hexToHsv(value)); setHexText(value.toUpperCase())
  }, [value])
  function emit(h: number, s: number, v: number) {
    setHsv({ h, s, v })
    const hex = hsvToHex(h, s, v)
    last.current = hex; setHexText(hex); onChange(hex)
  }
  function drag(e: React.PointerEvent<HTMLDivElement>, fn: (x: number, y: number) => void) {
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    const move = (ev: PointerEvent | React.PointerEvent) => {
      const r = el.getBoundingClientRect()
      fn(Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (ev.clientY - r.top) / r.height)))
    }
    move(e)
    const up = () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up) }
    el.addEventListener('pointermove', move); el.addEventListener('pointerup', up)
  }
  return (
    <div className="cf-free">
      <div className="cf-sv" style={{ background: `hsl(${hsv.h} 100% 50%)` }}
        onPointerDown={e => drag(e, (x, y) => emit(hsv.h, x, 1 - y))}
        role="slider" aria-label="Saturación y brillo" aria-valuenow={Math.round(hsv.s * 100)} tabIndex={0}
        onKeyDown={e => {
          const st = e.shiftKey ? 0.1 : 0.02
          if (e.key === 'ArrowRight') emit(hsv.h, Math.min(1, hsv.s + st), hsv.v)
          else if (e.key === 'ArrowLeft') emit(hsv.h, Math.max(0, hsv.s - st), hsv.v)
          else if (e.key === 'ArrowUp') emit(hsv.h, hsv.s, Math.min(1, hsv.v + st))
          else if (e.key === 'ArrowDown') emit(hsv.h, hsv.s, Math.max(0, hsv.v - st))
          else return
          e.preventDefault()
        }}>
        <div className="cf-sv-white" /><div className="cf-sv-black" />
        <div className="cf-sv-dot" style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: hsvToHex(hsv.h, hsv.s, hsv.v) }} />
      </div>
      <div className="cf-hue" onPointerDown={e => drag(e, x => emit(x * 360, hsv.s, hsv.v))}
        role="slider" aria-label="Tono" aria-valuemin={0} aria-valuemax={360} aria-valuenow={Math.round(hsv.h)} tabIndex={0}
        onKeyDown={e => {
          if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
          e.preventDefault(); emit((hsv.h + (e.key === 'ArrowRight' ? 1 : -1) * (e.shiftKey ? 20 : 4) + 360) % 360, hsv.s, hsv.v)
        }}>
        <div className="cf-hue-dot" style={{ left: `${(hsv.h / 360) * 100}%`, background: `hsl(${hsv.h} 100% 50%)` }} />
      </div>
      <label className="cf-hex">
        <span>Código</span>
        <input value={hexText} maxLength={7} spellCheck={false} placeholder="#1B412F"
          onChange={e => {
            let v = e.target.value.toUpperCase().replace(/[^#0-9A-F]/g, '')
            if (v && !v.startsWith('#')) v = '#' + v
            setHexText(v)
            if (isHex(v)) { last.current = v; setHsv(hexToHsv(v)); onChange(v) }
          }} />
      </label>
    </div>
  )
}

// ─── Campo ────────────────────────────────────────────────────────────────────
export function ColorField({ value, onChange, suggestions, logoColors = [], auto = false, autoLabel = 'Automático', contrastWith, ariaLabel }: {
  value: string | null
  onChange: (hex: string | null) => void
  suggestions: { hex: string; label?: string }[]
  logoColors?: string[]
  auto?: boolean
  autoLabel?: string
  contrastWith?: string | null
  ariaLabel: string
}) {
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const out = (e: PointerEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', out); document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('pointerdown', out); document.removeEventListener('keydown', esc) }
  }, [open])

  const cur = value && isHex(value) ? value.toUpperCase() : null
  const low = !!cur && isHex(contrastWith) && contrastRatio(cur, contrastWith!) < 3
  const Swatch = ({ hex, label }: { hex: string; label?: string }) => (
    <button type="button" className={`cf-dot${cur === hex.toUpperCase() ? ' cf-dot--on' : ''}`} style={{ background: hex }}
      title={label ? `${label} · ${hex.toUpperCase()}` : hex.toUpperCase()} aria-label={label || hex} onClick={() => onChange(hex.toUpperCase())} />
  )

  return (
    <div className="cf" ref={wrap}>
      <style>{CSS}</style>
      <button type="button" className={`cf-btn${open ? ' cf-btn--open' : ''}`} onClick={() => setOpen(o => !o)} aria-expanded={open} aria-label={ariaLabel}>
        <span className={`cf-btn-sw${cur ? '' : ' cf-btn-sw--auto'}`} style={cur ? { background: cur } : undefined}>{cur ? '' : 'A'}</span>
        <span className="cf-btn-txt">{cur || autoLabel}</span>
        <span style={{ display: 'inline-flex', transform: open ? 'rotate(180deg)' : undefined, transition: 'transform .15s' }}><Icon name="abrir" size={14} /></span>
      </button>
      {low && <div className="cf-warn">Con este fondo se va a leer mal. Probá un color más claro u oscuro.</div>}

      {open && (
        <div className="cf-pop" role="dialog" aria-label={ariaLabel}>
          {auto && (
            <button type="button" className={`cf-auto${cur ? '' : ' cf-auto--on'}`} onClick={() => onChange(null)}>
              <span className="cf-btn-sw cf-btn-sw--auto">A</span>{autoLabel}
            </button>
          )}
          {logoColors.length > 0 && (<>
            <div className="cf-sec">De tu logo</div>
            <div className="cf-row">{logoColors.map(h => <Swatch key={h} hex={h} />)}</div>
          </>)}
          <div className="cf-sec">Sugeridos</div>
          <div className="cf-row">{suggestions.map(s => <Swatch key={s.hex} hex={s.hex} label={s.label} />)}</div>
          <div className="cf-sec">Cualquier color</div>
          <FreePicker value={cur || '#FFFFFF'} onChange={onChange} />
          {isHex(contrastWith) && cur && (
            <div className={`cf-sample${low ? ' cf-sample--bad' : ''}`} style={{ background: contrastWith!, color: cur }}>
              <strong>Aa</strong> Así se lee sobre el fondo{low ? ' · poco contraste' : ''}
            </div>
          )}
          <button type="button" className="cf-done" onClick={() => setOpen(false)}>Listo</button>
        </div>
      )}
    </div>
  )
}

const CSS = `
  .cf{position:relative;}
  .cf-btn{display:inline-flex;align-items:center;gap:9px;padding:5px 10px 5px 5px;border:1.5px solid rgba(34,32,27,.14);border-radius:10px;background:#fff;cursor:pointer;font-family:inherit;color:rgba(34,32,27,.6);min-width:150px;}
  .cf-btn:hover,.cf-btn--open{border-color:rgba(34,32,27,.32);}
  .cf-btn-sw{width:26px;height:26px;border-radius:7px;box-shadow:inset 0 0 0 1px rgba(34,32,27,.15);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;}
  .cf-btn-sw--auto{background:repeating-linear-gradient(45deg,#fff 0 4px,#F1ECE3 4px 8px);color:rgba(34,32,27,.55);}
  .cf-btn-txt{flex:1;text-align:left;font-size:12.5px;font-weight:600;color:var(--s-tinta);font-variant-numeric:tabular-nums;}
  .cf-warn{font-size:11px;color:#8E5A12;background:rgba(212,162,76,.14);border-radius:8px;padding:6px 9px;margin-top:6px;line-height:1.4;}
  .cf-pop{position:absolute;z-index:40;top:calc(100% + 6px);left:0;width:264px;max-width:calc(100vw - 32px);background:#fff;border:1px solid rgba(34,32,27,.12);border-radius:14px;box-shadow:0 14px 40px rgba(34,32,27,.18);padding:12px;box-sizing:border-box;}
  .cf-sec{font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:rgba(34,32,27,.45);margin:10px 0 6px;}
  .cf-sec:first-child{margin-top:0;}
  .cf-row{display:grid;grid-template-columns:repeat(8,1fr);gap:6px;}
  .cf-dot{aspect-ratio:1;border-radius:50%;border:none;cursor:pointer;padding:0;box-shadow:inset 0 0 0 1px rgba(34,32,27,.15);transition:transform .1s;}
  .cf-dot:hover{transform:scale(1.12);}
  .cf-dot--on{box-shadow:0 0 0 2px #fff,0 0 0 4px var(--s-brasa);}
  .cf-auto{display:flex;align-items:center;gap:8px;width:100%;border:1.5px solid rgba(34,32,27,.12);border-radius:9px;background:#fff;padding:5px;font-size:12px;font-weight:600;color:var(--s-tinta);cursor:pointer;font-family:inherit;margin-bottom:4px;}
  .cf-auto--on{border-color:var(--s-brasa);background:rgba(199,93,58,.05);}
  .cf-auto .cf-btn-sw{width:20px;height:20px;font-size:10px;}
  .cf-free{display:flex;flex-direction:column;gap:9px;}
  .cf-sv{position:relative;height:120px;border-radius:9px;cursor:crosshair;touch-action:none;overflow:hidden;outline:none;}
  .cf-sv:focus-visible,.cf-hue:focus-visible{box-shadow:0 0 0 2px var(--s-brasa);}
  .cf-sv-white{position:absolute;inset:0;background:linear-gradient(90deg,#fff,rgba(255,255,255,0));}
  .cf-sv-black{position:absolute;inset:0;background:linear-gradient(0deg,#000,rgba(0,0,0,0));}
  .cf-sv-dot{position:absolute;width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.3),0 2px 4px rgba(0,0,0,.3);transform:translate(-50%,-50%);pointer-events:none;}
  .cf-hue{position:relative;height:12px;border-radius:6px;cursor:pointer;touch-action:none;outline:none;background:linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00);}
  .cf-hue-dot{position:absolute;top:50%;width:16px;height:16px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.3),0 2px 4px rgba(0,0,0,.3);transform:translate(-50%,-50%);pointer-events:none;}
  .cf-hex{display:flex;align-items:center;gap:8px;font-size:11px;color:rgba(34,32,27,.5);}
  .cf-hex input{flex:1;min-width:0;padding:6px 9px;font-size:12px;border:1px solid rgba(34,32,27,.15);border-radius:7px;font-family:ui-monospace,Menlo,monospace;color:var(--s-tinta);outline:none;}
  .cf-hex input:focus{border-color:var(--s-brasa);}
  .cf-sample{margin-top:10px;border-radius:9px;padding:8px 10px;font-size:11.5px;}
  .cf-sample strong{font-size:15px;margin-right:6px;}
  .cf-sample--bad{box-shadow:inset 0 0 0 2px #D4A24C;}
  .cf-done{margin-top:10px;width:100%;border:none;border-radius:9px;background:var(--s-tinta);color:#fff;font-size:12px;font-weight:600;padding:8px;cursor:pointer;font-family:inherit;}
`
