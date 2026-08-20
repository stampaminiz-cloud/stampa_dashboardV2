'use client'
import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

// ─── InfoTooltip ────────────────────────────────────────────────────────────
// Ícono "ⓘ" chiquito que muestra texto explicativo al hover (desktop) o tap
// (mobile), en vez de tener el texto siempre visible ocupando espacio.
//
// La burbuja se renderiza con un portal directo a document.body, con su
// posición calculada en JS a partir de dónde está el ícono en pantalla —
// NO como position:absolute relativo a un contenedor. Esto es a propósito:
// los paneles donde vive esto (editor de tarjeta, Settings) son angostos y
// tienen scroll (overflow-y:auto), y una burbuja centrada con
// left:50%/transform quedaba cortada por ese overflow apenas el panel no
// tenía los ~200px de aire necesarios a los costados. Con portal + cálculo
// real, la burbuja nunca se corta, sin importar cuán angosto sea el panel.
//
// Criterio de cuándo usar esto vs texto siempre visible: si el texto es
// "nice to have" (contexto, explicación de qué hace algo) va acá adentro.
// Si es un aviso de seguridad, un límite de plan, o algo irreversible
// ("esto no se puede deshacer"), se queda como texto visible siempre —
// el costo de que alguien no lo vea es demasiado alto para esconderlo
// detrás de un hover.
export function InfoTooltip({ text, side = 'top' }: { text: string; side?: 'top' | 'bottom' }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const iconRef = useRef<HTMLSpanElement>(null)
  const BUBBLE_WIDTH = 200

  function updatePosition() {
    if (!iconRef.current) return
    const rect = iconRef.current.getBoundingClientRect()
    // Centrado sobre el ícono, pero clampeado para que nunca se salga de
    // la pantalla (ni por izquierda ni por derecha) — el motivo real de
    // todo este componente.
    let left = rect.left + rect.width / 2 - BUBBLE_WIDTH / 2
    left = Math.max(8, Math.min(left, window.innerWidth - BUBBLE_WIDTH - 8))
    const top = side === 'top' ? rect.top - 8 : rect.bottom + 8
    setPos({ top, left })
  }

  function show() { updatePosition(); setOpen(true) }
  function hide() { setOpen(false) }

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (iconRef.current && !iconRef.current.contains(e.target as Node)) hide()
    }
    window.addEventListener('scroll', hide, true)
    window.addEventListener('resize', hide)
    document.addEventListener('mousedown', handler)
    return () => {
      window.removeEventListener('scroll', hide, true)
      window.removeEventListener('resize', hide)
      document.removeEventListener('mousedown', handler)
    }
  }, [open])

  return (
    <span
      ref={iconRef}
      className="info-tooltip-wrap"
      onMouseEnter={show}
      onMouseLeave={hide}
      onClick={(e) => { e.stopPropagation(); open ? hide() : show() }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="info-tooltip-icon">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="11.5" />
        <circle cx="12" cy="8" r="0.5" fill="currentColor" stroke="none" />
      </svg>
      {open && pos && typeof document !== 'undefined' && createPortal(
        <span
          className="info-tooltip-bubble"
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            width: BUBBLE_WIDTH,
            transform: side === 'top' ? 'translateY(-100%)' : undefined,
          }}
        >
          {text}
        </span>,
        document.body
      )}
      <style>{`
        .info-tooltip-wrap{position:relative;display:inline-flex;align-items:center;cursor:help;color:rgba(43,38,32,.35);vertical-align:middle;margin-left:4px;}
        .info-tooltip-wrap:hover{color:rgba(43,38,32,.6);}
        .info-tooltip-bubble{background:#2B2620;color:#F7F0E4;font-size:11px;font-weight:400;line-height:1.5;padding:8px 10px;border-radius:8px;z-index:1000;text-align:left;box-shadow:0 4px 16px rgba(0,0,0,.2);pointer-events:none;}
      `}</style>
    </span>
  )
}