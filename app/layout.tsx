// app/layout.tsx
import type { Metadata } from 'next'
// Estilos globales en este orden: variables de marca, sistema visual y base.
// Van importados acá y no encadenados con @import dentro de globals.css: el
// 20/10/2026 un build de Vercel con caché vieja sirvió globals.css sin
// sistema.css y todo el panel quedó sin colores ni botones.
import '@/styles/stampa-tokens.css'
import '@/styles/sistema.css'
import '@/app/globals.css'
import { SITE_URL } from '@/lib/site'
import { Red_Hat_Display, Red_Hat_Text } from 'next/font/google'

// Letras del sistema (docs: styles/stampa-tokens.css). Se sirven desde el
// propio sitio; las pantallas usan var(--font-display) y var(--font-body).
const display = Red_Hat_Display({ subsets: ['latin'], weight: ['500', '600', '700', '800'], variable: '--ff-display', display: 'swap' })
const body = Red_Hat_Text({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--ff-body', display: 'swap' })



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