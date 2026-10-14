'use client'
// Lista de opciones como chips (Enter para agregar). La usan Formulario
// (preguntas de lista) y Premios (premios a elegir).
import { useState } from 'react'

export function OptionsEditor({ options, onChange, max = 10 }: { options: string[]; onChange: (o: string[]) => void; max?: number }) {
  const [draft, setDraft] = useState('')
  function add() {
    const v = draft.trim()
    if (!v || options.some(o => o.toLowerCase() === v.toLowerCase()) || options.filter(o => o.trim()).length >= max) return
    onChange([...options.filter(o => o.trim()), v]); setDraft('')
  }
  const real = options.filter(o => o.trim())
  return (
    <div className="fm-opts">
      <style>{CSS}</style>
      {real.map(o => (
        <span key={o} className="fm-opt">
          {o}
          <button onClick={() => onChange(real.filter(x => x !== o))} aria-label={`Quitar ${o}`} title="Quitar opción">×</button>
        </span>
      ))}
      {real.length < max && (
        <input className="fm-opt-input" placeholder={real.length < 2 ? 'Escribí una opción y Enter' : '+ Opción'} value={draft} maxLength={40}
          onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }} onBlur={add} />
      )}
      {real.length < 2 && <span className="fm-opt-hint">Mínimo 2 opciones</span>}
    </div>
  )
}

const CSS = `
  .fm-opts{display:flex;flex-wrap:wrap;gap:6px;align-items:center;}
  .fm-opt{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:600;background:rgba(199,93,58,.08);color:#9E4529;border-radius:20px;padding:3px 5px 3px 10px;}
  .fm-opt button{border:none;background:rgba(199,93,58,.15);color:#9E4529;width:16px;height:16px;border-radius:50%;font-size:11px;line-height:14px;cursor:pointer;padding:0;}
  .fm-opt-input{border:1px dashed rgba(43,38,32,.2);border-radius:20px;padding:4px 10px;font-size:11.5px;font-family:inherit;outline:none;min-width:150px;}
  .fm-opt-input:focus{border-color:#C75D3A;border-style:solid;}
  .fm-opt-hint{font-size:10.5px;color:#B23B3B;}
`
