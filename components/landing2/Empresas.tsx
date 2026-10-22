'use client'
// /empresas: Stampa Enterprise, para marcas con 4 locales o más (Pro llega
// a 3). Tono más sobrio que la landing: la maqueta blanca con los locales de
// una marca, lo que pasa en vivo, los tres modelos y un pedido de demo que
// se manda por WhatsApp (no guardamos nada del formulario).
import { useEffect, useRef, useState } from 'react'
import { Icon, type IconName } from '@/components/ui/Icon'
import { Pass } from './Pass'
import { PROOF, whatsappLink, WHATSAPP_ENTERPRISE } from './data'
import { CSS } from './styles'

// Locales de ejemplo (barrios de Córdoba capital) con sus visitas del mes
const SEDES: [string, number][] = [['Cerro de las Rosas', 5120], ['Argüello', 4610], ['Villa Belgrano', 3980], ['Alta Córdoba', 4870], ['Centro', 3720], ['General Paz', 3550], ['Alberdi', 3210], ['Nueva Córdoba', 3890], ['Güemes', 2980], ['San Vicente', 2640], ['Jardín', 2660]]
const EVS: [string, IconName][] = [['sumó un sello', 'sello'], ['guardó la tarjeta', 'wallet'], ['canjeó su premio', 'premios'], ['sumó 120 puntos', 'puntos'], ['subió a nivel Oro', 'membresia']]
const WHO = ['Lucía', 'Martín', 'Sofía', 'Ana', 'Pablo', 'Inés', 'Carla', 'Diego', 'Lara', 'Tomás', 'Rocío']

const C = .866, S = .5
const P = (x: number, y: number, z = 0): [number, number] => [(x - y) * C, (x + y) * S - z]
const pt = (a: number[][]) => a.map(p => P(p[0], p[1], p[2]).map(n => n.toFixed(1)).join(',')).join(' ')
const poly = (a: number[][], f: string) => `<polygon points="${pt(a)}" fill="${f}"/>`

