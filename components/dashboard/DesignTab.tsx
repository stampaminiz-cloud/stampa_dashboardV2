'use client'
import React, { useState, useRef, useEffect } from 'react'
import { usePlan, PlanGate, PLAN_GATE_CSS } from '@/data/plans'
import { useLang } from '@/data/i18n'
import { apiUpdateCard, apiUpdateField } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────
type CardType = "stamp" | "points" | "membership"
interface CardDesign {
  id: string
  name: string
  type: 'stamp' | 'points' | 'membership'
  isActive: boolean
  color: string
  secondColor: string
  stampsRequired: number
  rewardMode: string | null
  rewardField: string | null
  logoUrl?: string | null
  earnedIcon?: string | null
  emptyIcon?: string | null
}

interface FormField {
  id: string
  label: string
  type: string
  isLocked: boolean
  isActive: boolean
  isRewardSource: boolean
  order: number
}

interface MembershipTier {
  id: string
  name: string
  threshold: number
  perk: string
  color: string
  bg: string
}

interface LogoState {
  businessLogo: string | null
  earnedIcon: string | null
  emptyIcon: string | null
}

interface DesignData {
  cardDesigns: CardDesign[]
  formFields: FormField[]
  business: { plan: string; planActiveCards: number; planMaxCards: number }
}

// ─── Constants ────────────────────────────────────────────────────────────────
const COLOR_PRESETS = [
  { label: 'Bosque',     start: '#1E3329', end: '#16271F' },
  { label: 'Océano',     start: '#185FA5', end: '#0C447C' },
  { label: 'Terracota',  start: '#993C1D', end: '#712B13' },
  { label: 'Violeta',    start: '#533FB7', end: '#3C3489' },
  { label: 'Carbón',     start: '#2C2C2A', end: '#141414' },
]

const DEFAULT_TIERS: MembershipTier[] = [
  { id: '1', name: 'Bronze', threshold: 0,  perk: 'Bienvenido',           color: '#854F0B', bg: '#FAEEDA' },
  { id: '2', name: 'Silver', threshold: 10, perk: '5% de descuento',      color: '#444441', bg: '#EAEAEA' },
  { id: '3', name: 'Gold',   threshold: 25, perk: 'Regalo de cumpleaños',  color: '#633806', bg: '#FAC775' },
  { id: '4', name: 'Black',  threshold: 50, perk: 'Beneficios exclusivos',        color: '#F7F0E4', bg: '#1A1A18' },
]

