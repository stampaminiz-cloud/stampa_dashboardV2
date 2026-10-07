'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import styles from '../styles/stampa-landing.module.css';
import { annualSavingsPct, formatPrice, taxSuffix, usePlanPrices, type PlanSlug } from '@/lib/pricing';
import type { Market } from '@/lib/market';
import { VerticalPicker } from './landing/VerticalPicker';
import { FeatureShowcase } from './landing/FeatureShowcase';
import { BeforeAfter } from './landing/BeforeAfter';
import { HeroPass } from './landing/HeroPass';

/* ────────────────────────────────────────────────────────────────
   Static content
   ──────────────────────────────────────────────────────────────── */

const NAV_LINKS = [
  { href: '#rubros', label: 'Tarjetas' },
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#features', label: 'Features' },
  { href: '#precios', label: 'Precios' },
  { href: '#faq', label: 'FAQ' },
];

const PROOF_BUSINESSES = [
  { name: 'Surge Málaga', category: 'Cafetería de especialidad', logo: '/assets/logo-surge-malaga.jpg', logoBg: '#000000' },
  { name: 'Living4Malaga', category: 'Alojamiento turístico', logo: '/assets/logo-living4malaga.png', logoBg: '#0C2A2A' },
  { name: 'Raíz Criolla', category: 'Carne envasada premium', logo: '/assets/logo-raiz-criolla.png', logoBg: '#5C1414' },
];


const STEPS = [
  { n: '01', title: 'Armás tu tarjeta', desc: 'Elegís sellos, puntos o niveles, subís tu logo y elegís los colores. Lleva unos 15 minutos.' },
  { n: '02', title: 'El cliente la guarda', desc: 'Escanea el QR del mostrador, deja su nombre y la agrega a Apple Wallet o Google Wallet.' },
  { n: '03', title: 'Cada visita suma', desc: 'Tu equipo escanea la tarjeta con la app de Stampa y el celular del cliente se actualiza al momento.' },
];

const TESTIMONIAL = {
  quote:
    'Para los clientes tener otra app descargada puede llegar a ser molesto. Además puedo enviar notificaciones a los usuarios para informar de descuentos, horarios y actividades, sin depender de las redes sociales.',
  author: 'Dueño, Surge Málaga',
};

const CASE_STATS = [
  { value: '150', label: 'Clientes sumados en dos meses' },
  { value: '70%', label: 'Vuelve a pasar por el local' },
];


// Montos: salen de Mercado Pago (lib/pricing.ts → usePlanPrices). Acá solo
// hay nombre, descripción y features; monthly/annual en 0 = "tiene precio",
// null = "A consultar" (Enterprise, solo por contacto).
const RAW_PLANS = [
  { name: 'Starter', slug: 'starter', desc: 'Para arrancar con un local y una tarjeta.', monthly: 0, annual: 0, features: ['1 local', '1 tarjeta de fidelización', 'Hasta 200 clientes', 'Métricas clave en Inicio', '4 notificaciones por mes'], cta: 'Empezar gratis', highlight: false },
  { name: 'Growth', slug: 'growth', desc: 'Para crecer con marca propia y equipo.', monthly: 0, annual: 0, features: ['1 local', '3 tarjetas de fidelización', 'Hasta 500 clientes', 'Analítica completa', '20 notificaciones por mes, segmentadas', '5 usuarios de equipo'], cta: 'Empezar gratis', highlight: true },
  { name: 'Pro', slug: 'pro', desc: 'Para negocios con varios locales.', monthly: 0, annual: 0, features: ['3 locales', 'Clientes, tarjetas, equipo y notificaciones ilimitados', 'Color 100% libre', 'Notificaciones a clientes puntuales', 'Soporte prioritario'], cta: 'Empezar gratis', highlight: false },
  { name: 'Enterprise', slug: 'enterprise', desc: 'Para cadenas y franquicias.', monthly: null as number | null, annual: null as number | null, features: ['Locales ilimitados', 'White label', 'Soporte dedicado'], cta: 'Hablar con ventas', highlight: false },
];

