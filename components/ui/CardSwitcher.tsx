'use client'

// Selector de tarjeta (Analítica, Premios, Formulario): sin íconos, como
// control segmentado y bien visible arriba de la sección.
export function CardSwitcher({ options, value, onChange, label = 'Mostrando' }: {
  options: { id: string; label: string }[]
  value: string
  onChange: (id: string) => void
  label?: string
}) {
  return (
    <div className="cs">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <span className="cs-label">{label}</span>
      <div className="cs-seg" role="tablist" aria-label="Tarjeta">
        {options.map(o => (
          <button key={o.id} type="button" role="tab" aria-selected={o.id === value} className={`cs-btn${o.id === value ? ' cs-btn--on' : ''}`} onClick={() => onChange(o.id)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

const CSS = `
  .cs{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
  .cs-label{font-size:12.5px;color:rgba(43,38,32,.55);font-family:'Inter',sans-serif;}
  .cs-seg{display:flex;flex-wrap:wrap;gap:4px;background:rgba(43,38,32,.06);border-radius:12px;padding:4px;}
  .cs-btn{border:none;background:transparent;border-radius:9px;padding:9px 18px;font-size:13.5px;font-weight:600;color:rgba(43,38,32,.6);cursor:pointer;font-family:'Inter',sans-serif;transition:background .15s,color .15s;}
  .cs-btn:hover{color:#2B2620;}
  .cs-btn--on{background:#fff;color:#2B2620;box-shadow:0 1px 4px rgba(43,38,32,.12);}
  @media(max-width:600px){.cs-btn{padding:8px 12px;font-size:12.5px;}}
`
