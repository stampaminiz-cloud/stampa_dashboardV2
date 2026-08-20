'use client'
import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { apiGetPublicBusiness, apiGetPublicCardFields, apiRegisterCustomer } from '@/lib/api'

const CSS = `
  :root { --font-display: 'Plus Jakarta Sans', sans-serif; --font-body: 'Inter', sans-serif; --brand-color: #C75D3A; --brand-second: #993C1D; --brand-text: #FFFFFF; }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: var(--font-body); background: #FBF6EE; color: #2B2620; }
  .rg-shell { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .rg-card { background: #FFFFFF; border: 1px solid rgba(43,38,32,.08); border-radius: 22px; width: 100%; max-width: 380px; box-shadow: 0 8px 40px rgba(43,38,32,.12); overflow: hidden; }
  .rg-body { padding: 28px 26px; }

  /* Header con degradé — ícono + nombre + subtítulo */
  .rg-header { padding: 30px 26px 26px; text-align: center; background: linear-gradient(165deg, var(--brand-color), var(--brand-second)); color: var(--brand-text); }
  .rg-header-icon { width: 52px; height: 52px; border-radius: 14px; background: rgba(255,255,255,.18); display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; font-family: var(--font-display); font-weight: 800; font-size: 20px; }
  .rg-header-icon img { width: 100%; height: 100%; object-fit: contain; border-radius: 14px; }
  .rg-header-name { font-family: var(--font-display); font-weight: 700; font-size: 19px; margin-bottom: 4px; }
  .rg-header-sub { font-size: 12.5px; opacity: .8; line-height: 1.4; }
  .rg-header-badge { display: inline-block; font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; background: rgba(255,255,255,.16); padding: 4px 10px; border-radius: 20px; margin-top: 10px; }

  .rg-field { margin-bottom: 14px; }
  .rg-label { font-size: 11px; font-weight: 700; color: rgba(43,38,32,.5); text-transform: uppercase; letter-spacing: .06em; display: block; margin-bottom: 6px; }
  .rg-input, .rg-select { width: 100%; padding: 12px 14px; font-size: 14px; border: 1.5px solid rgba(43,38,32,.12); border-radius: 12px; background: #FBF6EE; color: #2B2620; font-family: var(--font-body); outline: none; }
  .rg-input:focus, .rg-select:focus { border-color: var(--brand-color); background: #FFFFFF; }
  .rg-btn { width: 100%; background: var(--brand-color); color: #fff; border: none; border-radius: 12px; padding: 14px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: var(--font-display); margin-top: 6px; box-shadow: 0 4px 14px rgba(0,0,0,.12); }
  .rg-btn:disabled { opacity: .6; cursor: not-allowed; box-shadow: none; }
  .rg-error { font-size: 11.5px; color: #B23B3B; background: rgba(178,59,59,.07); border: 1px solid rgba(178,59,59,.2); border-radius: 9px; padding: 10px 14px; margin-bottom: 16px; }

  .rg-card-pill-row { display: flex; flex-direction: column; gap: 8px; }
  .rg-card-pill { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; padding: 13px 15px; border-radius: 12px; border: 1.5px solid rgba(43,38,32,.12); background: #FBF6EE; cursor: pointer; font-family: var(--font-body); font-size: 14px; color: #2B2620; text-align: left; }
  .rg-card-pill:hover { border-color: var(--brand-color); }
  .rg-card-pill-name { font-weight: 600; }
  .rg-card-pill-desc { font-size: 12px; color: rgba(43,38,32,.5); }

  .rg-success { text-align: center; }
  .rg-qr-img { width: 180px; height: 180px; margin: 16px auto; display: block; border-radius: 12px; border: 1px solid rgba(43,38,32,.08); }
  .rg-success-title { font-family: var(--font-display); font-weight: 700; font-size: 17px; margin-bottom: 6px; }
  .rg-success-note { font-size: 12px; color: rgba(43,38,32,.55); line-height: 1.6; }
  .rg-footer-badge { text-align: center; font-size: 10.5px; color: rgba(43,38,32,.3); padding: 14px 0 4px; font-weight: 600; letter-spacing: .02em; }

  .rg-loading, .rg-fatal { text-align: center; font-size: 13px; color: rgba(43,38,32,.5); padding: 60px 26px; }
`

function injectStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById('rg-public-css')) return
  const s = document.createElement('style')
  s.id = 'rg-public-css'
  s.textContent = CSS
  document.head.appendChild(s)
}

// Una vez que se conoce la tarjeta elegida, el color de marca de esa tarjeta
// pasa a ser el acento de toda la página (botón, foco de inputs, hover de
// los pills) — antes de elegir tarjeta (selector con 2+) queda el color
// neutro de Stampa, porque todavía no hay "una" tarjeta para representar.
function applyBrandColor(card?: { color?: string; secondColor?: string; textColor?: string }) {
  if (typeof document === 'undefined' || !card) return
  if (card.color) document.documentElement.style.setProperty('--brand-color', card.color)
  if (card.secondColor) document.documentElement.style.setProperty('--brand-second', card.secondColor)
  document.documentElement.style.setProperty('--brand-text', card.textColor || '#FFFFFF')
}

interface PublicField { _id?: string; label: string; fieldType: string; isLocked: boolean; options?: string[]; placeholder?: string }
interface PublicCard { id: string; name: string; type: string; description?: string; color?: string; secondColor?: string; textColor?: string; logoUrl?: string | null }

