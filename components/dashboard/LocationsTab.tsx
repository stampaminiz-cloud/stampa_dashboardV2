'use client'

// Pestaña Sucursales (multilocal). Cada sucursal es una tarjeta: datos,
// ubicación (aviso de cercanía en el pase) y horarios (dorso del pase y
// formulario de registro). Ubicación y horarios: desde Growth. Varias
// sucursales: Pro (3) y Enterprise (sin límite); si el plan baja, las que
// sobran quedan pausadas, solo para consultar.
//
// Para no equivocarse de sucursal: se muestran siempre todas, la que está
// elegida en la barra lateral aparece abierta y marcada, y cada tarjeta
// guarda lo suyo ("Guardar cambios de Playa"); no hay un guardar general.
import React, { useEffect, useState } from 'react'
import { apiGetLocations, apiCreateLocation, apiUpdateLocation } from '@/lib/api'
import type { Location, LocationsResponse, DayHours } from '@/lib/location'
import { InfoTooltip } from './InfoTooltip'

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const DEFAULT_HOURS: DayHours[] = DAYS.map((_, i) => i < 5 ? { closed: false, shifts: [{ open: '09:00', close: '18:00' }] } : { closed: true, shifts: [] })

type Draft = { name: string; address: string; mapsUrl: string; hours: DayHours[] }
const draftOf = (l: Location): Draft => ({ name: l.name, address: l.address, mapsUrl: l.mapsUrl, hours: l.hours || [] })
const same = (a: Draft, b: Draft) => JSON.stringify(a) === JSON.stringify(b)

function HoursEditor({ hours, onChange, disabled }: { hours: DayHours[]; onChange: (h: DayHours[]) => void; disabled?: boolean }) {
  if (!hours.length) {
    return (
      <div className="lt-empty-hours">
        <span>Sin horarios cargados.</span>
        {!disabled && <button type="button" className="lt-link" onClick={() => onChange(DEFAULT_HOURS)}>Cargar horarios</button>}
      </div>
    )
  }
  const setDay = (d: number, day: DayHours) => onChange(hours.map((h, i) => (i === d ? day : h)))
  return (
    <div className="lt-hours">
      {hours.map((day, d) => (
        <div key={d} className="lt-hrow">
          <span className="lt-day">{DAYS[d]}</span>
          <label className="lt-open">
            <input type="checkbox" checked={!day.closed} disabled={disabled}
              onChange={e => setDay(d, e.target.checked ? { closed: false, shifts: day.shifts.length ? day.shifts : [{ open: '09:00', close: '18:00' }] } : { closed: true, shifts: [] })} />
            {day.closed ? 'Cerrado' : 'Abierto'}
          </label>
          {!day.closed && (
            <span className="lt-shifts">
              {day.shifts.map((s, k) => (
                <span key={k} className="lt-shift">
                  {k > 0 && <span className="lt-y">y</span>}
                  <input type="time" className="lt-time" value={s.open} disabled={disabled} aria-label={`${DAYS[d]}, turno ${k + 1}, abre`}
                    onChange={e => setDay(d, { ...day, shifts: day.shifts.map((x, j) => (j === k ? { ...x, open: e.target.value } : x)) })} />
                  <span className="lt-a">a</span>
                  <input type="time" className="lt-time" value={s.close} disabled={disabled} aria-label={`${DAYS[d]}, turno ${k + 1}, cierra`}
                    onChange={e => setDay(d, { ...day, shifts: day.shifts.map((x, j) => (j === k ? { ...x, close: e.target.value } : x)) })} />
                  {k === 1 && !disabled && <button type="button" className="lt-x" aria-label={`Quitar el segundo turno del ${DAYS[d].toLowerCase()}`} onClick={() => setDay(d, { ...day, shifts: day.shifts.slice(0, 1) })}>×</button>}
                </span>
              ))}
              {day.shifts.length === 1 && !disabled && (
                <button type="button" className="lt-link" onClick={() => {
                  // Corte al mediodía: si el primer turno llega a la tarde, se acorta.
                  const first = day.shifts[0]
                  const fixed = first.close > '13:00' || first.close < first.open ? { ...first, close: '13:00' } : first
                  const second = { open: fixed.close < '16:00' ? '16:00' : fixed.close, close: '20:00' }
                  setDay(d, { ...day, shifts: [fixed, second] })
                }}>+ turno</button>
              )}
            </span>
          )}
        </div>
      ))}
      {!disabled && (
        <div className="lt-hours-actions">
          <button type="button" className="lt-link" onClick={() => onChange(hours.map(() => JSON.parse(JSON.stringify(hours[0]))))}>Copiar lunes a todos los días</button>
          <button type="button" className="lt-link lt-link--muted" onClick={() => onChange([])}>Quitar horarios</button>
        </div>
      )}
    </div>
  )
}

