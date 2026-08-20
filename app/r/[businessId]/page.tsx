'use client'
import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { apiGetPublicBusiness, apiGetPublicCardFields, apiRegisterCustomer } from '@/lib/api'

const CSS = `
  :root { --font-display: 'Plus Jakarta Sans', sans-serif; --font-body: 'Inter', sans-serif; --brand-color: #C75D3A; --brand-second: #993C1D; }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: var(--font-body); background: #FBF6EE; color: #2B2620; }
  .rg-shell { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
  .rg-card { background: #FFFFFF; border: 1px solid rgba(43,38,32,.08); border-radius: 24px; padding: 36px; width: 100%; max-width: 420px; box-shadow: 0 8px 40px rgba(43,38,32,.1); }
  .rg-logo { width: 56px; height: 56px; object-fit: contain; display: block; margin: 0 auto 14px; border-radius: 12px; }
  .rg-business-name { font-family: var(--font-display); font-weight: 700; font-size: 20px; color: #2B2620; margin-bottom: 4px; text-align: center; }
  .rg-sub { font-size: 13px; color: rgba(43,38,32,.5); margin-bottom: 24px; text-align: center; }
  .rg-field { margin-bottom: 14px; }
  .rg-label { font-size: 11px; font-weight: 700; color: rgba(43,38,32,.5); text-transform: uppercase; letter-spacing: .06em; display: block; margin-bottom: 6px; }
  .rg-input, .rg-select { width: 100%; padding: 12px 14px; font-size: 14px; border: 1.5px solid rgba(43,38,32,.12); border-radius: 12px; background: #FBF6EE; color: #2B2620; font-family: var(--font-body); outline: none; }
  .rg-input:focus, .rg-select:focus { border-color: var(--brand-color); background: #FFFFFF; }
  .rg-btn { width: 100%; background: var(--brand-color); color: #fff; border: none; border-radius: 12px; padding: 14px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: var(--font-display); margin-top: 8px; }
  .rg-btn:disabled { opacity: .6; cursor: not-allowed; }
  .rg-error { font-size: 11.5px; color: #B23B3B; background: rgba(178,59,59,.07); border: 1px solid rgba(178,59,59,.2); border-radius: 9px; padding: 10px 14px; margin-bottom: 16px; }
  .rg-card-pill-row { display: flex; flex-direction: column; gap: 10px; margin-bottom: 8px; }
  .rg-card-pill { display: flex; flex-direction: column; align-items: flex-start; gap: 3px; padding: 14px 16px; border-radius: 12px; border: 1.5px solid rgba(43,38,32,.12); background: #FBF6EE; cursor: pointer; font-family: var(--font-body); font-size: 14px; color: #2B2620; text-align: left; }
  .rg-card-pill:hover { border-color: var(--brand-color); }
  .rg-card-pill-name { font-weight: 600; }
  .rg-card-pill-desc { font-size: 12px; color: rgba(43,38,32,.5); }
  .rg-preview-card { border-radius: 18px; padding: 22px 20px; margin-bottom: 20px; display: flex; flex-direction: column; align-items: center; text-align: center; }
  .rg-preview-name { font-family: var(--font-display); font-weight: 700; font-size: 16px; margin-top: 4px; }
  .rg-preview-desc { font-size: 12.5px; opacity: .75; margin-top: 2px; }
  .rg-success { text-align: center; }
  .rg-qr-img { width: 200px; height: 200px; margin: 16px auto; display: block; border-radius: 12px; border: 1px solid rgba(43,38,32,.08); }
  .rg-success-title { font-family: var(--font-display); font-weight: 700; font-size: 18px; margin-bottom: 6px; }
  .rg-success-note { font-size: 12.5px; color: rgba(43,38,32,.55); line-height: 1.6; }
  .rg-loading, .rg-fatal { text-align: center; font-size: 13px; color: rgba(43,38,32,.5); padding: 40px 0; }
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
function applyBrandColor(color?: string) {
  if (typeof document === 'undefined' || !color) return
  document.documentElement.style.setProperty('--brand-color', color)
}

interface PublicField { _id?: string; label: string; fieldType: string; isLocked: boolean; options?: string[] }
interface PublicCard { id: string; name: string; type: string; description?: string; color?: string; secondColor?: string; textColor?: string; logoUrl?: string | null }

export default function PublicRegisterPage() {
  const params = useParams()
  const businessId = params?.businessId as string

  const [loading, setLoading] = useState(true)
  const [fatalError, setFatalError] = useState('')
  const [businessName, setBusinessName] = useState('')
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
        setCards(res.cards)
        if (res.cards.length === 1) {
          setSelectedCard(res.cards[0])
          setFields(res.fields as PublicField[])
          applyBrandColor(res.cards[0].color)
        }
      })
      .catch(err => setFatalError(err?.error || 'No pudimos encontrar este negocio.'))
      .finally(() => setLoading(false))
  }, [businessId])

  async function chooseCard(card: PublicCard) {
    setSelectedCard(card)
    applyBrandColor(card.color)
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
          ) : result ? (
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
            <>
              <div className="rg-business-name">{businessName}</div>
              <div className="rg-sub">Elegí a cuál tarjeta te querés sumar</div>
              <div className="rg-card-pill-row">
                {cards.map(c => (
                  <button key={c.id} className="rg-card-pill" onClick={() => chooseCard(c)}>
                    <span className="rg-card-pill-name">{c.name}</span>
                    <span className="rg-card-pill-desc">{c.description}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              {selectedCard.logoUrl && <img src={selectedCard.logoUrl} className="rg-logo" alt={businessName} />}
              <div
                className="rg-preview-card"
                style={{
                  background: `linear-gradient(170deg, ${selectedCard.color || '#1B412F'}, ${selectedCard.secondColor || '#132F22'})`,
                  color: selectedCard.textColor || '#FFFFFF',
                }}
              >
                <div className="rg-preview-name">{businessName}</div>
                <div className="rg-preview-desc">{selectedCard.name}</div>
              </div>
              {error && <div className="rg-error">{error}</div>}
              {fieldsLoading ? (
                <div className="rg-loading">Cargando formulario...</div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="rg-field">
                    <label className="rg-label">Nombre completo</label>
                    <input className="rg-input" value={fullName} onChange={e => setFullName(e.target.value)} autoComplete="name" />
                  </div>
                  <div className="rg-field">
                    <label className="rg-label">Email</label>
                    <input className="rg-input" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
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
                          type={f.fieldType === 'date' ? 'date' : f.fieldType === 'tel' ? 'tel' : f.fieldType === 'number' ? 'number' : 'text'}
                          value={answers[f._id as string] || ''}
                          onChange={e => setAnswers({ ...answers, [f._id as string]: e.target.value })}
                        />
                      )}
                    </div>
                  ))}
                  <button className="rg-btn" type="submit" disabled={submitting}>
                    {submitting ? 'Registrando...' : 'Registrarme →'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}