'use client'
import React, { useState, useRef, useEffect } from 'react'
import { apiGetFields, apiCreateField, apiUpdateField, apiDeleteField, apiReorderFields, BASE_URL } from '@/lib/api'
import { usePlan } from '@/data/plans'

// ─── Types ────────────────────────────────────────────────────────────────────
type FieldType = 'text' | 'email' | 'date' | 'select' | 'tel' | 'number'

interface FormField {
  id: string
  label: string
  type: FieldType
  isLocked: boolean
  isActive: boolean
  isRewardSource: boolean
  order: number
  placeholder?: string
  options?: string[]
  isCustom?: boolean
}

interface CardDesign {
  id: string
  name: string
  type: 'stamp' | 'points' | 'membership'
  isActive: boolean
  color: string
}

interface FormTabProps {
  businessName: string
  businessSlug: string
  cardDesigns: CardDesign[]
  businessId?: string | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FIXED_FIELDS: FormField[] = [
  { id: 'name',  label: 'Nombre completo', type: 'text',  isLocked: true, isActive: true, isRewardSource: false, order: 1, placeholder: 'Tu nombre y apellido' },
  { id: 'email', label: 'Email',           type: 'email', isLocked: true, isActive: true, isRewardSource: false, order: 2, placeholder: 'tu@email.com' },
]

// Generic optional fields — editable labels, applicable to any industry
const makeDefaultOptional = (): FormField[] => [
  { id: 'dob',    label: 'Fecha de nacimiento', type: 'date', isLocked: false, isActive: true,  isRewardSource: false, order: 3 },
  { id: 'phone',  label: 'Teléfono',            type: 'tel',  isLocked: false, isActive: false, isRewardSource: false, order: 4, placeholder: '+54 11 0000-0000' },
  { id: 'zone',   label: 'Barrio / Zona',        type: 'text', isLocked: false, isActive: false, isRewardSource: false, order: 5, placeholder: 'Ej: Palermo' },
  { id: 'pref1',  label: 'Preferencia principal',type: 'text', isLocked: false, isActive: true,  isRewardSource: true,  order: 6, placeholder: 'Personalizable por rubro' },
  { id: 'pref2',  label: 'Preferencia secundaria',type:'select',isLocked: false, isActive: true,  isRewardSource: false, order: 7, options: ['Opción 1','Opción 2','Opción 3'] },
]

const FIELD_TYPE_OPTIONS = [
  { value: 'text',   label: 'Texto libre' },
  { value: 'number', label: 'Número' },
  { value: 'date',   label: 'Fecha' },
  { value: 'select', label: 'Lista de opciones' },
  { value: 'tel',    label: 'Teléfono' },
]

const TYPE_ICONS: Record<FieldType, string> = {
  text: 'T', email: '@', date: '📅', select: '≡', tel: '📱', number: '#',
}

const TYPE_CARD_ICONS: Record<string, string> = { stamp: '☕', points: '🪙', membership: '🎫' }

// ─── QR Placeholder ───────────────────────────────────────────────────────────
function QRCode({ size = 120 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 21 21" fill="none">
      <rect x="0" y="0" width="7" height="7" fill="#2B2620"/><rect x="1" y="1" width="5" height="5" fill="#FBF6EE"/><rect x="2" y="2" width="3" height="3" fill="#2B2620"/>
      <rect x="14" y="0" width="7" height="7" fill="#2B2620"/><rect x="15" y="1" width="5" height="5" fill="#FBF6EE"/><rect x="16" y="2" width="3" height="3" fill="#2B2620"/>
      <rect x="0" y="14" width="7" height="7" fill="#2B2620"/><rect x="1" y="15" width="5" height="5" fill="#FBF6EE"/><rect x="2" y="16" width="3" height="3" fill="#2B2620"/>
      <rect x="9" y="0" width="1" height="1" fill="#2B2620"/><rect x="11" y="1" width="2" height="1" fill="#2B2620"/>
      <rect x="8" y="8" width="2" height="4" fill="#2B2620"/><rect x="11" y="8" width="3" height="1" fill="#2B2620"/>
      <rect x="9" y="13" width="3" height="1" fill="#2B2620"/><rect x="9" y="15" width="1" height="3" fill="#2B2620"/>
      <rect x="11" y="15" width="2" height="2" fill="#2B2620"/><rect x="15" y="15" width="4" height="1" fill="#2B2620"/>
      <rect x="14" y="17" width="3" height="1" fill="#2B2620"/><rect x="18" y="16" width="2" height="2" fill="#2B2620"/>
    </svg>
  )
}

// ─── Mobile Preview ───────────────────────────────────────────────────────────
function MobilePreview({ fields, businessName, brandColor, brandLogo }: {
  fields: FormField[]
  businessName: string
  brandColor: string
  brandLogo: string | null
}) {
  const activeFields = fields.filter(f => f.isActive)
  const rewardField  = fields.find(f => f.isRewardSource)

  return (
    <div className="fm-phone">
      <div className="fm-phone-top"><div className="fm-phone-notch" /></div>
      <div className="fm-phone-screen">
        <div className="fm-form-header" style={{ background: `linear-gradient(160deg, ${brandColor}, ${brandColor}cc)` }}>
          <div className="fm-form-logo">
            {brandLogo
              ? <img src={brandLogo} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 10 }} alt="" />
              : <span style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>S</span>
            }
          </div>
          <div className="fm-form-biz">{businessName}</div>
          <div className="fm-form-sub">Completá tus datos para obtener tu tarjeta</div>
        </div>
        <div className="fm-form-fields">
          {activeFields.slice(0, 5).map((f: FormField) => (
            <div key={f.id} className="fm-form-field">
              <div className="fm-form-label">
                {f.label}
                {f.isRewardSource && <span className="fm-reward-dot" />}
              </div>
              {f.type === 'select' && f.options
                ? <div className="fm-form-select"><span>{f.options[0]}</span><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg></div>
                : <div className="fm-form-input">{f.placeholder || ''}</div>
              }
            </div>
          ))}
          {activeFields.length > 5 && <div className="fm-form-more">+{activeFields.length - 5} campos más</div>}
        </div>
        <button className="fm-form-submit" style={{ background: brandColor }}>Obtener mi tarjeta →</button>
        {rewardField && <div className="fm-reward-hint">Tu "{rewardField.label}" será tu premio</div>}
      </div>
      <div className="fm-phone-bottom"><div className="fm-phone-home" /></div>
    </div>
  )
}

