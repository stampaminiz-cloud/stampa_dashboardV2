'use client'
import React, { useState, useEffect } from 'react'
import { apiUpdateBusiness, apiChangePassword } from '@/lib/api'
import { useLang } from '@/data/i18n'

interface BusinessAlerts { newCustomer: boolean; nearPrize: boolean; weeklyDigest: boolean }
interface BusinessSettings {
  name: string; sector: string; timezone: string; inactiveDays: number
  plan: string; planActiveCards: number; planMaxCards: number; alerts: BusinessAlerts
}

// Mismo listado de rubros que el onboarding — mantiene consistencia y evita
// que el campo termine con un valor arbitrario que las rutas del backend
// (SECTOR_FIELDS en businesses.js) no reconozcan.
const SECTOR_LABELS: Record<string, string> = {
  cafe: 'Cafetería / Bar',
  restaurant: 'Restaurante',
  hair: 'Peluquería / Barbería',
  gym: 'Gym / Fitness',
  bakery: 'Panadería / Pastelería',
  spa: 'Spa / Belleza',
  clothing: 'Ropa / Indumentaria',
  bookstore: 'Librería',
  other: 'Otro rubro',
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="st-card">
      <div className="st-card-head">{icon}<span className="st-card-title">{title}</span></div>
      {children}
    </div>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="st-field-row">
      <span className="st-field-label">{label}</span>
      <div className="st-field-value">{children}</div>
    </div>
  )
}

function EditableText({ value, saveLabel, onSave }: { value: string; saveLabel: string; onSave?: (v: string) => void }) {
  const [val, setVal] = useState(value)
  const [editing, setEditing] = useState(false)
  if (editing) return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input className="st-inline-input" value={val} onChange={e => setVal(e.target.value)} autoFocus />
      <button className="st-btn-sm" onClick={() => { setEditing(false); onSave?.(val) }}>{saveLabel}</button>
    </div>
  )
  const t = useLang()
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <span className="st-field-val">{val}</span>
      <button className="st-edit-link" onClick={() => setEditing(true)}>{t('edit')}</button>
    </div>
  )
}

function SectorField({ value, saving, saved, t, onSave }: { value: string; saving: boolean; saved: boolean; t: (k: any) => string; onSave: (v: string) => void }) {
  const [editing, setEditing]   = useState(false)
  const [draft, setDraft]       = useState(value)
  const [confirming, setConfirming] = useState(false)

  function startEdit() { setDraft(value); setEditing(true); setConfirming(false) }
  function requestSave() {
    if (draft === value) { setEditing(false); return }
    setConfirming(true)
  }
  function confirmSave() {
    onSave(draft)
    setConfirming(false)
    setEditing(false)
  }
  function cancel() { setConfirming(false); setEditing(false); setDraft(value) }

  if (!editing) {
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span className="st-field-val">{SECTOR_LABELS[value] || value}</span>
        <button className="st-edit-link" onClick={startEdit}>{t('edit')}</button>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <select className="st-inline-input" value={draft} onChange={e => setDraft(e.target.value)} autoFocus>
          {Object.entries(SECTOR_LABELS).map(([id, label]) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>
        <button className="st-btn-sm" onClick={requestSave}>{saving ? '...' : saved ? '✓' : t('save')}</button>
        <button className="st-edit-link" onClick={cancel}>{t('cancel')}</button>
      </div>
      {confirming && (
        <div className="st-sector-confirm">
          <p>Cambiar el rubro no modifica tu tarjeta ni los campos del formulario que ya tenés configurados — solo actualiza las recomendaciones de aquí en más. Podés ajustar la tarjeta y el formulario manualmente cuando quieras desde Diseño y Formulario.</p>
          <div className="st-delete-actions">
            <button className="st-delete-btn-cancel" onClick={cancel}>{t('cancel')}</button>
            <button className="st-sector-confirm-btn" onClick={confirmSave}>Sí, cambiar rubro</button>
          </div>
        </div>
      )}
    </div>
  )
}

function PasswordSection() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!current || !next || !confirm) { setError('Completá los tres campos.'); return }
    if (next.length < 8) { setError('La nueva contraseña debe tener al menos 8 caracteres.'); return }
    if (next !== confirm) { setError('La confirmación no coincide con la nueva contraseña.'); return }
    if (next === current) { setError('La nueva contraseña tiene que ser distinta a la actual.'); return }

    setSaving(true)
    try {
      await apiChangePassword(current, next)
      setSuccess(true)
      setCurrent(''); setNext(''); setConfirm('')
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.error || 'No se pudo cambiar la contraseña.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldRow label="Contraseña actual">
        <input type="password" className="st-pw-input" value={current} onChange={e => setCurrent(e.target.value)} autoComplete="current-password" />
      </FieldRow>
      <FieldRow label="Nueva contraseña">
        <input type="password" className="st-pw-input" value={next} onChange={e => setNext(e.target.value)} autoComplete="new-password" placeholder="Mínimo 8 caracteres" />
      </FieldRow>
      <FieldRow label="Confirmar nueva contraseña">
        <input type="password" className="st-pw-input" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" />
      </FieldRow>
      {error && <div className="st-pw-error">{error}</div>}
      {success && <div className="st-pw-success">Contraseña actualizada correctamente.</div>}
      <button type="submit" className="st-btn-sm" style={{ marginTop: 10 }} disabled={saving}>
        {saving ? 'Guardando...' : 'Cambiar contraseña'}
      </button>
    </form>
  )
}

