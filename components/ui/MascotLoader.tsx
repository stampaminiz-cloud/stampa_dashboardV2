'use client'

// Carga amable: la mascota de Stampa "sellando" (rebota y deja una marca)
// con un texto corto. Solo para esperas de toda una sección (la primera vez
// que se abre una tab y todavía no hay nada guardado); dentro de tarjetas
// con datos siguen los esqueletos grises, que se leen más rápido.
export function MascotLoader({ text = 'Cargando…', size = 56, minHeight = 220 }: { text?: string; size?: number; minHeight?: number }) {
  return (
    <div className="ml" style={{ minHeight }} role="status" aria-live="polite">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="ml-stage" style={{ width: size * 1.6, height: size * 1.35 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/stampa-mascot-coral.png" alt="" width={size} height={Math.round(size * 0.94)} className="ml-mascot" />
        <span className="ml-mark" style={{ width: size * 0.7 }} />
      </div>
      <div className="ml-text">{text}</div>
    </div>
  )
}

const CSS = `
  .ml{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;width:100%;}
  .ml-stage{position:relative;display:flex;align-items:flex-start;justify-content:center;}
  .ml-mascot{display:block;animation:mlStamp 1.1s cubic-bezier(.5,0,.5,1) infinite;transform-origin:50% 100%;}
  .ml-mark{position:absolute;bottom:0;left:50%;height:6px;border-radius:50%;background:rgba(199,93,58,.25);transform:translateX(-50%);animation:mlMark 1.1s cubic-bezier(.5,0,.5,1) infinite;}
  .ml-text{font-size:12.5px;font-weight:600;color:rgba(43,38,32,.55);font-family:'Inter',sans-serif;}
  @keyframes mlStamp{0%,100%{transform:translateY(-14px) scale(1,1)}45%{transform:translateY(0) scale(1.06,.92)}60%{transform:translateY(0) scale(.97,1.03)}}
  @keyframes mlMark{0%,100%{opacity:.35;transform:translateX(-50%) scaleX(.6)}45%,60%{opacity:1;transform:translateX(-50%) scaleX(1)}}
  @media (prefers-reduced-motion: reduce){.ml-mascot,.ml-mark{animation:none}}
`