function buildBrandMap() {
  let sd = 21
  const R = () => { sd = (sd * 9301 + 49297) % 233280; return sd / 233280 }
  const B = 80, ST = 26, NX = 9, NY = 8, W = NX * (B + ST), H = NY * (B + ST)
  const items: { z: number; h: string }[] = []
  let base = poly([[-60, -60, 0], [W + 30, -60, 0], [W + 30, H + 30, 0], [-60, H + 30, 0]], '#F6F5F1')
  const gx0 = 4, gy0 = 3, px0 = gx0 * (B + ST), py0 = gy0 * (B + ST), pcx = px0 + B / 2, pcy = py0 + B / 2
  base += poly([[px0, py0, 0], [px0 + B, py0, 0], [px0 + B, py0 + B, 0], [px0, py0 + B, 0]], '#E2E8D8')
  const [fx, fy] = P(pcx, pcy)
  base += `<ellipse cx="${fx}" cy="${fy}" rx="20" ry="10" fill="#E3DFD6"/><ellipse cx="${fx}" cy="${fy - 3}" rx="15" ry="7" fill="#CFE2E8"/>`
  for (let t = 0; t < 9; t++) { const x = px0 + 8 + R() * (B - 16), y = py0 + 8 + R() * (B - 16); if (Math.hypot(x - pcx, y - pcy) < 22) continue; const [bx, by] = P(x, y), [cx, cy] = P(x, y, 13); items.push({ z: x + y, h: `<line x1="${bx}" y1="${by}" x2="${bx}" y2="${by - 7}" stroke="#C9C1B1" stroke-width="1.5"/><circle cx="${cx}" cy="${cy}" r="${6 + R() * 3}" fill="${['#D3DCC7', '#C5D2B8', '#DCE4D1'][t % 3]}"/>` }) }
  const spots = [[1, 1, 1, 1], [3, 0, 1, 1], [6, 1, 0, 1], [2, 3, 0, 0], [5, 2, 1, 0], [7, 3, 0, 0], [1, 5, 1, 0], [3, 5, 0, 1], [6, 5, 0, 0], [7, 6, 1, 1], [4, 6, 1, 0]]
  const isLot: Record<string, number> = {}
  spots.forEach((s, k) => { isLot[s.join(',')] = k })
  const lots: [number, number][] = []
  for (let gx = 0; gx < NX; gx++) for (let gy = 0; gy < NY; gy++) {
    if (gx === gx0 && gy === gy0) continue
    const x = gx * (B + ST), y = gy * (B + ST)
    for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
      const x0 = x + a * (B / 2) + 2, y0 = y + b * (B / 2) + 2, w = B / 2 - 4, d = B / 2 - 4
      const k = isLot[[gx, gy, a, b].join(',')], mine = k !== undefined
      const h = mine ? 62 + R() * 10 : 12 + R() * 40
      const f = mine ? ['#2E5C46', '#122E21', '#3F7A5C'] : ['#EFEDE8', '#E0DDD6', '#FFFFFF']
      let g = poly([[x0, y0 + d, 0], [x0 + w, y0 + d, 0], [x0 + w, y0 + d, h], [x0, y0 + d, h]], f[0]) + poly([[x0 + w, y0, 0], [x0 + w, y0 + d, 0], [x0 + w, y0 + d, h], [x0 + w, y0, h]], f[1]) + poly([[x0, y0, h], [x0 + w, y0, h], [x0 + w, y0 + d, h], [x0, y0 + d, h]], f[2])
      if (mine) { lots[k] = P(x0 + w / 2, y0 + d / 2, h + 24); g += poly([[x0 + w * .15, y0 + d, h * .12], [x0 + w * .6, y0 + d, h * .12], [x0 + w * .6, y0 + d, h * .42], [x0 + w * .15, y0 + d, h * .42]], 'rgba(255,240,215,.8)') }
      items.push({ z: x0 + y0, h: g })
    }
  }
  const [cx, cy] = P(W / 2, H / 2)
  const vb = [cx - 430, cy - 300, 860, 560]
  let svg = `<svg viewBox="${vb.join(' ')}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Maqueta con los locales de una marca">${base}`
  items.sort((p, q) => p.z - q.z).forEach(i => { svg += i.h })
  lots.forEach(([tx, ty]) => { svg += `<line x1="${tx}" y1="${ty}" x2="${tx}" y2="${ty + 16}" stroke="#1B412F" stroke-width="2"/><circle cx="${tx}" cy="${ty}" r="8" fill="#fff" stroke="#1B412F" stroke-width="3"/>` })
  return { svg: svg + '<g class="l2-ering"></g></svg>', lots, vb }
}

function BrandMap() {
  const ref = useRef<HTMLDivElement>(null)
  const [feed, setFeed] = useState<{ id: number; sede: string; who: string; ev: string; icon: IconName }[]>([])
  useEffect(() => {
    const stage = ref.current
    if (!stage) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const { svg, lots, vb } = buildBrandMap()
    stage.innerHTML = svg
    const el = stage.querySelector('svg') as SVGSVGElement
    const ring = el.querySelector('.l2-ering') as SVGGElement
    let anim = 0, n = 0
    const tick = () => {
      const k = Math.floor(Math.random() * lots.length), ev = EVS[n % EVS.length], who = WHO[(n * 7) % WHO.length]
      n++
      const [tx, ty] = lots[k]
      ring.innerHTML = `<circle class="l2-ring" cx="${tx}" cy="${ty}" r="10" fill="none" stroke="#C75D3A" stroke-width="3"/>`
      setFeed(f => [{ id: Date.now() + Math.random(), sede: SEDES[k][0], who, ev: ev[0], icon: ev[1] }, ...f].slice(0, 3))
      const tw = vb[2] * .86, th = vb[3] * .86, target = [tx - tw / 2, ty - th / 2 + 60, tw, th]
      const from = (el.getAttribute('viewBox') || '').split(' ').map(Number), t0 = performance.now(), D = reduce ? 0 : 800
      cancelAnimationFrame(anim)
      const f = (t: number) => { const u = D ? Math.max(0, Math.min((t - t0) / D, 1)) : 1, e = 1 - Math.pow(1 - u, 3); el.setAttribute('viewBox', from.map((v, i) => v + (target[i] - v) * e).join(' ')); if (u < 1) anim = requestAnimationFrame(f) }
      anim = requestAnimationFrame(f)
    }
    tick()
    const t = setInterval(tick, reduce ? 4000 : 1900)
    return () => { clearInterval(t); cancelAnimationFrame(anim) }
  }, [])
  return (
    <div className="l2-maq l2-emap">
      <div className="l2-maq-stage" ref={ref} />
      <div className="l2-maq-fade" />
      <span className="l2-pill l2-emap-tag">Tu marca · 11 locales</span>
      <div className="l2-efeed">
        <div className="l2-efeed-h"><span className="l2-live-dot" />En vivo, en todos tus locales</div>
        {feed.map((r, i) => <div key={r.id} className={`l2-erow${i === 0 ? ' first' : ''}`}><span className="l2-mini" style={{ background: '#1B412F' }}><Icon name={r.icon} size={16} /></span><span><b>{r.sede}</b><small>{r.who} {r.ev}</small></span><em>{i === 0 ? 'ahora' : `hace ${i * 2} s`}</em></div>)}
      </div>
    </div>
  )
}

