import Link from 'next/link'
import type { Metadata } from 'next'
import { SALES_EMAIL, mailLink, whatsappLink } from '@/lib/contact'

// Página de soporte: la pide App Store Connect para la app Stampa Escáner
// (URL de soporte con al menos un medio de contacto) y sirve para cualquier
// negocio que use Stampa.
export const metadata: Metadata = {
  title: 'Soporte — Stampa',
  description: 'Ayuda con Stampa y la app Stampa Escáner: contacto por mail o WhatsApp y preguntas frecuentes.',
  alternates: { canonical: '/soporte' },
}

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: '¿Cómo entro a Stampa Escáner?',
    a: <>El dueño del negocio entra con el email y la contraseña de su cuenta de Stampa. Los empleados entran con su PIN, en un celular que el dueño vinculó antes desde el panel (Equipo → escanear el QR del dispositivo con la app).</>,
  },
  {
    q: 'Me olvidé el PIN',
    a: <>Pedíselo al dueño o administrador del negocio: desde el panel, en la pestaña Equipo, te puede dar de alta de nuevo con un PIN nuevo.</>,
  },
  {
    q: 'La cámara no lee el código',
    a: <>Revisá que la app tenga permiso de cámara (Ajustes del iPhone → Stampa Escáner → Cámara), limpiá la lente y acercá el teléfono hasta que el QR ocupe buena parte de la pantalla. Si no lo lee igual, podés buscar al cliente por nombre desde la app.</>,
  },
  {
    q: 'Tengo varias sucursales, ¿cómo cambio de sucursal?',
    a: <>En la pantalla del PIN o desde el escáner tocá “Cambiar de sucursal” y elegí la sucursal, o escaneá el QR de dispositivo de esa sucursal.</>,
  },
  {
    q: 'Quiero crear una cuenta para mi negocio',
    a: <>La cuenta se crea en <Link href="/register" style={{ color: 'var(--stampa-ember)', fontWeight: 700 }}>stampaclub.com</Link>, con 14 días de prueba gratis. La app de escaneo se usa con esa cuenta.</>,
  },
  {
    q: '¿Cómo pido que borren mis datos?',
    a: <>Si sos cliente de un negocio, pedíselo al negocio o escribinos a {SALES_EMAIL}. Si sos dueño de un negocio, podés pedir la baja de tu cuenta desde el panel (Configuración) o escribirnos. Más detalle en la <Link href="/privacy" style={{ color: 'var(--stampa-ember)', fontWeight: 700 }}>política de privacidad</Link>.</>,
  },
]

export default function SoportePage() {
  return (
    <div data-theme="cream" style={{ background: 'var(--stampa-cream)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '64px 32px 96px' }}>
        <Link href="/" style={{ color: 'var(--stampa-ember)', fontSize: 'var(--text-sm)', fontWeight: 700 }}>
          ← Volver a Stampa
        </Link>

        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 34, color: 'var(--stampa-ink)', margin: '24px 0 8px' }}>
          Soporte
        </h1>
        <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-body)', lineHeight: 'var(--leading-body)', marginBottom: 28 }}>
          ¿Necesitás ayuda con Stampa o con la app Stampa Escáner? Escribinos y te respondemos lo antes posible,
          normalmente en el día.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 48 }}>
          <a href={mailLink('Soporte Stampa')} style={{ background: 'var(--stampa-ember)', color: '#fff', fontWeight: 700, fontSize: 'var(--text-sm)', padding: '13px 20px', borderRadius: 'var(--radius-lg)' }}>
            Escribir a {SALES_EMAIL}
          </a>
          <a href={whatsappLink('Hola! Necesito ayuda con Stampa.')} target="_blank" rel="noopener noreferrer" style={{ background: '#fff', color: 'var(--stampa-ink)', border: '1px solid var(--border)', fontWeight: 700, fontSize: 'var(--text-sm)', padding: '13px 20px', borderRadius: 'var(--radius-lg)' }}>
            Escribir por WhatsApp
          </a>
        </div>

        <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-body)', lineHeight: 'var(--leading-body)', marginBottom: 40 }}>
          ¿Tenés un negocio con Stampa? En el <Link href="/ayuda" style={{ color: 'var(--stampa-ember)', fontWeight: 700 }}>centro de ayuda</Link> está
          paso a paso cómo diseñar la tarjeta, poner el QR, escanear y mandar notificaciones.
        </p>

        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-h2)', color: 'var(--stampa-ink)', marginBottom: 16 }}>
          Preguntas frecuentes
        </h2>
        {FAQ.map(item => (
          <section key={item.q} style={{ padding: '18px 0', borderTop: '1px solid var(--border)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-md)', color: 'var(--stampa-ink)', marginBottom: 6 }}>{item.q}</h3>
            <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-body)', lineHeight: 'var(--leading-body)', margin: 0 }}>{item.a}</p>
          </section>
        ))}
      </div>
    </div>
  )
}
