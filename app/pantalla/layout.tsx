import type { Metadata, Viewport } from 'next'

// Pantalla Stampa: privada (no se indexa) y se puede agregar a la pantalla de
// inicio de la tablet como una app.
export const metadata: Metadata = {
  title: 'Pantalla Stampa',
  description: 'Acercá tu pase y sumá sin esperar.',
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: 'Pantalla', statusBarStyle: 'default' },
}

export const viewport: Viewport = {
  themeColor: '#F1F3EE',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function PantallaLayout({ children }: { children: React.ReactNode }) {
  return children
}
