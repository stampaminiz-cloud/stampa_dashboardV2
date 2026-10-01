'use client'
import React, { useEffect, useState } from 'react'
import { apiUpdateCard, apiUpdateBusiness } from '@/lib/api'
import { InfoTooltip } from './InfoTooltip'

// Reglas del programa (Configuración): vencimiento por inactividad y días
// dobles van por tarjeta (solo sellos y puntos); el cumpleaños es del
// negocio. Lo que corre solo (avisos, vencimientos, regalos) está en el
// backend: services/programRules.js.

export interface RulesCard { id: string; name: string; type: string; isActive: boolean; expiryMonths?: number; doubleDays?: number[] }
export interface BirthdayRule { enabled: boolean; gift: string }

const EXPIRY = [0, 3, 6, 12]
// Lunes primero; el valor es el día de JS (0 = domingo)
const WEEK = [{ d: 1, l: 'L' }, { d: 2, l: 'M' }, { d: 3, l: 'M' }, { d: 4, l: 'J' }, { d: 5, l: 'V' }, { d: 6, l: 'S' }, { d: 0, l: 'D' }]
const DAY_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export function ProgramRules({ businessId, cards, birthday, onCardsChanged, onBusinessChanged, readOnly = false }: {
  businessId?: string; cards: RulesCard[]; birthday: BirthdayRule
  onCardsChanged?: () => void; onBusinessChanged?: () => void; readOnly?: boolean
}) {
  const ruleCards = cards.filter(c => c.type === 'stamp' || c.type === 'points')
  const [local, setLocal] = useState<Record<string, { expiryMonths: number; doubleDays: number[] }>>({})
  const [msg, setMsg] = useState<{ key: string; ok: boolean; text: string } | null>(null)
  useEffect(() => {
    setLocal(Object.fromEntries(ruleCards.map(c => [c.id, { expiryMonths: c.expiryMonths || 0, doubleDays: c.doubleDays || [] }])))
  }, [cards]) // eslint-disable-line react-hooks/exhaustive-deps

  const flash = (key: string, ok: boolean, text: string) => { setMsg({ key, ok, text }); if (ok) setTimeout(() => setMsg(m => m?.key === key ? null : m), 2000) }
  const msgFor = (key: string) => msg?.key === key ? <span className={msg.ok ? 'pr-ok' : 'pr-err'}>{msg.ok ? '✓ Guardado' : msg.text}</span> : null

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
    <div className="pr">
      <style>{CSS}</style>

      {/* Vencimiento */}
      <div className="pr-block">
        <div className="pr-title">
          Vencimiento por inactividad
          <InfoTooltip text="Si un cliente no vuelve en ese tiempo, pierde los sellos o puntos acumulados. Le avisamos por push 7 días antes. Un premio listo para entregar no vence." />
        </div>
        {ruleCards.length === 0 ? <div className="pr-note">Aplica a tarjetas de sellos y de puntos. Las membresías no vencen.</div> : ruleCards.map(c => {
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
              {msgFor(`exp-${c.id}`)}
            </div>
          )
        })}
      </div>

      {/* Días dobles */}
      <div className="pr-block">
        <div className="pr-title">
          Días dobles
          <InfoTooltip text="Esos días cada escaneo vale x2: dos sellos o el doble de puntos. Sirve para llenar los días flojos. Se muestra en el reverso de la tarjeta." />
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

      {/* Cumpleaños */}
      <div className="pr-block">
        <div className="pr-title">
          Cumpleaños
          <InfoTooltip text="Agrega 'Fecha de cumpleaños' al formulario (opcional para el cliente). El día del cumple le llega un push y tiene 7 días para retirar el regalo, que se entrega desde la app de escaneo." />
        </div>
        <div className="pr-row">
          <label className="pr-switch">
            <input type="checkbox" checked={bEnabled} disabled={readOnly} onChange={e => saveBirthday({ enabled: e.target.checked })} />
            <span />
            {bEnabled ? 'Activado' : 'Desactivado'}
          </label>
          <input className="pr-input" value={gift} maxLength={60} disabled={readOnly} placeholder="Regalo (ej: Postre gratis)" onChange={e => setGift(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') saveBirthday({}) }} />
          {gift.trim() !== giftSaved && <button type="button" className="pr-btn" disabled={readOnly} onClick={() => saveBirthday({})}>Guardar</button>}
          {msgFor('bday')}
        </div>
        {bEnabled && <div className="pr-note">Solo reciben el regalo los clientes que cargaron su fecha de cumpleaños al registrarse.</div>}
      </div>

      <div className="pr-foot">Los avisos automáticos de estas reglas no cuentan para tus envíos del mes.</div>
    </div>
  )
}

