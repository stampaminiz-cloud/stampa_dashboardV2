'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import styles from '../styles/stampa-landing.module.css';

/* ────────────────────────────────────────────────────────────────
   Static content
   ──────────────────────────────────────────────────────────────── */

const NAV_LINKS = [
  { href: '#programas', label: 'Programas' },
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#features', label: 'Features' },
  { href: '#precios', label: 'Precios' },
  { href: '#faq', label: 'FAQ' },
];

const PROOF_BUSINESSES = [
  { name: 'Surge Málaga', category: 'Cafetería de especialidad', logo: '/assets/logo-surge-malaga.jpg', logoBg: '#000000' },
  { name: 'Living4Malaga', category: 'Alojamiento turístico', logo: '/assets/logo-living4malaga.png', logoBg: '#0C2A2A' },
  { name: 'Raíz Criolla', category: 'Carne envasada premium', logo: '/assets/logo-raiz-criolla.png', logoBg: '#5C1414' },
  { name: 'Nogal', category: 'Dietética', logo: '/assets/logo-nogal.png', logoBg: '#3B2A1E' },
];

const PAPER_CONS = ['Se pierde en la billetera', 'Se moja, se arruga, se olvida en casa', 'No manda un solo aviso'];
const APP_CONS = ['Nadie la descarga para un solo local', 'Cuesta meses y miles de euros', 'Se abandona a la semana'];
const STAMPA_PROS = ['Vive en el wallet que ya usa', 'Lista para usar en minutos', 'Notificaciones directas al cliente'];

const PROGRAM_TYPES = [
  { name: 'Sellos', desc: 'Acumulá visitas y elegí un premio al completar la tarjeta.', fit: 'Cafeterías y panaderías' },
  { name: 'Puntos', desc: 'Cada visita suma puntos canjeables por lo que quieras ofrecer.', fit: 'Restaurantes y spas' },
  { name: 'Membresía', desc: 'Niveles Bronze, Silver, Gold y Black con beneficios exclusivos.', fit: 'Gimnasios y peluquerías premium' },
];

const STEPS = [
  { n: '01', title: 'Creás tu tarjeta', desc: 'Elegís el formato — sellos, puntos o membresía — y la personalizás con tu marca en minutos, sin saber programar.' },
  { n: '02', title: 'El cliente la guarda en su wallet', desc: 'Con un link o un QR, la tarjeta queda guardada en Apple Wallet o Google Wallet. No hay que descargar ninguna app.' },
  { n: '03', title: 'Cada visita suma', desc: 'Escaneás con la app de Stampa y el sello, punto o beneficio se actualiza al instante en el teléfono del cliente.' },
];

const HERO_FEATURE = {
  title: 'Dashboard con analytics',
  desc: 'Visitas, clientes nuevos y tasa de retorno, todo en un solo vistazo — sin planillas ni adivinar qué está funcionando.',
};

const LIST_FEATURES = [
  { mark: 'S/P', title: 'Sellos, puntos o membresía', desc: 'Elegí el formato que mejor se adapta a tu negocio.' },
  { mark: 'W', title: 'Apple & Google Wallet', desc: 'Tu tarjeta vive donde tu cliente ya vive.' },
  { mark: 'N', title: 'Notificaciones push', desc: 'Avisale sin depender de redes sociales.' },
  { mark: '0', title: 'Sin app para el cliente', desc: 'Cero fricción, cero descarga.' },
  { mark: 'SC', title: 'Scanner app para el equipo', desc: 'Suma sellos y puntos desde el celular, en segundos.' },
  { mark: 'EQ', title: 'Gestión de equipo', desc: 'Managers con acceso completo, scanners solo para escanear.' },
  { mark: 'F', title: 'Formulario personalizable', desc: 'Elegí qué datos pedirle a tu cliente al sumarse.' },
  { mark: 'M', title: 'Multi-local (plan Pro)', desc: 'Gestioná todos tus locales desde un mismo dashboard.' },
];

const TESTIMONIAL = {
  quote:
    'Para los clientes tener otra app descargada puede llegar a ser molesto. Además puedo enviar notificaciones a los usuarios para informar de descuentos, horarios y actividades, sin depender de las redes sociales.',
  author: 'Dueño, Surge Málaga',
};

