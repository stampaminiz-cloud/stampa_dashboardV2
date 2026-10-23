'use client'
// Landing → "Lo que hace tu tarjeta sola" (pestañas), la vidriera de
// negocios, "Probala" y las preguntas frecuentes.
import { useEffect, useRef, useState } from 'react'
import { Icon, type IconName } from '@/components/ui/Icon'
import { QrImage } from '@/components/QrImage'
import { Pass } from './Pass'
import { SHOPS, PROOF, SURGE, DEMO_BUSINESS_ID, type Biz, type Model } from './data'

// ── Lo que hace tu tarjeta sola: avanza sola cada 9 s; si tocás, se queda
const NOTICES: [string, string, string, string][] = [
  ['BIENVENIDA', 'Café Aurora', '¡Bienvenida, Lucía! Ya tenés tu tarjeta. Al octavo sello, el café va de regalo.', '#6B2D1F'],
  ['TE EXTRAÑAMOS', 'Raíz Criolla', 'Hace un mes que no pasás, Martín. Esta semana tu compra suma el doble.', '#5C1414'],
  ['CUMPLEAÑOS', 'Studio Nina', '¡Feliz cumple, Sofía! Tu brushing de regalo te espera este mes.', '#3D3350'],
  ['RESEÑA', 'La Espiga', '¿Qué tal las medialunas, Ana? Contanos en Google.', '#8A5A2B'],
]
const AUTO: [IconName, string, string, string][] = [
  ['tocar', 'Bienvenida', 'Cuando guarda la tarjeta.', 'Pro'],
  ['triste', 'Te extrañamos', 'Cuando hace un tiempo que no viene.', 'Pro'],
  ['cumple', 'Cumpleaños', 'Con un regalo, el día que cumple.', 'Desde Growth'],
  ['estrella', 'Reseña en Google', 'Después de una visita.', 'Pro'],
]
type Tab = 'avisos' | 'cerca' | 'pedidos'
const ORDER: Tab[] = ['avisos', 'cerca', 'pedidos']
export function CardAlone() {
  const [tab, setTab] = useState<Tab>('avisos')
  const [auto, setAuto] = useState(true)
  const [shown, setShown] = useState(0)        // avisos que ya cayeron
  const [near, setNear] = useState(false)
  const barRef = useRef<HTMLElement>(null)
  const whoRef = useRef<SVGGElement>(null)
  const pathRef = useRef<SVGPathElement>(null)

  // Barra de progreso y paso automático
  useEffect(() => {
    if (!auto) { if (barRef.current) barRef.current.style.width = '100%'; return }
    const t0 = performance.now(); let raf = 0
    const loop = (t: number) => {
      const u = Math.min((t - t0) / 9000, 1)
      if (barRef.current) barRef.current.style.width = `${u * 100}%`
      if (u >= 1) setTab(v => ORDER[(ORDER.indexOf(v) + 1) % 3]); else raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [tab, auto])
  // Avisos: caen de a uno
  useEffect(() => {
    if (tab !== 'avisos') return
    setShown(0)
    const ts = NOTICES.map((_, i) => setTimeout(() => setShown(i + 1), 400 + i * 1900))
    return () => ts.forEach(clearTimeout)
  }, [tab])
  // Cercanía: el cliente camina y, al entrar en el radio, aparece la tarjeta
  useEffect(() => {
    if (tab !== 'cerca') return
    const path = pathRef.current, who = whoRef.current
    if (!path || !who) return
    setNear(false)
    const L = path.getTotalLength(), s0 = performance.now(); let raf = 0, inside = false
    const walk = (t: number) => {
      const u = Math.min((t - s0) / 6500, 1), p = path.getPointAtLength(u * L)
      who.setAttribute('transform', `translate(${p.x} ${p.y})`)
      const d = Math.hypot(p.x - 215, p.y - 185)
      if (d < 78 && !inside) { inside = true; setNear(true) }
      if (u < 1) raf = requestAnimationFrame(walk)
    }
    raf = requestAnimationFrame(walk)
    return () => cancelAnimationFrame(raf)
  }, [tab])
  const pick = (t: Tab) => { setAuto(false); setTab(t) }

  return (
    <section className="l2-sec l2-dark l2-reveal" id="pedidos">
      <div className="l2-so-head">
        <div><p className="l2-kicker">Lo que hace tu tarjeta sola</p><h2 className="l2-h2">Vos atendés. <span className="l2-gris">La tarjeta trae a la gente.</span></h2></div>
        <div className="l2-so-tabs" role="tablist">
          {([['avisos', 'avisos', 'Avisos automáticos', 'Avisos'], ['cerca', 'sucursales', 'Cercanía', 'Cercanía'], ['pedidos', 'pedidos', 'Pedidos', 'Pedidos']] as [Tab, IconName, string, string][]).map(([t, ic, l, short]) =>
            <button key={t} role="tab" aria-selected={tab === t} aria-label={l} onClick={() => pick(t)}><Icon name={ic} size={16} /><span className="l2-tab-l">{l}</span><span className="l2-tab-s">{short}</span></button>)}
          <span className="l2-so-bar"><i ref={barRef} /></span>
        </div>
      </div>

      {tab === 'avisos' && (
        <div className="l2-so-grid l2-so-in" role="tabpanel">
          <div>
            <span className="l2-so-plan">Bienvenida, te extrañamos y reseñas: Pro · Cumpleaños: desde Growth</span>
            <h3 className="l2-so-h3">Escribe por vos en el momento justo.</h3>
            <p className="l2-lead">Los configurás una vez y salen solos. No cuentan para tus avisos del mes.</p>
            <ul className="l2-so-list">{AUTO.map(([ic, t, d], i) => <li key={t} className={shown - 1 === i ? 'on' : ''}><Icon name={ic} size={20} /><span><b>{t}</b>{d}</span></li>)}</ul>
          </div>
          <div className="l2-lockbig">
            <div className="l2-time">9:41</div><div className="l2-date">martes 27 de octubre</div>
            <div className="l2-lk-list">{NOTICES.slice(0, shown).reverse().map(n => (
              <div key={n[0]} className="l2-notif in l2-drop"><span className="l2-nic" style={{ background: n[3] }} /><div><div className="l2-ntop"><b>{n[1]}</b><span>ahora</span></div><span className="l2-tag">{n[0]}</span><br />{n[2]}</div></div>
            ))}</div>
          </div>
        </div>
      )}

      {tab === 'cerca' && (
        <div className="l2-so-grid l2-so-in" role="tabpanel">
          <div>
            <span className="l2-so-plan">Desde Growth · iPhone</span>
            <h3 className="l2-so-h3">Pasa por la puerta y se acuerda de vos.</h3>
            <p className="l2-lead">Cuando tu cliente está cerca de tu local, su tarjeta aparece sola en la pantalla bloqueada. Sin mandar nada, sin apps.</p>
            <ul className="l2-so-list">
              <li><Icon name="sucursales" size={20} /><span><b>Hasta 10 locales por tarjeta</b>Usa la ubicación de cada sucursal.</span></li>
              <li><Icon name="candado" size={20} /><span><b>Nadie sigue a nadie</b>Lo resuelve el iPhone: Stampa no sabe dónde está el cliente.</span></li>
            </ul>
          </div>
          <div className="l2-cerca">
            <svg className="l2-cz-map" viewBox="0 0 420 360" aria-hidden="true">
              <rect width="420" height="360" rx="22" fill="#F4F2EC" />
              <g fill="#E7E3DA"><rect x="20" y="20" width="120" height="90" rx="10" /><rect x="160" y="20" width="110" height="90" rx="10" /><rect x="290" y="20" width="110" height="90" rx="10" /><rect x="20" y="140" width="120" height="90" rx="10" /><rect x="290" y="140" width="110" height="90" rx="10" /><rect x="20" y="260" width="120" height="80" rx="10" /><rect x="160" y="260" width="110" height="80" rx="10" /><rect x="290" y="260" width="110" height="80" rx="10" /></g>
              <rect x="160" y="140" width="110" height="90" rx="10" fill="#DCE5D6" />
              <circle className="l2-cz-radius" cx="215" cy="185" r="78" fill="rgba(199,93,58,.08)" stroke="rgba(199,93,58,.35)" strokeDasharray="5 6" />
              <g transform="translate(215 185)"><circle r="18" fill="#6B2D1F" /><path d="M-7 -4 h11 v6 a5.5 5.5 0 0 1 -11 0 z M4 -2 a3 3 0 0 1 0 6" fill="none" stroke="#fff" strokeWidth="2" /></g>
              <text x="215" y="222" textAnchor="middle" fontWeight="800" fontSize="12" fill="#6B2D1F">Café Aurora</text>
              <path ref={pathRef} d="M 20 125 L 150 125 L 150 245 L 410 245" fill="none" stroke="#C9C3B6" strokeWidth="3" strokeDasharray="2 8" strokeLinecap="round" />
              <g ref={whoRef}><circle r="11" fill="#fff" stroke="#1B412F" strokeWidth="3" /><circle r="4" fill="#1B412F" /></g>
            </svg>
            <div className="l2-cz-phone"><div className="l2-time">10:12</div><div className={`l2-notif${near ? ' in' : ''}`}><span className="l2-nic" style={{ background: '#6B2D1F' }} /><div><div className="l2-ntop"><b>Café Aurora</b><span>ahora</span></div>¡Estás cerca de Café Aurora! Pasá a sumar tu sello.</div></div></div>
          </div>
        </div>
      )}

      {tab === 'pedidos' && (
        <div className="l2-so-grid l2-so-in" role="tabpanel">
          <div className="l2-order-phone"><div className="l2-order-screen">
            <div className="l2-op-head"><b>Raíz Criolla</b><span>Hola, Martín · Pedí con 24 horas de anticipación</span></div>
            <div className="l2-op-box"><h4>PRODUCTOS</h4>
              <div className="l2-op-item"><div>Vacío<small>$22.100 el kg · de a medio kilo</small></div><div className="l2-qty"><span className="b">−</span><span>1,5 kg</span><span className="b plus">+</span></div></div>
              <div className="l2-op-item"><div>Chorizo<small>$1.000 c/u</small></div><div className="l2-qty"><span className="b">−</span><span>6</span><span className="b plus">+</span></div></div>
              <div className="l2-op-item off"><div>Molleja<small>$18.900 el kg</small></div><span className="l2-nostock">Sin stock</span></div>
            </div>
            <div className="l2-op-box"><h4>DÍAS DE ENTREGA</h4><div className="l2-op-days">{['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <span key={i} className={i === 1 || i === 4 ? 'on' : i === 0 || i === 6 ? 'off' : ''}>{d}</span>)}</div>
              <h4>ZONA</h4><div className="l2-op-zones"><span className="on">Palermo</span><span>Villa Crespo</span><span>Colegiales</span></div></div>
            <div className="l2-op-box l2-op-total"><span>Total por entrega</span><b>$39.150</b></div>
            <div className="l2-op-send">Enviar por WhatsApp</div>
          </div></div>
          <div>
            <span className="l2-so-plan">Plan Pro</span>
            <h3 className="l2-so-h3">Te encargan desde la tarjeta. Te llega escrito.</h3>
            <p className="l2-lead">Tus clientes arman el pedido con tus productos y precios, eligen uno o varios días y su zona, y te llega ordenado al WhatsApp. Lo marcás entregado desde el panel.</p>
            <div className="l2-chat"><div className="l2-chat-top"><span className="l2-chat-av"><img src="/assets/logo-raiz-criolla.png" alt="" /></span><b>Raíz Criolla</b></div>
              <div className="l2-bubble">Hola Raíz Criolla, soy Martín. Te hago un pedido para 2 entregas, el martes 27/10 y el viernes 30/10. En cada entrega:{'\n'}· Vacío: 1,5 kg{'\n'}· Chorizo: 6{'\n'}Total aproximado por entrega: $39.150 (en total, $78.300){'\n'}Dirección: Gorriti 4820 (Palermo){'\n'}Pago: transferencia<span className="l2-btime">10:24</span></div></div>
            <div className="l2-feat">{([['balanza', 'Por unidad, kilo o 100 g'], ['fecha', 'Varios días'], ['sucursales', 'Por zona'], ['sinComision', 'Sin comisión']] as [IconName, string][]).map(([ic, t]) => <span key={t}><Icon name={ic} size={16} />{t}</span>)}</div>
          </div>
        </div>
      )}
    </section>
  )
}

// ── Vidriera: Surge con su frase real; el resto, solo quiénes son
type Card = { name: string; tag: string; photo?: string; logo?: string; bg?: string; pass: Biz; quote?: string }
const SHOW: Card[] = [
  { name: 'Surge Málaga', tag: 'Cafetería de especialidad · Málaga, España', photo: '/assets/surge-malaga-fachada.jpg', quote: SURGE.quote, pass: { name: 'Surge', color: '#111111', icon: 'cafe', model: 'sellos', head: ['SELLOS', '6 de 8'], stamps: 6, who: 'Elena M.', wa: 'CONSULTAS' } },
  { name: 'Raíz Criolla', tag: 'Carne envasada premium · Córdoba', logo: '/assets/logo-raiz-criolla.png', bg: '#5C1414', pass: { name: 'Raíz Criolla', color: '#5C1414', icon: 'carniceria', model: 'puntos', head: ['PRÓXIMO PREMIO', '1 kg de vacío'], points: '840', next: 'Te faltan 160', who: 'Martín R.', wa: 'PEDIDOS' } },
  { name: 'Living4Malaga', tag: 'Alojamiento turístico · Málaga, España', logo: '/assets/logo-living4malaga.png', bg: '#0C2A2A', pass: { name: 'Living4Malaga', color: '#0C2A2A', icon: 'inicio', model: 'membresia', head: ['NIVEL', 'Huésped'], tier: ['Huésped', 'Frecuente', 40, 'Beneficios en cada estadía'], who: 'Tom W.', wa: 'CONSULTAS' } },
  { name: 'Nogal', tag: 'Comercio', logo: '/assets/logo-nogal.png', bg: '#EDEFE8', pass: { name: 'Nogal', color: '#3B2F27', icon: 'spa', model: 'sellos', head: ['SELLOS', '4 de 8'], stamps: 4, who: 'Paula G.', wa: 'CONSULTAS' } },
]
export function Showcase() {
  const [k, setK] = useState(0)
  const [auto, setAuto] = useState(true)
  const [w, setW] = useState(1000)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  useEffect(() => { if (!auto) return; const t = setInterval(() => setK(v => (v + 1) % SHOW.length), 5000); return () => clearInterval(t) }, [auto])
  const go = (d: number) => { setAuto(false); setK(v => (v + d + SHOW.length) % SHOW.length) }
  const cw = Math.min(620, w * .86)
  return (
    <section className="l2-sec l2-reveal" id="negocios" style={{ overflow: 'hidden' }}>
      <div className="l2-sec-head l2-center"><p className="l2-kicker">Negocios que lo usan</p><h2 className="l2-h2">Negocios reales. <span className="l2-gris">Clientes que vuelven.</span></h2></div>
      <div className="l2-vit-stage" ref={ref}>
        {SHOW.map((c, i) => {
          let o = i - k
          if (o > SHOW.length / 2) o -= SHOW.length
          if (o < -SHOW.length / 2) o += SHOW.length
          return (
            <div key={c.name} className="l2-vit" onClick={() => { if (o) { setAuto(false); setK(i) } }}
              style={{ width: cw, transform: `translateX(calc(-50% + ${o * cw * 1.02}px)) scale(${o ? .86 : 1})`, opacity: Math.abs(o) > 1 ? 0 : o ? .45 : 1, zIndex: 10 - Math.abs(o), pointerEvents: Math.abs(o) > 1 ? 'none' : 'auto' }}>
              <div className="l2-vit-card">
                <div className="l2-vit-photo">
                  {c.photo ? <img src={c.photo} alt={`Fachada de ${c.name}`} /> : <div className="l2-logo-only" style={{ background: c.bg }}><img src={c.logo} alt={c.name} /></div>}
                  <Pass b={c.pass} width={150} className="l2-vit-pass" />
                </div>
                <div className="l2-vit-text">
                  <span className="l2-vtag">{c.tag}</span>
                  <h3>{c.name}</h3>
                  {c.quote ? <><blockquote>“{c.quote}”</blockquote><div className="l2-nums">{SURGE.stats.map(([n, l]) => <div key={l}><b>{n}</b><span>{l}</span></div>)}</div></>
                    : <p>Sus clientes llevan la tarjeta en el Wallet y suman en cada visita.</p>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="l2-vit-ctrl">
        <button className="l2-circ" aria-label="Anterior" onClick={() => go(-1)}><Icon name="anterior" size={18} /></button>
        <div className="l2-dots">{SHOW.map((c, i) => <i key={c.name} className={i === k ? 'on' : ''} />)}</div>
        <button className="l2-circ" aria-label="Siguiente" onClick={() => go(1)}><Icon name="siguiente" size={18} /></button>
      </div>
      <p className="l2-logos-k">También trabajan con Stampa</p>
      <div className="l2-logos" aria-label="Negocios que usan Stampa">
        {[0, 1].map(t => <div key={t} className="l2-track" aria-hidden={t === 1}>{[...PROOF, ...PROOF].map((l, i) => <div key={i} className="l2-lg"><span className="l2-mark" style={{ background: l.bg }}><img src={l.logo} alt="" /></span><div><b>{l.name}</b><small>{l.category}</small></div></div>)}</div>)}
      </div>
    </section>
  )
}

// ── Probala: rubro + modelo, y el QR real del negocio demo (si está configurado)
export function TryIt() {
  const [ri, setRi] = useState(0)
  const [model, setModel] = useState<Model | null>(null)
  const [origin, setOrigin] = useState('')
  useEffect(() => { setOrigin(window.location.origin) }, [])
  const base = SHOPS[ri]
  const m = model || base.model
  const b: Biz = m === base.model ? base
    : m === 'sellos' ? { ...base, model: m, head: ['SELLOS', '3 de 8'], stamps: 3 }
    : m === 'puntos' ? { ...base, model: m, head: ['PRÓXIMO PREMIO', 'Un regalo'], points: '420', next: 'Te faltan 80' }
    : { ...base, model: m, head: ['NIVEL', 'Plata'], tier: ['Plata', 'Oro', 60, 'Te faltan 4 visitas para Oro'] }
  const demoUrl = DEMO_BUSINESS_ID && origin ? `${origin}/r/${DEMO_BUSINESS_ID}` : ''
  return (
    <section className="l2-sec l2-reveal" id="probala">
      <div className="l2-try">
        <div>
          <p className="l2-kicker">Probala</p>
          <h2 className="l2-h2">Así se vería <span className="l2-gris">la tuya.</span></h2>
          <p className="l2-lead" style={{ marginTop: 14, maxWidth: 520 }}>Elegí tu rubro y el modelo (sellos, puntos o membresía) y mirá la tarjeta como la ven tus clientes en el Wallet.</p>
          <div className="l2-rubros">{SHOPS.map((s, i) => <button key={s.name} aria-pressed={i === ri} onClick={() => { setRi(i); setModel(null) }}><Icon name={s.icon} size={16} />{s.label}</button>)}</div>
          <div className="l2-models" role="group" aria-label="Modelo de tarjeta">{(['sellos', 'puntos', 'membresia'] as Model[]).map(x => <button key={x} aria-pressed={x === m} onClick={() => setModel(x)}>{x === 'sellos' ? 'Sellos' : x === 'puntos' ? 'Puntos' : 'Membresía'}</button>)}</div>
          {demoUrl && <div className="l2-try-qr"><QrImage value={demoUrl} size={84} margin={0} dark="#1B412F" light="#FFFFFF" alt="QR para probar una tarjeta Stampa" /><p><b>Llevate una de verdad</b>Escaneá el código con tu celular y guardá una tarjeta de prueba en tu Wallet.</p></div>}
        </div>
        <div className="l2-try-pass"><Pass key={`${ri}-${m}`} b={b} width={290} className="l2-pop-in" /></div>
      </div>
    </section>
  )
}

// ── Preguntas frecuentes
const FAQ: [string, string][] = [
  ['¿Mis clientes necesitan descargar una app?', 'No. La tarjeta de fidelización vive directamente en Apple Wallet o en Google Wallet, que ya vienen en el teléfono. No hace falta bajar nada ni crear una cuenta.'],
  ['¿Cómo escaneo la tarjeta de mis clientes?', 'Con la app de escaneo de Stampa. Tu equipo entra con un PIN y vos con tu email. Escaneás el código de la tarjeta (o buscás al cliente por nombre) y el sello, punto o visita se actualiza al instante en su Wallet.'],
  ['¿Mis clientes me pueden escribir por WhatsApp desde la tarjeta?', 'Sí, en todos los planes. Cargás tu número y elegís hasta dos botones según tu rubro (pedidos, turnos, consultas). En el dorso de la tarjeta dicen “Tocá para…” y el mensaje llega escrito con tu nombre y el del cliente.'],
  ['¿Puedo tomar pedidos? ¿Stampa los cobra?', 'En el plan Pro, tus clientes arman el pedido desde la tarjeta con tus productos y precios, por unidad, por kilo o por 100 gramos, para uno o varios días y su zona. Te llega escrito al WhatsApp. Stampa no cobra los pedidos ni se queda con una comisión: el cliente te avisa cómo paga y vos le confirmás.'],
  ['¿Cuánto tarda en configurarse?', 'Menos de 15 minutos. Elegís el formato de tu tarjeta (sellos, puntos o membresía), la personalizás con tu marca y ya podés compartirla con tus clientes.'],
  ['¿Necesito tarjeta de crédito para probar?', 'No. Los 14 días de prueba gratuita no piden tarjeta de crédito. Solo pagás si decidís continuar con un plan pago.'],
  ['¿Puedo cambiar de plan o cancelar cuando quiera?', 'Sí, no hay permanencia. Podés subir, bajar o cancelar tu plan en cualquier momento desde el panel.'],
  ['¿Puedo premiar cumpleaños o hacer días con sello doble?', 'Sí. En Configuración activás el regalo de cumpleaños, elegís qué días de la semana cada visita vale doble y si los sellos o puntos vencen cuando un cliente deja de venir. Los avisos salen solos y no cuentan para tus notificaciones del mes.'],
]
export function Faq({ salesHref }: { salesHref: string }) {
  return (
    <section className="l2-sec l2-reveal" id="faq">
      <div className="l2-faq-grid">
        <div><p className="l2-kicker">Preguntas</p><h2 className="l2-h2">Lo que más <span className="l2-gris">nos preguntan.</span></h2><p className="l2-lead" style={{ marginTop: 14 }}>¿Te queda alguna? <a href={salesHref} target="_blank" rel="noopener noreferrer" className="l2-link">Escribinos por WhatsApp</a> y te respondemos nosotros, no un bot.</p></div>
        <div className="l2-faq">{FAQ.map(([q, a], i) => <details key={q} open={i === 0}><summary>{q}<Icon name="agregar" size={18} /></summary><p>{a}</p></details>)}</div>
      </div>
    </section>
  )
}
