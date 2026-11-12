'use client'
// Tarjeta del cliente en el escáner web: lo mismo que la pantalla de
// resultado de la app (stampa-scanner/src/app/customer.tsx), con los
// colores de la tarjeta y las acciones de su tipo.
//
// - Doble escaneo: si se le registró algo hace menos de un minuto, pide
//   confirmación antes de volver a sumar.
// - Regla de frecuencia (1.8.0): si el cliente ya sumó lo que permite el
//   local, avisa; "Sumar igual" solo si el dueño lo deja.
// - Después de sumar: pantalla de "Listo" con Deshacer, y vuelve sola a la
//   cámara a los pocos segundos.
import { useEffect, useRef, useState } from 'react'
import { escaner, EscanerError, formatMoney, parseAmount, pointsFor, beep, type ActionResult, type CatalogItem, type CustomerView, type Tier } from '@/lib/escaner'

const DOUBLE_SCAN_WINDOW_S = 60
const DONE_MS = 6000

function readable(bg: string, fg: string) {
  const lum = (hex: string) => {
    const h = hex.replace('#', '')
    if (h.length < 6) return 0.5
    const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05) }
  if (ratio(bg, fg) >= 3) return fg
  return ratio(bg, '#FFFFFF') >= ratio(bg, '#22201B') ? '#FFFFFF' : '#22201B'
}

type Done = { visitId: string | null; title: string; sub: string; celebrate?: 'stamp' | 'tier'; tier?: Tier | null }

