// Landing → imagen del inicio: el pase de Apple Wallet tal como lo ve el
// cliente. La tira de sellos (public/assets/hero-pass-strip.png) sale del
// mismo código que arma los pases reales (buildPreviewImages del backend),
// con una tarjeta de ejemplo: Café Aurora, 8 sellos, ícono de taza.
import { QrMock } from './VerticalPicker'

export function HeroPass() {
  return (
    <div className="hp">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="hp-notif" aria-hidden="true">
        <span className="hp-notif-icon" />
        <div>
          <div className="hp-notif-top"><b>Café Aurora</b><span>ahora</span></div>
          <div>Sumaste un sello. Vas 3 de 8.</div>
        </div>
      </div>
      <div className="hp-pass" role="img" aria-label="Tarjeta de sellos de Café Aurora en Apple Wallet: 3 de 8 sellos">
        <div className="hp-head">
          <span className="hp-logo">Café Aurora</span>
          <div className="hp-field hp-right"><span>SELLOS</span><b>3 de 8</b></div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="hp-strip" src="/assets/hero-pass-strip.png" alt="" />
        <div className="hp-fields">
          <div className="hp-field"><span>CLIENTE</span><b>Sofía Ríos</b></div>
          <div className="hp-field hp-right"><span>PREMIO</span><b>Café de especialidad</b></div>
        </div>
        <QrMock />
      </div>
    </div>
  )
}

const CSS = `
  .hp{position:relative;width:100%;max-width:340px;margin:0 auto;padding-top:34px;}
  .hp *{box-sizing:border-box;}
  .hp-pass{background:#6B2D1F;border-radius:16px;padding:14px 0 18px;color:#fff;box-shadow:0 30px 60px -20px rgba(0,0,0,.55);font-family:-apple-system,system-ui,sans-serif;}
  .hp-head{display:flex;justify-content:space-between;align-items:center;padding:0 16px 12px;}
  .hp-logo{font-weight:700;font-size:19px;letter-spacing:-.01em;}
  .hp-field{display:flex;flex-direction:column;gap:2px;}
  .hp-field span{font-size:10px;font-weight:600;letter-spacing:.04em;color:#F3D9C8;}
  .hp-field b{font-size:16px;font-weight:500;}
  .hp-right{text-align:right;}
  .hp-strip{display:block;width:100%;aspect-ratio:375/200;}
  .hp-fields{display:flex;justify-content:space-between;gap:12px;padding:14px 16px 0;}
  .hp .vp-qr{display:block;width:118px;height:118px;margin:18px auto 0;border-radius:10px;shape-rendering:crispEdges;}
  .hp-notif{position:absolute;top:0;right:-28px;z-index:1;width:250px;background:rgba(250,248,244,.96);color:#1b1b1b;border-radius:14px;padding:9px 11px;display:flex;gap:9px;align-items:center;font-size:12px;line-height:1.35;box-shadow:0 12px 30px -10px rgba(0,0,0,.45);font-family:-apple-system,system-ui,sans-serif;}
  .hp-notif-icon{width:28px;height:28px;border-radius:7px;background:#6B2D1F;flex-shrink:0;}
  .hp-notif-top{display:flex;justify-content:space-between;gap:8px;}
  .hp-notif-top span{color:#777;}
  @media (max-width:600px){.hp-notif{right:-6px;width:230px;}}
`
