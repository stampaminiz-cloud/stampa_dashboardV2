'use client'
import React, { useState, useEffect, useRef } from 'react'
import { apiMe, apiOnboarding, apiOnboardingPreview, getToken } from '@/lib/api'
import { Pass } from '@/components/landing2/Pass'
import { PASS_CSS } from '@/components/landing2/passStyles'
import type { Biz } from '@/components/landing2/data'
import { NumberStepper } from '@/components/ui/NumberStepper'
import { darkenHex, DEFAULT_CARD_COLOR, presetsForPlan } from '@/lib/colorPresets'
import { ColorField, useLogoColors } from '@/components/dashboard/ColorField'
import { Icon } from '@/components/ui/Icon'
import { PassPreview, type PassImages } from '@/components/dashboard/PassPreview'
import { PLAN_LIMITS, type Plan } from '@/data/plans'
import { PointsRuleEditor, pointsRuleValid, DEFAULT_UNIT, type PointsRuleValue } from '@/components/dashboard/PointsRuleEditor'
import { currencyFor, pointsRuleText, type Currency } from '@/lib/money'

// ─── Types ────────────────────────────────────────────────────────────────────
type CardType    = 'stamp' | 'points' | 'membership'
type RewardMode  = 'customer' | 'fixed'

interface OBState {
  businessName:   string
  sector:         string
  cardType:       CardType
  stampsRequired: number
  pointsPerVisit: number
  pointsMode:     'visit' | 'amount'
  pointsPerAmount: number
  pointsAmountUnit: number         // 0 = todavía no elegido (se pone según la moneda)
  rewardMode:     RewardMode
  rewardValue:    string
  rewardOptions:  string[]        // si el cliente elige: las opciones del negocio (2 al máximo del plan)
  brandColor:     string
  brandLogo:      string | null
}

// ─── Sector → card recommendation ────────────────────────────────────────────
const SECTOR_CARD: Record<string, CardType> = {
  cafe: 'stamp', restaurant: 'stamp', hair: 'membership',
  gym: 'points', bakery: 'stamp', spa: 'points',
  clothing: 'membership', bookstore: 'stamp', carniceria: 'stamp', other: 'stamp',
}

// Sugerencias de premio por rubro para "El cliente elige su premio". Son un
// punto de partida: el dueño las edita, saca o agrega (2 a 6).
const SECTOR_REWARD_SUGGESTIONS: Record<string, string[]> = {
  cafe:       ['Café gratis', 'Medialuna', 'Algo dulce'],
  restaurant: ['Postre gratis', 'Bebida gratis', '10% de descuento'],
  hair:       ['Corte gratis', 'Lavado y peinado', 'Tratamiento capilar'],
  gym:        ['Clase gratis', 'Batido', 'Día de invitado'],
  bakery:     ['Factura gratis', 'Café con medialuna', 'Porción de torta'],
  spa:        ['Masaje de 30 min', 'Limpieza facial', 'Manicura'],
  clothing:   ['10% de descuento', 'Accesorio de regalo', 'Envío gratis'],
  bookstore:  ['Libro de regalo', 'Señalador', '10% de descuento'],
  carniceria: ['Chorizos de regalo', 'Carbón de regalo', '10% de descuento'],
  other:      ['10% de descuento', 'Producto de regalo', 'Servicio gratis'],
}

// Pasos según el programa: en puntos y membresía el paso 4 (premio) no
// tiene nada que elegir, así que se saltea (antes era una pantalla de
// "Entendido, seguir").
function stepsFor(cardType: CardType): number[] {
  return cardType === 'stamp' ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 5, 6]
}

const STORAGE_KEY = 'stampa_onboarding_v1'

