'use client'
// Cobro de la suscripción del dueño: Argentina con Mercado Pago (pesos) y el
// resto con Stripe (euros + IVA). Funcionan igual: se elige plan y período y
// se paga en la misma ventana; se cobra en el momento y se renueva solo.
//
// - BillingBanner: arriba del dashboard. En prueba muestra los días que
//   quedan; en pausa, que terminó y que tiene que elegir un plan.
// - PlanModal: elegir plan y período, y cargar la tarjeta con el Card
//   Payment Brick de Mercado Pago. La tarjeta NUNCA pasa por Stampa: el
//   Brick la tokeniza en los servidores de MP y al backend solo le llega el
//   token (routes/billing.js → POST /preapproval). Con Stripe, el formulario
//   incrustado de Stripe (Embedded Checkout) cobra y calcula el IVA; Stampa
//   se entera por el webhook (services/stripeBilling.js).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CardPayment, initMercadoPago } from '@mercadopago/sdk-react'
import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js'
import { apiBillingPlans, apiBillingStatus, apiStripeCheckout, apiSubscribeMercadoPago, type BillingPlan, type BillingStatus } from '@/lib/api'

const MP_PUBLIC_KEY = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || ''
let mpInitialized = false

const fmtMoney = (amount: number | null, currency: string | null) =>
  amount == null ? '—'
    : currency === 'EUR' ? new Intl.NumberFormat('es-ES', { style: 'currency', currency, minimumFractionDigits: Number.isInteger(amount) ? 0 : 2, maximumFractionDigits: 2 }).format(amount)
    : new Intl.NumberFormat('es-AR', { style: 'currency', currency: currency || 'ARS', maximumFractionDigits: 0 }).format(amount)
const tax = (p: BillingPlan | null) => (p?.taxExcluded ? ' + IVA' : '')

let stripePromise: Promise<Stripe | null> | null = null
const getStripe = (key: string) => (stripePromise ||= loadStripe(key))

const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' }) : '')

const CSS = `
  .bl-banner{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:14px 24px 0;padding:12px 16px;border-radius:12px;font-size:13px;font-family:'Inter',sans-serif;}
  .bl-banner--trial{background:rgba(199,93,58,.08);border:1px solid rgba(199,93,58,.22);color:#2B2620;}
  .bl-banner--paused{background:rgba(178,59,59,.08);border:1px solid rgba(178,59,59,.25);color:#2B2620;}
  .bl-banner-text{flex:1;min-width:200px;line-height:1.5;}
  .bl-banner-text strong{font-weight:700;}
  .bl-btn{background:#C75D3A;color:#fff;border:none;border-radius:9px;padding:9px 16px;font-size:12.5px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;white-space:nowrap;}
  .bl-btn:disabled{opacity:.5;cursor:not-allowed;}
  .bl-btn--ghost{background:none;color:#2B2620;border:1.5px solid rgba(43,38,32,.15);}
  .bl-overlay{position:fixed;inset:0;background:rgba(43,38,32,.45);display:flex;align-items:flex-start;justify-content:center;z-index:120;padding:40px 16px;overflow-y:auto;backdrop-filter:blur(2px);}
  .bl-modal{background:#FFFFFF;border-radius:18px;padding:26px;width:100%;max-width:640px;box-shadow:0 20px 60px rgba(43,38,32,.2);font-family:'Inter',sans-serif;color:#2B2620;}
  .bl-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;}
  .bl-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:19px;}
  .bl-sub{font-size:13px;color:rgba(43,38,32,.55);margin-bottom:18px;line-height:1.5;}
  .bl-close{background:none;border:none;cursor:pointer;color:rgba(43,38,32,.4);font-size:20px;line-height:1;}
  .bl-toggle{display:inline-flex;background:#FBF6EE;border:1px solid rgba(43,38,32,.1);border-radius:999px;padding:3px;margin-bottom:16px;}
  .bl-toggle button{border:none;background:none;padding:7px 14px;border-radius:999px;font-size:12.5px;font-weight:600;cursor:pointer;color:rgba(43,38,32,.55);font-family:inherit;}
  .bl-toggle button.on{background:#FFFFFF;color:#2B2620;box-shadow:0 1px 4px rgba(43,38,32,.12);}
  .bl-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;}
  .bl-plan{border:1.5px solid rgba(43,38,32,.12);border-radius:14px;padding:14px;cursor:pointer;background:#FFFFFF;text-align:left;font-family:inherit;color:inherit;}
  .bl-plan:hover{border-color:rgba(199,93,58,.5);}
  .bl-plan--on{border-color:#C75D3A;background:rgba(199,93,58,.05);}
  .bl-plan-name{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:15px;}
  .bl-plan-price{font-size:18px;font-weight:700;margin-top:6px;}
  .bl-plan-per{font-size:11px;color:rgba(43,38,32,.5);}
  .bl-plan-tag{display:inline-block;margin-top:6px;font-size:10px;font-weight:700;color:#C75D3A;text-transform:uppercase;letter-spacing:.06em;}
  .bl-error{margin-top:14px;padding:10px 14px;border-radius:10px;background:rgba(178,59,59,.08);color:#B23B3B;font-size:12.5px;font-weight:600;line-height:1.5;}
  .bl-ok{padding:16px;border-radius:12px;background:rgba(91,140,90,.12);color:#3F6B3E;font-weight:600;font-size:14px;line-height:1.5;}
  .bl-foot{margin-top:18px;display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;}
  .bl-secure{font-size:11px;color:rgba(43,38,32,.45);margin-top:10px;line-height:1.5;}
  .bl-stripe{min-height:420px;border-radius:12px;overflow:hidden;}
  @media(max-width:768px){.bl-banner{margin:12px 16px 0;}}
`