const CAPS: [IconName, string, string][] = [
  ['negocio', 'Locales ilimitados', 'Cada local escanea con su equipo y lo ves por separado o todo junto.'],
  ['diseno', 'Tu marca en todo', 'Sin la marca Stampa en la tarjeta, el formulario y los avisos.'],
  ['equipo', 'Roles y accesos', 'Dueños, encargados y equipo que escanea con su PIN.'],
  ['wallet', 'Apple y Google Wallet', 'Tarjetas oficiales, en los dos sistemas, que se actualizan solas.'],
  ['candado', 'Datos cuidados', 'Copias de seguridad cifradas todas las noches. Los datos de tus clientes son tuyos.'],
  ['whatsapp', 'Soporte dedicado', 'Una persona de Stampa que conoce tu cuenta, por WhatsApp y por mail.'],
]

export default function Empresas() {
  const [rubro, setRubro] = useState('Gastronomía')
  const [form, setForm] = useState({ nombre: '', empresa: '', locales: '4 a 10', pais: 'Argentina', contacto: '' })
  const [err, setErr] = useState('')
  useEffect(() => {
    const els = document.querySelectorAll('.l2-reveal')
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }), { threshold: .12 })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])
  const max = Math.max(...SEDES.map(s => s[1]))
  // El pedido de demo sale por WhatsApp, con los datos ya escritos.
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre.trim() || !form.empresa.trim() || !form.contacto.trim()) { setErr('Completá tu nombre, la empresa y cómo te contactamos.'); return }
    setErr('')
    const text = `Hola! Quiero una demo de Stampa Enterprise.\nNombre: ${form.nombre}\nEmpresa: ${form.empresa}\nRubro: ${rubro}\nLocales: ${form.locales}\nPaís: ${form.pais}\nContacto: ${form.contacto}`
    window.open(whatsappLink(text), '_blank', 'noopener')
  }
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="l2">
      <style dangerouslySetInnerHTML={{ __html: CSS + ECSS }} />
      <div className="l2-frame">
        <nav className="l2-nav" aria-label="Principal">
          <a href="/" className="l2-brand l2-ebrand"><img src="/assets/wordmark.png" alt="Stampa" /><span>Empresas</span></a>
          <div className="l2-links"><a href="#enterprise">Enterprise</a><a href="#modelos">Modelos</a><a href="#panel">Panel</a><a href="#demo">Demo</a></div>
          <div className="l2-nav-r"><a className="l2-btn l2-btn-pino l2-btn-sm" href="#demo">Agendar una demo</a></div>
        </nav>

        <header className="l2-ehero">
          <div>
            <p className="l2-kicker" style={{ color: 'var(--l2-pino)' }}>Stampa Enterprise</p>
            <h1 className="l2-h1 l2-eh1">Una tarjeta para toda tu marca.<br /><span className="l2-gris">En todos tus locales.</span></h1>
            <p className="l2-lead" style={{ marginTop: 20, maxWidth: 520 }}>Para marcas con cuatro locales o más. Tus clientes guardan tu tarjeta en Apple Wallet o Google Wallet y suman en cualquiera de tus locales. Vos ves todo en un panel, local por local.</p>
            <div className="l2-ctas" style={{ justifyContent: 'flex-start' }}><a className="l2-btn l2-btn-pino" href="#demo">Agendar una demo</a><a className="l2-btn l2-btn-line" href="#panel">Ver el panel</a></div>
            <div className="l2-efacts"><span><Icon name="negocio" size={18} />Locales ilimitados</span><span><Icon name="diseno" size={18} />Con tu marca</span><span><Icon name="whatsapp" size={18} />Soporte dedicado</span></div>
          </div>
          <BrandMap />
        </header>

        <div className="l2-etrust"><span>Ya trabajan con Stampa</span>{PROOF.map(l => <span key={l.name} className="l2-etl"><span style={{ background: l.bg }}><img src={l.logo} alt="" /></span>{l.name}</span>)}</div>

        <section className="l2-sec l2-reveal" id="enterprise">
          <div className="l2-sec-head"><p className="l2-kicker">Cuándo es Enterprise</p><h2 className="l2-h2">Desde el cuarto local, <span className="l2-gris">Enterprise.</span></h2><p className="l2-lead" style={{ marginTop: 14 }}>Pro llega hasta 3 locales. Si tenés más, o querés tu marca en todo y alguien de Stampa para tu cuenta, es Enterprise.</p></div>
          <div className="l2-eplans">
            <div className="l2-eplan"><div className="l2-eplan-top"><b>Pro</b><span>Hasta 3 locales</span></div>
              <ul><li><Icon name="listo" size={16} />3 locales</li><li><Icon name="listo" size={16} />Clientes, tarjetas, equipo y notificaciones ilimitados</li><li><Icon name="listo" size={16} />Avisos automáticos y pedidos por la tarjeta</li><li><Icon name="listo" size={16} />Sin la marca Stampa en la tarjeta y el formulario</li></ul>
              <div className="l2-elocs">{Array.from({ length: 8 }, (_, i) => <span key={i} className={i < 3 ? 'on' : ''} />)}</div></div>
            <div className="l2-eplan dark"><div className="l2-eplan-top"><b>Enterprise</b><span>4 locales o más</span></div>
              <ul><li><Icon name="listo" size={16} />Todo lo de Pro</li><li><Icon name="listo" size={16} />Locales ilimitados</li><li><Icon name="listo" size={16} />Tu marca en todo</li><li><Icon name="listo" size={16} />Soporte dedicado y puesta en marcha con vos</li></ul>
              <div className="l2-elocs">{Array.from({ length: 8 }, (_, i) => <span key={i} className="on" />)}<span className="more">+</span></div></div>
          </div>
        </section>

        <section className="l2-sec l2-reveal" id="modelos">
          <div className="l2-sec-head"><p className="l2-kicker">Tres modelos</p><h2 className="l2-h2">Sellos, puntos o membresía. <span className="l2-gris">Los tres, en todos tus locales.</span></h2></div>
          <div className="l2-emodels">
            <div><Pass b={{ name: 'Tu marca', color: '#6B2D1F', icon: 'cafe', model: 'sellos', head: ['SELLOS', '5 de 8'], stamps: 5, who: 'Lucía G.', wa: 'PEDIDOS' }} width={210} qr={false} /><b>Sellos</b><p>Cada visita suma un sello. Al completar la tarjeta, el premio.</p></div>
            <div><Pass b={{ name: 'Tu marca', color: '#1F3A5F', icon: 'puntos', model: 'puntos', head: ['PRÓXIMO PREMIO', 'Combo 2x1'], points: '1.240', next: 'Te faltan 260', who: 'Martín R.', wa: 'CONSULTAS' }} width={210} qr={false} /><b>Puntos</b><p>Suman por visita o por monto, y los canjean por los premios que elijas.</p></div>
            <div><Pass b={{ name: 'Tu marca', color: '#1B412F', icon: 'membresia', model: 'membresia', head: ['NIVEL', 'Plata'], tier: ['Plata', 'Oro', 68, 'Te faltan 4 visitas para Oro'], who: 'Sofía P.', wa: 'CONSULTAS' }} width={210} qr={false} /><b>Membresía</b><p>Niveles con beneficios: cuanto más vienen, más alto el nivel.</p></div>
          </div>
        </section>

        <section className="l2-sec l2-reveal" id="panel">
          <div className="l2-sec-head"><p className="l2-kicker">Panel</p><h2 className="l2-h2">Todos tus locales, <span className="l2-gris">en una pantalla.</span></h2><p className="l2-lead" style={{ marginTop: 14 }}>Visitas, clientes nuevos y los que dejaron de venir, por local o de toda la marca.</p></div>
          <div className="l2-epanel">
            <div className="l2-ecard"><h4><span>Visitas del mes por local</span><span>Octubre</span></h4>
              {[...SEDES].sort((a, b) => b[1] - a[1]).map(([n, v]) => <div key={n} className="l2-esede"><span>{n}</span><div className="l2-ebar"><i style={{ width: `${v / max * 100}%` }} /></div><b>{v.toLocaleString('es-AR')}</b></div>)}
            </div>
            <div className="l2-ekpis">
              <div><span>Clientes con la tarjeta</span><b>8.420</b><small>+312 este mes</small></div>
              <div><span>Visitas del mes</span><b>41.230</b><small>+6% vs. septiembre</small></div>
              <div><span>Volvieron este mes</span><b>74%</b><small>de los clientes activos</small></div>
              <div><span>Sin venir hace 3 semanas</span><b>612</b><small className="warn">para escribirles</small></div>
            </div>
          </div>
          <p className="l2-ex">Números de ejemplo para una marca con 11 locales en Córdoba.</p>
        </section>

        <section className="l2-sec l2-reveal">
          <div className="l2-sec-head"><p className="l2-kicker">Para equipos grandes</p><h2 className="l2-h2">Lo que necesita una empresa, <span className="l2-gris">sin vueltas.</span></h2></div>
          <div className="l2-ecaps">{CAPS.map(([ic, t, d]) => <div key={t}><Icon name={ic} size={24} /><h5>{t}</h5><p>{d}</p></div>)}</div>
        </section>

        <section className="l2-sec l2-reveal">
          <div className="l2-sec-head"><p className="l2-kicker">Cómo arrancamos</p><h2 className="l2-h2">En marcha en semanas, <span className="l2-gris">no en meses.</span></h2></div>
          <div className="l2-esteps">
            {[['01', 'Una llamada', 'Entendemos cómo funcionan tus locales y qué querés lograr.'], ['02', 'Armamos todo con vos', 'Tarjetas, premios, locales y equipo, con tu marca.'], ['03', 'Capacitamos al equipo', 'Cada local aprende a escanear y a usar el panel en una sesión corta.'], ['04', 'Lanzamos y medimos', 'Te acompañamos el primer mes y revisamos los números juntos.']].map(([n, t, d]) => <div key={n}><span>{n}</span><h5>{t}</h5><p>{d}</p></div>)}
          </div>
        </section>

        <section className="l2-edemo l2-reveal" id="demo">
          <div>
            <p className="l2-kicker" style={{ color: 'var(--l2-mostaza)' }}>Demo</p>
            <h2 className="l2-h2">Veamos cómo quedaría <span style={{ color: 'rgba(255,255,255,.5)' }}>en tu marca.</span></h2>
            <p className="l2-lead" style={{ color: 'rgba(255,255,255,.75)', marginTop: 16 }}>Te mostramos la tarjeta con tu logo, el panel con tus locales y cómo lo usaría tu equipo. 30 minutos.</p>
            <ul className="l2-edemo-l"><li><Icon name="listo" size={16} />Tu tarjeta de prueba, lista para llevarte en el Wallet</li><li><Icon name="listo" size={16} />Un plan a medida de tus locales</li><li><Icon name="listo" size={16} />El precio por escrito</li></ul>
          </div>
          <form className="l2-eform" onSubmit={submit} noValidate>
            <label>Nombre<input value={form.nombre} onChange={set('nombre')} autoComplete="name" /></label>
            <label>Empresa<input value={form.empresa} onChange={set('empresa')} autoComplete="organization" /></label>
            <label className="full">Rubro<div className="l2-chips">{['Gastronomía', 'Comercio', 'Salud y belleza', 'Deporte', 'Otro'].map(r => <button key={r} type="button" aria-pressed={rubro === r} onClick={() => setRubro(r)}>{r}</button>)}</div></label>
            <label>Cantidad de locales<select value={form.locales} onChange={set('locales')}><option>4 a 10</option><option>11 a 30</option><option>Más de 30</option></select></label>
            <label>País<select value={form.pais} onChange={set('pais')}><option>Argentina</option><option>España</option><option>Otro</option></select></label>
            <label className="full">WhatsApp o mail<input value={form.contacto} onChange={set('contacto')} autoComplete="email" /></label>
            {err && <p className="full l2-eerr" role="alert">{err}</p>}
            <button className="l2-btn l2-btn-pino full" type="submit"><Icon name="whatsapp" size={18} />Pedir la demo por WhatsApp</button>
            <p className="full l2-enote">Se abre WhatsApp con tus datos ya escritos. ¿Preferís que te llamemos? <a href={WHATSAPP_ENTERPRISE} target="_blank" rel="noopener noreferrer">Escribinos</a>.</p>
          </form>
        </section>

        <footer className="l2-ft l2-eft"><img src="/assets/wordmark.png" alt="Stampa" /><span><a href="mailto:hola@stampaclub.com">hola@stampaclub.com</a> · <a href="/">Stampa para negocios</a> · <a href="/terms">Términos</a> · <a href="/privacy">Privacidad</a></span></footer>
      </div>
    </div>
  )
}

