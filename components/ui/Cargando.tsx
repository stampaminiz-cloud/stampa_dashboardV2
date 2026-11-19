'use client'

// Carga sin texto ni mascota. Dos formas:
//  · "pagina": el nombre de Stampa con una línea que va y viene. Para cuando
//    se abre el panel.
//  · "seccion": la forma de lo que viene, en gris (título, números y un
//    bloque). Para pasar de una pestaña a otra.
export function Cargando({ variante = 'seccion', minHeight }: { variante?: 'pagina' | 'seccion'; minHeight?: number }) {
  return (
    <div className="cg" style={{ minHeight: minHeight ?? (variante === 'pagina' ? 220 : 0) }} role="status" aria-label="Cargando">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {variante === 'pagina' ? (
        <div className="cg-page">
          <div className="cg-name">STAMPA</div>
          <div className="cg-line"><i /></div>
        </div>
      ) : (
        <div className="cg-sec">
          <div className="cg-sk" style={{ height: 18, width: '38%' }} />
          <div className="cg-grid">{[0, 1, 2, 3].map(i => <div key={i} className="cg-sk" style={{ height: 70 }} />)}</div>
          <div className="cg-sk" style={{ height: 150 }} />
        </div>
      )}
    </div>
  )
}

const CSS = `
  .cg{width:100%;display:flex;align-items:center;justify-content:center;}
  .cg-page{text-align:center;}
  .cg-name{font-family:var(--font-display);font-weight:800;font-size:30px;letter-spacing:-.01em;color:var(--s-pino-texto);}
  .cg-line{height:3px;width:120px;margin:12px auto 0;border-radius:9px;background:rgb(var(--s-tinta-rgb) / .1);overflow:hidden;position:relative;}
  .cg-line i{position:absolute;top:0;bottom:0;width:40%;border-radius:9px;background:var(--s-brasa);animation:cgSlide 1.3s ease-in-out infinite;}
  .cg-sec{width:100%;display:flex;flex-direction:column;gap:12px;}
  .cg-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;}
  .cg-sk{background:rgb(var(--s-tinta-rgb) / .06);border-radius:10px;animation:cgPulse 1.4s ease-in-out infinite;}
  @keyframes cgSlide{0%{transform:translateX(-100%)}100%{transform:translateX(260%)}}
  @keyframes cgPulse{50%{opacity:.55}}
  @media (prefers-reduced-motion: reduce){.cg-line i,.cg-sk{animation:none}}
`