function LocationCard({ loc, businessId, open, onToggle, selected, tools, isManager, businessName, multi, onSaved }: {
  loc: Location; businessId: string; open: boolean; onToggle: () => void; selected: boolean; tools: boolean
  isManager: boolean; businessName: string; multi: boolean; onSaved: (r: LocationsResponse) => void
}) {
  const [draft, setDraft] = useState<Draft>(() => draftOf(loc))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<{ error: string; field?: string } | null>(null)
  const [ok, setOk] = useState(false)
  useEffect(() => { setDraft(draftOf(loc)) }, [loc])
  const dirty = !same(draft, draftOf(loc))
  const readOnly = isManager

  async function save() {
    if (!draft.name.trim()) return setErr({ error: 'Ponele un nombre a la sucursal.', field: 'name' })
    setBusy(true); setErr(null); setOk(false)
    try {
      const body: any = { name: draft.name.trim(), address: draft.address.trim() }
      if (tools) { body.mapsUrl = draft.mapsUrl.trim(); body.hours = draft.hours }
      onSaved(await apiUpdateLocation(businessId, loc.id, body))
      setOk(true)
    } catch (e: any) {
      setErr({ error: e?.message || e?.error || 'No pudimos guardar. Probá de nuevo.', field: e?.field })
    } finally { setBusy(false) }
  }

  async function toggleActive() {
    setBusy(true); setErr(null)
    try { onSaved(await apiUpdateLocation(businessId, loc.id, { isActive: loc.status === 'off' })) }
    catch (e: any) { setErr({ error: e?.message || e?.error || 'No pudimos cambiar la sucursal.' }) }
    finally { setBusy(false) }
  }

  const nearText = `¡Estás cerca de ${multi && !loc.isPrimary ? `${businessName} ${loc.name}` : businessName}!`
  const summary = [loc.address, tools ? (loc.hasCoords ? 'aviso de cercanía activo' : 'sin ubicación') : null, tools ? loc.hoursSummary || 'sin horarios' : null].filter(Boolean).join(' · ')

  return (
    <div className={`lt-card${selected ? ' lt-card--here' : ''}${loc.status !== 'active' ? ' lt-card--dim' : ''}`}>
      <button type="button" className="lt-head" onClick={onToggle} aria-expanded={open}>
        <span className="lt-head-main">
          <span className="lt-name">
            {loc.name}
            {loc.isPrimary && <span className="lt-pill">Principal</span>}
            {selected && multi && <span className="lt-pill lt-pill--here">Estás viendo esta</span>}
            {loc.status === 'paused' && <span className="lt-pill lt-pill--paused">Pausada por el plan</span>}
            {loc.status === 'off' && <span className="lt-pill">Desactivada</span>}
            {loc.status === 'active' && tools && loc.openNow != null && <span className={`lt-pill ${loc.openNow ? 'lt-pill--on' : ''}`}>{loc.openNow ? 'Abierto ahora' : 'Cerrado ahora'}</span>}
          </span>
          {!open && summary && <span className="lt-sum">{summary}</span>}
        </span>
        <span className="lt-toggle">{open ? 'Cerrar' : 'Ver y editar'} <span aria-hidden="true">{open ? '▴' : '▾'}</span></span>
      </button>

      {open && (
        <div className="lt-body">
          {loc.status === 'paused' && <div className="lt-note">Esta sucursal está pausada porque tu plan no la incluye: no escanea ni registra clientes, pero su historial queda guardado. Se reactiva sola si volvés a un plan que la incluya.</div>}

          <div className="lt-sec">
            <div className="lt-grid">
              <label className="lt-field"><span className="lt-label">Nombre</span>
                <input className="lt-input" value={draft.name} maxLength={60} disabled={readOnly} onChange={e => setDraft({ ...draft, name: e.target.value })} /></label>
              <label className="lt-field"><span className="lt-label">Dirección <em>(opcional)</em></span>
                <input className="lt-input" value={draft.address} maxLength={160} disabled={readOnly} placeholder="Calle Larios 12" onChange={e => setDraft({ ...draft, address: e.target.value })} /></label>
            </div>
            {err?.field === 'name' && <div className="lt-err">{err.error}</div>}
          </div>

          {tools && <>
            <div className="lt-sec">
              <div className="lt-sec-title">Ubicación<InfoTooltip text={'Abrí el local en Google Maps, tocá "Compartir" y copiá el enlace. El iPhone del cliente muestra la tarjeta en la pantalla bloqueada cuando pasa cerca. Nosotros nunca sabemos dónde está el cliente.'} /></div>
              <div className="lt-sub">Con la ubicación, el cliente ve al pasar cerca: “{nearText}”</div>
              <div className="lt-maps">
                <input className="lt-input" value={draft.mapsUrl} maxLength={500} disabled={readOnly} placeholder="https://maps.app.goo.gl/…" aria-label={`Link de Google Maps de ${loc.name}`} onChange={e => setDraft({ ...draft, mapsUrl: e.target.value })} />
                {loc.hasCoords && draft.mapsUrl === loc.mapsUrl && <span className="lt-pill lt-pill--on">Aviso de cercanía activo</span>}
              </div>
              {err?.field === 'mapsUrl' && <div className="lt-err">{err.error}</div>}
            </div>

            <div className="lt-sec">
              <div className="lt-sec-title">Horarios<InfoTooltip text="Aparecen en el dorso del pase y en el formulario de registro. Se usa la zona horaria del negocio (Configuración)." /></div>
              <HoursEditor hours={draft.hours} disabled={readOnly} onChange={hours => setDraft({ ...draft, hours })} />
              {err?.field === 'hours' && <div className="lt-err">{err.error}</div>}
            </div>
          </>}

          {err && !err.field && <div className="lt-err">{err.error}</div>}
          {!readOnly && (
            <div className="lt-actions">
              {!loc.isPrimary ? <button type="button" className="lt-link lt-link--muted" disabled={busy} onClick={toggleActive}>{loc.status === 'off' ? 'Reactivar sucursal' : 'Desactivar sucursal'}</button> : <span />}
              <span className="lt-actions-end">
                {ok && !dirty && <span className="lt-ok">Guardado</span>}
                <button type="button" className="lt-btn" disabled={busy || !dirty} onClick={save}>{busy ? 'Guardando…' : `Guardar cambios de ${loc.name}`}</button>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function LocationsTab({ businessId, businessName, isManager = false, selectedId = null, onChoosePlan, onChanged }: {
  businessId: string | null
  businessName: string
  isManager?: boolean
  selectedId?: string | null
  onChoosePlan?: () => void
  onChanged?: (r: LocationsResponse) => void
}) {
  const [data, setData] = useState<LocationsResponse | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [addErr, setAddErr] = useState('')
  const [addBusy, setAddBusy] = useState(false)

  useEffect(() => {
    if (!businessId) return
    apiGetLocations(businessId).then(r => {
      setData(r); onChanged?.(r)
      // Abierta: la elegida en la barra lateral; si no, la principal.
      const first = r.locations.find(l => l.id === selectedId) || r.locations.find(l => l.isPrimary)
      if (first) setOpenIds(new Set([first.id]))
    }).catch(() => setLoadError(true))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId])

  useEffect(() => { if (selectedId) setOpenIds(s => new Set([...s, selectedId])) }, [selectedId])

  function apply(r: LocationsResponse) { setData(r); onChanged?.(r) }

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!businessId) return
    if (!newName.trim()) return setAddErr('Ponele un nombre a la sucursal.')
    setAddBusy(true); setAddErr('')
    try {
      const r = await apiCreateLocation(businessId, { name: newName.trim() })
      apply(r)
      const created = r.locations.find(l => l.name === newName.trim() && !data?.locations.some(x => x.id === l.id))
      if (created) setOpenIds(new Set([created.id]))
      setAdding(false); setNewName('')
    } catch (err: any) {
      setAddErr(err?.message || err?.error || 'No pudimos crear la sucursal.')
    } finally { setAddBusy(false) }
  }

  return (
    <div className="lt-content">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {loadError ? <div className="lt-note">No pudimos cargar las sucursales. Recargá la página.</div>
        : !data ? <div className="lt-skel" />
        : !data.tools ? (
          <div className="lt-card lt-locked">
            <div className="lt-locked-title">Ubicación y horarios de tu local</div>
            <ul className="lt-locked-list">
              <li><strong>Aviso de cercanía:</strong> cuando un cliente pasa cerca del local, su iPhone le muestra la tarjeta en la pantalla bloqueada.</li>
              <li><strong>Horarios:</strong> aparecen en el dorso de la tarjeta y en el formulario de registro.</li>
              <li><strong>Sucursales:</strong> hasta 3 con Pro, todas con la misma tarjeta y los mismos clientes.</li>
            </ul>
            {!isManager && onChoosePlan && <button type="button" className="lt-btn" onClick={onChoosePlan}>Disponible desde Growth</button>}
            {/* Bajó de un plan con sucursales: se ven, pausadas, para consultar su historial. */}
            {data.locations.some(l => l.status === 'paused') && (
              <div className="lt-note" style={{ marginBottom: 0 }}>
                Pausadas por el plan: {data.locations.filter(l => l.status === 'paused').map(l => l.name).join(', ')}. No escanean ni registran clientes, pero su historial queda guardado y lo podés ver eligiéndolas en la barra lateral. Se reactivan solas si volvés a un plan que las incluya.
              </div>
            )}
          </div>
        ) : (() => {
          const multi = data.locations.filter(l => l.status !== 'off').length >= 2
          const canAdd = !isManager && (data.max === null || data.activeCount < data.max)
          const multiPlan = data.max === null || data.max > 1
          return <>
            <div className="lt-top">
              <div className="lt-count">{multiPlan ? (data.max === null ? `${data.activeCount} sucursales activas` : `${data.activeCount} de ${data.max} en tu plan ${data.plan}`) : 'Tu plan incluye una sucursal'}</div>
              {!isManager && (canAdd
                ? !adding && <button type="button" className="lt-btn" onClick={() => setAdding(true)}>+ Agregar sucursal</button>
                : onChoosePlan && <button type="button" className="lt-btn-ghost" onClick={onChoosePlan}>{multiPlan ? 'Más sucursales con Enterprise' : 'Hasta 3 sucursales con Pro'}</button>)}
            </div>
            {adding && (
              <form className="lt-card lt-add" onSubmit={add}>
                <label className="lt-field"><span className="lt-label">Nombre de la nueva sucursal</span>
                  <input className="lt-input" autoFocus value={newName} maxLength={60} placeholder="Playa" onChange={e => setNewName(e.target.value)} /></label>
                {addErr && <div className="lt-err">{addErr}</div>}
                <div className="lt-actions"><span className="lt-sub">Después cargás la dirección, la ubicación y los horarios.</span>
                  <span className="lt-actions-end"><button type="button" className="lt-btn-ghost" onClick={() => { setAdding(false); setAddErr('') }}>Cancelar</button><button type="submit" className="lt-btn" disabled={addBusy}>{addBusy ? 'Creando…' : 'Crear sucursal'}</button></span></div>
              </form>
            )}
            {data.locations.map(loc => (
              <LocationCard key={loc.id} loc={loc} businessId={businessId!} businessName={businessName} multi={multi}
                open={openIds.has(loc.id)} selected={loc.id === selectedId} tools={data.tools} isManager={isManager}
                onToggle={() => setOpenIds(s => { const n = new Set(s); n.has(loc.id) ? n.delete(loc.id) : n.add(loc.id); return n })}
                onSaved={apply} />
            ))}
          </>
        })()}
    </div>
  )
}

const CSS = `
  .lt-content{flex:1;overflow-y:auto;padding:22px 24px;display:flex;flex-direction:column;gap:12px;}
  .lt-top{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;}
  .lt-count{font-size:13px;color:rgba(43,38,32,.6);}
  .lt-card{background:#fff;border:1px solid rgba(43,38,32,.07);border-radius:14px;box-shadow:0 1px 8px rgba(43,38,32,.04);}
  .lt-card--here{border:2px solid rgba(199,93,58,.55);}
  .lt-card--dim .lt-name{color:rgba(43,38,32,.55);}
  .lt-head{display:flex;justify-content:space-between;align-items:center;gap:12px;width:100%;background:none;border:none;text-align:left;padding:16px 20px;cursor:pointer;font-family:'Inter',sans-serif;border-radius:14px;}
  .lt-head:focus-visible{outline:2px solid #C75D3A;outline-offset:-2px;}
  .lt-head-main{display:flex;flex-direction:column;gap:3px;min-width:0;}
  .lt-name{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-family:'Plus Jakarta Sans',sans-serif;font-size:14.5px;font-weight:700;color:#2B2620;}
  .lt-sum{font-size:12px;color:rgba(43,38,32,.55);}
  .lt-toggle{font-size:12px;font-weight:600;color:#C75D3A;flex-shrink:0;}
  .lt-pill{font-family:'Inter',sans-serif;font-size:10.5px;font-weight:600;padding:2px 8px;border-radius:999px;background:rgba(43,38,32,.06);color:rgba(43,38,32,.6);}
  .lt-pill--on{background:rgba(91,140,90,.12);color:#3E6B3D;}
  .lt-pill--here{background:rgba(199,93,58,.12);color:#A9472A;}
  .lt-pill--paused{background:rgba(212,162,76,.18);color:#8A6420;}
  .lt-body{padding:0 20px 18px;display:flex;flex-direction:column;}
  .lt-sec{border-top:1px solid rgba(43,38,32,.07);padding:14px 0;}
  .lt-sec-title{display:flex;align-items:center;gap:5px;font-size:12.5px;font-weight:700;color:#2B2620;margin-bottom:4px;}
  .lt-sub{font-size:11.5px;color:rgba(43,38,32,.55);line-height:1.5;margin-bottom:8px;}
  .lt-grid{display:grid;grid-template-columns:1fr 1.4fr;gap:12px;}
  .lt-field{display:flex;flex-direction:column;gap:4px;min-width:0;}
  .lt-label{font-size:11.5px;font-weight:600;color:rgba(43,38,32,.7);}
  .lt-label em{font-style:normal;font-weight:400;color:rgba(43,38,32,.45);}
  .lt-input{width:100%;box-sizing:border-box;padding:8px 10px;font-size:12.5px;border:1px solid rgba(43,38,32,.15);border-radius:8px;background:#FBF6EE;color:#2B2620;font-family:'Inter',sans-serif;outline:none;min-width:0;}
  .lt-input:focus{border-color:#C75D3A;}
  .lt-maps{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
  .lt-maps .lt-input{flex:1;min-width:220px;}
  .lt-hours{display:flex;flex-direction:column;gap:6px;}
  .lt-hrow{display:grid;grid-template-columns:86px 92px 1fr;align-items:center;gap:8px;min-height:32px;}
  .lt-day{font-size:12.5px;font-weight:600;color:#2B2620;}
  .lt-open{display:flex;align-items:center;gap:6px;font-size:12px;color:rgba(43,38,32,.7);cursor:pointer;}
  .lt-open input{accent-color:#C75D3A;}
  .lt-shifts{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
  .lt-shift{display:inline-flex;align-items:center;gap:5px;}
  .lt-time{padding:5px 6px;font-size:12px;border:1px solid rgba(43,38,32,.15);border-radius:7px;background:#FBF6EE;color:#2B2620;font-family:'Inter',sans-serif;}
  .lt-a,.lt-y{font-size:11.5px;color:rgba(43,38,32,.5);}
  .lt-x{background:none;border:none;font-size:16px;line-height:1;color:rgba(43,38,32,.45);cursor:pointer;padding:0 2px;}
  .lt-hours-actions{display:flex;gap:16px;margin-top:6px;}
  .lt-empty-hours{display:flex;align-items:center;gap:10px;font-size:12px;color:rgba(43,38,32,.55);}
  .lt-link{font-size:12px;color:#C75D3A;font-weight:600;background:none;border:none;cursor:pointer;padding:0;font-family:'Inter',sans-serif;}
  .lt-link--muted{color:rgba(43,38,32,.5);}
  .lt-btn{font-size:12.5px;background:#C75D3A;color:#fff;border:none;border-radius:9px;padding:9px 16px;cursor:pointer;font-weight:700;font-family:'Inter',sans-serif;}
  .lt-btn:disabled{opacity:.45;cursor:default;}
  .lt-btn-ghost{font-size:12.5px;background:#fff;color:#C75D3A;border:1px solid rgba(199,93,58,.35);border-radius:9px;padding:8px 14px;cursor:pointer;font-weight:600;font-family:'Inter',sans-serif;}
  .lt-actions{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;border-top:1px solid rgba(43,38,32,.07);padding-top:14px;}
  .lt-actions-end{display:flex;align-items:center;gap:10px;}
  .lt-ok{font-size:11.5px;color:#5B8C5A;font-weight:600;}
  .lt-err{font-size:11.5px;color:#B23B3B;font-weight:600;margin-top:6px;}
  .lt-note{font-size:12px;color:#7A5A12;background:rgba(212,162,76,.14);border:1px solid rgba(212,162,76,.3);border-radius:10px;padding:9px 14px;margin-bottom:10px;line-height:1.5;}
  .lt-add{padding:16px 20px;display:flex;flex-direction:column;gap:10px;}
  .lt-add .lt-actions{border-top:none;padding-top:0;}
  .lt-locked{padding:22px 24px;display:flex;flex-direction:column;gap:12px;align-items:flex-start;}
  .lt-locked-title{font-family:'Plus Jakarta Sans',sans-serif;font-size:15px;font-weight:700;color:#2B2620;}
  .lt-locked-list{margin:0;padding-left:18px;font-size:12.5px;color:rgba(43,38,32,.7);line-height:1.6;display:flex;flex-direction:column;gap:4px;}
  .lt-skel{height:120px;border-radius:14px;background:rgba(43,38,32,.05);}
  @media(max-width:768px){
    .lt-content{padding:14px 16px;}
    .lt-grid{grid-template-columns:1fr;}
    .lt-hrow{grid-template-columns:1fr auto;}
    .lt-shifts{grid-column:1 / -1;}
    .lt-head{flex-direction:column;align-items:flex-start;}
  }
`