export default function PublicRegisterPage() {
  const params = useParams()
  const businessId = params?.businessId as string

  const [loading, setLoading] = useState(true)
  const [fatalError, setFatalError] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [whiteLabel, setWhiteLabel] = useState(false)
  const [cards, setCards] = useState<PublicCard[]>([])
  const [selectedCard, setSelectedCard] = useState<PublicCard | null>(null)
  const [fields, setFields] = useState<PublicField[]>([])
  const [fieldsLoading, setFieldsLoading] = useState(false)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ qrValue: string; cardName: string } | null>(null)

  useEffect(() => { injectStyles() }, [])

  useEffect(() => {
    if (!businessId) return
    apiGetPublicBusiness(businessId)
      .then(res => {
        setBusinessName(res.business.name)
        setWhiteLabel(!!res.whiteLabel)
        setCards(res.cards)
        if (res.cards.length === 1) {
          setSelectedCard(res.cards[0])
          setFields(res.fields as PublicField[])
          applyBrandColor(res.cards[0])
        }
      })
      .catch(err => setFatalError(err?.error || 'No pudimos encontrar este negocio.'))
      .finally(() => setLoading(false))
  }, [businessId])

  async function chooseCard(card: PublicCard) {
    setSelectedCard(card)
    applyBrandColor(card)
    setFieldsLoading(true)
    try {
      const res = await apiGetPublicCardFields(businessId, card.id)
      setFields(res.fields as PublicField[])
    } catch {
      setFields([])
    } finally {
      setFieldsLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim() || !email.trim()) { setError('Completá tu nombre y email.'); return }
    setSubmitting(true)
    setError('')
    try {
      const formResponses = fields
        .filter(f => !f.isLocked && f._id)
        .map(f => ({ fieldId: f._id as string, value: answers[f._id as string] || '' }))
      const res = await apiRegisterCustomer(businessId, {
        cardId: selectedCard?.id,
        fullName: fullName.trim(),
        email: email.trim(),
        formResponses,
      })
      setResult({ qrValue: res.qrValue, cardName: res.card.name })
    } catch (err: any) {
      setError(err?.error || 'No pudimos completar el registro. Intentá de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  const initial = businessName.trim().charAt(0).toUpperCase() || '?'

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500&display=swap" rel="stylesheet" />
      <div className="rg-shell">
        <div className="rg-card">
          {loading ? (
            <div className="rg-loading">Cargando...</div>
          ) : fatalError ? (
            <div className="rg-fatal">{fatalError}</div>
          ) : (
            <>
              <div className="rg-header">
                <div className="rg-header-icon">
                  {selectedCard?.logoUrl ? <img src={selectedCard.logoUrl} alt={businessName} /> : initial}
                </div>
                <div className="rg-header-name">{businessName}</div>
                <div className="rg-header-sub">
                  {result
                    ? '¡Tu tarjeta está lista!'
                    : !selectedCard
                    ? 'Elegí a cuál tarjeta te querés sumar'
                    : 'Completá tus datos para obtener tu tarjeta'}
                </div>
                {selectedCard && <div className="rg-header-badge">{selectedCard.name}</div>}
              </div>

              <div className="rg-body">
                {result ? (
                  <div className="rg-success">
                    <div className="rg-success-title">¡Listo, {fullName.split(' ')[0]}!</div>
                    <div className="rg-success-note">Ya estás registrado en {businessName} — {result.cardName}.<br />Mostrá este código en el mostrador para sumar tu primer sello.</div>
                    <img
                      className="rg-qr-img"
                      alt="Tu código de cliente"
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(result.qrValue)}`}
                    />
                    <div className="rg-success-note">Sacale una captura de pantalla — pronto vas a poder agregar esta tarjeta directo a tu Apple Wallet o Google Wallet.</div>
                  </div>
                ) : !selectedCard ? (
                  <div className="rg-card-pill-row">
                    {cards.map(c => (
                      <button key={c.id} className="rg-card-pill" onClick={() => chooseCard(c)}>
                        <span className="rg-card-pill-name">{c.name}</span>
                        <span className="rg-card-pill-desc">{c.description}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    {error && <div className="rg-error">{error}</div>}
                    {fieldsLoading ? (
                      <div className="rg-loading">Cargando formulario...</div>
                    ) : (
                      <form onSubmit={handleSubmit}>
                        <div className="rg-field">
                          <label className="rg-label">Nombre completo</label>
                          <input className="rg-input" placeholder="Tu nombre y apellido" value={fullName} onChange={e => setFullName(e.target.value)} autoComplete="name" />
                        </div>
                        <div className="rg-field">
                          <label className="rg-label">Email</label>
                          <input className="rg-input" type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
                        </div>
                        {fields.filter(f => !f.isLocked).map(f => (
                          <div className="rg-field" key={f._id}>
                            <label className="rg-label">{f.label}</label>
                            {f.fieldType === 'select' ? (
                              <select className="rg-select" value={answers[f._id as string] || ''} onChange={e => setAnswers({ ...answers, [f._id as string]: e.target.value })}>
                                <option value="">Elegir...</option>
                                {(f.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                            ) : (
                              <input
                                className="rg-input"
                                placeholder={f.placeholder || undefined}
                                type={f.fieldType === 'date' ? 'date' : f.fieldType === 'tel' ? 'tel' : f.fieldType === 'number' ? 'number' : 'text'}
                                value={answers[f._id as string] || ''}
                                onChange={e => setAnswers({ ...answers, [f._id as string]: e.target.value })}
                              />
                            )}
                          </div>
                        ))}
                        <button className="rg-btn" type="submit" disabled={submitting}>
                          {submitting ? 'Registrando...' : 'Obtener mi tarjeta →'}
                        </button>
                      </form>
                    )}
                  </>
                )}
              </div>
              {!whiteLabel && <div className="rg-footer-badge">Powered by Stampa</div>}
            </>
          )}
        </div>
      </div>
    </>
  )
}