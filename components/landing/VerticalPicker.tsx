'use client';

// Landing → "Así se vería tu tarjeta": el visitante elige su rubro y ve una
// tarjeta de ejemplo de ese rubro, dibujada como el pase real (sellos,
// puntos con marcas por premio, o escalera de niveles). Reemplaza la grilla
// de 8 tarjetas con iniciales: mostrar el producto en vez de describirlo.
import { useState } from 'react';

type Stamp = { kind: 'stamp'; total: number; earned: number; prize: string };
type Points = { kind: 'points'; balance: number; costs: number[]; next: string };
type Tiers = { kind: 'tiers'; tiers: string[]; current: number; perk: string };
type Vertical = { id: string; label: string; business: string; color: string; headline: string; detail: string; card: Stamp | Points | Tiers };

const VERTICALS: Vertical[] = [
  { id: 'cafe', label: 'Cafetería', business: 'Café Luna', color: '#6B2D1F',
    headline: 'Diez cafés, el próximo invita la casa.',
    detail: 'Tarjeta de sellos. Cuando le falta uno, le llega un aviso al celular.',
    card: { kind: 'stamp', total: 10, earned: 7, prize: 'Flat white' } },
  { id: 'resto', label: 'Restaurante', business: 'Cantina Roma', color: '#7A2E2E',
    headline: 'Cada cena suma puntos para el postre de la casa.',
    detail: 'Tarjeta de puntos con un catálogo de premios: se canjean en la mesa.',
    card: { kind: 'points', balance: 340, costs: [150, 400, 900], next: 'Postre de la casa' } },
  { id: 'pelu', label: 'Peluquería', business: 'Studio Nina', color: '#3D3350',
    headline: 'Clienta Oro: lavado de regalo en cada visita.',
    detail: 'Membresía por niveles: cuanto más viene, mejor el beneficio.',
    card: { kind: 'tiers', tiers: ['Bronce', 'Plata', 'Oro'], current: 2, perk: 'Lavado de regalo' } },
  { id: 'gym', label: 'Gimnasio', business: 'Fit Gym', color: '#1F3A5F',
    headline: '12 clases este mes y subís a Plata.',
    detail: 'Membresía por asistencia: el nivel premia la constancia.',
    card: { kind: 'tiers', tiers: ['Base', 'Plata', 'Oro'], current: 1, perk: 'Una clase de invitado por mes' } },
  { id: 'pan', label: 'Panadería', business: 'La Espiga', color: '#8A5A2B',
    headline: 'Seis compras y la docena de medialunas va por la casa.',
    detail: 'Tarjeta de sellos: un sello por compra, sin papelitos que se pierden.',
    card: { kind: 'stamp', total: 6, earned: 4, prize: 'Docena de medialunas' } },
  { id: 'spa', label: 'Spa', business: 'Spa Agua', color: '#2F5D57',
    headline: 'Cada tratamiento suma para el próximo masaje.',
    detail: 'Tarjeta de puntos: el cliente ve cuánto le falta en su Wallet.',
    card: { kind: 'points', balance: 180, costs: [100, 250, 500], next: 'Masaje de 30 minutos' } },
  { id: 'ropa', label: 'Ropa', business: 'Atelier Sur', color: '#2B2620',
    headline: 'Cada compra suma puntos para tu próximo descuento.',
    detail: 'Tarjeta de puntos: descuentos que traen de vuelta a la tienda.',
    card: { kind: 'points', balance: 820, costs: [500, 1000, 2000], next: '15% de descuento' } },
  { id: 'libro', label: 'Librería', business: 'Libros del Puerto', color: '#1E4D3A',
    headline: 'Seis libros comprados, el séptimo lo elegís gratis.',
    detail: 'Tarjeta de sellos: el premio lo elige cada lector.',
    card: { kind: 'stamp', total: 6, earned: 4, prize: 'Un libro a elección' } },
];