export function BillingStyles() {
  return <style dangerouslySetInnerHTML={{ __html: CSS }} />
}

export function BillingBanner({ billing, isManager, onChoosePlan }: { billing: BillingStatus | null; isManager: boolean; onChoosePlan: () => void }) {
  if (!billing || (billing.access !== 'trial' && billing.access !== 'paused')) return null

  if (billing.access === 'trial') {
    const d = billing.trialDaysLeft
    return (
      <div className="bl-banner bl-banner--trial">
        <div className="bl-banner-text">
          Estás en la <strong>prueba gratis del plan {billing.plan}</strong>: {d === 1 ? 'te queda 1 día' : `te quedan ${d} días`}.
          {!isManager && ' Elegí tu plan cuando quieras; no se cobra nada hasta que lo hagas.'}
        </div>
        {!isManager && <button className="bl-btn" onClick={onChoosePlan}>Elegir plan</button>}
      </div>
    )
  }

  return (
    <div className="bl-banner bl-banner--paused">
      <div className="bl-banner-text">
        <strong>Tu cuenta está en pausa.</strong>{' '}
        {billing.status === 'paused' || billing.status === 'cancelled'
          ? 'La suscripción no está activa.'
          : 'Terminó la prueba gratis.'}{' '}
        Podés mirar todo, pero para editar, escanear y mandar notificaciones {isManager ? 'el dueño tiene que elegir un plan.' : 'elegí un plan.'}
        {' '}Las tarjetas que tus clientes ya tienen en el Wallet siguen funcionando.
      </div>
      {!isManager && <button className="bl-btn" onClick={onChoosePlan}>Elegir plan</button>}
    </div>
  )
}

