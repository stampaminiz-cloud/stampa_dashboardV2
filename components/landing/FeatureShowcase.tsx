'use client'

// Landing → "Lo que pasa después de que el cliente guarda la tarjeta": cuatro
// tarjetas que giran. Adelante, un dibujo de la pantalla real (panel, app de
// escaneo, notificación, sucursales) y lo que gana el comercio; atrás, el
// detalle. Giran al pasar el mouse (computadora) o al tocarlas (celular y
// teclado), y aparecen con una animación suave al bajar por la página. Con
// "reducir movimiento" no hay animaciones. Los datos son de ejemplo.
import { useEffect, useRef, useState } from 'react'

const EXTRAS = ['regalo de cumpleaños', 'días con sello doble', 'vencimiento por inactividad', 'formulario a medida', 'roles para el equipo', 'resumen semanal por mail']

function PanelShot() {
  const bars = [38, 52, 46, 64, 58, 72, 61, 84]
  return (
    <div className="fs-shot fs-panel">
      <div className="fs-panel-top"><b>Inicio</b><span>Últimos 30 días</span></div>
      <div className="fs-metrics">
        <div><span>Clientes que vuelven</span><b>62%</b></div>
        <div><span>Sin venir hace 30 días</span><b className="fs-warn">18</b></div>
      </div>
      <div className="fs-chart">
        {bars.map((h, i) => <i key={i} style={{ height: `${h}%` }} className={i === bars.length - 1 ? 'is-on' : ''} />)}
      </div>
    </div>
  )
}

function ScannerShot() {
  return (
    <div className="fs-shot fs-center fs-sand">
      <div className="fs-phone">
        <div className="fs-phone-screen" style={{ background: '#6B2D1F' }}>
          <div className="fs-app-card">CAFÉ LUNA</div>
          <div className="fs-app-name">Lucía Fernández</div>
          <div className="fs-app-stamps">
            {Array.from({ length: 10 }, (_, i) => <i key={i} className={i < 7 ? 'is-on' : ''} />)}
          </div>
          <div className="fs-app-count">7 de 10 · le faltan 3</div>
          <div className="fs-app-undo"><span>Sello sumado</span><b>Deshacer</b></div>
        </div>
      </div>
    </div>
  )
}

function NotificationShot() {
  return (
    <div className="fs-shot fs-lock">
      <div className="fs-lock-time">9:41</div>
      <div className="fs-lock-date">martes 13 de octubre</div>
      <div className="fs-notif">
        <span className="fs-notif-icon" />
        <div>
          <div className="fs-notif-top"><b>Café Luna</b><span>ahora</span></div>
          <div className="fs-notif-text">Te extrañamos. Esta semana cada café suma doble.</div>
        </div>
      </div>
    </div>
  )
}

function BranchesShot() {
  const rows = [
    { name: 'Centro', state: 'Abierto · 8 a 21', open: true, n: 412 },
    { name: 'Palermo', state: 'Abierto · 9 a 20', open: true, n: 286 },
    { name: 'Belgrano', state: 'Cerrado · abre 16 h', open: false, n: 154 },
  ]
  return (
    <div className="fs-shot fs-panel">
      <div className="fs-panel-top"><b>Sucursales</b><span>3 de 3</span></div>
      <div className="fs-branches">
        {rows.map(r => (
          <div key={r.name} className="fs-branch">
            <div><b>{r.name}</b><span className={r.open ? 'fs-open' : 'fs-closed'}>{r.state}</span></div>
            <em>{r.n} visitas</em>
          </div>
        ))}
      </div>
    </div>
  )
}

const BLOCKS = [
  { shot: <PanelShot />, kicker: 'Panel', title: 'Sabés quién vuelve y quién no', points: ['Visitas por día y por hora', 'Clientes nuevos y los que volvieron', 'Quién hace un mes que no viene', 'Todo sin armar planillas'] },
  { shot: <ScannerShot />, kicker: 'App de escaneo', title: 'Tu equipo suma en segundos', points: ['Escanea el QR o busca al cliente por nombre', 'Suma sellos, puntos o visitas y entrega premios', 'Cada empleado entra con su PIN', 'Queda registrado quién escaneó'] },
  { shot: <NotificationShot />, kicker: 'Notificaciones', title: 'Le escribís al que dejó de venir', points: ['A todos o a un grupo: los que no vienen o los que están cerca del premio', 'Llega a la pantalla bloqueada, sin app', 'Las podés programar para otro día'] },
  { shot: <BranchesShot />, kicker: 'Sucursales', title: 'Una tarjeta para todos tus locales', points: ['El cliente suma en cualquiera de tus locales', 'Cada celular escanea en su sucursal', 'Ves cómo anda cada local por separado'] },
]

