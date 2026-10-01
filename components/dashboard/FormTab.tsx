'use client'
import React, { useState, useEffect, useMemo } from 'react'
import QRCode from 'qrcode'
import { apiGetFields, apiCreateField, apiUpdateField, apiDeleteField, apiReorderFields } from '@/lib/api'
import { usePlan } from '@/data/plans'

// Formulario de registro, por tarjeta. Nombre y email son fijos; el resto
// (preguntas del rubro, pregunta de premio y campos propios) se edita acá y
// se guarda todo junto con "Guardar cambios". El color y el logo del
// formulario son los de la tarjeta (se editan en Diseño).

type FieldType = 'text' | 'date' | 'select' | 'tel' | 'number'
interface EditField {
  key: string
  id?: string
  label: string
  type: FieldType
  options: string[]
  placeholder: string
  isActive: boolean
  isRequired: boolean
  isRewardSource: boolean
  isLocked: boolean
  isCustom: boolean
}
interface CardInfo {
  id: string; name: string; type: 'stamp' | 'points' | 'membership'; isActive: boolean
  color?: string; secondColor?: string; textColor?: string; logoUrl?: string | null
  rewardMode?: string | null; rewardField?: string | null
}

const TYPE_LABEL: Record<FieldType, string> = { text: 'Texto', number: 'Número', date: 'Fecha', select: 'Lista de opciones', tel: 'Teléfono' }
const TYPE_ICON: Record<FieldType, string> = { text: 'T', number: '#', date: '📅', select: '≡', tel: '📱' }
const CARD_ICON: Record<string, string> = { stamp: '☕', points: '🪙', membership: '🎫' }
const REWARD_QUESTION = '¿Qué premio querés cuando completes la tarjeta?'
let fieldKey = 0

function toEdit(f: any): EditField {
  return {
    key: `f${fieldKey++}`, id: f._id, label: f.label, type: (f.fieldType || 'text') as FieldType,
    options: f.options || [], placeholder: f.placeholder || '', isActive: f.isActive !== false,
    isRequired: !!f.isRequired, isRewardSource: !!f.isRewardSource, isLocked: !!f.isLocked, isCustom: !!f.isCustom,
  }
}
const comparable = (f: EditField) => JSON.stringify([f.id, f.label, f.type, f.options, f.placeholder, f.isActive, f.isRequired, f.isRewardSource])

function validate(fields: EditField[]): string | null {
  for (const f of fields) {
    const name = f.label.trim() || 'Un campo'
    if (!f.label.trim()) return 'Hay un campo sin nombre.'
    if (f.label.trim().length > 80) return `"${name}": el nombre puede tener hasta 80 caracteres.`
    if (f.type === 'select') {
      const opts = f.options.map(o => o.trim()).filter(Boolean)
      if (opts.length < 2) return `"${name}" necesita al menos 2 opciones.`
      if (new Set(opts.map(o => o.toLowerCase())).size !== opts.length) return `"${name}" tiene opciones repetidas.`
      if (opts.some(o => o.length > 40)) return `"${name}": cada opción puede tener hasta 40 caracteres.`
    }
  }
  return null
}

// ─── Opciones de una lista ────────────────────────────────────────────────────
function OptionsEditor({ options, onChange }: { options: string[]; onChange: (o: string[]) => void }) {
  const [draft, setDraft] = useState('')
  function add() {
    const v = draft.trim()
    if (!v || options.some(o => o.toLowerCase() === v.toLowerCase()) || options.length >= 10) return
    onChange([...options.filter(o => o.trim()), v]); setDraft('')
  }
  const real = options.filter(o => o.trim())
  return (
    <div className="fm-opts">
      {real.map(o => (
        <span key={o} className="fm-opt">
          {o}
          <button onClick={() => onChange(real.filter(x => x !== o))} aria-label={`Quitar ${o}`} title="Quitar opción">×</button>
        </span>
      ))}
      {real.length < 10 && (
        <input className="fm-opt-input" placeholder={real.length < 2 ? 'Escribí una opción y Enter' : '+ Opción'} value={draft} maxLength={40}
          onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }} onBlur={add} />
      )}
      {real.length < 2 && <span className="fm-opt-hint">Mínimo 2 opciones</span>}
    </div>
  )
}

