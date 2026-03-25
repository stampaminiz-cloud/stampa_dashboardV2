// app/login/page.tsx
'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function LoginPage() {
  const [showPass, setShowPass] = useState(false)

  return (
    <div className="stampa-bg auth-wrap">
      {/* ── Left: Form ── */}
      <div className="auth-left fade-up">
        <div className="auth-logo-wrap">
          <Image src="/monster.png" alt="Monster" width={160} height={48} style={{ filter: 'brightness(0) invert(1)', width: 'auto', height: 44 }} />
        </div>

        <div className="auth-form-wrap">
          <h1 className="auth-title">Bienvenido de vuelta</h1>
          <p className="auth-sub">Inicia sesión en tu dashboard de fidelización</p>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Correo electrónico</label>
            <div className="form-input-wrap">
              <svg className="form-input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <input className="form-input" placeholder="tu@email.com" type="email" autoComplete="email" />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <div className="form-input-wrap">
              <svg className="form-input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <input className="form-input" placeholder="••••••••" type={showPass ? 'text' : 'password'} autoComplete="current-password" />
              <button className="form-input-eye" type="button" onClick={() => setShowPass(!showPass)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                {showPass
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22"/></svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
            <p className="auth-forgot">¿Olvidaste tu contraseña?</p>
          </div>

          <Link href="/dashboard">
            <button className="btn-orange">Iniciar sesión →</button>
          </Link>

          <div className="auth-divider">o continuar con</div>

          <button className="btn-social">
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continuar con Google
          </button>
          <button className="btn-social">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
            Continuar con Apple
          </button>

          <p className="auth-footer">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="auth-link">Regístrate gratis</Link>
          </p>
        </div>
      </div>

      {/* ── Right: Visual ── */}
      <div className="auth-right">
        <div style={{ position: 'relative', zIndex: 1 }} className="fade-up fade-up-2">
          <div className="auth-stat-card">
            <p className="auth-stat-label">Clientes Activos</p>
            <p className="auth-stat-value">3,102</p>
            <div className="auth-badge">↑ +8.1% este mes</div>
            <div className="auth-bar-wrap">
              {[['Free Coffee', 82], ['Free Pastry', 57], ['10% Desc.', 42]].map(([l, w]) => (
                <div key={l} className="auth-bar-row">
                  <span style={{ width: 76, flexShrink: 0 }}>{l}</span>
                  <div className="auth-bar-track"><div className="auth-bar-fill" style={{ width: `${w}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="auth-insight-pill">✦ La conversión del programa subió 12% este mes</div>
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Image src="/monster.png" alt="Monster" width={100} height={30} style={{ filter: 'brightness(0) invert(1)', opacity: 0.22, height: 'auto' }} />
          </div>
        </div>
      </div>
    </div>
  )
}