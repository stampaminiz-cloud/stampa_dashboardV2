'use client'
import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { apiRegister, getToken } from '@/lib/api'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { formatPrice, usePlanPrices, type PlanSlug } from '@/lib/pricing'

// ─── Plan data ─────────────────────────────────────────────────────────────────
// Precios: salen de Mercado Pago (lib/pricing.ts), igual que en la landing.
const PLANS: Record<string, { name: string; features: string[]; highlight: boolean }> = {
  starter: { name: 'Starter',    features: ['1 local', '1 tarjeta', 'Hasta 200 clientes'],         highlight: false },
  growth:  { name: 'Growth',     features: ['3 tarjetas', 'Clientes ilimitados', 'Branding propio'], highlight: true  },
  pro:     { name: 'Pro',        features: ['3 locales', 'Todo ilimitado', 'Soporte prioritario'],   highlight: false },
}

const CSS = `
  :root { --font-display: 'Plus Jakarta Sans', sans-serif; --font-body: 'Inter', sans-serif; }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: var(--font-body); background: #FBF6EE; color: #2B2620; }
  .rg-shell { min-height: 100vh; display: flex; }
  .rg-left { width: 450px; flex-shrink: 0; background: #1B412F; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px 40px; gap: 20px; }
  .rg-left-title { font-family: var(--font-display); font-weight: 700; font-size: 24px; color: #F7F0E4; line-height: 1.25; text-align: center; }
  .rg-left-title em { color: #C75D3A; font-style: normal; }
  .rg-steps { display: flex; flex-direction: column; gap: 10px; width: 100%; }
  .rg-step { display: flex; align-items: center; gap: 14px; padding: 10px 14px; background: rgba(247,240,228,.06); border-radius: 12px; }
  .rg-step-num { width: 28px; height: 28px; border-radius: 50%; background: #C75D3A; color: #fff; font-size: 12px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-family: var(--font-display); }
  .rg-step-title { font-size: 13px; font-weight: 600; color: #F7F0E4; display: block; }
  .rg-step-sub { font-size: 11.5px; color: rgba(247,240,228,.45); margin-top: 1px; }
  .rg-right { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px; background: #FBF6EE; position: relative; overflow: hidden; }
  .rg-right::before { content: ''; position: absolute; width: 500px; height: 500px; border-radius: 50%; background: rgba(199,93,58,.06); top: -150px; right: -150px; pointer-events: none; }
  .rg-right::after { content: ''; position: absolute; width: 350px; height: 350px; border-radius: 50%; background: rgba(27,65,47,.04); bottom: -120px; left: -80px; pointer-events: none; }
  .rg-card { background: #FFFFFF; border: 1px solid rgba(43,38,32,.08); border-radius: 24px; padding: 36px; width: 100%; max-width: 420px; box-shadow: 0 8px 40px rgba(43,38,32,.1); position: relative; z-index: 1; }
  .rg-card-title { font-family: var(--font-display); font-weight: 700; font-size: 20px; color: #2B2620; margin-bottom: 4px; }
  .rg-card-sub { font-size: 13px; color: rgba(43,38,32,.45); margin-bottom: 20px; }
  /* Plan block */
  .rg-plan { background: #FBF6EE; border: 1.5px solid rgba(43,38,32,.12); border-radius: 14px; padding: 14px 16px; margin-bottom: 20px; }
  .rg-plan--highlight { background: rgba(199,93,58,.05); border-color: rgba(199,93,58,.35); }
  .rg-plan-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .rg-plan-name { font-family: var(--font-display); font-weight: 700; font-size: 15px; color: #2B2620; }
  .rg-plan-price { font-family: var(--font-display); font-weight: 700; font-size: 18px; color: #C75D3A; }
  .rg-plan-features { display: flex; gap: 8px; flex-wrap: wrap; }
  .rg-plan-feat { font-size: 11px; color: rgba(43,38,32,.55); background: rgba(43,38,32,.06); padding: 3px 8px; border-radius: 20px; }
  .rg-plan-trial { font-size: 11px; color: rgba(43,38,32,.4); margin-top: 8px; }
  .rg-plan-change { font-size: 11px; color: #C75D3A; text-decoration: none; font-weight: 600; margin-top: 6px; display: inline-block; }
  .rg-plan-badge { font-size: 10px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; background: #C75D3A; color: #fff; padding: 3px 8px; border-radius: 20px; }
  /* Form */
  .rg-field { margin-bottom: 14px; }
  .rg-label { font-size: 11px; font-weight: 700; color: rgba(43,38,32,.5); text-transform: uppercase; letter-spacing: .06em; display: block; margin-bottom: 7px; }
  .rg-input { width: 100%; padding: 13px 14px; font-size: 14px; border: 1.5px solid rgba(43,38,32,.12); border-radius: 12px; background: #FBF6EE; color: #2B2620; font-family: var(--font-body); outline: none; transition: border-color .15s; }
  .rg-input:focus { border-color: #C75D3A; background: #FFFFFF; }
  .rg-input--error { border-color: #B23B3B; }
  .rg-error { font-size: 11px; color: #B23B3B; margin-top: 5px; line-height: 1.5; }
  .rg-error a { color: #B23B3B; font-weight: 700; }
  .rg-divider { height: 1px; background: rgba(43,38,32,.08); margin: 8px 0 16px; }
  .rg-terms { display: flex; align-items: flex-start; gap: 10px; cursor: pointer; margin-bottom: 16px; }
  .rg-checkbox { width: 18px; height: 18px; border-radius: 5px; border: 1.5px solid rgba(43,38,32,.2); flex-shrink: 0; display: flex; align-items: center; justify-content: center; margin-top: 1px; transition: all .15s; }
  .rg-checkbox--on { background: #C75D3A; border-color: #C75D3A; }
  .rg-terms-text { font-size: 12px; color: rgba(43,38,32,.6); line-height: 1.5; }
  .rg-terms-text a { color: #C75D3A; text-decoration: none; font-weight: 600; }
  .rg-btn { width: 100%; background: #C75D3A; color: #fff; border: none; border-radius: 12px; padding: 14px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: var(--font-display); transition: background .15s; }
  .rg-btn:hover { background: #B14F2F; }
  .rg-btn:disabled { opacity: .6; cursor: not-allowed; }
  .rg-footer { text-align: center; margin-top: 16px; font-size: 12.5px; color: rgba(43,38,32,.4); }
  .rg-footer a { color: #C75D3A; text-decoration: none; font-weight: 600; }
  @media (max-width: 768px) {
    .rg-shell { flex-direction: column; }
    .rg-left { width: 100%; padding: 18px 20px; gap: 0; }
    .rg-left-title, .rg-steps { display: none; }
    .rg-left-title { font-size: 22px; }
    .rg-steps { display: none; }
    .rg-right { padding: 20px; }
    .rg-card { padding: 24px; }
  }
`


