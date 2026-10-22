// La tarjeta como se ve en Apple Wallet, en los tres modelos: arriba el
// nombre y el dato principal, en el medio sellos / puntos / nivel, abajo
// titular y WhatsApp, y el QR. El QR es decorativo (no lleva a nada).
import { Icon } from '@/components/ui/Icon'
import type { Biz } from './data'

export function Pass({ b, width = 260, qr = true, className }: { b: Biz; width?: number; qr?: boolean; className?: string }) {
  const style = { background: b.color, ['--c' as string]: b.color, ['--pw' as string]: `${width}px` } as React.CSSProperties
  return (
    <div className={`l2-pass${className ? ' ' + className : ''}`} style={style}>
      <div className="l2-pass-h"><span className="l2-pass-n">{b.name}</span><div className="l2-f l2-r"><span>{b.head[0]}</span><b>{b.head[1]}</b></div></div>
      {b.model === 'puntos' ? (
        <div className="l2-pts"><div><b>{b.points}</b><small>puntos</small></div><span>{b.next}</span></div>
      ) : b.model === 'membresia' && b.tier ? (
        <div className="l2-tier"><div className="l2-tl"><span>{b.tier[0]}</span><span style={{ opacity: .7 }}>{b.tier[1]}</span></div><div className="l2-bar"><i style={{ width: `${b.tier[2]}%` }} /></div><small>{b.tier[3]}</small></div>
      ) : (
        <div className="l2-strip">{Array.from({ length: 8 }, (_, i) => <i key={i} className={i < (b.stamps ?? 0) ? 'on' : ''}><Icon name={b.icon} size={14} /></i>)}</div>
      )}
      <div className="l2-pass-row"><div className="l2-f"><span>TITULAR</span><b>{b.who}</b></div><div className="l2-f l2-r"><span>{b.wa}</span><b>WhatsApp ⓘ</b></div></div>
      {qr && <div className="l2-qr"><FakeQr seed={b.name} /></div>}
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
