'use client'

// Menú compacto en forma de píldora (opción A de selectores): tarjeta y
// período en Analítica y Premios. Es un <select> nativo con estilo, así
// funciona con teclado y en el celular sin nada extra.
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
  .ps-wrap::after{content:'';position:absolute;right:12px;top:50%;width:6px;height:6px;border-right:1.5px solid rgba(43,38,32,.55);border-bottom:1.5px solid rgba(43,38,32,.55);transform:translateY(-70%) rotate(45deg);pointer-events:none;}
  .ps{appearance:none;-webkit-appearance:none;font-family:'Inter',sans-serif;font-size:12.5px;font-weight:600;color:#2B2620;background:#fff;border:1px solid rgba(43,38,32,.14);border-radius:999px;padding:7px 30px 7px 14px;cursor:pointer;max-width:220px;text-overflow:ellipsis;}
  .ps:hover{border-color:rgba(43,38,32,.28);}
  .ps:focus-visible{outline:2px solid #C75D3A;outline-offset:1px;}
`