function FlipCard({ b, i }: { b: (typeof BLOCKS)[number]; i: number }) {
  const [flipped, setFlipped] = useState(false)
  return (
    <article
      className={`fs-flip${flipped ? ' is-flipped' : ''}`}
      style={{ ['--i' as string]: i }}
      tabIndex={0}
      role="button"
      aria-pressed={flipped}
      aria-label={`${b.title}. ${flipped ? 'Mostrando el detalle' : 'Tocá para ver el detalle'}`}
      onClick={() => setFlipped(f => !f)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFlipped(f => !f) } }}
    >
      <div className="fs-inner">
        <div className="fs-face fs-front">
          {b.shot}
          <div className="fs-text">
            <h3>{b.title}</h3>
            <span className="fs-more">Ver más <span aria-hidden="true">↻</span></span>
          </div>
        </div>
        <div className="fs-face fs-back" aria-hidden={!flipped}>
          <div className="fs-kicker">{b.kicker}</div>
          <h3>{b.title}</h3>
          <ul>{b.points.map(p => <li key={p}>{p}</li>)}</ul>
          <span className="fs-more">Volver <span aria-hidden="true">↺</span></span>
        </div>
      </div>
    </article>
  )
}

export function FeatureShowcase() {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) { setShown(true); return }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect() } }, { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div className="fs" ref={ref}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className={`fs-grid${shown ? ' is-in' : ''}`}>
        {BLOCKS.map((b, i) => <FlipCard key={b.title} b={b} i={i} />)}
      </div>
      <p className="fs-extras"><b>También:</b> {EXTRAS.join(' · ')}.</p>
    </div>
  )
}

