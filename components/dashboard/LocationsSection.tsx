'use client'

// Configuración → Sucursales (multilocal). Una marca con varias sucursales:
// tarjetas, clientes y premios son de la marca; cada sucursal tiene su
// ubicación (aviso "¡Estás cerca!" en el pase), su QR de registro y su QR
// para vincular celulares (en Equipo). Pro: hasta 3. Enterprise: sin límite.
// Si el plan baja, las que sobran quedan pausadas (no se borra nada).
import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { apiGetLocations, apiCreateLocation, apiUpdateLocation } from '@/lib/api'
import type { Location, LocationsResponse } from '@/lib/location'
import { InfoTooltip } from './InfoTooltip'

const MAPS_HELP = 'Abrí el local en Google Maps, tocá "Compartir" y copiá el enlace. Con eso, el iPhone del cliente muestra la tarjeta cuando pasa cerca.'

const STATUS: Record<Location['status'], { label: string; cls: string }> = {
  active: { label: 'Activa', cls: 'lc-pill--on' },
  paused: { label: 'Pausada por el plan', cls: 'lc-pill--paused' },
  off: { label: 'Desactivada', cls: 'lc-pill--off' },
}

type Draft = { name: string; address: string; mapsUrl: string }
const EMPTY: Draft = { name: '', address: '', mapsUrl: '' }

function LocationForm({ initial, submitLabel, onSubmit, onCancel }: {
  initial: Draft
  submitLabel: string
  onSubmit: (d: Draft) => Promise<{ error?: string; field?: string } | void>
  onCancel: () => void
}) {
  const [d, setD] = useState<Draft>(initial)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<{ error?: string; field?: string } | null>(null)
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!d.name.trim()) return setErr({ error: 'Ponele un nombre a la sucursal.', field: 'name' })
    setBusy(true); setErr(null)
    const r = await onSubmit({ name: d.name.trim(), address: d.address.trim(), mapsUrl: d.mapsUrl.trim() })
    setBusy(false)
    if (r?.error) setErr(r)
  }
  return (
    <form className="lc-form" onSubmit={submit}>
      <label className="lc-label" htmlFor="lc-name">Nombre</label>
      <input id="lc-name" className="lc-input" value={d.name} maxLength={60} placeholder="Playa" onChange={e => setD({ ...d, name: e.target.value })} />
      {err?.field === 'name' && <div className="lc-err">{err.error}</div>}
      <label className="lc-label" htmlFor="lc-address">Dirección <span className="lc-opt">(opcional)</span></label>
      <input id="lc-address" className="lc-input" value={d.address} maxLength={160} placeholder="Paseo Marítimo 40" onChange={e => setD({ ...d, address: e.target.value })} />
      <label className="lc-label" htmlFor="lc-maps">Link de Google Maps <span className="lc-opt">(opcional)</span><InfoTooltip text={MAPS_HELP} /></label>
      <input id="lc-maps" className="lc-input" value={d.mapsUrl} maxLength={500} placeholder="https://maps.app.goo.gl/…" onChange={e => setD({ ...d, mapsUrl: e.target.value })} />
      {err && err.field !== 'name' && <div className="lc-err">{err.error}</div>}
      <div className="lc-form-actions">
        <button type="button" className="lc-btn-ghost" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="lc-btn" disabled={busy}>{busy ? 'Guardando…' : submitLabel}</button>
      </div>
    </form>
  )
}

function SignupQrModal({ loc, onClose }: { loc: Location; onClose: () => void }) {
  const [qr, setQr] = useState('')
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    QRCode.toDataURL(loc.signupUrl, { width: 520, margin: 1, color: { dark: '#2B2620', light: '#FFFFFF' } }).then(setQr).catch(() => setQr(''))
  }, [loc.signupUrl])
  return (
    <div className="lc-overlay" onClick={onClose}>
      <div className="lc-modal" onClick={e => e.stopPropagation()} role="dialog" aria-label={`QR de registro de ${loc.name}`}>
        <div className="lc-modal-head">
          <div className="lc-modal-title">QR de registro · {loc.name}</div>
          <button className="lc-x" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        <div className="lc-qr">{qr ? <img src={qr} width={220} height={220} alt="" /> : <div className="lc-skel" />}</div>
        <p className="lc-modal-text">Imprimilo y ponelo en el mostrador de esta sucursal. Los clientes que se registren con este QR quedan como clientes de {loc.name}.</p>
        <div className="lc-link-row">
          <input className="lc-input" readOnly value={loc.signupUrl} onFocus={e => e.currentTarget.select()} aria-label="Link de registro" />
          <button className="lc-btn-ghost" onClick={() => navigator.clipboard?.writeText(loc.signupUrl).then(() => setCopied(true)).catch(() => {})}>{copied ? 'Copiado' : 'Copiar'}</button>
        </div>
        {qr && <a className="lc-btn" href={qr} download={`registro-${loc.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`}>Descargar QR</a>}
      </div>
    </div>
  )
}