// ─── Vista previa ─────────────────────────────────────────────────────────────
function Preview({ card, businessName, fields, askReward, whiteLabel }: { card?: CardInfo; businessName: string; fields: EditField[]; askReward: boolean; whiteLabel: boolean }) {
  const color = card?.color || '#1B412F'
  const second = card?.secondColor || color
  const shown = fields.filter(f => f.isActive && (!f.isRewardSource || askReward))
  return (
    <div className="fm-phone">
      <div className="fm-phone-screen">
        <div className="fm-pv-head" style={{ background: `linear-gradient(165deg, ${color}, ${second})`, color: card?.textColor || '#fff' }}>
          <div className="fm-pv-logo">{card?.logoUrl ? <img src={card.logoUrl} alt="" /> : businessName.charAt(0).toUpperCase()}</div>
          <div className="fm-pv-name">{businessName}</div>
          <div className="fm-pv-sub">Completá tus datos para obtener tu tarjeta</div>
          {card && <div className="fm-pv-badge">{card.name}</div>}
        </div>
        <div className="fm-pv-body">
          {[{ label: 'Nombre completo', ph: 'Tu nombre y apellido' }, { label: 'Email', ph: 'tu@email.com' }].map(f => (
            <div key={f.label} className="fm-pv-field"><div className="fm-pv-label">{f.label}</div><div className="fm-pv-input">{f.ph}</div></div>
          ))}
          {shown.map(f => (
            <div key={f.key} className="fm-pv-field">
              <div className="fm-pv-label">{f.label || 'Sin nombre'}{(f.isRequired || f.isRewardSource) && <span style={{ color }}> *</span>}</div>
              <div className="fm-pv-input">{f.type === 'select' ? <>Elegir…<span>▾</span></> : f.type === 'date' ? 'dd/mm/aaaa' : f.placeholder}</div>
            </div>
          ))}
          <div className="fm-pv-btn" style={{ background: color }}>Obtener mi tarjeta →</div>
          <div className="fm-pv-legal">Al registrarte aceptás que {businessName} use tus datos para tu tarjeta. <u>Privacidad</u></div>
          {!whiteLabel && <div className="fm-pv-legal" style={{ opacity: .6 }}>Powered by Stampa</div>}
        </div>
      </div>
    </div>
  )
}

// ─── Compartir: link corto, QR y cartel ───────────────────────────────────────
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}
function download(url: string, name: string) {
  const a = document.createElement('a'); a.href = url; a.download = name
  document.body.appendChild(a); a.click(); a.remove()
}