const FAQ_DATA = [
  { q: '¿Mis clientes necesitan descargar una app?', a: 'No. La tarjeta de fidelización vive directamente en Apple Wallet o en Google Wallet, que ya vienen en el teléfono. No hace falta bajar nada ni crear una cuenta.' },
  { q: '¿Cómo escaneo la tarjeta de mis clientes?', a: 'Con la app de escaneo de Stampa. Tu equipo entra con un PIN y vos con tu email. Escaneás el código de la tarjeta (o buscás al cliente por nombre) y el sello, punto o visita se actualiza al instante en su Wallet.' },
  { q: '¿Cuánto tarda en configurarse?', a: 'Menos de 15 minutos. Elegís el formato de tu tarjeta (sellos, puntos o membresía), la personalizás con tu marca y ya podés compartirla con tus clientes.' },
  { q: '¿Necesito tarjeta de crédito para probar?', a: 'No. Los 14 días de prueba gratuita no piden tarjeta de crédito. Solo pagás si decidís continuar con un plan pago.' },
  { q: '¿Puedo cambiar de plan o cancelar cuando quiera?', a: 'Sí, no hay permanencia. Podés subir, bajar o cancelar tu plan en cualquier momento desde el dashboard.' },
  { q: '¿Puedo premiar cumpleaños o hacer días con sello doble?', a: 'Sí. En Configuración activás el regalo de cumpleaños, elegís qué días de la semana cada visita vale doble y si los sellos o puntos vencen cuando un cliente deja de venir. Los avisos salen solos y no cuentan para tus notificaciones del mes.' },
];

const SOCIAL_LINKS = [
  { name: 'Instagram', href: 'https://instagram.com/stampa.app' },
];

