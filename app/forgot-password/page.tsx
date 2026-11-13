'use client'
import React, { useState } from 'react'
import { apiForgotPassword } from '@/lib/api'
import { AuthShell } from '@/components/auth/AuthShell'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [devUrl, setDevUrl] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) { setError('Ingresá tu email'); return }
    setLoading(true)
    setError('')
    try {
      const res = await apiForgotPassword(email)
      setSent(true)
      if (res.devResetUrl) setDevUrl(res.devResetUrl)
    } catch (err: any) {
      setError(err.error || 'Algo salió mal. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <form className="au-in" onSubmit={handleSubmit}>
        <h1>¿Olvidaste tu contraseña?</h1>
        <p className="au-sub">Ingresá tu email y te mandamos un link para restablecerla.</p>
        {error && <div className="au-box" role="alert">{error}</div>}
        {sent ? (
          <div className="au-ok" role="status">
            Si existe una cuenta con ese email, te enviamos un link para restablecer tu contraseña. Revisá tu bandeja de entrada (y spam, por las dudas).
            {devUrl && (
              <span className="au-dev">
                [Solo en este ambiente, sin email configurado todavía] <a className="au-link" href={devUrl}>{devUrl}</a>
              </span>
            )}
          </div>
        ) : (
          <>
            <div className="au-fld">
              <label htmlFor="fp-email">Email</label>
              <input id="fp-email" className="au-input" type="email" placeholder="tu@negocio.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" autoFocus />
            </div>
            <button className="au-btn pino" type="submit" disabled={loading}>{loading ? 'Enviando...' : 'Enviar link'}</button>
          </>
        )}
        <p className="au-foot"><a className="au-link" href="/login">Volver a ingresar</a></p>
      </form>
    </AuthShell>
  )
}
