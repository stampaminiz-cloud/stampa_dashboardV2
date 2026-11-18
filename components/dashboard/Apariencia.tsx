'use client'
import React, { useEffect, useState } from 'react'
import { getTema, setTema, TEMA_EVENT, isDark, type Tema } from '@/components/ThemeSync'
import { Icon } from '@/components/ui/Icon'

// Configuración → Apariencia (modo oscuro, noviembre 2026). La elección se
// guarda en este navegador (stampa_tema). "Automático" sigue al dispositivo.
const OPTS: { v: Tema; label: string }[] = [
  { v: 'claro', label: 'Claro' },
  { v: 'oscuro', label: 'Oscuro' },
  { v: 'auto', label: 'Automático' },
]

export function useTema(): [Tema, (t: Tema) => void] {
  const [tema, set] = useState<Tema>('auto')
  useEffect(() => {
    const read = () => set(getTema())
    read()
    window.addEventListener(TEMA_EVENT, read)
    return () => window.removeEventListener(TEMA_EVENT, read)
  }, [])
  return [tema, setTema]
}

// Pasa de claro a oscuro y al revés, según lo que se ve ahora (menú del usuario).
export function toggleTema() { setTema(isDark(getTema()) ? 'claro' : 'oscuro') }

export function Apariencia() {
  const [tema, set] = useTema()
  return (
    <div className="ap">
      <style>{CSS}</style>
      <div className="ap-row">
        <div className="ap-text"><b>Tema</b><span>Cómo se ve Stampa en este dispositivo. Automático sigue al dispositivo.</span></div>
        <div className="ap-seg" role="radiogroup" aria-label="Tema">
          {OPTS.map(o => (
            <button key={o.v} type="button" role="radio" aria-checked={tema === o.v} className={`ap-btn${tema === o.v ? ' is-on' : ''}`} onClick={() => set(o.v)}>
              {o.v === 'oscuro' && <Icon name="oscuro" size={14} />}{o.v === 'claro' && <Icon name="claro" size={14} />}{o.label}
            </button>
          ))}
        </div>
      </div>
      <div className="ap-note">Vale para el panel, el escáner web y la pantalla del mostrador. La web pública y los formularios de tus clientes quedan claros.</div>
    </div>
  )
}

const CSS = `
  .ap{display:flex;flex-direction:column;gap:8px;}
  .ap-row{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;}
  .ap-text{display:flex;flex-direction:column;gap:2px;min-width:200px;flex:1;}
  .ap-text b{font-size:13px;font-weight:700;color:var(--s-tinta);}
  .ap-text span{font-size:12px;color:var(--s-tinta-2);}
  .ap-seg{display:inline-flex;background:var(--s-salvia);border:1.5px solid var(--s-linea);border-radius:999px;padding:3px;gap:2px;}
  .ap-btn{display:inline-flex;align-items:center;gap:5px;border:none;background:transparent;border-radius:999px;padding:6px 13px;font-size:12px;font-weight:600;color:var(--s-tinta-2);cursor:pointer;font-family:var(--font-body);}
  .ap-btn.is-on{background:var(--s-blanco);color:var(--s-brasa-2);box-shadow:0 1px 3px rgba(0,0,0,.14);}
  .ap-note{font-size:11px;color:var(--s-tinta-3);}
`