// ─── Editable optional field row ──────────────────────────────────────────────
function OptionalFieldRow({ field, onUpdate, onToggle, onSetReward, onDragStart, onDragEnter, onDragEnd }: {
  field: FormField
  onUpdate: (id: string, label: string) => void
  onToggle: (id: string) => void
  onSetReward: (id: string) => void
  onDragStart: () => void
  onDragEnter: () => void
  onDragEnd: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [label, setLabel]     = useState(field.label)

  function saveLabel() {
    onUpdate(field.id, label)
    setEditing(false)
  }

  return (
    <div
      className={`fm-field-row${!field.isActive ? ' fm-field-row--inactive' : ''}${field.isRewardSource ? ' fm-field-row--reward' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragEnd={onDragEnd}
      onDragOver={e => e.preventDefault()}
    >
      <div className="fm-grip">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
          <circle cx="9"  cy="5"  r="1.5" fill="currentColor"/><circle cx="9"  cy="12" r="1.5" fill="currentColor"/><circle cx="9"  cy="19" r="1.5" fill="currentColor"/>
          <circle cx="15" cy="5"  r="1.5" fill="currentColor"/><circle cx="15" cy="12" r="1.5" fill="currentColor"/><circle cx="15" cy="19" r="1.5" fill="currentColor"/>
        </svg>
      </div>
      <div className="fm-field-type-tag">{TYPE_ICONS[field.type]}</div>

      {editing
        ? <input
            className="fm-label-edit-input"
            value={label}
            onChange={e => setLabel(e.target.value)}
            onBlur={saveLabel}
            onKeyDown={e => e.key === 'Enter' && saveLabel()}
            autoFocus
            onClick={e => e.stopPropagation()}
          />
        : <span className="fm-field-label" onDoubleClick={() => setEditing(true)}>{field.label}</span>
      }

      <div className="fm-field-actions">
        {field.isRewardSource && <span className="fm-reward-badge">★ Premio</span>}
        {!field.isRewardSource && field.isActive && (
          <button className="fm-set-reward-btn" onClick={() => onSetReward(field.id)} title="Usar como campo de premio">★</button>
        )}
        <button className="fm-edit-label-btn" onClick={() => setEditing(true)} title="Renombrar campo">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        </button>
        <button className="fm-toggle-btn" onClick={() => onToggle(field.id)} title={field.isActive ? 'Ocultar' : 'Mostrar'}>
          {field.isActive
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          }
        </button>
      </div>
    </div>
  )
}

// ─── Custom field builder ─────────────────────────────────────────────────────
function CustomFieldBuilder({ fields, onChange, maxCustom, businessId, cardId }: { fields: FormField[]; onChange: (f: FormField[]) => void; maxCustom: number; businessId?: string | null; cardId?: string }) {
  function add() {
    if (fields.length >= maxCustom) return
    onChange([...fields, { id: `c-${Date.now()}`, label: '', type: 'text', isLocked: false, isActive: true, isRewardSource: false, order: 100 + fields.length, isCustom: true }])
  }
  function update(id: string, patch: Partial<FormField>) {
    onChange(fields.map((f: FormField) => f.id === id ? { ...f, ...patch } : f))
  }
  async function remove(id: string) {
    onChange(fields.filter((f: FormField) => f.id !== id))
    // Los campos con id temporal (c-...) todavía no se guardaron en el
    // backend — sacarlos del estado local alcanza. Los que ya tienen un
    // _id real de Mongo hay que borrarlos de verdad, o si no reaparecen
    // solos la próxima vez que se recargue la página (quedaban huérfanos
    // en la base, la eliminación nunca llegaba a persistir).
    if (!id.startsWith('c-') && businessId && cardId) {
      try {
        await apiDeleteField(businessId, cardId, id)
      } catch (err) {
        console.error('Error eliminando campo:', err)
      }
    }
  }

  return (
    <div className="fm-custom-section">
      {fields.map((f: FormField, i: number) => (
        <div key={f.id} className="fm-custom-row">
          <div className="fm-custom-num">{i + 1}</div>
          <input className="fm-custom-input" placeholder="Nombre del campo" value={f.label} onChange={e => update(f.id, { label: e.target.value })} />
          <select className="fm-custom-select" value={f.type} onChange={e => update(f.id, { type: e.target.value as FieldType })}>
            {FIELD_TYPE_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
          </select>
          <button className={`fm-reward-toggle${f.isRewardSource ? ' fm-reward-toggle--on' : ''}`} onClick={() => update(f.id, { isRewardSource: !f.isRewardSource })} title="Usar como campo de premio">★</button>
          <button className="fm-remove-btn" onClick={() => remove(f.id)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      ))}
      {maxCustom === 0
        ? <div className="fm-max-note">Los campos personalizados están disponibles desde el plan Growth.</div>
        : fields.length < maxCustom
        ? <button className="fm-add-field-btn" onClick={add}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Agregar campo personalizado ({fields.length}/{maxCustom})
          </button>
        : <div className="fm-max-note">Límite de {maxCustom} campos personalizados alcanzado</div>
      }
    </div>
  )
}

// ─── Share section (Link + QR only) ──────────────────────────────────────────
function ShareSection({ businessName, slug }: { businessName: string; slug: string }) {
  const [copied, setCopied] = useState(false)
  const link = `https://stampa.app/r/${slug}`

  function copyLink() {
    navigator.clipboard?.writeText(link).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="fm-share-grid">
      <div className="fm-card">
        <div className="fm-card-title">Link del formulario</div>
        <div className="fm-card-sub">Compartilo por WhatsApp, redes sociales o donde quieras</div>
        <div className="fm-link-row">
          <div className="fm-link-box">{link}</div>
          <button className={`fm-copy-btn${copied ? ' fm-copy-btn--done' : ''}`} onClick={copyLink}>
            {copied
              ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copiado</>
              : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copiar link</>
            }
          </button>
        </div>
        <div className="fm-link-hint">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
          Ideal para WhatsApp, bio de Instagram o un cartel en el local
        </div>
      </div>

      <div className="fm-card">
        <div className="fm-card-title">Código QR</div>
        <div className="fm-card-sub">Imprimilo y ponelo en el mostrador o la mesa</div>
        <div className="fm-qr-wrap">
          <div className="fm-qr-box">
            <QRCode size={120} />
            <div className="fm-qr-label">{businessName}</div>
          </div>
          <button className="fm-download-btn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Descargar QR
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function FormTab({ businessName, businessSlug, cardDesigns, businessId }: FormTabProps) {
  const { can, limit } = usePlan()
  const MAX_CUSTOM = limit('maxCustomFields')
  const activeCards = cardDesigns.filter((c: CardDesign) => c.isActive)
  const [selectedCardId, setSelectedCardId] = useState<string>(activeCards[0]?.id || '')
  const [loadingFields, setLoadingFields] = useState(false)
  const selectedCard = activeCards.find((c: CardDesign) => c.id === selectedCardId) || activeCards[0]

  // Per-card form state
  const [cardForms, setCardForms] = useState<Record<string, FormField[]>>(
    Object.fromEntries(activeCards.map((c: CardDesign) => [c.id, makeDefaultOptional()]))
  )
  const [cardCustom, setCardCustom] = useState<Record<string, FormField[]>>(
    Object.fromEntries(activeCards.map((c: CardDesign) => [c.id, []]))
  )
  // Load real fields from backend when card or businessId changes
  useEffect(() => {
    if (!businessId || !selectedCardId) return
    setLoadingFields(true)
    apiGetFields(businessId, selectedCardId).then(fields => {
      if (fields.length > 0) {
        const fixed = fields.filter((f: any) => f.isLocked).map((f: any) => ({
          id: f._id, label: f.label, type: f.fieldType, isLocked: true,
          isActive: f.isActive, isRewardSource: f.isRewardSource, order: f.order,
          placeholder: f.placeholder || '',
        }))
        const custom = fields.filter((f: any) => !f.isLocked).map((f: any) => ({
          id: f._id, label: f.label, type: f.fieldType, isLocked: false,
          isActive: f.isActive, isRewardSource: f.isRewardSource, order: f.order,
          placeholder: f.placeholder || '', options: f.options,
        }))
        setCardForms(prev => ({ ...prev, [selectedCardId]: fixed }))
        setCardCustom(prev => ({ ...prev, [selectedCardId]: custom }))
      }
    }).catch(console.error).finally(() => setLoadingFields(false))
  }, [businessId, selectedCardId])


  // Branding state
  const [brandColor, setBrandColor] = useState(selectedCard?.color || '#1B412F')
  const [brandLogo, setBrandLogo]   = useState<string | null>(null)
  const logoRef = useRef<HTMLInputElement>(null)

  const [saved, setSaved] = useState(false)
  const dragIndex = useRef<number | null>(null)

  const optional = cardForms[selectedCardId] || []
  const custom   = cardCustom[selectedCardId] || []
  const allFields = [...FIXED_FIELDS, ...optional, ...custom]

  function setOptional(fields: FormField[]) {
    setCardForms({ ...cardForms, [selectedCardId]: fields })
  }
  function setCustom(fields: FormField[]) {
    setCardCustom({ ...cardCustom, [selectedCardId]: fields })
  }

  function toggleOptional(id: string) {
    setOptional(optional.map((f: FormField) => f.id === id ? { ...f, isActive: !f.isActive } : f))
  }

  function updateLabel(id: string, label: string) {
    setOptional(optional.map((f: FormField) => f.id === id ? { ...f, label } : f))
  }

  function setRewardSource(id: string) {
    const clearAll = (arr: FormField[]) => arr.map((f: FormField) => ({ ...f, isRewardSource: false }))
    const newOpt = clearAll(optional)
    const newCst = clearAll(custom)
    const inOpt = newOpt.findIndex((f: FormField) => f.id === id)
    const inCst = newCst.findIndex((f: FormField) => f.id === id)
    if (inOpt >= 0) newOpt[inOpt] = { ...newOpt[inOpt], isRewardSource: true }
    if (inCst >= 0) newCst[inCst] = { ...newCst[inCst], isRewardSource: true }
    setOptional(newOpt)
    setCustom(newCst)
  }

  function handleDragStart(i: number) { dragIndex.current = i }
  function handleDragEnter(i: number) {
    if (dragIndex.current === null || dragIndex.current === i) return
    const arr = [...optional]
    const dragged = arr.splice(dragIndex.current, 1)[0]
    arr.splice(i, 0, dragged)
    dragIndex.current = i
    setOptional(arr)
  }
  function handleDragEnd() { dragIndex.current = null }

  function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setBrandLogo(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    if (!businessId || !selectedCardId) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      return
    }
    try {
      const token = localStorage.getItem('stampa_token')
      const allCustomFields = [...optional, ...custom]

      // Update each field that has a real MongoDB _id
      await Promise.all(allCustomFields
        .filter((f: FormField) => !f.id.startsWith('c-') && !['name','email'].includes(f.id))
        .map((f: FormField) =>
          fetch(`${BASE_URL}/api/businesses/${businessId}/cards/${selectedCardId}/fields/${f.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({
              label: f.label,
              isActive: f.isActive,
              isRewardSource: f.isRewardSource,
              order: f.order,
            })
          })
        )
      )

      // Create new custom fields (those with temp id starting with 'c-')
      await Promise.all(custom
        .filter((f: FormField) => f.id.startsWith('c-') && f.label.trim())
        .map((f: FormField) =>
          fetch(`${BASE_URL}/api/businesses/${businessId}/cards/${selectedCardId}/fields`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({
              label: f.label,
              fieldType: f.type || 'text',
              isRewardSource: f.isRewardSource,
              order: f.order,
            })
          })
        )
      )

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('Error saving form fields:', err)
    }
  }

  const rewardField = allFields.find((f: FormField) => f.isRewardSource)

  return (
    <>
      <style>{`
        .fm-shell{flex:1;overflow-y:auto;padding:20px 24px;display:flex;flex-direction:column;gap:14px;}
        .fm-top-bar{display:flex;align-items:center;justify-content:space-between;}
        .fm-top-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:17px;color:#2B2620;}
        .fm-top-sub{font-size:12px;color:rgba(43,38,32,.45);margin-top:2px;}
        .fm-save-btn{background:#C75D3A;color:#fff;border:none;border-radius:10px;padding:10px 22px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;}
        .fm-save-btn:hover{background:#B14F2F;}
        .fm-lbl{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:rgba(43,38,32,.38);font-weight:600;display:flex;align-items:center;gap:10px;}
        .fm-lbl::after{content:'';flex:1;height:1px;background:rgba(43,38,32,.1);}
        .fm-card{background:#FFFFFF;border:1px solid rgba(43,38,32,.07);border-radius:14px;padding:16px;box-shadow:0 1px 8px rgba(43,38,32,.04);}
        .fm-card-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:13px;color:#2B2620;margin-bottom:2px;}
        .fm-card-sub{font-size:11px;color:rgba(43,38,32,.45);margin-bottom:14px;}
        .fm-main-grid{display:grid;grid-template-columns:1fr 240px;gap:16px;align-items:start;}

        /* ── Card selector ── */
        .fm-card-selector{display:flex;gap:6px;}
        .fm-card-pill{display:flex;align-items:center;gap:6px;font-size:12px;padding:7px 14px;border-radius:20px;border:1.5px solid rgba(43,38,32,.12);background:#FFFFFF;color:rgba(43,38,32,.55);cursor:pointer;transition:all .15s;font-family:'Inter',sans-serif;}
        .fm-card-pill--on{background:#1B412F;border-color:#1B412F;color:#F7F0E4;font-weight:600;}

        /* ── Branding ── */
        .fm-brand-grid{display:grid;grid-template-columns:auto 1fr;gap:20px;align-items:center;}
        .fm-brand-logo-wrap{display:flex;flex-direction:column;align-items:center;gap:6px;}
        .fm-brand-logo-zone{width:72px;height:72px;border:1.5px dashed rgba(43,38,32,.2);border-radius:14px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s;overflow:hidden;background:#FBF6EE;}
        .fm-brand-logo-zone:hover{border-color:#C75D3A;}
        .fm-brand-logo-zone--filled{border-style:solid;border-color:rgba(43,38,32,.12);}
        .fm-brand-logo-img{width:100%;height:100%;object-fit:contain;padding:6px;}
        .fm-brand-logo-hint{font-size:9.5px;color:rgba(43,38,32,.45);text-align:center;}
        .fm-brand-logo-remove{font-size:9.5px;color:#B23B3B;background:none;border:none;cursor:pointer;}
        .fm-brand-fields{display:flex;flex-direction:column;gap:12px;}
        .fm-brand-field-label{font-size:10px;font-weight:700;color:rgba(43,38,32,.45);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;}
        .fm-color-row{display:flex;align-items:center;gap:10px;}
        .fm-color-swatch{width:32px;height:32px;border-radius:50%;border:2.5px solid transparent;cursor:pointer;transition:all .15s;flex-shrink:0;}
        .fm-color-swatch--on{border-color:#2B2620;transform:scale(1.1);}
        .fm-custom-color-swatch{width:32px;height:32px;border-radius:50%;border:2px solid rgba(43,38,32,.2);cursor:pointer;flex-shrink:0;overflow:hidden;display:block;}
        .fm-color-native{opacity:0;width:1px;height:1px;}
        .fm-hex-input{width:88px;padding:6px 9px;font-size:12px;border:1px solid rgba(43,38,32,.15);border-radius:8px;background:#FBF6EE;color:#2B2620;font-family:monospace;outline:none;}
        .fm-hex-input:focus{border-color:#C75D3A;}

        /* ── Fixed fields ── */
        .fm-fixed-list{display:flex;flex-direction:column;gap:4px;}
        .fm-fixed-row{display:flex;align-items:center;gap:8px;padding:9px 12px;background:#FBF6EE;border:1px solid rgba(43,38,32,.07);border-radius:9px;font-size:12px;color:rgba(43,38,32,.6);}
        .fm-fixed-type{width:22px;height:22px;border-radius:6px;background:rgba(43,38,32,.08);display:flex;align-items:center;justify-content:center;font-size:10px;color:rgba(43,38,32,.5);flex-shrink:0;}
        .fm-fixed-name{flex:1;}
        .fm-fixed-badge{font-size:9px;padding:2px 8px;border-radius:20px;background:rgba(43,38,32,.08);color:rgba(43,38,32,.5);}

        /* ── Optional fields ── */
        .fm-fields-list{display:flex;flex-direction:column;gap:4px;}
        .fm-field-row{display:flex;align-items:center;gap:8px;padding:9px 11px;background:#FBF6EE;border:1px solid rgba(43,38,32,.07);border-radius:9px;font-size:12px;color:#2B2620;cursor:grab;transition:background .1s;}
        .fm-field-row:hover{background:#F5EFE6;}
        .fm-field-row--inactive{opacity:.4;}
        .fm-field-row--reward{border-color:#C75D3A;background:rgba(199,93,58,.06);}
        .fm-grip{color:rgba(43,38,32,.3);flex-shrink:0;display:flex;align-items:center;}
        .fm-field-type-tag{width:22px;height:22px;border-radius:6px;background:rgba(43,38,32,.08);display:flex;align-items:center;justify-content:center;font-size:10px;color:rgba(43,38,32,.5);flex-shrink:0;}
        .fm-field-label{flex:1;cursor:default;}
        .fm-label-edit-input{flex:1;padding:3px 7px;font-size:12px;border:1.5px solid #C75D3A;border-radius:7px;background:#FFFFFF;color:#2B2620;font-family:'Inter',sans-serif;outline:none;}
        .fm-field-actions{display:flex;align-items:center;gap:4px;flex-shrink:0;}
        .fm-reward-badge{font-size:9px;padding:2px 9px;border-radius:20px;background:rgba(199,93,58,.15);color:#C75D3A;font-weight:700;}
        .fm-set-reward-btn{background:none;border:none;cursor:pointer;color:rgba(43,38,32,.2);font-size:13px;padding:2px 4px;border-radius:4px;transition:color .15s;}
        .fm-set-reward-btn:hover{color:#C75D3A;}
        .fm-edit-label-btn{background:none;border:none;cursor:pointer;color:rgba(43,38,32,.3);display:flex;align-items:center;padding:2px;border-radius:4px;}
        .fm-edit-label-btn:hover{color:#185FA5;}
        .fm-toggle-btn{background:none;border:none;cursor:pointer;color:rgba(43,38,32,.4);display:flex;align-items:center;padding:2px;border-radius:4px;}
        .fm-toggle-btn:hover{color:#C75D3A;}

        /* ── Custom fields ── */
        .fm-custom-section{display:flex;flex-direction:column;gap:8px;}
        .fm-custom-row{display:flex;align-items:center;gap:8px;}
        .fm-custom-num{width:20px;height:20px;border-radius:6px;background:rgba(43,38,32,.08);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:rgba(43,38,32,.5);flex-shrink:0;}
        .fm-custom-input{flex:1;padding:8px 11px;font-size:12px;border:1px solid rgba(43,38,32,.12);border-radius:9px;background:#FBF6EE;color:#2B2620;font-family:'Inter',sans-serif;outline:none;}
        .fm-custom-input:focus{border-color:#C75D3A;}
        .fm-custom-select{padding:8px 10px;font-size:12px;border:1px solid rgba(43,38,32,.12);border-radius:9px;background:#FBF6EE;color:#2B2620;font-family:'Inter',sans-serif;outline:none;}
        .fm-reward-toggle{background:none;border:1.5px solid rgba(43,38,32,.12);border-radius:7px;cursor:pointer;color:rgba(43,38,32,.3);font-size:14px;padding:5px 8px;transition:all .15s;}
        .fm-reward-toggle--on{border-color:#C75D3A;color:#C75D3A;background:rgba(199,93,58,.08);}
        .fm-remove-btn{background:none;border:none;cursor:pointer;color:rgba(43,38,32,.3);display:flex;align-items:center;padding:4px;border-radius:6px;}
        .fm-remove-btn:hover{color:#B23B3B;}
        .fm-add-field-btn{display:flex;align-items:center;gap:7px;font-size:12.5px;color:#C75D3A;font-weight:700;background:none;border:1.5px dashed rgba(199,93,58,.3);border-radius:10px;padding:10px 14px;cursor:pointer;transition:all .15s;width:100%;}
        .fm-add-field-btn:hover{background:rgba(199,93,58,.04);}
        .fm-max-note{font-size:11px;color:rgba(43,38,32,.4);text-align:center;padding:8px 0;}

        /* ── Reward info ── */
        .fm-reward-info{display:flex;align-items:flex-start;gap:10px;padding:11px 14px;background:rgba(199,93,58,.07);border:1px solid rgba(199,93,58,.2);border-radius:11px;font-size:11.5px;color:#2B2620;line-height:1.5;}
        .fm-reward-info svg{color:#C75D3A;flex-shrink:0;margin-top:1px;}
        .fm-reward-field-name{font-weight:700;color:#C75D3A;}
        .fm-no-reward{font-size:11px;color:rgba(43,38,32,.4);padding:8px 0;}
        .fm-field-hint{font-size:10.5px;color:rgba(43,38,32,.45);padding:6px 0;}

        /* ── Mobile preview ── */
        .fm-phone{width:220px;border-radius:28px;background:#1A1A18;padding:10px;box-shadow:0 20px 60px rgba(43,38,32,.25);flex-shrink:0;}
        .fm-phone-top{display:flex;justify-content:center;padding-bottom:8px;}
        .fm-phone-notch{width:60px;height:6px;background:#2C2C2A;border-radius:3px;}
        .fm-phone-screen{background:#FFFFFF;border-radius:20px;overflow:hidden;min-height:380px;display:flex;flex-direction:column;}
        .fm-form-header{padding:20px 16px 16px;text-align:center;}
        .fm-form-logo{width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;margin:0 auto 8px;overflow:hidden;}
        .fm-form-biz{font-size:13px;font-weight:700;color:#F7F0E4;margin-bottom:2px;}
        .fm-form-sub{font-size:9px;color:rgba(247,240,228,.55);line-height:1.4;}
        .fm-form-fields{padding:12px 14px;display:flex;flex-direction:column;gap:8px;flex:1;}
        .fm-form-field{}
        .fm-form-label{font-size:9px;font-weight:600;color:rgba(43,38,32,.55);margin-bottom:3px;display:flex;align-items:center;gap:4px;}
        .fm-reward-dot{width:6px;height:6px;border-radius:50%;background:#C75D3A;flex-shrink:0;}
        .fm-form-input{font-size:10px;color:rgba(43,38,32,.3);background:#FBF6EE;border:1px solid rgba(43,38,32,.1);border-radius:6px;padding:6px 8px;}
        .fm-form-select{font-size:10px;color:rgba(43,38,32,.6);background:#FBF6EE;border:1px solid rgba(43,38,32,.1);border-radius:6px;padding:6px 8px;display:flex;align-items:center;justify-content:space-between;}
        .fm-form-more{font-size:9px;color:rgba(43,38,32,.35);text-align:center;padding:4px 0;}
        .fm-form-submit{margin:12px 14px;color:#fff;border:none;border-radius:9px;padding:10px;font-size:11px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;}
        .fm-reward-hint{font-size:8.5px;color:rgba(43,38,32,.4);text-align:center;padding:0 14px 12px;line-height:1.4;}
        .fm-phone-bottom{display:flex;justify-content:center;padding-top:8px;}
        .fm-phone-home{width:40px;height:5px;background:#2C2C2A;border-radius:3px;}

        /* ── Share ── */
        .fm-share-grid{display:grid;grid-template-columns:1.5fr 1fr;gap:14px;}
        .fm-link-row{display:flex;gap:8px;align-items:center;margin-bottom:12px;}
        .fm-link-box{flex:1;background:#FBF6EE;border:1px solid rgba(43,38,32,.1);border-radius:9px;padding:9px 12px;font-size:11.5px;color:rgba(43,38,32,.7);font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .fm-copy-btn{display:flex;align-items:center;gap:6px;background:#2B2620;color:#F7F0E4;border:none;border-radius:9px;padding:9px 14px;font-size:11.5px;font-weight:600;cursor:pointer;white-space:nowrap;transition:all .15s;}
        .fm-copy-btn--done{background:#5B8C5A;}
        .fm-link-hint{display:flex;align-items:flex-start;gap:7px;font-size:11px;color:rgba(43,38,32,.5);line-height:1.4;}
        .fm-link-hint svg{color:rgba(43,38,32,.4);flex-shrink:0;margin-top:1px;}
        .fm-qr-wrap{display:flex;flex-direction:column;align-items:center;gap:10px;}
        .fm-qr-box{background:#FBF6EE;border:1px solid rgba(43,38,32,.1);border-radius:12px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:6px;}
        .fm-qr-label{font-size:9px;color:rgba(43,38,32,.5);font-weight:600;}
        .fm-download-btn{display:flex;align-items:center;gap:6px;background:#FFFFFF;border:1.5px solid rgba(43,38,32,.15);border-radius:9px;padding:8px 16px;font-size:12px;font-weight:600;color:rgba(43,38,32,.7);cursor:pointer;transition:all .15s;}
        .fm-download-btn:hover{border-color:#C75D3A;color:#C75D3A;}

        @media(max-width:900px){
          .fm-main-grid{grid-template-columns:1fr;}
          .fm-phone{display:none;}
          .fm-share-grid{grid-template-columns:1fr;}
          .fm-brand-grid{grid-template-columns:auto 1fr;}
        }
        @media(max-width:768px){
          .fm-shell{padding:14px 16px;}
          .fm-card-selector{flex-wrap:wrap;}
          .fm-custom-row{flex-wrap:wrap;}
          .fm-custom-select{width:100%;}
          .fm-top-bar{flex-direction:column;align-items:flex-start;gap:10px;}
          .fm-save-btn{width:100%;}
        }
        @media(max-width:480px){
          .fm-brand-grid{grid-template-columns:1fr;}
          .fm-color-row{flex-wrap:wrap;}
        }
      `}</style>

      <div className="fm-shell">
        {/* Top bar */}
        <div className="fm-top-bar">
          <div>
            <div className="fm-top-title">Formulario de registro</div>
            <div className="fm-top-sub">Configurá los campos que ve el cliente al registrarse</div>
          </div>
          <button className="fm-save-btn" onClick={handleSave}>{saved ? '✓ Guardado' : 'Guardar cambios'}</button>
        </div>

        {/* Card selector */}
        {activeCards.length > 1 && (
          <>
            <div className="fm-lbl">Tarjeta</div>
            <div className="fm-card-selector">
              {activeCards.map((card: CardDesign) => (
                <button
                  key={card.id}
                  className={`fm-card-pill${selectedCardId === card.id ? ' fm-card-pill--on' : ''}`}
                  onClick={() => setSelectedCardId(card.id)}
                >
                  {TYPE_CARD_ICONS[card.type]} {card.name}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Branding */}
        <div className="fm-lbl">Identidad visual del formulario</div>
        {can('formBranding')
          ? <div className="fm-card">
              <div className="fm-card-title">Logo y color</div>
              <div className="fm-card-sub">Así va a verse la cabecera del formulario para tus clientes</div>
              <div className="fm-brand-grid">
                <div className="fm-brand-logo-wrap">
                  <div
                    className={`fm-brand-logo-zone${brandLogo ? ' fm-brand-logo-zone--filled' : ''}`}
                    onClick={() => logoRef.current?.click()}
                  >
                    {brandLogo
                      ? <img src={brandLogo} className="fm-brand-logo-img" alt="logo" />
                      : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(43,38,32,.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    }
                    <input ref={logoRef} type="file" accept="image/*" onChange={handleLogoFile} style={{ display: 'none' }} />
                  </div>
                  {brandLogo
                    ? <button className="fm-brand-logo-remove" onClick={() => setBrandLogo(null)}>Quitar</button>
                    : <span className="fm-brand-logo-hint">Subir logo</span>
                  }
                </div>
                <div className="fm-brand-fields">
                  <div>
                    <div className="fm-brand-field-label">Color principal</div>
                    <div className="fm-color-row">
                      {['#1B412F','#C75D3A','#185FA5','#533FB7','#2C2C2A','#854F0B'].map(col => (
                        <button key={col} className={`fm-color-swatch${brandColor === col ? ' fm-color-swatch--on' : ''}`}
                          style={{ background: col }} onClick={() => setBrandColor(col)} />
                      ))}
                      <label className="fm-custom-color-swatch" style={{ background: brandColor }}>
                        <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} className="fm-color-native" />
                      </label>
                      <input type="text" className="fm-hex-input" value={brandColor}
                        onChange={e => /^#[0-9A-Fa-f]{0,6}$/.test(e.target.value) && setBrandColor(e.target.value)}
                        placeholder="#1B412F" maxLength={7} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          : <div style={{ padding: '16px 20px', background: 'rgba(43,38,32,.04)', border: '1px solid rgba(43,38,32,.08)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#2B2620', marginBottom: 3 }}>Logo y color en el formulario</div>
                <div style={{ fontSize: 12, color: 'rgba(43,38,32,.5)' }}>Disponible desde el plan Growth</div>
              </div>
              <button style={{ background: '#C75D3A', color: '#fff', border: 'none', borderRadius: 9, padding: '8px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>Mejorar plan →</button>
            </div>
        }

        {/* Builder + Preview */}
        <div className="fm-lbl">Campos del formulario</div>
        <div className="fm-main-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Fixed */}
            <div className="fm-card">
              <div className="fm-card-title">Campos fijos</div>
              <div className="fm-card-sub">Siempre presentes, no se pueden quitar ni renombrar</div>
              <div className="fm-fixed-list">
                {FIXED_FIELDS.map((f: FormField) => (
                  <div key={f.id} className="fm-fixed-row">
                    <div className="fm-fixed-type">{TYPE_ICONS[f.type]}</div>
                    <span className="fm-fixed-name">{f.label}</span>
                    <span className="fm-fixed-badge">Fijo</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Optional — editable */}
            <div className="fm-card">
              <div className="fm-card-title">Campos opcionales</div>
              <div className="fm-card-sub">Arrastrá para reordenar · lápiz para renombrar · ojo para mostrar/ocultar · ★ para el campo de premio</div>
              <div className="fm-fields-list">
                {optional.map((f: FormField, i: number) => (
                  <OptionalFieldRow
                    key={f.id}
                    field={f}
                    onUpdate={updateLabel}
                    onToggle={toggleOptional}
                    onSetReward={setRewardSource}
                    onDragStart={() => handleDragStart(i)}
                    onDragEnter={() => handleDragEnter(i)}
                    onDragEnd={handleDragEnd}
                  />
                ))}
              </div>
              <div className="fm-field-hint">
                💡 Doble click o el lápiz para renombrar cualquier campo. Ej: "Preferencia principal" → "Corte de cabello favorito"
              </div>
            </div>

            {/* Custom */}
            <div className="fm-card">
              <div className="fm-card-title">Campos personalizados</div>
              <div className="fm-card-sub">{MAX_CUSTOM > 0 ? `Hasta ${MAX_CUSTOM} campos propios de tu negocio` : 'Función exclusiva de planes pagos'}</div>
              <CustomFieldBuilder fields={custom} onChange={setCustom} maxCustom={MAX_CUSTOM} businessId={businessId} cardId={selectedCardId} />
            </div>

            {/* Reward source */}
            <div className="fm-card">
              <div className="fm-card-title">Campo de premio activo</div>
              <div className="fm-card-sub">Esto es lo que el scanner le va a mostrar como premio a entregar</div>
              {rewardField
                ? <div className="fm-reward-info">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <div>
                      Al completar la tarjeta, el scanner verá la respuesta del cliente en <span className="fm-reward-field-name">"{rewardField.label}"</span> como el premio a entregar.
                    </div>
                  </div>
                : <div className="fm-no-reward">Ningún campo marcado con ★. Hacé ★ en el campo que querés usar como premio.</div>
              }
            </div>
          </div>

          {/* Mobile preview */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 4 }}>
            <MobilePreview
              fields={allFields}
              businessName={businessName}
              brandColor={brandColor}
              brandLogo={brandLogo}
            />
          </div>
        </div>

        {/* Share */}
        <div className="fm-lbl">Compartir</div>
        <ShareSection businessName={businessName} slug={businessSlug} />
      </div>
    </>
  )
}