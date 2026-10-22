'use client'
// Landing (rediseño 1.6.0): una sola hoja con marco, menú en píldora y
// secciones con el mismo sistema (títulos en dos tonos, etiqueta chica en
// brasa). Precios reales por país (lib/pricing). Mockup aprobado en
// octubre de 2026; Empresas vive en app/empresas.
import { useEffect, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { annualSavingsPct, formatPrice, taxSuffix, usePlanPrices, type PlanSlug } from '@/lib/pricing'
import type { Market } from '@/lib/market'
import { Maqueta } from './Maqueta'
import { Phrase, HowItWorks, Bento } from './Sections'
import { CardAlone, Showcase, TryIt, Faq } from './Sections2'
import { WHATSAPP_SALES, WHATSAPP_ENTERPRISE, INSTAGRAM, SCANNER_IOS_URL } from './data'
import { CSS } from './styles'

const PLANS = [
  { slug: 'starter', name: 'Starter', desc: 'Para arrancar con un local y una tarjeta.', news: ['WhatsApp en la tarjeta'], features: ['1 local', '1 tarjeta de fidelización', 'Hasta 200 clientes', 'Métricas clave en Inicio', '4 notificaciones por mes'] },
  { slug: 'growth', name: 'Growth', desc: 'Para crecer con marca propia y equipo.', news: ['WhatsApp en la tarjeta'], features: ['1 local', '3 tarjetas de fidelización', 'Hasta 500 clientes', 'Analítica completa', '20 notificaciones por mes, segmentadas', 'Regalo de cumpleaños y aviso de cercanía', '5 usuarios de equipo'] },
  { slug: 'pro', name: 'Pro', desc: 'Para negocios con varios locales.', news: ['Pedidos desde la tarjeta', 'WhatsApp en la tarjeta'], features: ['3 locales', 'Clientes, tarjetas, equipo y notificaciones ilimitados', 'Avisos automáticos: bienvenida, te extrañamos y reseñas', 'Hasta 12 premios para elegir', 'Sin la marca Stampa', 'Soporte prioritario'], highlight: true },
  { slug: 'enterprise', name: 'Enterprise', desc: 'Para marcas con 4 locales o más.', news: [], features: ['Locales ilimitados', 'Tu marca en todo', 'Soporte dedicado'] },
]

export default function Landing({ market: initial = 'AR' }: { market?: Market }) {
  const [market, setMarket] = useState<Market>(initial)
  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly')
  const [menu, setMenu] = useState(false)
  const prices = usePlanPrices(market)
  const savings = (['starter', 'growth', 'pro'] as PlanSlug[]).map(k => annualSavingsPct(prices[k])).filter((x): x is number => x != null)

  // Aparición suave de cada sección al entrar en pantalla
  useEffect(() => {
    const els = document.querySelectorAll('.l2-reveal')
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }), { threshold: .12 })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <div className="l2">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="l2-frame">
        <nav className="l2-nav" aria-label="Principal">
          <a href="#" className="l2-brand"><img src="/assets/wordmark.png" alt="Stampa" /></a>
          <div className="l2-links"><a href="#como">Cómo funciona</a><a href="#pedidos">Avisos y pedidos</a><a href="#negocios">Negocios</a><a href="#precios">Precios</a><a href="/empresas">Empresas</a></div>
          <div className="l2-nav-r"><a className="l2-btn l2-btn-ghost l2-btn-sm l2-hide-m" href="/login">Ingresar</a><a className="l2-btn l2-btn-pino l2-btn-sm" href="/register">Probar gratis</a>
            <button className="l2-burger" aria-label="Menú" aria-expanded={menu} onClick={() => setMenu(v => !v)}><Icon name={menu ? 'cerrar' : 'menu'} size={20} /></button></div>
        </nav>
        {menu && <div className="l2-mmenu" onClick={() => setMenu(false)}><a href="#como">Cómo funciona</a><a href="#pedidos">Avisos y pedidos</a><a href="#negocios">Negocios</a><a href="#precios">Precios</a><a href="/empresas">Empresas</a><a href="/login">Ingresar</a></div>}

        <header className="l2-hero">
          <p className="l2-kicker" style={{ color: 'var(--l2-pino)' }}>Tarjetas de fidelidad en Apple y Google Wallet</p>
          <h1 className="l2-h1">Que vuelvan es<br /><span className="l2-gris">el mejor negocio.</span></h1>
          <p className="l2-lead">Tus clientes guardan tu tarjeta en el Wallet sin bajar ninguna app. Suman en el mostrador, te escriben por WhatsApp y te hacen pedidos desde ahí.</p>
          <div className="l2-ctas"><a className="l2-btn l2-btn-brasa" href="/register">Crear mi tarjeta gratis</a><a className="l2-btn l2-btn-ghost" href="#como">Ver cómo funciona <Icon name="flechaAbajo" size={16} /></a></div>
        </header>
        <Maqueta />

        <Phrase />
        <HowItWorks />
        <Bento />
        <CardAlone />
        <Showcase />
        <TryIt />

        <section className="l2-sec l2-reveal" id="precios">
          <div className="l2-price-top">
            <div><p className="l2-kicker">Precios</p><h2 className="l2-h2">Empezá gratis. <span className="l2-gris">Crecé cuando quieras.</span></h2></div>
            <div className="l2-seg-wrap">
              <div className="l2-seg" role="group" aria-label="Período"><button aria-pressed={period === 'monthly'} onClick={() => setPeriod('monthly')}>Mensual</button><button aria-pressed={period === 'annual'} onClick={() => setPeriod('annual')}>Anual{savings.length ? ` · -${Math.min(...savings)}%` : ''}</button></div>
              <div className="l2-seg" role="group" aria-label="País"><button aria-pressed={market === 'AR'} onClick={() => setMarket('AR')}>Argentina</button><button aria-pressed={market === 'EU'} onClick={() => setMarket('EU')}>España</button></div>
            </div>
          </div>
          <div className="l2-plans">
            {PLANS.map(p => {
              const pr = p.slug === 'enterprise' ? null : prices[p.slug as PlanSlug]
              const monthlyEq = pr?.annual ? (pr.currency === 'EUR' ? Math.round((pr.annual / 12) * 100) / 100 : Math.round(pr.annual / 12)) : null
              const amount = pr ? formatPrice(period === 'monthly' ? pr.monthly : monthlyEq, pr.currency) : null
              return (
                <div key={p.slug} className={`l2-plan${p.highlight ? ' hl' : ''}`}>
                  <div><h3>{p.name}{p.highlight && <span className="l2-badge">PEDIDOS</span>}</h3><p className="l2-desc">{p.desc}</p></div>
                  <div className="l2-amt">{amount ? <>{amount} <small>/ mes{period === 'annual' ? ', pago anual' : ''}{pr ? taxSuffix(pr) : ''}</small></> : 'Hablemos'}</div>
                  <ul>{p.news.map(x => <li key={x} className="new"><Icon name="idea" size={16} />{x}</li>)}{p.features.map(x => <li key={x}><Icon name="listo" size={16} />{x}</li>)}</ul>
                  {p.slug === 'enterprise'
                    ? <a className="l2-btn l2-btn-pino" href="/empresas">Conocer Enterprise</a>
                    : <a className={`l2-btn ${p.highlight ? 'l2-btn-white' : 'l2-btn-pino'}`} href={`/register?plan=${p.slug}`}>Empezar gratis</a>}
                </div>
              )
            })}
          </div>
          <p className="l2-price-note">14 días de prueba en cualquier plan. Sin tarjeta de crédito y sin permanencia.</p>
        </section>

        <Faq salesHref={WHATSAPP_SALES} />

        <section className="l2-close l2-reveal">
          <h2 className="l2-h2">Tu tarjeta, lista en 15 minutos.</h2>
          <p>14 días gratis. Sin tarjeta de crédito.</p>
          <a className="l2-btn l2-btn-white" href="/register">Crear mi tarjeta gratis</a>
        </section>

        <footer className="l2-ft">
          <div className="l2-ft-top">
            <div>
              <p className="l2-ft-claim">Tarjetas de fidelidad en Apple y Google Wallet, para negocios que quieren que su gente vuelva.</p>
              <a className="l2-btn l2-btn-brasa" href="/register">Crear mi tarjeta gratis</a>
              <div className="l2-ft-country" role="group" aria-label="País"><button aria-pressed={market === 'AR'} onClick={() => setMarket('AR')}>Argentina</button><button aria-pressed={market === 'EU'} onClick={() => setMarket('EU')}>España</button></div>
            </div>
            <nav className="l2-ft-cols" aria-label="Pie de página">
              <div><b>Producto</b><a href="#como">Cómo funciona</a><a href="#pedidos">Avisos y pedidos</a><a href="#precios">Precios</a><a href="#probala">Probá una tarjeta</a></div>
              <div><b>Empresas</b><a href="/empresas">Stampa Enterprise</a><a href={WHATSAPP_ENTERPRISE} target="_blank" rel="noopener noreferrer">Hablar con ventas</a><a href="#negocios">Casos</a></div>
              <div><b>Ayuda</b><a href="/ayuda">Centro de ayuda</a><a href="#faq">Preguntas frecuentes</a><a href={WHATSAPP_SALES} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp" size={16} /> WhatsApp de ventas</a><a href="mailto:hola@stampaclub.com">hola@stampaclub.com</a></div>
              <div><b>Apps</b>{SCANNER_IOS_URL && <a href={SCANNER_IOS_URL} className="l2-store" target="_blank" rel="noopener noreferrer"><Icon name="apple" size={24} /><span><small>App de escaneo en</small>App Store</span></a>}<a href={INSTAGRAM} target="_blank" rel="noopener noreferrer"><Icon name="instagram" size={16} /> Instagram</a></div>
            </nav>
          </div>
          <div className="l2-ft-word" aria-hidden="true">STAMPA</div>
          <div className="l2-ft-bottom"><span>© {new Date().getFullYear()} Stampa</span><nav><a href="/terms">Términos</a><a href="/privacy">Privacidad</a></nav></div>
        </footer>
      </div>
    </div>
  )
}
