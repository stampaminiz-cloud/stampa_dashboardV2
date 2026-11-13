'use client'
// Marco de Ingresar y Crear cuenta: el mismo marco, colores y botones que la
// landing. A la izquierda el formulario (children); a la derecha la frase del
// rubro con la tarjeta que cambia. En el celular queda solo el formulario.
import { useEffect, useState } from 'react'
import { Pass } from '@/components/landing2/Pass'
import { SHOPS } from '@/components/landing2/data'
import { PASS_CSS } from '@/components/landing2/passStyles'

export const AUTH_CSS = PASS_CSS + `
*,*::before,*::after{box-sizing:border-box}
body{margin:0}
.au{min-height:100vh;background:#E4E6E0;padding:12px;font-family:var(--font-body);color:#1E1D1A;-webkit-font-smoothing:antialiased}
.au :where(h1,h2,p){margin:0}
.au-frame{max-width:1240px;margin:0 auto;background:#F7F7F4;border-radius:28px;padding:14px;min-height:calc(100vh - 24px);display:flex}
.au-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;width:100%}
.au-form{background:#fff;border-radius:20px;padding:clamp(22px,4vw,48px);display:flex;flex-direction:column;min-width:0}
.au-logo{align-self:flex-start;margin-bottom:24px;display:block}
.au-logo img{height:18px;width:auto;display:block}
.au-in{width:100%;max-width:380px;margin:auto;display:flex;flex-direction:column;gap:16px}
.au-in h1{font-family:var(--font-display);font-weight:800;font-size:clamp(28px,3vw,36px);letter-spacing:-.03em;line-height:1.05}
.au-sub{color:#5E5C55;margin-top:-8px!important;font-size:15px}
.au-fld{display:flex;flex-direction:column;gap:6px}
.au-fld label{font-size:14px;font-weight:600}
.au-input{width:100%;font:inherit;font-size:15px;padding:12px 14px;border:1.5px solid #E3E4DE;border-radius:12px;background:#F7F7F4;color:#1E1D1A;outline:0;transition:border-color .15s,background .15s}
.au-input:focus{border-color:#1B412F;background:#fff}
.au-input.bad{border-color:var(--s-error,#B23B3B)}
.au-ok{font-size:14px;color:#1F7A4A;background:rgba(31,122,74,.08);border:1px solid rgba(31,122,74,.25);border-radius:10px;padding:12px 14px;line-height:1.5}
.au-dev{display:block;font-size:12px;color:#8C8A81;word-break:break-all;margin-top:8px}
.au-err{font-size:13px;color:var(--s-error,#B23B3B);line-height:1.5}
.au-err a{color:inherit;font-weight:700}
.au-box{font-size:14px;color:var(--s-error,#B23B3B);background:rgba(178,59,59,.07);border:1px solid rgba(178,59,59,.2);border-radius:10px;padding:10px 14px}
.au-btn{width:100%;display:inline-flex;align-items:center;justify-content:center;gap:8px;border:0;border-radius:999px;padding:13px 20px;font:inherit;font-size:15px;font-weight:600;color:#fff;cursor:pointer;transition:background .15s}
.au-btn:disabled{opacity:.6;cursor:not-allowed}
.au-btn.pino{background:#1B412F}.au-btn.pino:hover:not(:disabled){background:#24533D}
.au-btn.brasa{background:#C75D3A}.au-btn.brasa:hover:not(:disabled){background:#B04F2F}
.au-link{color:#1B412F;font-weight:600;text-decoration:underline;text-underline-offset:3px}
.au-forgot{align-self:flex-end;font-size:14px}
.au-foot{font-size:14px;color:#5E5C55}
.au-plan{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;background:#EDEFE8;border-radius:12px;padding:10px 14px;font-size:14px}
.au-plan b{font-weight:700}
.au-note{font-size:13px;color:#8C8A81;margin-top:-6px!important}
.au-chk{display:flex;gap:10px;align-items:flex-start;font-size:13.5px;color:#5E5C55;cursor:pointer}
.au-chk input{margin-top:3px;accent-color:#1B412F;width:16px;height:16px;flex-shrink:0}
.au-side{background:#1B412F;border-radius:20px;display:flex;align-items:center;justify-content:center;padding:32px;overflow:hidden}
.au-side-in{display:flex;flex-direction:column;gap:24px;width:100%;max-width:400px;color:#fff}
.au-frase{font-family:var(--font-display);font-weight:800;font-size:clamp(28px,3.2vw,40px);line-height:1.06;letter-spacing:-.03em}
.au-frase em{font-style:normal;color:#E7C46A;display:inline-block;transition:opacity .2s cubic-bezier(.2,.8,.2,1)}
.au-frase em.out{opacity:0}
@media(max-width:860px){
  .au{padding:6px}
  .au-frame{border-radius:22px;padding:10px;min-height:calc(100vh - 12px)}
  .au-grid{grid-template-columns:1fr}
  .au-side{display:none}
}
@media (prefers-reduced-motion:reduce){.au *{transition:none!important;animation:none!important}}
`

function AuthSide() {
  const [i, setI] = useState(0)
  const [out, setOut] = useState(false)
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => { setOut(true); setTimeout(() => { setI(v => (v + 1) % SHOPS.length); setOut(false) }, 200) }, 2800)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="au-side" aria-hidden="true">
      <div className="au-side-in">
        <p className="au-frase">Llevamos <em className={out ? 'out' : ''}>{SHOPS[i].word}</em><br />al Wallet de tus clientes.</p>
        <Pass b={SHOPS[i]} width={250} />
      </div>
    </div>
  )
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: AUTH_CSS }} />
      <div className="au">
        <div className="au-frame">
          <div className="au-grid">
            <div className="au-form">
              <a href="/" className="au-logo" aria-label="Stampa, ir al inicio"><img src="/assets/wordmark.png" alt="Stampa" /></a>
              {children}
            </div>
            <AuthSide />
          </div>
        </div>
      </div>
    </>
  )
}