const CSS = `
  .fs *{box-sizing:border-box;}
  .fs-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;}
  @media (max-width:820px){.fs-grid{grid-template-columns:minmax(0,1fr);}}
  @media (prefers-reduced-motion:reduce){.fs-flip{opacity:1;transform:none;transition:none;}.fs-inner{transition:none;}}
  .fs-flip{height:340px;perspective:1200px;cursor:pointer;outline:none;opacity:0;transform:translateY(18px);transition:opacity .55s ease,transform .55s ease;transition-delay:calc(var(--i) * 90ms);}
  .fs-grid.is-in .fs-flip{opacity:1;transform:none;}
  .fs-flip:focus-visible .fs-inner{box-shadow:0 0 0 2px var(--stampa-ember);border-radius:var(--radius-2xl);}
  .fs-inner{position:relative;width:100%;height:100%;transition:transform .6s cubic-bezier(.3,.7,.3,1);transform-style:preserve-3d;}
  .fs-flip.is-flipped .fs-inner{transform:rotateY(180deg);}
  @media (hover:hover){.fs-flip:hover .fs-inner{transform:rotateY(180deg);}.fs-flip.is-flipped:hover .fs-inner{transform:rotateY(180deg);}}
  .fs-face{position:absolute;inset:0;border-radius:var(--radius-2xl);backface-visibility:hidden;-webkit-backface-visibility:hidden;overflow:hidden;display:flex;flex-direction:column;}
  .fs-front{background:rgba(255,255,255,0.04);border:1px solid var(--border);}
  .fs-back{background:#FBF6EE;color:#2B2620;transform:rotateY(180deg);padding:28px 28px 22px;border:1px solid rgba(199,93,58,.35);justify-content:center;}
  .fs-kicker{font-size:var(--text-2xs);font-weight:700;letter-spacing:var(--tracking-eyebrow);text-transform:uppercase;color:#C75D3A;margin-bottom:10px;}
  .fs-back h3{font-family:var(--font-display);font-weight:700;font-size:24px;color:#2B2620;margin:0 0 18px;}
  .fs-back ul{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:14px;}
  .fs-back li{position:relative;padding-left:24px;font-size:17px;line-height:1.45;color:rgba(43,38,32,.82);}
  .fs-back li::before{content:'';position:absolute;left:0;top:.5em;width:10px;height:10px;border-radius:50%;background:#C75D3A;}
  .fs-more{font-size:var(--text-sm);font-weight:700;color:var(--ember-300);}
  .fs-back .fs-more{color:#C75D3A;margin-top:auto;padding-top:16px;}
  .fs-back .fs-kicker{margin-top:auto;}
  .fs-text{padding:18px 24px 22px;display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex:1;}
  .fs-text h3{font-family:var(--font-display);font-weight:700;font-size:20px;color:var(--text-strong);margin:0;}
  .fs-text p{font-size:var(--text-base);color:var(--text-body);line-height:var(--leading-body);margin:0;}
  .fs-extras{margin:24px 0 0;padding:16px 24px;border:1px solid var(--border);border-radius:var(--radius-xl);font-size:var(--text-sm);color:var(--text-body);line-height:1.7;}
  .fs-extras b{color:var(--text-strong);}

  .fs-shot{height:220px;margin:14px 14px 0;border-radius:14px;overflow:hidden;font-family:system-ui,-apple-system,sans-serif;}
  .fs-center{display:flex;align-items:center;justify-content:center;}
  .fs-sand{background:#EDE4D3;}

  .fs-panel{background:#FBF6EE;color:#2B2620;padding:16px 18px;display:flex;flex-direction:column;gap:12px;}
  .fs-panel-top{display:flex;justify-content:space-between;align-items:baseline;}
  .fs-panel-top b{font-size:15px;}
  .fs-panel-top span{font-size:12px;color:rgba(43,38,32,0.6);background:#fff;border:1px solid rgba(43,38,32,0.12);border-radius:999px;padding:3px 10px;}
  .fs-metrics{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
  .fs-metrics div{background:#fff;border:1px solid rgba(43,38,32,0.1);border-radius:10px;padding:8px 10px;display:flex;flex-direction:column;gap:2px;}
  .fs-metrics span{font-size:11px;color:rgba(43,38,32,0.6);}
  .fs-metrics b{font-size:20px;}
  .fs-warn{color:#C75D3A;}
  .fs-chart{flex:1;display:flex;align-items:flex-end;gap:6px;min-height:0;}
  .fs-chart i{flex:1;background:#1B412F;border-radius:3px 3px 0 0;}
  .fs-chart i.is-on{background:#C75D3A;}

  .fs-phone{width:132px;height:204px;background:#141414;border-radius:20px;padding:5px;}
  .fs-phone-screen{height:100%;border-radius:15px;padding:12px 10px;display:flex;flex-direction:column;align-items:center;color:#fff;gap:6px;}
  .fs-app-card{font-size:9px;letter-spacing:.08em;opacity:.75;margin-top:4px;}
  .fs-app-name{font-size:12px;font-weight:700;text-align:center;}
  .fs-app-stamps{display:grid;grid-template-columns:repeat(5,1fr);gap:4px;margin-top:4px;}
  .fs-app-stamps i{width:14px;height:14px;border-radius:50%;border:1.5px solid rgba(255,255,255,.45);}
  .fs-app-stamps i.is-on{background:#fff;border-color:#fff;}
  .fs-app-count{font-size:9px;opacity:.8;}
  .fs-app-undo{margin-top:auto;width:100%;background:#2B2620;border-radius:8px;padding:6px 8px;display:flex;justify-content:space-between;font-size:8.5px;white-space:nowrap;gap:4px;}
  .fs-app-undo b{color:#F0A07E;}

  .fs-lock{background:#5E6B7E;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:18px;}
  .fs-lock-time{font-size:46px;font-weight:600;line-height:1;letter-spacing:-.02em;}
  .fs-lock-date{font-size:12px;opacity:.85;margin:6px 0 20px;}
  .fs-notif{width:100%;max-width:330px;background:rgba(255,255,255,.88);color:#1b1b1b;border-radius:14px;padding:10px 12px;display:flex;gap:10px;align-items:center;text-align:left;}
  .fs-notif-icon{width:30px;height:30px;border-radius:7px;background:#6B2D1F;flex-shrink:0;}
  .fs-notif-top{display:flex;justify-content:space-between;font-size:12px;}
  .fs-notif-top span{color:#666;}
  .fs-notif-text{font-size:12px;line-height:1.35;margin-top:1px;}

  .fs-branches{display:flex;flex-direction:column;background:#fff;border:1px solid rgba(43,38,32,0.1);border-radius:10px;flex:1;}
  .fs-branch{flex:1;display:flex;justify-content:space-between;align-items:center;padding:0 12px;border-bottom:1px solid rgba(43,38,32,0.08);}
  .fs-branch:last-child{border-bottom:0;}
  .fs-branch div{display:flex;flex-direction:column;}
  .fs-branch b{font-size:13px;}
  .fs-branch span{font-size:11px;}
  .fs-branch em{font-style:normal;font-size:11px;color:rgba(43,38,32,0.6);}
  .fs-open{color:#3E7A4C;}
  .fs-closed{color:rgba(43,38,32,0.5);}
`
