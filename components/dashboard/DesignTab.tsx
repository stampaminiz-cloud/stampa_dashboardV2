'use client'
import React, { useState, useRef, useEffect } from 'react'
import { STARTER_PRESETS, GROWTH_EXTRA_PRESETS } from '@/lib/colorPresets'
import { usePlan, PlanGate, PLAN_GATE_CSS } from '@/data/plans'
import { useLang } from '@/data/i18n'
import { apiCreateCard, apiUpdateCard, apiDeleteCard, apiGetTiers, apiGetFields, apiCardStats, apiCardImpact, apiGetPointsCatalog } from '@/lib/api'
import { InfoTooltip } from './InfoTooltip'
import { NumberStepper } from '@/components/ui/NumberStepper'

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
  pointsIcon?: string | null
  flipImageUrl?: string | null
  flipMessage?: string | null
  flipSubMessage?: string | null
  pointsPerVisit?: number | null
  textColor?: string | null
  labelColor?: string | null
  publicDescription?: string | null
}

interface FormField {
  id: string
  label: string
  type: string
  isLocked: boolean
  isActive: boolean
  isRewardSource: boolean
  order: number
  options?: string[]
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
  pointsIcon: string | null
}

interface DesignData {
  cardDesigns: CardDesign[]
  formFields: FormField[]
  business: { plan: string; planActiveCards: number; planMaxCards: number }
}

// ─── Constants ────────────────────────────────────────────────────────────────
// Paleta por plan: lib/colorPresets.ts (espejo del backend). Starter 8,
// Growth +8 (16), Pro/Enterprise color libre.
const COLOR_PRESETS = STARTER_PRESETS
const EXTRA_COLOR_PRESETS = GROWTH_EXTRA_PRESETS

const DEFAULT_TIERS: MembershipTier[] = [
  { id: '1', name: 'Bronce', threshold: 0,  perk: 'Bienvenido',           color: '#854F0B', bg: '#FAEEDA' },
  { id: '2', name: 'Plata',  threshold: 10, perk: '5% de descuento',      color: '#444441', bg: '#EAEAEA' },
  { id: '3', name: 'Oro',    threshold: 25, perk: 'Regalo de cumpleaños',  color: '#633806', bg: '#FAC775' },
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

function hexToRgba(hex: string, alpha: number): string {
  const c = hex.replace('#', '')
  if (c.length !== 6) return `rgba(255,255,255,${alpha})`
  const r = parseInt(c.slice(0,2), 16)
  const g = parseInt(c.slice(2,4), 16)
  const b = parseInt(c.slice(4,6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

// Achica una imagen antes de guardarla (antes un PNG de 3 MB entraba tal
// cual a la tarjeta). PNG mantiene la transparencia; el resto va a JPEG.
function compressImage(file: File, maxSide: number, asPng: boolean): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('No se pudo leer la imagen.'))
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
        const c = document.createElement('canvas')
        c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale)
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
        resolve(asPng ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.85))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

// Contraste WCAG entre dos colores hex (1 a 21). Menos de 3 = difícil de leer.
function contrastRatio(a: string, b: string): number {
  const lum = (hex: string) => {
    const c = hex.replace('#', '')
    if (c.length !== 6) return 1
    const ch = [0, 2, 4].map(i => { const v = parseInt(c.slice(i, i + 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) })
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2]
  }
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}
const isHex = (v?: string | null) => !!v && /^#[0-9A-Fa-f]{6}$/.test(v)

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
  const [error, setError] = useState<string | null>(null)
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // Apple/Google Wallet exigen PNG para los assets del pase — un JPG
    // puede terminar con fondo blanco donde debería ser transparente, o
    // directamente ser rechazado al generar el pase real (Etapa B).
    if (file.type !== 'image/png') {
      setError('Tiene que ser PNG (no JPG) — Apple Wallet lo necesita para que el fondo quede transparente.')
      if (ref.current) ref.current.value = ''
      return
    }
    setError(null)
    compressImage(file, 512, true).then(onChange).catch(err => setError(err.message))
    if (ref.current) ref.current.value = ''
  }
  return (
    <div className="dt-logo-upload">
      <div className="dt-logo-label">{label}</div>
      <div className={`dt-logo-zone${value ? ' dt-logo-zone--filled' : ''}`} onClick={() => ref.current?.click()}>
        {value
          ? <img src={value} className="dt-logo-preview" alt={label} />
          : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><span>{hint}</span></>
        }
        <input ref={ref} type="file" accept="image/png" onChange={handleFile} style={{ display: 'none' }} />
      </div>
      {error && <div className="dt-logo-error">{error}</div>}
      {value && <button className="dt-logo-remove" onClick={() => onChange(null)}>Quitar</button>}
    </div>
  )
}

// ─── Color Picker ─────────────────────────────────────────────────────────────
function ColorPicker({ color, onChange }: { color: string; onChange: (s: string, e: string) => void }) {
  const [hex, setHex] = useState(color)
  const { can } = usePlan()
  const allowsExtraPresets = can('extraColorPresets')
  const allowsCustom = can('customColors')
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
        {allowsExtraPresets && EXTRA_COLOR_PRESETS.map(({ label, start, end }) => (
          <button key={label} className={`dt-color-dot${color === start ? ' dt-color-dot--on' : ''}`}
            style={{ background: start }} title={label}
            onClick={() => { setHex(start); onChange(start, end) }} />
        ))}
      </div>
      {!allowsExtraPresets && (
        <div className="dt-upgrade-color-note">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          +8 colores más · Plan Growth o superior
        </div>
      )}
      {allowsCustom ? (
        <div className="dt-custom-color-row">
          <label className="dt-custom-swatch" style={{ background: hex }}>
            <input type="color" value={hex.length === 7 ? hex : '#1B412F'} onChange={e => applyHex(e.target.value)} className="dt-color-native" />
          </label>
          <input type="text" className="dt-hex-input" value={hex} onChange={e => applyHex(e.target.value)} placeholder="#1B412F" maxLength={7} />
          <span className="dt-hex-label">Personalizado</span>
        </div>
      ) : (
        <div className="dt-upgrade-color-note">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Color 100% libre · Plan Pro o superior
        </div>
      )}
    </div>
  )
}

// ─── Selector de color de texto ──────────────────────────────────────────────
// Colores que suelen leerse bien sobre una tarjeta + uno libre (rueda de
// color) con su código. `auto` agrega la opción "Automático" (= null).
const TEXT_SWATCHES = ['#FFFFFF', '#FBF6EE', '#F2D9A6', '#C9A84C', '#8A8580', '#2B2620', '#000000']
function SwatchPicker({ value, onChange, auto = false }: { value: string | null; onChange: (v: string | null) => void; auto?: boolean }) {
  const custom = !!value && !TEXT_SWATCHES.includes(value.toUpperCase())
  return (
    <div className="dt-swatches">
      {auto && (
        <button type="button" className={`dt-swatch dt-swatch--auto${value === null ? ' dt-swatch--on' : ''}`} onClick={() => onChange(null)} title="Automático" aria-label="Automático">A</button>
      )}
      {TEXT_SWATCHES.map(c => (
        <button key={c} type="button" className={`dt-swatch${value?.toUpperCase() === c ? ' dt-swatch--on' : ''}`} style={{ background: c }} onClick={() => onChange(c)} title={c} aria-label={c} />
      ))}
      <label className={`dt-swatch dt-swatch--custom${custom ? ' dt-swatch--on' : ''}`} title="Otro color" style={custom ? { background: value! } : undefined}>
        <input type="color" value={value && value.length === 7 ? value : '#FFFFFF'} onChange={e => onChange(e.target.value.toUpperCase())} className="dt-color-native" />
      </label>
      {custom && <input type="text" className="dt-hex-input" value={value!} onChange={e => onChange(e.target.value)} maxLength={7} aria-label="Código de color" />}
    </div>
  )
}

function ProLock({ label }: { label: string }) {
  return (
    <div className="dt-upgrade-color-note">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      {label} · Plan Pro
    </div>
  )
}