const CSS = `
  .pr{display:flex;flex-direction:column;gap:18px;margin-top:18px;padding-top:16px;border-top:1px solid rgba(43,38,32,.07);}
  .pr-block{display:flex;flex-direction:column;gap:8px;}
  .pr-title{display:flex;align-items:center;gap:5px;font-size:12.5px;font-weight:700;color:#2B2620;}
  .pr-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
  .pr-card{font-size:12px;color:rgba(43,38,32,.75);min-width:130px;display:flex;align-items:center;gap:6px;}
  .pr-off{font-size:10px;color:rgba(43,38,32,.4);background:rgba(43,38,32,.06);padding:1px 6px;border-radius:999px;}
  .pr-seg{display:inline-flex;background:#FBF6EE;border:1.5px solid rgba(43,38,32,.1);border-radius:999px;padding:3px;gap:2px;}
  .pr-seg-btn{border:none;background:transparent;border-radius:999px;padding:5px 11px;font-size:11.5px;font-weight:600;color:rgba(43,38,32,.55);cursor:pointer;font-family:'Inter',sans-serif;}
  .pr-seg-btn.is-on{background:#fff;color:#C75D3A;box-shadow:0 1px 3px rgba(43,38,32,.12);}
  .pr-days{display:flex;align-items:center;gap:5px;}
  .pr-day{width:30px;height:30px;border-radius:50%;border:1.5px solid rgba(43,38,32,.14);background:#fff;font-size:11.5px;font-weight:700;color:rgba(43,38,32,.55);cursor:pointer;font-family:'Inter',sans-serif;padding:0;}
  .pr-day.is-on{background:#C75D3A;border-color:#C75D3A;color:#fff;}
  .pr-x2{font-size:11px;color:rgba(43,38,32,.45);margin-left:4px;}
  .pr-switch{display:inline-flex;align-items:center;gap:8px;font-size:12px;color:rgba(43,38,32,.7);cursor:pointer;}
  .pr-switch input{display:none;}
  .pr-switch span{width:32px;height:18px;border-radius:999px;background:rgba(43,38,32,.18);position:relative;transition:background .15s;}
  .pr-switch span::after{content:'';position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:#fff;transition:transform .15s;}
  .pr-switch input:checked + span{background:#C75D3A;}
  .pr-switch input:checked + span::after{transform:translateX(14px);}
  .pr-input{flex:1;min-width:180px;max-width:280px;padding:7px 11px;font-size:12px;border:1px solid rgba(43,38,32,.15);border-radius:9px;background:#fff;color:#2B2620;outline:none;font-family:'Inter',sans-serif;}
  .pr-input:focus{border-color:#C75D3A;}
  .pr-btn{background:#C75D3A;border:none;border-radius:8px;padding:7px 13px;font-size:12px;color:#fff;font-weight:700;cursor:pointer;}
  .pr-note{font-size:11px;color:rgba(43,38,32,.5);}
  .pr-foot{font-size:11px;color:rgba(43,38,32,.45);}
  .pr-ok{font-size:11px;color:#2E7D4F;font-weight:600;}
  .pr-err{font-size:11px;color:#B4442A;}
  @media(max-width:600px){.pr-card{min-width:0;width:100%;}}
`
