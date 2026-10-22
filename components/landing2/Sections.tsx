'use client'
// Landing → secciones animadas del medio: la frase con el rubro que cambia,
// "Cómo funciona" con el celular que escanea, y "Lo que pasa después".
import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { Pass } from './Pass'
import { SHOPS, EVENT, before } from './data'

const useReduce = () => {
  const [r, setR] = useState(false)
  useEffect(() => { setR(matchMedia('(prefers-reduced-motion: reduce)').matches) }, [])
  return r
}

// ── "Llevamos tu ___ al Wallet": el rubro cambia y entran tarjetas por los bordes
const SPOTS: { side: 'left' | 'right'; top?: string; bottom?: string; rot: number; to: string }[] = [
  { side: 'left', top: '8%', rot: -9, to: '-4%' }, { side: 'right', top: '12%', rot: 8, to: '-4%' },
  { side: 'left', bottom: '6%', rot: 7, to: '2%' }, { side: 'right', bottom: '4%', rot: -6, to: '0%' },
]
export function Phrase() {
  const [i, setI] = useState(0)
  const [show, setShow] = useState(true)
  const reduce = useReduce()
  useEffect(() => {
    if (reduce) return
    const t = setInterval(() => { setShow(false); setTimeout(() => { setI(v => (v + 1) % SHOPS.length); setShow(true) }, 300) }, 2600)
    return () => clearInterval(t)
  }, [reduce])
  return (
    <section className="l2-sec l2-phrase l2-reveal" aria-label="Para cada rubro">
      {[0, 1].map(j => {
        const b = SHOPS[(i + 1 + j) % SHOPS.length], s = SPOTS[(i * 2 + j) % 4]
        return <div key={`${i}-${j}`} className="l2-floater" style={{ [s.side]: s.to, top: s.top, bottom: s.bottom, ['--r' as string]: `${s.rot}deg` } as React.CSSProperties}><Pass b={b} width={170} /></div>
      })}
      <h2 className="l2-h2">Llevamos <span className={`l2-word${show ? '' : ' out'}`}>{SHOPS[i].word}</span><br />al Wallet de tus clientes.</h2>
    </section>
  )
}

// ── Cómo funciona: el cliente guarda la tarjeta y en el mostrador la escanean
const STEPS = [
  ['01', 'Armás tu tarjeta', 'Elegís sellos, puntos o niveles, subís tu logo y elegís los colores. Lleva unos 15 minutos.'],
  ['02', 'El cliente la guarda', 'Escanea el QR del mostrador, deja su nombre y la agrega a Apple Wallet o Google Wallet. Sin bajar apps.'],
  ['03', 'Cada visita suma', 'Tu equipo escanea la tarjeta con la app de Stampa y el celular del cliente se actualiza al momento.'],
]
export function HowItWorks() {
  const [k, setK] = useState(0)
  const [phase, setPhase] = useState<'saved' | 'scan' | 'done'>('saved')
  const reduce = useReduce()
  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>, t2: ReturnType<typeof setTimeout>
    const cycle = () => {
      setPhase('saved')
      t1 = setTimeout(() => { setPhase('scan'); t2 = setTimeout(() => setPhase('done'), reduce ? 0 : 650) }, 1500)
    }
    cycle()
    const t = setInterval(() => { setK(v => (v + 1) % SHOPS.length); cycle() }, 3600)
    return () => { clearInterval(t); clearTimeout(t1); clearTimeout(t2) }
  }, [reduce])
  const b = SHOPS[k]
  const on = phase === 'saved' ? 1 : 2
  return (
    <section className="l2-sec l2-reveal" id="como">
      <div className="l2-sec-head"><p className="l2-kicker">Cómo funciona</p><h2 className="l2-h2">Tres pasos. <span className="l2-gris">Y vuelven solos.</span></h2></div>
      <div className="l2-how">
        <div className="l2-steps">
          {STEPS.map(([n, t, d], i) => <div key={n} className={`l2-st${i === on ? ' on' : ''}`}><span className="l2-n">{n}</span><div><h3>{t}</h3><p>{d}</p></div></div>)}
        </div>
        <div className="l2-how-demo">
          <div className={`l2-phone${phase === 'scan' ? ' scanning' : ''}`}>
            <div className="l2-notch" />
            <div className="l2-screen">
              <div className="l2-ph-top">{phase === 'done' ? 'Actualizada' : 'Wallet'}</div>
              <Pass b={phase === 'done' ? b : before(b)} width={176} />
              <div className="l2-scanline" />
              <div className={`l2-ph-msg${phase === 'done' ? ' in' : ''}`}>{EVENT[b.model]}</div>
            </div>
          </div>
          <p className="l2-demo-cap">{phase === 'saved' ? `Guardó la tarjeta de ${b.name}` : 'En el mostrador escanean su tarjeta'}</p>
        </div>
      </div>
      <div className="l2-how-stats">
        <div className="l2-stat-big"><b>150</b><span>clientes se sumaron en dos meses a la tarjeta de Surge Málaga</span></div>
        <div className="l2-stat-small"><b>70%</b><span>vuelve a pasar por el local</span></div>
      </div>
    </section>
  )
}

