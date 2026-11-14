'use client'
// Botón "Ayuda" con un panel lateral de preguntas cortas. Sirve para sacar de
// la pantalla las explicaciones largas: quien las necesita abre el panel, y
// quien no, ve la pantalla limpia. Lo importante de verdad (avisos de
// seguridad, algo irreversible, un límite del plan) NO va acá: se queda a la
// vista. Para una explicación de una línea sobre un campo, InfoTooltip.
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
      <button type="button" className="hd-btn" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <Icon name="info" size={16} />Ayuda
      </button>
      {open && typeof document !== 'undefined' && createPortal(
        <div className="hd-root">
          <div className="hd-scrim" onClick={() => setOpen(false)} />
          <aside className="hd-panel" role="dialog" aria-modal="true" aria-label={title}>
            <div className="hd-head"><span>{title}</span><button type="button" className="hd-x" onClick={() => setOpen(false)} aria-label="Cerrar">×</button></div>
            <div className="hd-list">
              {items.map((it, k) => {
                const on = openQ === k
                return (
                  <div key={it.q} className="hd-q">
                    <button type="button" aria-expanded={on} aria-controls={`${id}-${k}`} onClick={() => setOpenQ(on ? -1 : k)}>
                      <Icon name="info" size={18} /><span>{it.q}</span>
                      <svg className="hd-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
                    </button>
                    {on && <div className="hd-a" id={`${id}-${k}`}>{it.a}</div>}
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
  .hd-btn{display:inline-flex;align-items:center;gap:7px;border:1.5px solid rgba(34,32,27,.14);background:#fff;border-radius:999px;padding:7px 13px;font:inherit;font-size:13px;font-weight:600;color:var(--s-tinta);cursor:pointer}
  .hd-btn svg{color:var(--s-brasa)}.hd-btn:hover{border-color:var(--s-brasa)}
  .hd-root{position:fixed;inset:0;z-index:1500}
  .hd-scrim{position:absolute;inset:0;background:rgba(30,29,26,.35)}
  .hd-panel{position:absolute;top:0;right:0;bottom:0;width:min(400px,92vw);background:#fff;box-shadow:-18px 0 40px -20px rgba(0,0,0,.35);padding:20px;display:flex;flex-direction:column;gap:12px;animation:hdin .3s cubic-bezier(.2,.8,.2,1)}
  @keyframes hdin{from{transform:translateX(100%)}to{transform:none}}
  .hd-head{display:flex;justify-content:space-between;align-items:center;font-family:var(--font-display);font-weight:800;font-size:20px;color:var(--s-tinta)}
  .hd-x{border:0;background:var(--s-salvia);border-radius:50%;width:32px;height:32px;font-size:18px;font-weight:700;cursor:pointer;color:var(--s-tinta)}
  .hd-list{display:flex;flex-direction:column;gap:8px;overflow:auto}
  .hd-q{background:var(--s-salvia);border-radius:12px;overflow:hidden}
  .hd-q>button{width:100%;border:0;background:transparent;display:flex;align-items:center;gap:10px;padding:13px 14px;font:inherit;font-size:14px;font-weight:600;text-align:left;color:var(--s-tinta);cursor:pointer}
  .hd-q>button>svg:first-child{flex-shrink:0;color:var(--s-brasa)}
  .hd-q>button>span{flex:1;min-width:0}
  .hd-chev{flex-shrink:0;color:rgba(34,32,27,.42);transition:transform .2s cubic-bezier(.2,.8,.2,1)}
  .hd-q>button[aria-expanded=true] .hd-chev{transform:rotate(180deg)}
  .hd-a{padding:0 14px 14px 42px;font-size:13.5px;line-height:1.55;color:var(--s-tinta-2)}
  @media (prefers-reduced-motion:reduce){.hd-panel{animation:none}.hd-chev{transition:none}}
`
