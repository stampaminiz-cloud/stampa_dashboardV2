'use client'

// Pestañas de tarjeta (Premios): mismo estilo que Programa / Clientes en
// Analítica (clases .s-tabs / .s-tab del sistema visual).
export function CardTabs({ options, value, onChange, ariaLabel = 'Tarjeta' }: {
  options: { id: string; label: string }[]
  value: string
  onChange: (id: string) => void
  ariaLabel?: string
}) {
  return (
    <div className="s-tabs" role="tablist" aria-label={ariaLabel} style={{ flexWrap: 'wrap' }}>
      {options.map(o => (
        <button key={o.id} type="button" role="tab" className="s-tab" aria-selected={o.id === value} onClick={() => onChange(o.id)}>{o.label}</button>
      ))}
    </div>
  )
}
