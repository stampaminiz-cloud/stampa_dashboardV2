'use client'
import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { apiRegister, getToken } from '@/lib/api'
import { AuthShell } from '@/components/auth/AuthShell'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { formatPrice, taxSuffix, usePlanPrices, type PlanSlug } from '@/lib/pricing'
import { marketFromCountry, regionFromCountry, type Region } from '@/lib/market'

// ─── Plan data ─────────────────────────────────────────────────────────────────
// Precios: salen de Mercado Pago (lib/pricing.ts), igual que en la landing.
const PLANS: Record<string, { name: string }> = {
  starter: { name: 'Starter' },
  growth:  { name: 'Growth' },
  pro:     { name: 'Pro' },
}

// ─── Inner component (needs useSearchParams) ───────────────────────────────────
function RegisterForm() {
  const searchParams = useSearchParams()
  const planSlug = searchParams.get('plan') || 'growth'
  const selectedPlan = PLANS[planSlug] || PLANS.growth
  // País según la IP (app/api/geo): Argentina paga en pesos con Mercado
  // Pago; el resto, en euros + IVA con Stripe. Si la IP se equivoca, el país
  // de la cuenta se corrige desde /admin.
  const [region, setRegion] = useState<Region>('AR')
  useEffect(() => {
    fetch('/api/geo').then(r => (r.ok ? r.json() : null)).then(d => { if (d?.country) setRegion(regionFromCountry(d.country)) }).catch(() => {})
  }, [])
  const prices = usePlanPrices(marketFromCountry(region === 'AR' ? 'AR' : region))
  const planPrices = prices[(PLANS[planSlug] ? planSlug : 'growth') as PlanSlug]
  const monthlyPrice = formatPrice(planPrices.monthly, planPrices.currency)

  const [form, setForm] = useState({ fullName: '', email: '', password: '', terms: false })
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
        region,
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
    <form className="au-in" onSubmit={handleSubmit} noValidate>
      <h1>Crear cuenta</h1>
      <p className="au-sub">14 días gratis, sin tarjeta de crédito.</p>
      <div className="au-plan">
        <span><b>Plan {selectedPlan.name}</b> · {monthlyPrice} / mes{taxSuffix(planPrices)}</span>
        <a className="au-link" href="/#precios">Cambiar</a>
      </div>
      <div className="au-fld">
        <label htmlFor="rg-name">Nombre completo</label>
        <input id="rg-name" className={`au-input${errors.fullName ? ' bad' : ''}`} type="text" autoComplete="name" placeholder="Tu nombre y apellido" value={form.fullName} onChange={e => set('fullName', e.target.value)} autoFocus />
        {errors.fullName && <div className="au-err">{errors.fullName}</div>}
      </div>
      <div className="au-fld">
        <label htmlFor="rg-email">Email</label>
        <input id="rg-email" className={`au-input${errors.email ? ' bad' : ''}`} type="email" autoComplete="email" inputMode="email" autoCapitalize="none" placeholder="tu@negocio.com" value={form.email} onChange={e => set('email', e.target.value)} />
        {errors.email && <div className="au-err">{errors.email}</div>}
        {emailTaken && (
          <div className="au-err">
            Ya hay una cuenta con ese email. <a href="/login">Iniciá sesión</a> o <a href="/forgot-password">recuperá tu contraseña</a>.
          </div>
        )}
      </div>
      <div className="au-fld">
        <label htmlFor="rg-password">Contraseña</label>
        <PasswordInput id="rg-password" className={`au-input${errors.password ? ' bad' : ''}`} value={form.password} onChange={v => set('password', v)} placeholder="Mínimo 8 caracteres" autoComplete="new-password" />
        {errors.password && <div className="au-err">{errors.password}</div>}
      </div>
      <label className="au-chk" htmlFor="rg-terms">
        <input id="rg-terms" type="checkbox" checked={form.terms} onChange={e => set('terms', e.target.checked)} />
        <span>Acepto los <a className="au-link" href="/terms" target="_blank" rel="noopener noreferrer">Términos y condiciones</a> y la <a className="au-link" href="/privacy" target="_blank" rel="noopener noreferrer">Política de privacidad</a></span>
      </label>
      {errors.terms && <div className="au-err" style={{ marginTop: -8 }}>{errors.terms}</div>}
      {errors.form && <div className="au-box" role="alert">{errors.form}</div>}
      <button className="au-btn brasa" type="submit" disabled={loading}>{loading ? 'Creando tu cuenta...' : 'Empezar 14 días gratis'}</button>
      <p className="au-note">Los primeros 14 días son gratis. Después {monthlyPrice} / mes.</p>
      <p className="au-foot">¿Ya tenés cuenta? <a className="au-link" href="/login">Ingresar</a></p>
    </form>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  return (
    <AuthShell>
      <Suspense fallback={<div className="au-in">Cargando...</div>}>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  )
}
