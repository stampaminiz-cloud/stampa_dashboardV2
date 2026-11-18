'use client'
import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { apiUpdateCard, apiUpdateBusiness, apiGetBusinesses, apiCreateScreenLink, apiGetScreens, apiRemoveScreen, type ScreenDevice } from '@/lib/api'
import { usePlan } from '@/data/plans'
import { Icon, type IconName } from '@/components/ui/Icon'
import { Switch } from '@/components/ui/Switch'
import { RULES_CSS } from './ProgramRules'

// Configuración → "Cómo suman tus clientes" (1.8.0). Mismo diseño y mismo
// criterio que "Reglas del programa": a la izquierda lo de todo el negocio
// (quién suma, cómo se entrega el premio), a la derecha lo de cada tarjeta
// (cada cuánto puede sumar un cliente) y cada toque se guarda solo.
//
// Quién suma es una opción para elegir (como se ve en el mockup aprobado): un
// empleado escanea, o una pantalla fija en el mostrador (1.10.0, desde Growth).
// Lo que todavía no existe aparece como "Próximamente".
//
// La regla de frecuencia la aplica el backend (services/frequency.js), así
// que vale igual para la app y para el escáner web. Starter solo puede elegir
// "1 por día"; lo demás es desde Growth (customLimits).

export interface SumarCard { id: string; name: string; type: string; isActive: boolean; pointsMode?: string; maxPerDay?: number | null; minHoursBetween?: number }
type Rule = { maxPerDay: number | null; minHoursBetween: number }

const PER_DAY: (number | null)[] = [1, 2, 3, null]
const HOURS = [0, 1, 3, 6]

// Qué cuenta cada tarjeta como "una suma" (para el texto al lado de la regla).
function unit(c: SumarCard, n: number) {
  if (c.type === 'points') return c.pointsMode === 'amount' ? (n === 1 ? 'compra' : 'compras') : (n === 1 ? 'visita' : 'visitas')
  if (c.type === 'membership') return n === 1 ? 'visita' : 'visitas'
  return n === 1 ? 'sello' : 'sellos'
}
const ruleOf = (c: SumarCard): Rule => ({ maxPerDay: c.maxPerDay ?? null, minHoursBetween: c.minHoursBetween || 0 })

