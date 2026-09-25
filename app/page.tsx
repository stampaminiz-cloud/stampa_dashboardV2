import type { Metadata } from 'next'
import StampaLanding from '@/components/StampaLanding'

// La imagen para compartir (WhatsApp, Instagram, LinkedIn) es
// app/opengraph-image.png — Next la agrega sola a estas etiquetas.
export const metadata: Metadata = {
  title: 'Stampa — Tarjetas de fidelidad en Apple y Google Wallet',
  description:
    'Stampa convierte cada visita en una razón para volver. Tarjetas de sellos, puntos y membresía en el Wallet de tus clientes, sin apps que nadie descarga. Lista en minutos.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'Stampa',
    locale: 'es_AR',
    url: '/',
    title: 'Stampa — Tarjetas de fidelidad en Apple y Google Wallet',
    description: 'Sellos, puntos y membresías en el Wallet de tus clientes. Sin apps. Lista en minutos.',
  },
  twitter: { card: 'summary_large_image' },
}

export default function Page() {
  return <StampaLanding />
}
