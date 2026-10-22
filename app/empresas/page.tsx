import type { Metadata } from 'next'
import Empresas from '@/components/landing2/Empresas'

export const metadata: Metadata = {
  title: 'Stampa Enterprise — Fidelidad para marcas con varios locales',
  description: 'Una tarjeta de fidelidad en Apple Wallet y Google Wallet para toda tu marca, en todos tus locales. Locales ilimitados, tu marca en todo y soporte dedicado.',
  alternates: { canonical: '/empresas' },
  openGraph: {
    type: 'website',
    siteName: 'Stampa',
    locale: 'es_AR',
    url: '/empresas',
    title: 'Stampa Enterprise — Fidelidad para marcas con varios locales',
    description: 'Una tarjeta para toda tu marca, en todos tus locales.',
  },
}

export default function Page() {
  return <Empresas />
}