// ─── Pass preview (Apple Wallet) ──────────────────────────────────────────────
function RealPassPreview({ design, businessName, logos, rewardSourceLabel, tiers, previewTierIndex, catalog = [] }: {
  design: CardDesign; businessName?: string | null; logos: LogoState; rewardSourceLabel: string; tiers: MembershipTier[]; previewTierIndex: number
  catalog?: { name: string; cost: number }[]
}) {
  // Puntos: saldo de ejemplo entre el primer y el segundo premio, para que
  // se vean marcas llenas y huecas.
  const ptsCosts = Array.from(new Set(catalog.map(c => c.cost).filter(c => c > 0))).sort((a, b) => a - b)
  const ptsMax = ptsCosts[ptsCosts.length - 1] || 0
  const ptsBal = !ptsMax ? 120 : ptsCosts.length >= 2 ? Math.round((ptsCosts[0] + ptsCosts[1]) / 2) : Math.round(ptsMax * 0.6)
  const stamps = Array.from({ length: design.stampsRequired }, (_: unknown, i: number) => i < 3)
  const activeTier = tiers[previewTierIndex] || tiers[0]

  // Membresía: el pase real usa el fondo del nivel del cliente (bg) y su
  // color para el texto — los niveles reales de la tarjeta (Premios).
  const bgGrad = design.type === 'membership' && activeTier
    ? activeTier.bg
    : `linear-gradient(170deg, ${design.color}, ${design.secondColor})`
  if (design.type === 'membership' && activeTier) design = { ...design, textColor: activeTier.color }

  return (
    <div className="dt-real-pass" style={{ background: bgGrad }}>
      <div className="dt-real-pass-top">
        {logos.businessLogo
          ? <img src={logos.businessLogo} className="dt-real-pass-logo-img" alt="logo" />
          : <div className="dt-real-pass-logo-text" style={{ color: design.textColor || '#FFFFFF' }}>{(businessName || design.name).toUpperCase()}</div>
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

      {design.type === 'membership' && tiers.length > 0 && (() => {
        // Misma geometría que el strip del pase real (buildMembershipLadderStrip):
        // columnas iguales, línea de un centro al otro, todo en el color de
        // texto del nivel (es el que se lee sobre su fondo).
        const c = activeTier.color || '#FFFFFF'
        const n = tiers.length
        const next = tiers[previewTierIndex + 1]
        const pct = n > 1 ? (previewTierIndex / (n - 1)) * 100 : 0
        return (
          <div className="dt-ladder" style={{ color: c }}>
            <div className="dt-ladder-steps" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
              <div className="dt-ladder-track" style={{ left: `${50 / n}%`, right: `${50 / n}%` }}>
                <div className="dt-ladder-fill" style={{ width: `${pct}%` }} />
              </div>
              {tiers.map((tier, i) => (
                <div key={tier.id} className={`dt-ladder-step${i < previewTierIndex ? ' is-done' : ''}${i === previewTierIndex ? ' is-on' : ''}`}>
                  <span className="dt-ladder-dot" />
                  <span className="dt-ladder-name">{tier.name}</span>
                </div>
              ))}
            </div>
            <div className="dt-ladder-caption">
              {next ? `${Math.max((next.threshold || 0) - (activeTier.threshold || 0), 1)} visitas para ${next.name}` : 'Nivel máximo'}
            </div>
          </div>
        )
      })()}

      {design.type === 'points' && (
        <div className="dt-real-pass-points-area">
          <div className="dt-real-pass-points-row">
            <div className="dt-real-pass-points-icon">
              {logos.pointsIcon
                ? <img src={logos.pointsIcon} className="dt-real-pass-icon-img" alt="" />
                : <div className="dt-real-pass-icon-default dt-real-pass-icon-filled" />
              }
            </div>
            <div className="dt-real-pass-points-num" style={{ color: design.textColor || '#FFFFFF' }}>{ptsBal}</div>
          </div>
          {(() => {
            // Igual que el pase real: barra de 0 al premio más caro, una marca
            // por premio (llena = ya le alcanza).
            const tc = design.textColor || '#FFFFFF'
            const costs = ptsCosts, max = ptsMax, bal = ptsBal
            const next = catalog.filter(c => c.cost > bal).sort((a, b) => a.cost - b.cost)[0]
            const ready = costs.filter(c => c <= bal).length
            const caption = !max ? 'Cargá premios en Premios para ver la barra'
              : next ? (ready ? `${ready} para canjear · ${next.cost - bal} pts al siguiente` : `${next.cost - bal} pts para ${next.name}`)
              : '¡Ya podés canjear cualquier premio!'
            return (<>
              <div className="dt-pts-bar" style={{ color: tc }}>
                <div className="dt-pts-fill" style={{ width: `${max ? Math.min(100, (bal / max) * 100) : 0}%` }} />
                {costs.map(c => (
                  <span key={c} className={`dt-pts-mark${c <= bal ? ' is-ok' : ''}`} style={{ left: `clamp(6px, ${(c / max) * 100}%, calc(100% - 6px))`, background: c <= bal ? tc : design.color }} />
                ))}
              </div>
              <div className="dt-real-pass-points-sub" style={{ color: hexToRgba(tc, 0.7) }}>{caption}</div>
            </>)
          })()}
        </div>
      )}

      <div className="dt-real-pass-info">
        <div className="dt-real-pass-info-field">
          <div className="dt-real-pass-info-label" style={{ color: hexToRgba(design.textColor || '#FFFFFF', 0.65) }}>TITULAR</div>
          <div className="dt-real-pass-info-val" style={{ color: design.textColor || '#FFFFFF' }}>Nombre del cliente</div>
        </div>
        <div className="dt-real-pass-info-field">
          <div className="dt-real-pass-info-label" style={{ color: hexToRgba(design.textColor || '#FFFFFF', 0.65) }}>
            {design.type === 'stamp' ? 'PREMIO' : design.type === 'membership' ? 'NIVEL' : 'PRÓXIMO PREMIO'}
          </div>
          <div className="dt-real-pass-info-val" style={{ color: design.textColor || '#FFFFFF' }}>
            {design.type === 'stamp' ? (design.rewardMode === 'dynamic' ? rewardSourceLabel : (design.rewardField || 'Premio'))
            : design.type === 'membership' ? activeTier.name
            : (catalog.filter(c => c.cost > ptsBal).sort((a, b) => a.cost - b.cost)[0]?.name || (catalog.length ? '—' : 'Sin premios cargados'))}
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
function GooglePreview({ design, businessName, logos, rewardSourceLabel, tiers, previewTierIndex }: {
  design: CardDesign; businessName?: string | null; logos: LogoState; rewardSourceLabel: string; tiers: MembershipTier[]; previewTierIndex: number
}) {
  const stamps = Array.from({ length: design.stampsRequired }, (_: unknown, i: number) => i < 3)
  const activeTier = tiers[previewTierIndex] || tiers[0]

  const gBgGrad = design.type === 'membership' && activeTier
    ? activeTier.bg
    : `linear-gradient(135deg, ${design.color}, ${design.secondColor})`

  return (
    <div className="dt-gpass">
      <div className="dt-gpass-hero" style={{ background: gBgGrad }}>
        <div className="dt-gpass-logo-row">
          {logos.businessLogo ? <img src={logos.businessLogo} className="dt-gpass-logo-img" alt="" /> : <div className="dt-gpass-logo-box" />}
          <span className="dt-gpass-issuer">{businessName || design.name}</span>
        </div>
        <div className="dt-gpass-hero-title">
          {design.type === 'stamp' ? `3 de ${design.stampsRequired} sellos`
          : design.type === 'points' ? '120 pts'
          : activeTier?.name || 'Nivel'}
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
        <div className="dt-gpass-info-row"><span className="dt-gpass-field-label">Titular</span><span className="dt-gpass-info-val">Nombre del cliente</span></div>
        <div className="dt-gpass-info-row">
          <span className="dt-gpass-field-label">{design.type === 'stamp' ? 'Premio' : design.type === 'membership' ? 'Nivel' : 'Puntos'}</span>
          <span className="dt-gpass-info-val">{design.type === 'stamp' ? (design.rewardMode === 'dynamic' ? rewardSourceLabel : (design.rewardField || 'Premio')) : design.type === 'membership' ? activeTier?.name : '120'}</span>
        </div>
      </div>
      <div className="dt-gpass-qr-wrap"><QRCode size={60} /><div className="dt-gpass-qr-label">Powered by Stampa</div></div>
    </div>
  )
}

// ─── Mini pass thumbnail ──────────────────────────────────────────────────────
function MiniPass({ design, businessName, logos, tiers }: { design: CardDesign; businessName?: string | null; logos: LogoState; tiers?: MembershipTier[] }) {
  const stamps = Array.from({ length: Math.min(design.stampsRequired, 8) }, (_: unknown, i: number) => i < 3)
  const fallbackLabel = (businessName || design.name).split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0,4)
  // El fondo de membership no se elige en el Design tab — lo define el
  // nivel del cliente (ver el mismo criterio en appleWalletPassBuilder.js).
  // El preview arranca siempre en Bronze, el primer nivel, en vez de mostrar
  // el color general de la tarjeta (que ni siquiera aplica para este tipo).
  const bronze = tiers?.[0] || DEFAULT_TIERS[0]
  const bgStyle = design.type === 'membership'
    ? { background: bronze.bg }
    : { background: `linear-gradient(170deg, ${design.color}, ${design.secondColor})` }
  const textColor = design.type === 'membership' ? bronze.color : (design.textColor || '#FFFFFF')
  return (
    <div className="dt-mini-pass" style={bgStyle}>
      <div className="dt-mini-pass-top">
        {logos.businessLogo
          ? <img src={logos.businessLogo} className="dt-mini-logo-img" alt="" />
          : <div className="dt-mini-logo-text" style={{ color: textColor }}>{fallbackLabel}</div>
        }
        <span className="dt-mini-type" style={design.type === 'membership' ? { color: textColor } : undefined}>{design.type === 'stamp' ? 'Sellos' : design.type === 'points' ? 'Puntos' : 'Membresía'}</span>
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
          {(tiers || DEFAULT_TIERS).slice(0, 4).map((t, i) => (
            <div key={t.id} className={`dt-mini-tier-chip${i === 0 ? ' dt-mini-tier-chip--active' : ''}`} style={i === 0 ? { background: bronze.bg, color: bronze.color, border: `1px solid ${bronze.color}` } : { background: 'transparent', color: bronze.color, opacity: 0.45, border: `1px solid ${bronze.color}` }}>{t.name}</div>
          ))}
        </div>
      )}
      {design.type === 'points' && <div className="dt-mini-points">120 pts</div>}
      {/* Antes era un cuadrado blanco vacío sin ningún ícono adentro —
          representaba "acá va el QR" pero no se entendía qué era. */}
      <div className="dt-mini-qr-hint" title="Acá va el código QR del cliente en el pase real">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2B2620" strokeWidth="1.6">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          <path d="M14 14h3v3h-3z"/><path d="M20 14v3"/><path d="M14 20h3"/><path d="M20 20h.01"/>
        </svg>
      </div>
    </div>
  )
}