function CheckboxRow({ label, checked: init, description, onToggle }: { label: string; checked: boolean; description?: string; onToggle?: (v: boolean) => void }) {
  const [checked, setChecked] = useState(init)
  return (
    <div className="st-check-row" onClick={() => { const v = !checked; setChecked(v); onToggle?.(v) }}>
      <div className={`st-checkbox${checked ? ' st-checkbox--on' : ''}`}>
        {checked && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
      </div>
      <div>
        <div className="st-check-label">{label}</div>
        {description && <div className="st-check-desc">{description}</div>}
      </div>
    </div>
  )
}

export function SettingsTab({ business: mockBusiness, businessId, onSave }: { business: BusinessSettings; businessId?: string; onSave?: () => void }) {
  const t = useLang()
  const [business, setBusiness]       = useState(mockBusiness)
  const [inactiveDays, setInactiveDays] = useState(mockBusiness.inactiveDays)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)
  // businessId and real business data come from dashboard-page.tsx as props

  async function handleSave(field: string, value: any) {
    console.log('handleSave:', { field, value, businessId })
    if (!businessId) return
    setSaving(true)
    try {
      await apiUpdateBusiness(businessId, { [field]: value })
      setBusiness((prev: any) => ({ ...prev, [field]: value }))
      onSave?.()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('Error saving:', err)
    } finally {
      setSaving(false)
    }
  }

  const planDots = Array.from({ length: business.planMaxCards }, (_: unknown, i: number) => i < business.planActiveCards)

  return (
    <>
      <style>{`
        .st-content{flex:1;overflow-y:auto;padding:22px 24px;display:flex;flex-direction:column;gap:14px;}
        .st-card{background:#FFFFFF;border:1px solid rgba(43,38,32,.07);border-radius:14px;padding:18px 20px;box-shadow:0 1px 8px rgba(43,38,32,.04);}
        .st-card-head{display:flex;align-items:center;gap:8px;padding-bottom:14px;border-bottom:1px solid rgba(43,38,32,.07);margin-bottom:14px;}
        .st-card-head svg{color:rgba(43,38,32,.5);flex-shrink:0;}
        .st-card-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:13.5px;color:#2B2620;}
        .st-field-row{display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid rgba(43,38,32,.05);min-height:42px;}
        .st-field-row:last-child{border-bottom:none;padding-bottom:0;}
        .st-field-label{font-size:12.5px;color:rgba(43,38,32,.6);}
        .st-field-value{display:flex;align-items:center;gap:8px;}
        .st-field-val{font-size:12.5px;font-weight:600;color:#2B2620;}
        .st-inline-input{padding:5px 9px;font-size:12.5px;border:1.5px solid #C75D3A;border-radius:7px;background:#FBF6EE;color:#2B2620;font-family:'Inter',sans-serif;width:180px;outline:none;}
        .st-pw-input{padding:6px 10px;font-size:12.5px;border:1px solid rgba(43,38,32,.15);border-radius:7px;background:#FBF6EE;color:#2B2620;font-family:'Inter',sans-serif;width:200px;outline:none;}
        .st-pw-input:focus{border-color:#C75D3A;}
        .st-pw-error{font-size:11.5px;color:#B23B3B;background:rgba(178,59,59,.07);border:1px solid rgba(178,59,59,.2);border-radius:8px;padding:8px 12px;margin-top:10px;}
        .st-pw-success{font-size:11.5px;color:#2C5A2C;background:rgba(91,140,90,.1);border:1px solid rgba(91,140,90,.25);border-radius:8px;padding:8px 12px;margin-top:10px;}
        .st-edit-link{font-size:11px;color:#C75D3A;font-weight:600;background:none;border:none;cursor:pointer;padding:0;}
        .st-btn-sm{font-size:11px;background:#C75D3A;color:#fff;border:none;border-radius:7px;padding:5px 12px;cursor:pointer;font-weight:600;}
        .st-number-input{width:60px;padding:5px 9px;font-size:12.5px;border:1px solid rgba(43,38,32,.15);border-radius:7px;text-align:center;background:#FBF6EE;color:#2B2620;font-family:'Inter',sans-serif;outline:none;}
        .st-number-input:focus{border-color:#C75D3A;}
        .st-check-row{display:flex;align-items:flex-start;gap:10px;padding:9px 0;border-bottom:1px solid rgba(43,38,32,.05);cursor:pointer;user-select:none;}
        .st-check-row:last-child{border-bottom:none;padding-bottom:0;}
        .st-checkbox{width:17px;height:17px;border-radius:4px;border:1.5px solid rgba(43,38,32,.2);flex-shrink:0;display:flex;align-items:center;justify-content:center;margin-top:1px;transition:all .15s;}
        .st-checkbox--on{background:#C75D3A;border-color:#C75D3A;}
        .st-check-label{font-size:12.5px;color:#2B2620;font-weight:500;}
        .st-check-desc{font-size:11px;color:rgba(43,38,32,.45);margin-top:2px;}
        .st-plan-card{background:rgba(199,93,58,.07);border:1px solid rgba(199,93,58,.2);border-radius:11px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;}
        .st-plan-name{font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;font-weight:800;color:#C75D3A;}
        .st-plan-sub{font-size:11px;color:rgba(43,38,32,.5);margin-top:2px;}
        .st-plan-dots{display:flex;gap:6px;margin-top:8px;}
        .st-plan-dot{width:9px;height:9px;border-radius:50%;}
        .st-plan-dot--on{background:#C75D3A;}
        .st-plan-dot--off{background:rgba(43,38,32,.15);}
        .st-upgrade-btn{background:#C75D3A;color:#fff;border:none;border-radius:9px;padding:9px 18px;font-size:12px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;}
        .st-danger-card{background:rgba(178,59,59,.04);border:1px solid rgba(178,59,59,.15);border-radius:14px;padding:18px 20px;}
        .st-danger-head{display:flex;align-items:center;gap:8px;color:#B23B3B;padding-bottom:14px;border-bottom:1px solid rgba(178,59,59,.1);margin-bottom:14px;}
        .st-danger-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:13.5px;color:#B23B3B;}
        .st-danger-row{display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid rgba(178,59,59,.07);}
        .st-danger-row:last-child{border-bottom:none;padding-bottom:0;}
        .st-danger-label{font-size:12.5px;color:rgba(43,38,32,.65);}
        .st-danger-link{font-size:11.5px;color:#B23B3B;font-weight:700;background:none;border:none;cursor:pointer;}
        .st-delete-confirm{margin-top:12px;background:rgba(178,59,59,.08);border:1px solid rgba(178,59,59,.2);border-radius:10px;padding:14px;}
        .st-delete-confirm p{font-size:12px;color:rgba(43,38,32,.7);margin-bottom:12px;line-height:1.5;}
        .st-delete-actions{display:flex;gap:8px;}
        .st-delete-btn-cancel{background:none;border:1px solid rgba(43,38,32,.2);border-radius:8px;padding:7px 14px;font-size:12px;cursor:pointer;color:rgba(43,38,32,.6);}
        .st-delete-btn-confirm{background:#B23B3B;border:none;border-radius:8px;padding:7px 14px;font-size:12px;cursor:pointer;color:#fff;font-weight:700;}
        .st-timezone-note{font-size:10.5px;color:rgba(43,38,32,.4);margin-top:8px;line-height:1.5;}
        .st-rules-note{font-size:12px;color:rgba(43,38,32,.6);line-height:1.6;background:rgba(199,93,58,.06);border:1px solid rgba(199,93,58,.15);border-radius:10px;padding:11px 14px;margin-bottom:14px;}
        .st-rules-summary{font-size:11.5px;color:rgba(43,38,32,.5);margin-top:10px;line-height:1.6;}
        .st-sector-confirm{position:absolute;z-index:5;top:calc(100% + 8px);left:0;right:0;min-width:320px;background:#fff;border:1px solid rgba(199,93,58,.25);border-radius:10px;padding:14px;box-shadow:0 8px 24px rgba(43,38,32,.12);}
        .st-sector-confirm p{font-size:12px;color:rgba(43,38,32,.7);margin-bottom:12px;line-height:1.55;}
        .st-sector-confirm-btn{background:#C75D3A;border:none;border-radius:8px;padding:7px 14px;font-size:12px;cursor:pointer;color:#fff;font-weight:700;}
        .st-alerts-note{font-size:11px;color:rgba(43,38,32,.45);margin-bottom:12px;}
        @media(max-width:768px){
          .st-content{padding:14px 16px;}
          .st-plan-card{flex-direction:column;align-items:flex-start;gap:12px;}
          .st-field-row{flex-wrap:wrap;gap:8px;min-height:auto;}
          .st-inline-input{width:100%;}
          .st-pw-input{width:100%;}
          .st-sector-confirm{position:static;min-width:0;margin-top:10px;box-shadow:none;}
        }
      `}</style>

      <div className="st-content">
        <Section title={t('st_profile')} icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V8L3 4h18l-2 4v13"/><path d="M9 21v-6h6v6"/></svg>}>
          <FieldRow label={t('st_name')}><EditableText value={business.name} saveLabel={saving ? '...' : saved ? '✓' : t('save')} onSave={v => handleSave('name', v)} /></FieldRow>
          <FieldRow label={t('st_sector')}><SectorField value={business.sector} saving={saving} saved={saved} t={t} onSave={v => handleSave('sector', v)} /></FieldRow>
          <FieldRow label={t('st_timezone')}><span className="st-field-val">{business.timezone}</span></FieldRow>
          <div className="st-timezone-note">{t('st_timezone_note')}</div>
        </Section>

        <Section title="Seguridad" icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}>
          <PasswordSection />
        </Section>

        <Section title={t('st_rules')} icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}>
          <div className="st-rules-note">Este valor define cuándo un cliente pasa a considerarse <strong>inactivo</strong> — afecta el conteo de Analytics y qué clientes entran en el segmento "Inactivos" al enviar notificaciones.</div>
          <FieldRow label={t('st_inactive_label')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="number" className="st-number-input" value={inactiveDays} min={1} max={365} onChange={e => { setInactiveDays(Number(e.target.value)); handleSave('inactiveDays', Number(e.target.value)) }} />
              <span style={{ fontSize: 12, color: 'rgba(43,38,32,.45)' }}>{t('days')}</span>
            </div>
          </FieldRow>
          <div className="st-rules-summary">
            Con este valor, un cliente que no vuelve en <strong>{inactiveDays} días</strong> se marca como inactivo automáticamente.
          </div>
        </Section>

        <Section title={t('st_alerts')} icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}>
          <div className="st-alerts-note">{t('st_alerts_note')}</div>
          <CheckboxRow label={t('st_alert_new')} checked={business.alerts.newCustomer} description={t('st_alert_new_desc')} onToggle={v => handleSave('alerts', { ...business.alerts, newCustomer: v })} />
          <CheckboxRow label={t('st_alert_prize')} checked={business.alerts.nearPrize} description={t('st_alert_prize_desc')} onToggle={v => handleSave('alerts', { ...business.alerts, nearPrize: v })} />
          <CheckboxRow label={t('st_alert_weekly')} checked={business.alerts.weeklyDigest} description={t('st_alert_weekly_desc')} onToggle={v => handleSave('alerts', { ...business.alerts, weeklyDigest: v })} />
        </Section>

        <Section title={t('st_plan')} icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}>
          <div className="st-plan-card">
            <div>
              <div className="st-plan-name">Plan {business.plan}</div>
              <div className="st-plan-sub">{business.planActiveCards} {t('st_active_cards')}</div>
              <div className="st-plan-dots">{planDots.map((on: boolean, i: number) => <div key={i} className={`st-plan-dot ${on ? 'st-plan-dot--on' : 'st-plan-dot--off'}`} />)}</div>
            </div>
            <button className="st-upgrade-btn">{t('upgrade_plan')}</button>
          </div>
        </Section>

        <div className="st-danger-card">
          <div className="st-danger-head">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span className="st-danger-title">{t('st_danger')}</span>
          </div>
          <div className="st-danger-row">
            <span className="st-danger-label">{t('st_export')}</span>
            <button className="st-danger-link">{t('st_export_btn')}</button>
          </div>
          <div className="st-danger-row">
            <span className="st-danger-label">{t('st_delete')}</span>
            <button className="st-danger-link" onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}>{t('st_delete_btn')}</button>
          </div>
          {showDeleteConfirm && (
            <div className="st-delete-confirm">
              <p>{t('st_delete_confirm')}</p>
              <div className="st-delete-actions">
                <button className="st-delete-btn-cancel" onClick={() => setShowDeleteConfirm(false)}>{t('cancel')}</button>
                <button className="st-delete-btn-confirm">{t('st_delete_yes')}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}