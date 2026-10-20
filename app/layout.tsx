// app/layout.tsx
import type { Metadata } from 'next'
import '@/app/globals.css'
import { SITE_URL } from '@/lib/site'
import { Familjen_Grotesk, Albert_Sans } from 'next/font/google'

// Letras del sistema (docs: styles/stampa-tokens.css). Se sirven desde el
// propio sitio; las pantallas usan var(--font-display) y var(--font-body).
const display = Familjen_Grotesk({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--ff-display', display: 'swap' })
const body = Albert_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--ff-body', display: 'swap' })



export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Stampa',
  description: 'Tarjetas de fidelidad en Apple y Google Wallet para tu negocio.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  )
}