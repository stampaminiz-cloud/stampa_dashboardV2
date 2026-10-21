'use client'
// WhatsApp en la tarjeta (Configuración, todos los planes). A la izquierda se
// configura: número, hasta 2 botones (tipo y texto; sugeridos según el
// rubro) y el título que va en la fila de abajo del frente. A la derecha, en
// vivo, cómo lo ve el cliente: el frente y el dorso (ⓘ) de la tarjeta.
// Backend: services/whatsapp.js; decisiones: docs/whatsapp-y-pedidos.md.
import React, { useEffect, useState } from 'react'
import { BASE_URL } from '@/lib/api'
import { Icon } from '@/components/ui/Icon'

type Kind = { kind: string; label: string }
type Suggestions = {
  voice: 'vos' | 'tu'
  suggested: Kind[]
  all: Kind[]
  front: { title: string }
  topValue: string
  groups: Record<string, string>
  limits: { label: number; title: number }
  maxButtons: number
}
type Saved = { number?: string; buttons?: Kind[]; frontTitle?: string } | null

const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('stampa_token') })
const pretty = (n: string) => (n ? `+${n}` : '')

export function WhatsappSettings({ businessId, isManager, onSaved, color = '#1B412F', textColor = '#FFFFFF' }: { businessId?: string; isManager: boolean; onSaved?: () => void; color?: string; textColor?: string }) {
  const [sug, setSug] = useState<Suggestions | null>(null)
  const [saved, setSaved] = useState<Saved>(null)
  const [number, setNumber] = useState('')
  const [buttons, setButtons] = useState<Kind[]>([])
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [loadError, setLoadError] = useState(false)

  function fill(w: Saved, s: Suggestions) {
    setSaved(w)
    setNumber(pretty(w?.number || ''))
    setButtons(w?.number ? (w.buttons || []) : s.suggested.slice(0, s.maxButtons))
    setTitle(w?.frontTitle || '')
  }

  useEffect(() => {
    if (!businessId) return
    fetch(`${BASE_URL}/api/businesses/${businessId}/whatsapp`, { headers: authHeaders() })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(d => { setSug(d.suggestions); fill(d.whatsapp, d.suggestions) })
      .catch(() => setLoadError(true))
  }, [businessId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loadError) return <div className="wa-help">No pudimos cargar WhatsApp. Recargá la página.</div>
  if (!sug) return <div className="wa-help">Cargando…</div>

  const has = !!saved?.number
  const disabled = isManager
  const labelOf = (kind: string) => sug.all.find(k => k.kind === kind)?.label || ''
  const groupOf = (kind: string) => sug.groups[kind] || 'WHATSAPP'
  // Sin título propio, sale del primer botón (igual que en el backend).
  const shownTitle = title.trim() || (buttons[0] ? groupOf(buttons[0].kind) : 'WHATSAPP')
  const fixed = sug.voice === 'vos' ? 'Escribinos por WhatsApp' : 'Escríbenos por WhatsApp'
  const backRows = buttons.length ? buttons.map(b => ({ t: groupOf(b.kind), l: b.label || labelOf(b.kind) })) : [{ t: 'WHATSAPP', l: fixed }]

  function setButton(i: number, patch: Partial<Kind>) {
    setMsg(null)
    setButtons(buttons.map((b, j) => {
      if (j !== i) return b
      // Al cambiar el tipo, el texto pasa al sugerido si no lo habían editado.
      if (patch.kind && (b.label === labelOf(b.kind) || !b.label)) return { kind: patch.kind, label: labelOf(patch.kind) }
      return { ...b, ...patch }
    }))
  }
  function addButton() {
    const next = sug!.all.find(k => !buttons.some(b => b.kind === k.kind))
    if (next) setButtons([...buttons, next])
  }

  async function save(remove = false) {
    if (!businessId || busy) return
    setBusy(true); setMsg(null)
    try {
      const body = remove ? { whatsapp: { number: '' } } : { whatsapp: { number, buttons, frontTitle: title } }
      const r = await fetch(`${BASE_URL}/api/businesses/${businessId}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(body) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw d
      fill(d.whatsapp, sug!)
      setMsg({ ok: true, text: remove ? 'WhatsApp quitado de las tarjetas.' : 'Guardado. Las tarjetas de tus clientes se actualizan solas.' })
      onSaved?.()
    } catch (err: any) {
      setMsg({ ok: false, text: err?.error || 'No se pudo guardar.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="wa">
      <style>{CSS}</style>
      <div className="wa-cols">
        <div className="wa-form">
          <p className="wa-intro">Con tu número cargado, la tarjeta de tus clientes trae botones que abren el chat con vos, con el mensaje ya escrito. No tiene costo.</p>

          <div className="wa-field">
            <label className="wa-label" htmlFor="wa-number">Número</label>
            <input id="wa-number" className="wa-input" inputMode="tel" placeholder="+54 9 11 5555-0000" value={number} disabled={disabled}
              onChange={e => { setNumber(e.target.value); setMsg(null) }} />
            <div className="wa-help">Con código de país, como lo marcarías desde el exterior.</div>
          </div>

          <div className="wa-field">
            <div className="wa-label">Botones <span className="wa-count">{buttons.length} de {sug.maxButtons}</span></div>
            {buttons.map((b, i) => (
              <div key={i} className="wa-btn-row">
                <select className="wa-select" value={b.kind} disabled={disabled} aria-label={`Tipo del botón ${i + 1}`}
                  onChange={e => setButton(i, { kind: e.target.value })}>
                  {sug.all.filter(k => k.kind === b.kind || !buttons.some(x => x.kind === k.kind)).map(k => <option key={k.kind} value={k.kind}>{k.label}</option>)}
                </select>
                <input className="wa-input" value={b.label} maxLength={sug.limits.label} disabled={disabled} aria-label={`Texto del botón ${i + 1}`}
                  onChange={e => setButton(i, { label: e.target.value })} />
                {!disabled && <button type="button" className="wa-x" aria-label={`Quitar el botón ${i + 1}`} onClick={() => setButtons(buttons.filter((_, j) => j !== i))}><Icon name="cerrar" size={14} /></button>}
              </div>
            ))}
            {!disabled && buttons.length < sug.maxButtons && (
              <button type="button" className="s-btn s-btn--secondary s-btn--sm wa-add" onClick={addButton}><Icon name="agregar" size={14} />Agregar botón</button>
            )}
            <div className="wa-help">El tipo define el mensaje que llega escrito y el título en la tarjeta. El texto lo podés cambiar.</div>
          </div>

          <div className="wa-field">
            <label className="wa-label" htmlFor="wa-title">Título en el frente de la tarjeta</label>
            <input id="wa-title" className="wa-input wa-input--short" value={title} maxLength={sug.limits.title} disabled={disabled}
              placeholder={buttons[0] ? groupOf(buttons[0].kind) : 'WHATSAPP'} onChange={e => setTitle(e.target.value.toUpperCase())} />
            <div className="wa-help">Va en la fila de abajo, al lado de las visitas. Si lo dejás vacío, sale del primer botón.</div>
          </div>

          {disabled
            ? <div className="wa-help">Solo el dueño puede cambiar el WhatsApp.</div>
            : (
              <div className="wa-actions">
                <button type="button" className="s-btn s-btn--primary s-btn--sm" disabled={busy || !number.trim()} onClick={() => save()}>{busy ? 'Guardando…' : 'Guardar'}</button>
                {has && <button type="button" className="s-btn s-btn--text s-btn--sm" disabled={busy} onClick={() => save(true)}>Quitar WhatsApp</button>}
              </div>
            )}
          {msg && <div className={`s-notice s-notice--${msg.ok ? 'ok' : 'error'}`}>{msg.text}</div>}
        </div>

        <div className="wa-preview" aria-label="Cómo lo ve tu cliente">
          <div className="wa-pv-head">Así lo ve tu cliente</div>
          <div className="wa-pv-sub">Frente de la tarjeta</div>
          <div className="wa-pv-card" style={{ background: color, color: textColor }}>
            <div className="wa-pv-f"><span>TITULAR</span><b>Lucía Gómez</b></div>
            <div className="wa-pv-f"><span>VISITAS</span><b>6</b></div>
            <div className="wa-pv-f wa-pv-hl"><span>{shownTitle}</span><b>{sug.topValue}</b></div>
          </div>
          <div className="wa-pv-sub">Dorso (ⓘ)</div>
          <div className="wa-pv-back">
            {backRows.map((r, i) => (
              <div key={i} className="wa-pv-row"><span>{r.t}</span><a>{r.l}</a></div>
            ))}
            <div className="wa-pv-row"><span>ÚLTIMA NOVEDAD</span><em>Sin novedades por ahora.</em></div>
          </div>
          <div className="wa-help">Cada botón abre WhatsApp con "Hola, soy Lucía Gómez." y el mensaje del tipo de botón.</div>
        </div>
      </div>
    </div>
  )
}

const CSS = `
  .wa-cols{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:28px;align-items:start;}
  .wa-form{display:flex;flex-direction:column;gap:16px;min-width:0;}
  .wa-intro{font-size:12.5px;color:var(--s-tinta-2);line-height:1.5;margin:0;}
  .wa-field{display:flex;flex-direction:column;gap:6px;}
  .wa-label{font-size:12px;font-weight:600;color:var(--s-tinta);display:flex;align-items:center;gap:8px;}
  .wa-count{font-weight:400;color:var(--s-tinta-3);}
  .wa-input,.wa-select{padding:8px 10px;font-size:13px;border:1px solid var(--s-linea);border-radius:8px;background:var(--s-blanco);color:var(--s-tinta);min-width:0;}
  .wa-input{width:100%;}
  .wa-input--short{max-width:200px;}
  .wa-input:focus,.wa-select:focus{outline:2px solid var(--s-brasa);outline-offset:1px;}
  .wa-btn-row{display:grid;grid-template-columns:minmax(120px,170px) minmax(0,1fr) 28px;gap:8px;align-items:center;}
  .wa-x{width:28px;height:28px;border-radius:8px;border:1px solid var(--s-linea);background:var(--s-blanco);color:var(--s-tinta-2);display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;}
  .wa-x:hover{border-color:rgba(34,32,27,.3);color:var(--s-tinta);}
  .wa-add{align-self:flex-start;}
  .wa-help{font-size:11.5px;color:var(--s-tinta-2);line-height:1.45;}
  .wa-actions{display:flex;gap:8px;align-items:center;}
  .wa-preview{background:var(--s-salvia);border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:8px;min-width:0;}
  .wa-pv-head{font-size:12.5px;font-weight:600;color:var(--s-tinta);}
  .wa-pv-sub{font-size:11px;color:var(--s-tinta-3);margin-top:4px;}
  .wa-pv-card{border-radius:12px;padding:12px 14px;display:flex;gap:14px;flex-wrap:wrap;}
  .wa-pv-f{display:flex;flex-direction:column;gap:2px;min-width:0;}
  .wa-pv-f span{font-size:9.5px;letter-spacing:.06em;opacity:.75;}
  .wa-pv-f b{font-size:12.5px;font-weight:600;white-space:nowrap;}
  .wa-pv-hl{outline:1.5px dashed currentColor;outline-offset:4px;border-radius:3px;}
  .wa-pv-back{background:#1F1F21;color:#fff;border-radius:12px;padding:4px 14px;}
  .wa-pv-row{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.1);font-size:12px;}
  .wa-pv-row:last-child{border-bottom:none;}
  .wa-pv-row span{font-size:10.5px;letter-spacing:.05em;opacity:.75;}
  .wa-pv-row a{color:#4DA3FF;}
  .wa-pv-row em{font-style:normal;opacity:.7;}
  @media(max-width:900px){.wa-cols{grid-template-columns:1fr;}}
`
