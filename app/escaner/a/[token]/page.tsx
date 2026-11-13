'use client'
// Link que manda el dueño desde Equipo → Escáner web. Vincula este
// navegador a la sucursal (un solo uso, 24 h) y sigue al PIN. El token sale
// de la barra enseguida (replaceState) para que no quede en el historial.
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { EscanerApp } from '@/components/escaner/EscanerApp'
import { escaner, setDevice, setToken, setTipPending, type EscanerError } from '@/lib/escaner'

// El link es de un solo uso: que React no lo canjee dos veces (modo dev).
let claiming: Promise<unknown> | null = null

export default function VincularPage() {
  const { token } = useParams<{ token: string }>()
  const [state, setState] = useState<'linking' | 'ok' | { error: string }>('linking')
  useEffect(() => {
    window.history.replaceState(null, '', '/escaner')
    claiming ||= escaner.claimLink(String(token || ''))
    ;(claiming as ReturnType<typeof escaner.claimLink>)
      .then(r => {
        setToken(null)
        setDevice({ businessId: r.business.id, businessName: r.business.name, locationId: r.location.id, locationName: r.location.name, deviceKey: r.deviceKey })
        setTipPending(true)
        setState('ok')
      })
      .catch((e: EscanerError) => setState({ error: e.message }))
  }, [token])

  if (state === 'ok') return <EscanerApp />
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#F1F3EE', fontFamily: 'var(--font-body)', textAlign: 'center' }}>
      {state === 'linking'
        ? <p>Vinculando este celular...</p>
        : <div style={{ maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <b style={{ fontSize: 20 }}>No pudimos vincular este celular</b>
            <span style={{ color: 'rgba(34,32,27,.62)' }}>{state.error}</span>
            <a href="/escaner" style={{ color: '#1B412F', fontWeight: 700 }}>Ir al escáner</a>
          </div>}
    </div>
  )
}
