'use client'
// Landing → "La tarjeta escribe por vos" (pestañas), el caso de Surge,
// "Elegí tu rubro" y las preguntas frecuentes.
import { useEffect, useRef, useState } from 'react'
import { Icon, type IconName } from '@/components/ui/Icon'
import { QrImage } from '@/components/QrImage'
import { Pass } from './Pass'
import { SHOPS, PROOF, SURGE, DEMO_BUSINESS_ID, type Biz, type Model } from './data'

// ── La tarjeta escribe por vos: avisos, cercanía y pedidos. Avanza sola cada
// 9 s en pantallas grandes; si tocás una pestaña, se queda. En el celular no
// cambia sola. Las tres pestañas están siempre armadas una sobre otra, así la
// sección mide lo mismo en todas y la página no se corre.
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

  // Barra de progreso y paso automático (no en el celular)
  useEffect(() => {
    if (!auto || matchMedia('(max-width:700px)').matches) { if (barRef.current) barRef.current.style.width = '100%'; return }
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
  const cls = (t: Tab) => `l2-so-grid l2-so-panel${tab === t ? ' on' : ''}`

  return (
    <section className="l2-sec l2-dark" id="pedidos">
      <div className="l2-so-head">
        <h2 className="l2-h2">La tarjeta escribe <span className="l2-gris">por vos.</span></h2>
        <div className="l2-so-tabs" role="tablist">
          {([['avisos', 'avisos', 'Avisos automáticos', 'Avisos'], ['cerca', 'sucursales', 'Cercanía', 'Cercanía'], ['pedidos', 'pedidos', 'Pedidos', 'Pedidos']] as [Tab, IconName, string, string][]).map(([t, ic, l, short]) =>
            <button key={t} role="tab" aria-selected={tab === t} aria-label={l} onClick={() => pick(t)}><Icon name={ic} size={16} /><span className="l2-tab-l">{l}</span><span className="l2-tab-s">{short}</span></button>)}
          <span className="l2-so-bar"><i ref={barRef} /></span>
        </div>
      </div>

      <div className="l2-so-stack">
        <div className={cls('avisos')} role="tabpanel" aria-hidden={tab !== 'avisos'}>
          <div>
            <span className="l2-so-plan">Bienvenida, te extrañamos y reseñas: Pro · Cumpleaños: desde Growth</span>
            <h3 className="l2-so-h3">Escribe por vos en el momento justo.</h3>
            <p className="l2-lead">Los configurás una vez y salen solos. No cuentan para tus avisos del mes.</p>
            <ul className="l2-so-list">{AUTO.map(([ic, t, d], i) => <li key={t} className={tab === 'avisos' && shown - 1 === i ? 'on' : ''}><Icon name={ic} size={20} /><span><b>{t}</b>{d}</span></li>)}</ul>
          </div>
          <div className="l2-lockbig">
            <div className="l2-time">9:41</div><div className="l2-date">martes 27 de octubre</div>
            <div className="l2-lk-list">{NOTICES.slice(0, shown).reverse().map(n => (
              <div key={n[0]} className="l2-notif in l2-drop"><span className="l2-nic" style={{ background: n[3] }} /><div><div className="l2-ntop"><b>{n[1]}</b><span>ahora</span></div><span className="l2-tag">{n[0]}</span><br />{n[2]}</div></div>
            ))}</div>
          </div>
        </div>

        <div className={cls('cerca')} role="tabpanel" aria-hidden={tab !== 'cerca'}>
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

        <div className={cls('pedidos')} role="tabpanel" aria-hidden={tab !== 'pedidos'}>
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
      </div>
    </section>
  )
}

// ── Caso de Surge: su frase y su dato, con la fuente
export function Caso() {
  const otros = PROOF.filter(p => p.name !== 'Surge Málaga')
  return (
    <section className="l2-sec" id="negocios">
      <div className="l2-caso">
        <img src="/assets/surge-malaga-fachada.jpg" alt="Fachada de Surge Málaga" />
        <div>
          <h2 className="l2-h2">Surge Málaga sumó 150 clientes a su tarjeta en dos meses. <span className="l2-gris">7 de cada 10 volvieron.</span></h2>
          <blockquote>“{SURGE.quote}”</blockquote>
          <cite>Surge Málaga, cafetería de especialidad. Datos de su panel de Stampa.</cite>
          <div className="l2-otros" aria-label="También trabajan con Stampa">{otros.map(o => <span key={o.name}>{o.name}</span>)}</div>
        </div>
      </div>
    </section>
  )
}

// ── Elegí tu rubro: rubro + modelo, y el QR real del negocio demo (si está configurado)
export function TryIt() {
  const [ri, setRi] = useState(0)
  const [model, setModel] = useState<Model | null>(null)
  const [origin, setOrigin] = useState('')
  useEffect(() => { setOrigin(window.location.origin) }, [])
  const base = SHOPS[ri]
  const m = model || base.model
  const b: Biz = m === base.model ? base
    : m === 'sellos' ? { ...base, model: m, head: ['SELLOS', '3 de 8'], stamps: 3 }
    : m === 'puntos' ? { ...base, model: m, head: ['PRÓXIMO PREMIO', base.prize || 'Un regalo'], points: '420', next: 'Te faltan 80', prize: base.prize || 'Un regalo' }
    : { ...base, model: m, head: ['NIVEL', 'Plata'], tier: ['Plata', 'Oro', 60, 'Te faltan 4 visitas para Oro'] }
  const demoUrl = DEMO_BUSINESS_ID && origin ? `${origin}/r/${DEMO_BUSINESS_ID}` : ''
  return (
    <section className="l2-sec" id="probala">
      <div className="l2-try">
        <div>
          <h2 className="l2-h2">Elegí tu rubro <span className="l2-gris">y mirá tu tarjeta.</span></h2>
          <p className="l2-lead" style={{ marginTop: 14, maxWidth: 520 }}>El cliente escanea el QR de tu mostrador, deja su nombre y la guarda en Apple Wallet o Google Wallet. Tu equipo le suma en cada visita con la app de Stampa.</p>
          <div className="l2-rubros">{SHOPS.map((s, i) => <button key={s.name} aria-pressed={i === ri} onClick={() => { setRi(i); setModel(null) }}><Icon name={s.icon} size={16} />{s.label}</button>)}</div>
          <div className="l2-models" role="group" aria-label="Modelo de tarjeta">{(['sellos', 'puntos', 'membresia'] as Model[]).map(x => <button key={x} aria-pressed={x === m} onClick={() => setModel(x)}>{x === 'sellos' ? 'Sellos' : x === 'puntos' ? 'Puntos' : 'Membresía'}</button>)}</div>
          {demoUrl && <div className="l2-try-qr"><QrImage value={demoUrl} size={84} margin={0} dark="#1B412F" light="#FFFFFF" alt="QR para probar una tarjeta Stampa" /><p><b>Llevate una de verdad</b>Escaneá el código con tu celular y guardá una tarjeta de prueba en tu Wallet.</p></div>}
        </div>
        <div className="l2-try-pass"><Pass key={`${ri}-${m}`} b={b} width={270} className="l2-pop-in" /></div>
      </div>
    </section>
  )
}

// ── Preguntas frecuentes
const FAQ: [string, string][] = [
  ['¿Mis clientes necesitan descargar una app?', 'No. La tarjeta de fidelización vive directamente en Apple Wallet o en Google Wallet, que ya vienen en el teléfono. No hace falta bajar nada ni crear una cuenta.'],
  ['¿Cómo escaneo la tarjeta de mis clientes?', 'Con la app de escaneo de Stampa. Tu equipo entra con un PIN y vos con tu email. Escaneás el código de la tarjeta (o buscás al cliente por nombre) y el sello, punto o visita se actualiza al instante en su Wallet.'],
  ['¿Puedo tomar pedidos? ¿Stampa los cobra?', 'En el plan Pro, tus clientes arman el pedido desde la tarjeta con tus productos y precios, por unidad, por kilo o por 100 gramos, para uno o varios días y su zona. Te llega escrito al WhatsApp. Stampa no cobra los pedidos ni se queda con una comisión: el cliente te avisa cómo paga y vos le confirmás.'],
  ['¿Necesito tarjeta de crédito para probar?', 'No. Los 14 días de prueba gratuita no piden tarjeta de crédito. Solo pagás si decidís continuar con un plan pago.'],
  ['¿Puedo cambiar de plan o cancelar cuando quiera?', 'Sí, no hay permanencia. Podés subir, bajar o cancelar tu plan en cualquier momento desde el panel.'],
]
export function Faq({ salesHref }: { salesHref: string }) {
  return (
    <section className="l2-sec" id="faq">
      <div className="l2-faq-grid">
        <div><h2 className="l2-h2">Lo que más <span className="l2-gris">nos preguntan.</span></h2><p className="l2-lead" style={{ marginTop: 14 }}>¿Te queda alguna? <a href={salesHref} target="_blank" rel="noopener noreferrer" className="l2-link">Escribinos por WhatsApp</a> y te respondemos nosotros, no un bot.</p></div>
        <div className="l2-faq">{FAQ.map(([q, a], i) => <details key={q} open={i === 0}><summary>{q}<Icon name="agregar" size={18} /></summary><p>{a}</p></details>)}</div>
      </div>
    </section>
  )
}