// ── Lo que pasa después: analítica al frente, avisos, la app, WhatsApp y locales
const DAYS = [38, 42, 35, 50, 66, 88, 52, 40, 44, 39, 55, 70, 92, 58, 46, 48, 41, 57, 74, 100, 61, 44, 50, 47, 60, 77, 95, 63, 49, 52]
export function Bento() {
  const ref = useRef<HTMLDivElement>(null)
  const [seen, setSeen] = useState(false)
  const [sc, setSc] = useState(3)
  const [press, setPress] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { setSeen(true); io.disconnect() } }, { threshold: .2 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  useEffect(() => {
    const t = setInterval(() => { setPress(true); setTimeout(() => setPress(false), 180); setTimeout(() => setSc(v => (v >= 8 ? 2 : v + 1)), 160) }, 1700)
    return () => clearInterval(t)
  }, [])
  const full = sc >= 8
  return (
    <section className="l2-sec l2-reveal">
      <div className="l2-sec-head"><p className="l2-kicker">Lo que pasa después</p><h2 className="l2-h2">La tarjeta trabaja. <span className="l2-gris">Vos atendés.</span></h2></div>
      <div className="l2-bento" ref={ref}>
        <div className="l2-tile l2-t-an">
          <div className="l2-an-head"><div><h3>Sabés quién vuelve y quién no</h3><p>Visitas por día, clientes nuevos y los que dejaron de venir, sin armar planillas.</p></div><span className="l2-an-tag">Analítica</span></div>
          <div className="l2-an-kpis">
            <div><span>Clientes con la tarjeta</span><b>1.248</b><small>+86 este mes</small></div>
            <div><span>Volvieron este mes</span><b>68%</b><small>de los activos</small></div>
            <div><span>Hace un mes que no vienen</span><b>42</b><small className="warn">para escribirles</small></div>
          </div>
          <div className="l2-an-chart">
            <div className="l2-an-l"><span>Visitas por día · datos de ejemplo</span><span>El mejor día: 96 visitas</span></div>
            <div className="l2-bars">{DAYS.map((h, i) => <i key={i} className={h === 100 ? 'pk' : ''} style={{ height: `${h}%`, transform: seen ? 'scaleY(1)' : 'scaleY(0)', transitionDelay: `${i * 25}ms` }} />)}</div>
            <div className="l2-an-x"><span>1</span><span>15</span><span>30</span></div>
          </div>
        </div>
        <div className="l2-tile l2-t-av">
          <h3>Avisos a la pantalla bloqueada</h3>
          <p>A todos o a un grupo: los que no vienen hace un mes o los que están cerca del premio.</p>
          <div className="l2-lock">
            <div className="l2-time">9:41</div><div className="l2-date">martes 27 de octubre</div>
            <div className={`l2-notif${seen ? ' in' : ''}`}><span className="l2-nic" style={{ background: '#6B2D1F' }} /><div><div className="l2-ntop"><b>Café Aurora</b><span>ahora</span></div>Te extrañamos, Lucía. Esta semana tu café va con sello doble.</div></div>
            <div className={`l2-notif${seen ? ' in' : ''}`} style={{ marginTop: 8, transitionDelay: '.6s' }}><span className="l2-nic" style={{ background: '#5C1414' }} /><div><div className="l2-ntop"><b>Raíz Criolla</b><span>hace 1 h</span></div>Te faltan 160 puntos para el kilo de vacío.</div></div>
          </div>
        </div>
        <div className="l2-tile l2-t-eq l2-t-pino">
          <h3>Tu equipo suma en segundos</h3>
          <p>Escanea el QR o busca por nombre.</p>
          <div className="l2-app">
            <div className="l2-app-top"><span>App de escaneo</span><span>Café Aurora</span></div>
            <div className="l2-app-who"><span className="l2-av">LG</span><div><b>Lucía Gómez</b><small>{full ? '¡Premio listo! Un café de regalo' : `${sc} de 8 sellos`}</small></div></div>
            <div className="l2-app-st">{Array.from({ length: 8 }, (_, i) => <i key={`${i}-${i < sc}`} className={`${i < sc ? 'on' : ''}${i === sc - 1 && sc !== 2 ? ' pop' : ''}`}><Icon name="cafe" size={12} /></i>)}</div>
            <div className={`l2-app-btn${press ? ' press' : ''}${full ? ' done' : ''}`}><Icon name={full ? 'premios' : 'agregar'} size={16} />{full ? 'Entregar premio' : 'Sumar sello'}</div>
          </div>
        </div>
        <div className="l2-tile l2-t-wa">
          <h3>Te escriben desde la tarjeta</h3>
          <p>Botones en el dorso del pase, con el mensaje ya escrito.</p>
          <div className="l2-waback">
            <div className="l2-wb-row"><span className="l2-wb-ic"><Icon name="pedidos" size={18} /></span><span><b>Hacer un pedido</b><small>Llega escrito a tu WhatsApp</small></span><Icon name="siguiente" size={16} /></div>
            <div className="l2-wb-row"><span className="l2-wb-ic"><Icon name="mensaje" size={18} /></span><span><b>Escribirnos</b><small>&quot;Hola Café Aurora, soy Lucía…&quot;</small></span><Icon name="siguiente" size={16} /></div>
          </div>
        </div>
        <div className="l2-tile l2-t-lo">
          <h3>Todos tus locales</h3>
          <p>El cliente suma en cualquiera y ves cada uno.</p>
          <div className="l2-locs">
            {[['Palermo', 100, 412], ['Villa Crespo', 70, 288], ['Colegiales', 42, 173]].map(([n, w, v]) => <div key={n as string}><span>{n}</span><i style={{ ['--w' as string]: `${w}%` } as React.CSSProperties} /><b>{v}</b></div>)}
            <small>Visitas del mes por local</small>
          </div>
        </div>
      </div>
    </section>
  )
}
