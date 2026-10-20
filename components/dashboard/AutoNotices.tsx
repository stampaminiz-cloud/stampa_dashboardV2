'use client'
// Avisos automáticos (Pro), en Notificaciones. Salen solos desde el backend
// (services/autoNotices.js): de día, una vez por motivo, sin contar para los
// envíos del mes. Acá se prenden, se edita el texto y se ve cuántos salieron.
import React, { useEffect, useState } from 'react'
import { getJson } from '@/lib/cache'
import { apiUpdateBusiness } from '@/lib/api'
import { usePlan } from '@/data/plans'
import { Icon, type IconName } from '@/components/ui/Icon'
import { Switch } from '@/components/ui/Switch'

type Key = 'welcome' | 'nearReward' | 'winback' | 'review'
interface Notice { enabled: boolean; message: string; defaultMessage: string; sentThisMonth: number; days?: number; url?: string; afterVisits?: number }
type Notices = Record<Key, Notice>

const INFO: Record<Key, { title: string; when: string; icon: IconName }> = {
  welcome: { title: 'Bienvenida', when: 'Una hora después de que se registra.', icon: 'bienvenida' },
  nearReward: { title: 'A un sello del premio', when: 'Al día siguiente de la visita que lo dejó a 1 sello. Solo tarjetas de sellos.', icon: 'unSello' },
  winback: { title: 'Te extrañamos', when: 'Cuando pasan esos días sin que venga. Una vez por ausencia.', icon: 'teExtranamos' },
  review: { title: 'Pedir reseña en Google', when: 'Unas horas después de la visita que elijas. Una vez por cliente.', icon: 'resena' },
}
const KEYS: Key[] = ['welcome', 'nearReward', 'winback', 'review']
const MAX = 160

function sample(text: string, businessName: string) {
  return text.replace(/\{nombre\}/g, 'Ana').replace(/\{negocio\}/g, businessName)
}