// Un QR de adorno (no se escanea): 21×21 con los tres cuadros de las esquinas
// y el resto armado con una secuencia fija, para que parezca un QR real.
export function QrMock() {
  const N = 21
  const finder = (x: number, y: number) => {
    for (const [fx, fy] of [[0, 0], [N - 7, 0], [0, N - 7]]) {
      const dx = x - fx, dy = y - fy
      if (dx >= 0 && dx < 7 && dy >= 0 && dy < 7) return dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4) ? 1 : 0
      if (dx >= -1 && dx <= 7 && dy >= -1 && dy <= 7) return 0
    }
    return null
  }
  const cells: [number, number][] = []
  let seed = 7
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const f = finder(x, y)
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    if (f === 1 || (f === null && seed % 100 < 47)) cells.push([x, y])
  }
  return (
    <svg className="vp-qr" viewBox={`-2 -2 ${N + 4} ${N + 4}`} aria-hidden="true">
      <rect x="-2" y="-2" width={N + 4} height={N + 4} fill="#fff" />
      {cells.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#1b1b1b" />)}
    </svg>
  )
}

function CardMock({ v }: { v: Vertical }) {
  const c = v.card;
  return (
    <div className="vp-pass" style={{ background: v.color }} aria-label={`Tarjeta de ejemplo de ${v.business}`}>
      <div className="vp-pass-biz">{v.business.toUpperCase()}</div>
      <div className="vp-pass-strip">
        {c.kind === 'stamp' && (
          <div className="vp-stamps" style={{ gridTemplateColumns: `repeat(${Math.min(c.total, 5)}, 1fr)` }}>
            {Array.from({ length: c.total }, (_, i) => <span key={i} className={`vp-stamp${i < c.earned ? ' is-on' : ''}`} />)}
          </div>
        )}
        {c.kind === 'points' && (() => {
          const max = Math.max(...c.costs)
          const nextCost = c.costs.find(x => x > c.balance) ?? max
          return (
            <>
              <div className="vp-pts"><b>{c.balance.toLocaleString('es-AR')}</b> puntos</div>
              <div className="vp-bar">
                <span className="vp-bar-fill" style={{ width: `${Math.min(100, (c.balance / max) * 100)}%` }} />
                {c.costs.map(x => <span key={x} className={`vp-mark${x <= c.balance ? ' is-on' : ''}`} style={{ left: `clamp(6px, ${(x / max) * 100}%, calc(100% - 6px))`, background: x <= c.balance ? '#fff' : v.color }} />)}
              </div>
              <div className="vp-cap">Faltan {nextCost - c.balance} para {c.next}</div>
            </>
          )
        })()}
        {c.kind === 'tiers' && (
          <div className="vp-ladder">
            <div className="vp-steps" style={{ gridTemplateColumns: `repeat(${c.tiers.length}, 1fr)` }}>
              <span className="vp-track" style={{ left: `${50 / c.tiers.length}%`, right: `${50 / c.tiers.length}%` }}>
                <span style={{ width: `${(c.current / (c.tiers.length - 1)) * 100}%` }} />
              </span>
              {c.tiers.map((t, i) => (
                <span key={t} className={`vp-step${i <= c.current ? ' is-done' : ''}${i === c.current ? ' is-on' : ''}`}><i />{t}</span>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="vp-fields">
        <div><div className="vp-l">TITULAR</div><div className="vp-v">Sofía Ríos</div></div>
        <div><div className="vp-l">{c.kind === 'stamp' ? 'PREMIO' : c.kind === 'points' ? 'VISITAS' : 'BENEFICIO'}</div><div className="vp-v">{c.kind === 'stamp' ? c.prize : c.kind === 'points' ? '14' : c.perk}</div></div>
      </div>
      <QrMock />
    </div>
  )
}

export function VerticalPicker() {
  const [id, setId] = useState(VERTICALS[0].id)
  const v = VERTICALS.find(x => x.id === id) || VERTICALS[0]
  return (
    <div className="vp">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="vp-left">
        <div className="vp-chips" role="group" aria-label="Elegí tu rubro">
          {VERTICALS.map(x => (
            <button key={x.id} type="button" className={`vp-chip${x.id === id ? ' is-on' : ''}`} aria-pressed={x.id === id} onClick={() => setId(x.id)}>{x.label}</button>
          ))}
        </div>
        <p className="vp-headline" aria-live="polite">{v.headline}</p>
        <p className="vp-detail">{v.detail}</p>
        <p className="vp-note">Es un ejemplo: la tuya lleva tu logo, tus colores y tus premios.</p>
      </div>
      <div className="vp-right"><CardMock v={v} /></div>
    </div>
  )
}

const CSS = `
  .vp{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:48px;align-items:center;}
  .vp-chips{display:flex;flex-wrap:wrap;gap:8px;}
  .vp-chip{font-family:var(--font-sans);font-size:15px;font-weight:500;color:var(--text-body);background:transparent;border:1px solid var(--border);border-radius:999px;padding:9px 16px;cursor:pointer;transition:background .15s,color .15s,border-color .15s;}
  .vp-chip:hover{border-color:var(--text-body);color:var(--text-strong);}
  .vp-chip:focus-visible{outline:2px solid var(--stampa-ember);outline-offset:2px;}
  .vp-chip.is-on{background:var(--text-strong);color:var(--stampa-ink);border-color:var(--text-strong);}
  .vp-headline{font-family:var(--font-display);font-weight:700;font-size:28px;line-height:1.2;color:var(--text-strong);margin:32px 0 10px;text-wrap:balance;}
  .vp-detail{font-size:17px;line-height:1.6;color:var(--text-body);margin:0;max-width:52ch;}
  .vp-note{font-size:14px;color:var(--text-body);opacity:.7;margin:18px 0 0;}
  .vp-right{display:flex;justify-content:center;}
  .vp-pass{width:300px;max-width:100%;border-radius:18px;padding:18px 18px 20px;color:#fff;box-shadow:0 24px 60px rgba(0,0,0,.35);transition:background .3s;}
  .vp-pass-biz{font-family:var(--font-display);font-weight:800;font-size:15px;letter-spacing:.04em;}
  .vp-pass-strip{min-height:132px;display:flex;flex-direction:column;justify-content:center;margin:14px 0;}
  .vp-stamps{display:grid;gap:12px;justify-items:center;}
  .vp-stamp{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.22);}
  .vp-stamp.is-on{background:#fff;}
  .vp-pts{font-size:15px;font-weight:600;}
  .vp-pts b{font-family:var(--font-display);font-size:40px;font-weight:800;margin-right:4px;}
  .vp-bar{position:relative;height:8px;border-radius:4px;background:rgba(255,255,255,.25);margin:12px 0 10px;}
  .vp-bar-fill{position:absolute;left:0;top:0;bottom:0;border-radius:4px;background:#fff;}
  .vp-mark{position:absolute;top:50%;width:14px;height:14px;border-radius:50%;transform:translate(-50%,-50%);border:2.5px solid #fff;box-sizing:border-box;}
  .vp-cap{font-size:13px;opacity:.9;}
  .vp-steps{position:relative;display:grid;}
  .vp-track{position:absolute;top:9px;height:3px;background:rgba(255,255,255,.3);border-radius:2px;}
  .vp-track span{display:block;height:3px;background:#fff;border-radius:2px;}
  .vp-step{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;font-size:13px;opacity:.65;}
  .vp-step i{width:20px;height:20px;border-radius:50%;background:rgba(255,255,255,.35);}
  .vp-step.is-done i{background:#fff;}
  .vp-step.is-on{opacity:1;font-weight:700;}
  .vp-step.is-on i{box-shadow:0 0 0 5px rgba(255,255,255,.25);}
  .vp-fields{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
  .vp-l{font-size:10px;letter-spacing:.06em;opacity:.75;}
  .vp-v{font-size:15px;margin-top:2px;}
  .vp-qr{display:block;width:104px;height:104px;margin:18px auto 0;border-radius:10px;shape-rendering:crispEdges;}
  @media(max-width:860px){
    .vp{grid-template-columns:minmax(0,1fr);gap:28px;}
    .vp-chips{flex-wrap:nowrap;overflow-x:auto;padding-bottom:4px;scrollbar-width:none;}
    .vp-chips::-webkit-scrollbar{display:none;}
    .vp-chip{flex-shrink:0;}
    .vp-headline{font-size:23px;margin-top:22px;}
  }
  @media(prefers-reduced-motion:reduce){.vp-pass,.vp-chip{transition:none;}}
`