export function PlanModal({ billing, ownerEmail, onClose, onDone }: { billing: BillingStatus | null; ownerEmail: string; onClose: () => void; onDone: (b: BillingStatus) => void }) {
  const [plans, setPlans] = useState<BillingPlan[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly')
  const [selected, setSelected] = useState<BillingPlan | null>(null)
  const [step, setStep] = useState<'plans' | 'card' | 'done'>('plans')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BillingStatus | null>(null)
  const [brickReady, setBrickReady] = useState(false)
  const [provider, setProvider] = useState<'mercadopago' | 'stripe'>('mercadopago')
  const [stripeKey, setStripeKey] = useState<string | null>(null)
  const isStripe = provider === 'stripe'

  // Si el formulario de MP no avisa que cargó (clave inválida, sin conexión)
  // en 12 s, mostrar un error en vez de dejar la ventana vacía — MP no
  // siempre llama a onError cuando falla al iniciar.
  useEffect(() => {
    if (step !== 'card' || isStripe) return
    setBrickReady(false)
    const t = setTimeout(() => setBrickReady(ready => {
      if (!ready) setError('No pudimos cargar el formulario de pago de Mercado Pago. Revisá tu conexión y probá de nuevo.')
      return ready
    }), 12000)
    return () => clearTimeout(t)
  }, [step, isStripe])

  useEffect(() => {
    if (MP_PUBLIC_KEY && !mpInitialized) {
      initMercadoPago(MP_PUBLIC_KEY, { locale: 'es-AR' })
      mpInitialized = true
    }
    apiBillingPlans()
      .then(r => {
        setProvider(r.provider)
        setStripeKey(r.stripePublishableKey || null)
        setPlans(r.plans.filter(p => p.active && p.amount != null))
      })
      .catch((err: any) => setLoadError(err?.error || 'No pudimos cargar los planes.'))
  }, [])

  const periods = useMemo(() => Array.from(new Set((plans || []).map(p => p.period))), [plans])
  const visible = (plans || []).filter(p => p.period === period)
  const currentKey = billing?.access === 'active' ? `${billing.plan.toLowerCase()}:${billing.period}` : null

  async function onSubmit(formData: any) {
    if (!selected) return
    setError(null)
    try {
      const res = await apiSubscribeMercadoPago({
        plan: selected.plan,
        period: selected.period,
        cardTokenId: formData.token,
        payerEmail: formData.payer?.email || ownerEmail,
      })
      setResult(res)
      setStep('done')
      onDone(res)
    } catch (err: any) {
      setError(err?.error || 'No se pudo procesar el pago.')
      // El Brick espera un rechazo para volver a habilitar el botón.
      throw err
    }
  }

  return (
    <div className="bl-overlay" onClick={onClose}>
      <div className="bl-modal" onClick={e => e.stopPropagation()}>
        <div className="bl-head">
          <div className="bl-title">{step === 'done' ? '¡Listo!' : step === 'card' ? `Plan ${selected?.name}` : 'Elegí tu plan'}</div>
          <button className="bl-close" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        {step === 'plans' && (
          <>
            <div className="bl-sub">Se cobra con tarjeta a través de {isStripe ? 'Stripe' : 'Mercado Pago'}. {isStripe ? 'Los precios son más IVA. ' : ''}Podés cambiar de plan o cancelar cuando quieras desde Configuración.</div>
            {plans && !isStripe && !MP_PUBLIC_KEY && <div className="bl-error">El cobro todavía no está configurado (falta la clave pública de Mercado Pago).</div>}
            {plans && isStripe && !stripeKey && <div className="bl-error">El cobro todavía no está configurado (falta la clave pública de Stripe).</div>}
            {loadError && <div className="bl-error">{loadError}</div>}
            {!plans && !loadError && <div className="bl-sub">Cargando planes…</div>}
            {plans && periods.length > 1 && (
              <div className="bl-toggle">
                <button className={period === 'monthly' ? 'on' : ''} onClick={() => { setPeriod('monthly'); setSelected(null) }}>Mensual</button>
                <button className={period === 'annual' ? 'on' : ''} onClick={() => { setPeriod('annual'); setSelected(null) }}>Anual</button>
              </div>
            )}
            {plans && plans.length === 0 && (
              <div className="bl-error">No hay planes disponibles en este momento. Probá de nuevo en unos minutos o escribinos.</div>
            )}
            {plans && (
              <div className="bl-grid">
                {visible.map(p => (
                  <button key={`${p.plan}:${p.period}`} className={`bl-plan${selected === p ? ' bl-plan--on' : ''}`} onClick={() => setSelected(p)}>
                    <div className="bl-plan-name">{p.name}</div>
                    <div className="bl-plan-price">{fmtMoney(p.amount, p.currency)}</div>
                    <div className="bl-plan-per">{p.period === 'annual' ? 'por año' : 'por mes'}{tax(p)}</div>
                    {currentKey === `${p.plan}:${p.period}` && <div className="bl-plan-tag">Tu plan actual</div>}
                    {billing?.access === 'trial' && billing.plan.toLowerCase() === p.plan && <div className="bl-plan-tag">En prueba</div>}
                  </button>
                ))}
              </div>
            )}
            <div className="bl-foot">
              <button className="bl-btn bl-btn--ghost" onClick={onClose}>Ahora no</button>
              <button className="bl-btn" disabled={!selected || (isStripe ? !stripeKey : !MP_PUBLIC_KEY) || currentKey === (selected && `${selected.plan}:${selected.period}`)} onClick={() => setStep('card')}>Continuar</button>
            </div>
          </>
        )}

        {step === 'card' && selected && isStripe && stripeKey && (
          <StripePay plan={selected} stripeKey={stripeKey} switching={billing?.access === 'active'}
            onBack={() => { setStep('plans'); setError(null) }}
            onPaid={res => { setResult(res); setStep('done'); onDone(res) }} />
        )}

        {step === 'card' && selected && !isStripe && (
          <>
            <div className="bl-sub">
              {fmtMoney(selected.amount, selected.currency)} {selected.period === 'annual' ? 'por año' : 'por mes'}. Se cobra hoy y después se renueva automáticamente.
              {billing?.access === 'active' && ' Tu suscripción actual se cancela al confirmar el cambio.'}
            </div>
            <CardPayment
              // Sin email precargado: el Brick lo pide. MP exige que el email
              // sea el del que paga (en pruebas, el de la cuenta de prueba
              // compradora); precargar el de la cuenta de Stampa lo rechazaba.
              initialization={{ amount: selected.amount || 0 }}
              customization={{
                paymentMethods: { maxInstallments: 1, minInstallments: 1 },
                visual: { style: { customVariables: { baseColor: '#C75D3A' } } },
              }}
              onSubmit={onSubmit}
              onReady={() => setBrickReady(true)}
              onError={(e: any) => console.error('Card Payment Brick:', e)}
            />
            {!brickReady && !error && <div className="bl-sub">Cargando el formulario de pago…</div>}
            {error && <div className="bl-error">{error}</div>}
            <div className="bl-secure">Los datos de la tarjeta los procesa Mercado Pago de forma segura; Stampa nunca los ve ni los guarda.</div>
            <div className="bl-foot">
              <button className="bl-btn bl-btn--ghost" onClick={() => { setStep('plans'); setError(null) }}>Volver</button>
            </div>
          </>
        )}

        {step === 'done' && result && (
          <>
            <div className="bl-ok">
              Tu plan {result.plan} está activo.{result.nextPaymentDate ? ` El próximo cobro es el ${fmtDate(result.nextPaymentDate)}.` : ''}
            </div>
            <div className="bl-foot">
              <button className="bl-btn" onClick={onClose}>Seguir</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Pago con Stripe (Europa): el formulario de Stripe incrustado en la ventana.
// Stripe pide la tarjeta, la dirección y el NIF/CIF si tiene, y calcula el
// IVA. Al terminar, Stampa se entera por el webhook: acá se espera a que la
// cuenta figure activa (unos segundos) y se muestra el "¡Listo!".
function StripePay({ plan, stripeKey, switching, onBack, onPaid }: {
  plan: BillingPlan; stripeKey: string; switching: boolean; onBack: () => void; onPaid: (b: BillingStatus) => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [waiting, setWaiting] = useState(false)
  const alive = useRef(true)
  useEffect(() => () => { alive.current = false }, [])

  const fetchClientSecret = useCallback(async () => {
    try {
      const r = await apiStripeCheckout(plan.plan, plan.period)
      return r.clientSecret
    } catch (err: any) {
      setError(err?.error || 'No pudimos abrir el pago. Probá de nuevo.')
      throw err
    }
  }, [plan.plan, plan.period])

  const onComplete = useCallback(async () => {
    setWaiting(true)
    const want = plan.name.toLowerCase()
    for (let i = 0; i < 20 && alive.current; i++) {
      try {
        const b = await apiBillingStatus()
        if (b.provider === 'stripe' && b.access === 'active' && b.plan.toLowerCase() === want) { onPaid(b); return }
      } catch {}
      await new Promise(r => setTimeout(r, 1500))
    }
    if (alive.current) setError('El pago se hizo, pero todavía no vemos el plan activo. Recargá la página en un minuto; si sigue igual, escribinos.')
  }, [plan.name, onPaid])

  const options = useMemo(() => ({ fetchClientSecret, onComplete }), [fetchClientSecret, onComplete])

  return (
    <>
      <div className="bl-sub">
        {fmtMoney(plan.amount, plan.currency)}{tax(plan)} {plan.period === 'annual' ? 'por año' : 'por mes'}. Se cobra hoy y después se renueva automáticamente. El IVA se calcula según tu país.
        {switching && ' Tu suscripción actual se cancela al confirmar el cambio.'}
      </div>
      {!waiting && (
        <div className="bl-stripe">
          <EmbeddedCheckoutProvider stripe={getStripe(stripeKey)} options={options}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      )}
      {waiting && !error && <div className="bl-sub">Pago recibido. Activando tu plan…</div>}
      {error && <div className="bl-error">{error}</div>}
      <div className="bl-secure">Los datos de la tarjeta los procesa Stripe de forma segura; Stampa nunca los ve ni los guarda.</div>
      {!waiting && (
        <div className="bl-foot">
          <button className="bl-btn bl-btn--ghost" onClick={onBack}>Volver</button>
        </div>
      )}
    </>
  )
}
