'use client'
import React, { useState, useEffect } from 'react'
import { apiLogin, getToken } from '@/lib/api'
import { AuthShell } from '@/components/auth/AuthShell'
import { PasswordInput } from '@/components/auth/PasswordInput'

// A dónde ir después de entrar: ?next=/ayuda/... (lo usa el centro de ayuda,
// que es solo para cuentas). Solo rutas de este sitio, nunca otro dominio.
function afterLogin() {
  const next = new URLSearchParams(window.location.search).get('next') || ''
  return next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : '/dashboard'
}

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  // Si ya hay sesión, no tiene sentido mostrar el login.
  useEffect(() => { if (getToken()) window.location.replace(afterLogin()) }, [])


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { setError('Completá todos los campos'); return }
    setLoading(true)
    setError('')
    try {
      await apiLogin(email, password)
      window.location.href = afterLogin()
    } catch (err: any) {
      setError(err.error || 'Email o contraseña incorrectos')
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <form className="au-in" onSubmit={handleSubmit}>
        <h1>Ingresar</h1>
        <p className="au-sub">Entrá al panel de tu negocio.</p>
        {error && <div className="au-box" role="alert">{error}</div>}
        <div className="au-fld">
          <label htmlFor="li-email">Email</label>
          <input id="li-email" className="au-input" type="email" placeholder="tu@negocio.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <div className="au-fld">
          <label htmlFor="li-password">Contraseña</label>
          <PasswordInput id="li-password" className="au-input" value={password} onChange={setPassword} placeholder="Tu contraseña" autoComplete="current-password" />
          <a className="au-link au-forgot" href="/forgot-password">Olvidé mi contraseña</a>
        </div>
        <button className="au-btn pino" type="submit" disabled={loading}>{loading ? 'Ingresando...' : 'Ingresar'}</button>
        <p className="au-foot">¿No tenés cuenta? <a className="au-link" href="/register">Crear una gratis</a></p>
      </form>
    </AuthShell>
  )
}
