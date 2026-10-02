'use client'
import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { apiConfirmEmail } from '@/lib/api'

// Link que llega al email nuevo cuando el dueño lo cambia en Configuración.
const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; background: #FBF6EE; color: #2B2620; }
  .ce-shell { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
  .ce-card { background: #fff; border: 1px solid rgba(43,38,32,.08); border-radius: 24px; padding: 36px; width: 100%; max-width: 400px; box-shadow: 0 8px 40px rgba(43,38,32,.1); text-align: center; }
  .ce-title { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 21px; margin-bottom: 8px; }
  .ce-sub { font-size: 13.5px; color: rgba(43,38,32,.6); line-height: 1.55; margin-bottom: 22px; }
  .ce-btn { display: inline-block; background: #C75D3A; color: #fff; border-radius: 12px; padding: 13px 22px; font-size: 14px; font-weight: 700; text-decoration: none; font-family: 'Plus Jakarta Sans', sans-serif; }
`

function Confirm() {
  const token = useSearchParams().get('token') || ''
  const [state, setState] = useState<{ status: 'loading' | 'ok' | 'error'; text: string }>({ status: 'loading', text: '' })
  useEffect(() => {
    if (!token) { setState({ status: 'error', text: 'Este link no es válido.' }); return }
    apiConfirmEmail(token)
      .then(r => setState({ status: 'ok', text: `Desde ahora entrás a Stampa con ${r.email}.` }))
      .catch((err: any) => setState({ status: 'error', text: err?.error || 'No pudimos confirmar el email.' }))
  }, [token])
  return (
    <div className="ce-card">
      <div className="ce-title">{state.status === 'loading' ? 'Confirmando…' : state.status === 'ok' ? '¡Listo, email actualizado!' : 'No se pudo confirmar'}</div>
      <div className="ce-sub">{state.text}</div>
      {state.status !== 'loading' && <a className="ce-btn" href={state.status === 'ok' ? '/login' : '/dashboard'}>{state.status === 'ok' ? 'Ir a iniciar sesión' : 'Volver a Stampa'}</a>}
    </div>
  )
}

export default function ConfirmEmailPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="ce-shell"><Suspense fallback={null}><Confirm /></Suspense></div>
    </>
  )
}
