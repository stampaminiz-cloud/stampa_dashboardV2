'use client'
import React, { useEffect, useState } from 'react'
import { apiUpdateCard } from '@/lib/api'
import { usePlan } from '@/data/plans'
import { Icon } from '@/components/ui/Icon'
import { Switch } from '@/components/ui/Switch'
import { InfoTooltip } from './InfoTooltip'
import { RULES_CSS } from './ProgramRules'

// Configuración → "Cómo suman tus clientes" (1.8.0). Mismo diseño y mismo
// criterio que "Reglas del programa": a la izquierda lo de todo el negocio
// (quién suma, cómo se entrega el premio), a la derecha lo de cada tarjeta
// (cada cuánto puede sumar un cliente) y cada toque se guarda solo.
//
// La regla de frecuencia la aplica el backend (services/frequency.js), así
// que vale igual para la app y para el escáner web. Starter solo puede elegir
// "1 por día"; lo demás es desde Growth (customLimits).

export interface SumarCard { id: string; name: string; type: string; isActive: boolean; pointsMode?: string; maxPerDay?: number | null; minHoursBetween?: number; limitOverride?: boolean }
type Rule = { maxPerDay: number | null; minHoursBetween: number; limitOverride: boolean }

const PER_DAY: (number | null)[] = [1, 2, 3, null]
const HOURS = [0, 1, 3, 6]

// Qué cuenta cada tarjeta como "una suma" (para el texto al lado de la regla).
function unit(c: SumarCard, n: number) {
  if (c.type === 'points') return c.pointsMode === 'amount' ? (n === 1 ? 'compra' : 'compras') : (n === 1 ? 'visita' : 'visitas')
  if (c.type === 'membership') return n === 1 ? 'visita' : 'visitas'
  return n === 1 ? 'sello' : 'sellos'
}
const ruleOf = (c: SumarCard): Rule => ({ maxPerDay: c.maxPerDay ?? null, minHoursBetween: c.minHoursBetween || 0, limitOverride: c.limitOverride !== false })

export function SumarConfig({ businessId, cards, onCardsChanged, onChoosePlan, isManager = false, part = 'all' }: {
  businessId?: string; cards: SumarCard[]; onCardsChanged?: () => void; onChoosePlan?: () => void; isManager?: boolean
  part?: 'all' | 'business' | 'cards'
}) {
  const { can } = usePlan()
  const custom = can('customLimits')
  const [local, setLocal] = useState<Record<string, Rule>>({})
  const [msg, setMsg] = useState<{ key: string; ok: boolean; text: string } | null>(null)
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

  const ordered = [...cards].sort((a, b) => Number(b.isActive) - Number(a.isActive))
  const cardLabel = (c: SumarCard) => <div className="pr-card">{c.name}{!c.isActive && <span className="pr-off">inactiva</span>}</div>

  return (
    <div className={`pr${part === 'all' ? '' : ' pr--bare'}`}>
      <style>{RULES_CSS}{CSS}</style>

      {part !== 'cards' && <>
        <div className="pr-block">
          <div className="pr-title">
            Quién suma
            <InfoTooltip text="Hoy suma un empleado: escanea el QR de la tarjeta con la app o con el escáner web (se vincula desde Equipo). Los modos automáticos, en los que el cliente acerca su tarjeta a una pantalla o caja de Stampa o suma con cada pago, llegan pronto." />
          </div>
          <div className="pr-row">
            <div className="pr-seg" role="radiogroup" aria-label="Quién suma">
              <button type="button" role="radio" aria-checked className="pr-seg-btn is-on">Un empleado escanea</button>
              <button type="button" role="radio" aria-checked={false} disabled className="pr-seg-btn">Automático en el local</button>
              <button type="button" role="radio" aria-checked={false} disabled className="pr-seg-btn">Automático con cada pago</button>
            </div>
          </div>
          <div className="pr-note">El empleado escanea con la app o con el escáner web, desde cualquier celular. Los modos automáticos: próximamente (con pago conectado, desde Pro).</div>
        </div>

        <div className="pr-block">
          <div className="pr-title">Cómo se entrega el premio</div>
          <div className="pr-row">
            <div className="pr-seg" role="radiogroup" aria-label="Cómo se entrega el premio">
              <button type="button" role="radio" aria-checked className="pr-seg-btn is-on">Lo entrega un empleado</button>
              <button type="button" role="radio" aria-checked={false} disabled className="pr-seg-btn">Sin personas</button>
            </div>
          </div>
          <div className="pr-note">Al escanear, el empleado ve "Tiene un premio" y lo entrega. Sin personas, para locales sin empleados: próximamente, desde Pro.</div>
        </div>
      </>}

      {part !== 'business' && <>
        {/* Máximo por día */}
        <div className="pr-block">
          <div className="pr-title">
            Máximo por día
            <InfoTooltip text="Cuántas veces puede sumar un mismo cliente en el día del negocio. Un café a la mañana y otro a la tarde: elegí 2. Vale para la app y para el escáner web." />
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
            <InfoTooltip text="Cuántas horas tienen que pasar desde la última vez que sumó. Evita que alguien sume dos veces seguidas en la misma visita. Se puede combinar con el máximo por día." />
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

        {/* El empleado puede saltear la regla */}
        <div className="pr-block">
          <div className="pr-title">
            Dejar que el empleado la saltee
            <InfoTooltip text="Si está activado, cuando un cliente ya sumó lo que permite la regla el empleado ve el aviso y puede tocar 'Sumar igual'. Queda marcado en el historial. Si no, no puede sumar." />
          </div>
          {ordered.length === 0 ? <div className="pr-note">Todavía no tenés tarjetas.</div> : ordered.map(c => {
            const r = local[c.id] ?? ruleOf(c)
            const hasRule = !!(r.maxPerDay || r.minHoursBetween)
            return (
              <div key={c.id} className="pr-row">
                {cardLabel(c)}
                <span className="pr-sw">
                  <Switch checked={r.limitOverride} disabled={!hasRule} label={`Saltear la regla en ${c.name}: ${r.limitOverride ? 'activado' : 'desactivado'}`} onChange={v => save(c, { limitOverride: v }, `ovr-${c.id}`)} />
                  {hasRule ? (r.limitOverride ? 'Activado' : 'Desactivado') : 'Primero elegí una regla'}
                </span>
                {msgFor(`ovr-${c.id}`)}
              </div>
            )
          })}
        </div>
      </>}
    </div>
  )
}

const CSS = `
  .sc-link{background:none;border:none;padding:0;font:inherit;font-weight:700;color:var(--s-brasa-2);text-decoration:underline;cursor:pointer;}
  .pr-seg-btn:disabled{opacity:.45;cursor:not-allowed;}
`
