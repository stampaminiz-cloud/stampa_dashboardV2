// Estilos del escáner web. Copian la app Stampa Escáner (stampa-scanner):
// mismos colores de marca (crema, coral, tinta), mismas medidas y pesos, sin
// íconos ni emojis. Las pantallas de un cliente toman los colores de su
// tarjeta, igual que en la app. Las letras son las del panel (Red Hat).
export const ESCANER_CSS = `
.esc-root{--cream:#FBF6EE;--coral:#C75D3A;--ink:#2B2620;--soft:rgba(43,38,32,.6);--faint:rgba(43,38,32,.12);--green:#1B412F;--danger:#B23B3B;--ok:#5B8C5A;
  min-height:100dvh;background:var(--cream);color:var(--ink);font-family:var(--font-body,system-ui);display:flex;justify-content:center;-webkit-text-size-adjust:100%}
.esc-root *{box-sizing:border-box}
.esc-root button{font:inherit;cursor:pointer;color:inherit}
.esc-root button:disabled{cursor:default}
.esc-screen{width:100%;max-width:520px;min-height:100dvh;display:flex;flex-direction:column;position:relative}
.esc-center{flex:1;display:flex;align-items:center;justify-content:center;min-height:200px}
.esc-spinner{width:32px;height:32px;border-radius:50%;border:4px solid var(--faint);border-top-color:var(--coral);animation:esc-spin .8s linear infinite}
@keyframes esc-spin{to{transform:rotate(360deg)}}

.esc-top{display:flex;align-items:center;justify-content:space-between;padding:8px 20px 0;min-height:48px}
.esc-wm{width:120px;height:26px;background:url(/stampa-wordmark.png) -25px -72px/170px 170px no-repeat}
.esc-help{width:40px;height:40px;border-radius:50%;border:1.5px solid var(--ink);background:#fff;font-size:19px;font-weight:800;display:flex;align-items:center;justify-content:center;padding:0}
.esc-body{padding:28px 24px 24px;display:flex;flex-direction:column;flex:1}
.esc-title{font-family:var(--font-display);font-size:30px;font-weight:800;line-height:1.2;margin:0}
.esc-sub{font-size:16px;color:var(--soft);line-height:1.45;margin:8px 0 0}
.esc-business{font-size:15px;color:var(--soft);margin-top:6px}
.esc-business b{font-weight:800;color:var(--ink)}
.esc-label{font-size:14px;font-weight:700;margin:32px 0 10px}
.esc-hint{font-size:14px;color:var(--soft);margin-top:10px}
.esc-error{color:var(--danger);font-size:15px;font-weight:600;line-height:1.4}
.esc-status{min-height:44px;display:flex;align-items:center;margin:6px 0}

.esc-btn{display:flex;align-items:center;justify-content:center;width:100%;min-height:58px;border-radius:16px;border:none;background:var(--coral);color:#fff;font-size:18px;font-weight:800;padding:0 20px;text-align:center;font-family:var(--font-body)}
.esc-btn:active:not(:disabled){opacity:.85;transform:scale(.98)}
.esc-btn:disabled{opacity:.4}
.esc-btn--line{background:transparent;border:2px solid var(--ink);color:var(--ink)}
.esc-btn--sm{min-height:46px;font-size:15px;width:auto;padding:0 16px;border-radius:14px}
.esc-or{display:flex;align-items:center;gap:10px;margin:18px 0}
.esc-or i{flex:1;height:1px;background:var(--faint)}
.esc-or span{font-size:14px;color:var(--soft)}
.esc-link{background:none;border:none;font-size:14px;font-weight:600;color:var(--soft);text-decoration:underline;padding:14px 16px;margin-top:10px;align-self:center;text-align:center}
.esc-link--coral{color:var(--coral);font-weight:700;text-decoration:none;padding:0;margin:4px 0 0;align-self:flex-start;font-size:14px}

.esc-boxes{position:relative;display:flex;gap:12px}
.esc-box{flex:1;height:64px;border-radius:16px;border:1.5px solid var(--faint);background:#fff;display:flex;align-items:center;justify-content:center}
.esc-box.is-focus{border:2px solid var(--coral)}
.esc-box.is-error{border-color:var(--danger)}
.esc-box i{width:14px;height:14px;border-radius:50%;background:var(--ink)}
.esc-boxes input{position:absolute;inset:0;width:100%;height:100%;opacity:.02;font-size:16px;border:none;background:transparent;color:transparent;caret-color:transparent}
.esc-input{width:100%;height:54px;border-radius:14px;border:1.5px solid var(--faint);background:#fff;padding:0 16px;font-size:17px;color:var(--ink);font-family:var(--font-body);outline:none}
.esc-input:focus{border-color:var(--coral)}
.esc-field{display:flex;flex-direction:column;gap:8px;margin-top:20px}
.esc-field label{font-size:14px;font-weight:700}

.esc-option{display:flex;align-items:center;gap:14px;width:100%;background:#fff;border:1.5px solid var(--faint);border-radius:20px;padding:18px;text-align:left}
.esc-option:active{opacity:.85;transform:scale(.99)}
.esc-option--main{background:var(--coral);border-color:var(--coral);color:#fff}
.esc-option b{display:block;font-size:18px;font-weight:800}
.esc-option span{display:block;font-size:14px;line-height:1.4;margin-top:4px;color:var(--soft)}
.esc-option--main span{color:rgba(255,255,255,.85)}
.esc-option i{margin-left:auto;font-style:normal;font-size:28px;color:var(--soft)}
.esc-option--main i{color:#fff}
.esc-stack{display:flex;flex-direction:column;gap:14px}

.esc-ob{flex:1;display:flex;flex-direction:column;padding:0 28px;justify-content:center}
.esc-ob-ill{display:flex;align-items:center;justify-content:center;margin-bottom:36px;min-height:200px}
.esc-ob-kicker{font-size:13px;font-weight:800;color:var(--coral);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
.esc-ob-title{font-family:var(--font-display);font-size:30px;font-weight:800;line-height:1.2;margin:0}
.esc-ob-body{font-size:17px;color:var(--soft);line-height:1.5;margin:12px 0 0}
.esc-ob-foot{padding:0 24px 20px;display:flex;flex-direction:column;gap:14px}
.esc-dots{display:flex;justify-content:center;gap:8px;margin-bottom:4px}
.esc-dots i{width:8px;height:8px;border-radius:4px;background:var(--faint)}
.esc-dots i.on{width:24px;background:var(--coral)}
.esc-skip{background:none;border:none;text-align:center;color:var(--soft);font-size:15px;font-weight:600;padding:4px;width:100%}
.esc-circle{width:160px;height:160px;border-radius:50%;background:rgba(199,93,58,.12);display:flex;align-items:center;justify-content:center}
.esc-circle .esc-wm{width:120px;transform:scale(1.15)}
.esc-demo{width:260px;border-radius:20px;background:var(--green);padding:20px;display:flex;flex-direction:column;gap:10px;color:var(--cream)}
.esc-demo p{margin:0;font-size:15px;font-weight:600}
.esc-demo-big{font-size:34px!important;font-weight:800!important}
.esc-demo-row{background:rgba(251,246,238,.1);border-radius:10px;padding:8px 12px;font-size:15px;font-weight:600}
.esc-demo-row.dim{opacity:.4}
.esc-demo-stamps{display:flex;flex-wrap:wrap;gap:12px;justify-content:center}
.esc-demo-stamps i{width:44px;height:44px;border-radius:50%;background:rgba(251,246,238,.18)}
.esc-demo-stamps i.on{background:var(--cream)}
.esc-demo-ladder{display:flex;justify-content:space-between;padding:8px 0}
.esc-demo-ladder div{display:flex;flex-direction:column;align-items:center;gap:8px;font-size:15px;font-weight:600}
.esc-demo-ladder i{width:28px;height:28px;border-radius:50%;border:3px solid rgba(251,246,238,.4)}
.esc-demo-ladder i.on{background:var(--cream);border-color:var(--cream)}
.esc-phone{width:150px;height:220px;border-radius:28px;background:var(--ink);padding:10px}
.esc-phone div{height:100%;border-radius:20px;background:#333;border:3px solid var(--coral);display:flex;align-items:center;justify-content:center}
.esc-qr{width:90px;height:90px;display:grid;grid-template-columns:repeat(5,1fr);background:#fff;padding:6px}
.esc-qr i.on{background:var(--ink)}

.esc-head{display:flex;align-items:center;gap:12px;padding:12px 20px}
.esc-head-main{flex:1;min-width:0}
.esc-biz{font-size:20px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.esc-who{font-size:14px;color:var(--soft);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.esc-logout{border:1.5px solid var(--faint);border-radius:12px;padding:10px 12px;background:#fff;font-size:13px;font-weight:700;white-space:nowrap}
.esc-today{display:flex;align-items:center;margin:0 16px 12px;background:#fff;border-radius:16px;border:1px solid var(--faint);padding:10px 0}
.esc-today div{flex:1;display:flex;align-items:baseline;justify-content:center;gap:6px}
.esc-today b{font-size:22px;font-weight:900}
.esc-today span{font-size:13px;font-weight:600;color:var(--soft)}
.esc-today i{width:1px;height:24px;background:var(--faint)}
.esc-main{flex:1;display:flex;flex-direction:column;min-height:0;padding:0 16px}
.esc-cam{position:relative;flex:1;min-height:320px;border-radius:24px;overflow:hidden;background:#1f1d1a}
.esc-cam-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.esc-cam-msg{position:absolute;inset:0;display:flex;flex-direction:column;gap:6px;align-items:center;justify-content:center;text-align:center;padding:24px;color:#fff;font-size:15px;line-height:1.5}
.esc-cam-msg b{font-size:17px}
.esc-cam-flash{position:absolute;top:12px;right:12px;background:rgba(255,255,255,.92);border:none;border-radius:999px;padding:8px 14px;font-size:13px;font-weight:700;color:var(--ink)}
.esc-cam-over{position:absolute;inset:0;background:rgba(0,0,0,.55);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;color:#fff;font-size:18px;font-weight:700}
.esc-cam-over .esc-spinner{border-color:rgba(255,255,255,.3);border-top-color:#fff}
.esc-foot{padding:16px 20px;min-height:84px;display:flex;flex-direction:column;justify-content:center}
.esc-foot-hint{text-align:center;font-size:16px;font-weight:600;color:var(--soft)}
.esc-alert{background:rgba(178,59,59,.08);border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:12px;text-align:center}
.esc-alert--ok{background:rgba(91,140,90,.12)}
.esc-alert p{margin:0;color:var(--danger);font-size:16px;font-weight:700;line-height:1.4}
.esc-alert--ok p{color:var(--ok)}
.esc-alert-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.esc-pill{border-radius:12px;padding:10px 18px;border:1.5px solid var(--faint);background:#fff;font-weight:700;font-size:15px}
.esc-pill--coral{background:var(--coral);border-color:var(--coral);color:#fff;font-weight:800}
.esc-tabs{display:flex;background:#fff;border-top:1px solid var(--faint);padding-bottom:env(safe-area-inset-bottom)}
.esc-tabs button{flex:1;background:none;border:none;border-top:3px solid transparent;padding:14px 0 15px;font-size:15px;font-weight:700;color:var(--soft)}
.esc-tabs button.on{color:var(--coral);border-top-color:var(--coral)}

.esc-pane{padding:4px 4px 16px;display:flex;flex-direction:column;gap:10px;overflow:auto}
.esc-row{display:flex;align-items:center;gap:12px;background:#fff;border-radius:16px;border:1px solid var(--faint);padding:14px;text-align:left;width:100%}
.esc-row-sw{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;flex-shrink:0}
.esc-row-main{flex:1;min-width:0}
.esc-row-name{font-size:17px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.esc-row-meta{font-size:13px;color:var(--soft);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.esc-row-time{font-size:13px;color:var(--soft)}
.esc-empty{text-align:center;color:var(--soft);font-size:15px;margin-top:24px;line-height:1.5}
.esc-undo-mini{border:1.5px solid var(--faint);border-radius:12px;background:#fff;padding:8px 12px;font-size:13px;font-weight:700}

.esc-sheet-bg{position:fixed;inset:0;background:rgba(20,18,14,.45);display:flex;align-items:flex-end;justify-content:center;z-index:60}
.esc-sheet{background:var(--cream);width:100%;max-width:520px;max-height:90dvh;overflow:auto;border-radius:24px 24px 0 0;padding:8px 20px calc(24px + env(safe-area-inset-bottom))}
.esc-sheet--center{border-radius:24px;margin:auto 16px;align-self:center;width:calc(100% - 32px)}
.esc-sheet-head{display:flex;align-items:center;justify-content:space-between;padding:12px 0}
.esc-sheet-head h2{font-family:var(--font-display);font-size:28px;font-weight:800;margin:0}
.esc-sheet-head button{background:none;border:none;font-size:16px;font-weight:700;color:var(--coral);padding:8px}
.esc-faq{background:#fff;border-radius:16px;border:1px solid var(--faint);padding:16px;margin-bottom:10px}
.esc-faq button{width:100%;display:flex;justify-content:space-between;gap:12px;background:none;border:none;text-align:left;padding:0;font-size:16px;font-weight:700}
.esc-faq button span{font-size:22px;font-weight:600;color:var(--soft);line-height:1}
.esc-faq p{margin:8px 0 0;font-size:15px;line-height:1.5;color:var(--soft)}
.esc-sheet-foot{text-align:center;color:var(--soft);font-size:14px;margin-top:12px}
.esc-tip{padding:16px 4px 4px}
.esc-tip h2{font-family:var(--font-display);font-size:26px;font-weight:800;margin:0 0 8px;line-height:1.2}
.esc-tip p{margin:0 0 14px;font-size:16px;line-height:1.5;color:var(--soft)}
.esc-tip ol{margin:0 0 20px;padding-left:22px;font-size:16px;line-height:1.55}
.esc-tip li{margin-bottom:8px}
.esc-tip b{font-weight:800}
.esc-tip h3{font-size:13px;font-weight:800;color:var(--coral);text-transform:uppercase;letter-spacing:1px;margin:18px 0 8px}
.esc-menu-opt{display:block;width:100%;text-align:left;background:#fff;border:1px solid var(--faint);border-radius:16px;padding:16px;font-size:16px;font-weight:700;margin-bottom:10px}
.esc-menu-opt span{display:block;font-size:13px;font-weight:500;color:var(--soft);margin-top:2px}

.esc-overlay{position:fixed;inset:0;z-index:40;display:flex;justify-content:center;background:var(--cream);overflow:auto}
.esc-cli{width:100%;max-width:520px;min-height:100dvh;display:flex;flex-direction:column}
.esc-cli-top{display:flex;align-items:center;gap:12px;padding:8px 20px 0}
.esc-cli-card{flex:1;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.esc-cli-close{background:none;border:1.5px solid;border-radius:12px;padding:8px 12px;font-size:14px;font-weight:700}
.esc-cli-body{flex:1;padding:20px 20px 32px;display:flex;flex-direction:column;gap:20px;overflow:auto}
.esc-cli-name{font-family:var(--font-display);font-size:34px;font-weight:900;letter-spacing:-.5px;line-height:1.1}
.esc-cli-double{align-self:flex-start;border:1.5px solid;border-radius:999px;padding:6px 14px;font-size:14px;font-weight:800;margin-top:-8px}
.esc-cli-bday{display:flex;align-items:center;gap:12px;border-radius:18px;padding:14px}
.esc-cli-kicker{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.8px;opacity:.8}
.esc-cli-gift{font-size:18px;font-weight:800;margin-top:2px}
.esc-cli-limit{border-radius:16px;padding:14px;font-size:15px;line-height:1.45;font-weight:600}
.esc-cli-limit b{font-weight:800}
.esc-stamps{display:flex;flex-wrap:wrap;row-gap:14px}
.esc-stamp{display:flex;justify-content:center}
.esc-stamp img{width:56px;height:56px;object-fit:contain}
.esc-stamp i{width:48px;height:48px;border-radius:50%}
.esc-big{font-size:24px;font-weight:800}
.esc-subline{font-size:16px;font-weight:600;line-height:1.4}
.esc-prize{display:flex;flex-direction:column;align-items:center;gap:12px;padding:20px 0;text-align:center}
.esc-prize img{width:140px;height:140px;object-fit:contain}
.esc-prize-title{font-size:30px;font-weight:800}
.esc-prize-pill{border:2px solid;border-radius:999px;padding:8px 20px;font-size:20px;font-weight:800}
.esc-balance{display:flex;align-items:baseline;gap:10px}
.esc-balance img{width:40px;height:40px;align-self:center}
.esc-balance b{font-size:64px;font-weight:900;letter-spacing:-2px;line-height:1}
.esc-balance span{font-size:20px;font-weight:700}
.esc-bar{position:relative;height:18px;margin:0 9px}
.esc-bar-track{position:absolute;left:0;right:0;top:5px;height:8px;border-radius:4px;opacity:.25}
.esc-bar-fill{position:absolute;left:0;top:5px;height:8px;border-radius:4px}
.esc-bar-mark{position:absolute;top:0;width:18px;height:18px;border-radius:50%;border:3px solid;margin-left:-9px}
.esc-unlocked{border-radius:16px;padding:14px 16px;font-size:18px;font-weight:800;text-align:center}
.esc-section-label{font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.8px;margin-top:4px}
.esc-catalog{display:flex;flex-direction:column;gap:8px}
.esc-cat{display:flex;align-items:center;gap:10px;border:1.5px solid;border-radius:14px;padding:12px 14px;background:none;text-align:left;width:100%;font-family:var(--font-body)}
.esc-cat.ready{padding:14px}
.esc-cat-name{flex:1;font-size:16px;font-weight:700}
.esc-cat-cost{font-size:15px;font-weight:700}
.esc-cat-pill{border-radius:999px;padding:6px 12px;font-size:14px;font-weight:800}
.esc-badge{display:inline-flex;background:#fff;border-radius:18px;overflow:hidden}
.esc-badge div{display:flex;align-items:center;gap:8px;padding:8px 16px;font-size:26px;font-weight:900}
.esc-badge img{width:30px;height:30px}
.esc-ladder{display:flex}
.esc-ladder div{flex:1;display:flex;flex-direction:column;align-items:center;gap:8px;position:relative}
.esc-ladder-line{position:absolute;top:12px;right:50%;width:100%;height:3px}
.esc-ladder-dot{width:26px;height:26px;border-radius:50%;border:3px solid;position:relative}
.esc-ladder-name{font-size:13px}
.esc-cli-error{margin:0 20px 8px;border-radius:14px;padding:14px;font-size:15px;font-weight:700;text-align:center}
.esc-cli-actions{padding:0 20px calc(8px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:10px}
.esc-cli-actions .esc-btn{background:var(--btn-bg);color:var(--btn-fg)}
.esc-amount{border:2px solid;border-radius:16px;padding:10px 16px;display:flex;flex-direction:column;gap:2px}
.esc-amount label{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.8px;opacity:.8}
.esc-amount-row{display:flex;align-items:center;gap:6px;font-size:30px;font-weight:800}
.esc-amount input{flex:1;min-width:0;font:inherit;font-size:34px;font-weight:800;background:transparent;border:none;outline:none;color:inherit;padding:2px 0;width:100%}
.esc-amount input::placeholder{color:currentColor;opacity:.4}
.esc-amount small{font-size:13px;opacity:.75}
.esc-toast{position:fixed;left:0;right:0;bottom:110px;display:flex;justify-content:center;z-index:70;pointer-events:none}
.esc-toast div{pointer-events:auto;display:flex;align-items:center;gap:14px;background:#1F1F1F;color:#fff;border-radius:18px;padding:10px 10px 10px 18px;font-size:15px;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,.3)}
.esc-toast button{background:#fff;color:#1F1F1F;border:none;border-radius:12px;padding:10px 16px;font-size:15px;font-weight:800}

.esc-done{width:100%;max-width:520px;min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:28px;text-align:center}
.esc-done-kicker{font-size:13px;font-weight:800;color:var(--coral);text-transform:uppercase;letter-spacing:1px}
.esc-done-title{font-family:var(--font-display);font-size:34px;font-weight:900;letter-spacing:-.5px;line-height:1.1}
.esc-done-sub{font-size:17px;color:var(--soft);line-height:1.45;max-width:360px}
.esc-done-actions{display:flex;flex-direction:column;gap:10px;width:100%;max-width:340px;margin-top:14px}
.esc-progress{width:100%;max-width:260px;height:5px;border-radius:3px;background:var(--faint);overflow:hidden;margin-top:6px}
.esc-progress i{display:block;height:100%;background:var(--coral);animation:esc-bar linear forwards}
@keyframes esc-bar{from{width:100%}to{width:0}}
.esc-cel{width:100%;max-width:520px;min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px;gap:12px;text-align:center}
.esc-cel-kicker{font-size:20px;font-weight:800}
.esc-cel-note{font-size:15px;font-weight:600;margin-top:8px}
.esc-cel-perk{font-size:22px;font-weight:800;margin-top:8px}
`
