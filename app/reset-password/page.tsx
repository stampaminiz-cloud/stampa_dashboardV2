'use client'
import React, { useState, useEffect } from 'react'
import { apiForgotPassword } from '@/lib/api'

const CSS = `
  :root { --font-display: 'Plus Jakarta Sans', sans-serif; --font-body: 'Inter', sans-serif; }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: var(--font-body); background: #FBF6EE; color: #2B2620; }
  .fp-shell { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
  .fp-card { background: #FFFFFF; border: 1px solid rgba(43,38,32,.08); border-radius: 24px; padding: 40px; width: 100%; max-width: 380px; box-shadow: 0 8px 40px rgba(43,38,32,.1); }
  .fp-title { font-family: var(--font-display); font-weight: 700; font-size: 22px; color: #2B2620; margin-bottom: 4px; }
  .fp-sub { font-size: 13px; color: rgba(43,38,32,.5); margin-bottom: 24px; line-height: 1.5; }
  .fp-field { margin-bottom: 16px; }
  .fp-label { font-size: 11px; font-weight: 700; color: rgba(43,38,32,.5); text-transform: uppercase; letter-spacing: .06em; display: block; margin-bottom: 7px; }
  .fp-input { width: 100%; padding: 13px 14px; font-size: 14px; border: 1.5px solid rgba(43,38,32,.12); border-radius: 12px; background: #FBF6EE; color: #2B2620; font-family: var(--font-body); outline: none; }
  .fp-input:focus { border-color: #E46C31; background: #FFFFFF; }
  .fp-error { font-size: 11.5px; color: #B23B3B; background: rgba(178,59,59,.07); border: 1px solid rgba(178,59,59,.2); border-radius: 9px; padding: 10px 14px; margin-bottom: 16px; }
  .fp-success { font-size: 12.5px; color: #5B8C5A; background: rgba(91,140,90,.08); border: 1px solid rgba(91,140,90,.25); border-radius: 9px; padding: 12px 14px; margin-bottom: 16px; line-height: 1.5; }
  .fp-dev-link { font-size: 11px; color: rgba(43,38,32,.45); word-break: break-all; margin-top: 8px; display: block; }
  .fp-btn { width: 100%; background: #E46C31; color: #fff; border: none; border-radius: 12px; padding: 14px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: var(--font-display); margin-top: 4px; }
  .fp-btn:disabled { opacity: .6; cursor: not-allowed; }
  .fp-footer { text-align: center; margin-top: 20px; font-size: 12.5px; color: rgba(43,38,32,.4); }
  .fp-footer a { color: #E46C31; text-decoration: none; font-weight: 600; }
`

function injectStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById('fp-css')) return
  const s = document.createElement('style')
  s.id = 'fp-css'
  s.textContent = CSS
  document.head.appendChild(s)
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [devUrl, setDevUrl] = useState('')

  useEffect(() => { injectStyles() }, [])

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
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500&display=swap" rel="stylesheet" />
      <div className="fp-shell">
        <div className="fp-card">
          <div className="fp-title">¿Olvidaste tu contraseña?</div>
          <div className="fp-sub">Ingresá tu email y te mandamos un link para restablecerla.</div>

          {error && <div className="fp-error">{error}</div>}

          {sent ? (
            <div className="fp-success">
              Si existe una cuenta con ese email, te enviamos un link para restablecer tu contraseña. Revisá tu bandeja de entrada (y spam, por las dudas).
              {devUrl && (
                <span className="fp-dev-link">
                  [Solo en este ambiente, sin email configurado todavía] <a href={devUrl}>{devUrl}</a>
                </span>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="fp-field">
                <label className="fp-label">Email</label>
                <input className="fp-input" type="email" placeholder="tu@negocio.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
              </div>
              <button className="fp-btn" type="submit" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar link →'}
              </button>
            </form>
          )}

          <div className="fp-footer">
            <a href="/login">← Volver a iniciar sesión</a>
          </div>
        </div>
      </div>
    </>
  )
}