const ECSS = `
.l2-ebrand{display:flex;align-items:center;gap:10px}
.l2-ebrand span{font-size:12px;font-weight:600;color:var(--l2-pino);background:var(--l2-salvia);border-radius:999px;padding:3px 9px}
.l2-btn-line{background:transparent;color:var(--l2-tinta);box-shadow:inset 0 0 0 1.5px var(--l2-linea)}
.l2-ehero{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);gap:clamp(20px,4vw,48px);align-items:center;padding:clamp(36px,6vw,72px) clamp(4px,2vw,24px) clamp(20px,3vw,32px)}
@media(max-width:900px){.l2-ehero{grid-template-columns:1fr}}
.l2-eh1{font-size:clamp(38px,5.4vw,72px)}
.l2-efacts{display:flex;gap:22px;flex-wrap:wrap;margin-top:28px;font-size:14px;color:var(--l2-t2)}
.l2-efacts span{display:inline-flex;gap:7px;align-items:center}.l2-efacts svg{color:var(--l2-pino)}
.l2-emap{margin-top:0;height:clamp(440px,42vw,560px)}
.l2-emap-tag{position:absolute;left:16px;top:16px;z-index:3;font-weight:600;color:var(--l2-tinta)}
.l2-efeed{position:absolute;z-index:3;left:14px;right:14px;bottom:14px;background:rgba(255,255,255,.94);backdrop-filter:blur(8px);border-radius:16px;padding:10px;box-shadow:0 16px 34px -18px rgba(30,29,26,.35);display:flex;flex-direction:column;gap:5px}
.l2-efeed-h{font-size:12px;font-weight:600;color:var(--l2-t2);display:flex;align-items:center;gap:7px;padding:2px 4px 4px}
.l2-live-dot{width:8px;height:8px;border-radius:50%;background:#2F9E5B;animation:l2pulse 2s infinite}
@keyframes l2pulse{70%{box-shadow:0 0 0 8px rgba(47,158,91,0)}0%{box-shadow:0 0 0 0 rgba(47,158,91,.5)}}
.l2-erow{display:flex;align-items:center;gap:10px;padding:6px;border-radius:11px;background:#fff;animation:l2drop .4s cubic-bezier(.2,1.2,.4,1)}
.l2-erow.first{box-shadow:inset 0 0 0 1.5px var(--l2-pino)}
.l2-erow>span:nth-child(2){flex:1;min-width:0}
.l2-erow b{display:block;font-size:13.5px}.l2-erow small{display:block;font-size:12px;color:var(--l2-t2)}
.l2-erow em{font-style:normal;font-size:11px;color:var(--l2-t3)}
.l2-erow .l2-mini{width:32px;height:32px}
.l2-etrust{display:flex;align-items:center;justify-content:center;gap:clamp(16px,4vw,44px);flex-wrap:wrap;padding:18px 10px 6px;color:var(--l2-t3);font-size:13px}
.l2-etl{display:inline-flex;align-items:center;gap:10px;color:var(--l2-t2);font-weight:600}
.l2-etl>span{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;padding:5px;overflow:hidden}
.l2-eplans{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:800px){.l2-eplans{grid-template-columns:1fr}}
.l2-eplan{background:var(--l2-salvia);border-radius:var(--l2-r);padding:26px;display:flex;flex-direction:column;gap:18px}
.l2-eplan.dark{background:var(--l2-pino);color:#fff}
.l2-eplan-top{display:flex;justify-content:space-between;align-items:baseline;gap:10px}
.l2-eplan-top b{font-family:var(--font-display);font-size:28px;font-weight:800;letter-spacing:-.02em}
.l2-eplan-top span{font-size:14px;color:var(--l2-t2)}.l2-eplan.dark .l2-eplan-top span{color:rgba(255,255,255,.7)}
.l2-eplan ul{list-style:none;display:flex;flex-direction:column;gap:10px;font-size:15px}
.l2-eplan li{display:flex;gap:9px}.l2-eplan li svg{color:var(--l2-pino);margin-top:3px;flex-shrink:0}.l2-eplan.dark li svg{color:var(--l2-mostaza)}
.l2-elocs{display:flex;gap:6px;flex-wrap:wrap;margin-top:auto}
.l2-elocs span{width:26px;height:26px;border-radius:8px;background:rgba(0,0,0,.06)}
.l2-elocs span.on{background:var(--l2-pino)}.l2-eplan.dark .l2-elocs span.on{background:var(--l2-mostaza)}
.l2-elocs .more{display:flex;align-items:center;justify-content:center;background:transparent!important;color:var(--l2-mostaza);font-weight:800}
.l2-emodels{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
@media(max-width:860px){.l2-emodels{grid-template-columns:1fr}}
.l2-emodels>div{background:var(--l2-salvia);border-radius:var(--l2-r);padding:24px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:10px}
.l2-emodels>div>b{font-family:var(--font-display);font-size:22px;font-weight:800;margin-top:8px}
.l2-emodels>div>p{font-size:14px;color:var(--l2-t2);line-height:1.5;max-width:260px}
.l2-epanel{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:12px}
@media(max-width:900px){.l2-epanel{grid-template-columns:1fr}}
.l2-ecard{background:var(--l2-salvia);border-radius:var(--l2-r);padding:22px}
.l2-ecard h4{font-size:13px;color:var(--l2-t2);font-weight:600;margin:0 0 14px;display:flex;justify-content:space-between}
.l2-esede{display:grid;grid-template-columns:130px 1fr 60px;gap:12px;align-items:center;font-size:13.5px;padding:5px 0}
.l2-ebar{height:10px;border-radius:5px;background:#fff;overflow:hidden}.l2-ebar i{display:block;height:100%;background:var(--l2-pino);border-radius:5px}
.l2-esede b{text-align:right;font-variant-numeric:tabular-nums}
.l2-ekpis{display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:1fr;gap:12px}
.l2-ekpis div{background:var(--l2-salvia);border-radius:var(--l2-r);padding:20px 22px;display:flex;flex-direction:column;justify-content:space-between}
.l2-ekpis span{font-size:12.5px;color:var(--l2-t2)}
.l2-ekpis b{display:block;font-family:var(--font-display);font-size:clamp(32px,3.4vw,44px);font-weight:800;letter-spacing:-.03em;margin-top:4px}
.l2-ekpis small{font-size:12px;color:#2F7A4F;font-weight:600}.l2-ekpis small.warn{color:var(--l2-brasa)}
.l2-ex{font-size:12px;color:var(--l2-t3);margin-top:12px}
.l2-ecaps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:var(--l2-linea);border-radius:var(--l2-r);overflow:hidden}
@media(max-width:900px){.l2-ecaps{grid-template-columns:1fr 1fr}}
@media(max-width:560px){.l2-ecaps{grid-template-columns:1fr}}
.l2-ecaps>div{background:#fff;padding:24px;display:flex;flex-direction:column;gap:8px}
.l2-ecaps svg{color:var(--l2-pino)}
.l2-ecaps h5{font-family:var(--font-display);font-size:18px;font-weight:700;margin:0}
.l2-ecaps p{font-size:14px;color:var(--l2-t2);line-height:1.5}
.l2-esteps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
@media(max-width:900px){.l2-esteps{grid-template-columns:1fr 1fr}}
@media(max-width:560px){.l2-esteps{grid-template-columns:1fr}}
.l2-esteps>div{border-top:2px solid var(--l2-pino);padding-top:16px}
.l2-esteps span{font-family:var(--font-display);font-weight:700;color:var(--l2-t3);font-size:14px}
.l2-esteps h5{font-family:var(--font-display);font-size:19px;font-weight:700;margin:6px 0}
.l2-esteps p{font-size:14px;color:var(--l2-t2);line-height:1.5}
.l2-edemo{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:clamp(20px,4vw,56px);background:var(--l2-pino);color:#fff;border-radius:var(--l2-r);padding:clamp(28px,5vw,60px) clamp(18px,4vw,52px);margin-top:12px}
@media(max-width:900px){.l2-edemo{grid-template-columns:1fr}}
.l2-edemo-l{list-style:none;margin-top:24px;display:flex;flex-direction:column;gap:10px;font-size:15px}
.l2-edemo-l li{display:flex;gap:10px;align-items:center}.l2-edemo-l svg{color:var(--l2-mostaza)}
.l2-eform{background:#fff;color:var(--l2-tinta);border-radius:18px;padding:22px;display:grid;grid-template-columns:1fr 1fr;gap:12px;align-content:start}
@media(max-width:560px){.l2-eform{grid-template-columns:1fr}}
.l2-eform label{display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600;color:var(--l2-t2)}
.l2-eform .full{grid-column:1/-1}
.l2-eform input,.l2-eform select{border:1.5px solid var(--l2-linea);border-radius:10px;padding:11px 12px;font:inherit;font-size:15px;color:var(--l2-tinta);background:#fff;width:100%}
.l2-eform input:focus,.l2-eform select:focus{outline:none;border-color:var(--l2-pino)}
.l2-chips{display:flex;flex-wrap:wrap;gap:6px}
.l2-chips button{border:1.5px solid var(--l2-linea);background:#fff;border-radius:999px;padding:7px 12px;font-size:13.5px;color:var(--l2-tinta)}
.l2-chips button[aria-pressed=true]{background:var(--l2-pino);border-color:var(--l2-pino);color:#fff}
.l2-eerr{font-size:13px;color:#B3261E;margin:0}
.l2-enote{font-size:12.5px;color:var(--l2-t2);margin:0}.l2-enote a{color:var(--l2-pino);font-weight:600;text-decoration:underline}
.l2-eft{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;font-size:13px;color:var(--l2-t2)}
.l2-eft img{height:16px;width:auto}
`
