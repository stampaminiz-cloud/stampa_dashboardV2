// app/layout.tsx
import type { Metadata } from 'next'
import '@/app/globals.css'


export const metadata: Metadata = {
  title: 'Stampa Dashboard',
  description: 'Loyalty platform dashboard for Stampa',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}