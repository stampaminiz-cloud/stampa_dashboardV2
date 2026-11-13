'use client'
// Landing → el celular del hero (el sello que se suma) y el mosaico de
// "Sabés quién volvió": analítica, equipo y locales.
import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { Pass } from './Pass'
import { SHOPS } from './data'

// ── Hero: la tarjeta de Café Aurora en un celular; cada 2,6 s se suma un sello
export function HeroDemo() {
  const [stamps, setStamps] = useState(3)
  const [fresh, setFresh] = useState(false)
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setStamps(v => { const n = v >= 8 ? 3 : v + 1; setFresh(n !== 3); return n }), 2600)
    return () => clearInterval(t)
  }, [])
  const b = { ...SHOPS[0], stamps }
  return (
    <div className="l2-hero-demo">
      <div className="l2-phone">
        <div className="l2-notch" />
        <div className="l2-screen">
          <div className="l2-ph-top">Wallet</div>
          <Pass b={b} width={176} fresh={fresh} />
          <div className={`l2-ph-msg${fresh ? ' in' : ''}`}>{stamps >= 8 ? 'Premio listo' : '+1 sello'}</div>
        </div>
      </div>
      <p className="l2-demo-cap">En el mostrador escanean la tarjeta y el sello aparece en el celular de Lucía.</p>
    </div>
  )
}

// ── Sabés quién volvió: analítica al frente, equipo y locales
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
    <section className="l2-sec">
      <div className="l2-sec-head"><h2 className="l2-h2">Sabés quién volvió <span className="l2-gris">y quién dejó de venir.</span></h2></div>
      <div className="l2-bento" ref={ref}>
        <div className="l2-tile l2-t-an">
          <div className="l2-an-head"><div><h3>Visitas, clientes nuevos y los que se enfriaron</h3><p>Sin armar planillas. Los números de abajo son de ejemplo.</p></div></div>
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
