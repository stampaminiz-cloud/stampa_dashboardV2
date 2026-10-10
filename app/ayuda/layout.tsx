import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { SALES_EMAIL, mailLink, whatsappLink } from '@/lib/contact'
import './ayuda.css'

// Centro de ayuda para los negocios: /ayuda y /ayuda/<artículo>.
// Contenido en data/ayuda.tsx. Solo para cuentas: AyudaViews lo carga
// después de comprobar la sesión. No está enlazado desde la parte pública
// ni se indexa.
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function AyudaLayout({ children }: { children: ReactNode }) {
  return (
    <div data-theme="cream" className="ay-root">
      <header className="ay-top">
        <div className="ay-top-in">
          <Link href="/" className="ay-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/app-icon.png" alt="" width={28} height={28} />
            Stampa
          </Link>
          <Link href="/ayuda" className="ay-top-title">Ayuda</Link>
          <Link href="/dashboard" className="ay-top-cta">Volver al panel</Link>
        </div>
      </header>

      {children}

      <section className="ay-contact">
        <div className="ay-contact-in">
          <div>
            <h2>¿No encontraste lo que buscabas?</h2>
            <p>Escribinos y te respondemos, normalmente en el día.</p>
          </div>
          <div className="ay-contact-btns">
            <a href={whatsappLink('Hola! Necesito ayuda con Stampa.')} target="_blank" rel="noopener noreferrer" className="ay-btn ay-btn--main">WhatsApp</a>
            <a href={mailLink('Ayuda con Stampa')} className="ay-btn">{SALES_EMAIL}</a>
          </div>
        </div>
      </section>
    </div>
  )
}
