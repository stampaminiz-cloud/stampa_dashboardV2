import type { Metadata, Viewport } from 'next'

// Escáner web: privado (no se indexa) y se puede agregar a la pantalla de
// inicio como una app (manifest propio, abre en /escaner).
export const metadata: Metadata = {
  title: 'Stampa Escáner',
  description: 'Sumá sellos, puntos y visitas desde el navegador.',
  robots: { index: false, follow: false },
  manifest: '/escaner.webmanifest',
  appleWebApp: { capable: true, title: 'Escáner', statusBarStyle: 'default' },
}

export const viewport: Viewport = {
  themeColor: '#F1F3EE',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function EscanerLayout({ children }: { children: React.ReactNode }) {
  return children
}
