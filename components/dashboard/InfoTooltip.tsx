'use client'
import React, { useState, useRef, useEffect } from 'react'

// ─── InfoTooltip ────────────────────────────────────────────────────────────
// Ícono "ⓘ" chiquito que muestra texto explicativo al hover (desktop) o tap
// (mobile), en vez de tener el texto siempre visible ocupando espacio.
//
// Criterio de cuándo usar esto vs texto siempre visible: si el texto es
// "nice to have" (contexto, explicación de qué hace algo) va acá adentro.
// Si es un aviso de seguridad, un límite de plan, o algo irreversible
// ("esto no se puede deshacer"), se queda como texto visible siempre —
// el costo de que alguien no lo vea es demasiado alto para esconderlo
// detrás de un hover.
export function InfoTooltip({ text, side = 'top' }: { text: string; side?: 'top' | 'bottom' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <span
      ref={ref}
      className="info-tooltip-wrap"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="info-tooltip-icon">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="11.5" />
        <circle cx="12" cy="8" r="0.5" fill="currentColor" stroke="none" />
      </svg>
      {open && (
        <span className={`info-tooltip-bubble info-tooltip-bubble--${side}`}>{text}</span>
      )}
      <style>{`
        .info-tooltip-wrap{position:relative;display:inline-flex;align-items:center;cursor:help;color:rgba(43,38,32,.35);vertical-align:middle;margin-left:4px;}
        .info-tooltip-wrap:hover{color:rgba(43,38,32,.6);}
        .info-tooltip-bubble{position:absolute;left:50%;transform:translateX(-50%);width:200px;background:#2B2620;color:#F7F0E4;font-size:11px;font-weight:400;line-height:1.5;padding:8px 10px;border-radius:8px;z-index:60;text-align:left;box-shadow:0 4px 16px rgba(0,0,0,.2);}
        .info-tooltip-bubble--top{bottom:calc(100% + 7px);}
        .info-tooltip-bubble--bottom{top:calc(100% + 7px);}
      `}</style>
    </span>
  )
}