// Ventas por WhatsApp — en el mercado de comercios es el canal que más
// convierte. El texto llega pre-cargado en el chat.
const WHATSAPP_NUMBER = '5493512638999';
const whatsappLink = (text: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
const WHATSAPP_SALES = whatsappLink('Hola! Quiero saber más sobre Stampa para mi negocio.');
const WHATSAPP_ENTERPRISE = whatsappLink('Hola! Me interesa el plan Enterprise de Stampa.');

// Negocio de demo ("Stampa") para la sección "Probala en tu celular": el
// visitante escanea el QR, se registra y recibe una tarjeta real en su
// Wallet. Se configura con NEXT_PUBLIC_DEMO_BUSINESS_ID (el _id del
// negocio demo en esa base) — si no está, la sección no se muestra.
const DEMO_BUSINESS_ID = process.env.NEXT_PUBLIC_DEMO_BUSINESS_ID || '';



/* ────────────────────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────────────────────── */

// market: AR = pesos (Mercado Pago); EU = euros + IVA (Stripe). Lo decide
// app/page.tsx con el país de la IP.
export default function StampaLanding({ market = 'AR' }: { market?: Market }) {
  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [openFaq, setOpenFaq] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [origin, setOrigin] = useState('');
  useEffect(() => { setOrigin(window.location.origin); }, []);
  const demoUrl = DEMO_BUSINESS_ID && origin ? `${origin}/r/${DEMO_BUSINESS_ID}` : '';

  useEffect(() => {
    const updateIsMobile = () => setIsMobile(window.innerWidth < 860);
    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    return () => window.removeEventListener('resize', updateIsMobile);
  }, []);

  const isMonthly = period === 'monthly';
  const prices = usePlanPrices(market);
  // El badge del toggle muestra el ahorro mínimo entre planes ("hasta -X%"
  // sería engañoso si alguno ahorra menos).
  const savings = (['starter', 'growth', 'pro'] as PlanSlug[]).map((k) => annualSavingsPct(prices[k])).filter((x): x is number => x != null);
  const annualBadge = savings.length ? `-${Math.min(...savings)}%` : null;
  const plans = RAW_PLANS.map((p) => {
    const pr = p.monthly === null ? null : prices[p.slug as PlanSlug];
    // Anual: se muestra el equivalente por mes y abajo el total del año.
    const monthlyEquivalent = pr?.annual ? (pr.currency === 'EUR' ? Math.round((pr.annual / 12) * 100) / 100 : Math.round(pr.annual / 12)) : null;
    return {
    ...p,
    hasPrice: p.monthly !== null,
    price: pr ? formatPrice(isMonthly ? pr.monthly : monthlyEquivalent, pr.currency) : null,
    annualTotal: pr && !isMonthly && pr.annual ? formatPrice(pr.annual, pr.currency) : null,
    tax: pr ? taxSuffix(pr) : '',
    cardBg: p.highlight ? 'linear-gradient(155deg, var(--ember-500), var(--ember-700))' : 'var(--surface-card)',
    cardBorder: p.highlight ? '1px solid var(--ember-glow)' : '1px solid var(--border)',
    btnBg: p.highlight ? '#fff' : 'var(--ember-soft)',
    btnColor: p.highlight ? 'var(--ember-600)' : 'var(--ember-400)',
    };
  });

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className={styles.page} style={{ background: 'var(--stampa-ink)', minHeight: '100vh', fontFamily: 'var(--font-sans)' }}>
      {/* Mismas fuentes que el dashboard (ver app/login/page.tsx) */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      {/* HEADER */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(251, 246, 238, 0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--cream-300)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 1240,
            padding: '16px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
          }}
        >
          <a href="#hero" style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--stampa-ink)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/app-icon.png" alt="Stampa" style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)' }} />
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 21,
                letterSpacing: '-0.01em',
                color: 'var(--stampa-ink)',
              }}
            >
              Stampa
            </span>
          </a>

          {!isMobile && (
            <nav style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
              {NAV_LINKS.map((link) => (
                <a key={link.href} href={link.href} className={styles.navLink} style={{ fontSize: 15, fontWeight: 400 }}>
                  {link.label}
                </a>
              ))}
            </nav>
          )}

          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <a href="/login" className={styles.navLink} style={{ fontSize: 14, fontWeight: 700, padding: '10px 16px', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-lg)', whiteSpace: 'nowrap' }}>
              Ingresar
            </a>
            <a
              href="/register"
              className={styles.ctaEmber}
              style={{
                fontWeight: 700,
                fontSize: 14,
                padding: '11px 22px',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-ember)',
                whiteSpace: 'nowrap',
              }}
            >
              Empezá gratis
            </a>
            </div>
          )}

          {isMobile && (
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className={styles.hamburgerBtn}
              style={{ width: 42, height: 42, borderRadius: 'var(--radius-md)', fontSize: 18 }}
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          )}
        </div>

        {mobileMenuOpen && (
          <div
            style={{
              width: '100%',
              borderTop: '1px solid var(--cream-300)',
              padding: '20px 32px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                onClick={closeMobileMenu}
                href={link.href}
                style={{ color: 'var(--stampa-ink)', fontSize: 16, padding: '12px 0', borderBottom: '1px solid var(--cream-300)' }}
              >
                {link.label}
              </a>
            ))}
            <a
              onClick={closeMobileMenu}
              href="/login"
              style={{ color: 'var(--stampa-ink)', fontSize: 16, fontWeight: 700, padding: '12px 0', borderBottom: '1px solid var(--cream-300)' }}
            >
              Ingresar
            </a>
            <a
              onClick={closeMobileMenu}
              href="/register"
              className={styles.ctaEmber}
              style={{ marginTop: 14, textAlign: 'center', fontWeight: 700, fontSize: 15, padding: 14, borderRadius: 'var(--radius-lg)' }}
            >
              Empezá gratis
            </a>
          </div>
        )}
      </header>

      {/* HERO */}
      <section
        id="hero"
        className="stampa-bg"
        style={{ padding: '96px 32px 80px', display: 'flex', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/mascot.png"
          alt=""
          style={{ position: 'absolute', right: -40, top: 40, width: 260, opacity: 0.14, pointerEvents: 'none' }}
        />
        <div style={{ width: '100%', maxWidth: 1240, display: 'flex', gap: 64, alignItems: 'center', flexWrap: 'wrap', position: 'relative' }}>
          <div style={{ flex: '1 1 460px', minWidth: 320 }}>
            <div
              style={{
                display: 'inline-block',
                background: 'var(--ember-soft)',
                border: '1px solid var(--ember-glow)',
                color: 'var(--ember-300)',
                fontSize: 'var(--text-2xs)',
                fontWeight: 700,
                letterSpacing: 'var(--tracking-eyebrow)',
                textTransform: 'uppercase',
                padding: '7px 14px',
                borderRadius: 'var(--radius-full)',
                marginBottom: 24,
              }}
            >
              Tarjetas de fidelidad para Apple Wallet y Google Wallet
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 56,
                lineHeight: 'var(--leading-tight)',
                color: 'var(--text-strong)',
                letterSpacing: '-0.01em',
                marginBottom: 24,
                textWrap: 'pretty' as CSSProperties['textWrap'],
              }}
            >
              Que vuelvan es el mejor negocio.
            </h1>
            <p style={{ fontSize: 19, lineHeight: 'var(--leading-body)', color: 'var(--text-body)', maxWidth: 520, marginBottom: 36, textWrap: 'pretty' as CSSProperties['textWrap'] }}>
              Tu tarjeta de sellos o de puntos, guardada en el celular de tu cliente. Suma en cada visita y le podés avisar cuando le falta
              poco para el premio.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
              <a
                href="#precios"
                className={styles.ctaEmberLift}
                style={{
                  background: 'var(--stampa-ember)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 16,
                  padding: '16px 30px',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-ember)',
                }}
              >
                Empezá gratis 14 días
              </a>
              <a
                href="#como-funciona"
                className={styles.underlineCta}
                style={{ fontWeight: 700, fontSize: 16, padding: '16px 8px', borderBottom: '2px solid var(--border-strong)' }}
              >
                Ver cómo funciona
              </a>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginTop: 18 }}>Sin tarjeta de crédito · Cancelás cuando quieras</p>
          </div>

          <div style={{ flex: '1 1 440px', minWidth: 320, position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <HeroPass />
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section data-theme="cream" style={{ background: 'var(--stampa-cream)', padding: '80px 32px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 1100, textAlign: 'center' }}>
          <div
            style={{
              fontSize: 'var(--text-2xs)',
              fontWeight: 700,
              letterSpacing: 'var(--tracking-eyebrow)',
              textTransform: 'uppercase',
              color: 'var(--stampa-ember)',
              marginBottom: 14,
            }}
          >
            Usado por negocios en España y Argentina
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 30, color: 'var(--stampa-ink)', marginBottom: 44 }}>
            Algunos negocios que ya lo usan
          </h2>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 44 }}>
            {PROOF_BUSINESSES.map((b) => (
              <div
                key={b.name}
                style={{ flex: '1 1 260px', maxWidth: 320, background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-2xl)', padding: 24, textAlign: 'left' }}
              >
                <div
                  style={{
                    background: b.logoBg,
                    borderRadius: 'var(--radius-lg)',
                    padding: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                    height: 88,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.logo} alt={b.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--stampa-ink)', marginBottom: 6 }}>
                  {b.name}
                </div>
                <div
                  style={{
                    display: 'inline-block',
                    fontSize: 'var(--text-2xs)',
                    fontWeight: 700,
                    letterSpacing: 'var(--tracking-label)',
                    textTransform: 'uppercase',
                    color: 'var(--ember-600)',
                    background: 'var(--ember-soft)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  {b.category}
                </div>
              </div>
            ))}
          </div>
          <a
            href="#caso-de-uso"
            className={styles.proofCta}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 14,
              background: 'var(--stampa-ink)',
              color: 'var(--stampa-cream)',
              borderRadius: 'var(--radius-2xl)',
              padding: '22px 32px',
            }}
          >
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, color: 'var(--ember-400)' }}>150</span>
            <span style={{ fontSize: 'var(--text-md)', textAlign: 'left', maxWidth: 320 }}>
              clientes se sumaron en dos meses en Surge Málaga. Ver el caso →
            </span>
          </a>
        </div>
      </section>

      {/* ANTES Y DESPUÉS: papel vs Stampa, para sellos, puntos y niveles */}
      <section id="solucion" className="stampa-bg" style={{ padding: isMobile ? '64px 20px 72px' : '72px 32px 88px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 1000 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: isMobile ? 28 : 34, color: 'var(--text-strong)', marginBottom: 12, textWrap: 'pretty' as CSSProperties['textWrap'] }}>
            Tus clientes no van a bajar otra app
          </h2>
          <p style={{ fontSize: 18, color: 'var(--text-body)', maxWidth: 620, margin: '0 0 28px' }}>
            Y la de cartón se pierde. Stampa queda en el Wallet del celular, al lado de las entradas y los pasajes.
          </p>
          <BeforeAfter />
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" data-theme="cream" style={{ background: 'var(--stampa-cream)', padding: isMobile ? '72px 20px' : '96px 32px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 1160 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: isMobile ? 28 : 34, color: 'var(--stampa-ink)', marginBottom: 32 }}>
            Cómo funciona
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: isMobile ? 0 : 40 }}>
            {STEPS.map((step) => (
              <div key={step.n} style={{ padding: '22px 0', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, color: 'var(--ember-300)', marginBottom: 10 }}>{step.n}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--stampa-ink)', marginBottom: 6 }}>{step.title}</div>
                <div style={{ fontSize: 'var(--text-base)', color: 'var(--text-body)', lineHeight: 'var(--leading-body)' }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO — probá la tarjeta en tu propio celular */}
      {demoUrl && (
        <section id="demo" className="stampa-bg" style={{ padding: '88px 32px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 1000, display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', gap: isMobile ? 32 : 64 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 'var(--text-2xs)', fontWeight: 700, letterSpacing: 'var(--tracking-eyebrow)', textTransform: 'uppercase', color: 'var(--ember-400)', marginBottom: 14 }}>
                Probala en 10 segundos
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: isMobile ? 28 : 36, color: 'var(--text-strong)', lineHeight: 'var(--leading-tight)', marginBottom: 16 }}>
                Llevate una tarjeta Stampa a tu Wallet
              </h2>
              <p style={{ fontSize: 17, color: 'var(--text-body)', lineHeight: 'var(--leading-body)', marginBottom: 24 }}>
                {isMobile
                  ? 'Tocá el botón, dejá tu nombre y agregá la tarjeta a tu Wallet. Así la van a ver tus clientes.'
                  : 'Escaneá el código con la cámara de tu celular, dejá tu nombre y agregá la tarjeta a tu Wallet. Así la van a ver tus clientes.'}
              </p>
              {isMobile && (
                <a
                  href={demoUrl}
                  className={styles.ctaEmber}
                  style={{ display: 'inline-block', fontWeight: 700, fontSize: 'var(--text-md)', padding: '14px 22px', borderRadius: 'var(--radius-lg)' }}
                >
                  Probar la tarjeta
                </a>
              )}
            </div>
            {!isMobile && (
              <div style={{ background: 'var(--stampa-cream)', borderRadius: 24, padding: 22, boxShadow: 'var(--shadow-lg)', textAlign: 'center' }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=440x440&margin=0&color=1B412F&bgcolor=FBF6EE&data=${encodeURIComponent(demoUrl)}`}
                  alt="QR para probar una tarjeta Stampa"
                  width={220}
                  height={220}
                  style={{ display: 'block' }}
                />
                <div style={{ marginTop: 12, fontSize: 'var(--text-xs)', fontWeight: 700, color: '#2B2620' }}>Apuntá la cámara acá</div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* FEATURES */}
      <section id="features" className="stampa-bg" style={{ padding: isMobile ? '72px 20px' : '96px 32px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 1160 }}>
          <div style={{ marginBottom: 40, maxWidth: 640 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: isMobile ? 28 : 34, color: 'var(--text-strong)', marginBottom: 14 }}>
              Lo que pasa después de que el cliente guarda la tarjeta
            </h2>
            <p style={{ fontSize: 18, color: 'var(--text-body)' }}>El panel para vos y la app de escaneo para tu equipo.</p>
          </div>
          <FeatureShowcase />
        </div>
      </section>

      {/* CASO DE USO */}
      <section id="caso-de-uso" data-theme="cream" style={{ background: 'var(--stampa-cream)', padding: '96px 32px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 1160, display: 'flex', gap: 56, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 440px', minWidth: 300 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/surge-malaga-fachada.jpg"
              alt="Fachada de Surge Málaga, cafetería de especialidad"
              style={{ width: '100%', height: 420, objectFit: 'cover', objectPosition: 'center 55%', borderRadius: 'var(--radius-2xl)', boxShadow: 'var(--shadow-md)' }}
            />
          </div>
          <div style={{ flex: '1 1 440px', minWidth: 300 }}>
            <div style={{ fontSize: 'var(--text-2xs)', fontWeight: 700, letterSpacing: 'var(--tracking-eyebrow)', textTransform: 'uppercase', color: 'var(--stampa-ember)', marginBottom: 14 }}>
              Caso real
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 34, color: 'var(--stampa-ink)', marginBottom: 20 }}>Surge Málaga</h2>
            <p style={{ fontSize: 18, color: 'var(--text-body)', lineHeight: 'var(--leading-body)', marginBottom: 28 }}>
              Surge Málaga es una cafetería de especialidad. Dejó las tarjetas de papel y en dos meses sumó 150 clientes a su tarjeta en el
              Wallet. Hoy les avisa de promociones y cambios de horario directo al celular, sin depender de Instagram.
            </p>
            <div style={{ borderLeft: '3px solid var(--stampa-ember)', padding: '4px 0 4px 20px', marginBottom: 32 }}>
              <p style={{ fontSize: 17, color: 'var(--stampa-ink)', lineHeight: 'var(--leading-body)', fontStyle: 'italic', marginBottom: 10 }}>
                &quot;{TESTIMONIAL.quote}&quot;
              </p>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-muted)' }}>— {TESTIMONIAL.author}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
              {CASE_STATS.map((stat) => (
                <div key={stat.label} style={{ borderTop: '3px solid var(--stampa-ember)', paddingTop: 12 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 30, color: 'var(--stampa-ink)' }}>{stat.value}</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-body)', marginTop: 4 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* RUBROS: elegí tu rubro y mirá tu tarjeta */}
      <section id="rubros" className="stampa-bg" style={{ padding: isMobile ? '72px 20px' : '96px 32px', display: 'flex', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/mascot.png" alt="" style={{ position: 'absolute', left: -60, bottom: -40, width: 220, opacity: 0.1, pointerEvents: 'none' }} />
        <div style={{ width: '100%', maxWidth: 1160, position: 'relative' }}>
          <div style={{ marginBottom: 40, maxWidth: 680 }}>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: isMobile ? 28 : 34,
                color: 'var(--text-strong)',
                marginBottom: 14,
                textWrap: 'balance' as CSSProperties['textWrap'],
              }}
            >
              Así se vería tu tarjeta
            </h2>
            <p style={{ fontSize: 18, color: 'var(--text-body)', margin: 0 }}>
              Sellos, puntos o niveles: cada rubro premia distinto. Elegí el tuyo.
            </p>
          </div>
          <VerticalPicker />
        </div>
      </section>

      {/* PRECIOS */}
      <section id="precios" className="stampa-bg" style={{ padding: '96px 32px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 1240 }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 34, color: 'var(--text-strong)', marginBottom: 14 }}>
              Precios
            </h2>
            <p style={{ fontSize: 18, color: 'var(--text-body)', marginBottom: 32 }}>14 días gratis en cualquier plan, sin tarjeta de crédito.</p>
            <div style={{ display: 'inline-flex', background: 'var(--surface-sunk)', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)', padding: 4 }}>
              <button
                onClick={() => setPeriod('monthly')}
                className={styles.pillBtn}
                style={{
                  padding: '10px 22px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 700,
                  background: isMonthly ? 'var(--stampa-ember)' : 'transparent',
                  color: isMonthly ? '#fff' : 'var(--text-body)',
                }}
              >
                Mensual
              </button>
              <button
                onClick={() => setPeriod('annual')}
                className={styles.pillBtn}
                style={{
                  padding: '10px 22px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 700,
                  background: !isMonthly ? 'var(--stampa-ember)' : 'transparent',
                  color: !isMonthly ? '#fff' : 'var(--text-body)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                Anual {annualBadge && <span style={{ background: 'var(--green-soft)', color: 'var(--green)', fontSize: 'var(--text-2xs)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>{annualBadge}</span>}
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 18 }}>
            {plans.map((plan) => (
              <div
                key={plan.name}
                style={{
                  background: plan.cardBg,
                  border: plan.cardBorder,
                  borderRadius: 'var(--radius-2xl)',
                  padding: '28px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                }}
              >
                {plan.highlight && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -13,
                      left: 24,
                      background: 'var(--stampa-ember)',
                      color: '#fff',
                      fontSize: 'var(--text-2xs)',
                      fontWeight: 700,
                      letterSpacing: 'var(--tracking-label)',
                      textTransform: 'uppercase',
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-full)',
                    }}
                  >
                    Más elegido
                  </div>
                )}
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--text-strong)', marginBottom: 6 }}>{plan.name}</div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-body)', marginBottom: 22, minHeight: 40 }}>{plan.desc}</div>
                <div style={{ marginBottom: 24 }}>
                  {plan.hasPrice ? (
                    <>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 34, color: 'var(--text-strong)' }}>{plan.price}</span>
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>/mes{plan.tax}</span>
                      {plan.annualTotal && (
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4 }}>{plan.annualTotal}{plan.tax} facturado por año</div>
                      )}
                    </>
                  ) : (
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 30, color: 'var(--text-strong)' }}>A consultar</span>
                  )}
                </div>
                <div style={{ flex: 1, marginBottom: 24 }}>
                  {plan.features.map((feat) => (
                    <div key={feat} style={{ display: 'flex', gap: 8, padding: '7px 0', fontSize: 'var(--text-sm)', color: 'var(--text-body)' }}>
                      <span style={{ color: 'var(--stampa-ember)', fontWeight: 700 }}>✓</span>
                      {feat}
                    </div>
                  ))}
                </div>
                <a
                  href={plan.slug === 'enterprise' ? WHATSAPP_ENTERPRISE : `/register?plan=${plan.slug}`}
                  {...(plan.slug === 'enterprise' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  style={{ textAlign: 'center', background: plan.btnBg, color: plan.btnColor, fontWeight: 700, fontSize: 'var(--text-sm)', padding: 13, borderRadius: 'var(--radius-lg)', display: 'block' }}
                >
                  {plan.cta}
                </a>
                {plan.slug === 'enterprise' && (
                  <a href={`mailto:hola@stampaclub.com?subject=${encodeURIComponent('Plan Enterprise de Stampa')}`} style={{ textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 10, display: 'block' }}>
                    o escribinos a hola@stampaclub.com
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" data-theme="cream" style={{ background: 'var(--stampa-cream)', padding: '96px 32px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 780 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 34, color: 'var(--stampa-ink)', textAlign: 'center', marginBottom: 48 }}>
            Preguntas frecuentes
          </h2>
          {FAQ_DATA.map((item, i) => {
            const isOpen = openFaq === i;
            return (
              <div key={item.q} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', marginBottom: 12, overflow: 'hidden' }}>
                <div
                  onClick={() => setOpenFaq((s) => (s === i ? -1 : i))}
                  className={styles.faqRow}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '20px 24px' }}
                >
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-md)', color: 'var(--stampa-ink)' }}>{item.q}</span>
                  <span style={{ fontSize: 20, color: 'var(--stampa-ember)', flexShrink: 0 }}>{isOpen ? '–' : '+'}</span>
                </div>
                {isOpen && (
                  <div style={{ padding: '0 24px 22px', fontSize: 'var(--text-base)', color: 'var(--text-body)', lineHeight: 'var(--leading-body)' }}>{item.a}</div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* FOOTER + CTA FINAL */}
      <footer className="stampa-bg" style={{ display: 'flex', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '96px 32px 0' }}>
        <div style={{ width: '100%', maxWidth: 1160 }}>
          <div
            style={{
              background: 'linear-gradient(155deg, var(--ember-500), var(--ember-700))',
              borderRadius: 'var(--radius-2xl)',
              boxShadow: 'var(--shadow-lg)',
              padding: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 40,
              flexWrap: 'wrap',
              position: 'relative',
              overflow: 'hidden',
              marginBottom: 80,
            }}
          >
            <div style={{ position: 'absolute', right: 0, bottom: 0, width: 260, opacity: 0.16, transform: 'translate(10%, 15%)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/mascot-cream.png" alt="" style={{ width: '100%', display: 'block' }} />
            </div>
            <div style={{ maxWidth: 480, position: 'relative' }}>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 38,
                  color: '#fff',
                  marginBottom: 14,
                  textWrap: 'pretty' as CSSProperties['textWrap'],
                }}
              >
                Empezá hoy gratis
              </h2>
              <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.85)', lineHeight: 'var(--leading-body)' }}>
                14 días de prueba, sin tarjeta de crédito. Configurá tu primera tarjeta en menos de 15 minutos.
              </p>
            </div>
            <a
              href="#precios"
              style={{ flexShrink: 0, display: 'inline-block', background: '#fff', color: 'var(--ember-600)', fontWeight: 700, fontSize: 17, padding: '18px 36px', borderRadius: 'var(--radius-lg)', position: 'relative' }}
            >
              Empezá gratis 14 días
            </a>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 48 }}>
            <div style={{ maxWidth: 280 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/app-icon.png" alt="" style={{ width: 30, height: 30, borderRadius: 8 }} />
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--text-strong)' }}>Stampa</span>
              </div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', lineHeight: 'var(--leading-body)', marginBottom: 20 }}>
                Que vuelvan es el mejor negocio.
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--surface-sunk)', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '6px 14px' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-body)' }}>Operativo en España y Argentina</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-2xs)', fontWeight: 700, letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 18 }}>
                Producto
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <a href="#programas" style={{ color: 'var(--text-body)', fontSize: 'var(--text-sm)' }}>Programas</a>
                <a href="#como-funciona" style={{ color: 'var(--text-body)', fontSize: 'var(--text-sm)' }}>Cómo funciona</a>
                <a href="#features" style={{ color: 'var(--text-body)', fontSize: 'var(--text-sm)' }}>Features</a>
                <a href="#precios" style={{ color: 'var(--text-body)', fontSize: 'var(--text-sm)' }}>Precios</a>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-2xs)', fontWeight: 700, letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 18 }}>
                Recursos
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <a href="#caso-de-uso" style={{ color: 'var(--text-body)', fontSize: 'var(--text-sm)' }}>Caso de éxito</a>
                <a href="#rubros" style={{ color: 'var(--text-body)', fontSize: 'var(--text-sm)' }}>Rubros compatibles</a>
                <a href="#faq" style={{ color: 'var(--text-body)', fontSize: 'var(--text-sm)' }}>Preguntas frecuentes</a>
                <a href="/soporte" style={{ color: 'var(--text-body)', fontSize: 'var(--text-sm)' }}>Soporte</a>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-2xs)', fontWeight: 700, letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 18 }}>
                Contacto
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
                <a
                  href="mailto:stampa.miniz@gmail.com"
                  className={styles.ctaEmber}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontWeight: 700,
                    fontSize: 'var(--text-sm)',
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-lg)',
                  }}
                >
                  stampa.miniz@gmail.com
                </a>
                <a href={WHATSAPP_SALES} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-body)', fontSize: 'var(--text-sm)' }}>Hablar con ventas por WhatsApp</a>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-2xs)', fontWeight: 700, letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 18 }}>
                Seguinos
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {SOCIAL_LINKS.map((s) => (
                  <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-body)', fontSize: 'var(--text-sm)' }}>
                    {s.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, borderTop: '1px solid var(--border)', paddingTop: 24 }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>© 2026 Stampa. Hecho con cariño en España y Argentina.</span>
            <div style={{ display: 'flex', gap: 24 }}>
              <a href="/privacy" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>Privacidad</a>
              <a href="/terms" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>Términos</a>
            </div>
          </div>
          <div style={{ height: 32 }} />
        </div>
      </footer>

      <a
        href={WHATSAPP_SALES}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escribinos por WhatsApp"
        className={styles.whatsappFab}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#FFFFFF" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.57.94.95-3.48-.22-.36a9.43 9.43 0 1 1 7.99 4.41zm8.02-17.45A11.27 11.27 0 0 0 12.05.72C5.8.72.72 5.8.72 12.05c0 2 .52 3.95 1.52 5.66L.62 23.28l5.7-1.5a11.3 11.3 0 0 0 5.73 1.46h.01c6.25 0 11.33-5.08 11.33-11.33 0-3.03-1.18-5.87-3.32-8.01z"/></svg>
      </a>
    </div>
  );
}