const CASE_STATS = [
  { value: '150', label: 'Clientes registrados en 2 meses' },
  { value: '70%', label: 'Regresa activamente' },
  { value: '0€', label: 'Dependencia de redes sociales' },
];

const VERTICALS = [
  { name: 'Cafeterías', example: 'Sello por cada café — el décimo, gratis.', tag: 'Sellos', initial: 'CA' },
  { name: 'Restaurantes', example: 'Puntos por consumo, canjeables por platos.', tag: 'Puntos', initial: 'RE' },
  { name: 'Peluquerías', example: 'Membresía por niveles con beneficios exclusivos.', tag: 'Membresía', initial: 'PE' },
  { name: 'Gimnasios', example: 'Puntos por asistencia y por traer amigos.', tag: 'Membresía', initial: 'GI' },
  { name: 'Panaderías', example: 'Sello por compra, premio a la décima visita.', tag: 'Sellos', initial: 'PA' },
  { name: 'Spas', example: 'Puntos canjeables por tratamientos y upgrades.', tag: 'Puntos', initial: 'SP' },
  { name: 'Ropa', example: 'Puntos por compra, descuentos según tu nivel.', tag: 'Puntos', initial: 'RO' },
  { name: 'Librerías', example: 'Sello por compra, un libro de regalo al completar.', tag: 'Sellos', initial: 'LI' },
].map((v) => ({
  ...v,
  accent: v.tag === 'Sellos' ? 'var(--stampa-ember)' : v.tag === 'Puntos' ? 'var(--blue)' : 'var(--green)',
  accentSoft: v.tag === 'Sellos' ? 'var(--ember-soft)' : v.tag === 'Puntos' ? 'var(--blue-soft)' : 'var(--green-soft)',
}));

const RAW_PLANS = [
  { name: 'Starter', slug: 'starter', desc: 'Para arrancar con un local y una tarjeta.', monthly: 29, annual: 23, features: ['1 local', '1 tarjeta de fidelización', 'Hasta 200 clientes', 'Analytics básico'], cta: 'Empezar gratis', highlight: false },
  { name: 'Growth', slug: 'growth', desc: 'Para crecer con marca propia y equipo.', monthly: 49, annual: 39, features: ['1 local', '3 tarjetas de fidelización', 'Clientes ilimitados', 'Branding propio', '5 usuarios de equipo'], cta: 'Empezar gratis', highlight: true },
  { name: 'Pro', slug: 'pro', desc: 'Para negocios con varios locales.', monthly: 89, annual: 71, features: ['3 locales', 'Todo ilimitado', 'Soporte prioritario'], cta: 'Empezar gratis', highlight: false },
  { name: 'Enterprise', slug: 'enterprise', desc: 'Para cadenas y franquicias.', monthly: null as number | null, annual: null as number | null, features: ['Locales ilimitados', 'White label', 'Soporte dedicado'], cta: 'Hablar con ventas', highlight: false },
];

const FAQ_DATA = [
  { q: '¿Mis clientes necesitan descargar una app?', a: 'No. La tarjeta de fidelización vive directamente en Apple Wallet o Google Wallet, que ya vienen instalados en su teléfono. Nada que descargar, nada que crear cuenta.' },
  { q: '¿Cómo escaneo la tarjeta de mis clientes?', a: 'Con la app de Stampa para tu negocio. Escaneás el código de la tarjeta y el sello, punto o beneficio se actualiza al instante en el wallet del cliente.' },
  { q: '¿Cuánto tarda en configurarse?', a: 'Menos de 15 minutos. Elegís el formato de tu tarjeta (sellos, puntos o membresía), la personalizás con tu marca y ya podés compartirla con tus clientes.' },
  { q: '¿Necesito tarjeta de crédito para probar?', a: 'No. Los 14 días de prueba gratuita no piden tarjeta de crédito. Solo pagás si decidís continuar con un plan pago.' },
  { q: '¿Puedo cambiar de plan o cancelar cuando quiera?', a: 'Sí, no hay permanencia. Podés subir, bajar o cancelar tu plan en cualquier momento desde el dashboard.' },
  { q: '¿Funciona para más de un local?', a: 'Sí. Los planes Pro y Enterprise permiten gestionar varios locales desde un mismo dashboard, cada uno con sus propias tarjetas y analytics.' },
];

