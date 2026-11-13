// La tarjeta como se ve en Apple Wallet, copiada del pase real que arma el
// backend: logo arriba, sellos como puntos llenos o translúcidos (sin
// íconos), puntos con barra y perilla, membresía con la escalera de niveles
// y el QR en un panel blanco. El QR es decorativo (no lleva a nada).
import type { Biz } from './data'

const TIERS = ['Bronce', 'Plata', 'Oro', 'Black']

export function Pass({ b, width = 260, qr = true, className, fresh = false }: { b: Biz; width?: number; qr?: boolean; className?: string; fresh?: boolean }) {
  const style = { ['--bg' as string]: b.color, ['--fg' as string]: b.fg || '#fff', ['--pw' as string]: `${width}px` } as React.CSSProperties
  const prize = b.prize || (b.head[0] === 'PRÓXIMO PREMIO' ? b.head[1] : 'Un regalo')
  const stamps = b.stamps ?? 0

  let tiers = TIERS, idx = b.tier ? TIERS.indexOf(b.tier[0]) : -1
  if (b.tier && idx < 0) { tiers = [b.tier[0], b.tier[1]]; idx = 0 }

  return (
    <div className={`l2-pass${className ? ' ' + className : ''}`} style={style}>
      <div className="l2-p-logo">
        <span className="l2-p-ring">{b.logo ? <img src={b.logo} alt="" /> : (b.name[0] || 'T').toUpperCase()}</span>
        <div><div className="l2-p-name">{b.name}</div>{b.sub && <div className="l2-p-sub">{b.sub}</div>}</div>
      </div>

      {b.model === 'puntos' ? (
        <div>
          <div className="l2-p-big"><b>{b.points}</b><span>puntos</span></div>
          <div className="l2-p-bar"><i style={{ width: '62%' }} /><u style={{ left: '62%' }} /><s /></div>
          <div className="l2-p-cap">{b.next} para {prize}</div>
        </div>
      ) : b.model === 'membresia' && b.tier ? (
        <>
          <div className="l2-p-lad">{tiers.map((t, i) => <div key={t} className={`l2-p-t${i === idx ? ' on' : ''}`}><em><i /></em>{t}</div>)}</div>
          <div className="l2-p-pill">{b.tier[3]}</div>
        </>
      ) : (
        <div className="l2-p-dots">{Array.from({ length: 8 }, (_, i) => <i key={i} className={`${i < stamps ? 'on' : ''}${fresh && i === stamps - 1 ? ' new' : ''}`} />)}</div>
      )}

      <div className="l2-p-row">
        <div className="l2-p-f"><span>TITULAR</span><b>{b.who}</b></div>
        {b.model === 'puntos' ? <div className="l2-p-f"><span>VISITAS</span><b>14</b></div>
          : b.model !== 'membresia' && <div className="l2-p-f"><span>PREMIO</span><b>{prize}</b></div>}
      </div>

      {qr && <div className="l2-p-qr"><FakeQr seed={b.name} /></div>}
    </div>
  )
}

// QR de mentira con pinta de QR: siempre el mismo dibujo para el mismo texto.
export function FakeQr({ seed }: { seed: string }) {
  let h = 0
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const rnd = () => { h ^= h << 13; h >>>= 0; h ^= h >> 17; h ^= h << 5; h >>>= 0; return h / 4294967296 }
  const n = 21, cells: React.ReactNode[] = []
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const finder = (x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)
    if (!finder && rnd() > .52) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#1E1D1A" />)
  }
  const finder = (x: number, y: number) => <g key={`f${x}${y}`}><rect x={x} y={y} width="7" height="7" fill="#1E1D1A" /><rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" /><rect x={x + 2} y={y + 2} width="3" height="3" fill="#1E1D1A" /></g>
  return <svg viewBox={`0 0 ${n} ${n}`} shapeRendering="crispEdges" aria-hidden="true">{cells}{finder(0, 0)}{finder(14, 0)}{finder(0, 14)}</svg>
}
