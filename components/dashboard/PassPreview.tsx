'use client'
// Vista previa del pase con las imágenes reales que arma el backend (logo y
// franja de sellos / puntos / niveles), en el marco de Apple Wallet o de
// Google Wallet. La usa el onboarding; Diseño tiene la suya con más opciones.
import React from 'react'

export interface PassImages {
  apple: { logo: string | null; strip: string | null }
  google: { logo: string | null; hero: string | null }
  meta: { stampsText?: string; points?: number; tierName?: string; perk?: string }
}

const QR = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 21 21" shapeRendering="crispEdges" aria-hidden>
    <rect width="21" height="21" fill="#fff" />
    {[[0, 0], [14, 0], [0, 14]].map(([x, y]) => (
      <g key={`${x}-${y}`}><rect x={x} y={y} width="7" height="7" fill="#000" /><rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" /><rect x={x + 2} y={y + 2} width="3" height="3" fill="#000" /></g>
    ))}
    {[[9, 1], [10, 3], [8, 8], [11, 9], [9, 11], [13, 12], [15, 15], [17, 16], [12, 15], [16, 18], [9, 17], [18, 10]].map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="2" height="2" fill="#000" />)}
  </svg>
)

export function PassPreview({ platform, type, images, color, textColor = '#FFFFFF', businessName, cardName, rewardLabel, tier, whiteLabel = false }: {
  platform: 'apple' | 'google'
  type: 'stamp' | 'points' | 'membership'
  images: PassImages | null
  color: string
  textColor?: string
  businessName: string
  cardName: string
  rewardLabel?: string
  tier?: { name: string; perk?: string; color: string; bg: string } | null
  whiteLabel?: boolean
}) {
  const m = images?.meta || {}
  if (platform === 'apple') {
    const bg = type === 'membership' && tier ? tier.bg : color
    const tc = type === 'membership' && tier ? tier.color : textColor
    const second = type === 'stamp' ? { l: 'PREMIO', v: rewardLabel || 'Premio' } : type === 'points' ? { l: 'VISITAS', v: '14' } : null
    return (
      <div className="pp-apple" style={{ background: bg, color: tc }}>
        <style>{CSS}</style>
        <div className="pp-top">{images?.apple.logo ? <img src={images.apple.logo} alt="" className="pp-logo" /> : <div className="pp-logo pp-skel" />}</div>
        {images?.apple.strip ? <img src={images.apple.strip} alt="" className="pp-strip" /> : <div className="pp-strip pp-skel" style={{ aspectRatio: '375/144' }} />}
        <div className="pp-fields">
          <div><div className="pp-l">TITULAR</div><div className="pp-v">Nombre del cliente</div></div>
          {second && <div style={{ textAlign: 'right' }}><div className="pp-l">{second.l}</div><div className="pp-v">{second.v}</div></div>}
        </div>
        <div className="pp-qr"><QR size={88} />{!whiteLabel && <div className="pp-powered">Powered by Stampa</div>}</div>
      </div>
    )
  }
  const fields = type === 'stamp' ? [{ l: 'SELLOS', v: m.stampsText || '' }, { l: 'PREMIO', v: rewardLabel || 'Premio' }]
    : type === 'points' ? [{ l: 'VISITAS', v: '14' }]
    : [{ l: 'NIVEL', v: m.tierName || '' }, ...(m.perk ? [{ l: 'BENEFICIO', v: m.perk }] : [])]
  return (
    <div className="pp-google" style={{ background: color, color: textColor }}>
      <style>{CSS}</style>
      <div className="pp-g-head">
        {images?.google.logo ? <img src={images.google.logo} alt="" className="pp-g-logo" /> : <div className="pp-g-logo pp-skel" />}
        <span>{businessName}</span>
      </div>
      <div className="pp-g-title">{cardName}</div>
      {images?.google.hero ? <img src={images.google.hero} alt="" className="pp-strip" /> : <div className="pp-strip pp-skel" style={{ aspectRatio: '1032/336' }} />}
      <div className="pp-g-fields">
        <div><div className="pp-l">TITULAR</div><div className="pp-v">Nombre del cliente</div></div>
        {fields.map(f => <div key={f.l}><div className="pp-l">{f.l}</div><div className="pp-v">{f.v}</div></div>)}
      </div>
      <div className="pp-g-qr"><QR size={80} /></div>
    </div>
  )
}

const CSS = `
  .pp-apple,.pp-google{width:100%;max-width:300px;margin:0 auto;border-radius:18px;overflow:hidden;box-shadow:0 18px 50px rgba(43,38,32,.22);font-family:-apple-system,var(--font-body);}
  .pp-top{padding:20px 20px 10px;}
  .pp-logo{display:block;width:47%;height:auto;}
  .pp-logo.pp-skel{aspect-ratio:160/50;}
  .pp-skel{background:rgba(255,255,255,.18);}
  .pp-strip{display:block;width:100%;height:auto;}
  .pp-fields{display:flex;justify-content:space-between;gap:12px;padding:12px 20px 14px;}
  .pp-fields > div{min-width:0;}
  .pp-l{font-size:9px;font-weight:600;letter-spacing:.06em;opacity:.75;}
  .pp-v{font-size:14px;font-weight:500;line-height:1.25;}
  .pp-qr{margin:4px 20px 20px;background:#fff;border-radius:12px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:6px;}
  .pp-powered{font-size:10px;color:#8a8a8a;}
  .pp-g-head{display:flex;align-items:center;gap:10px;padding:16px 18px 6px;font-size:13px;}
  .pp-g-logo{width:28px;height:28px;border-radius:50%;object-fit:contain;background:rgba(255,255,255,.9);}
  .pp-g-title{font-size:20px;font-weight:500;padding:4px 18px 12px;}
  .pp-g-fields{display:flex;gap:16px;padding:14px 18px 10px;flex-wrap:wrap;}
  .pp-g-qr{display:flex;justify-content:center;padding:6px 0 20px;}
  .pp-g-qr svg{border-radius:10px;border:8px solid #fff;box-sizing:content-box;}
`