export function SumarConfig({ businessId, cards, onCardsChanged, onChoosePlan, isManager = false, part = 'all' }: {
  businessId?: string; cards: SumarCard[]; onCardsChanged?: () => void; onChoosePlan?: () => void; isManager?: boolean
  part?: 'all' | 'business' | 'cards'
}) {
  const { can } = usePlan()
  const custom = can('customLimits')
  const [local, setLocal] = useState<Record<string, Rule>>({})
  const [msg, setMsg] = useState<{ key: string; ok: boolean; text: string } | null>(null)
  const [mode, setMode] = useState<'staff' | 'screen'>('staff')
  const screenAllowed = can('screenMode')
  const amountCards = cards.filter(c => c.isActive && c.type === 'points' && c.pointsMode === 'amount')
  // El modo vive en el negocio; solo lo lee la columna "del negocio".
  useEffect(() => {
    if (!businessId || part === 'cards') return
    apiGetBusinesses().then(list => { const b = list.find(x => x._id === businessId); if (b?.sumarMode) setMode(b.sumarMode) }).catch(() => {})
  }, [businessId, part])
  useEffect(() => { setLocal(Object.fromEntries(cards.map(c => [c.id, ruleOf(c)]))) }, [cards])

  const flash = (key: string, ok: boolean, text: string) => { setMsg({ key, ok, text }); if (ok) setTimeout(() => setMsg(m => m?.key === key ? null : m), 2000) }
  const msgFor = (key: string) => msg?.key === key ? <span className={msg.ok ? 'pr-ok' : 'pr-err'}>{msg.ok ? <><Icon name="listo" size={12} /> Guardado</> : msg.text}</span> : null

  async function save(card: SumarCard, patch: Partial<Rule>, key: string) {
    if (!businessId) return
    const prev = local[card.id] ?? ruleOf(card)
    setLocal(l => ({ ...l, [card.id]: { ...prev, ...patch } }))
    try {
      await apiUpdateCard(businessId, card.id, patch)
      flash(key, true, '')
      onCardsChanged?.()
    } catch (err: any) {
      setLocal(l => ({ ...l, [card.id]: prev }))
      flash(key, false, err?.error || 'No se pudo guardar.')
    }
  }

  async function pickMode(next: 'staff' | 'screen') {
    if (!businessId || next === mode || isManager) return
    if (next === 'screen' && !screenAllowed) { flash('mode', false, 'La pantalla en el mostrador está disponible desde el plan Growth.'); return }
    const prev = mode
    setMode(next)
    try { await apiUpdateBusiness(businessId, { sumarMode: next }); flash('mode', true, '') }
    catch (err: any) { setMode(prev); flash('mode', false, err?.error || 'No se pudo guardar.') }
  }

  const ordered = [...cards].sort((a, b) => Number(b.isActive) - Number(a.isActive))
  const cardLabel = (c: SumarCard) => <div className="pr-card">{c.name}{!c.isActive && <span className="pr-off">inactiva</span>}</div>

  return (
    <div className={`pr${part === 'all' ? '' : ' pr--bare'}`}>
      <style>{RULES_CSS}{CSS}</style>

      {part !== 'cards' && <>
        <div className="pr-block">
          <div className="pr-title">Quién suma</div>
          <div className="sc-opts" role="radiogroup" aria-label="Quién suma">
            <ModeOption icon="escanear" title="Escanear con el equipo" text="Un empleado escanea el pase." on={mode === 'staff'} onPick={() => pickMode('staff')} />
            <ModeOption icon="pantalla" title="Pantalla en el mostrador" text="El cliente apoya su pase en una pantalla fija."
              on={mode === 'screen'} onPick={() => pickMode('screen')} tag={screenAllowed ? undefined : 'Desde Growth'} />
            <ModeOption icon="cobro" title="Con cada cobro" text="La compra suma sola." disabled tag="Próximamente · desde Pro" />
            <ModeOption icon="cajita" title="Cajita Stampa" text="Lector fijo con NFC." disabled tag="Próximamente" />
          </div>
          {msgFor('mode')}
          {!screenAllowed && !isManager && onChoosePlan && <div className="pr-note">La pantalla en el mostrador está en Growth. <button type="button" className="sc-link" onClick={onChoosePlan}>Ver planes</button></div>}
          {mode === 'screen' && amountCards.length > 0 && (
            <div className="sc-warn" role="status">
              <Icon name="atencion" size={16} />
              <span>Las tarjetas por monto las suma un empleado.</span>
            </div>
          )}
        </div>

        {screenAllowed && <Screens businessId={businessId} isManager={isManager} active={mode === 'screen'} />}
      </>}

      {part !== 'business' && <>
        {/* Máximo por día */}
        <div className="pr-block">
          <div className="pr-title">
            Máximo por día
            
          </div>
          {ordered.length === 0 ? <div className="pr-note">Todavía no tenés tarjetas.</div> : ordered.map(c => {
            const r = local[c.id] ?? ruleOf(c)
            return (
              <div key={c.id} className="pr-row">
                {cardLabel(c)}
                <div className="pr-seg" role="radiogroup" aria-label={`Máximo por día de ${c.name}`}>
                  {PER_DAY.map(n => {
                    const locked = !custom && n !== null && n > 1
                    const on = r.maxPerDay === n
                    return (
                      <button key={String(n)} type="button" role="radio" aria-checked={on} disabled={locked} title={locked ? 'Desde el plan Growth' : undefined}
                        className={`pr-seg-btn${on ? ' is-on' : ''}`} onClick={() => !on && save(c, { maxPerDay: n }, `max-${c.id}`)}>{n === null ? 'Sin límite' : n}</button>
                    )
                  })}
                </div>
                {r.maxPerDay && <span className="pr-x2">{r.maxPerDay} {unit(c, r.maxPerDay)} por día</span>}
                {msgFor(`max-${c.id}`)}
              </div>
            )
          })}
          {!custom && (
            <div className="pr-note">Más de una por día y horas entre visitas están en Growth.{onChoosePlan && !isManager && <> <button type="button" className="sc-link" onClick={onChoosePlan}>Ver planes</button></>}</div>
          )}
        </div>

        {/* Tiempo mínimo entre una y otra */}
        <div className="pr-block">
          <div className="pr-title">
            Tiempo mínimo entre una y otra
            
          </div>
          {ordered.length === 0 ? <div className="pr-note">Todavía no tenés tarjetas.</div> : ordered.map(c => {
            const r = local[c.id] ?? ruleOf(c)
            return (
              <div key={c.id} className="pr-row">
                {cardLabel(c)}
                <div className="pr-seg" role="radiogroup" aria-label={`Tiempo mínimo de ${c.name}`}>
                  {HOURS.map(h => {
                    const locked = !custom && h > 0
                    const on = r.minHoursBetween === h
                    return (
                      <button key={h} type="button" role="radio" aria-checked={on} disabled={locked} title={locked ? 'Desde el plan Growth' : undefined}
                        className={`pr-seg-btn${on ? ' is-on' : ''}`} onClick={() => !on && save(c, { minHoursBetween: h }, `hrs-${c.id}`)}>{h === 0 ? 'Sin mínimo' : `${h} h`}</button>
                    )
                  })}
                </div>
                {msgFor(`hrs-${c.id}`)}
              </div>
            )
          })}
        </div>

        <div className="pr-block">
          <div className="pr-title">Cómo se entrega el premio</div>
          <div className="pr-row">
            <div className="pr-seg" role="radiogroup" aria-label="Cómo se entrega el premio">
              <button type="button" role="radio" aria-checked className="pr-seg-btn is-on">Lo entrega un empleado</button>
              <button type="button" role="radio" aria-checked={false} disabled className="pr-seg-btn">Sin personas</button>
            </div>
          </div>
        </div>
      </>}
    </div>
  )
}

