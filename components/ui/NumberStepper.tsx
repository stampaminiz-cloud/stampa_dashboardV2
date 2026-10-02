'use client'
import React, { useEffect, useRef, useState } from 'react'

// Selector numérico único de todo el dashboard (reemplaza las flechitas del
// navegador y los − / + viejos): botones grandes, mantener apretado acelera,
// el número se puede escribir, y atajos opcionales con los valores comunes.
//
//   <NumberStepper value={n} onChange={setN} min={1} max={1000} presets={[5, 10, 20, 50]} suffix="pts" />

export function NumberStepper({
  value, onChange, min = 0, max = 9999, step = 1, presets, suffix, size = 'md', disabled = false, ariaLabel,
}: {
  value: number
  onChange: (n: number) => void
  min?: number
  max?: number
  step?: number
  presets?: number[]
  suffix?: string
  size?: 'sm' | 'md'
  disabled?: boolean
  ariaLabel?: string
}) {
  const [draft, setDraft] = useState(String(value))
  const valueRef = useRef(value)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => { setDraft(String(value)); valueRef.current = value }, [value])

  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n)))
  const set = (n: number) => { const c = clamp(n); valueRef.current = c; setDraft(String(c)); onChange(c) }

  // Mantener apretado: primer paso al instante, después se repite y acelera.
  function startHold(dir: 1 | -1) {
    if (disabled) return
    set(valueRef.current + dir * step)
    let delay = 380
    const tick = () => {
      set(valueRef.current + dir * step)
      delay = Math.max(50, delay * 0.82)
      timer.current = setTimeout(tick, delay)
    }
    timer.current = setTimeout(tick, delay)
  }
  function stopHold() { if (timer.current) { clearTimeout(timer.current); timer.current = null } }
  useEffect(() => stopHold, [])

  function commitDraft() {
    const n = Number(draft)
    if (draft.trim() === '' || !Number.isFinite(n)) { setDraft(String(value)); return }
    set(n)
  }

  const holdProps = (dir: 1 | -1) => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); startHold(dir) },
    onPointerUp: stopHold, onPointerLeave: stopHold, onPointerCancel: stopHold,
    onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); set(valueRef.current + dir * step) } },
  })

  return (
    <div className={`ns ns--${size}${disabled ? ' ns--off' : ''}`}>
      <style>{CSS}</style>
      <div className="ns-box" role="group" aria-label={ariaLabel}>
        <button type="button" className="ns-btn" aria-label="Restar" disabled={disabled || value <= min} {...holdProps(-1)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
        <label className="ns-mid">
          <input
            className="ns-input" inputMode="numeric" pattern="[0-9]*" value={draft} disabled={disabled} aria-label={ariaLabel}
            onChange={e => setDraft(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
            onBlur={commitDraft}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.currentTarget.blur() }
              if (e.key === 'ArrowUp') { e.preventDefault(); set(value + step) }
              if (e.key === 'ArrowDown') { e.preventDefault(); set(value - step) }
            }}
            style={{ width: `${Math.max(2, draft.length) + 1.2}ch` }}
          />
          {suffix && <span className="ns-suffix">{suffix}</span>}
        </label>
        <button type="button" className="ns-btn" aria-label="Sumar" disabled={disabled || value >= max} {...holdProps(1)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </div>
      {presets && presets.length > 0 && (
        <div className="ns-presets">
          {presets.map(p => (
            <button key={p} type="button" className={`ns-chip${p === value ? ' ns-chip--on' : ''}`} disabled={disabled} onClick={() => set(p)}>
              {p}{suffix ? ` ${suffix}` : ''}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const CSS = `
  .ns{display:inline-flex;flex-direction:column;gap:8px;}
  .ns-box{display:inline-flex;align-items:center;gap:2px;background:#FBF6EE;border:1.5px solid rgba(43,38,32,.1);border-radius:999px;padding:3px;}
  .ns-box:focus-within{border-color:#C75D3A;}
  .ns-btn{width:36px;height:36px;border-radius:50%;border:none;background:#fff;color:#2B2620;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 1px 3px rgba(43,38,32,.12);transition:transform .08s,background .15s;touch-action:manipulation;user-select:none;-webkit-user-select:none;}
  .ns-btn:hover:not(:disabled){background:#FFF4EE;color:#C75D3A;}
  .ns-btn:active:not(:disabled){transform:scale(.92);}
  .ns-btn:disabled{opacity:.35;cursor:default;box-shadow:none;}
  .ns-mid{display:flex;align-items:baseline;gap:4px;padding:0 10px;cursor:text;}
  .ns-input{border:none;background:transparent;outline:none;text-align:center;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:17px;color:#2B2620;min-width:2.5ch;padding:0;}
  .ns-suffix{font-size:12px;font-weight:600;color:rgba(43,38,32,.5);}
  .ns--sm .ns-btn{width:28px;height:28px;}
  .ns--sm .ns-input{font-size:14px;}
  .ns--sm .ns-mid{padding:0 6px;}
  .ns--off{opacity:.55;}
  .ns-presets{display:flex;gap:6px;flex-wrap:wrap;}
  .ns-chip{font-size:11.5px;font-weight:600;padding:5px 11px;border-radius:999px;border:1px solid rgba(43,38,32,.14);background:#fff;color:rgba(43,38,32,.7);cursor:pointer;font-family:'Inter',sans-serif;}
  .ns-chip:hover:not(:disabled){border-color:rgba(43,38,32,.3);}
  .ns-chip--on{background:rgba(199,93,58,.1);border-color:#C75D3A;color:#C75D3A;}
`
