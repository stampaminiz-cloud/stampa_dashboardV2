'use client'
// Link que manda el dueño desde Configuración → Pantallas del local. Vincula
// este navegador como pantalla del local (un solo uso, 24 h) y abre la
// pantalla. El token sale de la barra enseguida para que no quede en el
// historial.
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { PantallaApp } from '@/components/pantalla/PantallaApp'
import { pantalla, setScreen, type ScreenError } from '@/lib/pantalla'

// El link es de un solo uso: que React no lo canjee dos veces (modo dev).
let claiming: Promise<unknown> | null = null

export default function VincularPantallaPage() {
  const { token } = useParams<{ token: string }>()
  const [state, setState] = useState<'linking' | 'ok' | { error: string }>('linking')
  useEffect(() => {
    window.history.replaceState(null, '', '/pantalla')
    claiming ||= pantalla.claim(String(token || ''))
    ;(claiming as ReturnType<typeof pantalla.claim>)
      .then(r => { setScreen({ key: r.deviceKey, businessName: r.business.name }); setState('ok') })
      .catch((e: ScreenError) => setState({ error: e.message }))
  }, [token])

  if (state === 'ok') return <PantallaApp />
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--s-salvia, #F1F3EE)', color: 'var(--s-tinta, #22201b)', fontFamily: 'var(--font-body)', textAlign: 'center' }}>
      {state === 'linking'
        ? <p>Vinculando esta pantalla...</p>
        : <div style={{ maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <b style={{ fontSize: 22 }}>No pudimos vincular esta pantalla</b>
            <span style={{ opacity: .65 }}>{state.error}</span>
          </div>}
    </div>
  )
}