function Share({ businessName, slug, card, whiteLabel }: { businessName: string; slug?: string; card?: CardInfo; whiteLabel: boolean }) {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const link = slug ? `${origin}/r/${slug}` : ''
  const shortLink = link.replace(/^https?:\/\//, '')
  const [qr, setQr] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [making, setMaking] = useState(false)

  useEffect(() => {
    if (!link) return
    QRCode.toDataURL(link, { width: 480, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#2B2620', light: '#FFFFFF' } }).then(setQr).catch(() => setQr(''))
  }, [link])

  async function copy() {
    try { await navigator.clipboard.writeText(link) } catch { /* sin permiso: igual queda seleccionable */ }
    setCopied(true); setTimeout(() => setCopied(false), 2200)
  }

  // Cartel A5 (1240×1748 px) listo para imprimir.
  async function poster() {
    if (!link) return
    setMaking(true)
    try {
      const W = 1240, H = 1748
      const c = document.createElement('canvas'); c.width = W; c.height = H
      const g = c.getContext('2d')!
      const color = card?.color || '#1B412F', second = card?.secondColor || color, text = card?.textColor || '#FFFFFF'
      g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, W, H)
      const grad = g.createLinearGradient(0, 0, W, 620); grad.addColorStop(0, color); grad.addColorStop(1, second)
      g.fillStyle = grad; g.fillRect(0, 0, W, 620)
      // logo o inicial
      const logo = card?.logoUrl ? await loadImage(card.logoUrl) : null
      g.fillStyle = 'rgba(255,255,255,.18)'
      g.beginPath(); (g as any).roundRect ? (g as any).roundRect(W / 2 - 90, 90, 180, 180, 40) : g.rect(W / 2 - 90, 90, 180, 180); g.fill()
      if (logo) {
        const s = Math.min(160 / logo.width, 160 / logo.height)
        g.drawImage(logo, W / 2 - (logo.width * s) / 2, 180 - (logo.height * s) / 2, logo.width * s, logo.height * s)
      } else {
        g.fillStyle = text; g.font = '800 96px "Plus Jakarta Sans", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'
        g.fillText(businessName.charAt(0).toUpperCase(), W / 2, 184)
      }
      g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = text
      g.font = '800 76px "Plus Jakarta Sans", sans-serif'; g.fillText(businessName.slice(0, 26), W / 2, 400)
      g.font = '600 44px Inter, sans-serif'; g.globalAlpha = .85
      g.fillText(card?.type === 'points' ? 'Sumá puntos y canjealos por premios' : card?.type === 'membership' ? 'Sumate y subí de nivel con cada visita' : 'Juntá sellos y ganá tu premio', W / 2, 480)
      g.globalAlpha = 1
      g.fillStyle = '#2B2620'; g.font = '800 88px "Plus Jakarta Sans", sans-serif'
      g.fillText('¡Sumate a nuestra tarjeta!', W / 2, 760)
      const qrImg = await loadImage(await QRCode.toDataURL(link, { width: 720, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#2B2620', light: '#FFFFFF' } }))
      if (qrImg) g.drawImage(qrImg, W / 2 - 330, 830, 660, 660)
      g.fillStyle = 'rgba(43,38,32,.75)'; g.font = '500 42px Inter, sans-serif'
      g.fillText('Escaneá con la cámara de tu celular', W / 2, 1570)
      g.fillStyle = color; g.font = '700 40px Inter, sans-serif'; g.fillText(shortLink, W / 2, 1635)
      if (!whiteLabel) { g.fillStyle = 'rgba(43,38,32,.35)'; g.font = '600 28px Inter, sans-serif'; g.fillText('Powered by Stampa', W / 2, 1712) }
      download(c.toDataURL('image/png'), `cartel-${slug}.png`)
    } finally {
      setMaking(false)
    }
  }

  return (
    <div className="fm-share">
      <div className="fm-card">
        <div className="fm-card-title">Link del formulario</div>
        <div className="fm-card-sub">Compartilo por WhatsApp, en la bio de Instagram o donde quieras</div>
        <div className="fm-link-row">
          <div className="fm-link-box" title={link}>{shortLink || '—'}</div>
          <button className={`fm-copy${copied ? ' fm-copy--done' : ''}`} onClick={copy} disabled={!link}>{copied ? '✓ Copiado' : 'Copiar'}</button>
        </div>
        {link && <a className="fm-open" href={link} target="_blank" rel="noreferrer">Abrir el formulario ↗</a>}
      </div>
      <div className="fm-card fm-qr-card">
        <div className="fm-qr">{qr ? <img src={qr} alt="QR del formulario" /> : <div className="fm-skel" style={{ width: 132, height: 132 }} />}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="fm-card-title">QR y cartel</div>
          <div className="fm-card-sub">Para el mostrador, la vidriera o las mesas</div>
          <div className="fm-share-btns">
            <button className="fm-primary" onClick={poster} disabled={!link || making}>{making ? 'Armando…' : 'Descargar cartel (A5)'}</button>
            <button className="fm-secondary" onClick={() => qr && download(qr, `qr-${slug}.png`)} disabled={!qr}>Solo el QR</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function FormTab({ businessName, businessSlug, cards, businessId, onGoToDesign, onChoosePlan, isManager = false }: {
  businessName: string
  businessSlug?: string
  cards: CardInfo[]
  businessId?: string | null
  onGoToDesign: () => void
  onChoosePlan: () => void
  isManager?: boolean
}) {
  const { limit, can } = usePlan()
  const maxCustom = limit('maxCustomFields')
  const whiteLabel = can('whiteLabel')
  const activeCards = cards.filter(c => c.isActive)
  const [selectedId, setSelectedId] = useState<string>(activeCards[0]?.id || '')
  const card = activeCards.find(c => c.id === selectedId) || activeCards[0]
  const isStamp = card?.type === 'stamp'
  const askReward = isStamp && card?.rewardMode === 'dynamic'

  const [saved, setSaved] = useState<EditField[] | null>(null)
  const [draft, setDraft] = useState<EditField[] | null>(null)
  const [removed, setRemoved] = useState<EditField[]>([])
  const [loadError, setLoadError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState<string | null>(null)

  async function load() {
    if (!businessId || !card) return
    setSaved(null); setDraft(null); setRemoved([]); setLoadError(false); setError(null)
    try {
      const list = await apiGetFields(businessId, card.id)
      // Nombre y email (bloqueados y no-premio) se muestran aparte.
      const editable = list.filter((f: any) => !(f.isLocked && !f.isRewardSource)).sort((a: any, b: any) => a.order - b.order).map(toEdit)
      setSaved(editable); setDraft(editable)
    } catch {
      setLoadError(true); setSaved([]); setDraft([])
    }
  }
  useEffect(() => { load(); setNotice(null) }, [businessId, card?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Hay cambios si cambió algo de algún campo, el orden, o se agregó/borró uno.
  const dirty = useMemo(() => !!saved && !!draft && JSON.stringify(draft.map(comparable)) !== JSON.stringify(saved.map(comparable)), [saved, draft])

  const customCount = (draft || []).filter(f => f.isCustom || !f.id).filter(f => !f.isRewardSource).length
  const rewardField = (draft || []).find(f => f.isRewardSource)

  function patch(key: string, p: Partial<EditField>) { setDraft(d => (d || []).map(f => f.key === key ? { ...f, ...p } : f)); setNotice(null); setError(null) }
  function move(key: string, dir: -1 | 1) {
    setDraft(d => {
      const list = [...(d || [])]; const i = list.findIndex(f => f.key === key); const j = i + dir
      if (i < 0 || j < 0 || j >= list.length) return list
      ;[list[i], list[j]] = [list[j], list[i]]; return list
    }); setNotice(null)
  }
  function remove(f: EditField) {
    setDraft(d => (d || []).filter(x => x.key !== f.key))
    if (f.id) setRemoved(r => [...r, f])
    setConfirmDel(null); setNotice(null)
  }
  function addField(reward = false) {
    setDraft(d => [...(d || []), {
      key: `f${fieldKey++}`, label: reward ? REWARD_QUESTION : '', type: reward ? 'select' : 'text', options: [], placeholder: '',
      isActive: true, isRequired: reward, isRewardSource: reward, isLocked: false, isCustom: !reward,
    }])
    setNotice(null)
  }
  function discard() { setDraft(saved); setRemoved([]); setError(null) }

  async function save() {
    if (!businessId || !card || !draft || !saved) return
    const v = validate(draft)
    if (v) { setError(v); return }
    setSaving(true); setError(null); setNotice(null)
    try {
      for (const f of removed) await apiDeleteField(businessId, card.id, f.id!)
      const ids: string[] = []
      for (const f of draft) {
        const options = f.type === 'select' ? f.options.map(o => o.trim()).filter(Boolean) : undefined
        if (!f.id) {
          const created: any = await apiCreateField(businessId, card.id, { label: f.label.trim(), fieldType: f.type, options, placeholder: f.placeholder, isRewardSource: f.isRewardSource, isRequired: f.isRequired } as any)
          ids.push(created._id)
        } else {
          const before = saved.find(s => s.id === f.id)
          if (before && comparable(before) !== comparable(f)) {
            const body: any = {}
            if (before.label !== f.label) body.label = f.label.trim()
            if (!f.isLocked && before.type !== f.type) body.fieldType = f.type
            if (JSON.stringify(before.options) !== JSON.stringify(f.options) || (before.type !== f.type && f.type === 'select')) body.options = options
            if (before.placeholder !== f.placeholder) body.placeholder = f.placeholder
            if (before.isActive !== f.isActive) body.isActive = f.isActive
            if (before.isRequired !== f.isRequired) body.isRequired = f.isRequired
            if (before.isRewardSource !== f.isRewardSource) body.isRewardSource = f.isRewardSource
            await apiUpdateField(businessId, card.id, f.id, body)
          }
          ids.push(f.id)
        }
      }
      // Orden: nombre y email son 1 y 2; el resto a continuación.
      await apiReorderFields(businessId, card.id, ids.map((id, i) => ({ id, order: i + 3 })))
      await load()
      setNotice('Guardado. El formulario ya muestra los cambios.')
    } catch (err: any) {
      setError(err?.error || err?.message || 'No se pudo guardar. Probá de nuevo.')
      await load().catch(() => {})
    } finally {
      setSaving(false)
    }
  }

  if (!card) {
    return (
      <div className="fm-shell">
        <style>{CSS}</style>
        <div className="fm-card"><div className="fm-card-title">Todavía no tenés una tarjeta activa</div><div className="fm-card-sub">Activá una tarjeta en Diseño para armar su formulario.</div><button className="fm-secondary" onClick={onGoToDesign}>Ir a Diseño</button></div>
      </div>
    )
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="fm-shell">
        <div className="fm-top">
          <div>
            <div className="fm-title">Formulario de registro</div>
            <div className="fm-sub">Lo que completa tu cliente para obtener la tarjeta</div>
          </div>
          <div className="fm-top-actions">
            {dirty && <button className="fm-secondary" onClick={discard} disabled={saving}>Descartar</button>}
            <button className="fm-primary" onClick={save} disabled={!dirty || saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</button>
          </div>
        </div>
        {error && <div className="fm-error">{error}</div>}
        {notice && <div className="fm-notice">{notice}</div>}
        {loadError && <div className="fm-error">No pudimos cargar el formulario. <button className="fm-link-btn" onClick={load}>Reintentar</button></div>}

        {activeCards.length > 1 && (
          <div className="fm-pills">
            {activeCards.map(c => (
              <button key={c.id} className={`fm-pill${card.id === c.id ? ' fm-pill--on' : ''}`} onClick={() => { if (dirty && !confirm('Tenés cambios sin guardar en este formulario. ¿Descartarlos?')) return; setSelectedId(c.id) }}>
                {CARD_ICON[c.type]} {c.name}
              </button>
            ))}
          </div>
        )}

        <div className="fm-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
            <div className="fm-card fm-design-note">
              <span className="fm-swatch" style={{ background: `linear-gradient(135deg, ${card.color || '#1B412F'}, ${card.secondColor || card.color || '#1B412F'})` }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="fm-card-title">Usa el diseño de tu tarjeta</div>
                <div className="fm-card-sub" style={{ margin: 0 }}>El color y el logo del formulario son los de "{card.name}".</div>
              </div>
              <button className="fm-secondary" onClick={onGoToDesign}>Editar en Diseño</button>
            </div>

            {isStamp && (
              <div className={`fm-card fm-reward${askReward && !rewardField ? ' fm-reward--warn' : ''}`}>
                <div className="fm-card-title">★ Premio</div>
                {!askReward ? (
                  <div className="fm-card-sub" style={{ margin: 0 }}>
                    Tu premio es fijo{card.rewardField ? <>: <strong>{card.rewardField}</strong></> : ''}. Al cliente no se le pregunta nada.{' '}
                    <button className="fm-link-btn" onClick={onGoToDesign}>Cambiar en Diseño</button>
                  </div>
                ) : rewardField ? (
                  <div className="fm-card-sub" style={{ margin: 0 }}>El cliente elige su premio al registrarse en <strong>"{rewardField.label}"</strong>. Las opciones se editan en <button className="fm-link-btn" onClick={onGoToDesign}>Diseño</button>.</div>
                ) : (
                  <>
                    <div className="fm-card-sub">El cliente elige el premio, pero todavía no cargaste las opciones.</div>
                    <button className="fm-primary" onClick={onGoToDesign}>Cargar opciones en Diseño</button>
                  </>
                )}
              </div>
            )}

            <div className="fm-card">
              <div className="fm-card-title">Campos</div>
              <div className="fm-card-sub">Usá las flechas para ordenar. Los cambios se aplican al tocar "Guardar cambios".</div>
              <div className="fm-list">
                {['Nombre completo', 'Email'].map(l => (
                  <div key={l} className="fm-row fm-row--fixed">
                    <div className="fm-row-main"><span className="fm-type">{l === 'Email' ? '@' : 'T'}</span><span className="fm-fixed-label">{l}</span><span className="fm-badge">Fijo · obligatorio</span></div>
                  </div>
                ))}
                {draft === null ? [0, 1].map(i => <div key={i} className="fm-skel" style={{ height: 56 }} />) : draft.map((f, i) => {
                  const hiddenReward = f.isRewardSource && !askReward
                  return (
                    <div key={f.key} className={`fm-row${!f.isActive || hiddenReward ? ' fm-row--off' : ''}${f.isRewardSource && askReward ? ' fm-row--reward' : ''}`}>
                      <div className="fm-row-main">
                        <div className="fm-move">
                          <button onClick={() => move(f.key, -1)} disabled={i === 0} aria-label="Subir">▲</button>
                          <button onClick={() => move(f.key, 1)} disabled={i === draft.length - 1} aria-label="Bajar">▼</button>
                        </div>
                        <span className="fm-type" title={TYPE_LABEL[f.type]}>{TYPE_ICON[f.type]}</span>
                        <input className="fm-label-input" value={f.label} placeholder="Nombre del campo (ej: Fecha de cumpleaños)" maxLength={80} onChange={e => patch(f.key, { label: e.target.value })} />
                        {!f.id && !f.isLocked && !f.isRewardSource ? (
                          <select className="fm-type-select" value={f.type} onChange={e => patch(f.key, { type: e.target.value as FieldType })}>
                            {(Object.keys(TYPE_LABEL) as FieldType[]).map(t => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
                          </select>
                        ) : null}
                      </div>
                      {f.isRewardSource
                        ? <div className="fm-hint" style={{ margin: '6px 0 0' }}>Opciones: {f.options.filter(Boolean).join(' · ') || '—'}. Se editan en <button className="fm-link-btn" onClick={onGoToDesign}>Diseño</button>.</div>
                        : f.type === 'select' && <OptionsEditor options={f.options} onChange={o => patch(f.key, { options: o })} />}
                      {['text', 'tel', 'number'].includes(f.type) && (
                        <input className="fm-ph-input" value={f.placeholder} maxLength={80} placeholder="Texto de ayuda dentro del campo (opcional)" onChange={e => patch(f.key, { placeholder: e.target.value })} />
                      )}
                      <div className="fm-row-foot">
                        {f.isRewardSource ? (
                          <span className="fm-badge fm-badge--reward">{askReward ? '★ Pregunta de premio · obligatoria' : 'No se muestra: premio fijo'}</span>
                        ) : (
                          <>
                            <label className="fm-switch"><input type="checkbox" checked={f.isActive} onChange={e => patch(f.key, { isActive: e.target.checked })} /><span />Visible</label>
                            <label className="fm-switch"><input type="checkbox" checked={f.isRequired} disabled={!f.isActive} onChange={e => patch(f.key, { isRequired: e.target.checked })} /><span />Obligatorio</label>
                          </>
                        )}
                        <div style={{ flex: 1 }} />
                        {(f.isCustom || !f.id) && !f.isLocked && (
                          confirmDel === f.key
                            ? <span className="fm-confirm">¿Borrar? Las respuestas que ya dieron tus clientes se dejan de mostrar. <button className="fm-link-btn" onClick={() => setConfirmDel(null)}>No</button> <button className="fm-link-btn fm-danger" onClick={() => remove(f)}>Sí, borrar</button></span>
                            : <button className="fm-link-btn fm-danger" onClick={() => f.id ? setConfirmDel(f.key) : remove(f)}>Borrar</button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              {draft !== null && (maxCustom > 0 ? (
                customCount < maxCustom
                  ? <button className="fm-add" onClick={() => addField(false)}>+ Agregar campo propio ({customCount}/{maxCustom})</button>
                  : <div className="fm-hint">Llegaste al máximo de {maxCustom} campos propios de tu plan.</div>
              ) : (
                <div className="fm-locked">
                  <span>🔒 Campos propios (ej: cumpleaños, teléfono) desde el plan Growth.</span>
                  {!isManager && <button className="fm-link-btn" onClick={onChoosePlan}>Ver planes</button>}
                </div>
              ))}
            </div>
          </div>

          <div className="fm-preview-col">
            <div className="fm-preview-title">Así lo ve tu cliente</div>
            <Preview card={card} businessName={businessName} fields={draft || []} askReward={askReward} whiteLabel={whiteLabel} />
          </div>
        </div>

        <div className="fm-lbl">Compartir</div>
        <Share businessName={businessName} slug={businessSlug} card={card} whiteLabel={whiteLabel} />
      </div>
    </>
  )
}

const CSS = `
  .fm-shell{flex:1;overflow-y:auto;padding:20px 24px;display:flex;flex-direction:column;gap:14px;}
  .fm-top{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
  .fm-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:17px;color:#2B2620;}
  .fm-sub{font-size:12px;color:rgba(43,38,32,.5);margin-top:2px;}
  .fm-top-actions{display:flex;gap:8px;}
  .fm-primary{background:#C75D3A;color:#fff;border:none;border-radius:10px;padding:10px 18px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;white-space:nowrap;}
  .fm-primary:disabled{opacity:.45;cursor:not-allowed;}
  .fm-secondary{background:#fff;color:#2B2620;border:1px solid rgba(43,38,32,.18);border-radius:10px;padding:9px 14px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;}
  .fm-secondary:disabled{opacity:.45;cursor:not-allowed;}
  .fm-link-btn{background:none;border:none;padding:0;color:#C75D3A;font-weight:600;font-size:12px;cursor:pointer;font-family:inherit;}
  .fm-danger{color:#B23B3B;}
  .fm-error{font-size:12.5px;color:#8E2F2F;background:rgba(178,59,59,.07);border:1px solid rgba(178,59,59,.2);border-radius:10px;padding:9px 12px;}
  .fm-notice{font-size:12.5px;color:#3F6E3E;background:rgba(91,140,90,.1);border:1px solid rgba(91,140,90,.25);border-radius:10px;padding:9px 12px;}
  .fm-pills{display:flex;gap:6px;flex-wrap:wrap;}
  .fm-pill{font-size:12px;padding:7px 14px;border-radius:20px;border:1.5px solid rgba(43,38,32,.12);background:#fff;color:rgba(43,38,32,.6);cursor:pointer;font-family:'Inter',sans-serif;}
  .fm-pill--on{background:#1B412F;border-color:#1B412F;color:#F7F0E4;font-weight:600;}
  .fm-grid{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:16px;align-items:start;}
  .fm-card{background:#fff;border:1px solid rgba(43,38,32,.07);border-radius:14px;padding:16px 18px;box-shadow:0 1px 8px rgba(43,38,32,.04);min-width:0;}
  .fm-card-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:13px;color:#2B2620;margin-bottom:2px;}
  .fm-card-sub{font-size:11.5px;color:rgba(43,38,32,.5);margin-bottom:12px;line-height:1.5;}
  .fm-design-note{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
  .fm-swatch{width:34px;height:34px;border-radius:10px;flex-shrink:0;}
  .fm-reward{border-color:rgba(212,162,76,.35);background:rgba(212,162,76,.05);}
  .fm-reward--warn{border-color:rgba(178,59,59,.3);background:rgba(178,59,59,.04);}
  .fm-list{display:flex;flex-direction:column;gap:8px;}
  .fm-row{border:1px solid rgba(43,38,32,.1);border-radius:11px;padding:10px 12px;display:flex;flex-direction:column;gap:8px;background:#fff;}
  .fm-row--fixed{background:rgba(43,38,32,.025);}
  .fm-row--off{opacity:.6;}
  .fm-row--reward{border-color:rgba(212,162,76,.5);background:rgba(212,162,76,.05);}
  .fm-row-main{display:flex;align-items:center;gap:8px;min-width:0;}
  .fm-move{display:flex;flex-direction:column;gap:1px;}
  .fm-move button{background:none;border:none;color:rgba(43,38,32,.4);font-size:9px;line-height:1;padding:2px 4px;cursor:pointer;border-radius:4px;}
  .fm-move button:hover:not(:disabled){color:#2B2620;background:rgba(43,38,32,.06);}
  .fm-move button:disabled{opacity:.25;cursor:default;}
  .fm-type{width:26px;height:26px;border-radius:7px;background:rgba(43,38,32,.06);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:rgba(43,38,32,.55);flex-shrink:0;}
  .fm-fixed-label{flex:1;font-size:12.5px;font-weight:600;color:#2B2620;}
  .fm-label-input{flex:1;min-width:0;border:1px solid transparent;border-radius:7px;padding:6px 8px;font-size:12.5px;font-weight:600;color:#2B2620;font-family:'Inter',sans-serif;background:transparent;outline:none;}
  .fm-label-input:hover{border-color:rgba(43,38,32,.12);}
  .fm-label-input:focus{border-color:#C75D3A;background:#fff;}
  .fm-type-select{border:1px solid rgba(43,38,32,.15);border-radius:7px;padding:6px 8px;font-size:12px;background:#fff;color:#2B2620;font-family:inherit;}
  .fm-ph-input{border:1px dashed rgba(43,38,32,.15);border-radius:7px;padding:6px 9px;font-size:11.5px;color:rgba(43,38,32,.7);font-family:'Inter',sans-serif;outline:none;margin-left:34px;}
  .fm-ph-input:focus{border-color:#C75D3A;border-style:solid;}
  .fm-opts{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-left:34px;}
  .fm-opt{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:600;background:rgba(199,93,58,.08);color:#9E4529;border-radius:20px;padding:3px 5px 3px 10px;}
  .fm-opt button{border:none;background:rgba(199,93,58,.15);color:#9E4529;width:16px;height:16px;border-radius:50%;font-size:11px;line-height:14px;cursor:pointer;padding:0;}
  .fm-opt-input{border:1px dashed rgba(43,38,32,.2);border-radius:20px;padding:4px 10px;font-size:11.5px;font-family:inherit;outline:none;min-width:150px;}
  .fm-opt-input:focus{border-color:#C75D3A;border-style:solid;}
  .fm-opt-hint{font-size:10.5px;color:#B23B3B;}
  .fm-row-foot{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-left:34px;}
  .fm-switch{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;color:rgba(43,38,32,.7);cursor:pointer;user-select:none;}
  .fm-switch input{display:none;}
  .fm-switch span{width:28px;height:16px;border-radius:10px;background:rgba(43,38,32,.18);position:relative;transition:background .15s;}
  .fm-switch span::after{content:'';position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:#fff;transition:left .15s;}
  .fm-switch input:checked + span{background:#5B8C5A;}
  .fm-switch input:checked + span::after{left:14px;}
  .fm-switch input:disabled + span{opacity:.4;}
  .fm-badge{font-size:10px;font-weight:700;padding:2px 9px;border-radius:20px;background:rgba(43,38,32,.07);color:rgba(43,38,32,.55);white-space:nowrap;}
  .fm-badge--reward{background:rgba(212,162,76,.18);color:#7A5A12;}
  .fm-confirm{font-size:11.5px;color:#8E2F2F;}
  .fm-add{margin-top:10px;width:100%;border:1.5px dashed rgba(43,38,32,.2);background:none;border-radius:10px;padding:10px;font-size:12.5px;font-weight:600;color:rgba(43,38,32,.65);cursor:pointer;font-family:inherit;}
  .fm-add:hover{border-color:#C75D3A;color:#C75D3A;}
  .fm-locked{margin-top:10px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;font-size:12px;color:rgba(43,38,32,.6);background:rgba(43,38,32,.03);border-radius:10px;padding:10px 12px;}
  .fm-hint{font-size:11.5px;color:rgba(43,38,32,.5);margin-top:10px;}
  .fm-preview-col{position:sticky;top:0;display:flex;flex-direction:column;align-items:center;gap:8px;}
  .fm-preview-title{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:rgba(43,38,32,.4);font-weight:700;}
  .fm-phone{width:280px;border-radius:34px;background:#1a1a18;padding:10px;box-shadow:0 12px 40px rgba(43,38,32,.2);}
  .fm-phone-screen{border-radius:26px;overflow:hidden;background:#FBF6EE;max-height:560px;overflow-y:auto;}
  .fm-pv-head{padding:24px 18px 18px;text-align:center;}
  .fm-pv-logo{width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,.2);margin:0 auto 10px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:18px;overflow:hidden;}
  .fm-pv-logo img{width:100%;height:100%;object-fit:contain;}
  .fm-pv-name{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:15px;}
  .fm-pv-sub{font-size:10.5px;opacity:.8;margin-top:2px;}
  .fm-pv-badge{display:inline-block;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;background:rgba(255,255,255,.18);padding:3px 8px;border-radius:20px;margin-top:8px;}
  .fm-pv-body{background:#fff;padding:16px 16px 14px;}
  .fm-pv-field{margin-bottom:10px;}
  .fm-pv-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:rgba(43,38,32,.5);margin-bottom:4px;}
  .fm-pv-input{border:1px solid rgba(43,38,32,.12);border-radius:9px;background:#FBF6EE;padding:8px 10px;font-size:11px;color:rgba(43,38,32,.4);min-height:30px;display:flex;justify-content:space-between;}
  .fm-pv-btn{border-radius:10px;color:#fff;text-align:center;font-size:12px;font-weight:700;padding:10px;margin-top:4px;}
  .fm-pv-legal{font-size:9px;color:rgba(43,38,32,.45);text-align:center;margin-top:8px;line-height:1.4;}
  .fm-lbl{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:rgba(43,38,32,.38);font-weight:600;display:flex;align-items:center;gap:10px;margin-top:4px;}
  .fm-lbl::after{content:'';flex:1;height:1px;background:rgba(43,38,32,.1);}
  .fm-share{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
  .fm-link-row{display:flex;gap:8px;}
  .fm-link-box{flex:1;min-width:0;font-size:13px;font-weight:600;color:#2B2620;background:#FBF6EE;border:1px solid rgba(43,38,32,.1);border-radius:9px;padding:9px 12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .fm-copy{background:#1B412F;color:#F7F0E4;border:none;border-radius:9px;padding:0 16px;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit;}
  .fm-copy--done{background:#5B8C5A;}
  .fm-open{display:inline-block;margin-top:10px;font-size:12px;font-weight:600;color:#C75D3A;text-decoration:none;}
  .fm-qr-card{display:flex;gap:16px;align-items:center;flex-wrap:wrap;}
  .fm-qr img{width:132px;height:132px;border-radius:10px;border:1px solid rgba(43,38,32,.08);display:block;}
  .fm-share-btns{display:flex;gap:8px;flex-wrap:wrap;}
  .fm-skel{background:rgba(43,38,32,.07);border-radius:10px;animation:fmPulse 1.2s ease-in-out infinite;}
  @keyframes fmPulse{0%,100%{opacity:.45}50%{opacity:1}}
  @media(max-width:1000px){.fm-grid{grid-template-columns:1fr;}.fm-preview-col{position:static;}}
  @media(max-width:768px){
    .fm-shell{padding:14px 16px;}
    .fm-share{grid-template-columns:1fr;}
    .fm-ph-input,.fm-opts,.fm-row-foot{margin-left:0;}
    .fm-row-main{flex-wrap:wrap;}
    .fm-label-input{flex-basis:calc(100% - 70px);}
    .fm-top-actions{width:100%;}
    .fm-top-actions .fm-primary{flex:1;}
  }
`