export function LocationsSection({ businessId, plan, isManager = false, onChoosePlan, onChanged }: {
  businessId?: string
  plan: string
  isManager?: boolean
  onChoosePlan?: () => void
  onChanged?: (r: LocationsResponse) => void
}) {
  const [data, setData] = useState<LocationsResponse | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [qrFor, setQrFor] = useState<Location | null>(null)
  const [rowError, setRowError] = useState<{ id: string; msg: string } | null>(null)

  useEffect(() => {
    if (!businessId) return
    apiGetLocations(businessId).then(r => { setData(r); onChanged?.(r) }).catch(() => setLoadError(true))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId])

  function apply(r: LocationsResponse) { setData(r); onChanged?.(r) }

  async function save(fn: () => Promise<LocationsResponse>) {
    try { apply(await fn()); return undefined }
    catch (e: any) {
      if (e?.error === 'plan_limit_reached') return { error: e.message || 'Tu plan no incluye más sucursales.' }
      return { error: e?.error || 'No pudimos guardar. Probá de nuevo.', field: e?.field }
    }
  }

  async function toggle(loc: Location) {
    if (!businessId) return
    setRowError(null)
    const r = await save(() => apiUpdateLocation(businessId, loc.id, { isActive: loc.status === 'off' }))
    if (r?.error) setRowError({ id: loc.id, msg: r.error })
  }

  if (loadError) return <div className="lc-note">No pudimos cargar las sucursales. Recargá la página.</div>
  if (!data) return <div className="lc-skel-row" />

  const max = data.max
  const canAdd = !isManager && (max === null || data.activeCount < max)
  const multiPlan = max === null || max > 1

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="lc-top">
        <div className="lc-count">
          {multiPlan
            ? (max === null ? `${data.activeCount} sucursales activas` : `${data.activeCount} de ${max} en tu plan ${plan}`)
            : 'Tu plan incluye una sucursal'}
          <InfoTooltip text="Tarjetas, clientes y premios son de tu marca y sirven en todas las sucursales. Cada sello queda registrado en la sucursal donde se escaneó." />
        </div>
        {!isManager && (canAdd
          ? !adding && <button className="lc-btn" onClick={() => { setAdding(true); setEditing(null) }}>+ Agregar sucursal</button>
          : onChoosePlan && <button className="lc-btn-ghost" onClick={onChoosePlan}>{multiPlan ? 'Más sucursales con Enterprise' : 'Hasta 3 sucursales con Pro'}</button>)}
      </div>

      {adding && businessId && (
        <LocationForm initial={EMPTY} submitLabel="Agregar sucursal" onCancel={() => setAdding(false)}
          onSubmit={async d => { const r = await save(() => apiCreateLocation(businessId, d)); if (!r) setAdding(false); return r }} />
      )}

      <div className="lc-list">
        {data.locations.map(loc => (
          <div key={loc.id} className={`lc-row${loc.status !== 'active' ? ' lc-row--dim' : ''}`}>
            {editing === loc.id && businessId ? (
              <LocationForm initial={{ name: loc.name, address: loc.address, mapsUrl: loc.mapsUrl }} submitLabel="Guardar" onCancel={() => setEditing(null)}
                onSubmit={async d => { const r = await save(() => apiUpdateLocation(businessId, loc.id, d)); if (!r) setEditing(null); return r }} />
            ) : (
              <>
                <div className="lc-row-main">
                  <div className="lc-name">
                    {loc.name}
                    {loc.isPrimary && <span className="lc-pill">Principal</span>}
                    {multiPlan && <span className={`lc-pill ${STATUS[loc.status].cls}`}>{STATUS[loc.status].label}</span>}
                  </div>
                  <div className="lc-meta">
                    {loc.address && <span>{loc.address}</span>}
                    {loc.hasCoords
                      ? <span className="lc-geo lc-geo--on">Aviso de cercanía activo</span>
                      : <span className="lc-geo">Sin ubicación: agregá el link de Maps para el aviso de cercanía</span>}
                  </div>
                  {rowError?.id === loc.id && <div className="lc-err">{rowError.msg}</div>}
                </div>
                {!isManager && (
                  <div className="lc-actions">
                    {loc.status === 'active' && <button className="lc-link" onClick={() => setQrFor(loc)}>QR de registro</button>}
                    <button className="lc-link" onClick={() => { setEditing(loc.id); setAdding(false) }}>Editar</button>
                    {!loc.isPrimary && <button className="lc-link lc-link--muted" onClick={() => toggle(loc)}>{loc.status === 'off' ? 'Reactivar' : 'Desactivar'}</button>}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {data.locations.some(l => l.status === 'paused') && (
        <div className="lc-note">Las sucursales pausadas no pueden escanear ni registrar clientes, pero su historial queda guardado. Se reactivan solas si volvés a un plan que las incluya.</div>
      )}
      {qrFor && <SignupQrModal loc={qrFor} onClose={() => setQrFor(null)} />}
    </>
  )
}

const CSS = `
  .lc-top{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:6px;}
  .lc-count{display:flex;align-items:center;gap:5px;font-size:12.5px;color:rgba(43,38,32,.6);}
  .lc-btn{display:inline-flex;align-items:center;justify-content:center;font-size:12px;background:#C75D3A;color:#fff;border:none;border-radius:8px;padding:7px 14px;cursor:pointer;font-weight:700;font-family:'Inter',sans-serif;text-decoration:none;}
  .lc-btn:disabled{opacity:.6;cursor:default;}
  .lc-btn-ghost{font-size:12px;background:#fff;color:#C75D3A;border:1px solid rgba(199,93,58,.35);border-radius:8px;padding:7px 14px;cursor:pointer;font-weight:600;font-family:'Inter',sans-serif;}
  .lc-list{display:flex;flex-direction:column;}
  .lc-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 0;border-bottom:1px solid rgba(43,38,32,.05);}
  .lc-row:last-child{border-bottom:none;padding-bottom:0;}
  .lc-row--dim .lc-name{color:rgba(43,38,32,.55);}
  .lc-row-main{min-width:0;flex:1;}
  .lc-name{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:13px;font-weight:700;color:#2B2620;}
  .lc-pill{font-size:10.5px;font-weight:600;padding:2px 8px;border-radius:999px;background:rgba(43,38,32,.06);color:rgba(43,38,32,.6);}
  .lc-pill--on{background:rgba(91,140,90,.12);color:#3E6B3D;}
  .lc-pill--paused{background:rgba(212,162,76,.18);color:#8A6420;}
  .lc-pill--off{background:rgba(43,38,32,.06);color:rgba(43,38,32,.5);}
  .lc-meta{display:flex;gap:10px;flex-wrap:wrap;font-size:11.5px;color:rgba(43,38,32,.5);margin-top:3px;}
  .lc-geo--on{color:#3E6B3D;}
  .lc-actions{display:flex;gap:12px;flex-shrink:0;}
  .lc-link{font-size:11.5px;color:#C75D3A;font-weight:600;background:none;border:none;cursor:pointer;padding:0;font-family:'Inter',sans-serif;}
  .lc-link--muted{color:rgba(43,38,32,.5);}
  .lc-form{display:flex;flex-direction:column;gap:6px;background:#FBF6EE;border-radius:10px;padding:12px;margin:8px 0;width:100%;}
  .lc-label{display:flex;align-items:center;gap:5px;font-size:11.5px;font-weight:600;color:rgba(43,38,32,.7);margin-top:4px;}
  .lc-opt{font-weight:400;color:rgba(43,38,32,.45);}
  .lc-input{width:100%;padding:7px 10px;font-size:12.5px;border:1px solid rgba(43,38,32,.15);border-radius:7px;background:#fff;color:#2B2620;font-family:'Inter',sans-serif;outline:none;min-width:0;}
  .lc-input:focus{border-color:#C75D3A;}
  .lc-form-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:6px;}
  .lc-err{font-size:11.5px;color:#B23B3B;font-weight:600;}
  .lc-note{font-size:11.5px;color:rgba(43,38,32,.55);line-height:1.5;margin-top:10px;}
  .lc-skel-row{height:44px;border-radius:8px;background:rgba(43,38,32,.05);}
  .lc-overlay{position:fixed;inset:0;background:rgba(43,38,32,.4);display:flex;align-items:center;justify-content:center;z-index:50;padding:16px;}
  .lc-modal{background:#fff;border-radius:14px;padding:20px;width:100%;max-width:400px;display:flex;flex-direction:column;gap:12px;}
  .lc-modal-head{display:flex;align-items:center;justify-content:space-between;}
  .lc-modal-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:14px;color:#2B2620;}
  .lc-x{background:none;border:none;font-size:22px;line-height:1;cursor:pointer;color:rgba(43,38,32,.5);}
  .lc-qr{display:flex;justify-content:center;}
  .lc-skel{width:220px;height:220px;border-radius:10px;background:rgba(43,38,32,.05);}
  .lc-modal-text{font-size:12px;color:rgba(43,38,32,.65);line-height:1.55;margin:0;}
  .lc-link-row{display:flex;gap:8px;}
  @media(max-width:768px){
    .lc-row{flex-direction:column;align-items:flex-start;}
  }
`
