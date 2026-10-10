'use client'
import React, { useState, useEffect } from 'react'
import { apiLogin, getToken } from '@/lib/api'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { PasswordInput } from '@/components/auth/PasswordInput'

// A dónde ir después de entrar: ?next=/ayuda/... (lo usa el centro de ayuda,
// que es solo para cuentas). Solo rutas de este sitio, nunca otro dominio.
function afterLogin() {
  const next = new URLSearchParams(window.location.search).get('next') || ''
  return next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : '/dashboard'
}

const CSS = `
  :root { --font-display: 'Plus Jakarta Sans', sans-serif; --font-body: 'Inter', sans-serif; }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: var(--font-body); background: #FBF6EE; color: #2B2620; }
  .lg-shell { min-height: 100vh; display: flex; }
  /* Left */
  .lg-left { width: 450px; flex-shrink: 0; background: #1B412F; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px 40px; gap: 22px; }
  .lg-brand { display: flex; flex-direction: column; align-items: center; gap: 14px; }
  .lg-tagline { font-family: var(--font-display); font-weight: 700; font-size: 24px; color: #F7F0E4; line-height: 1.25; text-align: center; }
  .lg-tagline em { color: #C75D3A; font-style: normal; }
  .lg-manifesto { font-size: 13px; color: rgba(247,240,228,.5); line-height: 1.6; text-align: center; max-width: 280px; }
  .lg-stats { display: flex; flex-direction: column; gap: 8px; }
  .lg-stat { display: flex; align-items: center; gap: 12px; background: rgba(247,240,228,.06); border-radius: 12px; padding: 10px 14px; }
  .lg-stat-icon { width: 30px; height: 30px; border-radius: 9px; background: rgba(199,93,58,.2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .lg-stat-label { font-size: 12.5px; color: rgba(247,240,228,.7); font-weight: 500; }
  .lg-stat-sub { font-size: 10.5px; color: rgba(247,240,228,.35); margin-top: 2px; }
  /* Right */
  .lg-right { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px; background: #FBF6EE; position: relative; overflow: hidden; }
  .lg-right::before { content: ''; position: absolute; width: 600px; height: 600px; border-radius: 50%; background: rgba(199,93,58,.06); top: -200px; right: -200px; pointer-events: none; }
  .lg-right::after { content: ''; position: absolute; width: 400px; height: 400px; border-radius: 50%; background: rgba(27,65,47,.04); bottom: -150px; left: -100px; pointer-events: none; }
  .lg-card { background: #FFFFFF; border: 1px solid rgba(43,38,32,.08); border-radius: 24px; padding: 40px; width: 100%; max-width: 380px; box-shadow: 0 8px 40px rgba(43,38,32,.1); position: relative; z-index: 1; }
  .lg-card-title { font-family: var(--font-display); font-weight: 700; font-size: 22px; color: #2B2620; margin-bottom: 4px; }
  .lg-card-sub { font-size: 13px; color: rgba(43,38,32,.45); margin-bottom: 28px; }
  .lg-field { margin-bottom: 16px; }
  .lg-label { font-size: 11px; font-weight: 700; color: rgba(43,38,32,.5); text-transform: uppercase; letter-spacing: .06em; display: block; margin-bottom: 7px; }
  .lg-input { width: 100%; padding: 13px 14px; font-size: 14px; border: 1.5px solid rgba(43,38,32,.12); border-radius: 12px; background: #FBF6EE; color: #2B2620; font-family: var(--font-body); outline: none; transition: border-color .15s; }
  .lg-input:focus { border-color: #C75D3A; background: #FFFFFF; }
  .lg-error { font-size: 11.5px; color: #B23B3B; background: rgba(178,59,59,.07); border: 1px solid rgba(178,59,59,.2); border-radius: 9px; padding: 10px 14px; margin-bottom: 16px; }
  .lg-btn { width: 100%; background: #C75D3A; color: #fff; border: none; border-radius: 12px; padding: 14px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: var(--font-display); transition: background .15s; margin-top: 4px; }
  .lg-btn:hover { background: #B14F2F; }
  .lg-btn:disabled { opacity: .6; cursor: not-allowed; }
  .lg-forgot { text-align: right; margin-top: -8px; margin-bottom: 16px; }
  .lg-forgot a { font-size: 12px; color: #C75D3A; text-decoration: none; font-weight: 600; }
  .lg-footer { text-align: center; margin-top: 20px; font-size: 12.5px; color: rgba(43,38,32,.4); }
  .lg-footer a { color: #C75D3A; text-decoration: none; font-weight: 600; }
  @media (max-width: 768px) {
    .lg-shell { flex-direction: column; }
    .lg-left { width: 100%; padding: 18px 20px; gap: 0; }
    .lg-right { padding: 20px 16px 32px; align-items: flex-start; }
    .lg-tagline, .lg-manifesto, .lg-stats { display: none; }
    .lg-card { padding: 28px; }
  }
`


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
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="lg-shell">
        <div className="lg-left">
          <div className="lg-brand">
            <BrandLogo height={48} />
            <div className="lg-tagline">La fidelidad no es<br/>un algoritmo.<br/><em>Es humana.</em></div>
          </div>
          <p className="lg-manifesto">
            Cada sello es un gesto de reconocimiento. Una forma de agradecer a quienes eligen volver.
          </p>
          <div className="lg-stats">
            {[
              { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C75D3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>, label: 'Tarjeta de sellos', sub: 'El cliente acumula sellos y canjea su premio' },
              { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C75D3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>, label: 'Puntos por visita', sub: 'Catálogo de premios canjeables con puntos' },
              { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C75D3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>, label: 'Membresía por tiers', sub: 'Bronze → Silver → Gold → Black' },
            ].map(({ icon, label, sub }) => (
              <div key={label} className="lg-stat">
                <div className="lg-stat-icon">{icon}</div>
                <div>
                  <div className="lg-stat-label">{label}</div>
                  <div className="lg-stat-sub">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg-right">
          <div className="lg-card">
            <div className="lg-card-title">Hola de nuevo</div>
            <div className="lg-card-sub">Iniciá sesión en tu dashboard</div>

            {error && <div className="lg-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="lg-field">
                <label className="lg-label">Email</label>
                <input className="lg-input" type="email" placeholder="tu@negocio.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
              </div>
              <div className="lg-field">
                <label className="lg-label">Contraseña</label>
                <PasswordInput className="lg-input" value={password} onChange={setPassword} placeholder="Tu contraseña" autoComplete="current-password" />
              </div>
              <div className="lg-forgot"><a href="/forgot-password">¿Olvidaste tu contraseña?</a></div>
              <button className="lg-btn" type="submit" disabled={loading}>
                {loading ? 'Ingresando...' : 'Ingresar al dashboard →'}
              </button>
            </form>

            <div className="lg-footer">
              ¿No tenés cuenta? <a href="/register">Registrate gratis</a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}