// ─── Card Editor ──────────────────────────────────────────────────────────────
function CardEditor({ card: init, businessId, businessName, onSaved, onBack, onGoTo }: {
  card: CardDesign; businessId?: string | null; businessName?: string | null; onSaved?: () => void; onBack: () => void
  onGoTo?: (tab: 'form' | 'rewards') => void
}) {
  const { can, plan } = usePlan()
  const t = useLang()
  const [card, setCard] = useState<CardDesign>(init)
  // Campos y niveles reales de ESTA tarjeta (antes salían de datos de ejemplo).
  const [fields, setFields] = useState<FormField[]>([])
  const [tiers, setTiers] = useState<MembershipTier[]>(DEFAULT_TIERS)
  const [catalog, setCatalog] = useState<{ name: string; cost: number }[]>([])
  useEffect(() => {
    if (!businessId) return
    apiGetFields(businessId, init.id).then(list => setFields(list.map((f: any) => ({ id: f._id, label: f.label, type: f.fieldType, isLocked: f.isLocked, isActive: f.isActive, isRewardSource: f.isRewardSource, order: f.order, options: f.options || [] })))).catch(() => {})
    if (init.type === 'points') {
      apiGetPointsCatalog(businessId, init.id).then(list => setCatalog(list.filter(i => i.isActive !== false).map(i => ({ name: i.name, cost: i.pointsCost })))).catch(() => {})
    }
    if (init.type === 'membership') {
      apiGetTiers(businessId, init.id).then(list => { if (list.length) setTiers(list.map(t => ({ id: t._id, name: t.name, threshold: t.threshold, perk: t.perk, color: t.color, bg: t.bg }))) }).catch(() => {})
    }
  }, [businessId, init.id, init.type])
  const [logos, setLogos] = useState<LogoState>({
    businessLogo: init.logoUrl || null,
    earnedIcon: init.earnedIcon || null,
    emptyIcon: init.emptyIcon || null,
    pointsIcon: init.pointsIcon || null,
  })
  const [platform, setPlatform] = useState<'real' | 'google'>('real')
  const [previewTierIndex, setPreviewTierIndex] = useState(0)
  const [mobileView, setMobileView] = useState<'config' | 'preview'>('config')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveNotice, setSaveNotice] = useState('')
  const [confirmImpact, setConfirmImpact] = useState<number | null>(null)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [pointsPerVisit, setPointsPerVisit] = useState(init.pointsPerVisit || 10)
  // Flip card state
  const [previewSide, setPreviewSide]       = useState<'front' | 'prize'>('front')
  const [flipMessage, setFlipMessage]       = useState(init.flipMessage || '¡Lo lograste!')
  const [flipSubMessage, setFlipSubMessage] = useState(init.flipSubMessage || 'Presentá esta tarjeta para canjear tu premio')
  const [isFlipping, setIsFlipping]         = useState(false)
  const [prizeImage, setPrizeImage]           = useState<string | null>(card.flipImageUrl || null)
  const prizeImageRef                         = useRef<HTMLInputElement>(null)

  function switchSide(side: 'front' | 'prize') {
    if (side === previewSide) return
    setIsFlipping(true)
    setTimeout(() => { setPreviewSide(side); setIsFlipping(false) }, 300)
  }

  const rewardSource = fields.find((f: FormField) => f.isRewardSource)
  // Opciones de "Lo elige el cliente": se editan acá y se guardan en la
  // pregunta de premio del formulario.
  const [rewardOpts, setRewardOpts] = useState<string[]>([])
  const [rewardOptsBase, setRewardOptsBase] = useState('[]')
  const [newOpt, setNewOpt] = useState('')
  useEffect(() => {
    const o = rewardSource?.options || []
    setRewardOpts(o); setRewardOptsBase(JSON.stringify(o))
  }, [rewardSource?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const cleanOpts = rewardOpts.map(o => o.trim()).filter(Boolean)
  const optsChanged = JSON.stringify(cleanOpts) !== rewardOptsBase
  function addOpt() {
    const v = newOpt.trim().slice(0, 40)
    if (!v || rewardOpts.length >= 6 || rewardOpts.some(o => o.toLowerCase() === v.toLowerCase())) return
    setRewardOpts([...rewardOpts, v]); setNewOpt('')
  }
  const rewardSourceLabel = rewardSource ? 'Lo elige cada cliente' : 'Sin configurar'

  // Cambios sin guardar: se compara con lo que había al abrir.
  const snapshot = (c: CardDesign, l: LogoState, fm: string, fs: string, img: string | null, ppv: number) =>
    JSON.stringify([c.name, c.color, c.secondColor, c.textColor || null, c.labelColor || null, c.publicDescription || '', c.stampsRequired, c.rewardMode, c.rewardField || '', l, fm, fs, img, ppv])
  const [baseline, setBaseline] = useState(() => snapshot(init, { businessLogo: init.logoUrl || null, earnedIcon: init.earnedIcon || null, emptyIcon: init.emptyIcon || null, pointsIcon: init.pointsIcon || null }, init.flipMessage || '¡Lo lograste!', init.flipSubMessage || 'Presentá esta tarjeta para canjear tu premio', init.flipImageUrl || null, init.pointsPerVisit || 10))
  const [savedStamps, setSavedStamps] = useState(init.stampsRequired)

  function setLogo(key: keyof LogoState) { return (url: string | null) => setLogos({ ...logos, [key]: url }) }
  const dirty = snapshot(card, logos, flipMessage, flipSubMessage, prizeImage, pointsPerVisit) !== baseline || (card.type === 'stamp' && card.rewardMode === 'dynamic' && optsChanged)
  const textColorBad = !!card.textColor && !isHex(card.textColor)
  const labelColorBad = !!card.labelColor && !isHex(card.labelColor)
  const lowContrast = card.type !== 'membership' && isHex(card.textColor || '#FFFFFF') && isHex(card.color) && contrastRatio(card.textColor || '#FFFFFF', card.color) < 3

  async function handleSave(skipImpactCheck = false) {
    if (!businessId) {
      setSaveError('No se encontró el negocio — recargá la página e intentá de nuevo.')
      return
    }
    setSaveError(''); setSaveNotice('')
    if (!card.name.trim()) { setSaveError('La tarjeta necesita un nombre.'); return }
    if (card.type === 'stamp' && card.rewardMode !== 'dynamic' && !(card.rewardField || '').trim()) { setSaveError('Escribí cuál es el premio (ej: Café gratis).'); return }
    if (card.type === 'stamp' && card.rewardMode === 'dynamic' && (cleanOpts.length < 2 || cleanOpts.length > 6)) { setSaveError('Cargá entre 2 y 6 opciones de premio para que el cliente elija.'); return }
    if (textColorBad || labelColorBad) { setSaveError('Revisá los colores de texto: tienen que ser un código como #FFFFFF.'); return }
    // Bajar los sellos completa la tarjeta de quienes ya los tienen: avisar antes.
    if (!skipImpactCheck && card.type === 'stamp' && card.stampsRequired < savedStamps) {
      try {
        const { wouldComplete } = await apiCardImpact(businessId, card.id, card.stampsRequired)
        if (wouldComplete > 0) { setConfirmImpact(wouldComplete); return }
      } catch { /* si no se puede calcular, se guarda igual */ }
    }
    setConfirmImpact(null)
    setSaving(true)
    try {
      const res = await apiUpdateCard(businessId, card.id, {
        name: card.name.trim(),
        color: card.color,
        secondColor: card.secondColor,
        ...(can('customTextColor') ? { textColor: card.textColor || null, labelColor: card.labelColor || null } : {}),
        publicDescription: card.publicDescription || '',
        isActive: card.isActive,
        stampsRequired: card.stampsRequired,
        pointsPerVisit,
        ...(card.type === 'stamp' ? { rewardMode: card.rewardMode === 'dynamic' ? 'dynamic' : 'fixed' } : {}),
        ...(card.type === 'stamp' && card.rewardMode === 'dynamic' && (optsChanged || !rewardSource) ? { rewardOptions: cleanOpts } : {}),
        rewardFixedValue: card.rewardField || null,
        flipMessage,
        flipSubMessage,
        // null = se quitó (antes mandaba undefined y "Quitar" nunca se guardaba)
        flipImageUrl: prizeImage || null,
        logoUrl: logos.businessLogo || null,
        earnedIcon: logos.earnedIcon || null,
        emptyIcon: logos.emptyIcon || null,
        pointsIcon: logos.pointsIcon || null,
      })

      setSaved(true)
      setBaseline(snapshot(card, logos, flipMessage, flipSubMessage, prizeImage, pointsPerVisit))
      setSavedStamps(card.stampsRequired)
      if (card.type === 'stamp' && card.rewardMode === 'dynamic') {
        setRewardOpts(cleanOpts); setRewardOptsBase(JSON.stringify(cleanOpts))
        if (!rewardSource) apiGetFields(businessId, card.id).then(list => setFields(list.map((f: any) => ({ id: f._id, label: f.label, type: f.fieldType, isLocked: f.isLocked, isActive: f.isActive, isRewardSource: f.isRewardSource, order: f.order, options: f.options || [] })))).catch(() => {})
      }
      setSaveNotice(res?.passUpdates ? `Guardado. Se actualizó la tarjeta en ${res.passUpdates} celular${res.passUpdates === 1 ? '' : 'es'}.` : 'Guardado.')
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
          <button className={`dt-platform-btn${platform === 'google' ? ' dt-platform-btn--on' : ''}`} onClick={() => setPlatform('google')}>Google Wallet · Próximamente</button>
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
              ? <RealPassPreview design={card} businessName={businessName} logos={logos} rewardSourceLabel={rewardSourceLabel} tiers={tiers} previewTierIndex={previewTierIndex} catalog={catalog} />
              : <GooglePreview  design={card} businessName={businessName} logos={logos} rewardSourceLabel={rewardSourceLabel} tiers={tiers} previewTierIndex={previewTierIndex} />
          }
        </div>
        <div className="dt-preview-note">
          {card.type === 'stamp' && previewSide === 'prize'
            ? t('dt_preview' as any)
            : platform === 'real' ? t('dt_apple_note' as any) : 'Google Wallet todavía no está disponible: por ahora tus clientes con Android usan el código QR que reciben al registrarse. Así se va a ver cuando lo sumemos.'}
        </div>
      </div>
    </div>
  )

  return (
    <>
      <div className="dt-editor-header">
        <button className="dt-back-btn" onClick={() => dirty ? setConfirmLeave(true) : onBack()}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Mis tarjetas
        </button>
        <div className="dt-editor-title">{card.name}</div>

        {/* Mobile tab toggle */}
        <div className="dt-mobile-tabs">
          <button className={`dt-mobile-tab${mobileView === 'config' ? ' dt-mobile-tab--on' : ''}`} onClick={() => setMobileView('config')}>Configurar</button>
          <button className={`dt-mobile-tab${mobileView === 'preview' ? ' dt-mobile-tab--on' : ''}`} onClick={() => setMobileView('preview')}>Preview</button>
        </div>

        <button className="dt-save-btn" onClick={() => handleSave()} disabled={saving || !dirty}>
          {saving ? 'Guardando…' : saved ? '✓ Guardado' : dirty ? 'Guardar cambios' : 'Sin cambios'}
        </button>
      </div>
      {saveError && <div className="dt-save-error">{saveError}</div>}
      {saveNotice && !saveError && <div className="dt-save-notice">{saveNotice}</div>}
      {confirmImpact != null && (
        <div className="dt-save-warn">
          <span>Con {card.stampsRequired} sellos, <strong>{confirmImpact} cliente{confirmImpact === 1 ? '' : 's'}</strong> van a completar su tarjeta al guardar y tener el premio listo para entregar.</span>
          <span style={{ display: 'flex', gap: 8 }}>
            <button className="dt-warn-btn" onClick={() => setConfirmImpact(null)}>Cancelar</button>
            <button className="dt-warn-btn dt-warn-btn--primary" onClick={() => handleSave(true)}>Guardar igual</button>
          </span>
        </div>
      )}
      {confirmLeave && (
        <div className="dt-save-warn">
          <span>Tenés cambios sin guardar en esta tarjeta.</span>
          <span style={{ display: 'flex', gap: 8 }}>
            <button className="dt-warn-btn" onClick={() => { setConfirmLeave(false); onBack() }}>Salir sin guardar</button>
            <button className="dt-warn-btn dt-warn-btn--primary" onClick={() => { setConfirmLeave(false); handleSave() }}>Guardar</button>
          </span>
        </div>
      )}

      <div className="dt-editor-body">
        {/* ── Left panel (config) ── */}
        <div className={`dt-editor-panel${mobileView === 'preview' ? ' dt-panel--mobile-hidden' : ''}`}>

          {/* El tipo de tarjeta queda fijo desde que se crea — cambiar sellos
              a puntos a membresía in-place mezclaba datos de configuración
              incompatibles entre sí (catálogo de puntos, tiers, cantidad de
              sellos) y dejaba a la tarjeta en un estado inconsistente. Si el
              negocio quiere un programa distinto, la vía es crear una
              tarjeta nueva (respetando el límite de tarjetas del plan). */}
          <div className="dt-panel-section-title">Tipo de tarjeta</div>
          <div className="dt-type-fixed">
            <span className="dt-type-fixed-label">
              {card.type === 'stamp' ? 'Sellos' : card.type === 'points' ? 'Puntos' : 'Membresía'}
              <InfoTooltip text="El tipo no se cambia después de crear la tarjeta. Si necesitás otro programa, creá una tarjeta nueva." />
            </span>
          </div>

          <div className="dt-panel-section-title" style={{ marginTop: 20 }}>Descripción pública</div>
          <input
            className="dt-public-desc-input"
            value={card.publicDescription || ''}
            onChange={e => setCard({ ...card, publicDescription: e.target.value.slice(0, 100) })}
            placeholder={card.type === 'stamp' ? `Ej: ${card.stampsRequired} sellos = 1 café gratis` : card.type === 'points' ? 'Ej: Acumulá puntos y canjealos por premios' : 'Ej: Subí de nivel con tus visitas'}
            maxLength={100}
          />
          <div className="dt-public-desc-note">
            {(card.publicDescription || '').length}/100
            <InfoTooltip text="Se muestra a tus clientes si tenés 2 o más tarjetas activas, para que sepan a cuál sumarse. Si lo dejás vacío, usamos un texto automático." />
          </div>

          {/* Logos */}
          <div className="dt-panel-section-title" style={{ marginTop: 20 }}>Logos e íconos</div>
          <div className="dt-logo-row">
            <LogoUpload label="Logo del negocio" hint="Subir logo" value={logos.businessLogo} onChange={setLogo('businessLogo')} />
            {card.type === 'stamp' && <>
              <LogoUpload label="Sello ganado" hint="Ícono lleno" value={logos.earnedIcon} onChange={setLogo('earnedIcon')} />
              <LogoUpload label="Sello vacío" hint="Ícono vacío" value={logos.emptyIcon} onChange={setLogo('emptyIcon')} />
            </>}
          </div>

          {/* Form fields — la gestión real (agregar, ocultar, reordenar) vive
              en Forms. Acá solo un puntero, para no tener el mismo campo
              editable desde dos tabs distintas (mismo criterio que ya
              aplicamos con el selector de premio). */}
          <div className="dt-panel-section-title" style={{ marginTop: 20 }}>Campos del formulario</div>
          <div className="dt-reward-goto-forms">Se editan en <button className="dt-inline-link" onClick={() => onGoTo?.('form')}>Formulario</button>. <InfoTooltip text="El formulario de registro usa el color y el logo de esta tarjeta." /></div>

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
                    <div className="dt-appearance-label">
                      Opciones de premio ({cleanOpts.length}/6)
                      <InfoTooltip text="El cliente elige una al registrarse y esa queda como su premio. Se muestran como pregunta obligatoria en el formulario." />
                    </div>
                    <div className="dt-opts">
                      {rewardOpts.map((o, i) => (
                        <span key={i} className="dt-opt">
                          <input value={o} maxLength={40} onChange={e => setRewardOpts(rewardOpts.map((x, j) => j === i ? e.target.value : x))} aria-label={`Opción ${i + 1}`} style={{ width: `${Math.max(4, o.length) + 1}ch` }} />
                          <button type="button" onClick={() => setRewardOpts(rewardOpts.filter((_, j) => j !== i))} aria-label="Quitar opción">×</button>
                        </span>
                      ))}
                      {rewardOpts.length < 6 && (
                        <span className="dt-opt dt-opt--new">
                          <input value={newOpt} maxLength={40} placeholder="+ Agregar (ej: Café gratis)" onChange={e => setNewOpt(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOpt() } }} onBlur={addOpt} aria-label="Nueva opción" />
                        </span>
                      )}
                    </div>
                    {cleanOpts.length < 2
                      ? <div className="dt-color-warn">Cargá al menos 2 opciones.</div>
                      : <div className="dt-public-desc-note">Elegí premios de valor parecido: si uno vale mucho más, todos van a elegir ese.</div>}
                  </div>
                )}
                <div className={`dt-reward-opt${card.rewardMode !== 'dynamic' ? ' dt-reward-opt--on' : ''}`} onClick={() => setCard({ ...card, rewardMode: 'fixed' })}>
                  <div className="dt-reward-radio">{card.rewardMode !== 'dynamic' && <div className="dt-reward-radio-dot" />}</div>
                  <div><div className="dt-reward-opt-title">Yo lo defino</div><div className="dt-reward-opt-desc">El mismo premio para todos los clientes</div></div>
                </div>
                {card.rewardMode !== 'dynamic' && (
                  <input className="dt-prize-input" placeholder="Ej: Café gratis" maxLength={40} value={card.rewardField || ''} onChange={e => setCard({ ...card, rewardField: e.target.value })} />
                )}
              </div>
            </>
          )}

          {/* POINTS: configuration */}
          {card.type === 'points' && (
            <>
              <div className="dt-panel-section-title" style={{ marginTop: 20 }}>Ícono de puntos</div>
              <div className="dt-logo-row">
                <LogoUpload label="Ícono de puntos" hint="Ej: una moneda" value={logos.pointsIcon} onChange={setLogo('pointsIcon')} />
              </div>

              <div className="dt-panel-section-title" style={{ marginTop: 20 }}>Configuración de puntos</div>
              <div className="dt-points-config">
                <div className="dt-points-row">
                  <label className="dt-points-label">Puntos por visita</label>
                  <NumberStepper value={pointsPerVisit} onChange={setPointsPerVisit} min={1} max={1000} suffix="pts" presets={[5, 10, 20, 50]} size="sm" ariaLabel="Puntos por visita" />
                </div>
                <div className="dt-points-note">
                  Los premios y sus puntos se editan en <button className="dt-inline-link" onClick={() => onGoTo?.('rewards')}>Premios</button>.
                </div>
              </div>
            </>
          )}

          {/* MEMBERSHIP: redirect to rewards */}
          {card.type === 'membership' && (
            <>
              <div className="dt-panel-section-title" style={{ marginTop: 20 }}>Niveles de membresía</div>
              <div className="dt-membership-note">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
                <div>
                  <div className="dt-membership-note-title">Los niveles se configuran en Premios</div>
                  <div className="dt-membership-note-desc">Nombre, color, visitas y beneficio de cada nivel: <button className="dt-inline-link" onClick={() => onGoTo?.('rewards')}>ir a Premios</button>.</div>
                </div>
              </div>
            </>
          )}

          {/* Appearance */}
          <div className="dt-panel-section-title" style={{ marginTop: 20 }}>Apariencia de la tarjeta</div>
          <div className="dt-appearance-label">
            {card.type === 'membership' ? 'Color de marca' : 'Color de fondo'}
            {card.type === 'membership' && <InfoTooltip text="Se usa en el formulario de registro y en la app de escaneo. En la Wallet, la tarjeta toma el color del nivel de cada cliente (se elige en Premios)." />}
          </div>
          <ColorPicker color={card.color} onChange={(s, e) => setCard({ ...card, color: s, secondColor: e })} />

          {/* Colores de texto y etiquetas: desde Pro (afectan el pase real). */}
          <div className="dt-appearance-label" style={{ marginTop: 14 }}>
            Color de texto
            <InfoTooltip text="El color del nombre, los números y los datos de la tarjeta, tal como se ve en la Wallet." />
          </div>
          {can('customTextColor') ? (<>
            <SwatchPicker value={card.textColor || '#FFFFFF'} onChange={v => setCard({ ...card, textColor: v })} />
            {textColorBad && <div className="dt-color-warn">Tiene que ser un código de color como #FFFFFF.</div>}
            {!textColorBad && lowContrast && <div className="dt-color-warn">Con este fondo el texto se va a leer mal. Probá un color más claro u oscuro.</div>}
          </>) : <ProLock label="Color de texto y etiquetas" />}

          {can('customTextColor') && (<>
            <div className="dt-appearance-label" style={{ marginTop: 14 }}>
              Color de las etiquetas
              <InfoTooltip text="Los títulos chicos (TITULAR, PREMIO…). En Automático usan el color de texto." />
            </div>
            <SwatchPicker value={card.labelColor || null} auto onChange={v => setCard({ ...card, labelColor: v })} />
            {labelColorBad && <div className="dt-color-warn">Tiene que ser un código de color como #FFFFFF.</div>}
          </>)}

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
                  onChange={e => { const f = e.target.files?.[0]; if (!f) return; compressImage(f, 900, f.type === 'image/png').then(setPrizeImage).catch(err => setSaveError(err.message)); e.target.value = '' }} />
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
  onAdd:   (card: Omit<CardDesign, 'id'>) => Promise<string | null>
  existingCount: number
}) {
  const [step, setStep]         = useState<1 | 2>(1)
  const [name, setName]         = useState('')
  const [type, setType]         = useState<CardType>('stamp')
  const [stamps, setStamps]     = useState(8)
  const [points, setPoints]     = useState(10)
  const [rewardMode, setRewardMode] = useState<'dynamic' | 'fixed'>('dynamic')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const TYPES: Array<{ id: CardType; label: string; desc: string }> = [
    { id: 'stamp',      label: 'Tarjeta de sellos',   desc: 'Visitas → premio al completar' },
    { id: 'points',     label: 'Puntos por visita',   desc: 'Acumulan puntos del catálogo'  },
    { id: 'membership', label: 'Membresía por niveles', desc: 'Bronce → Plata → Oro → Black (los editás en Premios)' },
  ]

  async function handleCreate() {
    const DEFAULT_NAMES: Record<CardType, string> = { stamp: 'Sellos', points: 'Puntos', membership: 'Membresía' }
    const draft: Omit<CardDesign, 'id'> = {
      name:           name.trim() || DEFAULT_NAMES[type],
      type,
      isActive:       false,
      color:          '#1B412F',
      secondColor:    '#132F22',
      stampsRequired: type === 'stamp' ? stamps : 0,
      rewardMode:     type === 'stamp' ? rewardMode : null,
      rewardField:    null,
      pointsPerVisit: type === 'points' ? points : null,
    }
    setSaving(true)
    setError(null)
    const errMsg = await onAdd(draft)
    setSaving(false)
    if (errMsg) { setError(errMsg); return }
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
            <input className="dt-modal-input" placeholder="Ej: Club Café" maxLength={40} value={name} onChange={e => setName(e.target.value)} autoFocus />

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
                <NumberStepper value={points} onChange={setPoints} min={1} max={1000} suffix="pts" presets={[5, 10, 20, 50]} ariaLabel="Puntos por visita" />
                <div className="dt-modal-hint">Los premios y umbrales se configuran desde la sección Premios.</div>
              </>
            )}

            {type === 'membership' && (
              <>
                <div className="dt-modal-hint" style={{ marginBottom: 0 }}>
                  Tu membresía arranca con 4 niveles: Bronce, Plata, Oro y Black. Después podés cambiar nombres, colores, visitas y beneficios desde Premios.
                </div>
              </>
            )}

            {error && (
              <div className="dt-modal-hint" style={{ color: '#B23B3B', marginBottom: 0 }}>{error}</div>
            )}
            <div className="dt-modal-footer" style={{ marginTop: 24 }}>
              <button className="dt-modal-cancel" onClick={() => setStep(1)} disabled={saving}>← Atrás</button>
              <button className="dt-modal-next" onClick={handleCreate} disabled={saving}>
                {saving ? 'Creando…' : 'Crear tarjeta'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Card manager ─────────────────────────────────────────────────────────────
function CardManager({ cards: init, businessId, businessName, onSaved, onEdit, onChoosePlan }: {
  cards: CardDesign[]; businessId?: string | null; businessName?: string | null; onSaved?: () => void; onEdit: (card: CardDesign) => void
  onChoosePlan?: () => void
}) {
  const [cards, setCards]         = useState<CardDesign[]>(init)
  const [showModal, setModal]     = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const { can, plan, limit }  = usePlan()
  const planMaxCards          = limit('maxActiveCards')
  const t                     = useLang()

  // Sync when parent passes new real cards
  useEffect(() => { setCards(init) }, [init])

  // Clientes por tarjeta (para no eliminar tarjetas con clientes) y niveles
  // reales de las membresías (miniatura).
  const [stats, setStats] = useState<Record<string, { customers: number; withWallet: number }>>({})
  const [tiersByCard, setTiersByCard] = useState<Record<string, MembershipTier[]>>({})
  const [confirmDeactivate, setConfirmDeactivate] = useState<string | null>(null)
  useEffect(() => {
    if (!businessId) return
    apiCardStats(businessId).then(setStats).catch(() => {})
    init.filter(c => c.type === 'membership').forEach(c => {
      apiGetTiers(businessId, c.id).then(list => setTiersByCard(m => ({ ...m, [c.id]: list.map(t => ({ id: t._id, name: t.name, threshold: t.threshold, perk: t.perk, color: t.color, bg: t.bg })) }))).catch(() => {})
    })
  }, [businessId, init])
  const activeCount           = cards.filter((c: CardDesign) => c.isActive).length
  const atLimit               = activeCount >= planMaxCards

  const [toggleError, setToggleError] = useState<string | null>(null)

  async function toggleCard(id: string, confirmed = false) {
    const card = cards.find((c: CardDesign) => c.id === id)
    if (!card) return
    if (!card.isActive && atLimit) { setToggleError(`Tu plan ${plan} permite ${planMaxCards} tarjeta${planMaxCards === 1 ? '' : 's'} activa${planMaxCards === 1 ? '' : 's'}. Desactivá otra o mejorá el plan.`); return }
    if (card.isActive && !confirmed && (stats[id]?.customers || 0) > 0) { setConfirmDeactivate(id); return }
    setConfirmDeactivate(null)
    setToggleError(null)

    const newActive = !card.isActive
    // Optimista: reflejamos el cambio al toque para que se sienta instantáneo...
    setCards(cards.map((c: CardDesign) => c.id === id ? { ...c, isActive: newActive } : c))

    if (!businessId) return
    try {
      await apiUpdateCard(businessId, id, { isActive: newActive } as any)
      onSaved?.()  // re-sincroniza el padre para que Analytics/Rewards/Notifications vean la tarjeta activa de verdad
    } catch (err: any) {
      // ...pero si el backend lo rechaza (ej. límite de plan cambiado en otra pestaña),
      // revertimos en vez de dejar la UI mintiendo sobre el estado real.
      setCards(cards.map((c: CardDesign) => c.id === id ? { ...c, isActive: !newActive } : c))
      setToggleError(err?.message || err?.error || 'No se pudo actualizar la tarjeta. Intentá de nuevo.')
    }
  }

  function handleAddClick() {
    if (atLimit) return
    setModal(true)
  }

  async function handleCardAdded(draft: Omit<CardDesign, 'id'>): Promise<string | null> {
    if (!businessId) return 'Falta el negocio activo.'
    try {
      const created: any = await apiCreateCard(businessId, {
        name:           draft.name,
        type:           draft.type,
        color:          draft.color,
        secondColor:    draft.secondColor,
        stampsRequired: draft.stampsRequired || undefined,
        rewardMode:     draft.rewardMode || undefined,
        pointsPerVisit: draft.pointsPerVisit || undefined,
      } as any)
      const newCard: CardDesign = {
        id:             created._id,
        name:           created.name,
        type:           created.type,
        isActive:       created.isActive,
        color:          created.color || draft.color,
        secondColor:    created.secondColor || draft.secondColor,
        stampsRequired: created.stampsRequired || draft.stampsRequired,
        rewardMode:     created.rewardMode ?? draft.rewardMode,
        rewardField:    created.rewardFixedValue || null,
        logoUrl:        created.logoUrl || null,
        earnedIcon:     created.earnedIcon || null,
        emptyIcon:      created.emptyIcon || null,
        pointsPerVisit: created.pointsPerVisit || null,
      }
      setCards([...cards, newCard])
      onSaved?.()  // re-sincroniza el estado del padre para que sobreviva un cambio de tab
      return null
    } catch (err: any) {
      return err?.message || 'No se pudo crear la tarjeta. Intentá de nuevo.'
    }
  }

  async function deleteCard(id: string) {
    const prevCards = cards
    setCards(cards.filter((c: CardDesign) => c.id !== id))
    setConfirmDelete(null)
    if (!businessId) return
    try {
      await apiDeleteCard(businessId, id)
      onSaved?.()
    } catch (err: any) {
      setCards(prevCards)  // revert si el backend lo rechaza
      setToggleError(err?.message || err?.error || 'No se pudo eliminar la tarjeta. Intentá de nuevo.')
    }
  }

  return (
    <div className="dt-content">
      {/* Plan bar */}
      <div className="dt-plan-bar">
        <div className="dt-plan-text">
          {planMaxCards >= 999 ? <><strong>{activeCount}</strong> tarjeta{activeCount !== 1 ? 's' : ''} activa{activeCount !== 1 ? 's' : ''} — Plan {plan}</> : <><strong>{activeCount} de {planMaxCards}</strong> tarjeta{planMaxCards !== 1 ? 's' : ''} activa{planMaxCards !== 1 ? 's' : ''} — Plan {plan}</>}
        </div>
        <div className="dt-plan-dots">
          {Array.from({ length: Math.min(planMaxCards, 5) }, (_: unknown, i: number) => (
            <div key={i} className={`dt-plan-dot${i < activeCount ? ' dt-plan-dot--on' : ''}`} />
          ))}
        </div>
        {onChoosePlan && planMaxCards < 999 && <button className="dt-upgrade-link" onClick={onChoosePlan}>Más tarjetas →</button>}
      </div>

      {toggleError && (
        <div className="dt-toggle-error">{toggleError}</div>
      )}

      <div className="dt-cards-grid">
        {cards.map((card: CardDesign) => (
          <div key={card.id} className="dt-card-tile">
            <MiniPass design={card} businessName={businessName} tiers={tiersByCard[card.id]} logos={{ businessLogo: card.logoUrl || null, earnedIcon: card.earnedIcon || null, emptyIcon: card.emptyIcon || null, pointsIcon: card.pointsIcon || null }} />
            <div className="dt-tile-info">
              <div className="dt-tile-name-row">
                <span className="dt-tile-name">{card.name}</span>
                <button className={`dt-tile-toggle${card.isActive ? ' dt-tile-toggle--on' : ''}`} onClick={() => toggleCard(card.id)}>
                  <div className="dt-tile-toggle-thumb" />
                </button>
              </div>
              <div className="dt-tile-sub">
                {card.type === 'stamp'      && `${card.stampsRequired} sellos · ${card.rewardMode === 'dynamic' ? 'el cliente elige' : 'premio fijo'}`}
                {card.type === 'points'     && `${card.pointsPerVisit || 10} pts por visita`}
                {card.type === 'membership' && `${tiersByCard[card.id]?.length || 4} niveles`}
                {stats[card.id] ? ` · ${stats[card.id].customers} cliente${stats[card.id].customers === 1 ? '' : 's'}` : ''}
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
            {atLimit ? `Plan ${plan} · ${planMaxCards} tarjeta${planMaxCards === 1 ? '' : 's'} activa${planMaxCards === 1 ? '' : 's'} máx.` : t('dt_new_card' as any)}
          </div>
          {atLimit && onChoosePlan && (
            <div className="dt-add-upgrade" onClick={e => { e.stopPropagation(); onChoosePlan() }}>Mejorar plan →</div>
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

      {confirmDeactivate && (() => {
        const card = cards.find((c: CardDesign) => c.id === confirmDeactivate)
        if (!card) return null
        const n = stats[card.id]?.customers || 0
        return (
          <div className="dt-modal-overlay" onClick={() => setConfirmDeactivate(null)}>
            <div className="dt-modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
              <div className="dt-modal-header"><div className="dt-modal-title">Desactivar {card.name}</div></div>
              <div style={{ fontSize: 13, color: 'rgba(43,38,32,.65)', lineHeight: 1.6, marginBottom: 20 }}>
                Deja de aparecer en tu formulario de registro, así que no se suman clientes nuevos. Los {n} cliente{n === 1 ? '' : 's'} que ya la tienen la siguen usando y podés seguir escaneándolos.
              </div>
              <div className="dt-modal-footer">
                <button className="dt-modal-cancel" onClick={() => setConfirmDeactivate(null)}>Cancelar</button>
                <button onClick={() => toggleCard(card.id, true)} style={{ background: '#C75D3A', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Desactivar</button>
              </div>
            </div>
          </div>
        )
      })()}

      {confirmDelete && (() => {
        const card = cards.find((c: CardDesign) => c.id === confirmDelete)
        if (!card) return null
        const isOnlyActive = card.isActive && activeCount === 1
        const customers = stats[card.id]?.customers || 0
        return (
          <div className="dt-modal-overlay" onClick={() => setConfirmDelete(null)}>
            <div className="dt-modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
              <div className="dt-modal-header">
                <div className="dt-modal-title">Eliminar tarjeta</div>
                <button className="dt-modal-close" onClick={() => setConfirmDelete(null)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              {customers > 0
                ? <>
                    <div style={{ fontSize: 13, color: 'rgba(43,38,32,.65)', lineHeight: 1.6, marginBottom: 20 }}>
                      <strong>{card.name}</strong> tiene <strong>{customers} cliente{customers === 1 ? '' : 's'}</strong>: no se puede eliminar porque perderían su progreso y su tarjeta dejaría de funcionar.
                      {card.isActive && <> Podés <strong>desactivarla</strong>: deja de aparecer en el formulario de registro, pero quienes ya la tienen la siguen usando.</>}
                    </div>
                    <div className="dt-modal-footer">
                      <button className="dt-modal-cancel" onClick={() => setConfirmDelete(null)}>Cerrar</button>
                      {card.isActive && !isOnlyActive && <button onClick={() => { setConfirmDelete(null); toggleCard(card.id, true) }} style={{ background: '#C75D3A', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Desactivar</button>}
                    </div>
                  </>
                : isOnlyActive
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
                      ¿Eliminar <strong>{card.name}</strong>? Todavía no tiene clientes. Esta acción no se puede deshacer.
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
export function DesignTab({ cards, businessId, businessName, onSaved, onChoosePlan, onGoTo }: {
  cards?: CardDesign[]; businessId?: string | null; businessName?: string | null; onSaved?: () => void
  onChoosePlan?: () => void
  onGoTo?: (tab: 'form' | 'rewards') => void
}) {
  const [editingCard, setEditingCard] = useState<CardDesign | null>(null)

  // Las cards reales ya vienen cargadas del dashboard (fetch único al
  // montar, sin este segundo round-trip) — así no hay ventana de 1-2s
  // mostrando el color del mock antes de que llegue el real.
  const cardDesigns = cards || []

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
        .dt-save-notice{font-size:12px;color:#3F6E3E;background:rgba(91,140,90,.1);border-bottom:1px solid rgba(91,140,90,.2);padding:8px 20px;}
        .dt-save-warn{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;font-size:12.5px;color:#7A5A12;background:rgba(212,162,76,.14);border-bottom:1px solid rgba(212,162,76,.3);padding:10px 20px;}
        .dt-warn-btn{font-size:12px;font-weight:600;border:1px solid rgba(43,38,32,.2);background:#fff;color:#2B2620;border-radius:8px;padding:6px 12px;cursor:pointer;font-family:inherit;}
        .dt-warn-btn--primary{background:#C75D3A;border-color:#C75D3A;color:#fff;}
        .dt-color-warn{font-size:11px;color:#9E4529;background:rgba(199,93,58,.08);border-radius:7px;padding:6px 9px;margin-top:6px;line-height:1.4;}
        .dt-inline-link{background:none;border:none;padding:0;color:#C75D3A;font-weight:700;cursor:pointer;font-family:inherit;font-size:inherit;}
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
        .dt-logo-error{font-size:9.5px;color:#B23B3B;text-align:center;line-height:1.4;padding:0 4px;}
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
        .dt-reward-current{font-size:12px;color:#2B2620;}
        .dt-reward-current--empty{color:rgba(43,38,32,.5);font-style:italic;}
        .dt-reward-goto-forms{font-size:10.5px;color:rgba(43,38,32,.5);margin-top:4px;line-height:1.5;}
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
        .dt-appearance-label{font-size:11.5px;color:rgba(43,38,32,.55);margin-bottom:8px;font-weight:500;display:flex;align-items:center;gap:4px;}
        .dt-color-row{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;}
        .dt-color-dot{width:24px;height:24px;flex:0 0 24px;padding:0;aspect-ratio:1;border-radius:50%;border:2.5px solid transparent;cursor:pointer;transition:all .15s;}
        .dt-color-dot--on{border-color:#2B2620;transform:scale(1.12);}
        .dt-custom-color-row{display:flex;align-items:center;gap:8px;}
        .dt-custom-swatch{width:26px;height:26px;border-radius:50%;border:2px solid rgba(43,38,32,.2);cursor:pointer;display:block;overflow:hidden;flex-shrink:0;}
        .dt-color-native{opacity:0;width:1px;height:1px;border:none;padding:0;}
        .dt-hex-input{width:80px;padding:5px 8px;font-size:11.5px;border:1px solid rgba(43,38,32,.15);border-radius:7px;background:#FBF6EE;color:#2B2620;font-family:monospace;outline:none;}
        .dt-hex-input:focus{border-color:#C75D3A;}
        .dt-hex-label{font-size:10px;color:rgba(43,38,32,.45);}
        .dt-opts{display:flex;flex-wrap:wrap;gap:6px;}
        .dt-opt{display:inline-flex;align-items:center;gap:2px;background:#fff;border:1.5px solid rgba(43,38,32,.14);border-radius:999px;padding:3px 4px 3px 10px;}
        .dt-opt:focus-within{border-color:#C75D3A;}
        .dt-opt input{border:none;outline:none;background:transparent;font-size:12px;font-weight:600;color:#2B2620;font-family:'Inter',sans-serif;min-width:4ch;max-width:200px;padding:0;}
        .dt-opt button{width:20px;height:20px;border-radius:50%;border:none;background:rgba(43,38,32,.07);color:rgba(43,38,32,.6);cursor:pointer;font-size:14px;line-height:1;display:flex;align-items:center;justify-content:center;}
        .dt-opt button:hover{background:rgba(199,93,58,.15);color:#C75D3A;}
        .dt-opt--new{border-style:dashed;padding-right:10px;}
        .dt-opt--new input{width:190px;font-weight:500;}
        .dt-swatches{display:flex;flex-wrap:wrap;align-items:center;gap:8px;}
        .dt-swatch{width:26px;height:26px;flex:0 0 26px;padding:0;border-radius:50%;border:1.5px solid rgba(43,38,32,.18);cursor:pointer;position:relative;display:flex;align-items:center;justify-content:center;transition:transform .12s,box-shadow .12s;}
        .dt-swatch:hover{transform:scale(1.08);}
        .dt-swatch--on{box-shadow:0 0 0 2px #fff,0 0 0 4px #C75D3A;}
        .dt-swatch--auto{background:#fff;font-size:11px;font-weight:800;color:rgba(43,38,32,.6);font-family:'Plus Jakarta Sans',sans-serif;}
        .dt-swatch--custom{background:conic-gradient(#f43f5e,#f59e0b,#84cc16,#06b6d4,#6366f1,#d946ef,#f43f5e);overflow:hidden;}
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
        .dt-real-pass-tier-ladder{padding:8px 24px 20px;}
        .dt-real-pass-ladder-row{display:flex;align-items:flex-start;margin-bottom:10px;}
        .dt-real-pass-ladder-step{display:flex;flex-direction:column;align-items:center;gap:6px;opacity:.45;flex-shrink:0;}
        .dt-real-pass-ladder-step--on{opacity:1;}
        .dt-real-pass-ladder-dot{width:26px;height:26px;border-radius:50%;background:rgba(255,255,255,.18);flex-shrink:0;}
        .dt-real-pass-ladder-step--on .dt-real-pass-ladder-dot{width:34px;height:34px;box-shadow:0 0 0 3px rgba(255,255,255,.3);}
        .dt-real-pass-ladder-label{font-size:9px;color:#FFFFFF;font-weight:600;text-align:center;}
        .dt-real-pass-ladder-line{flex:1;height:2px;background:rgba(255,255,255,.25);margin:16px 4px 0;}
        .dt-real-pass-ladder-line--on{background:rgba(255,255,255,.7);}
        .dt-real-pass-tier-perk{font-size:11px;color:rgba(255,255,255,.65);text-align:center;}
        .dt-ladder{padding:14px 16px 18px;}
        .dt-ladder-steps{position:relative;display:grid;}
        .dt-ladder-track{position:absolute;top:10px;height:3px;}
        .dt-ladder-track::before{content:'';position:absolute;inset:0;border-radius:3px;background:currentColor;opacity:.22;}
        .dt-ladder-fill{position:absolute;left:0;top:0;bottom:0;border-radius:3px;background:currentColor;opacity:.85;}
        .dt-ladder-step{position:relative;display:flex;flex-direction:column;align-items:center;gap:7px;}
        .dt-ladder-dot{width:12px;height:12px;margin-top:5.5px;border-radius:50%;background:currentColor;opacity:.3;}
        .dt-ladder-step.is-done .dt-ladder-dot{opacity:.9;}
        .dt-ladder-step.is-on .dt-ladder-dot{width:22px;height:22px;margin-top:0;opacity:1;box-shadow:0 0 0 4px rgba(255,255,255,.18);}
        .dt-ladder-name{font-size:9.5px;font-weight:500;opacity:.6;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;}
        .dt-ladder-step.is-done .dt-ladder-name{opacity:.85;}
        .dt-ladder-step.is-on .dt-ladder-name{font-weight:800;opacity:1;}
        .dt-ladder-caption{margin:14px auto 0;width:max-content;max-width:100%;font-size:11px;font-weight:600;padding:5px 12px;border-radius:999px;border:1px solid currentColor;opacity:.9;}
        .dt-real-pass-points-area{padding:8px 24px 20px;}
        .dt-real-pass-points-row{display:flex;align-items:center;gap:12px;margin-bottom:12px;}
        .dt-real-pass-points-icon{width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;}
        .dt-real-pass-points-num{font-size:32px;font-weight:800;color:#FFFFFF;}
        .dt-pts-bar{position:relative;height:6px;margin:4px 0 10px;}
        .dt-pts-bar::before{content:'';position:absolute;inset:0;border-radius:3px;background:currentColor;opacity:.22;}
        .dt-pts-fill{position:absolute;left:0;top:0;bottom:0;border-radius:3px;background:currentColor;}
        .dt-pts-mark{position:absolute;top:50%;width:12px;height:12px;border-radius:50%;transform:translate(-50%,-50%);box-sizing:border-box;border:2px solid currentColor;}
        .dt-pts-mark.is-ok{border:none;}
        .dt-real-pass-points-sub{font-size:10px;color:rgba(255,255,255,.6);}
        .dt-real-pass-info{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:0 24px 20px;}
        .dt-real-pass-info-label{font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.65);font-weight:600;margin-bottom:4px;}
        .dt-real-pass-info-val{font-size:16px;font-weight:700;color:#FFFFFF;}
        .dt-real-pass-qr-section{background:#FFFFFF;border-radius:14px;padding:14px 18px 10px;display:flex;flex-direction:column;align-items:center;gap:6px;margin:4px 24px 24px;}
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
        .dt-toggle-error{background:rgba(178,59,59,.08);border:1px solid rgba(178,59,59,.25);color:#B23B3B;border-radius:10px;padding:10px 14px;font-size:12.5px;margin-top:12px;}
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
        .dt-mini-qr-hint{width:28px;height:28px;background:rgba(255,255,255,.9);border-radius:4px;margin-top:auto;align-self:flex-end;display:flex;align-items:center;justify-content:center;}
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
        .dt-type-fixed{background:#FBF6EE;border:1.5px solid rgba(43,38,32,.1);border-radius:9px;padding:10px 12px;}
        .dt-type-fixed-label{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:#2B2620;}
        .dt-type-fixed-note{font-size:10.5px;color:rgba(43,38,32,.4);line-height:1.5;}
        .dt-membership-color-note{font-size:11px;color:rgba(43,38,32,.5);background:#FBF6EE;border-radius:9px;padding:10px 12px;line-height:1.5;}
        .dt-public-desc-input{width:100%;padding:10px 12px;font-size:12.5px;border:1.5px solid rgba(43,38,32,.12);border-radius:9px;background:#FBF6EE;color:#2B2620;font-family:'Inter',sans-serif;outline:none;}
        .dt-public-desc-input:focus{border-color:#C75D3A;background:#fff;}
        .dt-public-desc-note{font-size:10px;color:rgba(43,38,32,.4);line-height:1.5;margin-top:6px;}
        .dt-pass-flip-wrap{transition:opacity .3s ease, transform .3s ease;}
        .dt-pass-flip-wrap--flipping{opacity:0;transform:scale(.96);}
        /* Prize card body */
        .dt-prize-pass{width:300px;min-height:420px;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(43,38,32,.25);display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:36px 28px;text-align:center;gap:18px;}
        .dt-prize-top-msg{font-size:22px;font-weight:800;color:#FFFFFF;line-height:1.25;letter-spacing:-.01em;}
        .dt-prize-img-area{flex:1;width:100%;display:flex;align-items:center;justify-content:center;min-height:150px;}
        .dt-prize-img{width:100%;max-height:180px;object-fit:contain;border-radius:12px;}
        .dt-prize-img-placeholder{display:flex;flex-direction:column;align-items:center;gap:10px;padding:24px;border:1.5px dashed rgba(255,255,255,.3);border-radius:14px;width:100%;}
        .dt-prize-img-hint{font-size:11.5px;color:rgba(255,255,255,.5);}
        .dt-prize-bottom-msg{font-size:12.5px;color:rgba(255,255,255,.7);line-height:1.6;max-width:230px;}
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
        ? <CardEditor card={editingCard} businessId={businessId} businessName={businessName} onSaved={onSaved} onBack={() => setEditingCard(null)} onGoTo={onGoTo} />
        : <CardManager cards={cardDesigns} businessId={businessId} businessName={businessName} onSaved={onSaved} onEdit={setEditingCard} onChoosePlan={onChoosePlan} />
      }
    </>
  )
}