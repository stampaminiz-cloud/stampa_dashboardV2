'use client'
// Recorrido con foco: oscurece la pantalla y resalta de a una cosa, en el
// orden de los primeros pasos. Cada paso apunta a un elemento con
// data-tour="...". Si el elemento no se ve (por ejemplo, el menú cerrado en el
// celular), el aviso queda al centro, abajo, sin resaltar nada.
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Icon } from '@/components/ui/Icon'

export interface TourStep { target: string; title: string; body: string }

export const TOUR_KEY = 'stampa_tour'

export function GuidedTour({ steps, onClose }: { steps: TourStep[]; onClose: (finished: boolean) => void }) {
  const [i, setI] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const [cardH, setCardH] = useState(160)
  const step = steps[Math.min(i, steps.length - 1)]

  const measure = useCallback(() => {
    const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null
    if (!el) { setRect(null); return }
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    const r = el.getBoundingClientRect()
    setRect(r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight ? r : null)
  }, [step.target])

  useLayoutEffect(() => { measure() }, [measure, i])
  useEffect(() => {
    const t = setTimeout(measure, 350) // después del scroll suave
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => { clearTimeout(t); window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true) }
  }, [measure, i])
  useEffect(() => { if (cardRef.current) setCardH(cardRef.current.offsetHeight) })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const last = i >= steps.length - 1
  const W = 320, M = 14, vw = typeof window === 'undefined' ? 1200 : window.innerWidth, vh = typeof window === 'undefined' ? 800 : window.innerHeight
  // Al costado del elemento resaltado si entra; si no, abajo y centrado.
  let left = (vw - W) / 2, top = vh - cardH - 24
  if (rect && vw >= 720) {
    left = Math.min(Math.max(rect.right + 18, M), vw - W - M)
    top = Math.min(Math.max(rect.top, M), vh - cardH - M)
    if (rect.right + 18 + W > vw - M) { left = Math.max(M, rect.left); top = Math.min(rect.bottom + 18, vh - cardH - M) }
  }

  return (
    <div className="gt-root" role="dialog" aria-label="Guía de primeros pasos">
      <style>{CSS}</style>
      <div className="gt-block" onClick={() => { /* los clics fuera del aviso no hacen nada */ }} />
      {rect && <div className="gt-spot" style={{ left: rect.left - 6, top: rect.top - 6, width: rect.width + 12, height: rect.height + 12 }} />}
      <div className="gt-card" ref={cardRef} style={{ left, top, width: Math.min(W, vw - M * 2) }}>
        <div className="gt-k"><Icon name="idea" size={16} />Paso {i + 1} de {steps.length}</div>
        <div className="gt-t">{step.title}</div>
        <div className="gt-b">{step.body}</div>
        <div className="gt-f">
          <div className="gt-dots">{steps.map((_, k) => <i key={k} className={k === i ? 'on' : ''} />)}</div>
          <span className="gt-act">
            <button className="gt-skip" onClick={() => onClose(false)}>Saltar guía</button>
            <button className="s-btn s-btn--primary s-btn--sm" onClick={() => (last ? onClose(true) : setI(i + 1))}>{last ? 'Empezar' : 'Siguiente'}</button>
          </span>
        </div>
      </div>
    </div>
  )
}

const CSS = `
  .gt-root{position:fixed;inset:0;z-index:2000}
  .gt-block{position:absolute;inset:0}
  .gt-spot{position:absolute;border-radius:14px;box-shadow:0 0 0 9999px rgba(30,29,26,.62),0 0 0 3px #E7C46A;transition:all .3s cubic-bezier(.2,.8,.2,1);pointer-events:none}
  .gt-card{position:absolute;background:var(--s-blanco);border-radius:16px;padding:16px;box-shadow:0 20px 50px -16px rgba(0,0,0,.5);transition:left .3s cubic-bezier(.2,.8,.2,1),top .3s cubic-bezier(.2,.8,.2,1)}
  .gt-k{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:700;color:var(--s-brasa);letter-spacing:.05em;text-transform:uppercase}
  .gt-t{font-family:var(--font-display);font-weight:800;font-size:19px;margin:6px 0 4px;color:var(--s-tinta)}
  .gt-b{font-size:14px;line-height:1.5;color:var(--s-tinta-2)}
  .gt-f{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:14px;flex-wrap:wrap}
  .gt-dots{display:flex;gap:5px}.gt-dots i{width:7px;height:7px;border-radius:50%;background:rgb(var(--s-tinta-rgb) / .14)}.gt-dots i.on{background:var(--s-brasa);width:20px;border-radius:5px}
  .gt-act{display:flex;align-items:center;gap:10px}
  .gt-skip{border:0;background:transparent;color:var(--s-tinta-2);font-weight:600;font-size:13px;cursor:pointer;font-family:inherit}
  @media (prefers-reduced-motion:reduce){.gt-spot,.gt-card{transition:none}}
`
