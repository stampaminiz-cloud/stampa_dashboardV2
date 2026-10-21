'use client'
// WhatsApp en la tarjeta (Configuración, todos los planes). El negocio carga
// su número, elige hasta 2 botones de los sugeridos para su rubro (con el
// texto editable) y la línea del frente. Backend: services/whatsapp.js;
// decisiones y textos: docs/whatsapp-y-pedidos.md del backend.
import React, { useEffect, useState } from 'react'
import { BASE_URL } from '@/lib/api'
import { Icon } from '@/components/ui/Icon'

type Kind = { kind: string; label: string }
type Suggestions = {
  voice: 'vos' | 'tu'
  suggested: Kind[]
  all: Kind[]
  front: { title: string; text: string; readyText: string }
  tap: string
  limits: { label: number; title: number; text: number }
  maxButtons: number
}
type Saved = { number?: string; buttons?: Kind[]; frontTitle?: string; frontText?: string; frontReadyText?: string } | null

const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('stampa_token') })
const pretty = (n: string) => (n ? `+${n}` : '')

export function WhatsappSettings({ businessId, isManager, onSaved, color = '#1B412F', textColor = '#FFFFFF' }: { businessId?: string; isManager: boolean; onSaved?: () => void; color?: string; textColor?: string }) {
  const [sug, setSug] = useState<Suggestions | null>(null)
  const [saved, setSaved] = useState<Saved>(null)
  const [number, setNumber] = useState('')
  const [buttons, setButtons] = useState<Kind[]>([])
  const [front, setFront] = useState({ title: '', text: '', readyText: '' })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [loadError, setLoadError] = useState(false)

  function fill(w: Saved, s: Suggestions) {
    setSaved(w)
    setNumber(pretty(w?.number || ''))
    setButtons(w?.number ? (w.buttons || []) : s.suggested.slice(0, s.maxButtons))
    setFront({ title: w?.frontTitle || s.front.title, text: w?.frontText || s.front.text, readyText: w?.frontReadyText || s.front.readyText })
  }

  useEffect(() => {
    if (!businessId) return
    fetch(`${BASE_URL}/api/businesses/${businessId}/whatsapp`, { headers: authHeaders() })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(d => { setSug(d.suggestions); fill(d.whatsapp, d.suggestions) })
      .catch(() => setLoadError(true))
  }, [businessId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loadError) return <div className="wa-note">No pudimos cargar WhatsApp. Recargá la página.</div>
  if (!sug) return <div className="wa-note">Cargando…</div>

  const has = !!saved?.number
  const chosen = (k: string) => buttons.some(b => b.kind === k)
  function toggle(k: Kind) {
    setMsg(null)
    if (chosen(k.kind)) setButtons(buttons.filter(b => b.kind !== k.kind))
    else if (buttons.length < sug!.maxButtons) setButtons([...buttons, k])
  }

  async function save(remove = false) {
    if (!businessId || busy) return
    setBusy(true); setMsg(null)
    try {
      const body = remove ? { whatsapp: { number: '' } } : { whatsapp: { number, buttons, frontTitle: front.title, frontText: front.text, frontReadyText: front.readyText } }
      const r = await fetch(`${BASE_URL}/api/businesses/${businessId}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(body) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw d
      fill(d.whatsapp, sug!)
      setMsg({ ok: true, text: remove ? 'WhatsApp quitado de las tarjetas.' : 'Guardado. Las tarjetas se actualizan solas.' })
      onSaved?.()
    } catch (err: any) {
      setMsg({ ok: false, text: err?.error || 'No se pudo guardar.' })
    } finally {
      setBusy(false)
    }
  }

  const others = sug.all.filter(k => !sug.suggested.some(s => s.kind === k.kind))
  const disabled = isManager

  return (
    <div className="wa">
      <style>{CSS}</style>
      <p className="wa-intro">Con tu número cargado, la tarjeta de tus clientes trae botones que abren el chat con vos, con el mensaje ya escrito. No tiene costo.</p>

      <label className="wa-label" htmlFor="wa-number">Número</label>
      <input id="wa-number" className="wa-input" inputMode="tel" placeholder="+54 9 11 5555-0000" value={number} disabled={disabled}
        onChange={e => { setNumber(e.target.value); setMsg(null) }} />
      <div className="wa-help">Con código de país, como lo marcarías desde el exterior.</div>

      <div className="wa-label">Botones <span className="wa-count">{buttons.length} de {sug.maxButtons}</span></div>
      <div className="wa-chips">
        {sug.suggested.map(k => (
          <button key={k.kind} type="button" className="s-chip" aria-pressed={chosen(k.kind)} disabled={disabled || (!chosen(k.kind) && buttons.length >= sug.maxButtons)} onClick={() => toggle(k)}>{k.label}</button>
        ))}
        <select className="wa-more" value="" disabled={disabled || buttons.length >= sug.maxButtons} aria-label="Otro botón"
          onChange={e => { const k = others.find(o => o.kind === e.target.value); if (k) toggle(k) }}>
          <option value="">Otro…</option>
          {others.filter(k => !chosen(k.kind)).map(k => <option key={k.kind} value={k.kind}>{k.label}</option>)}
        </select>
      </div>
      {buttons.length > 0 && (
        <div className="wa-btns">
          {buttons.map((b, i) => (
            <div key={b.kind} className="wa-btn-row">
              <Icon name="whatsapp" size={16} className="wa-ic" />
              <input className="wa-input" value={b.label} maxLength={sug.limits.label} disabled={disabled} aria-label={`Texto del botón ${i + 1}`}
                onChange={e => setButtons(buttons.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
              <button type="button" className="s-btn s-btn--text s-btn--sm" disabled={disabled} onClick={() => toggle(b)}>Quitar</button>
            </div>
          ))}
        </div>
      )}
      {buttons.length === 0 && <div className="wa-help">Sin botones elegidos, la tarjeta muestra uno solo: {sug.voice === 'vos' ? '"Escribinos por WhatsApp"' : '"Escríbenos por WhatsApp"'}.</div>}

      <div className="wa-label">Línea en el frente de la tarjeta (iPhone)</div>
      <div className="wa-front">
        <div className="wa-front-fields">
          <label className="wa-mini" htmlFor="wa-ft">Título</label>
          <input id="wa-ft" className="wa-input" value={front.title} maxLength={sug.limits.title} disabled={disabled} onChange={e => setFront({ ...front, title: e.target.value.toUpperCase() })} />
          <label className="wa-mini" htmlFor="wa-fx">Texto</label>
          <input id="wa-fx" className="wa-input" value={front.text} maxLength={sug.limits.text} disabled={disabled} onChange={e => setFront({ ...front, text: e.target.value })} />
          <label className="wa-mini" htmlFor="wa-fr">Con el premio listo</label>
          <input id="wa-fr" className="wa-input" value={front.readyText} maxLength={sug.limits.text} disabled={disabled} onChange={e => setFront({ ...front, readyText: e.target.value })} />
        </div>
        <div className="wa-preview" style={{ background: color, color: textColor }} aria-label="Vista previa de la línea">
          <div className="wa-pv-k">{front.title || '—'}</div>
          <div className="wa-pv-v">{front.text} · {sug.tap}</div>
          <div className="wa-pv-k" style={{ marginTop: 10 }}>{front.title || '—'}</div>
          <div className="wa-pv-v">{front.readyText} · {sug.tap}</div>
          <div className="wa-pv-s">Arriba, lo normal. Abajo, con el premio listo. "{sug.tap}" va siempre: dice dónde están los botones.</div>
        </div>
      </div>

      {disabled
        ? <div className="wa-help">Solo el dueño puede cambiar el WhatsApp.</div>
        : (
          <div className="wa-actions">
            <button type="button" className="s-btn s-btn--primary s-btn--sm" disabled={busy || !number.trim()} onClick={() => save()}>{busy ? 'Guardando…' : 'Guardar'}</button>
            {has && <button type="button" className="s-btn s-btn--text s-btn--sm" disabled={busy} onClick={() => save(true)}>Quitar WhatsApp</button>}
          </div>
        )}
      {msg && <div className={`s-notice s-notice--${msg.ok ? 'ok' : 'error'}`} style={{ marginTop: 10 }}>{msg.text}</div>}
    </div>
  )
}

const CSS = `
  .wa{display:flex;flex-direction:column;gap:6px;}
  .wa-intro{font-size:12.5px;color:var(--s-tinta-2);line-height:1.5;margin:0 0 6px;max-width:60ch;}
  .wa-label{font-size:12px;font-weight:600;color:var(--s-tinta);margin-top:10px;display:flex;align-items:center;gap:8px;}
  .wa-count{font-weight:400;color:var(--s-tinta-3);}
  .wa-mini{font-size:11px;color:var(--s-tinta-2);}
  .wa-input{padding:7px 10px;font-size:13px;border:1px solid var(--s-linea);border-radius:8px;background:var(--s-blanco);color:var(--s-tinta);width:100%;max-width:320px;}
  .wa-input:focus{outline:2px solid var(--s-brasa);outline-offset:1px;}
  .wa-help,.wa-note{font-size:11.5px;color:var(--s-tinta-2);line-height:1.45;}
  .wa-chips{display:flex;flex-wrap:wrap;gap:6px;align-items:center;}
  .wa-more{font-size:12.5px;padding:5px 8px;border:1.5px solid var(--s-linea);border-radius:999px;background:var(--s-blanco);color:var(--s-tinta);}
  .wa-btns{display:flex;flex-direction:column;gap:6px;margin-top:4px;}
  .wa-btn-row{display:flex;align-items:center;gap:8px;}
  .wa-ic{color:var(--s-listo);flex-shrink:0;}
  .wa-front{display:grid;grid-template-columns:minmax(0,320px) minmax(0,260px);gap:16px;align-items:start;}
  .wa-front-fields{display:flex;flex-direction:column;gap:4px;}
  .wa-preview{border-radius:12px;padding:12px 14px;}
  .wa-pv-k{font-size:9.5px;letter-spacing:.06em;opacity:.75;}
  .wa-pv-v{font-size:12.5px;font-weight:600;}
  .wa-pv-s{font-size:10.5px;opacity:.7;margin-top:10px;line-height:1.4;}
  .wa-actions{display:flex;gap:8px;align-items:center;margin-top:12px;}
  @media(max-width:640px){.wa-front{grid-template-columns:1fr;}}
`
