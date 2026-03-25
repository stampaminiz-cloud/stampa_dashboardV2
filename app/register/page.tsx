// app/register/page.tsx
'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function RegisterPage() {
  const [checked, setChecked] = useState(false)

  return (
    <div className="stampa-bg auth-wrap">
      {/* ── Left: Form ── */}
      <div className="auth-left fade-up" style={{ alignItems: 'flex-start' }}>
        <div style={{ width: '100%', maxWidth: 430, margin: '0 auto' }}>
          <div className="auth-logo-wrap">
            <Image src="/logo/stampa-logo.png" alt="Stampa" width={160} height={48} style={{ filter: 'brightness(0) invert(1)', width: 'auto', height: 42 }} />
          </div>

          <div className="auth-form-wrap" style={{ maxWidth: '100%' }}>
            <h1 className="auth-title">Crea tu cuenta</h1>
            <p className="auth-sub">14 días gratis, sin tarjeta de crédito</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[['Nombre', 'María'], ['Apellido', 'Gómez']].map(([label, placeholder]) => (
                <div key={label} className="form-group">
                  <label className="form-label">{label}</label>
                  <div className="form-input-wrap">
                    <svg className="form-input-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <input className="form-input" placeholder={placeholder} />
                  </div>
                </div>
              ))}
            </div>

            <div className="form-group">
              <label className="form-label">Correo electrónico</label>
              <div className="form-input-wrap">
                <svg className="form-input-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <input className="form-input" placeholder="tu@email.com" type="email" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <div className="form-input-wrap">
                <svg className="form-input-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input className="form-input" placeholder="Mínimo 8 caracteres" type="password" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirmar contraseña</label>
              <div className="form-input-wrap">
                <svg className="form-input-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input className="form-input" placeholder="Repite tu contraseña" type="password" />
              </div>
            </div>

            <div className="form-group">
              <div className="checkbox-wrap" onClick={() => setChecked(!checked)}>
                <div className={`checkbox-box ${checked ? 'checked' : ''}`}>
                  {checked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L4 7L9 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span className="checkbox-label">
                  Acepto los <span className="auth-link">Términos</span> y la{' '}
                  <span className="auth-link">Política de privacidad</span>
                </span>
              </div>
            </div>

            <Link href="/dashboard">
              <button className="btn-orange">Crear cuenta →</button>
            </Link>

            <p className="auth-footer">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="auth-link">Inicia sesión</Link>
            </p>
          </div>
        </div>
      </div>

      {/* ── Right: Visual ── */}
      <div className="auth-right">
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }} className="fade-up fade-up-2">
          <Image src="/logo/stampa-logo.png" alt="Stampa" width={200} height={60} style={{ filter: 'brightness(0) invert(1)', width: 'auto', height: 50, margin: '0 auto' }} />
          <p style={{ marginTop: 26, fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, lineHeight: 1.35 }}>
            Fideliza a tus clientes<br />de forma inteligente
          </p>
          <p style={{ marginTop: 10, fontSize: 14, color: 'var(--t2)', maxWidth: 260, lineHeight: 1.6, margin: '10px auto 0' }}>
            Más de 1,200 negocios confían en Stampa para convertir compradores únicos en clientes habituales.
          </p>
          <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 240, margin: '26px auto 0' }}>
            {['Analytics en tiempo real', 'Tarjetas de sellos digitales', 'Smart Insights con IA', 'Recompensas personalizadas'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'var(--t2)' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--odim)', border: '1px solid var(--oglow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--org)', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>✓</div>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}