'use client'

// Confirmación con el estilo de Stampa, en lugar del cuadro del navegador
// (window.confirm). Se usa igual de simple pero con await:
//   if (!(await confirmar({ titulo: '¿Sacar a Ana?', mensaje: '…', confirmar: 'Sacar' }))) return
import { createRoot } from 'react-dom/client'
import { useEffect, useRef } from 'react'

export interface ConfirmarOpciones {
  titulo: string
  mensaje?: string
  /** Texto del botón que confirma. */
  confirmar?: string
  cancelar?: string
  /** Botón en rojo: para lo que no se puede deshacer. */
  peligro?: boolean
}

export function confirmar(op: ConfirmarOpciones): Promise<boolean> {
  if (typeof document === 'undefined') return Promise.resolve(false)
  return new Promise(resolve => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const root = createRoot(host)
    const cerrar = (ok: boolean) => {
      root.unmount(); host.remove(); resolve(ok)
    }
    root.render(<Dialogo op={op} onClose={cerrar} />)
  })
}

function Dialogo({ op, onClose }: { op: ConfirmarOpciones; onClose: (ok: boolean) => void }) {
  const okRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const previo = document.activeElement as HTMLElement | null
    // Lo que no se puede deshacer arranca con el foco en "Cancelar".
    ;(op.peligro ? document.querySelector<HTMLButtonElement>('.cf-cancel') : okRef.current)?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(false) } }
    document.addEventListener('keydown', onKey, true)
    return () => { document.removeEventListener('keydown', onKey, true); previo?.focus?.() }
  }, [op.peligro, onClose])

  return (
    <div className="cf-back" onMouseDown={e => { if (e.target === e.currentTarget) onClose(false) }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="cf-box" role="alertdialog" aria-modal="true" aria-labelledby="cf-t" aria-describedby={op.mensaje ? 'cf-m' : undefined}>
        <h2 id="cf-t" className="cf-title">{op.titulo}</h2>
        {op.mensaje && <p id="cf-m" className="cf-msg">{op.mensaje}</p>}
        <div className="cf-actions">
          <button type="button" className="cf-cancel" onClick={() => onClose(false)}>{op.cancelar || 'Cancelar'}</button>
          <button ref={okRef} type="button" className={`cf-ok${op.peligro ? ' cf-ok--danger' : ''}`} onClick={() => onClose(true)}>{op.confirmar || 'Aceptar'}</button>
        </div>
      </div>
    </div>
  )
}

const CSS = `
  .cf-back{position:fixed;inset:0;z-index:100000;background:rgb(var(--s-tinta-rgb) / .45);display:flex;align-items:center;justify-content:center;padding:16px;animation:cfIn .14s ease-out}
  .cf-box{width:100%;max-width:400px;background:var(--s-blanco);color:rgb(var(--s-tinta-rgb));border-radius:18px;padding:22px 22px 18px;box-shadow:0 18px 50px rgb(0 0 0 / .28);font-family:var(--font-body,system-ui)}
  .cf-title{font-family:var(--font-display,inherit);font-weight:800;font-size:19px;line-height:1.25;margin:0}
  .cf-msg{font-size:14.5px;line-height:1.45;margin:8px 0 0;color:rgb(var(--s-tinta-rgb) / .68);white-space:pre-line}
  .cf-actions{display:flex;gap:10px;margin-top:20px}
  .cf-actions button{flex:1;min-height:46px;border-radius:12px;font:700 15px var(--font-body,system-ui);cursor:pointer;border:1.5px solid transparent}
  .cf-cancel{background:transparent;border-color:rgb(var(--s-tinta-rgb) / .2)!important;color:rgb(var(--s-tinta-rgb))}
  .cf-ok{background:var(--s-brasa);color:var(--s-blanco)}
  .cf-ok--danger{background:var(--s-error);color:var(--s-blanco)}
  .cf-actions button:focus-visible{outline:3px solid rgb(var(--s-tinta-rgb) / .35);outline-offset:2px}
  @keyframes cfIn{from{opacity:0}to{opacity:1}}
  @media (prefers-reduced-motion: reduce){.cf-back{animation:none}}
`
