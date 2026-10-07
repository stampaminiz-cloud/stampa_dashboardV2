'use client'

// Landing → "Tus clientes no van a bajar otra app": cómo se hace hoy (papel)
// y cómo queda con Stampa, para los tres tipos de tarjeta (sellos, puntos y
// niveles). Alterna sola cada unos segundos hasta que la persona elige uno;
// con "reducir movimiento" no alterna. La tarjeta de Stampa es la misma del
// selector de rubros (CardMock), para que todo el sitio se vea igual.
import { useEffect, useState } from 'react'
import { CardMock, VERTICALS, VP_CSS } from './VerticalPicker'

type Kind = 'stamp' | 'points' | 'tiers'

const MODELS: { kind: Kind; label: string; vertical: string; before: string; after: string }[] = [
  { kind: 'stamp', label: 'Sellos', vertical: 'cafe', before: 'Se moja, se olvida en casa y nadie sabe cuántos sellos le faltan.', after: 'Cada visita suma sola y le avisás cuando le falta poco.' },
  { kind: 'points', label: 'Puntos', vertical: 'resto', before: 'Una planilla en la caja: el cliente nunca ve su saldo.', after: 'Ve sus puntos en el celular y qué premio está por alcanzar.' },
  { kind: 'tiers', label: 'Niveles', vertical: 'pelu', before: 'Un carnet que nadie actualiza y un beneficio que hay que recordar.', after: 'Sube de nivel sola con las visitas y ve su beneficio.' },
]

// "Hoy": la versión en papel de cada tipo de tarjeta.
function Paper({ kind }: { kind: Kind }) {
  if (kind === 'stamp') {
    return (
      <div className="ba-paper" aria-label="Tarjeta de sellos de cartón">
        <div className="ba-paper-biz">CAFÉ LUNA</div>
        <div className="ba-paper-stamps">
          {Array.from({ length: 10 }, (_, i) => <span key={i} className={i < 3 ? 'is-on' : ''} />)}
        </div>
        <div className="ba-paper-foot">Al completar, un café gratis</div>
      </div>
    )
  }
  if (kind === 'points') {
    return (
      <div className="ba-paper ba-paper--sheet" aria-label="Planilla de puntos en papel">
        <div className="ba-paper-biz">CANTINA ROMA · PUNTOS</div>
        <div className="ba-sheet">
          {[['Lucía F.', '120'], ['Martín G.', '340'], ['Sofía R.', '75'], ['Pablo D.', '510'], ['Ana M.', '—']].map(([n, p]) => (
            <div key={n}><span>{n}</span><i /><b>{p}</b></div>
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className="ba-paper" aria-label="Carnet de socia en papel">
      <div className="ba-paper-biz">STUDIO NINA · SOCIA</div>
      <div className="ba-carnet">
        <div><span>N.º</span><b>0127</b></div>
        <div><span>Categoría</span><i /></div>
        <div><span>Válido hasta</span><i /></div>
      </div>
      <div className="ba-paper-foot">Presentar en caja</div>
    </div>
  )
}

export function BeforeAfter() {
  const [i, setI] = useState(0)
  const [auto, setAuto] = useState(true)

  useEffect(() => {
    if (!auto || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setI(x => (x + 1) % MODELS.length), 4000)
    return () => clearInterval(t)
  }, [auto])

  const m = MODELS[i]
  const v = VERTICALS.find(x => x.id === m.vertical)!
  return (
    <div className="ba">
      <style dangerouslySetInnerHTML={{ __html: VP_CSS + CSS }} />
      <div className="vp-chips ba-chips" role="group" aria-label="Tipo de tarjeta">
        {MODELS.map((x, k) => (
          <button key={x.kind} type="button" className={`vp-chip${k === i ? ' is-on' : ''}`} aria-pressed={k === i} onClick={() => { setAuto(false); setI(k) }}>{x.label}</button>
        ))}
      </div>
      <div className="ba-grid" aria-live="polite">
        <div className="ba-panel">
          <div className="ba-tag">Hoy</div>
          <div className="ba-card" key={`p-${m.kind}`}><Paper kind={m.kind} /></div>
          <p className="ba-cap">{m.before}</p>
        </div>
        <div className="ba-panel ba-panel--on">
          <div className="ba-tag ba-tag--on">Con Stampa</div>
          <div className="ba-card" key={`s-${m.kind}`}><CardMock v={v} compact /></div>
          <p className="ba-cap">{m.after}</p>
        </div>
      </div>
    </div>
  )
}

const CSS = `
  .ba-chips{margin-bottom:24px;}
  .ba-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;}
  .ba-panel{display:flex;flex-direction:column;align-items:center;gap:18px;padding:28px 24px;border-radius:var(--radius-2xl);border:1px solid var(--border);background:rgba(255,255,255,.03);}
  .ba-panel--on{border-color:var(--ember-glow);}
  .ba-tag{font-size:var(--text-2xs);font-weight:700;letter-spacing:var(--tracking-eyebrow);text-transform:uppercase;color:var(--text-body);opacity:.75;}
  .ba-tag--on{color:var(--ember-300);opacity:1;}
  .ba-card{width:300px;max-width:100%;height:290px;display:flex;align-items:center;justify-content:center;animation:baIn .35s ease;}
  .ba-card .vp-pass{width:100%;height:100%;box-sizing:border-box;display:flex;flex-direction:column;box-shadow:0 18px 44px rgba(0,0,0,.3);}
  .ba-card .vp-pass-strip{flex:1;}
  .ba-cap{margin:0;font-size:var(--text-base);line-height:var(--leading-body);color:var(--text-body);text-align:center;max-width:34ch;min-height:3.2em;}
  @keyframes baIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;}}

  .ba-paper{width:100%;height:100%;box-sizing:border-box;border-radius:18px;padding:18px;background:#EFE6D3;color:#6B2D1F;border:1px solid #DCCDB1;display:flex;flex-direction:column;}
  .ba-paper-biz{font-family:var(--font-display);font-weight:800;font-size:15px;letter-spacing:.04em;}
  .ba-paper-stamps{flex:1;display:grid;grid-template-columns:repeat(5,1fr);gap:12px;justify-items:center;align-content:center;}
  .ba-paper-stamps span{width:34px;height:34px;border-radius:50%;border:2px dashed rgba(107,45,31,.4);box-sizing:border-box;}
  .ba-paper-stamps span.is-on{background:rgba(107,45,31,.6);border:2px solid rgba(107,45,31,.6);}
  .ba-paper-foot{font-size:13px;opacity:.75;}
  .ba-sheet{flex:1;display:flex;flex-direction:column;justify-content:center;gap:10px;font-family:'Courier New',monospace;font-size:14px;}
  .ba-sheet div{display:flex;align-items:baseline;gap:6px;}
  .ba-sheet i{flex:1;border-bottom:1.5px dotted rgba(107,45,31,.45);}
  .ba-carnet{flex:1;display:flex;flex-direction:column;justify-content:center;gap:14px;font-size:14px;}
  .ba-carnet div{display:flex;align-items:baseline;gap:8px;}
  .ba-carnet span{opacity:.75;white-space:nowrap;}
  .ba-carnet b{font-family:'Courier New',monospace;font-size:16px;}
  .ba-carnet i{flex:1;border-bottom:1.5px solid rgba(107,45,31,.4);}

  @media (max-width:760px){
    .ba-grid{grid-template-columns:minmax(0,1fr);}
    .ba-panel{padding:22px 16px;}
    .ba-card{height:250px;}
  }
  @media (prefers-reduced-motion:reduce){.ba-card{animation:none;}}
`
