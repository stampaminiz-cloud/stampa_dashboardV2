// Estilos de la tarjeta (Pass). Aparte de styles.ts porque también la usan
// Ingresar, Crear cuenta y el onboarding, que no cargan el CSS de la landing.
export const PASS_CSS = `
.l2-pass{--bg:#333;--fg:#fff;width:var(--pw,240px);border-radius:calc(var(--pw,240px)*.09);padding:calc(var(--pw,240px)*.08);color:var(--fg);background:var(--bg);box-shadow:0 24px 44px -22px rgba(0,0,0,.5);flex-shrink:0;font-family:-apple-system,'Helvetica Neue',system-ui,sans-serif;display:flex;flex-direction:column;gap:calc(var(--pw,240px)*.07);transition:background .25s cubic-bezier(.2,.8,.2,1)}
.l2-p-logo{display:flex;align-items:center;gap:calc(var(--pw,240px)*.04)}
.l2-p-logo>div{min-width:0}
.l2-p-ring{width:calc(var(--pw,240px)*.15);aspect-ratio:1;border-radius:50%;border:1.5px solid currentColor;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:Georgia,'Times New Roman',serif;font-size:calc(var(--pw,240px)*.07)}
.l2-p-ring{overflow:hidden}
.l2-p-ring img{width:100%;height:100%;object-fit:cover}
.l2-p-name{font-family:Georgia,'Times New Roman',serif;font-size:calc(var(--pw,240px)*.07);letter-spacing:.08em;text-transform:uppercase;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.l2-p-sub{font-size:calc(var(--pw,240px)*.031);letter-spacing:.14em;opacity:.65;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.l2-p-dots{display:grid;grid-template-columns:repeat(4,1fr);gap:calc(var(--pw,240px)*.07) 0;justify-items:center;padding:calc(var(--pw,240px)*.04) 0}
.l2-p-dots i{width:calc(var(--pw,240px)*.105);aspect-ratio:1;border-radius:50%;background:currentColor;opacity:.28}
.l2-p-dots i.on{opacity:1}
.l2-p-dots i.new{animation:l2sello .28s cubic-bezier(.2,.8,.2,1)}
@keyframes l2sello{from{transform:scale(1.25);opacity:0}to{transform:none;opacity:1}}
.l2-p-row{display:flex;gap:calc(var(--pw,240px)*.08)}
.l2-p-f{min-width:0}
.l2-p-f span{display:block;font-size:calc(var(--pw,240px)*.032);letter-spacing:.1em;font-weight:700;opacity:.65}
.l2-p-f b{display:block;font-size:calc(var(--pw,240px)*.058);font-weight:700;line-height:1.15;margin-top:2px}
.l2-p-qr{background:#fff;border-radius:calc(var(--pw,240px)*.045);padding:calc(var(--pw,240px)*.045);display:flex;justify-content:center}
.l2-p-qr svg{width:42%;height:auto;display:block}
.l2-p-big{display:flex;align-items:baseline;gap:calc(var(--pw,240px)*.025)}
.l2-p-big b{font-size:calc(var(--pw,240px)*.17);font-weight:800;line-height:1;letter-spacing:-.02em}
.l2-p-big span{font-size:calc(var(--pw,240px)*.065);font-weight:600}
.l2-p-bar{position:relative;height:calc(var(--pw,240px)*.018);background:color-mix(in srgb,currentColor 28%,transparent);border-radius:3px;margin:calc(var(--pw,240px)*.035) calc(var(--pw,240px)*.02) calc(var(--pw,240px)*.02)}
.l2-p-bar i{position:absolute;left:0;top:0;bottom:0;border-radius:3px;background:currentColor}
.l2-p-bar u{position:absolute;top:50%;width:calc(var(--pw,240px)*.04);aspect-ratio:1;border-radius:50%;background:currentColor;transform:translate(-50%,-50%)}
.l2-p-bar s{position:absolute;right:0;top:50%;width:calc(var(--pw,240px)*.036);aspect-ratio:1;border:2px solid currentColor;border-radius:50%;transform:translate(50%,-50%)}
.l2-p-cap{font-size:calc(var(--pw,240px)*.045);opacity:.75}
.l2-p-lad{position:relative;display:flex;padding-top:calc(var(--pw,240px)*.06)}
.l2-p-lad::before{content:"";position:absolute;left:12%;right:12%;top:calc(var(--pw,240px)*.105);height:2px;background:color-mix(in srgb,currentColor 28%,transparent)}
.l2-p-t{flex:1;display:flex;flex-direction:column;align-items:center;gap:calc(var(--pw,240px)*.02);font-size:calc(var(--pw,240px)*.05);opacity:.65;position:relative}
.l2-p-t em{height:calc(var(--pw,240px)*.09);display:flex;align-items:center;font-style:normal}
.l2-p-t i{width:calc(var(--pw,240px)*.055);aspect-ratio:1;border-radius:50%;background:currentColor;opacity:.4}
.l2-p-t.on{opacity:1;font-weight:700}
.l2-p-t.on i{opacity:1;width:calc(var(--pw,240px)*.085);box-shadow:0 0 0 calc(var(--pw,240px)*.022) color-mix(in srgb,currentColor 18%,transparent)}
.l2-p-pill{align-self:center;border:1.5px solid currentColor;border-radius:999px;padding:calc(var(--pw,240px)*.018) calc(var(--pw,240px)*.06);font-size:calc(var(--pw,240px)*.05);font-weight:700;text-align:center}
`
