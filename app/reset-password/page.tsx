'use client'
import React, { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { apiResetPassword } from '@/lib/api'
import { AuthShell } from '@/components/auth/AuthShell'
import { PasswordInput } from '@/components/auth/PasswordInput'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) { setError('Este link no es válido. Pedí uno nuevo desde "¿Olvidaste tu contraseña?".'); return }
    if (password.length < 8) { setError('La contraseña tiene que tener al menos 8 caracteres.'); return }

    setLoading(true)
    setError('')
    try {
      await apiResetPassword(token, password)
      setDone(true)
    } catch (err: any) {
      setError(err.error || 'El link es inválido o ya expiró. Pedí uno nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="au-in" onSubmit={handleSubmit}>
      <h1>Elegí tu nueva contraseña</h1>
      <p className="au-sub">Tiene que tener al menos 8 caracteres.</p>
      {error && <div className="au-box" role="alert">{error}</div>}
      {done ? (
        <>
          <div className="au-ok" role="status">Listo, tu contraseña se actualizó. Ya podés ingresar con la nueva.</div>
          <a className="au-btn pino" href="/login" style={{ textDecoration: 'none' }}>Ingresar</a>
        </>
      ) : (
        <>
          <div className="au-fld">
            <label htmlFor="rp-password">Nueva contraseña</label>
            <PasswordInput id="rp-password" className="au-input" value={password} onChange={setPassword} placeholder="Mínimo 8 caracteres" autoComplete="new-password" />
          </div>
          <button className="au-btn pino" type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Restablecer contraseña'}</button>
          <p className="au-foot"><a className="au-link" href="/login">Volver a ingresar</a></p>
        </>
      )}
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  )
}
