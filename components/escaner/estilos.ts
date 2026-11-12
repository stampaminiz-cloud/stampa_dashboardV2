// Estilos del escáner web. Mismo sistema visual que el panel (salvia, pino,
// Red Hat), pensado para el celular: botones grandes, una mano, pantalla
// completa. En la compu se ve como un celular centrado.
export const ESCANER_CSS = `
.esc-root{min-height:100dvh;background:var(--s-salvia,#F1F3EE);color:var(--s-tinta,#22201B);font-family:var(--font-body,system-ui);display:flex;justify-content:center}
.esc-root *{box-sizing:border-box}
.esc-root button{font:inherit;cursor:pointer}
.esc-root button:disabled{cursor:default;opacity:.55}
.esc-app,.esc-page{width:100%;max-width:520px;min-height:100dvh;display:flex;flex-direction:column;position:relative}
.esc-page{padding:20px 20px 32px;gap:14px}
.esc-page--center{justify-content:center;align-items:center;text-align:center}
.esc-center{flex:1;display:flex;align-items:center;justify-content:center;min-height:200px}
.esc-spinner{width:34px;height:34px;border-radius:50%;border:4px solid rgba(27,65,47,.15);border-top-color:#1B412F;animation:esc-spin .8s linear infinite}
@keyframes esc-spin{to{transform:rotate(360deg)}}
.esc-brand{display:flex;align-items:center;gap:8px;font-family:var(--font-display);font-weight:700;color:#1B412F;margin-bottom:6px}
.esc-brand b{font-size:22px;letter-spacing:-.01em}
.esc-brand span{font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--s-tinta-2)}
.esc-help-corner{position:absolute;top:18px;right:18px}
.esc-h1{font-family:var(--font-display);font-size:24px;font-weight:700;line-height:1.2;margin:4px 0 0}
.esc-p{margin:0;font-size:15px;line-height:1.5;color:var(--s-tinta-2)}
.esc-stack{display:flex;flex-direction:column;gap:10px}
.esc-box{background:#fff;border:1px solid var(--s-linea);border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:8px;font-size:14px;line-height:1.45}
.esc-box span{color:var(--s-tinta-2)}
.esc-btn{background:#1B412F;color:#fff;border:none;border-radius:14px;padding:14px 16px;font-weight:700;font-size:15px;text-align:center}
.esc-btn--line{background:#fff;color:#1B412F;border:1.5px solid #1B412F}
.esc-btn--sm{padding:7px 12px;font-size:13px;border-radius:10px}
.esc-btn--big{width:100%;padding:17px;font-size:17px;border-radius:16px}
.esc-link{background:none;border:none;color:#1B412F;font-weight:700;text-decoration:underline;padding:8px;font-size:14px}
.esc-link--soft{color:var(--s-tinta-2);font-weight:500}
.esc-round{width:38px;height:38px;border-radius:50%;border:1px solid var(--s-linea);background:#fff;font-weight:700;color:#1B412F;flex-shrink:0}
.esc-chip{display:inline-flex;align-items:center;gap:4px;font-size:12.5px;font-weight:700;background:#E3EDE6;color:#1B412F;border:none;border-radius:999px;padding:6px 11px;white-space:nowrap;max-width:150px;overflow:hidden;text-overflow:ellipsis}
.esc-input{width:100%;font:inherit;font-size:16px;padding:13px 14px;border-radius:12px;border:1.5px solid var(--s-linea);background:#fff;color:inherit}
.esc-input:focus{outline:none;border-color:#1B412F}
.esc-error{background:var(--s-error-suave);color:var(--s-error);border-radius:12px;padding:10px 12px;font-size:14px;font-weight:600}
.esc-banner{margin:0 16px;border-radius:12px;padding:10px 12px;font-size:13.5px;line-height:1.45;display:flex;flex-direction:column;gap:2px;align-items:flex-start}
.esc-page .esc-banner{margin:0}
.esc-banner--warn{background:#FBEFE3;color:#7a4a14;border:1px solid #EBCFAE}
.esc-banner--ok{background:#E3EDE6;color:#1B412F;border:1px solid #c9dccf}
.esc-banner .esc-link{padding:4px 0}
.esc-where{display:flex;flex-direction:column;align-items:center;gap:6px;margin-top:18px;font-size:17px}
.esc-dots{display:flex;gap:12px;justify-content:center;margin:8px 0}
.esc-dots span{width:16px;height:16px;border-radius:50%;background:#cfd8cc}
.esc-dots span.on{background:#1B412F}
.esc-dots--sm span{width:8px;height:8px}
.esc-pad{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;max-width:320px;width:100%;margin:6px auto}
.esc-pad button{background:#fff;border:1px solid var(--s-linea);border-radius:16px;padding:16px 0;font-size:24px;font-weight:700;color:var(--s-tinta)}
.esc-pad button:active{background:#E3EDE6}
.esc-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 16px 8px;position:relative}
.esc-hello{font-family:var(--font-display);font-size:19px;font-weight:700}
.esc-biz{font-size:13px;color:var(--s-tinta-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.esc-head-end{display:flex;align-items:center;gap:6px}
.esc-menu{position:absolute;right:16px;top:60px;background:#fff;border-radius:14px;box-shadow:var(--s-sombra-alta);display:flex;flex-direction:column;z-index:20;overflow:hidden;min-width:220px}
.esc-menu button{background:none;border:none;text-align:left;padding:13px 16px;font-size:14px;border-bottom:1px solid var(--s-linea)}
.esc-today{display:flex;align-items:center;margin:4px 16px 10px;background:#fff;border:1px solid var(--s-linea);border-radius:14px;padding:9px 6px;font-size:12.5px;color:var(--s-tinta-2)}
.esc-today span{flex:1;text-align:center}
.esc-today b{font-size:19px;color:var(--s-tinta);margin-right:4px}
.esc-today i{width:1px;height:22px;background:var(--s-linea)}
.esc-main{flex:1;display:flex;flex-direction:column;min-height:0;padding:10px 16px 12px}
.esc-cam{position:relative;flex:1;min-height:340px;border-radius:20px;overflow:hidden;background:#1f2723}
.esc-cam-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.esc-cam-frame{position:absolute;left:18%;right:18%;top:20%;aspect-ratio:1;border:3px solid #9fe0b4;border-radius:22px;box-shadow:0 0 0 2000px rgba(0,0,0,.28);pointer-events:none}
.esc-cam-hint{position:absolute;left:0;right:0;bottom:16px;text-align:center;color:#eaf2ec;font-size:14px;font-weight:600;text-shadow:0 1px 3px rgba(0,0,0,.5)}
.esc-cam-msg{position:absolute;inset:0;display:flex;flex-direction:column;gap:6px;align-items:center;justify-content:center;text-align:center;padding:24px;color:#eaf2ec;font-size:14px;line-height:1.5}
.esc-cam-msg--warn{background:#FBEFE3;color:#7a4a14}
.esc-cam-flash{position:absolute;top:12px;right:12px;background:rgba(255,255,255,.92);border:none;border-radius:999px;padding:7px 12px;font-size:12.5px;font-weight:700;color:#1B412F}
.esc-nav{display:flex;background:#fff;border-top:1px solid var(--s-linea);padding-bottom:env(safe-area-inset-bottom)}
.esc-nav button{flex:1;background:none;border:none;padding:9px 0 11px;font-size:12px;color:var(--s-tinta-2);display:flex;flex-direction:column;align-items:center;gap:1px}
.esc-nav button span{font-size:19px;line-height:1}
.esc-nav button.on{color:#1B412F;font-weight:700}
.esc-pane{display:flex;flex-direction:column;gap:8px}
.esc-row{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid var(--s-linea);border-radius:14px;padding:11px 12px;text-align:left;font-size:14px;color:inherit;width:100%}
.esc-row b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.esc-row-sub{font-size:12.5px;color:var(--s-tinta-2);display:block}
.esc-row-dot{width:12px;height:12px;border-radius:50%;flex-shrink:0}
.esc-empty{text-align:center;font-size:13px;color:var(--s-tinta-2);padding:14px 8px;line-height:1.5}
.esc-option{background:#fff;border:1px solid var(--s-linea);border-radius:14px;padding:13px 14px;text-align:left;display:flex;flex-direction:column;gap:2px;font-size:15px;color:inherit}
.esc-option span{font-size:12.5px;color:var(--s-tinta-2)}
.esc-sheet-bg{position:fixed;inset:0;background:rgba(20,22,20,.4);display:flex;align-items:flex-end;justify-content:center;z-index:50}
.esc-sheet{background:var(--s-salvia,#F1F3EE);width:100%;max-width:520px;max-height:86dvh;overflow:auto;border-radius:20px 20px 0 0;padding:16px 16px calc(24px + env(safe-area-inset-bottom))}
.esc-sheet-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-size:18px;font-family:var(--font-display)}
.esc-faq{background:#fff;border:1px solid var(--s-linea);border-radius:14px;overflow:hidden}
.esc-faq button{width:100%;background:none;border:none;display:flex;justify-content:space-between;gap:10px;padding:13px 14px;text-align:left;font-size:15px;color:inherit}
.esc-faq p{margin:0;padding:0 14px 14px;font-size:14px;line-height:1.5;color:var(--s-tinta-2)}
.esc-slide-icon{width:84px;height:84px;border-radius:24px;background:#1B412F;color:#fff;font-size:38px;display:flex;align-items:center;justify-content:center}
.esc-overlay{position:fixed;inset:0;z-index:40;display:flex;justify-content:center;background:var(--s-salvia,#F1F3EE)}
.esc-cli{width:100%;max-width:520px;min-height:100dvh;display:flex;flex-direction:column;overflow:auto}
.esc-cli-top{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:16px}
.esc-cli-card{font-size:13px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.esc-cli-close{background:none;border:1.5px solid;border-radius:999px;padding:7px 13px;font-weight:700;font-size:13px}
.esc-cli-body{flex:1;padding:4px 20px 16px;display:flex;flex-direction:column;gap:12px;font-size:15px}
.esc-cli-name{font-family:var(--font-display);font-size:28px;font-weight:700;line-height:1.15}
.esc-cli-pill{border:1.5px solid;border-radius:12px;padding:8px 12px;font-weight:700;font-size:14px}
.esc-cli-bday{display:flex;align-items:center;gap:12px;border-radius:16px;padding:12px}
.esc-cli-kicker{font-size:11.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase}
.esc-cli-limit{background:#FBEFE3;color:#7a4a14;border-radius:14px;padding:11px 13px;font-size:14px;line-height:1.45}
.esc-cli-prize{border:2px dashed;border-radius:18px;padding:16px;display:flex;flex-direction:column;gap:6px}
.esc-cli-prize-name{font-family:var(--font-display);font-size:24px;font-weight:700}
.esc-stamps{display:grid;gap:10px;max-width:340px}
.esc-stamp{aspect-ratio:1;border-radius:50%;border:2px solid;display:flex;align-items:center;justify-content:center;font-size:20px;opacity:.9}
.esc-stamp--on{border:none}
.esc-cli-big{font-family:var(--font-display);font-size:22px;font-weight:700}
.esc-cli-balance{font-family:var(--font-display);font-size:44px;font-weight:800;line-height:1}
.esc-cli-balance span{font-size:18px;font-weight:600}
.esc-cli-catalog{display:flex;flex-direction:column;gap:8px}
.esc-cli-item{display:flex;justify-content:space-between;gap:10px;background:none;border:1.5px solid;border-radius:12px;padding:11px 13px;font-size:15px;text-align:left}
.esc-cli-error{margin:0 16px 8px;border-radius:12px;padding:10px 12px;font-weight:600;font-size:14px}
.esc-cli-actions{padding:8px 16px calc(18px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:10px}
.esc-amount{border:1.5px solid;border-radius:16px;padding:12px;display:flex;flex-direction:column;gap:8px}
.esc-amount-value{font-family:var(--font-display);font-size:30px;font-weight:800;text-align:center}
.esc-amount-hint{font-size:12.5px;text-align:center;opacity:.85}
.esc-keys{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}
.esc-key{background:none;border:1px solid;border-radius:12px;padding:10px 0;font-size:20px;font-weight:700}
.esc-done{width:100%;max-width:520px;min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:24px;text-align:center}
.esc-done-ok{width:76px;height:76px;border-radius:50%;background:#2E7D4F;color:#fff;font-size:42px;display:flex;align-items:center;justify-content:center}
.esc-done-big{font-size:64px;line-height:1}
.esc-done-title{font-family:var(--font-display);font-size:26px;font-weight:700}
.esc-done-sub{font-size:15px;color:var(--s-tinta-2);line-height:1.45;max-width:360px}
.esc-done-actions{display:flex;flex-direction:column;gap:10px;width:100%;max-width:340px;margin-top:10px}
.esc-progress{width:100%;max-width:260px;height:5px;border-radius:3px;background:rgba(27,65,47,.15);overflow:hidden}
.esc-progress i{display:block;height:100%;background:#1B412F;animation:esc-bar linear forwards}
@keyframes esc-bar{from{width:100%}to{width:0}}
`
