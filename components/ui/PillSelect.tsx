'use client'

// Menú compacto en forma de píldora (opción A de selectores): tarjeta y
// período en Analítica. Es un <select> nativo con estilo, así funciona con
// teclado y en el celular sin nada extra. La flecha la pone el sistema visual
// (styles/sistema.css); antes había una segunda y se encimaban.
export function PillSelect({ value, options, onChange, ariaLabel }: {
  value: string
  options: { id: string; label: string }[]
  onChange: (id: string) => void
  ariaLabel: string
}) {
  return (
    <span className="ps-wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <select className="ps" value={value} aria-label={ariaLabel} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    </span>
  )
}

const CSS = `
  .ps-wrap{position:relative;display:inline-flex;}
  .ps{appearance:none;-webkit-appearance:none;font-family:var(--font-body);font-size:12.5px;font-weight:600;color:var(--s-tinta);background:var(--s-blanco);border:1px solid rgb(var(--s-tinta-rgb) / .14);border-radius:999px;padding:7px 30px 7px 14px;cursor:pointer;max-width:220px;text-overflow:ellipsis;}
  .ps:hover{border-color:rgb(var(--s-tinta-rgb) / .28);}
  .ps:focus-visible{outline:2px solid var(--s-brasa);outline-offset:1px;}
`