const SECTOR_STAMPS: Record<string, number> = {
  cafe: 8, restaurant: 8, bakery: 6, bookstore: 10, carniceria: 8,
  hair: 8, gym: 10, spa: 10, clothing: 8, other: 8,
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const IcoCheck = () => <Icon name="listo" size={14} />
const IcoArrowR = () => <Icon name="siguiente" size={16} />
const IcoArrowL = () => <Icon name="anterior" size={16} />

const SECTORS = [
  { id: 'cafe',      label: 'Cafetería / Bar',        icon: <Icon name="cafe" size={20} /> },
  { id: 'restaurant',label: 'Restaurante',             icon: <Icon name="restaurante" size={20} /> },
  { id: 'hair',      label: 'Peluquería / Barbería',   icon: <Icon name="peluqueria" size={20} /> },
  { id: 'gym',       label: 'Gym / Fitness',           icon: <Icon name="gym" size={20} /> },
  { id: 'bakery',    label: 'Panadería / Pastelería',  icon: <Icon name="panaderia" size={20} /> },
  { id: 'spa',       label: 'Spa / Belleza',           icon: <Icon name="spa" size={20} /> },
  { id: 'clothing',  label: 'Ropa / Indumentaria',     icon: <Icon name="ropa" size={20} /> },
  { id: 'bookstore', label: 'Librería',                icon: <Icon name="libreria" size={20} /> },
  { id: 'carniceria', label: 'Carnicería / Almacén',  icon: <Icon name="carniceria" size={20} /> },
  { id: 'other',     label: 'Otro rubro',              icon: <Icon name="negocio" size={20} /> },
]


// ─── Step info (left panel content) ──────────────────────────────────────────
const STEP_INFO: Record<number, { title: string; subtitle: string }> = {
  1: {
    title: 'Contanos sobre tu negocio',
    subtitle: 'Nombre y rubro. Con esto configuramos todo lo demás.',
  },
  2: {
    title: '¿Qué tipo de programa querés?',
    subtitle: 'Te recomendamos uno según tu rubro, pero podés elegir el que quieras.',
  },
  3: {
    title: 'Configurá tu programa',
    subtitle: 'Definí los parámetros del programa de fidelización.',
  },
  4: {
    title: '¿Cómo se define el premio?',
    subtitle: 'Decidí quién elige el premio al completar la tarjeta.',
  },
  5: {
    title: 'Dale identidad a tu tarjeta',
    subtitle: 'El logo y el color se muestran en la tarjeta que tus clientes guardan en el Wallet.',
  },
  6: {
    title: '¡Casi listo!',
    subtitle: 'Así queda tu tarjeta. Esto es lo que van a ver tus clientes.',
  },
}

// Colores: lib/colorPresets.ts (paleta sugerida; color libre en todos los planes).


// ─── QR code ──────────────────────────────────────────────────────────────────

// ─── Nav buttons ──────────────────────────────────────────────────────────────
function Nav({ onBack, onNext, nextLabel = 'Siguiente', disabled = false, showSkip = false, onSkip }: {
  onBack: () => void; onNext: () => void; nextLabel?: string; disabled?: boolean; showSkip?: boolean; onSkip?: () => void
}) {
  return (
    <div className="ob-nav">
      <button className="s-btn s-btn--secondary" onClick={onBack}>
        <IcoArrowL /> Atrás
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {showSkip && <button className="s-btn s-btn--text" onClick={onSkip}>Saltear</button>}
        <button className="s-btn s-btn--primary" onClick={onNext} disabled={disabled}>
          {nextLabel} <IcoArrowR />
        </button>
      </div>
    </div>
  )
}

// ─── Steps ────────────────────────────────────────────────────────────────────
function Step1({ state, onChange, onNext }: { state: OBState; onChange: (p: Partial<OBState>) => void; onNext: () => void }) {
  return (
    <div className="ob-step">
      <div className="ob-action-label">Empecemos con lo básico</div>
      <input
        className="ob-input"
        placeholder="Nombre del negocio"
        value={state.businessName}
        onChange={e => onChange({ businessName: e.target.value })}
        autoFocus
      />

      <div className="ob-section-label">¿En qué rubro trabajás?</div>
      <div className="ob-sector-grid">
        {SECTORS.map(s => (
          <button key={s.id}
            className={`ob-sector-btn${state.sector === s.id ? ' ob-sector-btn--on' : ''}`}
            onClick={() => onChange({ sector: s.id, cardType: SECTOR_CARD[s.id], stampsRequired: SECTOR_STAMPS[s.id] || 8 })}
          >
            <span className="ob-sector-icon">{s.icon}</span>
            <span className="ob-sector-label">{s.label}</span>
            {state.sector === s.id && <span className="ob-sector-check"><IcoCheck /></span>}
          </button>
        ))}
      </div>

      <div className="ob-nav" style={{ marginTop: 28 }}>
        <div />
        <button className="s-btn s-btn--primary" onClick={onNext} disabled={!state.businessName.trim() || !state.sector}>
          Siguiente <IcoArrowR />
        </button>
      </div>
    </div>
  )
}

function Step2({ state, onChange, onNext, onBack }: { state: OBState; onChange: (p: Partial<OBState>) => void; onNext: () => void; onBack: () => void }) {
  const recommendedType = SECTOR_CARD[state.sector] || 'stamp'
  const sectorLabel = SECTORS.find(s => s.id === state.sector)?.label || ''

  const CARD_TYPES: Array<{ id: CardType; name: string; desc: string; reason: string }> = [
    { id: 'stamp',      name: 'Tarjeta de sellos',   desc: 'Sellos por visita · Premio al completar', reason: 'Ideal para negocios de consumo frecuente. Simple y efectivo.' },
    { id: 'points',     name: 'Puntos',              desc: 'Por visita o por monto de la compra · Catálogo de premios', reason: 'Perfecto cuando tenés múltiples servicios o distintos precios.' },
    { id: 'membership', name: 'Membresía por niveles', desc: 'Bronce → Plata → Oro → Black', reason: 'Genera exclusividad. Tus mejores clientes sienten que progresan.' },
  ]

  return (
    <div className="ob-step">
      <div className="ob-action-label">Elegí el que mejor se adapta a tu negocio</div>
      <div className="ob-card-types">
        {CARD_TYPES.map(ct => {
          const isRec = ct.id === recommendedType
          const isOn  = state.cardType === ct.id
          return (
            <button key={ct.id}
              className={`ob-type-card${isOn ? ' ob-type-card--on' : ''}${isRec ? ' ob-type-card--rec' : ''}`}
              onClick={() => onChange({ cardType: ct.id })}
            >
              <div className="ob-type-left">
                <div className="ob-type-name">{ct.name}</div>
                <div className="ob-type-desc">{ct.desc}</div>
                {isRec && <div className="ob-type-rec-note">{ct.reason}</div>}
              </div>
              <div className="ob-type-right">
                {isRec && <div className="ob-rec-badge">Recomendado para {sectorLabel}</div>}
                <div className={`ob-radio${isOn ? ' ob-radio--on' : ''}`}>
                  {isOn && <div className="ob-radio-dot" />}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <Nav onBack={onBack} onNext={onNext} />
    </div>
  )
}

type StepProps = { state: OBState; onChange: (p: Partial<OBState>) => void; onNext: () => void; onBack: () => void }

const MEMBERSHIP_TIERS = [
  { name: 'Bronce', threshold: 0,  perk: 'Bienvenida',             color: '#854F0B', bg: '#FAEEDA' },
  { name: 'Plata',  threshold: 10, perk: '5% de descuento',        color: '#444441', bg: '#EAEAEA' },
  { name: 'Oro',    threshold: 25, perk: 'Regalo de cumpleaños',   color: '#633806', bg: '#FAC775' },
  { name: 'Black',  threshold: 50, perk: 'Beneficios exclusivos',  color: '#F7F0E4', bg: '#1A1A18' },
]


function Step3({ state, onChange, onNext, onBack, currency }: StepProps & { currency: Currency }) {
  const actionLabels: Record<CardType, string> = {
    stamp: '¿Cuántas visitas para completar la tarjeta?',
    points: '¿Cómo suman puntos tus clientes?',
    membership: 'Tu programa tiene 4 niveles automáticos',
  }
  const rule: PointsRuleValue = { pointsMode: state.pointsMode, pointsPerVisit: state.pointsPerVisit, pointsPerAmount: state.pointsPerAmount, pointsAmountUnit: state.pointsAmountUnit || DEFAULT_UNIT[currency] }
  const pointsOk = pointsRuleValid(rule)
  return (
    <div className="ob-step">
      <div className="ob-action-label">{actionLabels[state.cardType]}</div>
      {state.cardType === 'stamp' && (
        <>
          <div className="ob-stamp-grid">
            {[4,6,8,10,12].map(n => (
              <button key={n} className={`ob-stamp-btn${state.stampsRequired === n ? ' ob-stamp-btn--on' : ''}`}
                onClick={() => onChange({ stampsRequired: n })}>
                <span className="ob-stamp-num">{n}</span>
                <span className="ob-stamp-sub">visitas</span>
              </button>
            ))}
          </div>
        </>
      )}
      {state.cardType === 'points' && (
        <>
          <PointsRuleEditor value={rule} onChange={v => onChange(v)} currency={currency} />
          <p className="ob-note">Los premios (ej: café gratis por 100 puntos) los cargás después en Premios.</p>
        </>
      )}
      {state.cardType === 'membership' && (
        <div className="ob-tiers">
          {MEMBERSHIP_TIERS.map(t => (
            <div key={t.name} className="ob-tier-row">
              <div className="ob-tier-badge" style={{ background: t.bg, color: t.color }}>★ {t.name}</div>
              <div className="ob-tier-info">
                <span className="ob-tier-name">{t.perk}</span>
                <span className="ob-tier-threshold">{t.threshold === 0 ? 'Nivel inicial · automático' : `Desde ${t.threshold} visitas`}</span>
              </div>
            </div>
          ))}
          <p className="ob-note">Nombres, visitas y beneficios los podés cambiar después en Premios.</p>
        </div>
      )}
      <Nav onBack={onBack} onNext={onNext} disabled={state.cardType === 'points' && !pointsOk} />
    </div>
  )
}

function Step4({ state, onChange, onNext, onBack, plan }: StepProps & { plan: string }) {
  const [draft, setDraft] = useState('')
  const maxOpts = PLAN_LIMITS[plan as Plan]?.maxRewardOptions ?? 3
  // Primera vez en "El cliente elige": arranca con las sugerencias del rubro.
  useEffect(() => {
    if (state.rewardMode === 'customer' && state.rewardOptions.length === 0) {
      onChange({ rewardOptions: SECTOR_REWARD_SUGGESTIONS[state.sector] || SECTOR_REWARD_SUGGESTIONS.other })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.rewardMode])

  const options = state.rewardOptions
  const cleanDraft = draft.trim()
  const canAdd = cleanDraft.length > 0 && cleanDraft.length <= 40 && options.length < maxOpts && !options.some(o => o.toLowerCase() === cleanDraft.toLowerCase())
  function addOption() {
    if (!canAdd) return
    onChange({ rewardOptions: [...options, cleanDraft] })
    setDraft('')
  }
  const valid = state.rewardMode === 'customer' ? options.length >= 2 && options.length <= maxOpts : state.rewardValue.trim().length > 0

  return (
    <div className="ob-step">
      <div className="ob-action-label">Al completar las {state.stampsRequired} visitas, ¿qué recibe el cliente?</div>
      <div className="ob-reward-opts">
        <div className={`ob-reward-opt${state.rewardMode === 'customer' ? ' ob-reward-opt--on' : ''}`}
          onClick={() => onChange({ rewardMode: 'customer' })}>
          <div className={`ob-radio${state.rewardMode === 'customer' ? ' ob-radio--on' : ''}`}>
            {state.rewardMode === 'customer' && <div className="ob-radio-dot" />}
          </div>
          <div>
            <div className="ob-reward-title">El cliente elige su premio</div>
            <div className="ob-reward-desc">Vos definís las opciones y el cliente elige una al registrarse. Al completar la tarjeta, el scanner ve cuál eligió.</div>
          </div>
        </div>
        {state.rewardMode === 'customer' && (
          <div className="ob-reward-options">
            <div className="ob-chips">
              {options.map(o => (
                <span key={o} className="ob-chip">
                  {o}
                  <button type="button" aria-label={`Quitar ${o}`} onClick={() => onChange({ rewardOptions: options.filter(x => x !== o) })}>×</button>
                </span>
              ))}
            </div>
            {options.length < maxOpts && (
              <div className="ob-chip-add">
                <input className="ob-input" placeholder="Agregar otra opción…" value={draft} maxLength={40}
                  onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOption() } }} />
                <button type="button" className="ob-chip-add-btn" onClick={addOption} disabled={!canAdd}>Agregar</button>
              </div>
            )}
            <div className="ob-chip-note">{options.length < 2 ? 'Cargá al menos 2 opciones.' : `${options.length} de ${maxOpts} opciones de tu plan.`}</div>
          </div>
        )}
        <div className={`ob-reward-opt${state.rewardMode === 'fixed' ? ' ob-reward-opt--on' : ''}`}
          onClick={() => onChange({ rewardMode: 'fixed' })}>
          <div className={`ob-radio${state.rewardMode === 'fixed' ? ' ob-radio--on' : ''}`}>
            {state.rewardMode === 'fixed' && <div className="ob-radio-dot" />}
          </div>
          <div>
            <div className="ob-reward-title">Yo defino el premio</div>
            <div className="ob-reward-desc">El mismo premio para todos los clientes.</div>
          </div>
        </div>
      </div>
      {state.rewardMode === 'fixed' && (
        <input className="ob-input" style={{ marginTop: 12 }} maxLength={60}
          placeholder="Ej: Café gratis, 10% de descuento..."
          value={state.rewardValue} onChange={e => onChange({ rewardValue: e.target.value })} />
      )}
      <Nav onBack={onBack} onNext={onNext} disabled={!valid} />
    </div>
  )
}

// Achica el logo en el navegador antes de subirlo (máx. 512 px, PNG para
// conservar la transparencia): una foto del celular de varios MB hacía
// fallar el paso final.
async function compressLogo(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('El archivo tiene que ser una imagen (PNG o JPG).')
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = () => reject(new Error('No pudimos leer esa imagen. Probá con otra.'))
      i.src = url
    })
    const scale = Math.min(1, 512 / Math.max(img.width, img.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/png')
  } finally {
    URL.revokeObjectURL(url)
  }
}

function Step5({ state, onChange, onNext, onBack, plan }: StepProps & { plan: string }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [logoError, setLogoError] = useState<string | null>(null)
  const presets = presetsForPlan(plan)
  const logoColors = useLogoColors(state.brandLogo)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setLogoError(null)
    try { onChange({ brandLogo: await compressLogo(file) }) }
    catch (err: any) { setLogoError(err.message) }
    e.target.value = ''
  }
  const planNote = 'Elegí uno de la paleta o cualquier color. Después lo podés cambiar en Diseño.'

  return (
    <div className="ob-step">
      <div className="ob-action-label">El logo y el color aparecen en la tarjeta digital</div>
      <div className="ob-brand-row">
        <div>
          <div className="ob-brand-label">Logo del negocio</div>
          <div className="ob-logo-zone" onClick={() => fileRef.current?.click()}>
            {state.brandLogo
              ? <img src={state.brandLogo} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} alt="" />
              : <>
                  <Icon name="subir" size={20} className="ob-ic-faint" />
                  <span className="ob-logo-hint">Subir logo</span>
                </>
            }
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFile} style={{ display: 'none' }} />
          </div>
          {state.brandLogo && <button className="ob-logo-remove" onClick={() => onChange({ brandLogo: null })}>Quitar</button>}
          {logoError && <div className="ob-field-error">{logoError}</div>}
          <div className="ob-logo-note">PNG con fondo transparente se ve mejor.</div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="ob-brand-label">Color de la tarjeta</div>
          {logoColors.length > 0 && (<>
            <div className="ob-color-sub">De tu logo</div>
            <div className="ob-color-row">
              {logoColors.map(c => (
                <button key={c} title={c} aria-label={c}
                  className={`ob-color-dot${state.brandColor.toLowerCase() === c.toLowerCase() ? ' ob-color-dot--on' : ''}`}
                  style={{ background: c }} onClick={() => onChange({ brandColor: c })} />
              ))}
            </div>
            <div className="ob-color-sub">Sugeridos</div>
          </>)}
          <div className="ob-color-row">
            {presets.map(c => (
              <button key={c.start} title={c.label} aria-label={c.label}
                className={`ob-color-dot${state.brandColor.toLowerCase() === c.start.toLowerCase() ? ' ob-color-dot--on' : ''}`}
                style={{ background: c.start }} onClick={() => onChange({ brandColor: c.start })} />
            ))}
          </div>
          <div className="ob-custom-color">
            <span className="ob-hex-label">Otro color</span>
            <ColorField ariaLabel="Color de la tarjeta" value={state.brandColor} logoColors={logoColors}
              suggestions={presets.map(p => ({ hex: p.start, label: p.label }))} onChange={v => v && onChange({ brandColor: v })} />
          </div>
          <p className="ob-note" style={{ marginTop: 16 }}>{planNote}</p>
        </div>
      </div>
      <Nav onBack={onBack} onNext={onNext} nextLabel="Ver mi tarjeta" showSkip={!state.brandLogo} onSkip={onNext} />
    </div>
  )
}

