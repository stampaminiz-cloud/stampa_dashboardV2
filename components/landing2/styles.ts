// Estilos de la landing (y de Empresas). Todo cuelga de .l2 para no
// mezclarse con el panel. Colores de Stampa; tipografías del layout
// (--font-display / --font-body).
export const CSS = `
.l2{--l2-pino:#1B412F;--l2-pino2:#24533D;--l2-brasa:#C75D3A;--l2-brasa2:#B04F2F;--l2-mostaza:#E7C46A;--l2-salvia:#EDEFE8;--l2-fondo:#E4E6E0;--l2-papel:#F7F7F4;--l2-tinta:#1E1D1A;--l2-t2:#5E5C55;--l2-t3:#9A988F;--l2-linea:#E3E4DE;--l2-wa:#1F7A4A;--l2-r:20px;
  background:var(--l2-fondo);color:var(--l2-tinta);font-family:var(--font-body);-webkit-font-smoothing:antialiased;min-height:100vh;padding:12px 0}
.l2 *{box-sizing:border-box}
.l2 img{display:block;max-width:100%}
.l2 a{color:inherit;text-decoration:none}
.l2 button{font:inherit;cursor:pointer}
.l2 h1,.l2 h2,.l2 h3,.l2 p,.l2 ul,.l2 blockquote{margin:0;padding:0}
.l2-frame{max-width:1240px;margin:0 auto;background:var(--l2-papel);border-radius:28px;padding:14px;overflow:hidden}
@media(max-width:700px){.l2{padding:6px 0}.l2-frame{margin:0 6px;border-radius:22px;padding:10px}}

/* Menú */
.l2-nav{position:sticky;top:10px;z-index:30;display:flex;align-items:center;justify-content:space-between;gap:12px;background:rgba(255,255,255,.92);backdrop-filter:blur(8px);border-radius:999px;padding:7px 7px 7px 18px;max-width:820px;margin:0 auto;box-shadow:0 1px 0 var(--l2-linea)}
.l2-brand img{height:18px;width:auto}
.l2-links{display:flex;gap:22px;font-size:14px;color:var(--l2-t2)}
.l2-links a:hover{color:var(--l2-tinta)}
.l2-nav-r{display:flex;gap:6px;align-items:center}
.l2-burger{display:none;border:none;background:transparent;width:38px;height:38px;border-radius:50%;align-items:center;justify-content:center;color:var(--l2-tinta)}
.l2-mmenu{display:flex;flex-direction:column;gap:2px;background:#fff;border-radius:18px;padding:8px;margin:8px auto 0;max-width:820px}
.l2-mmenu a{padding:12px 14px;border-radius:12px;font-weight:600}
@media(max-width:860px){.l2-links,.l2-hide-m{display:none}.l2-burger{display:inline-flex}}
.l2-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:none;border-radius:999px;padding:11px 20px;font-size:15px;font-weight:600;transition:transform .15s,background .2s;white-space:nowrap}
.l2-btn:hover{transform:translateY(-1px)}
.l2-btn-pino{background:var(--l2-pino);color:#fff}
.l2-btn-brasa{background:var(--l2-brasa);color:#fff}.l2-btn-brasa:hover{background:var(--l2-brasa2)}
.l2-btn-ghost{background:transparent;color:var(--l2-tinta)}
.l2-btn-white{background:#fff;color:var(--l2-brasa)}
.l2-btn-sm{padding:8px 15px;font-size:14px}

/* Tipografía */
.l2-kicker{font-size:12px;letter-spacing:.1em;font-weight:600;color:var(--l2-brasa);text-transform:uppercase;margin-bottom:12px}
.l2-h1{font-family:var(--font-display);font-weight:800;font-size:clamp(40px,6.4vw,84px);line-height:.98;letter-spacing:-.035em}
.l2-h2{font-family:var(--font-display);font-weight:800;font-size:clamp(30px,4vw,52px);line-height:1.02;letter-spacing:-.03em}
.l2-gris{color:var(--l2-t3)}
.l2-lead{font-size:clamp(16px,1.5vw,19px);line-height:1.55;color:var(--l2-t2)}
.l2-link{color:var(--l2-pino);font-weight:600;text-decoration:underline!important}
.l2-sec{background:#fff;border-radius:var(--l2-r);padding:clamp(28px,5vw,64px) clamp(18px,4vw,56px);margin-top:12px;position:relative}
.l2-sec-head{max-width:760px;margin-bottom:clamp(24px,3vw,40px)}
.l2-center{text-align:center;margin-left:auto;margin-right:auto}
.l2-reveal{opacity:0;transform:translateY(22px);transition:opacity .7s ease,transform .7s cubic-bezier(.2,.8,.2,1)}
.l2-reveal.in{opacity:1;transform:none}

/* Tarjeta (pase) */
.l2-pass{width:var(--pw,260px);border-radius:16px;padding:14px 0 16px;color:#fff;box-shadow:0 28px 50px -22px rgba(0,0,0,.55);font-family:-apple-system,system-ui,sans-serif;flex-shrink:0}
.l2-pass-h{display:flex;justify-content:space-between;align-items:center;padding:0 14px 10px;gap:10px}
.l2-pass-n{font-weight:700;font-size:calc(var(--pw,260px)*.065);letter-spacing:-.01em;white-space:nowrap}
.l2-f{display:flex;flex-direction:column;gap:2px;min-width:0}
.l2-f span{font-size:9.5px;font-weight:600;letter-spacing:.05em;color:rgba(255,255,255,.7)}
.l2-f b{font-size:calc(var(--pw,260px)*.052);font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.l2-r{text-align:right}
.l2-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:7%;padding:8% 9%;background:rgba(0,0,0,.14)}
.l2-strip i{aspect-ratio:1;border-radius:50%;border:2px solid rgba(255,255,255,.55);display:flex;align-items:center;justify-content:center;color:transparent}
.l2-strip i svg{width:62%;height:62%}
.l2-strip i.on{background:#fff;border-color:#fff;color:var(--c)}
.l2-pts{display:flex;justify-content:space-between;align-items:flex-end;padding:9% 14px;background:rgba(0,0,0,.14)}
.l2-pts b{font-size:calc(var(--pw,260px)*.15);font-weight:700;line-height:1;display:block}
.l2-pts small{display:block;font-size:10.5px;opacity:.75;margin-top:3px}
.l2-pts>span{font-size:11px;opacity:.8;text-align:right;max-width:45%}
.l2-tier{padding:9% 14px;background:rgba(0,0,0,.14);display:flex;flex-direction:column;gap:7px}
.l2-tl{display:flex;justify-content:space-between;font-size:calc(var(--pw,260px)*.05)}
.l2-tier .l2-bar{height:7px;border-radius:4px;background:rgba(255,255,255,.25);overflow:hidden}
.l2-tier .l2-bar i{display:block;height:100%;background:#fff;border-radius:4px}
.l2-tier small{font-size:10.5px;opacity:.8}
.l2-pass-row{display:flex;justify-content:space-between;gap:8px;padding:12px 14px 0}
.l2-qr{width:34%;aspect-ratio:1;background:#fff;border-radius:8px;margin:14px auto 0;padding:6px}
.l2-qr svg{width:100%;height:100%;display:block}

/* Inicio */
.l2-hero{text-align:center;padding:clamp(40px,7vw,90px) 8px 0}
.l2-hero .l2-lead{max-width:600px;margin:22px auto 0}
.l2-ctas{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:28px}
.l2-maq{position:relative;margin-top:clamp(28px,4vw,48px);background:#F6F5F1;border-radius:var(--l2-r);overflow:hidden;height:clamp(440px,48vw,620px)}
.l2-maq-stage{position:absolute;inset:0}
.l2-maq-stage svg{position:absolute;inset:0;width:100%;height:100%}
.l2-maq-fade{position:absolute;inset:0;pointer-events:none;z-index:1;background:radial-gradient(ellipse 60% 66% at 50% 54%,rgba(246,245,241,0) 42%,rgba(246,245,241,.55) 70%,#F6F5F1 96%)}
.l2-maq-top{position:absolute;left:16px;right:16px;top:16px;display:flex;justify-content:space-between;align-items:center;gap:10px;z-index:6;flex-wrap:wrap;pointer-events:none}
.l2-pill{display:inline-flex;align-items:center;gap:7px;background:#fff;border-radius:999px;padding:7px 14px;font-size:13px;color:var(--l2-t2);box-shadow:0 4px 14px rgba(0,0,0,.06)}
.l2-pill svg{color:var(--l2-pino)}
.l2-pill b{font-family:var(--font-display);font-size:15px;color:var(--l2-tinta);display:inline-block;font-variant-numeric:tabular-nums}
.l2-bump{animation:l2bump .5s}
@keyframes l2bump{40%{transform:translateY(-3px);color:var(--l2-brasa)}}
.l2-lot polygon{transition:fill .6s ease}
.l2-pin{transform-box:fill-box;transform-origin:50% 100%;animation:l2pin .6s cubic-bezier(.3,1.5,.5,1)}
@keyframes l2pin{from{transform:translateY(-40px) scale(.6);opacity:0}to{transform:none;opacity:1}}
.l2-ring{transform-box:fill-box;transform-origin:center;animation:l2ring 1.2s ease-out forwards}
@keyframes l2ring{from{transform:scale(.4);opacity:.8}to{transform:scale(2.4);opacity:0}}
.l2-hit{cursor:pointer}
.l2-water{animation:l2shim 3s ease-in-out infinite}
@keyframes l2shim{50%{opacity:.75}}
.l2-mini{width:34px;height:34px;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0}
.l2-chip{position:absolute;z-index:7;display:flex;align-items:center;gap:10px;background:#fff;border-radius:16px;padding:8px 14px 8px 8px;box-shadow:0 14px 30px -12px rgba(30,29,26,.35);pointer-events:none;white-space:nowrap;animation:l2chip .35s cubic-bezier(.2,1.3,.4,1)}
.l2-chip b{display:block;font-size:14px}.l2-chip small{display:block;font-size:12.5px;color:var(--l2-brasa);font-weight:600}
@keyframes l2chip{from{opacity:0;transform:translateY(10px) scale(.95)}to{opacity:1;transform:none}}
@media(max-width:700px){.l2-maq{height:480px}.l2-pill{font-size:12px}}

/* Frase */
.l2-phrase{overflow:hidden;min-height:clamp(300px,34vw,420px);display:flex;align-items:center;justify-content:center;text-align:center}
.l2-phrase .l2-h2{position:relative;z-index:2;font-size:clamp(34px,5.4vw,72px);max-width:900px}
.l2-word{display:inline-block;color:var(--l2-brasa);transition:opacity .3s,transform .3s}
.l2-word.out{opacity:0;transform:translateY(14px)}
.l2-floater{position:absolute;z-index:1;transform:rotate(var(--r));animation:l2float .6s cubic-bezier(.2,1.2,.4,1)}
@keyframes l2float{from{opacity:0;translate:0 30px}to{opacity:1;translate:0 0}}
@media(max-width:700px){.l2-floater{display:none}.l2-phrase{min-height:240px}}

/* Cómo funciona */
.l2-how{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:clamp(18px,3vw,40px);align-items:stretch}
@media(max-width:860px){.l2-how{grid-template-columns:1fr}}
.l2-st{display:grid;grid-template-columns:44px 1fr;gap:12px;padding:20px 0;border-bottom:1px solid var(--l2-linea)}
.l2-st:first-child{border-top:1px solid var(--l2-linea)}
.l2-n{font-family:var(--font-display);font-weight:700;color:var(--l2-t3);font-size:15px;padding-top:3px;transition:color .3s}
.l2-st h3{font-family:var(--font-display);font-size:22px;font-weight:700;letter-spacing:-.01em;transition:color .3s}
.l2-st p{font-size:15px;color:var(--l2-t2);line-height:1.5;margin-top:4px}
.l2-st.on h3,.l2-st.on .l2-n{color:var(--l2-brasa)}
.l2-how-demo{background:var(--l2-salvia);border-radius:var(--l2-r);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:26px 20px}
.l2-phone{position:relative;width:214px;height:390px;background:#1E1D1A;border-radius:34px;padding:9px;box-shadow:0 30px 60px -24px rgba(0,0,0,.45)}
.l2-notch{position:absolute;top:14px;left:50%;width:62px;height:16px;margin-left:-31px;background:#1E1D1A;border-radius:10px;z-index:2}
.l2-screen{position:relative;height:100%;background:#F1F0EC;border-radius:26px;overflow:hidden;display:flex;flex-direction:column;align-items:center;padding:38px 10px 10px;gap:10px}
.l2-ph-top{font-size:12px;font-weight:600;color:var(--l2-t2)}
.l2-scanline{position:absolute;left:10px;right:10px;top:40px;height:3px;border-radius:2px;background:var(--l2-brasa);box-shadow:0 0 18px 4px rgba(199,93,58,.45);opacity:0}
.l2-phone.scanning .l2-scanline{animation:l2scan .65s ease-in-out}
@keyframes l2scan{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(270px)}}
.l2-ph-msg{font-size:12.5px;font-weight:700;color:var(--l2-pino);opacity:0;transform:translateY(6px);transition:all .3s;text-align:center}
.l2-ph-msg.in{opacity:1;transform:none}
.l2-demo-cap{font-size:14px;color:var(--l2-t2);text-align:center;min-height:20px}
.l2-how-stats{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:12px;margin-top:12px}
@media(max-width:860px){.l2-how-stats{grid-template-columns:1fr}}
.l2-stat-big{background:var(--l2-brasa);color:#fff;border-radius:var(--l2-r);padding:22px 24px;display:flex;align-items:center;gap:20px}
.l2-stat-big b{font-family:var(--font-display);font-weight:800;font-size:clamp(56px,6vw,84px);line-height:.9;letter-spacing:-.04em}
.l2-stat-big span{font-size:15px;max-width:260px;line-height:1.4}
.l2-stat-small{background:var(--l2-salvia);border-radius:var(--l2-r);padding:20px 24px;display:flex;align-items:center;gap:16px}
.l2-stat-small b{font-family:var(--font-display);font-weight:800;font-size:40px;color:var(--l2-pino);letter-spacing:-.03em}
.l2-stat-small span{font-size:14px;color:var(--l2-t2)}

/* Lo que pasa después */
.l2-bento{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px}
.l2-tile{background:var(--l2-salvia);border-radius:var(--l2-r);padding:22px;display:flex;flex-direction:column;gap:12px;overflow:hidden;position:relative;min-height:240px}
.l2-tile h3{font-family:var(--font-display);font-size:21px;font-weight:700;letter-spacing:-.01em}
.l2-tile p{font-size:14px;color:var(--l2-t2);line-height:1.5}
.l2-t-an{grid-column:span 4}.l2-t-av{grid-column:span 2}.l2-t-eq,.l2-t-wa,.l2-t-lo{grid-column:span 2}
.l2-t-pino{background:var(--l2-pino);color:#fff}.l2-t-pino p{color:rgba(255,255,255,.72)}
@media(max-width:900px){.l2-bento{grid-template-columns:1fr 1fr}.l2-t-an{grid-column:span 2}.l2-t-av,.l2-t-eq,.l2-t-wa{grid-column:span 1}.l2-t-lo{grid-column:span 2}}
@media(max-width:560px){.l2-bento{grid-template-columns:1fr}.l2-t-an,.l2-t-av,.l2-t-eq,.l2-t-wa,.l2-t-lo{grid-column:span 1}}
.l2-an-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
.l2-an-head h3{font-size:24px}
.l2-an-tag{background:#fff;border-radius:999px;padding:5px 11px;font-size:12px;font-weight:600;color:var(--l2-pino);white-space:nowrap}
.l2-an-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.l2-an-kpis div{background:#fff;border-radius:14px;padding:12px 14px}
.l2-an-kpis span{display:block;font-size:12px;color:var(--l2-t2)}
.l2-an-kpis b{display:block;font-family:var(--font-display);font-size:28px;font-weight:800;letter-spacing:-.02em;margin:2px 0}
.l2-an-kpis small{font-size:12px;color:#2F7A4F;font-weight:600}.l2-an-kpis small.warn{color:var(--l2-brasa)}
@media(max-width:700px){.l2-an-kpis{grid-template-columns:1fr}.l2-an-kpis b{font-size:24px}}
.l2-an-chart{background:#fff;border-radius:14px;padding:14px 14px 10px;margin-top:auto}
.l2-an-l{display:flex;justify-content:space-between;font-size:12px;color:var(--l2-t2);margin-bottom:10px;gap:10px;flex-wrap:wrap}
.l2-an-x{display:flex;justify-content:space-between;font-size:11px;color:var(--l2-t3);margin-top:6px}
.l2-bars{display:flex;align-items:flex-end;gap:3px;height:110px}
.l2-bars i{flex:1;background:var(--l2-pino);border-radius:3px 3px 0 0;transform-origin:bottom;transition:transform .8s cubic-bezier(.2,.8,.2,1)}
.l2-bars i.pk{background:var(--l2-brasa)}
.l2-lock{background:#1E1D1A;border-radius:22px;padding:12px;color:#fff;font-family:-apple-system,system-ui,sans-serif;margin-top:auto}
.l2-time{text-align:center;font-size:34px;font-weight:300;letter-spacing:-.02em}
.l2-date{text-align:center;font-size:11px;opacity:.7;margin-bottom:10px}
.l2-notif{background:rgba(255,255,255,.9);color:#1b1b1b;border-radius:14px;padding:9px 11px;display:flex;gap:9px;align-items:center;font-size:12.5px;line-height:1.35;transform:translateY(10px);opacity:0;transition:all .5s cubic-bezier(.2,1.2,.4,1)}
.l2-notif.in{transform:none;opacity:1}
.l2-notif>div{flex:1}
.l2-nic{width:28px;height:28px;border-radius:7px;flex-shrink:0}
.l2-ntop{display:flex;justify-content:space-between;gap:8px}.l2-ntop span{color:#777}
.l2-app{background:#fff;color:var(--l2-tinta);border-radius:16px;padding:12px;display:flex;flex-direction:column;gap:10px;margin-top:auto}
.l2-app-top{display:flex;justify-content:space-between;font-size:11px;color:var(--l2-t3);font-weight:600}
.l2-app-who{display:flex;gap:10px;align-items:center}
.l2-av{width:34px;height:34px;border-radius:50%;background:var(--l2-salvia);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:var(--l2-pino)}
.l2-app-who b{display:block;font-size:14px}.l2-app-who small{font-size:12px;color:var(--l2-t2)}
.l2-app-st{display:grid;grid-template-columns:repeat(8,1fr);gap:5px}
.l2-app-st i{aspect-ratio:1;border-radius:50%;border:2px dashed #D9D6CE;display:flex;align-items:center;justify-content:center;color:transparent;transition:background .2s,border-color .2s}
.l2-app-st i.on{background:var(--l2-brasa);border:2px solid var(--l2-brasa);color:#fff}
.l2-app-st i.pop{animation:l2stamp .5s cubic-bezier(.3,1.6,.5,1)}
@keyframes l2stamp{0%{transform:scale(1.8) rotate(-18deg);opacity:0}60%{transform:scale(.9) rotate(4deg);opacity:1}100%{transform:none}}
.l2-app-btn{border-radius:12px;padding:10px;background:var(--l2-pino);color:#fff;font-weight:600;font-size:14px;display:flex;align-items:center;justify-content:center;gap:6px;transition:transform .15s,background .2s}
.l2-app-btn.press{transform:scale(.96);background:#245a41}
.l2-app-btn.done{background:var(--l2-brasa)}
.l2-waback{display:flex;flex-direction:column;gap:8px;margin-top:auto}
.l2-wb-row{display:flex;align-items:center;gap:10px;background:#fff;border-radius:14px;padding:10px 12px;font-size:13px}
.l2-wb-row>span:nth-child(2){flex:1;min-width:0}
.l2-wb-row b{display:block;font-size:14px}.l2-wb-row small{display:block;color:var(--l2-t2);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.l2-wb-row>svg{color:var(--l2-t3)}
.l2-wb-ic{width:32px;height:32px;border-radius:10px;background:var(--l2-salvia);color:var(--l2-pino);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.l2-locs{display:flex;flex-direction:column;gap:8px;margin-top:auto}
.l2-locs div{background:#fff;border-radius:12px;padding:10px 12px;display:grid;grid-template-columns:96px 1fr 40px;align-items:center;gap:10px;font-size:13px}
.l2-locs i{height:8px;border-radius:4px;background:linear-gradient(90deg,var(--l2-pino) var(--w),var(--l2-salvia) var(--w))}
.l2-locs b{text-align:right;font-variant-numeric:tabular-nums}
.l2-locs small{font-size:12px;color:var(--l2-t2);text-align:right}

/* Bloque verde: lo que hace tu tarjeta sola */
.l2-dark{background:var(--l2-pino);color:#fff}
.l2-dark .l2-kicker{color:var(--l2-mostaza)}
.l2-dark .l2-gris{color:rgba(255,255,255,.5)}
.l2-dark .l2-lead{color:rgba(255,255,255,.75)}
.l2-so-head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;flex-wrap:wrap;margin-bottom:34px}
.l2-so-tabs{position:relative;display:flex;gap:4px;background:rgba(255,255,255,.08);border-radius:999px;padding:4px;flex-wrap:wrap}
.l2-so-tabs button{border:none;background:transparent;color:rgba(255,255,255,.75);border-radius:999px;padding:10px 16px;font-weight:600;font-size:14px;display:inline-flex;gap:7px;align-items:center}
.l2-so-tabs button[aria-selected=true]{background:#fff;color:var(--l2-pino)}
.l2-so-bar{position:absolute;left:18px;right:18px;bottom:-10px;height:2px;background:rgba(255,255,255,.12);border-radius:2px;overflow:hidden}
.l2-so-bar i{display:block;height:100%;width:0;background:var(--l2-mostaza)}
.l2-so-in{animation:l2in .5s ease}
@keyframes l2in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.l2-so-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(24px,5vw,64px);align-items:center}
@media(max-width:860px){.l2-so-grid{grid-template-columns:1fr}}
.l2-so-plan{display:inline-block;background:rgba(231,196,106,.16);color:var(--l2-mostaza);border-radius:999px;padding:5px 12px;font-size:12.5px;font-weight:700;margin-bottom:14px}
.l2-so-h3{font-family:var(--font-display);font-weight:800;font-size:clamp(26px,3vw,38px);letter-spacing:-.02em;line-height:1.08;color:#fff;margin-bottom:12px}
.l2-so-list{list-style:none;display:flex;flex-direction:column;gap:8px;margin-top:22px}
.l2-so-list li{display:flex;gap:12px;align-items:flex-start;padding:10px 12px;border-radius:14px;transition:background .3s}
.l2-so-list li>svg{color:var(--l2-mostaza);margin-top:2px;flex-shrink:0}
.l2-so-list li b{display:block;color:#fff;font-size:15px}.l2-so-list li span{color:rgba(255,255,255,.7);font-size:14px}
.l2-so-list li.on{background:rgba(255,255,255,.1)}
.l2-lockbig{background:#0F1714;border-radius:30px;padding:22px 16px;min-height:420px;color:#fff;font-family:-apple-system,system-ui,sans-serif;max-width:380px;width:100%;margin:0 auto;box-shadow:0 30px 60px -28px rgba(0,0,0,.6)}
.l2-lockbig .l2-time{font-size:52px}
.l2-lockbig .l2-date{font-size:13px;margin-bottom:18px}
.l2-lk-list{display:flex;flex-direction:column;gap:8px}
.l2-drop{animation:l2drop .5s cubic-bezier(.2,1.3,.4,1)}
@keyframes l2drop{from{opacity:0;transform:translateY(-14px) scale(.96)}to{opacity:1;transform:none}}
.l2-tag{display:inline-block;font-size:10px;font-weight:700;letter-spacing:.04em;color:#C75D3A}
.l2-cerca{position:relative;max-width:460px;margin:0 auto;width:100%}
.l2-cz-map{width:100%;height:auto;display:block}
.l2-cz-map text{font-family:var(--font-display)}
.l2-cz-radius{transform-box:fill-box;transform-origin:center;animation:l2czr 2.4s ease-in-out infinite}
@keyframes l2czr{50%{transform:scale(1.05);opacity:.7}}
.l2-cz-phone{position:absolute;right:-6px;bottom:-24px;width:220px;background:#0F1714;border-radius:24px;padding:12px;font-family:-apple-system,system-ui,sans-serif;color:#fff;box-shadow:0 24px 50px -20px rgba(0,0,0,.6)}
.l2-cz-phone .l2-time{font-size:28px;margin-bottom:8px}
@media(max-width:560px){.l2-cz-phone{position:relative;right:auto;bottom:auto;margin:-30px auto 0;width:240px}}
.l2-order-phone{width:290px;background:#111;border-radius:42px;padding:10px;box-shadow:0 40px 80px -30px rgba(0,0,0,.6);margin:0 auto}
.l2-order-screen{background:var(--l2-salvia);border-radius:33px;padding:14px 12px;color:var(--l2-tinta);display:flex;flex-direction:column;gap:8px;font-size:13px;min-height:540px}
.l2-op-head{background:#5C1414;color:#fff;border-radius:16px;padding:14px}
.l2-op-head b{font-family:var(--font-display);font-size:19px;display:block}
.l2-op-head span{font-size:12px;opacity:.85}
.l2-op-box{background:#fff;border-radius:14px;padding:10px 12px;display:flex;flex-direction:column;gap:8px}
.l2-op-box h4{font-size:10px;letter-spacing:.08em;color:var(--l2-t3);font-weight:600;margin:0}
.l2-op-item{display:flex;justify-content:space-between;align-items:center}
.l2-op-item.off{opacity:.5}
.l2-op-item small{display:block;color:var(--l2-t2);font-size:11.5px}
.l2-nostock{font-size:12px;color:var(--l2-t2)}
.l2-qty{display:flex;align-items:center;gap:8px}
.l2-qty .b{width:28px;height:28px;border-radius:50%;border:1.5px solid var(--l2-linea);display:flex;align-items:center;justify-content:center;font-size:15px}
.l2-qty .plus{background:var(--l2-pino);border-color:var(--l2-pino);color:#fff}
.l2-qty span:not(.b){min-width:42px;text-align:center;font-weight:600}
.l2-op-days{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
.l2-op-days span{border:1.5px solid var(--l2-linea);border-radius:8px;text-align:center;padding:4px 0;font-size:11px}
.l2-op-days span.on{border-color:var(--l2-pino);background:rgba(27,65,47,.08);font-weight:600}
.l2-op-days span.off{background:var(--l2-salvia);color:var(--l2-t3)}
.l2-op-zones{display:flex;gap:6px;flex-wrap:wrap;font-size:12px}
.l2-op-zones span{border:1.5px solid var(--l2-linea);border-radius:999px;padding:4px 10px}
.l2-op-zones span.on{border-color:var(--l2-pino);background:rgba(27,65,47,.08);font-weight:600}
.l2-op-total{flex-direction:row;justify-content:space-between;font-weight:600}
.l2-op-send{background:var(--l2-wa);color:#fff;border-radius:12px;padding:12px;text-align:center;font-weight:600;margin-top:auto}
.l2-chat{background:#E9E2D6;border-radius:var(--l2-r);padding:18px;max-width:520px;margin-top:22px}
.l2-chat-top{display:flex;align-items:center;gap:10px;margin-bottom:12px;color:var(--l2-tinta);font-size:14px}
.l2-chat-av{width:34px;height:34px;border-radius:50%;background:#5C1414;display:flex;align-items:center;justify-content:center;padding:5px}
.l2-bubble{background:#DCF8C6;color:#1b1b1b;border-radius:14px 14px 4px 14px;padding:12px 14px;font-size:14.5px;line-height:1.5;margin-left:auto;max-width:440px;white-space:pre-line;animation:l2drop .5s .3s both}
.l2-btime{display:block;text-align:right;font-size:11px;color:#6b6b6b;margin-top:4px}
.l2-feat{display:flex;flex-wrap:wrap;gap:8px;margin-top:22px}
.l2-feat span{background:rgba(255,255,255,.1);border-radius:999px;padding:8px 14px;font-size:14px;display:inline-flex;gap:7px;align-items:center}

/* Vidriera */
.l2-vit-stage{position:relative;height:440px;margin-top:8px}
.l2-vit{position:absolute;top:0;left:50%;transition:transform .7s cubic-bezier(.2,.8,.2,1),opacity .5s;cursor:pointer}
.l2-vit-card{background:var(--l2-salvia);border-radius:var(--l2-r);display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);overflow:hidden;height:400px}
.l2-vit-photo{position:relative;overflow:hidden}
.l2-vit-photo>img{width:100%;height:100%;object-fit:cover}
.l2-logo-only{width:100%;height:100%;display:flex;align-items:flex-start;justify-content:center;padding:32px 40px 0}
.l2-logo-only img{width:auto;height:auto;max-width:70%;max-height:42%;object-fit:contain}
.l2-vit-pass{position:absolute;right:14px;bottom:14px}
.l2-vit-text{padding:26px;display:flex;flex-direction:column;gap:12px;text-align:left}
.l2-vtag{font-size:12px;color:var(--l2-t3)}
.l2-vit-text h3{font-family:var(--font-display);font-size:28px;font-weight:800;letter-spacing:-.02em;line-height:1.05}
.l2-vit-text blockquote,.l2-vit-text p{font-size:15px;line-height:1.5;color:var(--l2-t2)}
.l2-nums{display:flex;gap:18px;margin-top:auto}
.l2-nums b{font-family:var(--font-display);font-size:34px;font-weight:800;color:var(--l2-pino);display:block;letter-spacing:-.03em}
.l2-nums span{font-size:12px;color:var(--l2-t2)}
.l2-vit-ctrl{display:flex;justify-content:center;align-items:center;gap:12px}
.l2-circ{width:40px;height:40px;border-radius:50%;border:none;background:var(--l2-salvia);display:flex;align-items:center;justify-content:center;color:var(--l2-tinta)}
.l2-dots{display:flex;gap:6px}
.l2-dots i{height:7px;width:7px;border-radius:4px;background:#C9CBC4;transition:width .3s,background .3s}
.l2-dots i.on{width:22px;background:var(--l2-pino)}
@media(max-width:700px){.l2-vit-card{grid-template-columns:1fr;height:auto}.l2-vit-photo{height:230px}.l2-vit-stage{height:600px}.l2-vit-text h3{font-size:24px}.l2-vit-pass{--pw:118px!important;right:10px;bottom:10px}.l2-logo-only{justify-content:flex-start;align-items:center;padding:20px}.l2-logo-only img{max-width:45%;max-height:60%}}
.l2-logos-k{text-align:center;font-size:13px;color:var(--l2-t3);margin-top:36px}
.l2-logos{display:flex;gap:14px;overflow:hidden;padding:14px 0 4px;mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);-webkit-mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)}
.l2-track{display:flex;gap:14px;animation:l2mq 30s linear infinite;flex-shrink:0}
.l2-logos:hover .l2-track{animation-play-state:paused}
@keyframes l2mq{to{transform:translateX(calc(-100% - 14px))}}
.l2-lg{display:flex;align-items:center;gap:12px;background:var(--l2-salvia);border-radius:999px;padding:6px 18px 6px 6px;flex-shrink:0}
.l2-mark{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;overflow:hidden;padding:6px}
.l2-lg b{font-size:14px;font-weight:600;display:block}.l2-lg small{font-size:12px;color:var(--l2-t3)}

/* Probala */
.l2-try{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:clamp(24px,5vw,64px);align-items:center}
@media(max-width:820px){.l2-try{grid-template-columns:1fr}.l2-try-pass{display:flex;justify-content:center}}
.l2-rubros,.l2-models{display:flex;flex-wrap:wrap;gap:8px;margin-top:22px}
.l2-models{margin-top:12px}
.l2-rubros button,.l2-models button{border:1.5px solid var(--l2-linea);background:#fff;border-radius:999px;padding:9px 15px;font-size:14px;display:inline-flex;gap:7px;align-items:center;color:var(--l2-tinta)}
.l2-rubros button[aria-pressed=true]{background:var(--l2-pino);border-color:var(--l2-pino);color:#fff}
.l2-models button[aria-pressed=true]{background:var(--l2-brasa);border-color:var(--l2-brasa);color:#fff}
.l2-try-qr{display:flex;gap:16px;align-items:center;margin-top:26px;background:var(--l2-salvia);border-radius:14px;padding:14px;max-width:440px}
.l2-try-qr img,.l2-try-qr>div{border-radius:10px;background:#fff;padding:6px;flex-shrink:0}
.l2-try-qr p{font-size:14px;color:var(--l2-t2);line-height:1.45}
.l2-try-qr b{color:var(--l2-tinta);display:block;margin-bottom:2px}
.l2-pop-in{animation:l2popin .45s cubic-bezier(.2,1.3,.4,1)}
@keyframes l2popin{from{transform:scale(.94) rotate(-2deg)}to{transform:none}}

/* Precios */
.l2-price-top{display:flex;justify-content:space-between;align-items:end;gap:20px;flex-wrap:wrap;margin-bottom:28px}
.l2-seg-wrap{display:flex;gap:8px;flex-wrap:wrap}
.l2-seg{display:inline-flex;background:var(--l2-salvia);border-radius:999px;padding:4px}
.l2-seg button{border:none;background:transparent;border-radius:999px;padding:8px 14px;font-size:13px;font-weight:600;color:var(--l2-t2)}
.l2-seg button[aria-pressed=true]{background:#fff;color:var(--l2-tinta);box-shadow:0 1px 4px rgba(0,0,0,.08)}
.l2-plans{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
@media(max-width:1000px){.l2-plans{grid-template-columns:1fr 1fr}}
@media(max-width:560px){.l2-plans{grid-template-columns:1fr}}
.l2-plan{background:var(--l2-salvia);border-radius:var(--l2-r);padding:22px;display:flex;flex-direction:column;gap:14px}
.l2-plan.hl{background:var(--l2-pino);color:#fff}
.l2-plan h3{font-family:var(--font-display);font-size:22px;font-weight:800}
.l2-desc{font-size:13.5px;color:var(--l2-t2)}
.l2-plan.hl .l2-desc{color:rgba(255,255,255,.7)}
.l2-amt{font-family:var(--font-display);font-weight:800;font-size:32px;letter-spacing:-.03em}
.l2-amt small{font-family:var(--font-body);font-size:13px;font-weight:500;color:var(--l2-t2);letter-spacing:0}
.l2-plan.hl .l2-amt small{color:rgba(255,255,255,.7)}
.l2-plan ul{list-style:none;display:flex;flex-direction:column;gap:8px;font-size:14px}
.l2-plan li{display:flex;gap:8px;align-items:flex-start}
.l2-plan li svg{color:var(--l2-pino);margin-top:2px;flex-shrink:0}
.l2-plan.hl li svg{color:var(--l2-mostaza)}
.l2-plan li.new{font-weight:600}
.l2-plan .l2-btn{margin-top:auto}
.l2-plan.hl .l2-btn-white{color:var(--l2-pino)}
.l2-badge{display:inline-block;background:var(--l2-mostaza);color:var(--l2-tinta);font-size:11px;font-weight:700;border-radius:999px;padding:3px 9px;margin-left:8px;vertical-align:middle;letter-spacing:.02em}
.l2-price-note{font-size:13px;color:var(--l2-t3);margin-top:16px}

/* Preguntas */
.l2-faq-grid{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:clamp(20px,4vw,60px)}
@media(max-width:820px){.l2-faq-grid{grid-template-columns:1fr}}
.l2-faq details{border-top:1px solid var(--l2-linea)}
.l2-faq details:last-child{border-bottom:1px solid var(--l2-linea)}
.l2-faq summary{list-style:none;cursor:pointer;padding:18px 0;display:flex;justify-content:space-between;gap:16px;font-size:16.5px;font-weight:600}
.l2-faq summary::-webkit-details-marker{display:none}
.l2-faq summary svg{transition:transform .25s;color:var(--l2-t3);flex-shrink:0}
.l2-faq details[open] summary svg{transform:rotate(45deg)}
.l2-faq details p{font-size:15px;line-height:1.6;color:var(--l2-t2);padding:0 0 18px;max-width:640px}

/* Cierre y pie */
.l2-close{background:var(--l2-brasa);color:#fff;border-radius:var(--l2-r);padding:clamp(36px,6vw,80px) 20px;margin-top:12px;text-align:center}
.l2-close .l2-h2{max-width:760px;margin:0 auto}
.l2-close p{margin:14px auto 26px;opacity:.85;font-size:17px}
.l2-ft{background:#fff;border-radius:var(--l2-r);margin-top:12px;padding:clamp(28px,4vw,48px) clamp(18px,4vw,52px) 20px;overflow:hidden}
.l2-ft-top{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr);gap:clamp(24px,4vw,56px)}
@media(max-width:900px){.l2-ft-top{grid-template-columns:1fr}}
.l2-ft-claim{font-size:16px;line-height:1.5;color:var(--l2-t2);max-width:320px;margin-bottom:18px}
.l2-ft-country{display:flex;width:max-content;background:var(--l2-salvia);border-radius:999px;padding:4px;margin-top:18px}
.l2-ft-country button{border:none;background:transparent;border-radius:999px;padding:7px 12px;font-size:13px;font-weight:600;color:var(--l2-t2)}
.l2-ft-country button[aria-pressed=true]{background:#fff;color:var(--l2-tinta);box-shadow:0 1px 4px rgba(0,0,0,.08)}
.l2-ft-cols{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px}
@media(max-width:700px){.l2-ft-cols{grid-template-columns:1fr 1fr}}
.l2-ft-cols div{display:flex;flex-direction:column;gap:10px;font-size:14px}
.l2-ft-cols b{font-size:13px;color:var(--l2-tinta);margin-bottom:4px}
.l2-ft-cols a{color:var(--l2-t2);display:inline-flex;align-items:center;gap:6px}
.l2-ft-cols a:hover{color:var(--l2-tinta)}
.l2-store{background:var(--l2-tinta);color:#fff!important;border-radius:12px;padding:7px 12px;align-self:flex-start;gap:8px!important}
.l2-store span{display:flex;flex-direction:column;line-height:1.1;font-weight:600}.l2-store small{font-size:10px;font-weight:400;opacity:.8}
.l2-ft-word{font-family:var(--font-display);font-weight:800;font-size:clamp(70px,18vw,250px);line-height:.8;letter-spacing:-.05em;color:var(--l2-brasa);text-align:center;margin:clamp(28px,4vw,48px) 0 10px;user-select:none}
.l2-ft-bottom{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;font-size:13px;color:var(--l2-t3);border-top:1px solid var(--l2-linea);padding-top:16px}
.l2-ft-bottom nav{display:flex;gap:16px}

@media (prefers-reduced-motion:reduce){.l2 *,.l2 *::before,.l2 *::after{animation:none!important;transition:none!important}.l2-reveal{opacity:1;transform:none}}
`