// ─── Inner component (needs useSearchParams) ───────────────────────────────────
function RegisterForm() {
  const searchParams = useSearchParams()
  const planSlug = searchParams.get('plan') || 'growth'
  const selectedPlan = PLANS[planSlug] || PLANS.growth
  const prices = usePlanPrices()
  const planPrices = prices[(PLANS[planSlug] ? planSlug : 'growth') as PlanSlug]
  const monthlyPrice = formatPrice(planPrices.monthly, planPrices.currency)

  // region: por ahora solo Argentina (el cobro en España está pausado);
  // el selector de país vuelve cuando esté Stripe.
  const [form, setForm] = useState({ fullName: '', email: '', password: '', terms: false, region: 'AR' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [emailTaken, setEmailTaken] = useState(false)

  // Si ya hay sesión, no tiene sentido crear otra cuenta.
  useEffect(() => { if (getToken()) window.location.replace('/dashboard') }, [])


  function set(field: string, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }))
    if (field === 'email') setEmailTaken(false)
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.fullName.trim()) e.fullName = 'Ingresá tu nombre'
    if (!form.email.trim()) e.email = 'Ingresá tu email'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email inválido'
    if (!form.password) e.password = 'Elegí una contraseña'
    else if (form.password.length < 8) e.password = 'Mínimo 8 caracteres'
    if (!form.terms) e.terms = 'Tenés que aceptar los términos'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setLoading(true)
    setEmailTaken(false)
    try {
      await apiRegister({
        email: form.email.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        termsAccepted: 'true',
        region: form.region,
        plan: planSlug,
      })
      window.location.href = '/onboarding'
    } catch (err: any) {
      if (err.code === 'email_taken') setEmailTaken(true)
      else setErrors({ form: err.error || 'No pudimos crear tu cuenta. Probá de nuevo.' })
      setLoading(false)
    }
  }

  return (
    <div className="rg-right">
      <div className="rg-card">
        <div className="rg-card-title">Crear cuenta</div>
        <div className="rg-card-sub">14 días gratis, sin tarjeta de crédito.</div>

        {/* Plan block */}
        <div className={`rg-plan${selectedPlan.highlight ? ' rg-plan--highlight' : ''}`}>
          <div className="rg-plan-top">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="rg-plan-name">Plan {selectedPlan.name}</span>
              {selectedPlan.highlight && <span className="rg-plan-badge">Más elegido</span>}
            </div>
            <span className="rg-plan-price">{monthlyPrice}/mes</span>
          </div>
          <div className="rg-plan-features">
            {selectedPlan.features.map(f => (
              <span key={f} className="rg-plan-feat">{f}</span>
            ))}
          </div>
          <div className="rg-plan-trial">Los primeros 14 días son gratis. Después {monthlyPrice}/mes.</div>
          <a href="/#precios" className="rg-plan-change">Cambiar plan →</a>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="rg-field">
            <label className="rg-label">Nombre completo</label>
            <input className={`rg-input${errors.fullName ? ' rg-input--error' : ''}`} type="text" autoComplete="name" placeholder="Tu nombre y apellido" value={form.fullName} onChange={e => set('fullName', e.target.value)} autoFocus />
            {errors.fullName && <div className="rg-error">{errors.fullName}</div>}
          </div>
          <div className="rg-field">
            <label className="rg-label">Email</label>
            <input className={`rg-input${errors.email ? ' rg-input--error' : ''}`} type="email" autoComplete="email" inputMode="email" autoCapitalize="none" placeholder="tu@negocio.com" value={form.email} onChange={e => set('email', e.target.value)} />
            {errors.email && <div className="rg-error">{errors.email}</div>}
            {emailTaken && (
              <div className="rg-error">
                Ya hay una cuenta con ese email. <a href="/login">Iniciá sesión</a> o <a href="/forgot-password">recuperá tu contraseña</a>.
              </div>
            )}
          </div>
          <div className="rg-divider" />
          <div className="rg-field">
            <label className="rg-label" htmlFor="rg-password">Contraseña</label>
            <PasswordInput id="rg-password" className={`rg-input${errors.password ? ' rg-input--error' : ''}`} value={form.password} onChange={v => set('password', v)} placeholder="Mínimo 8 caracteres" autoComplete="new-password" />
            {errors.password && <div className="rg-error">{errors.password}</div>}
          </div>
          <div className="rg-terms" onClick={() => set('terms', !form.terms)}>
            <div className={`rg-checkbox${form.terms ? ' rg-checkbox--on' : ''}`}>
              {form.terms && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
            </div>
            <span className="rg-terms-text">
              Acepto los <a href="/terms" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>Términos y condiciones</a> y la <a href="/privacy" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>Política de privacidad</a>
            </span>
          </div>
          {errors.terms && <div className="rg-error" style={{ marginBottom: 12 }}>{errors.terms}</div>}
          {errors.form && <div className="rg-error" style={{ marginBottom: 12 }}>{errors.form}</div>}
          <button className="rg-btn" type="submit" disabled={loading}>
            {loading ? 'Creando tu cuenta...' : `Empezar 14 días gratis →`}
          </button>
        </form>

        <div className="rg-footer">
          ¿Ya tenés cuenta? <a href="/login">Iniciá sesión</a>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="rg-shell">
        <div className="rg-left">
          <BrandLogo height={48} />
          <div className="rg-left-title">La fidelidad no es<br/>un algoritmo.<br/><em>Es humana.</em></div>
          <div className="rg-steps">
            {[
              { n: 1, title: 'Creá tu cuenta', sub: 'Solo te lleva 30 segundos' },
              { n: 2, title: 'Configurá tu programa', sub: 'Sellos, puntos o membresía' },
              { n: 3, title: 'Compartí el link', sub: 'Tus clientes se registran al instante' },
            ].map(({ n, title, sub }) => (
              <div key={n} className="rg-step">
                <div className="rg-step-num">{n}</div>
                <div>
                  <span className="rg-step-title">{title}</span>
                  <div className="rg-step-sub">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <Suspense fallback={<div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando...</div>}>
          <RegisterForm />
        </Suspense>
      </div>
    </>
  )
}