'use client'
// Aceptar invitación de manager: llega desde el email que se manda al
// crearlo en Equipo (link /invite?token=...). Elige su contraseña y entra
// directo al dashboard de ese negocio.
import { useEffect, useState } from 'react'
import { apiAcceptInvite, apiGetInvite } from '@/lib/api'

type Invite = { fullName: string; email: string; businessName: string }

const CSS = `
  .iv-root { min-height: 100vh; background: #FBF6EE; display: flex; align-items: center; justify-content: center; padding: 24px 16px; font-family: 'Inter', sans-serif; color: #2B2620; }
  .iv-card { background: #FFFFFF; border: 1px solid rgba(43,38,32,.08); border-radius: 24px; padding: 36px 32px; width: 100%; max-width: 400px; box-shadow: 0 8px 40px rgba(43,38,32,.1); }
  .iv-logo { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 20px; color: #C75D3A; margin-bottom: 22px; }
  .iv-title { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 24px; line-height: 1.2; margin: 0 0 8px; }
  .iv-sub { font-size: 14px; color: rgba(43,38,32,.6); line-height: 1.55; margin: 0 0 22px; }
  .iv-label { display: block; font-size: 11px; font-weight: 700; color: rgba(43,38,32,.5); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 6px; }
  .iv-input { width: 100%; padding: 12px 14px; font-size: 14px; border: 1.5px solid rgba(43,38,32,.12); border-radius: 12px; background: #FBF6EE; color: #2B2620; font-family: inherit; outline: none; margin-bottom: 14px; }
  .iv-input:focus { border-color: #C75D3A; background: #FFFFFF; }
  .iv-input[readonly] { color: rgba(43,38,32,.55); }
  .iv-btn { width: 100%; background: #C75D3A; color: #FFFFFF; border: none; border-radius: 12px; padding: 14px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; margin-top: 4px; }
  .iv-btn:disabled { opacity: .5; cursor: not-allowed; }
  .iv-error { font-size: 12.5px; color: #B23B3B; background: rgba(178,59,59,.07); border: 1px solid rgba(178,59,59,.2); border-radius: 10px; padding: 10px 14px; margin-bottom: 16px; line-height: 1.5; }
  .iv-muted { font-size: 13px; color: rgba(43,38,32,.55); text-align: center; }
`

export default function InvitePage() {
  const [token, setToken] = useState('')
  const [invite, setInvite] = useState<Invite | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('token') || ''
    setToken(t)
    if (!t) { setLoadError('Este link de invitación está incompleto. Abrilo de nuevo desde el email.'); return }
    apiGetInvite(t)
      .then(setInvite)
      .catch((err: any) => setLoadError(err?.error || 'No pudimos cargar la invitación.'))
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.')
    if (password !== confirm) return setError('Las contraseñas no coinciden.')
    setSaving(true)
    setError(null)
    try {
      await apiAcceptInvite(token, password)
      // El dashboard toma el negocio del manager desde /api/auth/me.
      localStorage.removeItem('stampa_business_id')
      localStorage.removeItem('stampa_active_tab')
      window.location.href = '/dashboard'
    } catch (err: any) {
      setError(err?.error || 'No se pudo aceptar la invitación.')
      setSaving(false)
    }
  }

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <main className="iv-root">
        <div className="iv-card">
          <div className="iv-logo">stampa</div>
          {loadError ? (
            <>
              <h1 className="iv-title">No pudimos abrir la invitación</h1>
              <div className="iv-error">{loadError}</div>
              <p className="iv-muted"><a href="/login" style={{ color: '#C75D3A', fontWeight: 700 }}>Ir a iniciar sesión</a></p>
            </>
          ) : !invite ? (
            <p className="iv-muted">Cargando invitación…</p>
          ) : (
            <form onSubmit={submit}>
              <h1 className="iv-title">Hola, {invite.fullName.split(' ')[0]}</h1>
              <p className="iv-sub">
                Te sumaron al equipo de <strong>{invite.businessName}</strong> en Stampa. Elegí una contraseña para entrar al dashboard.
              </p>
              {error && <div className="iv-error">{error}</div>}
              <label className="iv-label" htmlFor="iv-email">Email</label>
              <input id="iv-email" className="iv-input" value={invite.email} readOnly />
              <label className="iv-label" htmlFor="iv-pass">Contraseña</label>
              <input id="iv-pass" className="iv-input" type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" />
              <label className="iv-label" htmlFor="iv-pass2">Repetir contraseña</label>
              <input id="iv-pass2" className="iv-input" type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} />
              <button className="iv-btn" type="submit" disabled={saving || !password || !confirm}>
                {saving ? 'Guardando…' : 'Entrar al dashboard'}
              </button>
            </form>
          )}
        </div>
      </main>
    </>
  )
}