const SOCIAL_LINKS = [
  { name: 'Instagram', href: 'https://instagram.com/stampa.app' },
  { name: 'LinkedIn', href: 'https://linkedin.com/company/stampa-app' },
  { name: 'X', href: 'https://x.com/stampa_app' },
];

const STAMP_PATTERN = [true, true, true, true, false, false];
const HERO_STAMPS = STAMP_PATTERN.map((filled) => ({
  bg: filled ? 'var(--stampa-ember)' : 'transparent',
  border: filled ? 'var(--stampa-ember)' : 'rgba(255,255,255,0.35)',
}));
const WALLET_STAMPS = STAMP_PATTERN.map((filled) => ({
  filled,
  bg: filled ? 'rgba(255,255,255,0.22)' : 'transparent',
  border: filled ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)',
}));
const BAR_W = [2, 1, 3, 1, 2, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 2, 3, 1, 1, 2, 3, 1, 2];
const BAR_H = [60, 90, 45, 100, 70, 55, 85, 40, 95, 65, 100, 50, 75, 90, 45, 100, 60, 80, 55, 100, 70, 45, 90, 65];
const BARCODE_BARS = BAR_W.map((w, i) => ({ w, h: BAR_H[i] }));

/* ────────────────────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────────────────────── */

export default function StampaLanding() {
  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [openFaq, setOpenFaq] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateIsMobile = () => setIsMobile(window.innerWidth < 860);
    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    return () => window.removeEventListener('resize', updateIsMobile);
  }, []);

  const isMonthly = period === 'monthly';
  const plans = RAW_PLANS.map((p) => ({
    ...p,
    hasPrice: p.monthly !== null,
    price: p.monthly === null ? null : isMonthly ? p.monthly : p.annual,
    cardBg: p.highlight ? 'linear-gradient(155deg, var(--ember-500), var(--ember-700))' : 'var(--surface-card)',
    cardBorder: p.highlight ? '1px solid var(--ember-glow)' : '1px solid var(--border)',
    btnBg: p.highlight ? '#fff' : 'var(--ember-soft)',
    btnColor: p.highlight ? 'var(--ember-600)' : 'var(--ember-400)',
  }));

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className={styles.page} style={{ background: 'var(--stampa-ink)', minHeight: '100vh' }}>
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
              Fidelización digital para negocios
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
              La fidelidad no es un algoritmo. Es humana.
            </h1>
            <p style={{ fontSize: 19, lineHeight: 'var(--leading-body)', color: 'var(--text-body)', maxWidth: 520, marginBottom: 36, textWrap: 'pretty' as CSSProperties['textWrap'] }}>
              Stampa convierte cada visita en una razón para volver. Sin apps que nadie descarga, sin tarjetas de papel que se pierden — solo el
              wallet que tu cliente ya tiene en el bolsillo.
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
            <div
              style={{
                background: 'var(--surface-card)',
                backdropFilter: 'blur(var(--blur-card))',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-2xl)',
                boxShadow: 'var(--shadow-lg)',
                padding: 28,
                width: '100%',
                maxWidth: 440,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--text-strong)' }}>
                  Panel de Stampa
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ember-400)' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 22 }}>
                <div style={{ background: 'var(--surface-sunk)', borderRadius: 'var(--radius-md)', padding: '14px 12px' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--text-strong)' }}>1.248</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4 }}>Clientes activos</div>
                </div>
                <div style={{ background: 'var(--surface-sunk)', borderRadius: 'var(--radius-md)', padding: '14px 12px' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--green)' }}>+312</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4 }}>Visitas esta semana</div>
                </div>
                <div style={{ background: 'var(--surface-sunk)', borderRadius: 'var(--radius-md)', padding: '14px 12px' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--ember-400)' }}>68%</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4 }}>Tasa de retorno</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 70, padding: '0 2px 0', marginBottom: 18 }}>
                {[40, 60, 45, 90, 55, 70, 100].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      background: i === 3 || i === 6 ? 'var(--stampa-ember)' : 'var(--green-600)',
                      borderRadius: '4px 4px 0 0',
                      height: `${h}%`,
                    }}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface-sunk)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/app-icon.png" alt="" style={{ width: 30, height: 30, borderRadius: 8 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-strong)' }}>Café Aurora</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Nuevo sello — hace 2 min</div>
                </div>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--ember-400)' }}>4/6</div>
              </div>
            </div>
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
            Negocios que ya viven en el wallet de sus clientes
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
              clientes fidelizados en 2 meses en Surge Málaga — mirá el caso →
            </span>
          </a>
        </div>
      </section>

      {/* PROBLEMA / SOLUCIÓN */}
      <section id="solucion" className="stampa-bg" style={{ padding: '64px 32px 80px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 1160, textAlign: 'center' }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 36,
              color: 'var(--text-strong)',
              marginBottom: 16,
              textWrap: 'pretty' as CSSProperties['textWrap'],
            }}
          >
            Las tarjetas de papel se pierden. Las apps nadie las descarga.
          </h2>
          <p style={{ fontSize: 18, color: 'var(--text-body)', maxWidth: 560, margin: '0 auto 36px' }}>
            Stampa vive en el wallet — donde tu cliente ya está, todos los días.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, textAlign: 'left' }}>
            <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-2xl)', padding: 30 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--text-muted)', marginBottom: 18 }}>
                Tarjeta de papel
              </div>
              {PAPER_CONS.map((item) => (
                <div key={item} style={{ display: 'flex', gap: 10, padding: '8px 0', color: 'var(--text-body)', fontSize: 'var(--text-base)', borderTop: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--red)', fontWeight: 700 }}>—</span>
                  {item}
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-2xl)', padding: 30 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--text-muted)', marginBottom: 18 }}>
                Una app propia
              </div>
              {APP_CONS.map((item) => (
                <div key={item} style={{ display: 'flex', gap: 10, padding: '8px 0', color: 'var(--text-body)', fontSize: 'var(--text-base)', borderTop: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--red)', fontWeight: 700 }}>—</span>
                  {item}
                </div>
              ))}
            </div>
            <div
              style={{
                background: 'linear-gradient(155deg, var(--green-700), var(--stampa-ink))',
                border: '1px solid var(--ember-glow)',
                borderRadius: 'var(--radius-2xl)',
                padding: 30,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/mascot-cream.png" alt="" style={{ position: 'absolute', right: -20, bottom: -20, width: 110, opacity: 0.5 }} />
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--ember-300)', marginBottom: 18, position: 'relative' }}>
                Stampa
              </div>
              {STAMPA_PROS.map((item) => (
                <div
                  key={item}
                  style={{ display: 'flex', gap: 10, padding: '8px 0', color: 'var(--text-strong)', fontSize: 'var(--text-base)', borderTop: '1px solid var(--border)', position: 'relative' }}
                >
                  <span style={{ color: 'var(--green)', fontWeight: 700 }}>✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TIPOS DE PROGRAMA */}
      <section id="programas" data-theme="cream" style={{ background: 'var(--stampa-cream)', padding: '96px 32px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 1160 }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 34, color: 'var(--stampa-ink)', marginBottom: 14 }}>
              3 tipos de programa, un solo Stampa
            </h2>
            <p style={{ fontSize: 18, color: 'var(--text-body)', maxWidth: 560, margin: '0 auto' }}>
              Elegí el formato que mejor encaja con la forma en que tus clientes vuelven.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {PROGRAM_TYPES.map((p) => (
              <div key={p.name} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-2xl)', padding: 30 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--stampa-ink)', marginBottom: 12 }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 'var(--text-base)', color: 'var(--text-body)', lineHeight: 'var(--leading-body)', marginBottom: 20 }}>{p.desc}</div>
                <div
                  style={{
                    display: 'inline-block',
                    fontSize: 'var(--text-2xs)',
                    fontWeight: 700,
                    letterSpacing: 'var(--tracking-label)',
                    textTransform: 'uppercase',
                    color: 'var(--ember-600)',
                    background: 'var(--ember-soft)',
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  {p.fit}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" data-theme="cream" style={{ background: 'var(--stampa-cream)', padding: '96px 32px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 1160, display: 'flex', gap: 64, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 480px', minWidth: 320 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 34, color: 'var(--stampa-ink)', marginBottom: 40 }}>
              Tres pasos. Cero fricción.
            </h2>
            {STEPS.map((step) => (
              <div key={step.n} style={{ display: 'flex', gap: 20, padding: '22px 0', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, color: 'var(--ember-300)', flexShrink: 0, width: 44 }}>
                  {step.n}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--stampa-ink)', marginBottom: 6 }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: 'var(--text-base)', color: 'var(--text-body)', lineHeight: 'var(--leading-body)' }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ flex: '1 1 360px', minWidth: 300, display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: 320 }}>
              <div style={{ background: 'linear-gradient(155deg, var(--ember-500), var(--ember-700))', borderRadius: 20, boxShadow: 'var(--shadow-lg)', overflow: 'hidden', fontFamily: 'var(--font-sans)' }}>
                <div style={{ padding: '20px 22px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/assets/app-icon.png" alt="" style={{ width: 26, height: 26, borderRadius: 7 }} />
                    <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: 700, letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase' }}>
                      Tarjeta de sellos
                    </div>
                  </div>
                  <div style={{ color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, letterSpacing: 'var(--tracking-tight)', marginBottom: 18 }}>
                    Café Aurora
                  </div>
                  <div style={{ display: 'flex', gap: 32 }}>
                    <div>
                      <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: 700, letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase', marginBottom: 4 }}>
                        Progreso
                      </div>
                      <div style={{ color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>4 de 6 sellos</div>
                    </div>
                    <div>
                      <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: 700, letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase', marginBottom: 4 }}>
                        Premio
                      </div>
                      <div style={{ color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>Café gratis</div>
                    </div>
                  </div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.12)', padding: '20px 22px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    {WALLET_STAMPS.map((s, i) => (
                      <div
                        key={i}
                        style={{ aspectRatio: '1', borderRadius: '50%', background: s.bg, border: `2px dashed ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        {s.filled && <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff' }} />}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ position: 'relative' }}>
                  <div style={{ borderTop: '2px dashed rgba(255,255,255,0.4)' }} />
                  <div style={{ position: 'absolute', left: -12, top: -12, width: 24, height: 24, borderRadius: '50%', background: 'var(--stampa-cream)' }} />
                  <div style={{ position: 'absolute', right: -12, top: -12, width: 24, height: 24, borderRadius: '50%', background: 'var(--stampa-cream)' }} />
                </div>
                <div style={{ padding: '18px 22px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, background: '#fff' }}>
                  <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 34 }}>
                    {BARCODE_BARS.map((bar, i) => (
                      <div key={i} style={{ width: bar.w, height: `${bar.h}%`, background: 'var(--stampa-ink)' }} />
                    ))}
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: 'var(--tracking-label)' }}>CAFE-AURORA-04821</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="stampa-bg" style={{ padding: '96px 32px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 1160 }}>
          <div style={{ marginBottom: 56, maxWidth: 640 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 34, color: 'var(--text-strong)', marginBottom: 14 }}>
              Todo lo que necesitás para fidelizar, en un solo lugar
            </h2>
            <p style={{ fontSize: 18, color: 'var(--text-body)' }}>Sin plugins, sin integraciones complicadas. Stampa hace todo el trabajo por vos.</p>
          </div>
          <div style={{ display: 'flex', gap: 56, alignItems: 'stretch', flexWrap: 'wrap' }}>
            <div
              style={{
                flex: '1 1 320px',
                minWidth: 300,
                background: 'linear-gradient(155deg, var(--green-700), var(--stampa-ink))',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-2xl)',
                padding: 32,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ fontSize: 'var(--text-2xs)', fontWeight: 700, letterSpacing: 'var(--tracking-eyebrow)', textTransform: 'uppercase', color: 'var(--ember-300)', marginBottom: 14 }}>
                Destacado
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--text-strong)', marginBottom: 10 }}>{HERO_FEATURE.title}</div>
              <div style={{ fontSize: 'var(--text-base)', color: 'var(--text-body)', lineHeight: 'var(--leading-body)', marginBottom: 28 }}>{HERO_FEATURE.desc}</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 90, marginTop: 'auto' }}>
                {[45, 65, 100, 55, 75, 90].map((h, i) => (
                  <div key={i} style={{ flex: 1, background: i === 2 || i === 5 ? 'var(--stampa-ember)' : 'var(--green-600)', borderRadius: '4px 4px 0 0', height: `${h}%` }} />
                ))}
              </div>
            </div>
            <div style={{ flex: '2 1 480px', minWidth: 320, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', columnGap: 32 }}>
              {LIST_FEATURES.map((f) => (
                <div key={f.title} style={{ display: 'flex', gap: 14, padding: '18px 0', borderBottom: '1px solid var(--border)' }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      flexShrink: 0,
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--ember-soft)',
                      color: 'var(--ember-400)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      fontSize: 12,
                    }}
                  >
                    {f.mark}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-md)', color: 'var(--text-strong)', marginBottom: 4 }}>{f.title}</div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-body)', lineHeight: 'var(--leading-body)' }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
              En dos meses, Surge Málaga cambió sus tarjetas de papel por Stampa. El resultado: una base de clientes fieles a la que le pueden
              hablar directamente, sin depender del algoritmo de Instagram.
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

      {/* RUBROS COMPATIBLES */}
      <section id="rubros" className="stampa-bg" style={{ padding: '96px 32px', display: 'flex', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/mascot.png" alt="" style={{ position: 'absolute', left: -60, bottom: -40, width: 220, opacity: 0.1, pointerEvents: 'none' }} />
        <div style={{ width: '100%', maxWidth: 1160, position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 34,
                color: 'var(--text-strong)',
                marginBottom: 14,
                textWrap: 'pretty' as CSSProperties['textWrap'],
              }}
            >
              Un programa de fidelidad para cada tipo de negocio
            </h2>
            <p style={{ fontSize: 18, color: 'var(--text-body)', maxWidth: 640, margin: '0 auto' }}>
              Retené a los que ya te eligen y dale una razón a los nuevos para volver. Stampa se adapta al rubro, no al revés.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
            {VERTICALS.map((v) => (
              <div
                key={v.name}
                style={{
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border)',
                  borderTop: `3px solid ${v.accent}`,
                  borderRadius: 'var(--radius-xl)',
                  padding: 24,
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 'var(--radius-md)',
                    background: v.accentSoft,
                    color: v.accent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: 15,
                    marginBottom: 16,
                  }}
                >
                  {v.initial}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-md)', color: 'var(--text-strong)', marginBottom: 8 }}>{v.name}</div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-body)', lineHeight: 'var(--leading-body)', marginBottom: 16 }}>{v.example}</div>
                <div
                  style={{
                    display: 'inline-block',
                    fontSize: 'var(--text-2xs)',
                    fontWeight: 700,
                    letterSpacing: 'var(--tracking-label)',
                    textTransform: 'uppercase',
                    color: v.accent,
                    background: v.accentSoft,
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  {v.tag}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRECIOS */}
      <section id="precios" className="stampa-bg" style={{ padding: '96px 32px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 1240 }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 34, color: 'var(--text-strong)', marginBottom: 14 }}>
              Planes simples, sin sorpresas
            </h2>
            <p style={{ fontSize: 18, color: 'var(--text-body)', marginBottom: 32 }}>14 días gratis en cualquier plan. Sin tarjeta de crédito.</p>
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
                Anual <span style={{ background: 'var(--green-soft)', color: 'var(--green)', fontSize: 'var(--text-2xs)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>-20%</span>
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
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 38, color: 'var(--text-strong)' }}>€{plan.price}</span>
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>/mes</span>
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
                  href={plan.slug === 'enterprise' ? 'mailto:hola@stampa.app' : `/register?plan=${plan.slug}`}
                  style={{ textAlign: 'center', background: plan.btnBg, color: plan.btnColor, fontWeight: 700, fontSize: 'var(--text-sm)', padding: 13, borderRadius: 'var(--radius-lg)', display: 'block' }}
                >
                  {plan.cta}
                </a>
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
                La fidelidad no es un algoritmo. Es humana.
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
                <a href="mailto:hola@stampa.app" style={{ color: 'var(--text-body)', fontSize: 'var(--text-sm)' }}>Hablar con ventas</a>
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
              <a href="/privacidad" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>Privacidad</a>
              <a href="/terminos" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>Términos</a>
            </div>
          </div>
          <div style={{ height: 32 }} />
        </div>
      </footer>
    </div>
  );
}