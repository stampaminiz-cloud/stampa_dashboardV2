// app/layout.tsx
import type { Metadata } from 'next'
import '@/app/globals.css'
import { SITE_URL } from '@/lib/site'



export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Stampa',
  description: 'Tarjetas de fidelidad en Apple y Google Wallet para tu negocio.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}