'use client'

// Si una página se rompe del todo: lo manda a Sentry y muestra un aviso
// simple con la opción de reintentar, en vez de la pantalla en blanco.
import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { Sentry.captureException(error) }, [error])
  return (
    <html lang="es">
      <body style={{ margin: 0, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBF6EE', color: '#2B2620', fontFamily: 'Inter, system-ui, sans-serif', padding: 16, textAlign: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, margin: '0 0 8px' }}>Algo salió mal</h1>
          <p style={{ margin: '0 0 18px', color: 'rgba(43,38,32,.65)' }}>Ya nos llegó el aviso. Probá de nuevo en un momento.</p>
          <button onClick={() => reset()} style={{ background: '#C75D3A', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Reintentar</button>
        </div>
      </body>
    </html>
  )
}
