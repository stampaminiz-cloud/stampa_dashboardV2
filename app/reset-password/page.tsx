'use client'
import { Icon } from '@/components/ui/Icon'
import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { apiResetPassword } from '@/lib/api'

const CSS = `
  .fp-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;}
  a[href="/login"]{display:inline-flex;align-items:center;gap:4px;}
  
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: var(--font-body); background: var(--s-salvia); color: var(--s-tinta); }
  .fp-shell { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
  .fp-card { background: #FFFFFF; border: 1px solid rgba(34,32,27,.08); border-radius: 24px; padding: 40px; width: 100%; max-width: 380px; box-shadow: 0 8px 40px rgba(34,32,27,.1); }
  .fp-title { font-family: var(--font-display); font-weight: 700; font-size: 22px; color: var(--s-tinta); margin-bottom: 4px; }
  .fp-sub { font-size: 13px; color: rgba(34,32,27,.5); margin-bottom: 24px; line-height: 1.5; }
  .fp-field { margin-bottom: 16px; }
  .fp-label { font-size: 11px; font-weight: 700; color: rgba(34,32,27,.5); text-transform: uppercase; letter-spacing: .06em; display: block; margin-bottom: 7px; }
  .fp-input { width: 100%; padding: 13px 14px; font-size: 14px; border: 1.5px solid rgba(34,32,27,.12); border-radius: 12px; background: var(--s-salvia); color: var(--s-tinta); font-family: var(--font-body); outline: none; }
  .fp-input:focus { border-color: var(--s-brasa); background: #FFFFFF; }
  .fp-error { font-size: 11.5px; color: var(--s-error); background: rgba(178,59,59,.07); border: 1px solid rgba(178,59,59,.2); border-radius: 9px; padding: 10px 14px; margin-bottom: 16px; }
  .fp-success { font-size: 12.5px; color: var(--s-listo); background: rgba(91,140,90,.08); border: 1px solid rgba(91,140,90,.25); border-radius: 9px; padding: 12px 14px; margin-bottom: 16px; line-height: 1.5; }
  .fp-btn { width: 100%; background: var(--s-brasa); color: #fff; border: none; border-radius: 12px; padding: 14px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: var(--font-display); margin-top: 4px; }
  .fp-btn:disabled { opacity: .6; cursor: not-allowed; }
  .fp-footer { text-align: center; margin-top: 20px; font-size: 12.5px; color: rgba(34,32,27,.4); }
  .fp-footer a { color: var(--s-brasa); text-decoration: none; font-weight: 600; }
`


function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) { setError('Este link no es válido. Pedí uno nuevo desde "¿Olvidaste tu contraseña?".'); return }
    if (password.length < 8) { setError('La contraseña tiene que tener al menos 8 caracteres.'); return }
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden.'); return }

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
    <div className="fp-card">
      <div className="fp-title">Elegí tu nueva contraseña</div>
      <div className="fp-sub">Tiene que tener al menos 8 caracteres.</div>

      {error && <div className="fp-error">{error}</div>}

      {done ? (
        <div className="fp-success">
          Listo, tu contraseña se actualizó. Ya podés iniciar sesión con la nueva.
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="fp-field">
            <label className="fp-label">Nueva contraseña</label>
            <input className="fp-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
          </div>
          <div className="fp-field">
            <label className="fp-label">Confirmar contraseña</label>
            <input className="fp-input" type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" />
          </div>
          <button className="fp-btn" type="submit" disabled={loading}>
            {loading ? 'Guardando...' : <>Restablecer contraseña <Icon name="siguiente" size={16} /></>}
          </button>
        </form>
      )}

      <div className="fp-footer">
        <a href="/login"><Icon name="anterior" size={14} /> Volver a iniciar sesión</a>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="fp-shell">
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </>
  )
}