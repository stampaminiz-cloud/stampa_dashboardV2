'use client'
// Botón "Ayuda" con un panel lateral de preguntas cortas. Es la única forma de
// ayuda del panel: vive en la barra de arriba y muestra las preguntas de la
// pantalla abierta (components/dashboard/helpContent.ts). Lo que hace falta para
// no equivocarse (una pérdida, algo irreversible, una regla que ven los
// clientes) se escribe en la pantalla, en una línea, y no acá.
import React, { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '@/components/ui/Icon'

export interface HelpItem { q: string; a: React.ReactNode }

export function HelpDrawer({ title = 'Ayuda', items }: { title?: string; items: HelpItem[] }) {
  const [open, setOpen] = useState(false)
  const [openQ, setOpenQ] = useState(0)
  const id = useId()
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <style>{CSS}</style>
      <button type="button" className="hlp-btn" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <Icon name="info" size={16} /><span className="hlp-btn-t">Ayuda</span>
      </button>
      {open && typeof document !== 'undefined' && createPortal(
        <div className="hlp-root">
          <div className="hlp-scrim" onClick={() => setOpen(false)} />
          <aside className="hlp-panel" role="dialog" aria-modal="true" aria-label={title}>
            <div className="hlp-head"><span>{title}</span><button type="button" className="hlp-x" onClick={() => setOpen(false)} aria-label="Cerrar">×</button></div>
            <div className="hlp-list">
              {items.map((it, k) => {
                const on = openQ === k
                return (
                  <div key={it.q} className="hlp-q">
                    <button type="button" aria-expanded={on} aria-controls={`${id}-${k}`} onClick={() => setOpenQ(on ? -1 : k)}>
                      <Icon name="info" size={18} /><span>{it.q}</span>
                      <svg className="hlp-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
                    </button>
                    {on && <div className="hlp-a" id={`${id}-${k}`}>{it.a}</div>}
                  </div>
                )
              })}
            </div>
          </aside>
        </div>,
        document.body
      )}
    </>
  )
}

const CSS = `
  .hlp-btn{display:inline-flex;align-items:center;gap:7px;border:1.5px solid rgb(var(--s-tinta-rgb) / .14);background:var(--s-blanco);border-radius:999px;padding:7px 13px;font:inherit;font-size:13px;font-weight:600;color:var(--s-tinta);cursor:pointer}
  .hlp-btn svg{color:var(--s-brasa)}
  @media(max-width:560px){.hlp-btn{padding:8px}.hlp-btn-t{display:none}}.hlp-btn:hover{border-color:var(--s-brasa)}
  .hlp-root{position:fixed;inset:0;z-index:1500}
  .hlp-scrim{position:absolute;inset:0;background:rgba(30,29,26,.35)}
  .hlp-panel{position:absolute;top:0;right:0;bottom:0;width:min(400px,92vw);background:var(--s-blanco);box-shadow:-18px 0 40px -20px rgba(0,0,0,.35);padding:20px;display:flex;flex-direction:column;gap:12px;animation:hdin .3s cubic-bezier(.2,.8,.2,1)}
  @keyframes hdin{from{transform:translateX(100%)}to{transform:none}}
  .hlp-head{display:flex;justify-content:space-between;align-items:center;font-family:var(--font-display);font-weight:800;font-size:20px;color:var(--s-tinta)}
  .hlp-x{border:0;background:var(--s-salvia);border-radius:50%;width:32px;height:32px;font-size:18px;font-weight:700;cursor:pointer;color:var(--s-tinta)}
  .hlp-list{display:flex;flex-direction:column;gap:8px;overflow:auto}
  .hlp-q{background:var(--s-salvia);border-radius:12px;overflow:hidden}
  .hlp-q>button{width:100%;border:0;background:transparent;display:flex;align-items:center;gap:10px;padding:13px 14px;font:inherit;font-size:14px;font-weight:600;text-align:left;color:var(--s-tinta);cursor:pointer}
  .hlp-q>button>svg:first-child{flex-shrink:0;color:var(--s-brasa)}
  .hlp-q>button>span{flex:1;min-width:0}
  .hlp-chev{flex-shrink:0;color:rgb(var(--s-tinta-rgb) / .42);transition:transform .2s cubic-bezier(.2,.8,.2,1)}
  .hlp-q>button[aria-expanded=true] .hlp-chev{transform:rotate(180deg)}
  .hlp-a{padding:0 14px 14px 42px;font-size:13.5px;line-height:1.55;color:var(--s-tinta-2)}
  @media (prefers-reduced-motion:reduce){.hlp-panel{animation:none}.hlp-chev{transition:none}}
`