export function AutoNotices({ businessId, businessName, hasStamp, isManager = false, onChoosePlan }: {
  businessId?: string | null; businessName: string; hasStamp: boolean; isManager?: boolean; onChoosePlan: () => void
}) {
  const { can } = usePlan()
  const allowed = can('autoNotices')
  const [data, setData] = useState<Notices | null>(null)
  const [draft, setDraft] = useState<Partial<Record<Key, Partial<Notice>>>>({})
  const [open, setOpen] = useState<Key | null>(null)
  const [msg, setMsg] = useState<{ key: Key; ok: boolean; text: string } | null>(null)
  const [saving, setSaving] = useState<Key | null>(null)

  useEffect(() => {
    if (!businessId) return
    getJson<any>(`/api/businesses/${businessId}`).then(b => setData(b?.autoNotices || null)).catch(() => setData(null))
  }, [businessId])

  async function save(k: Key, patch: Partial<Notice>) {
    if (!businessId || !data) return
    setSaving(k); setMsg(null)
    try {
      const b: any = await apiUpdateBusiness(businessId, { autoNotices: { [k]: patch } } as any)
      setData(b.autoNotices)
      setDraft(d => ({ ...d, [k]: undefined }))
      setMsg({ key: k, ok: true, text: patch.enabled === true ? 'Activado' : patch.enabled === false ? 'Desactivado' : 'Guardado' })
      setTimeout(() => setMsg(m => m?.key === k && m.ok ? null : m), 2200)
      if (patch.enabled === undefined) setOpen(null)
    } catch (err: any) {
      setMsg({ key: k, ok: false, text: err?.message && err?.error === 'plan_limit_reached' ? err.message : err?.error || 'No se pudo guardar.' })
    } finally { setSaving(null) }
  }

  const keys = KEYS.filter(k => k !== 'nearReward' || hasStamp)

  return (
    <div className="an">
      <style>{CSS}</style>
      <div className="an-head">
        <div>
          <div className="an-title">Avisos automáticos {!allowed && <span className="an-pro">Pro</span>}</div>
          <div className="an-sub">Salen solos, de día, una vez por cliente y motivo. No cuentan para tus envíos del mes.</div>
        </div>
        {!allowed && !isManager && <button className="s-btn s-btn--primary s-btn--sm" onClick={onChoosePlan}>Ver plan Pro</button>}
      </div>

      <div className="an-list">
        {keys.map(k => {
          const n = data?.[k]
          const d = { ...n, ...draft[k] } as Notice
          const text = (d.message ?? '') || n?.defaultMessage || ''
          const editing = open === k
          const dirty = !!draft[k] && Object.keys(draft[k]!).length > 0
          return (
            <div key={k} className={`an-item${n?.enabled ? ' is-on' : ''}${!allowed ? ' is-locked' : ''}`}>
              <div className="an-row">
                <span className="an-icon"><Icon name={INFO[k].icon} size={18} /></span>
                <div className="an-main">
                  <div className="an-name">{INFO[k].title}</div>
                  <div className="an-when">
                    {k === 'winback' && n ? `A los ${n.days} días sin venir. Una vez por ausencia.`
                      : k === 'review' && n ? `Después de la visita ${n.afterVisits}, unas horas más tarde. Una vez por cliente.`
                      : INFO[k].when}
                  </div>
                </div>
                {n?.enabled && <span className="an-count" title="Avisos que salieron este mes">{n.sentThisMonth} este mes</span>}
                {msg?.key === k && <span className={msg.ok ? 'an-ok' : 'an-err'}>{msg.ok ? <><Icon name="listo" size={12} /> {msg.text}</> : msg.text}</span>}
                <button type="button" className="s-btn s-btn--secondary s-btn--sm" disabled={!allowed || !n} onClick={() => setOpen(editing ? null : k)}>{editing ? 'Cerrar' : 'Editar'}</button>
                <span title={allowed ? '' : 'Disponible en Pro'}>
                  <Switch checked={!!n?.enabled} disabled={!allowed || !n || saving === k} label={`${INFO[k].title}: ${n?.enabled ? 'activado' : 'desactivado'}`}
                    onChange={on => {
                      if (on && k === 'review' && !n?.url) { setOpen('review'); setMsg({ key: k, ok: false, text: 'Pegá el link de reseñas para activarlo.' }); return }
                      save(k, { enabled: on })
                    }} />
                </span>
              </div>

              {editing && n && (
                <div className="an-body">
                  {k === 'winback' && (
                    <div className="an-field">
                      <span>Después de</span>
                      <div className="an-seg">
                        {[15, 30, 60].map(v => (
                          <button key={v} type="button" className={`an-seg-btn${d.days === v ? ' is-on' : ''}`} onClick={() => setDraft(x => ({ ...x, [k]: { ...x[k], days: v } }))}>{v} días</button>
                        ))}
                      </div>
                    </div>
                  )}
                  {k === 'review' && (<>
                    <div className="an-field an-field--col">
                      <span>Link de reseñas de Google</span>
                      <input className="an-input" value={d.url || ''} placeholder="https://g.page/r/…/review" onChange={e => setDraft(x => ({ ...x, [k]: { ...x[k], url: e.target.value } }))} />
                      <small>En tu Perfil de Empresa de Google: "Pedir reseñas" → copiar el link. Queda también en el dorso de la tarjeta.</small>
                    </div>
                    <div className="an-field">
                      <span>Después de la visita</span>
                      <div className="an-seg">
                        {[3, 5, 10].map(v => (
                          <button key={v} type="button" className={`an-seg-btn${d.afterVisits === v ? ' is-on' : ''}`} onClick={() => setDraft(x => ({ ...x, [k]: { ...x[k], afterVisits: v } }))}>{v}</button>
                        ))}
                      </div>
                    </div>
                  </>)}
                  <div className="an-field an-field--col">
                    <span>Mensaje <small>{text.length}/{MAX} · podés usar {'{nombre}'} y {'{negocio}'}</small></span>
                    <textarea className="an-text" rows={2} maxLength={MAX} value={d.message ?? ''} placeholder={n.defaultMessage}
                      onChange={e => setDraft(x => ({ ...x, [k]: { ...x[k], message: e.target.value } }))} />
                  </div>
                  <div className="an-preview"><span>Así le llega:</span> {sample(text, businessName)}</div>
                  <div className="an-actions">
                    <button type="button" className="s-btn s-btn--secondary s-btn--sm" onClick={() => { setDraft(x => ({ ...x, [k]: undefined })); setOpen(null) }}>Cancelar</button>
                    <button type="button" className="s-btn s-btn--primary s-btn--sm" disabled={!dirty || saving === k} onClick={() => save(k, draft[k]!)}>{saving === k ? 'Guardando…' : 'Guardar'}</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const CSS = `
  .an{background:#FFFFFF;border:1px solid rgba(34,32,27,.07);border-radius:14px;padding:18px 20px;box-shadow:0 1px 8px rgba(34,32,27,.04);}
  .an-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px;flex-wrap:wrap;}
  .an-title{font-family:var(--font-display);font-weight:700;font-size:13px;color:var(--s-tinta);display:flex;align-items:center;gap:8px;}
  .an-sub{font-size:11px;color:rgba(34,32,27,.5);margin-top:2px;line-height:1.5;}
  .an-pro{font-size:10px;font-weight:700;background:var(--s-pino);color:#F7F0E4;border-radius:999px;padding:2px 8px;}
  .an-list{display:flex;flex-direction:column;gap:8px;}
  .an-item{border:1px solid rgba(34,32,27,.09);border-radius:12px;padding:10px 12px;background:#fff;}
  .an-item.is-on{border-color:rgba(199,93,58,.35);background:rgba(199,93,58,.03);}
  .an-item.is-locked{opacity:.6;}
  .an-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
  .an-icon{width:32px;height:32px;border-radius:9px;background:var(--s-salvia);display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;color:var(--s-brasa);}
  .an-main{flex:1;min-width:180px;}
  .an-name{font-size:12.5px;font-weight:700;color:var(--s-tinta);}
  .an-when{font-size:11px;color:rgba(34,32,27,.55);margin-top:1px;line-height:1.4;}
  .an-count{font-size:11px;font-weight:600;color:var(--s-listo);background:rgba(91,140,90,.1);border-radius:999px;padding:3px 9px;white-space:nowrap;}
  .an-ok{display:inline-flex;align-items:center;gap:3px;font-size:11px;color:var(--s-listo);font-weight:600;}
  .an-err{font-size:11px;color:var(--s-error);}
  .an-body{margin-top:12px;padding-top:12px;border-top:1px dashed rgba(34,32,27,.12);display:flex;flex-direction:column;gap:10px;}
  .an-field{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:11.5px;color:rgba(34,32,27,.7);font-weight:600;}
  .an-field--col{flex-direction:column;align-items:stretch;gap:5px;}
  .an-field small{font-weight:400;color:rgba(34,32,27,.45);}
  .an-seg{display:inline-flex;background:var(--s-salvia);border:1.5px solid rgba(34,32,27,.1);border-radius:999px;padding:3px;gap:2px;}
  .an-seg-btn{border:none;background:transparent;border-radius:999px;padding:5px 11px;font-size:11.5px;font-weight:600;color:rgba(34,32,27,.55);cursor:pointer;font-family:var(--font-body);}
  .an-seg-btn.is-on{background:#fff;color:var(--s-brasa);box-shadow:0 1px 3px rgba(34,32,27,.12);}
  .an-input,.an-text{padding:8px 11px;font-size:12px;border:1px solid rgba(34,32,27,.15);border-radius:9px;background:#fff;color:var(--s-tinta);outline:none;font-family:var(--font-body);font-weight:400;resize:vertical;}
  .an-input:focus,.an-text:focus{border-color:var(--s-brasa);}
  .an-preview{font-size:12px;color:var(--s-tinta);background:var(--s-salvia);border-radius:9px;padding:9px 11px;line-height:1.5;}
  .an-preview span{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:rgba(34,32,27,.45);margin-right:4px;}
  .an-actions{display:flex;justify-content:flex-end;gap:8px;}
  @media(max-width:600px){.an{padding:14px;}.an-main{min-width:0;flex-basis:calc(100% - 90px);}}
`