function ModeOption({ icon, title, text, on = false, disabled = false, tag, onPick }: { icon: IconName; title: string; text: string; on?: boolean; disabled?: boolean; tag?: string; onPick?: () => void }) {
  return (
    <button type="button" role="radio" aria-checked={on} disabled={disabled} className={`sc-opt${on ? ' is-on' : ''}`} onClick={onPick}>
      <span className="sc-radio" aria-hidden />
      <Icon name={icon} size={20} />
      <span className="sc-opt-text"><b>{title}</b><span>{text}</span></span>
      {tag && <span className="sc-tag">{tag}</span>}
    </button>
  )
}

const ago = (iso: string | null) => {
  if (!iso) return 'todavía no se usó'
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (min < 2) return 'conectada ahora'
  if (min < 60) return `vista hace ${min} min`
  const h = Math.round(min / 60)
  return h < 24 ? `vista hace ${h} h` : `sin conexión hace ${Math.round(h / 24)} d`
}

// Pantallas del local: se vinculan con un link de un solo uso (24 h) que se
// abre en la tablet o en el celular que va a quedar en el mostrador.
function Screens({ businessId, isManager, active }: { businessId?: string; isManager: boolean; active: boolean }) {
  const [list, setList] = useState<ScreenDevice[] | null>(null)
  const [name, setName] = useState('')
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [link, setLink] = useState<{ url: string; qr: string; name: string; hours: number } | null>(null)

  useEffect(() => { if (businessId) apiGetScreens(businessId).then(r => setList(r.screens)).catch(() => setList([])) }, [businessId])

  async function create() {
    if (!businessId) return
    setBusy('new'); setMsg(null)
    try {
      const r = await apiCreateScreenLink(businessId, name.trim())
      setLink({ url: r.url, qr: await QRCode.toDataURL(r.url, { width: 440, margin: 1, color: { dark: '#2B2620', light: '#FFFFFF' } }), name: r.name || 'Pantalla', hours: r.hours })
      setName(''); setAdding(false)
    } catch (err: any) { setMsg({ ok: false, text: err?.error || 'No pudimos crear el link. Probá de nuevo.' }) }
    finally { setBusy(null) }
  }

  async function refresh() { if (businessId) apiGetScreens(businessId).then(r => setList(r.screens)).catch(() => {}) }

  async function remove(d: ScreenDevice) {
    if (!businessId || !window.confirm(`¿Quitar la pantalla ${d.name}? Deja de sumar al instante.`)) return
    setBusy(d.id)
    try { await apiRemoveScreen(businessId, d.id); setList(l => (l || []).filter(x => x.id !== d.id)) }
    catch (err: any) { setMsg({ ok: false, text: err?.error || 'No pudimos quitar la pantalla.' }) }
    finally { setBusy(null) }
  }

  async function copy() {
    if (!link) return
    try { await navigator.clipboard.writeText(link.url); setMsg({ ok: true, text: 'Link copiado.' }) } catch { setMsg({ ok: false, text: 'No pudimos copiar el link.' }) }
  }

  return (
    <div className="pr-block">
      <div className="pr-title">Pantallas del local</div>
      {!active && <div className="pr-note">Suman cuando elijas &quot;Pantalla en el mostrador&quot;.</div>}

      {list && list.length > 0 && (
        <div className="sc-screens">
          {list.map(d => (
            <div key={d.id} className="sc-screen">
              <div className="sc-screen-main"><b>{d.name}</b><span>{d.location}{d.device ? ` · ${d.device}` : ''} · {ago(d.lastSeenAt)}</span></div>
              {!isManager && <button type="button" className="sc-link" onClick={() => remove(d)} disabled={busy === d.id}>{busy === d.id ? 'Quitando…' : 'Quitar'}</button>}
            </div>
          ))}
        </div>
      )}
      {list && list.length === 0 && <div className="pr-note">Todavía no vinculaste ninguna pantalla.</div>}

      {!isManager && !adding && !link && (
        <div className="pr-row"><button type="button" className="s-btn s-btn--secondary s-btn--sm" onClick={() => { setAdding(true); setMsg(null) }}>Vincular una pantalla</button></div>
      )}
      {adding && (
        <div className="pr-row">
          <input className="pr-input" placeholder="Nombre (por ejemplo, Mostrador)" maxLength={40} value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && create()} aria-label="Nombre de la pantalla" autoFocus />
          <button type="button" className="s-btn s-btn--primary s-btn--sm" onClick={create} disabled={busy === 'new'}>{busy === 'new' ? 'Creando…' : 'Crear link'}</button>
          <button type="button" className="sc-link" onClick={() => setAdding(false)}>Cancelar</button>
        </div>
      )}
      {msg && <span className={msg.ok ? 'pr-ok' : 'pr-err'}>{msg.text}</span>}

      {link && (
        <div className="sc-link-box">
          <img src={link.qr} width={150} height={150} alt="QR del link de la pantalla" />
          <div className="sc-link-text">
            <b>{link.name}</b>
            <span className="pr-note">Escaneá el código con la tablet o abrí el link ahí. Un solo uso, vence en {link.hours} horas.</span>
            <div className="pr-row">
              <button type="button" className="s-btn s-btn--secondary s-btn--sm" onClick={copy}>Copiar link</button>
              <button type="button" className="s-btn s-btn--primary s-btn--sm" onClick={() => { setLink(null); setMsg(null); refresh() }}>Listo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const CSS = `
  .sc-link{background:none;border:none;padding:0;font-family:inherit;font-size:12px;font-weight:700;color:var(--s-brasa-2);text-decoration:underline;cursor:pointer;}
  .pr-seg-btn:disabled{opacity:.45;cursor:not-allowed;}
  .sc-opts{display:flex;flex-direction:column;gap:8px;}
  .sc-opt{display:flex;flex-wrap:wrap;align-items:flex-start;gap:6px 12px;text-align:left;width:100%;padding:12px 14px;border:1.5px solid var(--s-linea);border-radius:12px;background:var(--s-blanco);color:var(--s-tinta);cursor:pointer;font-family:var(--font-body);}
  .sc-opt:hover:not(:disabled){border-color:var(--s-tinta-3);}
  .sc-opt.is-on{border-color:var(--s-brasa);background:var(--s-brasa-suave);}
  .sc-opt:disabled{opacity:.55;cursor:not-allowed;}
  .sc-radio{flex:none;width:16px;height:16px;margin-top:2px;border-radius:50%;border:1.5px solid var(--s-tinta-3);}
  .sc-opt.is-on .sc-radio{border:5px solid var(--s-brasa);}
  .sc-opt-text{flex:1;display:flex;flex-direction:column;gap:2px;min-width:150px;}
  .sc-opt-text b{font-size:13.5px;font-weight:700;}
  .sc-opt-text span{font-size:12px;color:var(--s-tinta-2);line-height:1.4;}
  .sc-tag{flex:none;margin-left:auto;font-size:11px;font-weight:600;padding:2px 9px;border-radius:999px;background:var(--s-hueco);color:var(--s-tinta-2);white-space:nowrap;}
  .sc-warn{display:flex;gap:8px;align-items:flex-start;padding:10px 12px;border-radius:10px;background:var(--s-aviso-suave);color:var(--s-aviso);font-size:12px;line-height:1.45;}
  .sc-warn svg{flex:none;margin-top:1px;}
  .sc-screens{display:flex;flex-direction:column;}
  .sc-screen{display:flex;align-items:center;gap:10px;padding:9px 0;border-top:1px solid var(--s-linea);font-size:12.5px;}
  .sc-screen-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px;}
  .sc-screen-main span{font-size:11.5px;color:var(--s-tinta-2);}
  .sc-link-box{display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap;padding:14px;border:1.5px solid var(--s-linea);border-radius:12px;background:var(--s-blanco);}
  .sc-link-box img{border-radius:8px;flex:none;background:var(--s-blanco);}
  .sc-link-text{flex:1;min-width:220px;display:flex;flex-direction:column;gap:8px;font-size:12.5px;}
`