export function Cliente({ initial, onClose, onChanged }: { initial: CustomerView; onClose: () => void; onChanged: () => void }) {
  const [view, setView] = useState<CustomerView>(initial)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [unlocked, setUnlocked] = useState<string[]>([])
  const [amount, setAmount] = useState('')
  const [done, setDone] = useState<Done | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const bg = view.card.color || '#1B412F'
  const fg = readable(bg, view.card.textColor || '#FFFFFF')
  const label = readable(bg, view.card.labelColor || fg)
  const first = view.customer.fullName.split(' ')[0]
  const byAmount = view.points?.mode === 'amount'
  const rule = view.points?.rule ?? null
  const purchase = parseAmount(amount)
  const amountPoints = byAmount && rule ? pointsFor(purchase, rule, !!view.doubleToday) : 0
  const limit = view.limit?.reached ? view.limit : null

  function finish(d: Done) {
    setDone(d)
    if (timer.current) clearTimeout(timer.current)
    // El festejo no se cierra solo: el empleado lo lee y avisa al cliente.
    if (!d.celebrate) timer.current = setTimeout(onClose, DONE_MS)
  }

  function guardDoubleScan(what: string) {
    if (!view.lastActionAt) return true
    const ago = Math.round((Date.now() - new Date(view.lastActionAt).getTime()) / 1000)
    if (!(ago >= 0 && ago < DOUBLE_SCAN_WINDOW_S)) return true
    return window.confirm(`¿Otra vez?\n\nA ${first} ya se le registró algo hace ${ago < 5 ? 'unos segundos' : `${ago} segundos`}. ¿Querés ${what} igual?`)
  }

  // Con la regla alcanzada, sumar igual pide confirmación (y queda marcado).
  function guardLimit(): boolean | null {
    if (!limit) return false
    if (!limit.canOverride) return null
    return window.confirm(`${limit.message}\n\n¿Sumar igual? Queda marcado en el historial.`) ? true : null
  }

  async function run(key: string, fn: () => Promise<ActionResult | CustomerView>, after?: (r: ActionResult) => void) {
    setBusy(key); setError(null)
    try {
      const r = (await fn()) as ActionResult
      const { action, events, ...next } = r
      void action; void events
      setView(next)
      onChanged()
      after?.(r)
    } catch (e) {
      beep(false)
      const err = e as EscanerError
      if (err.isUnauthorized) return
      if (err.code === 'limit_reached') {
        setView(v => ({ ...v, limit: { reached: true, message: err.message, canOverride: !!err.data?.canOverride, nextAt: err.data?.nextAt || null, maxPerDay: v.limit?.maxPerDay ?? null, minHoursBetween: v.limit?.minHoursBetween ?? 0 } }))
      } else setError(err.message)
    } finally { setBusy(null) }
  }

  function addStamp() {
    const force = guardLimit(); if (force === null) return
    if (!guardDoubleScan('sumarle otro sello')) return
    run('stamp', () => escaner.addStamp(view.customer.id, force), r => {
      const n = r.action?.amount ?? 1
      const s = r.stamp!
      finish({
        visitId: r.action?.visitId || null,
        title: n > 1 ? `${n} sellos sumados` : 'Sello sumado',
        sub: s.completed ? `¡Completó la tarjeta! Premio: ${s.reward}` : `${s.stamps} de ${s.required} · ${s.remaining === 1 ? 'le falta 1' : `le faltan ${s.remaining}`}${n > 1 ? ' · día doble' : ''}`,
        celebrate: r.events?.completed ? 'stamp' : undefined,
      })
    })
  }
  function deliver() {
    if (!window.confirm(`Confirmar entrega\n\n¿Le entregaste el premio a ${first}? Los sellos vuelven a 0.`)) return
    run('deliver', () => escaner.deliverReward(view.customer.id), () => finish({ visitId: null, title: 'Premio entregado', sub: 'La tarjeta volvió a cero.' }))
  }
  function addPoints() {
    const force = guardLimit(); if (force === null) return
    if (!guardDoubleScan('sumarle puntos otra vez')) return
    run('points', () => escaner.addPoints(view.customer.id, byAmount ? purchase : undefined, force), r => {
      const compra = r.action?.purchase != null && rule ? ` · compra de ${formatMoney(r.action.purchase, rule.currency)}` : ''
      setUnlocked((r.events?.newlyUnlocked || []).map(i => i.name))
      setAmount('')
      const nuevos = r.events?.newlyUnlocked?.length ? ` · ya puede canjear ${r.events.newlyUnlocked.map(i => i.name).join(', ')}` : ''
      finish({ visitId: r.action?.visitId || null, title: `+${r.action?.amount ?? ''} puntos${r.action?.double ? ' (día doble)' : ''}`, sub: `Tiene ${r.points?.balance ?? ''} puntos${compra}${nuevos}` })
    })
  }
  function redeem(item: CatalogItem) {
    if (!window.confirm(`Canjear premio\n\n¿Canjear "${item.name}" por ${item.pointsCost} puntos?`)) return
    run('redeem', () => escaner.redeemPoints(view.customer.id, item.id), r => { setUnlocked([]); finish({ visitId: null, title: 'Premio canjeado', sub: `${item.name} · le quedan ${r.points?.balance ?? 0} puntos` }) })
  }
  function addVisit() {
    const force = guardLimit(); if (force === null) return
    if (!guardDoubleScan('sumarle otra visita')) return
    run('visit', () => escaner.addVisit(view.customer.id, force), r => {
      const tier = r.events?.tierUp || null
      finish({ visitId: r.action?.visitId || null, title: 'Visita sumada', sub: tier ? `¡Subió a ${tier.name}!` : `${r.membership?.totalVisits ?? ''} visitas${r.membership?.visitsToNext ? ` · le faltan ${r.membership.visitsToNext} para ${r.membership.nextTier?.name}` : ''}`, celebrate: tier ? 'tier' : undefined, tier })
    })
  }
  function deliverBirthday() {
    const gift = view.birthdayGift
    if (!gift || !window.confirm(`Regalo de cumpleaños\n\n¿Le entregaste "${gift.gift}" a ${first}?`)) return
    run('birthday', () => escaner.deliverBirthday(view.customer.id))
  }
  async function undo() {
    if (!done?.visitId) return
    if (timer.current) clearTimeout(timer.current)
    const visitId = done.visitId
    setDone(null); setUnlocked([])
    run('undo', () => escaner.undo(visitId))
  }

  if (done) {
    return (
      <div className="esc-done" role="status">
        {done.celebrate ? <div className="esc-done-big" aria-hidden>{done.celebrate === 'stamp' ? '🎉' : '⭐'}</div> : <div className="esc-done-ok" aria-hidden>✓</div>}
        <div className="esc-done-title">{done.celebrate === 'stamp' ? `¡${first} completó la tarjeta!` : done.celebrate === 'tier' ? `¡${first} subió a ${done.tier?.name}!` : done.title}</div>
        <div className="esc-done-sub">{done.celebrate === 'tier' && done.tier?.perk ? `Nuevo beneficio: ${done.tier.perk}` : done.sub}</div>
        <div className="esc-done-sub">Ya se actualizó en su Wallet.</div>
        {!done.celebrate && <div className="esc-progress"><i style={{ animationDuration: `${DONE_MS}ms` }} /></div>}
        <div className="esc-done-actions">
          {done.visitId && <button className="esc-btn esc-btn--line" onClick={undo} disabled={!!busy}>Deshacer</button>}
          <button className="esc-btn" onClick={onClose}>Escanear otra</button>
        </div>
      </div>
    )
  }

  const btn = { background: fg, color: bg }
  return (
    <div className="esc-cli" style={{ background: bg, color: fg }}>
      <div className="esc-cli-top">
        <span className="esc-cli-card" style={{ color: label }}>{view.card.name}</span>
        <button className="esc-cli-close" style={{ borderColor: fg, color: fg }} onClick={onClose}>Escanear otro</button>
      </div>
      <div className="esc-cli-body">
        <div className="esc-cli-name">{view.customer.fullName}</div>
        {view.doubleToday && <div className="esc-cli-pill" style={{ borderColor: fg }}>⚡ Hoy vale doble: cada escaneo suma x2</div>}
        {view.birthdayGift && (
          <div className="esc-cli-bday" style={{ background: fg, color: bg }}>
            <span style={{ fontSize: 26 }}>🎂</span>
            <div style={{ flex: 1 }}><div className="esc-cli-kicker">Regalo de cumpleaños</div><b>{view.birthdayGift.gift}</b></div>
            <button className="esc-btn esc-btn--sm" style={{ background: bg, color: fg }} onClick={deliverBirthday} disabled={!!busy}>Entregar</button>
          </div>
        )}
        {limit && (
          <div className="esc-cli-limit"><b>{limit.canOverride ? 'Ojo: ya sumó lo que permite el local.' : 'Hoy no puede sumar más.'}</b> {limit.message}</div>
        )}

        {view.stamp && (view.stamp.completed ? (
          <div className="esc-cli-prize" style={{ borderColor: fg }}>
            <div className="esc-cli-kicker" style={{ color: label }}>🎁 Tiene un premio</div>
            <div className="esc-cli-prize-name">{view.stamp.reward}</div>
            <div style={{ color: label }}>Completó la tarjeta. Entregale el premio y confirmá.</div>
          </div>
        ) : (
          <>
            <div className="esc-stamps" style={{ gridTemplateColumns: `repeat(${view.stamp.required <= 8 ? 4 : 5}, 1fr)` }}>
              {Array.from({ length: view.stamp.required }).map((_, i) => (
                <span key={i} className={`esc-stamp${i < view.stamp!.stamps ? ' esc-stamp--on' : ''}`} style={i < view.stamp!.stamps ? { background: fg, color: bg } : { borderColor: fg }}>{i < view.stamp!.stamps ? '✓' : ''}</span>
              ))}
            </div>
            <div className="esc-cli-big">{view.stamp.remaining === 1 ? 'Le falta 1 sello' : `Le faltan ${view.stamp.remaining} sellos`}</div>
            <div style={{ color: label }}>Premio: {view.stamp.reward}</div>
          </>
        ))}

        {view.points && (
          <>
            <div className="esc-cli-balance">{view.points.balance.toLocaleString('es-AR')} <span>puntos</span></div>
            {view.points.catalog.length > 0 && (
              <div className="esc-cli-catalog">
                <div className="esc-cli-kicker" style={{ color: label }}>Premios · tocá para canjear</div>
                {view.points.catalog.map(it => (
                  <button key={it.id} className="esc-cli-item" style={{ borderColor: fg, color: fg, opacity: it.affordable ? 1 : 0.45 }} disabled={!it.affordable || !!busy} onClick={() => redeem(it)}>
                    <span>{it.affordable ? '✓ ' : ''}{it.name}{unlocked.includes(it.name) ? ' · ¡nuevo!' : ''}</span><b>{it.pointsCost}</b>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {view.membership && (
          <>
            <div className="esc-cli-big">{view.membership.currentTier?.name || 'Sin nivel'}</div>
            {view.membership.currentTier?.perk && <div style={{ color: label }}>{view.membership.currentTier.perk}</div>}
            <div style={{ color: label }}>{view.membership.totalVisits} visitas{view.membership.nextTier ? ` · le faltan ${view.membership.visitsToNext} para ${view.membership.nextTier.name}` : ' · nivel más alto'}</div>
          </>
        )}
      </div>

      {error && <div className="esc-cli-error" style={{ background: fg, color: bg }}>{error}</div>}

      <div className="esc-cli-actions">
        {view.stamp && (view.stamp.completed
          ? <button className="esc-btn esc-btn--big" style={btn} onClick={deliver} disabled={!!busy}>{busy === 'deliver' ? 'Guardando…' : 'Confirmar entrega'}</button>
          : <button className="esc-btn esc-btn--big" style={btn} onClick={addStamp} disabled={!!busy || (!!limit && !limit.canOverride)}>
              {busy === 'stamp' ? 'Sumando…' : limit ? (limit.canOverride ? 'Sumar igual' : 'No puede sumar ahora') : view.doubleToday && view.stamp.remaining > 1 ? '+ 2 sellos' : '+ Sello'}
            </button>)}
        {view.points && byAmount && rule && (
          <div className="esc-amount" style={{ borderColor: fg }}>
            <div className="esc-cli-kicker">Monto de la compra</div>
            <div className="esc-amount-value">{amount ? (rule.currency === 'EUR' ? `${amount} €` : `$ ${amount}`) : <span style={{ opacity: 0.5 }}>{rule.currency === 'EUR' ? '0 €' : '$ 0'}</span>}</div>
            <div className="esc-keys">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', rule.currency === 'EUR' ? ',' : '00', '0', '⌫'].map(k => (
                <button key={k} className="esc-key" style={{ borderColor: fg, color: fg }} onClick={() => setAmount(a => k === '⌫' ? a.slice(0, -1) : (a + k).replace(/^0+(?=\d)/, '').slice(0, 10))} aria-label={k === '⌫' ? 'Borrar' : k}>{k}</button>
              ))}
            </div>
            <div className="esc-amount-hint">{rule.perAmount} {rule.perAmount === 1 ? 'punto' : 'puntos'} cada {formatMoney(rule.unit, rule.currency)}{view.doubleToday ? ' · hoy vale doble' : ''}</div>
          </div>
        )}
        {view.points && (
          <button className="esc-btn esc-btn--big" style={btn} onClick={addPoints} disabled={!!busy || (byAmount && amountPoints <= 0) || (!!limit && !limit.canOverride)}>
            {busy === 'points' ? 'Sumando…' : limit && !limit.canOverride ? 'No puede sumar ahora'
              : byAmount ? (amountPoints > 0 ? `${limit ? 'Sumar igual ' : '+ '}${amountPoints} puntos${view.doubleToday ? ' (x2)' : ''}` : 'Escribí el monto')
              : `${limit ? 'Sumar igual ' : '+ '}${view.points.pointsPerVisit * (view.doubleToday ? 2 : 1)} puntos${view.doubleToday ? ' (x2)' : ''}`}
          </button>
        )}
        {view.membership && (
          <button className="esc-btn esc-btn--big" style={btn} onClick={addVisit} disabled={!!busy || (!!limit && !limit.canOverride)}>
            {busy === 'visit' ? 'Sumando…' : limit ? (limit.canOverride ? 'Sumar igual' : 'No puede sumar ahora') : '+ Visita'}
          </button>
        )}
      </div>
    </div>
  )
}
