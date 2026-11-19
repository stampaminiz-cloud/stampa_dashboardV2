'use client'

// Filtro de tarjeta: chips chicos y redondos, sin color. Se distingue de las
// pestañas de sección (Programa / Clientes), que son un control más grande.
export function CardChips({ options, value, onChange, ariaLabel = 'Tarjeta' }: {
  options: { id: string; label: string }[]
  value: string
  onChange: (id: string) => void
  ariaLabel?: string
}) {
  return (
    <div className="cc" role="group" aria-label={ariaLabel}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {options.map(o => (
        <button key={o.id} type="button" className={`cc-chip${o.id === value ? ' cc-chip--on' : ''}`} aria-pressed={o.id === value} onClick={() => onChange(o.id)}>{o.label}</button>
      ))}
    </div>
  )
}

const CSS = `
  .cc{display:flex;gap:6px;flex-wrap:wrap;}
  .cc-chip{border:1px solid rgb(var(--s-tinta-rgb) / .14);background:var(--s-blanco);color:var(--s-tinta);border-radius:999px;padding:6px 13px;font:600 12.5px var(--font-body);cursor:pointer;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .cc-chip:hover{border-color:rgb(var(--s-tinta-rgb) / .3);}
  .cc-chip--on{background:var(--s-tinta);color:var(--s-blanco);border-color:var(--s-tinta);}
  .cc-chip:focus-visible{outline:2px solid var(--s-brasa);outline-offset:1px;}
`