function Step6({ state, onBack, onFinish, finishing, error, currency }: { state: OBState; onBack: () => void; onFinish: () => void; finishing: boolean; error: string | null; currency: Currency }) {
  const [platform, setPlatform] = useState<'apple' | 'google'>('apple')
  // Las imágenes reales del pase (las mismas que va a tener la tarjeta).
  const [images, setImages] = useState<PassImages | null>(null)
  const [previewError, setPreviewError] = useState(false)
  useEffect(() => {
    let cancelled = false
    apiOnboardingPreview({ design: {
      type: state.cardType, name: state.businessName || 'Tu tarjeta', color: state.brandColor, secondColor: darkenHex(state.brandColor),
      logoUrl: state.brandLogo, stampsRequired: state.stampsRequired, pointsMode: state.pointsMode, pointsPerVisit: state.pointsPerVisit,
      pointsPerAmount: state.pointsPerAmount, pointsAmountUnit: state.pointsAmountUnit || DEFAULT_UNIT[currency],
    } }).then(r => { if (!cancelled) setImages(r as PassImages) }).catch(() => { if (!cancelled) setPreviewError(true) })
    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const rewardLabel = state.rewardMode === 'customer' ? (state.rewardOptions[0] || 'Lo que el cliente elija') : (state.rewardValue || 'Premio')
  const sectorLabel = SECTORS.find(s => s.id === state.sector)?.label || ''
  const premio = state.cardType === 'stamp'
    ? (state.rewardMode === 'customer' ? `El cliente elige: ${state.rewardOptions.join(', ')}` : state.rewardValue || '—')
    : state.cardType === 'points' ? 'Catálogo de premios (lo cargás en Premios)' : 'Beneficios por nivel'
  return (
    <div className="ob-step ob-step--wide">
      <div className="ob-action-label">Así la van a ver tus clientes en su Wallet</div>
      <div className="ob-final-layout">
        <div className="ob-final-pass">
          <div className="ob-platform-switch">
            <button className={`ob-platform-btn${platform === 'apple' ? ' ob-platform-btn--on' : ''}`} onClick={() => setPlatform('apple')}>Apple Wallet</button>
            <button className={`ob-platform-btn${platform === 'google' ? ' ob-platform-btn--on' : ''}`} onClick={() => setPlatform('google')}>Google Wallet</button>
          </div>
          <PassPreview platform={platform} type={state.cardType} images={images} color={state.brandColor}
            businessName={state.businessName || 'Tu negocio'} cardName={state.businessName || 'Tu tarjeta'} rewardLabel={rewardLabel}
            tier={state.cardType === 'membership' ? MEMBERSHIP_TIERS[0] : null} />
          <div className="ob-preview-note">{previewError ? 'No pudimos cargar la vista previa. Tu tarjeta se crea igual.' : platform === 'apple' ? 'Así se ve en un iPhone, con un cliente de ejemplo.' : 'Así se ve en Google Wallet (Android), con un cliente de ejemplo.'}</div>
        </div>
        <div className="ob-summary">
          <div className="ob-summary-title">Resumen del programa</div>
          {[
            { label: 'Negocio',   val: state.businessName || '—' },
            { label: 'Rubro',     val: sectorLabel || '—' },
            { label: 'Programa',  val: state.cardType === 'stamp' ? `Sellos (${state.stampsRequired} visitas)` : state.cardType === 'points' ? `Puntos (${pointsRuleText({ ...state, pointsAmountUnit: state.pointsAmountUnit || DEFAULT_UNIT[currency] }, currency)})` : 'Membresía (4 niveles)' },
            { label: 'Premio',    val: premio },
          ].map(({ label, val }) => (
            <div key={label} className="ob-summary-row">
              <span className="ob-summary-label">{label}</span>
              <span className="ob-summary-val">{val}</span>
            </div>
          ))}
          <div className="ob-summary-note">Todo esto se puede editar desde el panel cuando quieras.</div>
          {error && <div className="ob-finish-error">{error}</div>}
          <button className="s-btn s-btn--primary ob-finish-btn" onClick={onFinish} disabled={finishing}>
            {finishing ? 'Creando tu negocio…' : <>Ir a mi panel <IcoArrowR /></>}
          </button>
        </div>
      </div>
      <div className="ob-nav" style={{ marginTop: 28 }}>
        <button className="s-btn s-btn--secondary" onClick={onBack} disabled={finishing}><IcoArrowL /> Atrás</button>
        <div />
      </div>
    </div>
  )
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = PASS_CSS + `
  .ob-ic-faint { color: var(--s-tinta-3); }
  :root { --font-d: var(--font-display); --font-b: var(--font-body); }
  *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; -webkit-tap-highlight-color:transparent; }
  html, body { max-width:100vw; overflow-x:hidden; }
  body { font-family:var(--font-b); background:var(--s-salvia); color:var(--s-tinta); }
  button, a { -webkit-tap-highlight-color:transparent; touch-action:manipulation; }
  button:focus { outline:none; }
  button:focus-visible { outline:2px solid rgba(199,93,58,.35); outline-offset:2px; }
  .ob-wrap { min-height:100vh; min-height:100dvh; background:#E4E6E0; padding:12px; }
  .ob-frame { max-width:1240px; margin:0 auto; background:#F7F7F4; border-radius:28px; padding:14px; }
  .ob-top { display:flex; align-items:center; gap:16px; background:#fff; border-radius:999px; padding:10px 20px; margin-bottom:12px; }
  .ob-top img { height:18px; width:auto; display:block; flex-shrink:0; }
  .ob-prog { flex:1; height:6px; border-radius:3px; background:var(--s-salvia); overflow:hidden; }
  .ob-prog i { display:block; height:100%; background:var(--s-pino); border-radius:3px; transition:width .25s cubic-bezier(.2,.8,.2,1); }
  .ob-top span { font-size:13px; color:rgba(34,32,27,.62); white-space:nowrap; font-variant-numeric:tabular-nums; }
  .ob-grid { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,.8fr); gap:12px; align-items:start; }
  .ob-grid--wide { grid-template-columns:minmax(0,1fr); }
  .ob-main { background:#fff; border-radius:20px; padding:clamp(22px,4vw,48px); min-width:0; min-height:calc(100vh - 140px); }
  .ob-main-in { width:100%; max-width:520px; margin:0 auto; display:flex; flex-direction:column; }
  .ob-grid--wide .ob-main-in { max-width:720px; }
  .ob-title { font-family:var(--font-d); font-weight:800; font-size:clamp(26px,3vw,34px); letter-spacing:-.03em; line-height:1.05; color:var(--s-tinta); }
  .ob-subtitle { font-size:15px; color:rgba(34,32,27,.62); line-height:1.55; margin:10px 0 28px; }
  .ob-side { position:sticky; top:12px; background:var(--s-salvia); border-radius:20px; padding:32px 24px; display:flex; flex-direction:column; align-items:center; gap:16px; min-height:calc(100vh - 140px); justify-content:center; }
  .ob-side p { font-size:14px; color:rgba(34,32,27,.62); text-align:center; }
  .ob-note { font-size:13px; color:rgba(34,32,27,.55); margin-top:16px; line-height:1.5; }
  /* Content */
  .ob-content { flex:1; display:flex; align-items:flex-start; justify-content:center; padding:48px 24px 32px; }
  .ob-step { width:100%; display:flex; flex-direction:column; }
  .ob-action-label { font-family:var(--font-d); font-size:15px; font-weight:700; color:var(--s-tinta); margin-bottom:16px; line-height:1.35; }
  /* Nav */
  .ob-nav { display:flex; align-items:center; justify-content:space-between; margin-top:24px; }
  /* Input */
  .ob-input { width:100%; padding:14px 16px; font-size:16px; font-weight:600; border:2px solid rgba(34,32,27,.12); border-radius:12px; background:#fff; color:var(--s-tinta); font-family:var(--font-d); outline:none; transition:border-color .15s; margin-bottom:24px; }
  .ob-input:focus { border-color:var(--s-pino); }
  /* Sector */
  .ob-sector-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
  .ob-sector-btn { display:flex; align-items:center; gap:14px; padding:16px 18px; background:#fff; border:2px solid rgba(34,32,27,.1); border-radius:13px; cursor:pointer; transition:all .15s; text-align:left; position:relative; box-shadow:none; }
  .ob-sector-btn:hover { border-color:rgba(34,32,27,.25); background:var(--s-salvia); }
  .ob-sector-btn--on { border-color:var(--s-pino); background:rgba(27,65,47,.07); }
  .ob-sector-icon { color:rgba(34,32,27,.5); flex-shrink:0; }
  .ob-sector-btn--on .ob-sector-icon { color:var(--s-pino); }
  .ob-sector-label { font-size:12.5px; font-weight:600; color:var(--s-tinta); line-height:1.3; }
  .ob-sector-check { position:absolute; top:-9px; right:-9px; width:22px; height:22px; border-radius:50%; background:var(--s-pino); display:flex; align-items:center; justify-content:center; color:#fff; border:2.5px solid #fff; }
  /* Card types */
  .ob-card-types { display:flex; flex-direction:column; gap:10px; }
  .ob-type-card { display:flex; align-items:flex-start; justify-content:space-between; gap:14px; padding:16px 18px; background:#fff; border:2px solid rgba(34,32,27,.1); border-radius:14px; cursor:pointer; transition:all .15s; text-align:left; }
  .ob-type-card:hover { border-color:rgba(34,32,27,.25); }
  .ob-type-card--on { border-color:var(--s-pino); background:rgba(27,65,47,.06); }
  .ob-type-card--rec:not(.ob-type-card--on) { border-color:rgba(199,93,58,.3); border-style:dashed; }
  .ob-type-name { font-size:15px; font-weight:700; color:var(--s-tinta); margin-bottom:4px; }
  .ob-type-desc { font-size:12px; color:rgba(34,32,27,.5); }
  .ob-type-rec-note { font-size:12px; color:rgba(34,32,27,.65); margin-top:6px; line-height:1.5; }
  .ob-type-right { display:flex; flex-direction:column; align-items:flex-end; gap:10px; flex-shrink:0; }
  .ob-rec-badge { font-size:9.5px; font-weight:700; background:var(--s-brasa); color:#fff; padding:3px 10px; border-radius:20px; white-space:nowrap; }
  .ob-radio { width:20px; height:20px; border-radius:50%; border:2px solid rgba(34,32,27,.2); flex-shrink:0; display:flex; align-items:center; justify-content:center; margin-top:2px; }
  .ob-radio--on { border-color:var(--s-pino); }
  .ob-radio-dot { width:10px; height:10px; border-radius:50%; background:var(--s-pino); }
  /* Stamps */
  .ob-stamp-grid { display:flex; gap:10px; flex-wrap:wrap; }
  .ob-stamp-btn { display:flex; flex-direction:column; align-items:center; gap:4px; width:76px; padding:14px 0; background:#fff; border:2px solid rgba(34,32,27,.12); border-radius:14px; cursor:pointer; transition:all .15s; font-family:var(--font-d); }
  .ob-stamp-btn:hover { border-color:rgba(34,32,27,.3); }
  .ob-stamp-btn--on { border-color:var(--s-pino); background:var(--s-pino); color:#fff; }
  .ob-stamp-num { font-size:26px; font-weight:800; }
  .ob-stamp-sub { font-size:9px; opacity:.7; }
  .ob-section-label { font-size:13px; font-weight:600; color:var(--s-tinta); margin:24px 0 12px; }
  .ob-hint-old { display:flex; align-items:center; gap:10px; font-size:12.5px; color:rgba(34,32,27,.55); margin-top:18px; background:rgba(34,32,27,.045); padding:11px 16px; border-radius:11px; line-height:1.5; }
  /* Points */
  .ob-pts-input { width:88px; padding:10px; font-size:24px; font-weight:800; text-align:center; border:2px solid rgba(34,32,27,.12); border-radius:12px; background:#fff; color:var(--s-tinta); font-family:var(--font-d); outline:none; }
  .ob-pts-input:focus { border-color:var(--s-brasa); }
  .ob-pts-lbl { font-size:15px; color:rgba(34,32,27,.6); }
  /* Tiers */
  .ob-tiers { display:flex; flex-direction:column; gap:8px; }
  .ob-tier-row { display:flex; align-items:center; gap:12px; padding:12px 16px; background:#fff; border:1px solid rgba(34,32,27,.08); border-radius:12px; }
  .ob-tier-badge { font-size:11px; font-weight:700; padding:4px 12px; border-radius:20px; flex-shrink:0; }
  .ob-tier-info { display:flex; flex-direction:column; gap:2px; }
  .ob-tier-name { font-size:13px; font-weight:600; color:var(--s-tinta); }
  .ob-tier-threshold { font-size:11px; color:rgba(34,32,27,.45); }
  /* Info box */
  .ob-info-box { display:flex; align-items:center; gap:14px; padding:16px 18px; background:rgba(199,93,58,.07); border:1px solid rgba(199,93,58,.2); border-radius:14px; font-size:13px; color:rgba(34,32,27,.75); line-height:1.6; }
  /* Reward */
  .ob-reward-opts { display:flex; flex-direction:column; gap:10px; }
  .ob-reward-opt { display:flex; align-items:flex-start; gap:14px; padding:16px 18px; background:#fff; border:2px solid rgba(34,32,27,.1); border-radius:14px; cursor:pointer; transition:all .15s; }
  .ob-reward-opt:hover { border-color:rgba(34,32,27,.25); }
  .ob-reward-opt--on { border-color:var(--s-pino); background:rgba(27,65,47,.06); }
  .ob-reward-title { font-size:14px; font-weight:700; color:var(--s-tinta); margin-bottom:4px; }
  .ob-reward-desc { font-size:12px; color:rgba(34,32,27,.55); line-height:1.5; }
  /* Branding */
  .ob-brand-row { display:flex; gap:24px; align-items:flex-start; margin-bottom:8px; }
  .ob-brand-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:rgba(34,32,27,.45); margin-bottom:10px; }
  .ob-logo-zone { width:90px; height:90px; border:2px dashed rgba(34,32,27,.2); border-radius:14px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; cursor:pointer; transition:all .15s; background:#fff; overflow:hidden; }
  .ob-logo-zone:hover { border-color:var(--s-brasa); }
  .ob-logo-hint { font-size:10px; color:rgba(34,32,27,.4); }
  .ob-logo-remove { font-size:11px; color:var(--s-error); background:none; border:none; cursor:pointer; margin-top:6px; }
  .ob-color-sub { font-size:11px; color:rgba(34,32,27,.5); margin:4px 0 8px; }
  .ob-color-row { display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-bottom:8px; }
  .ob-color-dot { width:32px; height:32px; border-radius:50%; border:2.5px solid transparent; cursor:pointer; transition:all .15s; }
  .ob-color-dot--on { border-color:var(--s-tinta); transform:scale(1.1); }
  /* Final */
  .ob-final-layout { display:flex; gap:32px; align-items:flex-start; flex-wrap:wrap; width:100%; }
  .ob-final-pass { width:300px; max-width:100%; flex-shrink:0; order:2; }
  .ob-summary { order:1; }
  .ob-platform-switch { display:flex; gap:20px; margin-bottom:18px; }
  .ob-platform-btn { font-size:13px; color:rgba(34,32,27,.4); background:none; border:none; cursor:pointer; padding-bottom:6px; border-bottom:2.5px solid transparent; font-family:var(--font-b); transition:all .15s; }
  .ob-platform-btn--on { color:var(--s-tinta); border-bottom-color:var(--s-brasa); font-weight:600; }
  .ob-preview-note { font-size:11px; color:rgba(34,32,27,.4); text-align:center; margin-top:14px; }
  .ob-summary { background:#fff; border:1px solid rgba(34,32,27,.08); border-radius:16px; padding:22px; min-width:240px; flex:1; box-shadow:0 2px 12px rgba(34,32,27,.06); }
  .ob-summary-title { font-family:var(--font-d); font-weight:700; font-size:15px; color:var(--s-tinta); margin-bottom:14px; }
  .ob-summary-row { display:flex; justify-content:space-between; align-items:flex-start; padding:10px 0; border-bottom:1px solid rgba(34,32,27,.06); gap:16px; }
  .ob-summary-row:last-of-type { border-bottom:none; }
  .ob-summary-label { font-size:12px; color:rgba(34,32,27,.45); flex-shrink:0; }
  .ob-summary-val { font-size:12.5px; font-weight:600; color:var(--s-tinta); text-align:right; }
  .ob-summary-note { font-size:11px; color:rgba(34,32,27,.4); margin-top:14px; padding-top:12px; border-top:1px solid rgba(34,32,27,.07); line-height:1.5; }
  .ob-finish-btn { width:100%; padding:13px 16px; }

  .ob-loading { padding:40px 0; color:rgba(34,32,27,.45); font-size:14px; }
  .ob-stepper-row { display:flex; align-items:center; gap:14px; margin-top:14px; }
  .ob-stepper-lbl { font-size:13px; color:rgba(34,32,27,.55); }
  .ob-stepper { display:inline-flex; align-items:center; border:1.5px solid rgba(34,32,27,.12); border-radius:12px; overflow:hidden; background:#fff; }
  .ob-stepper button { width:40px; height:40px; border:none; background:var(--s-salvia); font-size:18px; font-weight:700; color:var(--s-tinta); cursor:pointer; }
  .ob-stepper button:disabled { opacity:.35; cursor:not-allowed; }
  .ob-stepper input { width:64px; height:40px; border:none; text-align:center; font-size:15px; font-weight:700; color:var(--s-tinta); font-family:var(--font-b); outline:none; -moz-appearance:textfield; }
  .ob-stepper input::-webkit-outer-spin-button, .ob-stepper input::-webkit-inner-spin-button { -webkit-appearance:none; margin:0; }
  .ob-reward-options { margin:-2px 0 10px 34px; }
  .ob-chips { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:10px; }
  .ob-chip { display:inline-flex; align-items:center; gap:6px; background:rgba(199,93,58,.1); color:var(--s-brasa-2); border-radius:999px; padding:7px 8px 7px 13px; font-size:13px; font-weight:600; }
  .ob-chip button { border:none; background:rgba(158,69,41,.15); color:var(--s-brasa-2); width:20px; height:20px; border-radius:50%; cursor:pointer; font-size:14px; line-height:1; }
  .ob-chip-add { display:flex; gap:8px; }
  .ob-chip-add .ob-input { margin:0; }
  .ob-chip-add-btn { flex-shrink:0; border:1.5px solid rgba(34,32,27,.15); background:#fff; border-radius:12px; padding:0 16px; font-weight:700; font-size:13px; cursor:pointer; color:var(--s-tinta); }
  .ob-chip-add-btn:disabled { opacity:.4; cursor:not-allowed; }
  .ob-chip-note { font-size:11.5px; color:rgba(34,32,27,.45); margin-top:6px; }
  .ob-custom-color { display:flex; align-items:center; gap:10px; margin-top:14px; }
  .ob-custom-swatch { position:relative; width:34px; height:34px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 0 1.5px rgba(34,32,27,.15); cursor:pointer; overflow:hidden; }
  .ob-custom-swatch input { position:absolute; inset:0; opacity:0; cursor:pointer; }
  .ob-hex-input { width:96px; padding:8px 10px; border:1.5px solid rgba(34,32,27,.12); border-radius:10px; font-family:monospace; font-size:13px; background:var(--s-salvia); color:var(--s-tinta); outline:none; }
  .ob-hex-label { font-size:12px; color:rgba(34,32,27,.5); }
  .ob-field-error { font-size:11.5px; color:var(--s-error); margin-top:6px; max-width:140px; line-height:1.4; }
  .ob-logo-note { font-size:11px; color:rgba(34,32,27,.4); margin-top:6px; max-width:140px; line-height:1.4; }
  .ob-finish-error { margin-top:14px; padding:10px 12px; border-radius:10px; background:rgba(178,59,59,.08); color:var(--s-error); font-size:12.5px; font-weight:600; line-height:1.5; }
  @media (max-width:860px) {
    .ob-wrap { padding:6px; }
    .ob-frame { border-radius:22px; padding:10px; }
    .ob-top { padding:9px 16px; gap:12px; }
    .ob-grid { grid-template-columns:1fr; }
    .ob-main { min-height:0; padding:22px 18px calc(28px + env(safe-area-inset-bottom)); }
    .ob-side { order:-1; position:static; min-height:0; padding:18px; }
    .ob-side .l2-pass { --pw:150px !important; }
    .ob-side .l2-p-qr, .ob-side p { display:none; }
    .ob-grid--wide .ob-side { display:none; }
    .ob-sector-grid { grid-template-columns:repeat(2,1fr); }
    .ob-final-layout { flex-direction:column; width:100%; }
    .ob-final-pass { width:100%; max-width:300px; margin:0 auto; order:1; }
    .ob-summary { order:2; width:100%; }
    .ob-brand-row { flex-direction:column; }
  }
`

// ─── Main ─────────────────────────────────────────────────────────────────────
const INITIAL_STATE: OBState = {
  businessName: '', sector: '', cardType: 'stamp',
  stampsRequired: 8, pointsPerVisit: 10, pointsMode: 'visit', pointsPerAmount: 1, pointsAmountUnit: 0,
  rewardMode: 'customer', rewardValue: '', rewardOptions: [],
  brandColor: DEFAULT_CARD_COLOR.start, brandLogo: null,
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [state, setState] = useState<OBState>(INITIAL_STATE)
  const [plan, setPlan] = useState<string>('Starter')
  const [region, setRegion] = useState('AR')
  const currency = currencyFor(region)
  const [ready, setReady] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [finishError, setFinishError] = useState<string | null>(null)

  // Entrada: sin sesión → login; si ya tiene negocio → dashboard (no hay
  // que volver a hacer el onboarding). Si recargó a mitad de camino, se
  // retoma donde estaba.
  useEffect(() => {
    if (!getToken()) { window.location.replace('/login'); return }
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
      if (saved?.state) { setState({ ...INITIAL_STATE, ...saved.state }); setStep(saved.step || 1) }
    } catch { /* sin progreso guardado */ }
    apiMe()
      .then(({ owner, businesses }) => {
        if (businesses.length > 0 || owner?.role === 'manager') { window.location.replace('/dashboard'); return }
        setPlan(owner?.plan || 'Starter')
        setRegion((owner as { region?: string })?.region || 'AR')
        setReady(true)
      })
      .catch(() => setReady(true))
  }, [])

  useEffect(() => {
    if (!ready) return
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, step })) } catch { /* sin espacio (logo grande): no se guarda */ }
  }, [state, step, ready])

  const flow = stepsFor(state.cardType)
  const position = Math.max(flow.indexOf(step), 0)

  function update(patch: Partial<OBState>) { setState(prev => ({ ...prev, ...patch })) }
  function next() { setStep(flow[Math.min(position + 1, flow.length - 1)]); window.scrollTo(0, 0) }
  function back() { setStep(flow[Math.max(position - 1, 0)]); window.scrollTo(0, 0) }

  async function finish() {
    if (finishing) return
    setFinishing(true)
    setFinishError(null)
    try {
      await apiOnboarding({
        businessName: state.businessName.trim(),
        sector: state.sector,
        cardType: state.cardType,
        stampsRequired: state.stampsRequired,
        pointsPerVisit: state.pointsPerVisit,
        ...(state.cardType === 'points' ? { pointsMode: state.pointsMode, pointsPerAmount: state.pointsPerAmount, pointsAmountUnit: state.pointsAmountUnit || DEFAULT_UNIT[currency] } : {}),
        rewardMode: state.rewardMode === 'customer' ? 'dynamic' : 'fixed',
        rewardFixedValue: state.rewardMode === 'fixed' ? state.rewardValue.trim() : undefined,
        rewardOptions: state.cardType === 'stamp' && state.rewardMode === 'customer' ? state.rewardOptions : undefined,
        brandColor: state.brandColor,
        brandLogo: state.brandLogo,
      })
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem('stampa_active_tab')
      window.location.href = '/dashboard'
    } catch (err: any) {
      setFinishError(err?.message || err?.error || 'No pudimos crear tu negocio. Probá de nuevo.')
      setFinishing(false)
    }
  }

  const props = { state, onChange: update, onNext: next, onBack: back }

  const STEPS: Record<number, React.ReactNode> = {
    1: <Step1 {...props} />,
    2: <Step2 {...props} />,
    3: <Step3 {...props} currency={currency} />,
    4: <Step4 {...props} plan={plan} />,
    5: <Step5 {...props} plan={plan} />,
    6: <Step6 state={state} onBack={back} onFinish={finish} finishing={finishing} error={finishError} currency={currency} />,
  }

  const info = STEP_INFO[step]
  const wide = step === 6

  return (
    <>
      {/* Estilos en el render (llegan con la página): antes se inyectaban
          después de mostrarla y se veía un instante sin diseño. */}
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="ob-wrap">
        <div className="ob-frame">
          <div className="ob-top">
            <img src="/assets/wordmark.png" alt="Stampa" />
            <div className="ob-prog" role="progressbar" aria-valuemin={1} aria-valuemax={flow.length} aria-valuenow={position + 1}><i style={{ width: `${((position + 1) / flow.length) * 100}%` }} /></div>
            <span>Paso {position + 1} de {flow.length}</span>
          </div>
          <div className={`ob-grid${wide ? ' ob-grid--wide' : ''}`}>
            <div className="ob-main">
              <div className="ob-main-in">
                <h1 className="ob-title">{info.title}</h1>
                <p className="ob-subtitle">{info.subtitle}</p>
                {ready ? STEPS[step] : <div className="ob-loading">Cargando…</div>}
              </div>
            </div>
            {!wide && (
              <aside className="ob-side" aria-label="Vista previa de tu tarjeta">
                <Pass b={livePass(state)} width={250} />
                <p>Así la van a ver tus clientes en el Wallet.</p>
              </aside>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// La tarjeta que se va armando mientras completás: nombre, rubro, programa,
// premio, color y logo. Es la misma tarjeta de la landing; el color del texto
// se ajusta si elegís un color claro.
function livePass(s: OBState): Biz {
  const hex = /^#[0-9a-f]{6}$/i.test(s.brandColor) ? s.brandColor : DEFAULT_CARD_COLOR.start
  const n = parseInt(hex.slice(1), 16)
  const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
  const sector = SECTORS.find(x => x.id === s.sector)?.label.toUpperCase()
  const prize = s.cardType === 'stamp'
    ? (s.rewardMode === 'customer' ? (s.rewardOptions[0] || 'A tu elección') : (s.rewardValue.trim() || 'Tu premio'))
    : 'Tu premio'
  const base: Biz = {
    name: s.businessName.trim() || 'Tu negocio', sub: sector, color: hex, fg: lum > 0.62 ? '#1E1D1A' : '#FFFFFF',
    logo: s.brandLogo || undefined, icon: 'negocio', head: ['', ''], who: 'Tu cliente', wa: '', prize, model: 'sellos', stamps: 3,
  }
  if (s.cardType === 'points') return { ...base, model: 'puntos', points: '420', next: 'Faltan 80', head: ['PRÓXIMO PREMIO', prize] }
  if (s.cardType === 'membership') return { ...base, model: 'membresia', tier: ['Bronce', 'Plata', 20, '5 visitas para Plata'], head: ['NIVEL', 'Bronce'] }
  return base
}