function darkenHex(hex: string, factor = 0.72): string {
  const c = hex.replace('#', '')
  if (c.length !== 6) return hex
  const r = Math.round(parseInt(c.slice(0,2), 16) * factor)
  const g = Math.round(parseInt(c.slice(2,4), 16) * factor)
  const b = Math.round(parseInt(c.slice(4,6), 16) * factor)
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`
}

function planAllowsCustomColor(plan: string) {
  return ['Growth', 'Pro', 'Enterprise'].includes(plan)
}

// ─── QR Code placeholder ──────────────────────────────────────────────────────
function QRCode({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 21 21" fill="none">
      <rect x="0" y="0" width="7" height="7" fill="#000"/><rect x="1" y="1" width="5" height="5" fill="#fff"/><rect x="2" y="2" width="3" height="3" fill="#000"/>
      <rect x="14" y="0" width="7" height="7" fill="#000"/><rect x="15" y="1" width="5" height="5" fill="#fff"/><rect x="16" y="2" width="3" height="3" fill="#000"/>
      <rect x="0" y="14" width="7" height="7" fill="#000"/><rect x="1" y="15" width="5" height="5" fill="#fff"/><rect x="2" y="16" width="3" height="3" fill="#000"/>
      <rect x="9" y="0" width="1" height="1" fill="#000"/><rect x="11" y="1" width="2" height="1" fill="#000"/>
      <rect x="8" y="8" width="2" height="4" fill="#000"/><rect x="11" y="8" width="3" height="1" fill="#000"/>
      <rect x="9" y="13" width="3" height="1" fill="#000"/><rect x="9" y="15" width="1" height="3" fill="#000"/>
      <rect x="11" y="15" width="2" height="2" fill="#000"/><rect x="15" y="15" width="4" height="1" fill="#000"/>
      <rect x="14" y="17" width="3" height="1" fill="#000"/><rect x="18" y="16" width="2" height="2" fill="#000"/>
    </svg>
  )
}

// ─── Logo Upload ──────────────────────────────────────────────────────────────
function LogoUpload({ label, hint, value, onChange }: {
  label: string; hint: string; value: string | null; onChange: (url: string | null) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => onChange(ev.target?.result as string)
    reader.readAsDataURL(file)
  }
  return (
    <div className="dt-logo-upload">
      <div className="dt-logo-label">{label}</div>
      <div className={`dt-logo-zone${value ? ' dt-logo-zone--filled' : ''}`} onClick={() => ref.current?.click()}>
        {value
          ? <img src={value} className="dt-logo-preview" alt={label} />
          : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><span>{hint}</span></>
        }
        <input ref={ref} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
      </div>
      {value && <button className="dt-logo-remove" onClick={() => onChange(null)}>Quitar</button>}
    </div>
  )
}

// ─── Color Picker ─────────────────────────────────────────────────────────────
function ColorPicker({ color, plan, onChange }: { color: string; plan: string; onChange: (s: string, e: string) => void }) {
  const [hex, setHex] = useState(color)
  const allowsCustom = planAllowsCustomColor(plan)
  function applyHex(val: string) {
    setHex(val)
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) onChange(val, darkenHex(val))
  }
  return (
    <div>
      <div className="dt-color-row">
        {COLOR_PRESETS.map(({ label, start, end }) => (
          <button key={label} className={`dt-color-dot${color === start ? ' dt-color-dot--on' : ''}`}
            style={{ background: start }} title={label}
            onClick={() => { setHex(start); onChange(start, end) }} />
        ))}
      </div>
      {allowsCustom ? (
        <div className="dt-custom-color-row">
          <label className="dt-custom-swatch" style={{ background: hex }}>
            <input type="color" value={hex.length === 7 ? hex : '#1E3329'} onChange={e => applyHex(e.target.value)} className="dt-color-native" />
          </label>
          <input type="text" className="dt-hex-input" value={hex} onChange={e => applyHex(e.target.value)} placeholder="#1E3329" maxLength={7} />
          <span className="dt-hex-label">Personalizado</span>
        </div>
      ) : (
        <div className="dt-upgrade-color-note">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Color personalizado · Plan Growth o superior
        </div>
      )}
    </div>
  )
}

// ─── Pass preview (Apple Wallet) ──────────────────────────────────────────────
function RealPassPreview({ design, logos, rewardSourceLabel, tiers, previewTierIndex }: {
  design: CardDesign; logos: LogoState; rewardSourceLabel: string; tiers: MembershipTier[]; previewTierIndex: number
}) {
  const stamps = Array.from({ length: design.stampsRequired }, (_: unknown, i: number) => i < 3)
  const activeTier = tiers[previewTierIndex] || tiers[0]

  const TIER_GRADIENTS = [
    { start: '#C4894A', end: '#9A6030' }, // Bronze
    { start: '#6B6B68', end: '#4A4A47' }, // Silver
    { start: '#C4902A', end: '#9A6E10' }, // Gold
    { start: '#1A1A18', end: '#0A0A09' }, // Black
  ]
  const bgGrad = design.type === 'membership'
    ? `linear-gradient(170deg, ${TIER_GRADIENTS[previewTierIndex]?.start || design.color}, ${TIER_GRADIENTS[previewTierIndex]?.end || design.secondColor})`
    : `linear-gradient(170deg, ${design.color}, ${design.secondColor})`

  return (
    <div className="dt-real-pass" style={{ background: bgGrad }}>
      <div className="dt-real-pass-top">
        {logos.businessLogo
          ? <img src={logos.businessLogo} className="dt-real-pass-logo-img" alt="logo" />
          : <div className="dt-real-pass-logo-text">{design.name.toUpperCase()}</div>
        }
      </div>

      {design.type === 'stamp' && (
        <div className="dt-real-pass-grid">
          {stamps.map((filled: boolean, i: number) => (
            <div key={i} className="dt-real-pass-cell">
              {filled
                ? logos.earnedIcon ? <img src={logos.earnedIcon} className="dt-real-pass-icon-img" alt="" /> : <div className="dt-real-pass-icon-default dt-real-pass-icon-filled" />
                : logos.emptyIcon  ? <img src={logos.emptyIcon}  className="dt-real-pass-icon-img dt-real-pass-icon-img--empty" alt="" /> : <div className="dt-real-pass-icon-default dt-real-pass-icon-empty" />
              }
            </div>
          ))}
        </div>
      )}

      {design.type === 'membership' && (
        <div className="dt-real-pass-single-tier">
          <div className="dt-real-pass-single-tier-badge" style={{ background: activeTier.bg, color: activeTier.color }}>
            ★ {activeTier.name}
          </div>
          <div className="dt-real-pass-tier-perk">{activeTier.perk}</div>
        </div>
      )}

      {design.type === 'points' && (
        <div className="dt-real-pass-points-area">
          <div className="dt-real-pass-points-num">120 pts</div>
          <div className="dt-real-pass-points-bar"><div className="dt-real-pass-points-fill" style={{ width: '24%' }} /></div>
          <div className="dt-real-pass-points-sub">480 pts para el próximo premio</div>
        </div>
      )}

      <div className="dt-real-pass-info">
        <div className="dt-real-pass-info-field">
          <div className="dt-real-pass-info-label">TITULAR</div>
          <div className="dt-real-pass-info-val">Matias N. Marini</div>
        </div>
        <div className="dt-real-pass-info-field">
          <div className="dt-real-pass-info-label">
            {design.type === 'stamp' ? 'PREMIO' : design.type === 'membership' ? 'NIVEL' : 'PUNTOS'}
          </div>
          <div className="dt-real-pass-info-val">
            {design.type === 'stamp' ? (design.rewardMode === 'dynamic' ? rewardSourceLabel : 'Café gratis')
            : design.type === 'membership' ? activeTier.name
            : '120 pts'}
          </div>
        </div>
      </div>
      <div className="dt-real-pass-qr-section">
        <QRCode size={90} />
        <div className="dt-real-pass-powered">Powered by Stampa</div>
      </div>
    </div>
  )
}

// ─── Google Wallet preview ────────────────────────────────────────────────────
function GooglePreview({ design, logos, rewardSourceLabel, tiers, previewTierIndex }: {
  design: CardDesign; logos: LogoState; rewardSourceLabel: string; tiers: MembershipTier[]; previewTierIndex: number
}) {
  const stamps = Array.from({ length: design.stampsRequired }, (_: unknown, i: number) => i < 3)
  const activeTier = tiers[previewTierIndex] || tiers[0]

  const GTIER_GRADIENTS = [
    { start: '#C4894A', end: '#9A6030' },
    { start: '#6B6B68', end: '#4A4A47' },
    { start: '#C4902A', end: '#9A6E10' },
    { start: '#1A1A18', end: '#0A0A09' },
  ]
  const gBgGrad = design.type === 'membership'
    ? `linear-gradient(135deg, ${GTIER_GRADIENTS[previewTierIndex]?.start || design.color}, ${GTIER_GRADIENTS[previewTierIndex]?.end || design.secondColor})`
    : `linear-gradient(135deg, ${design.color}, ${design.secondColor})`

  return (
    <div className="dt-gpass">
      <div className="dt-gpass-hero" style={{ background: gBgGrad }}>
        <div className="dt-gpass-logo-row">
          {logos.businessLogo ? <img src={logos.businessLogo} className="dt-gpass-logo-img" alt="" /> : <div className="dt-gpass-logo-box" />}
          <span className="dt-gpass-issuer">{design.name}</span>
        </div>
        <div className="dt-gpass-hero-title">
          {design.type === 'stamp' ? `3 de ${design.stampsRequired} sellos`
          : design.type === 'points' ? '120 pts'
          : activeTier?.name || 'Bronze'}
        </div>
      </div>
      <div className="dt-gpass-body">
        {design.type === 'stamp' && (
          <div className="dt-gpass-stamps">
            {stamps.map((filled: boolean, i: number) => (
              <div key={i} className={`dt-gpass-stamp ${filled ? 'dt-gpass-stamp--filled' : 'dt-gpass-stamp--empty'}`}>
                {filled && logos.earnedIcon && <img src={logos.earnedIcon} className="dt-gpass-stamp-img" alt="" />}
              </div>
            ))}
          </div>
        )}
        <div className="dt-gpass-divider" />
        <div className="dt-gpass-info-row"><span className="dt-gpass-field-label">Titular</span><span className="dt-gpass-info-val">Matias Marini</span></div>
        <div className="dt-gpass-info-row">
          <span className="dt-gpass-field-label">{design.type === 'stamp' ? 'Premio' : design.type === 'membership' ? 'Nivel' : 'Puntos'}</span>
          <span className="dt-gpass-info-val">{design.type === 'stamp' ? (design.rewardMode === 'dynamic' ? rewardSourceLabel : 'Café gratis') : design.type === 'membership' ? activeTier?.name : '120'}</span>
        </div>
      </div>
      <div className="dt-gpass-qr-wrap"><QRCode size={60} /><div className="dt-gpass-qr-label">Powered by Stampa</div></div>
    </div>
  )
}

// ─── Mini pass thumbnail ──────────────────────────────────────────────────────
function MiniPass({ design, logos }: { design: CardDesign; logos: LogoState }) {
  const stamps = Array.from({ length: Math.min(design.stampsRequired, 8) }, (_: unknown, i: number) => i < 3)
  return (
    <div className="dt-mini-pass" style={{ background: `linear-gradient(170deg, ${design.color}, ${design.secondColor})` }}>
      <div className="dt-mini-pass-top">
        {logos.businessLogo
          ? <img src={logos.businessLogo} className="dt-mini-logo-img" alt="" />
          : <div className="dt-mini-logo-text">{design.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0,4)}</div>
        }
        <span className="dt-mini-type">{design.type === 'stamp' ? 'Sellos' : design.type === 'points' ? 'Puntos' : 'Membresía'}</span>
      </div>
      {design.type === 'stamp' && (
        <div className="dt-mini-stamps">
          {stamps.map((filled: boolean, i: number) => (
            <div key={i} className={`dt-mini-stamp${filled ? ' dt-mini-stamp--filled' : ''}`}>
              {filled && logos.earnedIcon && <img src={logos.earnedIcon} className="dt-mini-stamp-img" alt="" />}
            </div>
          ))}
        </div>
      )}
      {design.type === 'membership' && (
        <div className="dt-mini-tier-row">
          <div className="dt-mini-tier-chip">Bronze</div>
          <div className="dt-mini-tier-chip dt-mini-tier-chip--active">Silver</div>
          <div className="dt-mini-tier-chip">Gold</div>
        </div>
      )}
      {design.type === 'points' && <div className="dt-mini-points">120 pts</div>}
      <div className="dt-mini-qr-hint" />
    </div>
  )
}

// ─── Draggable fields ─────────────────────────────────────────────────────────
function DraggableFields({ fields, onReorder, onToggle }: {
  fields: FormField[]; onReorder: (f: FormField[]) => void; onToggle: (id: string) => void
}) {
  const dragIndex = useRef<number | null>(null)
  function handleDragStart(i: number) { dragIndex.current = i }
  function handleDragEnter(i: number) {
    if (dragIndex.current === null || dragIndex.current === i) return
    const arr = [...fields]
    const dragged = arr.splice(dragIndex.current, 1)[0]
    arr.splice(i, 0, dragged)
    dragIndex.current = i
    onReorder(arr)
  }
  function handleDragEnd() { dragIndex.current = null }
  return (
    <div className="dt-fields-list">
      {fields.map((f: FormField, i: number) => (
        <div key={f.id} className={`dt-field-row${!f.isActive ? ' dt-field-row--inactive' : ''}`}
          draggable={!f.isLocked}
          onDragStart={() => !f.isLocked && handleDragStart(i)}
          onDragEnter={() => !f.isLocked && handleDragEnter(i)}
          onDragEnd={handleDragEnd}
          onDragOver={e => e.preventDefault()}>
          <div className={`dt-grip-wrap${f.isLocked ? ' dt-grip-wrap--locked' : ''}`}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <circle cx="9" cy="5" r="1.5" fill="currentColor"/><circle cx="9" cy="12" r="1.5" fill="currentColor"/><circle cx="9" cy="19" r="1.5" fill="currentColor"/>
              <circle cx="15" cy="5" r="1.5" fill="currentColor"/><circle cx="15" cy="12" r="1.5" fill="currentColor"/><circle cx="15" cy="19" r="1.5" fill="currentColor"/>
            </svg>
          </div>
          <span className="dt-field-label-text">{f.label}</span>
          <div className="dt-field-actions">
            {f.isLocked
              ? <span className="dt-locked-badge">Requerido</span>
              : <button className="dt-toggle-field" onClick={() => onToggle(f.id)} title={f.isActive ? 'Ocultar' : 'Mostrar'}>
                  {f.isActive
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  }
                </button>
            }
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Card Editor ──────────────────────────────────────────────────────────────
function CardEditor({ card: init, formFields, plan, businessId, onSaved, onBack }: {
  card: CardDesign; formFields: FormField[]; plan: string; businessId?: string | null; onSaved?: () => void; onBack: () => void
}) {
  const { can } = usePlan()
  const t = useLang()
  const [card, setCard] = useState<CardDesign>(init)
  const [fields, setFields] = useState<FormField[]>([...formFields].sort((a, b) => a.order - b.order))
  const [tiers] = useState<MembershipTier[]>(DEFAULT_TIERS)
  const [logos, setLogos] = useState<LogoState>({
    businessLogo: init.logoUrl || null,
    earnedIcon: init.earnedIcon || null,
    emptyIcon: init.emptyIcon || null,
  })
  const [platform, setPlatform] = useState<'real' | 'google'>('real')
  const [previewTierIndex, setPreviewTierIndex] = useState(0)
  const [mobileView, setMobileView] = useState<'config' | 'preview'>('config')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [pointsPerVisit, setPointsPerVisit] = useState(10)
  // Flip card state
  const [previewSide, setPreviewSide]       = useState<'front' | 'prize'>('front')
  const [flipMessage, setFlipMessage]       = useState('¡Lo lograste!')
  const [flipSubMessage, setFlipSubMessage] = useState('Presentá esta tarjeta para canjear tu premio')
  const [isFlipping, setIsFlipping]         = useState(false)
  const [prizeImage, setPrizeImage]           = useState<string | null>(null)
  const prizeImageRef                         = useRef<HTMLInputElement>(null)

  function switchSide(side: 'front' | 'prize') {
    if (side === previewSide) return
    setIsFlipping(true)
    setTimeout(() => { setPreviewSide(side); setIsFlipping(false) }, 300)
  }

  const rewardSource = fields.find((f: FormField) => f.isRewardSource)
  const rewardSourceLabel = rewardSource?.label || 'Sin configurar'

  function setLogo(key: keyof LogoState) { return (url: string | null) => setLogos({ ...logos, [key]: url }) }
  function setRewardSource(id: string) { setFields(fields.map((f: FormField) => ({ ...f, isRewardSource: f.id === id }))) }
  function toggleField(id: string) { setFields(fields.map((f: FormField) => f.id === id && !f.isLocked ? { ...f, isActive: !f.isActive } : f)) }
  async function handleSave() {
    if (!businessId) {
      setSaveError('No se encontró el negocio — recargá la página e intentá de nuevo.')
      return
    }
    setSaving(true)
    setSaveError('')
    try {
      await apiUpdateCard(businessId, card.id, {
        name: card.name,
        color: card.color,
        secondColor: card.secondColor,
        isActive: card.isActive,
        stampsRequired: card.stampsRequired,
        rewardMode: (card.rewardMode as any) || undefined,
        rewardFixedValue: card.rewardField || undefined,
        flipMessage,
        flipSubMessage,
        logoUrl: logos.businessLogo || undefined,
        earnedIcon: logos.earnedIcon || undefined,
        emptyIcon: logos.emptyIcon || undefined,
      })

      // Los campos del formulario (activo/inactivo, cuál es el reward source)
      // se guardan aparte, uno por uno — mismo patrón que ya usa el FormTab.
      await Promise.all(
        fields.map((f: FormField) =>
          apiUpdateField(businessId, card.id, f.id, { isActive: f.isActive, isRewardSource: f.isRewardSource })
        )
      )

      setSaved(true)
      onSaved?.()
      setTimeout(() => setSaved(false), 2000)
    } catch (err: any) {
      console.error('Error saving card:', err)
      setSaveError(err?.error || 'No se pudo guardar. Intentá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  // Prize card (back face) — matches reference photo
  const PrizeCard = (
    <div className="dt-prize-pass" style={{ background: `linear-gradient(170deg, ${card.color}, ${card.secondColor})` }}>
      {/* Top message */}
      <div className="dt-prize-top-msg">{flipMessage}</div>

      {/* Center image — large */}
      <div className="dt-prize-img-area">
        {prizeImage
          ? <img src={prizeImage} className="dt-prize-img" alt="premio" />
          : <div className="dt-prize-img-placeholder">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <span className="dt-prize-img-hint">Subí una imagen de premio</span>
            </div>
        }
      </div>

      {/* Bottom message */}
      <div className="dt-prize-bottom-msg">{flipSubMessage}</div>
    </div>
  )

  const PreviewPanel = (
    <div className="dt-preview-panel">
      <div className="dt-preview-inner">
        {/* Front/Prize toggle — only for stamp */}
        {card.type === 'stamp' && (
          <div className="dt-face-switch">
            <button className={`dt-face-btn${previewSide === 'front' ? ' dt-face-btn--on' : ''}`} onClick={() => switchSide('front')}>Cara principal</button>
            <button className={`dt-face-btn${previewSide === 'prize' ? ' dt-face-btn--on' : ''}`} onClick={() => switchSide('prize')}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill={previewSide === 'prize' ? '#C75D3A' : 'rgba(43,38,32,.4)'} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              Cara del premio
            </button>
          </div>
        )}
        <div className="dt-platform-switch">
          <button className={`dt-platform-btn${platform === 'real' ? ' dt-platform-btn--on' : ''}`} onClick={() => setPlatform('real')}>Apple Wallet</button>
          <button className={`dt-platform-btn${platform === 'google' ? ' dt-platform-btn--on' : ''}`} onClick={() => setPlatform('google')}>Google Wallet</button>
        </div>

        {card.type === 'membership' && (
          <div className="dt-tier-preview-selector">
            <span className="dt-tier-preview-label">Previsualizar como:</span>
            {tiers.map((t: MembershipTier, i: number) => (
              <button key={t.id}
                className={`dt-tier-preview-btn${previewTierIndex === i ? ' dt-tier-preview-btn--on' : ''}`}
                style={previewTierIndex === i ? { background: t.bg, color: t.color, borderColor: t.bg } : {}}
                onClick={() => setPreviewTierIndex(i)}>{t.name}</button>
            ))}
          </div>
        )}

        <div className={`dt-pass-flip-wrap${isFlipping ? ' dt-pass-flip-wrap--flipping' : ''}`}>
          {card.type === 'stamp' && previewSide === 'prize'
            ? PrizeCard
            : platform === 'real'
              ? <RealPassPreview design={card} logos={logos} rewardSourceLabel={rewardSourceLabel} tiers={tiers} previewTierIndex={previewTierIndex} />
              : <GooglePreview  design={card} logos={logos} rewardSourceLabel={rewardSourceLabel} tiers={tiers} previewTierIndex={previewTierIndex} />
          }
        </div>
        <div className="dt-preview-note">
          {card.type === 'stamp' && previewSide === 'prize'
            ? t('dt_preview' as any)
            : platform === 'real' ? t('dt_apple_note' as any) : t('dt_google_note' as any)}
        </div>
      </div>
    </div>
  )

  return (
    <>
      <div className="dt-editor-header">
        <button className="dt-back-btn" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Mis tarjetas
        </button>
        <div className="dt-editor-title">{card.name}</div>

        {/* Mobile tab toggle */}
        <div className="dt-mobile-tabs">
          <button className={`dt-mobile-tab${mobileView === 'config' ? ' dt-mobile-tab--on' : ''}`} onClick={() => setMobileView('config')}>Configurar</button>
          <button className={`dt-mobile-tab${mobileView === 'preview' ? ' dt-mobile-tab--on' : ''}`} onClick={() => setMobileView('preview')}>Preview</button>
        </div>

        <button className="dt-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : saved ? t('saved' as any) : t('save' as any)}
        </button>
      </div>
      {saveError && <div className="dt-save-error">{saveError}</div>}

      <div className="dt-editor-body">
        {/* ── Left panel (config) ── */}
        <div className={`dt-editor-panel${mobileView === 'preview' ? ' dt-panel--mobile-hidden' : ''}`}>

          {/* Logos */}
          <div className="dt-panel-section-title">Logos e íconos</div>
          <div className="dt-logo-row">
            <LogoUpload label="Logo del negocio" hint="Subir logo" value={logos.businessLogo} onChange={setLogo('businessLogo')} />
            {card.type === 'stamp' && <>
              <LogoUpload label="Sello ganado" hint="Ícono lleno" value={logos.earnedIcon} onChange={setLogo('earnedIcon')} />
              <LogoUpload label="Sello vacío" hint="Ícono vacío" value={logos.emptyIcon} onChange={setLogo('emptyIcon')} />
            </>}
          </div>

          {/* Form fields */}
          <div className="dt-panel-section-title" style={{ marginTop: 20 }}>Campos del formulario</div>
          <div style={{ fontSize: 10, color: 'rgba(43,38,32,.4)', marginBottom: 8 }}>Arrastrá para reordenar · ojo para mostrar/ocultar</div>
          <DraggableFields fields={fields} onReorder={setFields} onToggle={toggleField} />

          {/* STAMP: prize mode */}
          {card.type === 'stamp' && (
            <>
              <div className="dt-panel-section-title" style={{ marginTop: 20 }}>¿Cómo se define el premio?</div>
              <div className="dt-reward-mode-box">
                <div className={`dt-reward-opt${card.rewardMode === 'dynamic' ? ' dt-reward-opt--on' : ''}`} onClick={() => setCard({ ...card, rewardMode: 'dynamic' })}>
                  <div className="dt-reward-radio">{card.rewardMode === 'dynamic' && <div className="dt-reward-radio-dot" />}</div>
                  <div><div className="dt-reward-opt-title">Lo elige el cliente</div><div className="dt-reward-opt-desc">Su respuesta en el formulario se convierte en el premio</div></div>
                </div>
                {card.rewardMode === 'dynamic' && (
                  <div className="dt-field-picker">
                    <div className="dt-field-picker-label">Campo a usar como premio</div>
                    {fields.filter((f: FormField) => !f.isLocked && f.isActive).map((f: FormField) => (
                      <div key={f.id} className={`dt-field-row${f.isRewardSource ? ' dt-field-row--selected' : ''}`} onClick={() => setRewardSource(f.id)} style={{ cursor: 'pointer' }}>
                        <span className="dt-field-label-text">{f.label}</span>
                        <div className={`dt-radio-dot-outer${f.isRewardSource ? ' dt-radio-dot-outer--on' : ''}`}>
                          {f.isRewardSource && <div className="dt-radio-dot-inner" />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className={`dt-reward-opt${card.rewardMode === 'fixed' ? ' dt-reward-opt--on' : ''}`} onClick={() => setCard({ ...card, rewardMode: 'fixed' })}>
                  <div className="dt-reward-radio">{card.rewardMode === 'fixed' && <div className="dt-reward-radio-dot" />}</div>
                  <div><div className="dt-reward-opt-title">Yo lo defino</div><div className="dt-reward-opt-desc">El mismo premio para todos los clientes</div></div>
                </div>
                {card.rewardMode === 'fixed' && (
                  <input className="dt-prize-input" placeholder="Ej: Café gratis" defaultValue="Café gratis" />
                )}
              </div>
            </>
          )}

          {/* POINTS: configuration */}
          {card.type === 'points' && (
            <>
              <div className="dt-panel-section-title" style={{ marginTop: 20 }}>Configuración de puntos</div>
              <div className="dt-points-config">
                <div className="dt-points-row">
                  <label className="dt-points-label">Puntos por visita</label>
                  <div className="dt-points-input-wrap">
                    <input
                      type="number"
                      className="dt-points-input"
                      min={1}
                      max={1000}
                      value={pointsPerVisit}
                      onChange={e => setPointsPerVisit(Number(e.target.value))}
                    />
                    <span className="dt-points-unit">pts</span>
                  </div>
                </div>
                <div className="dt-points-note">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Los premios y umbrales de canje se gestionan en la sección <strong>Premios</strong>
                </div>
              </div>
            </>
          )}

          {/* MEMBERSHIP: redirect to rewards */}
          {card.type === 'membership' && (
            <>
              <div className="dt-panel-section-title" style={{ marginTop: 20 }}>Tiers de membresía</div>
              <div className="dt-membership-note">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
                <div>
                  <div className="dt-membership-note-title">Configurá los tiers en Premios</div>
                  <div className="dt-membership-note-desc">Desde la sección Premios podés editar el nombre, visitas mínimas y beneficios de cada tier (Bronze, Silver, Gold, Black).</div>
                </div>
              </div>
            </>
          )}

          {/* Appearance */}
          <div className="dt-panel-section-title" style={{ marginTop: 20 }}>Apariencia de la tarjeta</div>
          <div className="dt-appearance-label">Color de fondo</div>
          <ColorPicker color={card.color} plan={plan} onChange={(s, e) => setCard({ ...card, color: s, secondColor: e })} />

          {card.type === 'stamp' && (
            <>
              <div className="dt-appearance-label" style={{ marginTop: 14 }}>Sellos requeridos</div>
              <div className="dt-stamps-row">
                {[4, 6, 8, 10, 12].map((n: number) => (
                  <button key={n} className={`dt-stamp-count-btn${card.stampsRequired === n ? ' dt-stamp-count-btn--on' : ''}`}
                    onClick={() => setCard({ ...card, stampsRequired: n })}>{n}</button>
                ))}
              </div>
            </>
          )}

          {/* ── Cara del premio (stamp only) ── */}
          {card.type === 'stamp' && (
            <>
              <div className="dt-panel-section-title" style={{ marginTop: 20 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="#C75D3A" stroke="none" style={{ marginRight: 5, verticalAlign: 'middle' }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                Cara del premio
              </div>
              <div style={{ fontSize: 10, color: 'rgba(43,38,32,.4)', marginBottom: 10, lineHeight: 1.5 }}>
                Esta cara aparece cuando el cliente completa todos los sellos.
              </div>
              {/* Image upload */}
              <div
                className="dt-prize-upload-zone"
                onClick={() => prizeImageRef.current?.click()}
              >
                {prizeImage
                  ? <img src={prizeImage} className="dt-prize-upload-preview" alt="premio" />
                  : <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(43,38,32,.35)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      <span className="dt-prize-upload-hint">Subir imagen del premio</span>
                      <span className="dt-prize-upload-sub">PNG, JPG · Se muestra centrada en la tarjeta</span>
                    </>
                }
                <input ref={prizeImageRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = ev => setPrizeImage(ev.target?.result as string); r.readAsDataURL(f) }} />
              </div>
              {prizeImage && <button className="dt-logo-remove" onClick={() => setPrizeImage(null)} style={{ marginBottom: 12 }}>Quitar imagen</button>}

              {/* Messages */}
              <div className="dt-appearance-label">Mensaje de felicitación</div>
              <input className="dt-flip-input" value={flipMessage} onChange={e => setFlipMessage(e.target.value)} placeholder="¡Felicitaciones!" maxLength={40} />

              <div className="dt-appearance-label" style={{ marginTop: 10 }}>Texto de canje</div>
              <input className="dt-flip-input" value={flipSubMessage} onChange={e => setFlipSubMessage(e.target.value)} placeholder="¡Reclamá tu premio!" maxLength={60} />

              <button className="dt-flip-preview-btn" onClick={() => switchSide(previewSide === 'prize' ? 'front' : 'prize')}>
                {previewSide === 'prize' ? '← Cara principal' : '★ Ver cara del premio'}
              </button>
            </>
          )}
        </div>

        {/* ── Right panel (preview) ── */}
        <div className={mobileView === 'config' ? 'dt-preview-panel dt-preview-panel--desktop-only' : 'dt-preview-panel'}>
          {PreviewPanel}
        </div>
      </div>
    </>
  )
}

// ─── Card Manager (Level 1) ───────────────────────────────────────────────────
// ─── New card modal ───────────────────────────────────────────────────────────
function NewCardModal({ onClose, onAdd, existingCount }: {
  onClose: () => void
  onAdd:   (card: CardDesign) => void
  existingCount: number
}) {
  const [step, setStep]         = useState<1 | 2>(1)
  const [name, setName]         = useState('')
  const [type, setType]         = useState<CardType>('stamp')
  const [stamps, setStamps]     = useState(8)
  const [points, setPoints]     = useState(10)
  const [rewardMode, setRewardMode] = useState<'dynamic' | 'fixed'>('dynamic')

  const TYPES: Array<{ id: CardType; label: string; desc: string }> = [
    { id: 'stamp',      label: 'Tarjeta de sellos',   desc: 'Visitas → premio al completar' },
    { id: 'points',     label: 'Puntos por visita',   desc: 'Acumulan puntos del catálogo'  },
    { id: 'membership', label: 'Membresía por niveles', desc: 'Bronze → Silver → Gold → Black' },
  ]

  function handleCreate() {
    const newCard: CardDesign = {
      id:             Date.now().toString(),
      name:           name.trim() || `Tarjeta ${existingCount + 1}`,
      type,
      isActive:       false,
      color:          '#1E3329',
      secondColor:    '#16271F',
      stampsRequired: type === 'stamp' ? stamps : 0,
      rewardMode:     type === 'stamp' ? rewardMode : null,
      rewardField:    null,
    }
    onAdd(newCard)
    onClose()
  }

  return (
    <div className="dt-modal-overlay" onClick={onClose}>
      <div className="dt-modal" onClick={e => e.stopPropagation()}>
        <div className="dt-modal-header">
          <div className="dt-modal-title">Nueva tarjeta</div>
          <button className="dt-modal-close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {step === 1 && (
          <>
            <div className="dt-modal-field-label">Nombre de la tarjeta</div>
            <input className="dt-modal-input" placeholder="Ej: Tarjeta de puntos" value={name} onChange={e => setName(e.target.value)} autoFocus />

            <div className="dt-modal-field-label" style={{ marginTop: 16 }}>Tipo de programa</div>
            <div className="dt-modal-types">
              {TYPES.map(t => (
                <div key={t.id} className={`dt-modal-type${type === t.id ? ' dt-modal-type--on' : ''}`} onClick={() => setType(t.id)}>
                  <div className={`dt-modal-radio${type === t.id ? ' dt-modal-radio--on' : ''}`}>
                    {type === t.id && <div className="dt-modal-radio-dot" />}
                  </div>
                  <div>
                    <div className="dt-modal-type-name">{t.label}</div>
                    <div className="dt-modal-type-desc">{t.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="dt-modal-footer">
              <button className="dt-modal-cancel" onClick={onClose}>Cancelar</button>
              <button className="dt-modal-next" onClick={() => setStep(2)}>
                Siguiente →
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            {type === 'stamp' && (
              <>
                <div className="dt-modal-field-label">Visitas para completar</div>
                <div className="dt-modal-stamps">
                  {[4, 6, 8, 10, 12].map(n => (
                    <button key={n} className={`dt-modal-stamp-btn${stamps === n ? ' dt-modal-stamp-btn--on' : ''}`}
                      onClick={() => setStamps(n)}>
                      <span style={{ fontSize: 22, fontWeight: 800 }}>{n}</span>
                      <span style={{ fontSize: 9, opacity: .7 }}>visitas</span>
                    </button>
                  ))}
                </div>
                <div className="dt-modal-field-label" style={{ marginTop: 16 }}>Premio</div>
                <div className="dt-modal-reward-opts">
                  {[
                    { id: 'dynamic' as const, label: 'El cliente elige', desc: 'Cada cliente define su propio premio al registrarse' },
                    { id: 'fixed'   as const, label: 'Yo lo defino',     desc: 'El mismo premio para todos los clientes' },
                  ].map(r => (
                    <div key={r.id} className={`dt-modal-type${rewardMode === r.id ? ' dt-modal-type--on' : ''}`} onClick={() => setRewardMode(r.id)}>
                      <div className={`dt-modal-radio${rewardMode === r.id ? ' dt-modal-radio--on' : ''}`}>
                        {rewardMode === r.id && <div className="dt-modal-radio-dot" />}
                      </div>
                      <div>
                        <div className="dt-modal-type-name">{r.label}</div>
                        <div className="dt-modal-type-desc">{r.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {type === 'points' && (
              <>
                <div className="dt-modal-field-label">Puntos por visita</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input type="number" className="dt-modal-input" style={{ width: 90, textAlign: 'center', fontSize: 22, fontWeight: 800 }}
                    value={points} onChange={e => setPoints(Number(e.target.value))} min={1} />
                  <span style={{ fontSize: 14, color: 'rgba(43,38,32,.5)' }}>puntos por visita</span>
                </div>
                <div className="dt-modal-hint">Los premios y umbrales se configuran desde la sección Premios.</div>
              </>
            )}

            {type === 'membership' && (
              <>
                <div className="dt-modal-hint" style={{ marginBottom: 0 }}>
                  Tu membresía arranca con 4 niveles predeterminados: Bronze, Silver, Gold y Black. Podés editar los beneficios de cada uno desde la sección Premios una vez que la tarjeta esté creada.
                </div>
              </>
            )}

            <div className="dt-modal-footer" style={{ marginTop: 24 }}>
              <button className="dt-modal-cancel" onClick={() => setStep(1)}>← Atrás</button>
              <button className="dt-modal-next" onClick={handleCreate}>Crear tarjeta</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Card manager ─────────────────────────────────────────────────────────────
function CardManager({ cards: init, planMaxCards, planActiveCards, plan, onEdit }: {
  cards: CardDesign[]; planMaxCards: number; planActiveCards: number; plan: string; onEdit: (card: CardDesign) => void
}) {
  const [cards, setCards]         = useState<CardDesign[]>(init)
  const [logos]                   = useState<Record<string, LogoState>>({})
  const [showModal, setModal]     = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const { can }               = usePlan()
  const t                     = useLang()

  // Sync when parent passes new real cards
  useEffect(() => { setCards(init) }, [init])
  const activeCount           = cards.filter((c: CardDesign) => c.isActive).length
  const atLimit               = activeCount >= planMaxCards

  function toggleCard(id: string) {
    const card = cards.find((c: CardDesign) => c.id === id)
    if (!card) return
    if (!card.isActive && atLimit) return
    setCards(cards.map((c: CardDesign) => c.id === id ? { ...c, isActive: !c.isActive } : c))
  }

  function handleAddClick() {
    if (atLimit) return
    setModal(true)
  }

  function handleCardAdded(newCard: CardDesign) {
    setCards([...cards, newCard])
  }

  function deleteCard(id: string) {
    setCards(cards.filter((c: CardDesign) => c.id !== id))
    setConfirmDelete(null)
  }

  return (
    <div className="dt-content">
      {/* Plan bar */}
      <div className="dt-plan-bar">
        <div className="dt-plan-text">
          <strong>{activeCount} de {planMaxCards}</strong> tarjeta{planMaxCards !== 1 ? 's' : ''} activa{planMaxCards !== 1 ? 's' : ''} — Plan {plan}
        </div>
        <div className="dt-plan-dots">
          {Array.from({ length: Math.min(planMaxCards, 5) }, (_: unknown, i: number) => (
            <div key={i} className={`dt-plan-dot${i < activeCount ? ' dt-plan-dot--on' : ''}`} />
          ))}
        </div>
        <button className="dt-upgrade-link">Mejorar plan →</button>
      </div>

      <div className="dt-cards-grid">
        {cards.map((card: CardDesign) => (
          <div key={card.id} className="dt-card-tile">
            <MiniPass design={card} logos={logos[card.id] || { businessLogo: null, earnedIcon: null, emptyIcon: null }} />
            <div className="dt-tile-info">
              <div className="dt-tile-name-row">
                <span className="dt-tile-name">{card.name}</span>
                <button className={`dt-tile-toggle${card.isActive ? ' dt-tile-toggle--on' : ''}`} onClick={() => toggleCard(card.id)}>
                  <div className="dt-tile-toggle-thumb" />
                </button>
              </div>
              <div className="dt-tile-sub">
                {card.type === 'stamp'      && `${card.stampsRequired} visitas · ${card.rewardMode === 'dynamic' ? 'Cliente elige' : 'Premio fijo'}`}
                {card.type === 'points'     && 'Puntos por visita'}
                {card.type === 'membership' && '4 niveles'}
                {!card.isActive && ' · Inactiva'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button className="dt-tile-edit" onClick={() => onEdit(card)}>Editar →</button>
                <button className="dt-tile-delete" onClick={() => setConfirmDelete(card.id)} title="Eliminar tarjeta">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add card tile */}
        <div
          className={`dt-add-tile${atLimit ? ' dt-add-tile--disabled' : ''}`}
          onClick={handleAddClick}
          title={atLimit ? `Plan ${plan}: límite de ${planMaxCards} tarjeta${planMaxCards !== 1 ? 's' : ''}` : 'Crear nueva tarjeta'}
        >
          <div className="dt-add-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
          <div className="dt-add-label">
            {atLimit ? `Plan ${plan} · 1 tarjeta máx.` : t('dt_new_card' as any)}
          </div>
          {atLimit && (
            <div className="dt-add-upgrade">Mejorar plan →</div>
          )}
        </div>
      </div>

      {showModal && (
        <NewCardModal
          onClose={() => setModal(false)}
          onAdd={handleCardAdded}
          existingCount={cards.length}
        />
      )}

      {confirmDelete && (() => {
        const card = cards.find((c: CardDesign) => c.id === confirmDelete)
        if (!card) return null
        const isOnlyActive = card.isActive && activeCount === 1
        return (
          <div className="dt-modal-overlay" onClick={() => setConfirmDelete(null)}>
            <div className="dt-modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
              <div className="dt-modal-header">
                <div className="dt-modal-title">Eliminar tarjeta</div>
                <button className="dt-modal-close" onClick={() => setConfirmDelete(null)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              {isOnlyActive
                ? <>
                    <div style={{ fontSize: 13, color: 'rgba(43,38,32,.65)', lineHeight: 1.6, marginBottom: 20 }}>
                      No podés eliminar <strong>{card.name}</strong> porque es la única tarjeta activa. Creá otra tarjeta antes de eliminar esta.
                    </div>
                    <div className="dt-modal-footer">
                      <div />
                      <button className="dt-modal-cancel" onClick={() => setConfirmDelete(null)}>Entendido</button>
                    </div>
                  </>
                : <>
                    <div style={{ fontSize: 13, color: 'rgba(43,38,32,.65)', lineHeight: 1.6, marginBottom: 20 }}>
                      ¿Eliminar <strong>{card.name}</strong>? Esta acción no se puede deshacer. Los clientes que tienen esta tarjeta dejarán de verla en su wallet.
                    </div>
                    <div className="dt-modal-footer">
                      <button className="dt-modal-cancel" onClick={() => setConfirmDelete(null)}>Cancelar</button>
                      <button onClick={() => deleteCard(card.id)} style={{ background: '#B23B3B', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                        Sí, eliminar
                      </button>
                    </div>
                  </>
              }
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function DesignTab({ data, cards, businessId, onSaved }: { data: DesignData; cards?: CardDesign[]; businessId?: string | null; onSaved?: () => void }) {
  const [editingCard, setEditingCard] = useState<CardDesign | null>(null)

  // Las cards reales ya vienen cargadas del dashboard (fetch único al
  // montar, sin este segundo round-trip) — así no hay ventana de 1-2s
  // mostrando el color del mock antes de que llegue el real.
  const effectiveData = (cards && cards.length > 0) ? { ...data, cardDesigns: cards } : data

  return (
    <>
      <style>{`
        .dt-content{flex:1;overflow-y:auto;padding:24px 28px;display:flex;flex-direction:column;gap:18px;}
        .dt-editor-header{height:54px;flex-shrink:0;background:#FFFFFF;border-bottom:1px solid rgba(43,38,32,.08);display:flex;align-items:center;padding:0 20px;gap:12px;}
        .dt-back-btn{display:flex;align-items:center;gap:6px;font-size:13px;color:rgba(43,38,32,.55);background:none;border:none;cursor:pointer;padding:6px 10px;border-radius:7px;transition:all .15s;white-space:nowrap;}
        .dt-back-btn:hover{background:#FBF6EE;color:#2B2620;}
        .dt-editor-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:15px;color:#2B2620;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .dt-save-btn{background:#C75D3A;color:#fff;border:none;border-radius:9px;padding:9px 18px;font-size:12.5px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;white-space:nowrap;}
        .dt-save-btn:hover{background:#B14F2F;}
        .dt-save-btn:disabled{opacity:.6;cursor:not-allowed;}
        .dt-save-error{font-size:12px;color:#B23B3B;background:rgba(178,59,59,.07);border-bottom:1px solid rgba(178,59,59,.15);padding:8px 20px;}
        .dt-editor-body{flex:1;display:grid;grid-template-columns:300px 1fr;overflow:hidden;}
        .dt-editor-panel{background:#FFFFFF;border-right:1px solid rgba(43,38,32,.08);padding:20px 18px;overflow-y:auto;}
        .dt-panel-section-title{font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:rgba(43,38,32,.45);font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:6px;}
        .dt-logo-row{display:flex;gap:8px;align-items:flex-start;}
        .dt-logo-upload{flex:1;display:flex;flex-direction:column;gap:4px;justify-content:flex-start;}
        .dt-logo-label{font-size:11px;color:rgba(43,38,32,.55);font-weight:600;min-height:28px;}
        .dt-logo-zone{width:100%;height:90px;border:1.5px dashed rgba(43,38,32,.2);border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;cursor:pointer;transition:all .15s;color:rgba(43,38,32,.4);font-size:9.5px;text-align:center;overflow:hidden;}
        .dt-logo-zone:hover{border-color:#C75D3A;color:#C75D3A;}
        /* Prize card upload */
        .dt-prize-upload-zone{width:100%;min-height:120px;border:2px dashed rgba(43,38,32,.15);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;cursor:pointer;transition:all .15s;background:#FBF6EE;overflow:hidden;margin-bottom:6px;}
        .dt-prize-upload-zone:hover{border-color:#C75D3A;background:#F5EFE6;}
        .dt-prize-upload-preview{width:100%;height:140px;object-fit:cover;}
        .dt-prize-upload-hint{font-size:12px;color:rgba(43,38,32,.5);font-weight:600;}
        .dt-prize-upload-sub{font-size:10px;color:rgba(43,38,32,.35);}
        .dt-logo-zone--filled{border-style:solid;border-color:rgba(43,38,32,.12);}
        .dt-logo-preview{width:100%;height:100%;object-fit:contain;padding:6px;}
        .dt-logo-remove{font-size:9.5px;color:#B23B3B;background:none;border:none;cursor:pointer;text-align:center;}
        .dt-fields-list{display:flex;flex-direction:column;gap:4px;}
        .dt-field-row{display:flex;align-items:center;gap:8px;padding:8px 10px;background:#FBF6EE;border:1px solid rgba(43,38,32,.07);border-radius:9px;font-size:11.5px;color:#2B2620;transition:background .1s;}
        .dt-field-row:hover{background:#F5EFE6;}
        .dt-field-row--inactive{opacity:.4;}
        .dt-field-row--selected{background:rgba(199,93,58,.08);border-color:#C75D3A;}
        .dt-grip-wrap{display:flex;align-items:center;cursor:grab;color:rgba(43,38,32,.3);flex-shrink:0;}
        .dt-grip-wrap--locked{cursor:default;opacity:.25;}
        .dt-field-label-text{flex:1;font-size:13px;}
        .dt-field-actions{display:flex;align-items:center;gap:6px;flex-shrink:0;}
        .dt-locked-badge{font-size:10px;padding:2px 9px;border-radius:20px;background:rgba(43,38,32,.08);color:rgba(43,38,32,.5);}
        .dt-toggle-field{background:none;border:none;cursor:pointer;color:rgba(43,38,32,.4);display:flex;align-items:center;padding:2px;border-radius:4px;}
        .dt-toggle-field:hover{color:#C75D3A;}
        .dt-radio-dot-outer{width:15px;height:15px;border-radius:50%;border:2px solid rgba(43,38,32,.2);flex-shrink:0;display:flex;align-items:center;justify-content:center;}
        .dt-radio-dot-outer--on{border-color:#C75D3A;}
        .dt-radio-dot-inner{width:7px;height:7px;border-radius:50%;background:#C75D3A;}
        .dt-reward-mode-box{display:flex;flex-direction:column;gap:6px;}
        .dt-reward-opt{display:flex;align-items:flex-start;gap:10px;padding:11px 13px;border:1.5px solid rgba(43,38,32,.1);border-radius:11px;cursor:pointer;transition:all .15s;}
        .dt-reward-opt:hover{border-color:rgba(43,38,32,.2);}
        .dt-reward-opt--on{border-color:#C75D3A;background:rgba(199,93,58,.05);}
        .dt-reward-radio{width:16px;height:16px;border-radius:50%;border:2px solid rgba(43,38,32,.2);flex-shrink:0;margin-top:1px;display:flex;align-items:center;justify-content:center;}
        .dt-reward-opt--on .dt-reward-radio{border-color:#C75D3A;}
        .dt-reward-radio-dot{width:7px;height:7px;border-radius:50%;background:#C75D3A;}
        .dt-reward-opt-title{font-size:12px;font-weight:700;color:#2B2620;}
        .dt-reward-opt-desc{font-size:10px;color:rgba(43,38,32,.5);margin-top:2px;}
        .dt-field-picker{padding:10px;background:#FBF6EE;border-radius:9px;display:flex;flex-direction:column;gap:4px;}
        .dt-field-picker-label{font-size:9.5px;text-transform:uppercase;letter-spacing:.05em;color:rgba(43,38,32,.4);font-weight:700;margin-bottom:4px;}
        .dt-prize-input{width:100%;padding:9px 12px;font-size:12px;border:1px solid rgba(43,38,32,.15);border-radius:9px;background:#FFFFFF;color:#2B2620;font-family:'Inter',sans-serif;outline:none;}
        .dt-prize-input:focus{border-color:#C75D3A;}
        /* Points config */
        .dt-points-config{display:flex;flex-direction:column;gap:10px;}
        .dt-points-row{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:#FBF6EE;border-radius:10px;}
        .dt-points-label{font-size:12px;color:#2B2620;font-weight:500;}
        .dt-points-input-wrap{display:flex;align-items:center;gap:6px;}
        .dt-points-input{width:60px;padding:5px 8px;font-size:14px;font-weight:700;border:1.5px solid rgba(43,38,32,.15);border-radius:8px;text-align:center;background:#FFFFFF;color:#2B2620;font-family:'Plus Jakarta Sans',sans-serif;outline:none;}
        .dt-points-input:focus{border-color:#C75D3A;}
        .dt-points-unit{font-size:11px;color:rgba(43,38,32,.5);font-weight:600;}
        .dt-points-note{display:flex;align-items:flex-start;gap:8px;padding:10px 12px;background:rgba(24,95,165,.06);border:1px solid rgba(24,95,165,.15);border-radius:10px;font-size:11px;color:rgba(43,38,32,.6);line-height:1.5;}
        .dt-points-note svg{color:#185FA5;flex-shrink:0;margin-top:1px;}
        .dt-points-note strong{color:#185FA5;}
        /* Membership redirect note */
        .dt-membership-note{display:flex;align-items:flex-start;gap:10px;padding:12px 14px;background:rgba(199,93,58,.06);border:1px solid rgba(199,93,58,.2);border-radius:11px;}
        .dt-membership-note svg{color:#C75D3A;flex-shrink:0;margin-top:2px;}
        .dt-membership-note-title{font-size:12px;font-weight:700;color:#C75D3A;margin-bottom:3px;}
        .dt-membership-note-desc{font-size:10.5px;color:rgba(43,38,32,.6);line-height:1.5;}
        /* Color picker */
        .dt-appearance-label{font-size:11.5px;color:rgba(43,38,32,.55);margin-bottom:8px;font-weight:500;}
        .dt-color-row{display:flex;gap:8px;margin-bottom:8px;}
        .dt-color-dot{width:24px;height:24px;border-radius:50%;border:2.5px solid transparent;cursor:pointer;transition:all .15s;}
        .dt-color-dot--on{border-color:#2B2620;transform:scale(1.12);}
        .dt-custom-color-row{display:flex;align-items:center;gap:8px;}
        .dt-custom-swatch{width:26px;height:26px;border-radius:50%;border:2px solid rgba(43,38,32,.2);cursor:pointer;display:block;overflow:hidden;flex-shrink:0;}
        .dt-color-native{opacity:0;width:1px;height:1px;border:none;padding:0;}
        .dt-hex-input{width:80px;padding:5px 8px;font-size:11.5px;border:1px solid rgba(43,38,32,.15);border-radius:7px;background:#FBF6EE;color:#2B2620;font-family:monospace;outline:none;}
        .dt-hex-input:focus{border-color:#C75D3A;}
        .dt-hex-label{font-size:10px;color:rgba(43,38,32,.45);}
        .dt-upgrade-color-note{display:flex;align-items:center;gap:6px;font-size:11px;color:rgba(43,38,32,.45);padding:8px 10px;background:rgba(43,38,32,.04);border-radius:8px;margin-top:4px;}
        .dt-stamps-row{display:flex;gap:7px;}
        .dt-stamp-count-btn{width:40px;height:32px;border-radius:8px;border:1px solid rgba(43,38,32,.12);background:#FBF6EE;font-size:13px;font-weight:600;color:rgba(43,38,32,.55);cursor:pointer;transition:all .15s;}
        .dt-stamp-count-btn--on{background:#C75D3A;color:#fff;border-color:#C75D3A;}
        /* Mobile tabs */
        .dt-mobile-tabs{display:none;gap:4px;}
        .dt-mobile-tab{padding:6px 12px;border-radius:8px;border:1.5px solid rgba(43,38,32,.12);background:#FBF6EE;font-size:12px;color:rgba(43,38,32,.5);cursor:pointer;font-family:'Inter',sans-serif;}
        .dt-mobile-tab--on{background:#C75D3A;color:#fff;border-color:#C75D3A;font-weight:600;}
        /* Preview panel */
        .dt-preview-panel{background:#FBF6EE;overflow-y:auto;display:flex;align-items:flex-start;justify-content:center;padding:32px 24px;}
        .dt-preview-inner{display:flex;flex-direction:column;align-items:center;width:100%;max-width:360px;}
        .dt-platform-switch{display:flex;gap:20px;margin-bottom:22px;}
        .dt-platform-btn{font-size:13px;color:rgba(43,38,32,.4);background:none;border:none;cursor:pointer;padding-bottom:6px;border-bottom:2.5px solid transparent;font-family:'Inter',sans-serif;transition:all .15s;}
        .dt-platform-btn--on{color:#2B2620;border-bottom-color:#C75D3A;font-weight:600;}
        .dt-tier-preview-selector{display:flex;align-items:center;gap:6px;margin-bottom:18px;flex-wrap:wrap;}
        .dt-tier-preview-label{font-size:10.5px;color:rgba(43,38,32,.45);margin-right:2px;}
        .dt-tier-preview-btn{font-size:10.5px;padding:5px 12px;border-radius:20px;border:1.5px solid rgba(43,38,32,.15);background:#FFFFFF;color:rgba(43,38,32,.55);cursor:pointer;font-weight:600;transition:all .15s;}
        .dt-preview-note{font-size:11px;color:rgba(43,38,32,.4);text-align:center;margin-top:16px;}
        /* Real pass */
        .dt-real-pass{width:300px;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(43,38,32,.25);}
        .dt-real-pass-top{padding:24px 24px 12px;}
        .dt-real-pass-logo-img{max-height:40px;max-width:180px;object-fit:contain;}
        .dt-real-pass-logo-text{font-size:24px;font-weight:900;color:#FFFFFF;letter-spacing:-.02em;line-height:1;}
        .dt-real-pass-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:8px 24px 20px;}
        .dt-real-pass-cell{aspect-ratio:1;display:flex;align-items:center;justify-content:center;}
        .dt-real-pass-icon-img{width:100%;height:100%;object-fit:contain;}
        .dt-real-pass-icon-img--empty{opacity:.4;}
        .dt-real-pass-icon-default{width:100%;height:100%;border-radius:8px;}
        .dt-real-pass-icon-filled{background:rgba(255,255,255,.9);}
        .dt-real-pass-icon-empty{background:rgba(255,255,255,.2);border:2px dashed rgba(255,255,255,.4);}
        .dt-real-pass-single-tier{padding:8px 24px 20px;}
        .dt-real-pass-single-tier-badge{display:inline-flex;align-items:center;gap:5px;font-size:14px;font-weight:700;padding:6px 16px;border-radius:20px;margin-bottom:6px;}
        .dt-real-pass-tier-perk{font-size:11px;color:rgba(255,255,255,.65);}
        .dt-real-pass-points-area{padding:8px 24px 20px;}
        .dt-real-pass-points-num{font-size:32px;font-weight:800;color:#FFFFFF;margin-bottom:8px;}
        .dt-real-pass-points-bar{width:100%;height:6px;background:rgba(255,255,255,.2);border-radius:3px;overflow:hidden;margin-bottom:6px;}
        .dt-real-pass-points-fill{height:100%;background:rgba(255,255,255,.8);border-radius:3px;}
        .dt-real-pass-points-sub{font-size:10px;color:rgba(255,255,255,.6);}
        .dt-real-pass-info{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:0 24px 20px;}
        .dt-real-pass-info-label{font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.65);font-weight:600;margin-bottom:4px;}
        .dt-real-pass-info-val{font-size:16px;font-weight:700;color:#FFFFFF;}
        .dt-real-pass-qr-section{background:#FFFFFF;padding:20px;display:flex;flex-direction:column;align-items:center;gap:8px;}
        .dt-real-pass-powered{font-size:10px;color:#999;}
        /* Google pass */
        .dt-gpass{width:300px;border-radius:18px;overflow:hidden;box-shadow:0 20px 60px rgba(43,38,32,.25);background:#FFFFFF;}
        .dt-gpass-hero{height:100px;padding:14px 18px;display:flex;flex-direction:column;justify-content:space-between;}
        .dt-gpass-logo-row{display:flex;align-items:center;gap:8px;}
        .dt-gpass-logo-box{width:22px;height:22px;border-radius:50%;background:rgba(255,255,255,.3);}
        .dt-gpass-logo-img{height:22px;width:auto;object-fit:contain;}
        .dt-gpass-issuer{font-size:11px;color:rgba(255,255,255,.85);font-weight:500;}
        .dt-gpass-hero-title{font-size:20px;font-weight:700;color:#fff;}
        .dt-gpass-body{padding:16px 18px;}
        .dt-gpass-field-label{font-size:10px;color:#5f6368;text-transform:uppercase;letter-spacing:.03em;}
        .dt-gpass-stamps{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;}
        .dt-gpass-stamp{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;overflow:hidden;}
        .dt-gpass-stamp--filled{background:#e8f0fe;border:1.5px solid #1a73e8;}
        .dt-gpass-stamp--empty{background:#f1f3f4;border:1.5px dashed #c4c7c5;}
        .dt-gpass-stamp-img{width:100%;height:100%;object-fit:contain;}
        .dt-gpass-divider{border-top:1px solid #e8eaed;margin:10px 0;}
        .dt-gpass-info-row{display:flex;justify-content:space-between;font-size:12px;padding:4px 0;}
        .dt-gpass-info-val{color:#202124;font-weight:500;}
        .dt-gpass-qr-wrap{padding:14px;border-top:1px solid #e8eaed;display:flex;flex-direction:column;align-items:center;gap:6px;}
        .dt-gpass-qr-label{font-size:9px;color:#5f6368;}
        /* Card manager */
        .dt-plan-bar{display:flex;align-items:center;gap:14px;background:rgba(199,93,58,.07);border:1px solid rgba(199,93,58,.2);border-radius:12px;padding:12px 18px;}
        .dt-plan-text{font-size:12.5px;color:#2B2620;flex:1;}
        .dt-plan-text strong{color:#C75D3A;}
        .dt-plan-dots{display:flex;gap:6px;}
        .dt-plan-dot{width:10px;height:10px;border-radius:50%;background:rgba(43,38,32,.12);}
        .dt-plan-dot--on{background:#C75D3A;}
        .dt-upgrade-link{font-size:11.5px;color:#C75D3A;font-weight:700;background:none;border:none;cursor:pointer;}
        .dt-cards-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;}
        .dt-card-tile{background:#FFFFFF;border:1px solid rgba(43,38,32,.07);border-radius:16px;overflow:hidden;box-shadow:0 1px 8px rgba(43,38,32,.04);display:flex;flex-direction:column;}
        .dt-mini-pass{padding:16px;display:flex;flex-direction:column;gap:10px;min-height:160px;}
        .dt-mini-pass-top{display:flex;justify-content:space-between;align-items:flex-start;}
        .dt-mini-logo-img{max-height:22px;max-width:80px;object-fit:contain;}
        .dt-mini-logo-text{font-size:14px;font-weight:900;color:#FFFFFF;}
        .dt-mini-type{font-size:8px;color:rgba(255,255,255,.55);text-transform:uppercase;letter-spacing:.04em;}
        .dt-mini-stamps{display:flex;gap:4px;flex-wrap:wrap;}
        .dt-mini-stamp{width:20px;height:20px;border-radius:6px;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;overflow:hidden;}
        .dt-mini-stamp--filled{background:rgba(255,255,255,.9);}
        .dt-mini-stamp-img{width:100%;height:100%;object-fit:contain;}
        .dt-mini-tier-row{display:flex;gap:4px;flex-wrap:wrap;}
        .dt-mini-tier-chip{font-size:8px;padding:2px 8px;border-radius:20px;background:rgba(255,255,255,.18);color:rgba(255,255,255,.7);font-weight:600;}
        .dt-mini-tier-chip--active{background:rgba(255,255,255,.85);color:#2B2620;}
        .dt-mini-points{font-size:22px;font-weight:800;color:#FFFFFF;}
        .dt-mini-qr-hint{width:28px;height:28px;background:rgba(255,255,255,.9);border-radius:4px;margin-top:auto;align-self:flex-end;}
        .dt-tile-info{padding:12px 14px;display:flex;flex-direction:column;gap:5px;}
        .dt-tile-name-row{display:flex;align-items:center;justify-content:space-between;}
        .dt-tile-name{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:13px;color:#2B2620;}
        .dt-tile-toggle{width:34px;height:19px;border-radius:20px;background:rgba(43,38,32,.15);border:none;cursor:pointer;position:relative;transition:background .2s;flex-shrink:0;}
        .dt-tile-toggle--on{background:#5B8C5A;}
        .dt-tile-toggle-thumb{width:15px;height:15px;border-radius:50%;background:#fff;position:absolute;top:2px;left:2px;transition:left .2s;}
        .dt-tile-toggle--on .dt-tile-toggle-thumb{left:17px;}
        .dt-tile-sub{font-size:10.5px;color:rgba(43,38,32,.45);}
        .dt-tile-edit{font-size:12px;color:#C75D3A;font-weight:700;background:none;border:none;cursor:pointer;padding:0;text-align:left;}
        .dt-tile-delete{background:none;border:none;cursor:pointer;color:rgba(43,38,32,.25);display:flex;align-items:center;padding:3px;border-radius:5px;transition:all .15s;}
        .dt-tile-delete:hover{color:#B23B3B;background:rgba(178,59,59,.08);}
        .dt-tile-edit:hover{text-decoration:underline;}
        .dt-add-tile{background:#FFFFFF;border:1.5px dashed rgba(43,38,32,.18);border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;min-height:200px;cursor:pointer;transition:all .15s;}
        .dt-add-tile:hover{border-color:#C75D3A;background:rgba(199,93,58,.03);}
        .dt-add-tile--disabled{opacity:.5;cursor:not-allowed;}
        .dt-add-tile--disabled:hover{border-color:rgba(43,38,32,.18);background:#FFFFFF;}
        .dt-add-icon{width:40px;height:40px;border-radius:50%;background:rgba(199,93,58,.1);display:flex;align-items:center;justify-content:center;color:#C75D3A;}
        .dt-add-label{font-size:12.5px;color:rgba(43,38,32,.5);font-weight:600;text-align:center;}

        /* ── RESPONSIVE ── */
        /* ── Flip card ── */
        .dt-face-switch{display:flex;gap:20px;margin-bottom:16px;}
        .dt-face-btn{font-size:13px;color:rgba(43,38,32,.4);background:none;border:none;cursor:pointer;padding-bottom:6px;border-bottom:2.5px solid transparent;font-family:'Inter',sans-serif;transition:all .15s;display:flex;align-items:center;gap:5px;}
        .dt-face-btn--on{color:#C75D3A;border-bottom-color:#C75D3A;font-weight:600;}
        .dt-pass-flip-wrap{transition:opacity .3s ease, transform .3s ease;}
        .dt-pass-flip-wrap--flipping{opacity:0;transform:scale(.96);}
        /* Prize card body */
        .dt-prize-card-body{display:flex;flex-direction:column;align-items:center;gap:12px;padding:16px 24px 20px;}
        .dt-prize-stars{display:flex;align-items:flex-end;gap:6px;}
        .dt-prize-message{font-size:24px;font-weight:800;color:#FFFFFF;text-align:center;line-height:1.2;letter-spacing:-.01em;}
        .dt-prize-box{width:100%;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);border-radius:12px;padding:12px 16px;text-align:center;}
        .dt-prize-box-label{font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.55);margin-bottom:5px;}
        .dt-prize-box-value{font-size:16px;font-weight:700;color:#FFFFFF;}
        .dt-prize-sub-message{font-size:11px;color:rgba(255,255,255,.6);text-align:center;line-height:1.5;max-width:220px;}
        /* Flip editor inputs */
        .dt-flip-input{width:100%;padding:8px 11px;font-size:13px;border:1.5px solid rgba(43,38,32,.12);border-radius:9px;background:#FFFFFF;color:#2B2620;font-family:'Inter',sans-serif;outline:none;margin-bottom:2px;}
        .dt-flip-input:focus{border-color:#C75D3A;}
        .dt-flip-textarea{width:100%;padding:8px 11px;font-size:12.5px;border:1.5px solid rgba(43,38,32,.12);border-radius:9px;background:#FFFFFF;color:#2B2620;font-family:'Inter',sans-serif;outline:none;resize:none;margin-bottom:2px;line-height:1.5;}
        .dt-flip-textarea:focus{border-color:#C75D3A;}
        .dt-flip-char{font-size:10px;color:rgba(43,38,32,.35);text-align:right;margin-bottom:4px;}
        .dt-flip-preview-btn{width:100%;margin-top:10px;padding:9px;background:rgba(199,93,58,.08);border:1.5px dashed rgba(199,93,58,.4);border-radius:10px;font-size:12px;color:#C75D3A;font-weight:700;cursor:pointer;transition:all .15s;}
        .dt-flip-preview-btn:hover{background:rgba(199,93,58,.14);}
        /* ── New card modal ── */
        .dt-modal-overlay{position:fixed;inset:0;background:rgba(43,38,32,.45);display:flex;align-items:center;justify-content:center;z-index:100;backdrop-filter:blur(3px);}
        .dt-modal{background:#FFFFFF;border-radius:20px;padding:28px;width:100%;max-width:440px;box-shadow:0 20px 60px rgba(43,38,32,.2);}
        .dt-modal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}
        .dt-modal-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:17px;color:#2B2620;}
        .dt-modal-close{background:none;border:none;cursor:pointer;color:rgba(43,38,32,.4);padding:4px;border-radius:6px;display:flex;align-items:center;}
        .dt-modal-close:hover{background:#FBF6EE;color:#2B2620;}
        .dt-modal-field-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:rgba(43,38,32,.5);margin-bottom:8px;}
        .dt-modal-input{width:100%;padding:11px 14px;font-size:14px;border:1.5px solid rgba(43,38,32,.12);border-radius:11px;background:#FBF6EE;color:#2B2620;font-family:'Inter',sans-serif;outline:none;transition:border-color .15s;}
        .dt-modal-input:focus{border-color:#C75D3A;background:#fff;}
        .dt-modal-types{display:flex;flex-direction:column;gap:8px;}
        .dt-modal-type{display:flex;align-items:flex-start;gap:12px;padding:12px 14px;border:1.5px solid rgba(43,38,32,.1);border-radius:12px;cursor:pointer;transition:all .15s;}
        .dt-modal-type:hover{border-color:rgba(43,38,32,.25);}
        .dt-modal-type--on{border-color:#C75D3A;background:rgba(199,93,58,.05);}
        .dt-modal-radio{width:18px;height:18px;border-radius:50%;border:2px solid rgba(43,38,32,.2);flex-shrink:0;display:flex;align-items:center;justify-content:center;margin-top:1px;}
        .dt-modal-radio--on{border-color:#C75D3A;}
        .dt-modal-radio-dot{width:9px;height:9px;border-radius:50%;background:#C75D3A;}
        .dt-modal-type-name{font-size:13px;font-weight:700;color:#2B2620;margin-bottom:2px;}
        .dt-modal-type-desc{font-size:11px;color:rgba(43,38,32,.5);}
        .dt-modal-stamps{display:flex;gap:8px;flex-wrap:wrap;}
        .dt-modal-stamp-btn{display:flex;flex-direction:column;align-items:center;gap:3px;width:64px;padding:12px 0;background:#FBF6EE;border:2px solid rgba(43,38,32,.1);border-radius:12px;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .15s;}
        .dt-modal-stamp-btn:hover{border-color:rgba(43,38,32,.3);}
        .dt-modal-stamp-btn--on{border-color:#C75D3A;background:#C75D3A;color:#fff;}
        .dt-modal-reward-opts{display:flex;flex-direction:column;gap:8px;}
        .dt-modal-hint{font-size:12px;color:rgba(43,38,32,.5);background:rgba(43,38,32,.04);padding:11px 14px;border-radius:10px;line-height:1.6;}
        .dt-modal-footer{display:flex;align-items:center;justify-content:space-between;margin-top:20px;padding-top:20px;border-top:1px solid rgba(43,38,32,.08);}
        .dt-modal-cancel{background:none;border:1.5px solid rgba(43,38,32,.15);border-radius:10px;padding:10px 18px;font-size:13px;font-weight:600;color:rgba(43,38,32,.55);cursor:pointer;font-family:'Inter',sans-serif;}
        .dt-modal-cancel:hover{border-color:rgba(43,38,32,.3);color:#2B2620;}
        .dt-modal-next{background:#C75D3A;color:#fff;border:none;border-radius:10px;padding:10px 22px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:background .15s;}
        .dt-modal-next:hover{background:#B14F2F;}
        .dt-add-upgrade{font-size:11px;color:#C75D3A;font-weight:700;}
        @media (max-width: 768px) {
          .dt-mobile-tabs{display:flex;}
          .dt-editor-body{grid-template-columns:1fr;}
          .dt-panel--mobile-hidden{display:none;}
          .dt-preview-panel--desktop-only{display:none;}
          .dt-preview-panel{padding:20px 16px;}
          .dt-real-pass,.dt-gpass{width:100%;max-width:320px;}
          .dt-cards-grid{grid-template-columns:1fr 1fr;}
          .dt-content{padding:14px 16px;}
          .dt-editor-header{flex-wrap:wrap;height:auto;padding:12px 16px;gap:8px;}
          .dt-back-btn{font-size:12px;}
          .dt-logo-row{flex-wrap:wrap;}
          .dt-plan-bar{flex-wrap:wrap;gap:8px;}
        }
        @media (max-width: 480px) {
          .dt-cards-grid{grid-template-columns:1fr;}
          .dt-editor-title{font-size:13px;}
          .dt-stamps-row{flex-wrap:wrap;}
          .dt-color-row{flex-wrap:wrap;}
          .dt-modal{padding:20px;}
          .dt-modal-stamps{flex-wrap:wrap;}
        }
      `}</style>

      {editingCard
        ? <CardEditor card={editingCard} formFields={data.formFields} plan={effectiveData.business.plan} businessId={businessId} onSaved={onSaved} onBack={() => setEditingCard(null)} />
        : <CardManager cards={effectiveData.cardDesigns} planMaxCards={effectiveData.business.planMaxCards} planActiveCards={effectiveData.business.planActiveCards} plan={effectiveData.business.plan} onEdit={setEditingCard} />
      }
    </>
  )
}