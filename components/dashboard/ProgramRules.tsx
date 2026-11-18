'use client'
import React, { useEffect, useState } from 'react'
import { apiUpdateCard, apiUpdateBusiness } from '@/lib/api'
import { Icon } from '@/components/ui/Icon'
import { Switch } from '@/components/ui/Switch'

// Reglas del programa (Configuración): vencimiento por inactividad (todas
// las tarjetas; en membresía baja un nivel) y días dobles (sellos y puntos)
// van por tarjeta; el cumpleaños es del negocio. Lo que corre solo (avisos, vencimientos, regalos) está en el
// backend: services/programRules.js.

export interface RulesCard { id: string; name: string; type: string; isActive: boolean; expiryMonths?: number; doubleDays?: number[] }
export interface BirthdayRule { enabled: boolean; gift: string }

const EXPIRY = [0, 3, 6, 12]
// Lunes primero; el valor es el día de JS (0 = domingo)
const WEEK = [{ d: 1, l: 'L' }, { d: 2, l: 'M' }, { d: 3, l: 'M' }, { d: 4, l: 'J' }, { d: 5, l: 'V' }, { d: 6, l: 'S' }, { d: 0, l: 'D' }]
const DAY_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

// part: 'cards' = vencimiento y días dobles (por tarjeta); 'business' =
// cumpleaños (todo el negocio). Configuración las muestra en dos columnas.
export function ProgramRules({ businessId, cards, birthday, onCardsChanged, onBusinessChanged, readOnly = false, part = 'all' }: {
  part?: 'all' | 'cards' | 'business'
  businessId?: string; cards: RulesCard[]; birthday: BirthdayRule
  onCardsChanged?: () => void; onBusinessChanged?: () => void; readOnly?: boolean
}) {
  const ruleCards = cards.filter(c => c.type === 'stamp' || c.type === 'points')
  const [local, setLocal] = useState<Record<string, { expiryMonths: number; doubleDays: number[] }>>({})
  const [msg, setMsg] = useState<{ key: string; ok: boolean; text: string } | null>(null)
  useEffect(() => {
    setLocal(Object.fromEntries(cards.map(c => [c.id, { expiryMonths: c.expiryMonths || 0, doubleDays: c.doubleDays || [] }])))
  }, [cards]) // eslint-disable-line react-hooks/exhaustive-deps

  const flash = (key: string, ok: boolean, text: string) => { setMsg({ key, ok, text }); if (ok) setTimeout(() => setMsg(m => m?.key === key ? null : m), 2000) }
  const msgFor = (key: string) => msg?.key === key ? <span className={msg.ok ? 'pr-ok' : 'pr-err'}>{msg.ok ? <><Icon name="listo" size={12} /> Guardado</> : msg.text}</span> : null

  async function saveCard(card: RulesCard, patch: Partial<{ expiryMonths: number; doubleDays: number[] }>, key: string) {
    if (!businessId) return
    const prev = local[card.id]
    setLocal(l => ({ ...l, [card.id]: { ...l[card.id], ...patch } }))
    try {
      await apiUpdateCard(businessId, card.id, patch)
      flash(key, true, '')
      onCardsChanged?.()
    } catch (err: any) {
      setLocal(l => ({ ...l, [card.id]: prev }))
      flash(key, false, err?.error || 'No se pudo guardar.')
    }
  }

  // Cumpleaños
  const [bEnabled, setBEnabled] = useState(birthday.enabled)
  const [gift, setGift] = useState(birthday.gift)
  const [giftSaved, setGiftSaved] = useState(birthday.gift)
  useEffect(() => { setBEnabled(birthday.enabled); setGift(birthday.gift); setGiftSaved(birthday.gift) }, [birthday.enabled, birthday.gift])
  async function saveBirthday(next: Partial<BirthdayRule>) {
    if (!businessId) return
    const body = { enabled: next.enabled ?? bEnabled, gift: (next.gift ?? gift).trim() }
    if (body.enabled && !body.gift) { flash('bday', false, 'Escribí cuál es el regalo.'); return }
    try {
      await apiUpdateBusiness(businessId, { birthday: body } as any)
      setBEnabled(body.enabled); setGiftSaved(body.gift)
      flash('bday', true, '')
      onBusinessChanged?.()
    } catch (err: any) {
      flash('bday', false, err?.error || 'No se pudo guardar.')
    }
  }

  return (
    <div className={`pr${part === 'all' ? '' : ' pr--bare'}`}>
      <style>{RULES_CSS}</style>

      {part !== 'business' && <>
      {/* Vencimiento */}
      <div className="pr-block">
        <div className="pr-title">
          Vencimiento por inactividad
          
        </div>
        <div className="pr-note">Si no vuelve en ese tiempo, el cliente pierde los sellos o puntos acumulados.</div>
        {cards.length === 0 ? <div className="pr-note">Todavía no tenés tarjetas.</div> : cards.map(c => {
          const v = local[c.id]?.expiryMonths ?? 0
          return (
            <div key={c.id} className="pr-row">
              <div className="pr-card">{c.name}{!c.isActive && <span className="pr-off">inactiva</span>}</div>
              <div className="pr-seg" role="radiogroup" aria-label={`Vencimiento de ${c.name}`}>
                {EXPIRY.map(m => (
                  <button key={m} type="button" role="radio" aria-checked={v === m} disabled={readOnly} className={`pr-seg-btn${v === m ? ' is-on' : ''}`}
                    onClick={() => v !== m && saveCard(c, { expiryMonths: m }, `exp-${c.id}`)}>{m === 0 ? 'Nunca' : `${m} meses`}</button>
                ))}
              </div>
              {v > 0 && <span className="pr-x2">{c.type === 'membership' ? 'baja un nivel' : `pierde los ${c.type === 'stamp' ? 'sellos' : 'puntos'}`}</span>}
              {msgFor(`exp-${c.id}`)}
            </div>
          )
        })}
      </div>

      </>}

      {part !== 'cards' && <>
      {/* Cumpleaños */}
      <div className="pr-block">
        <div className="pr-title">
          Cumpleaños
          
        </div>
        <div className="pr-row">
          <span className="pr-sw">
            <Switch checked={bEnabled} disabled={readOnly} label={`Cumpleaños: ${bEnabled ? 'activado' : 'desactivado'}`} onChange={v => saveBirthday({ enabled: v })} />
            {bEnabled ? 'Activado' : 'Desactivado'}
          </span>
          <input className="pr-input" value={gift} maxLength={60} disabled={readOnly} placeholder="Regalo (ej: Postre gratis)" onChange={e => setGift(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') saveBirthday({}) }} />
          {gift.trim() !== giftSaved && <button type="button" className="s-btn s-btn--primary s-btn--sm" disabled={readOnly} onClick={() => saveBirthday({})}>Guardar</button>}
          {msgFor('bday')}
        </div>
        {bEnabled && <div className="pr-note">Solo reciben el regalo los clientes que cargaron su fecha de cumpleaños al registrarse.</div>}
      </div>

      {/* Días dobles */}
      <div className="pr-block">
        <div className="pr-title">
          Días dobles
          
        </div>
        {ruleCards.length === 0 ? <div className="pr-note">Aplica a tarjetas de sellos y de puntos.</div> : ruleCards.map(c => {
          const days = local[c.id]?.doubleDays ?? []
          const toggle = (d: number) => {
            const next = days.includes(d) ? days.filter(x => x !== d) : [...days, d]
            if (next.length > 6) { flash(`dbl-${c.id}`, false, 'Si todos los días valen doble, mejor subí los sellos o puntos por visita.'); return }
            saveCard(c, { doubleDays: next }, `dbl-${c.id}`)
          }
          return (
            <div key={c.id} className="pr-row">
              <div className="pr-card">{c.name}{!c.isActive && <span className="pr-off">inactiva</span>}</div>
              <div className="pr-days">
                {WEEK.map(({ d, l }) => (
                  <button key={d} type="button" disabled={readOnly} aria-pressed={days.includes(d)} aria-label={DAY_FULL[d]} title={DAY_FULL[d]}
                    className={`pr-day${days.includes(d) ? ' is-on' : ''}`} onClick={() => toggle(d)}>{l}</button>
                ))}
                <span className="pr-x2">{days.length ? 'x2' : 'Sin días dobles'}</span>
              </div>
              {msgFor(`dbl-${c.id}`)}
            </div>
          )
        })}
      </div>
      </>}

    </div>
  )
}

export const RULES_CSS = `
  .pr-sw{display:inline-flex;align-items:center;gap:8px;font-size:12px;color:var(--s-tinta-2);}
  .pr{display:flex;flex-direction:column;gap:18px;margin-top:18px;padding-top:16px;border-top:1px solid rgb(var(--s-tinta-rgb) / .07);}
  .pr--bare{margin-top:0;padding-top:0;border-top:none;}
  .pr-block{display:flex;flex-direction:column;gap:8px;}
  .pr-title{display:flex;align-items:center;gap:5px;font-size:12.5px;font-weight:700;color:var(--s-tinta);}
  .pr-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
  .pr-card{font-size:12px;color:rgb(var(--s-tinta-rgb) / .75);min-width:130px;display:flex;align-items:center;gap:6px;}
  .pr-off{font-size:10px;color:rgb(var(--s-tinta-rgb) / .4);background:rgb(var(--s-tinta-rgb) / .06);padding:1px 6px;border-radius:999px;}
  .pr-seg{display:inline-flex;background:var(--s-salvia);border:1.5px solid rgb(var(--s-tinta-rgb) / .1);border-radius:999px;padding:3px;gap:2px;}
  .pr-seg-btn{border:none;background:transparent;border-radius:999px;padding:5px 11px;font-size:11.5px;font-weight:600;color:rgb(var(--s-tinta-rgb) / .55);cursor:pointer;font-family:var(--font-body);}
  .pr-seg-btn.is-on{background:var(--s-blanco);color:var(--s-brasa);box-shadow:0 1px 3px rgba(34,32,27,.12);}
  .pr-days{display:flex;align-items:center;gap:5px;}
  .pr-day{width:30px;height:30px;border-radius:50%;border:1.5px solid rgb(var(--s-tinta-rgb) / .14);background:var(--s-blanco);font-size:11.5px;font-weight:700;color:rgb(var(--s-tinta-rgb) / .55);cursor:pointer;font-family:var(--font-body);padding:0;}
  .pr-day.is-on{background:var(--s-brasa);border-color:var(--s-brasa);color:#fff;}
  .pr-x2{font-size:11px;color:rgb(var(--s-tinta-rgb) / .45);margin-left:4px;}
  .pr-input{flex:1;min-width:180px;max-width:280px;padding:7px 11px;font-size:12px;border:1px solid rgb(var(--s-tinta-rgb) / .15);border-radius:9px;background:var(--s-blanco);color:var(--s-tinta);outline:none;font-family:var(--font-body);}
  .pr-input:focus{border-color:var(--s-brasa);}
  .pr-note{font-size:11px;color:rgb(var(--s-tinta-rgb) / .5);}
  .pr-foot{font-size:11px;color:rgb(var(--s-tinta-rgb) / .45);}
  .pr-ok{display:inline-flex;align-items:center;gap:3px;font-size:11px;color:var(--s-listo);font-weight:600;}
  .pr-err{font-size:11px;color:var(--s-error);}
  @media(max-width:600px){.pr-card{min-width:0;width:100%;}}
`
