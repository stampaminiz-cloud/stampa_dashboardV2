'use client'
// Tarjeta del cliente en el escáner web: la pantalla de resultado de la app
// (stampa-scanner/src/app/customer.tsx), con los colores de su tarjeta y las
// acciones de su tipo.
//
// - Doble escaneo: si se le registró algo hace menos de un minuto, pide
//   confirmación antes de volver a sumar.
// - Regla de frecuencia (1.8.0): avisa antes de tocar el botón; "Sumar igual"
//   solo si el dueño lo permite (queda marcado en el historial).
// - Después de sumar: pantalla "Listo" con Deshacer que vuelve sola a la
//   cámara. Si completa la tarjeta o sube de nivel, festejo con los colores
//   de la tarjeta (como la app) y el Deshacer queda a mano unos segundos.
import { useEffect, useRef, useState } from 'react'
import { escaner, EscanerError, formatMoney, parseAmount, pointsFor, beep, type ActionResult, type CatalogItem, type CustomerView, type Tier } from '@/lib/escaner'

const DOUBLE_SCAN_WINDOW_S = 60
const DONE_MS = 6000
const UNDO_MS = 8000

function lum(hex?: string) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})/i.exec(hex || '')
  if (!m) return null
  const [r, g, b] = [m[1], m[2], m[3]].map(x => parseInt(x, 16) / 255).map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
// Si el texto casi no contrasta con el fondo, se usa oscuro o blanco (igual que la app).
function readable(bg: string, fg: string) {
  const a = lum(bg), b = lum(fg)
  if (a === null || b === null) return fg
  const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
  return ratio >= 3 ? fg : a > 0.4 ? '#2B2620' : '#FFFFFF'
}

type Done = { visitId: string | null; title: string; sub: string }
type Celebration = { kind: 'stamp' } | { kind: 'tier'; tier: Tier }
type Pal = { bg: string; fg: string; label: string }

export function Cliente({ initial, onClose, onChanged }: { initial: CustomerView; onClose: () => void; onChanged: () => void }) {
  const [view, setView] = useState<CustomerView>(initial)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [unlocked, setUnlocked] = useState<string[]>([])
  const [amount, setAmount] = useState('')
  const [done, setDone] = useState<Done | null>(null)
  const [celebration, setCelebration] = useState<Celebration | null>(null)
  const [undo, setUndo] = useState<{ visitId: string; label: string } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); if (undoTimer.current) clearTimeout(undoTimer.current) }, [])

  const bg = view.card.color || '#1E3329'
  const fg = readable(bg, view.card.textColor || '#FFFFFF')
  const p: Pal = { bg, fg, label: readable(bg, view.card.labelColor || fg) }
  const first = view.customer.fullName.split(' ')[0]
  const byAmount = view.points?.mode === 'amount'
  const rule = view.points?.rule ?? null
  const purchase = parseAmount(amount)
  const amountPoints = byAmount && rule ? pointsFor(purchase, rule, !!view.doubleToday) : 0
  const limit = view.limit?.reached ? view.limit : null

  function showUndo(visitId: string, label: string) {
    if (undoTimer.current) clearTimeout(undoTimer.current)
    setUndo({ visitId, label })
    undoTimer.current = setTimeout(() => setUndo(null), UNDO_MS)
  }
  function finish(d: Done) {
    setDone(d)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(onClose, DONE_MS)
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
      if (r.events?.completed) { setCelebration({ kind: 'stamp' }); if (r.action) showUndo(r.action.visitId, 'Sello sumado'); return }
      finish({ visitId: r.action?.visitId || null, title: n > 1 ? `${n} sellos sumados` : 'Sello sumado', sub: `${s.stamps} de ${s.required} · ${s.remaining === 1 ? 'le falta 1' : `le faltan ${s.remaining}`}${n > 1 ? ' (día doble)' : ''}` })
    })
  }
  function deliver() {
    if (!window.confirm(`Confirmar entrega\n\n¿Le entregaste el premio a ${first}? Los sellos vuelven a 0.`)) return
    run('deliver', () => escaner.deliverReward(view.customer.id), () => { setUndo(null); finish({ visitId: null, title: 'Premio entregado', sub: 'La tarjeta volvió a cero.' }) })
  }
  function addPoints() {
    const force = guardLimit(); if (force === null) return
    if (!guardDoubleScan('sumarle puntos otra vez')) return
    run('points', () => escaner.addPoints(view.customer.id, byAmount ? purchase : undefined, force), r => {
      const compra = r.action?.purchase != null && rule ? ` · compra de ${formatMoney(r.action.purchase, rule.currency)}` : ''
      const nuevos = (r.events?.newlyUnlocked || []).map(i => i.name)
      setUnlocked(nuevos)
      setAmount('')
      finish({ visitId: r.action?.visitId || null, title: `+${r.action?.amount ?? ''} puntos${r.action?.double ? ' (día doble)' : ''}`, sub: `Tiene ${r.points?.balance ?? ''} puntos${compra}${nuevos.length ? ` · ya puede canjear ${nuevos.join(' y ')}` : ''}` })
    })
  }
  function redeem(item: CatalogItem) {
    if (!window.confirm(`Canjear premio\n\n¿Canjear "${item.name}" por ${item.pointsCost} puntos?`)) return
    run('redeem', () => escaner.redeemPoints(view.customer.id, item.id), r => { setUnlocked([]); setUndo(null); finish({ visitId: null, title: 'Premio canjeado', sub: `${item.name} · le quedan ${r.points?.balance ?? 0} puntos` }) })
  }
  function addVisit() {
    const force = guardLimit(); if (force === null) return
    if (!guardDoubleScan('sumarle otra visita')) return
    run('visit', () => escaner.addVisit(view.customer.id, force), r => {
      const tier = r.events?.tierUp || null
      if (tier) { setCelebration({ kind: 'tier', tier }); if (r.action) showUndo(r.action.visitId, 'Visita sumada'); return }
      const m = r.membership
      finish({ visitId: r.action?.visitId || null, title: 'Visita sumada', sub: `${m?.totalVisits ?? ''} visitas${m?.visitsToNext ? ` · ${m.visitsToNext} para ${m.nextTier?.name}` : ''}` })
    })
  }
  function deliverBirthday() {
    const gift = view.birthdayGift
    if (!gift || !window.confirm(`Regalo de cumpleaños\n\n¿Le entregaste "${gift.gift}" a ${first}?`)) return
    run('birthday', () => escaner.deliverBirthday(view.customer.id))
  }
  function doUndo() {
    const id = done?.visitId || undo?.visitId
    if (!id) return
    if (timer.current) clearTimeout(timer.current)
    if (undoTimer.current) clearTimeout(undoTimer.current)
    setDone(null); setUndo(null); setUnlocked([]); setCelebration(null)
    run('undo', () => escaner.undo(id))
  }

  // ── Listo (suma común): vuelve sola a la cámara ─────────────────────────────
  if (done) {
    return (
      <div className="esc-done" role="status">
        <div className="esc-done-kicker">Listo</div>
        <div className="esc-done-title">{done.title}</div>
        <div className="esc-done-sub">{first}: {done.sub}</div>
        <div className="esc-done-sub">Ya se actualizó en su Wallet.</div>
        <div className="esc-progress"><i style={{ animationDuration: `${DONE_MS}ms` }} /></div>
        <div className="esc-done-actions">
          <button className="esc-btn" onClick={onClose}>Escanear otra</button>
          {done.visitId && <button className="esc-btn esc-btn--line" onClick={doUndo} disabled={!!busy}>Deshacer</button>}
        </div>
      </div>
    )
  }

  // ── Festejo (tarjeta completa o nivel nuevo), con los colores de la tarjeta ──
  if (celebration) {
    return (
      <div className="esc-cel" style={{ background: p.bg, color: p.fg }}>
        {celebration.kind === 'stamp' ? (
          <>
            <div className="esc-cel-kicker" style={{ color: p.label }}>¡{first} completó la tarjeta!</div>
            <PrizeFace view={view} p={p} />
            <div className="esc-cel-note" style={{ color: p.label }}>Cuando le entregues el premio, tocá Confirmar entrega.</div>
          </>
        ) : (
          <>
            <div className="esc-cel-kicker" style={{ color: p.label }}>¡{first} subió de nivel!</div>
            <TierBadge tier={celebration.tier} />
            {!!celebration.tier.perk && <div className="esc-cel-perk">{celebration.tier.perk}</div>}
          </>
        )}
        <button className="esc-btn" style={{ background: p.fg, color: p.bg, marginTop: 24 }} onClick={() => setCelebration(null)}>Listo</button>
      </div>
    )
  }

  return (
    <div className="esc-cli" style={{ background: p.bg, color: p.fg }}>
      <div className="esc-cli-top">
        <span className="esc-cli-card" style={{ color: p.label }}>{view.card.name}</span>
        <button className="esc-cli-close" style={{ borderColor: p.fg, color: p.fg }} onClick={onClose}>Escanear otro</button>
      </div>

      <div className="esc-cli-body">
        <div className="esc-cli-name">{view.customer.fullName}</div>
        {view.doubleToday && <div className="esc-cli-double" style={{ borderColor: p.fg }}>Hoy vale doble: cada escaneo suma x2</div>}
        {view.birthdayGift && (
          <div className="esc-cli-bday" style={{ background: p.fg, color: p.bg }}>
            <div style={{ flex: 1 }}><div className="esc-cli-kicker">Regalo de cumpleaños</div><div className="esc-cli-gift">{view.birthdayGift.gift}</div></div>
            <button className="esc-btn esc-btn--sm" style={{ background: p.bg, color: p.fg }} onClick={deliverBirthday} disabled={!!busy}>Entregar</button>
          </div>
        )}
        {limit && (
          <div className="esc-cli-limit" style={{ background: p.fg, color: p.bg }}>
            <b>{limit.canOverride ? 'Ya sumó lo que permite el local.' : 'Hoy no puede sumar más.'}</b> {limit.message}
          </div>
        )}

        {view.stamp && (view.stamp.completed ? <PrizeFace view={view} p={p} compact /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="esc-stamps">
              {Array.from({ length: view.stamp.required }).map((_, i) => {
                const earned = i < view.stamp!.stamps
                const src = earned ? view.card.earnedIcon : view.card.emptyIcon
                return (
                  <div key={i} className="esc-stamp" style={{ width: `${100 / (view.stamp!.required <= 8 ? 4 : 5)}%` }}>
                    {src ? <img src={src} alt="" /> : <i style={{ background: p.fg, opacity: earned ? 1 : 0.25 }} />}
                  </div>
                )
              })}
            </div>
            <div className="esc-big">{view.stamp.remaining === 1 ? 'Le falta 1 sello' : `Le faltan ${view.stamp.remaining} sellos`}</div>
            <div className="esc-subline" style={{ color: p.label }}>Premio: {view.stamp.reward}</div>
          </div>
        ))}

        {view.points && <PointsBody view={view} p={p} unlocked={unlocked} onRedeem={busy ? undefined : redeem} />}
        {view.membership && <MembershipBody view={view} p={p} />}
      </div>

      {error && <div className="esc-cli-error" style={{ background: p.fg, color: p.bg }}>{error}</div>}

      <div className="esc-cli-actions" style={{ ['--btn-bg' as string]: p.fg, ['--btn-fg' as string]: p.bg } as React.CSSProperties}>
        {view.stamp && (view.stamp.completed
          ? <button className="esc-btn" onClick={deliver} disabled={!!busy}>{busy === 'deliver' ? 'Guardando...' : 'Confirmar entrega'}</button>
          : <button className="esc-btn" onClick={addStamp} disabled={!!busy || (!!limit && !limit.canOverride)}>
              {busy === 'stamp' ? 'Sumando...' : limit ? (limit.canOverride ? 'Sumar igual' : 'No puede sumar ahora') : view.doubleToday && view.stamp.remaining > 1 ? '+ 2 sellos' : '+ Sello'}
            </button>)}
        {view.points && byAmount && rule && (
          <div className="esc-amount" style={{ borderColor: p.fg }}>
            <label htmlFor="esc-amount">Monto de la compra</label>
            <div className="esc-amount-row">
              {rule.currency === 'ARS' && <span>$</span>}
              <input id="esc-amount" value={amount} onChange={e => setAmount(e.target.value.replace(/[^\d.,]/g, ''))} inputMode="decimal" placeholder="0" autoComplete="off" />
              {rule.currency === 'EUR' && <span>€</span>}
            </div>
            <small>{rule.perAmount} {rule.perAmount === 1 ? 'punto' : 'puntos'} cada {formatMoney(rule.unit, rule.currency)}{view.doubleToday ? ' · hoy vale doble' : ''}</small>
          </div>
        )}
        {view.points && (
          <button className="esc-btn" onClick={addPoints} disabled={!!busy || (byAmount && amountPoints <= 0) || (!!limit && !limit.canOverride)}>
            {busy === 'points' ? 'Sumando...' : limit && !limit.canOverride ? 'No puede sumar ahora'
              : byAmount ? (amountPoints > 0 ? `${limit ? 'Sumar igual ' : '+ '}${amountPoints} puntos${view.doubleToday ? ' (x2)' : ''}` : 'Escribí el monto')
              : `${limit ? 'Sumar igual ' : '+ '}${view.points.pointsPerVisit * (view.doubleToday ? 2 : 1)} puntos${view.doubleToday ? ' (x2)' : ''}`}
          </button>
        )}
        {view.membership && (
          <button className="esc-btn" onClick={addVisit} disabled={!!busy || (!!limit && !limit.canOverride)}>
            {busy === 'visit' ? 'Sumando...' : limit ? (limit.canOverride ? 'Sumar igual' : 'No puede sumar ahora') : '+ Visita'}
          </button>
        )}
      </div>

      {undo && (
        <div className="esc-toast"><div><span>{undo.label}</span><button onClick={doUndo} disabled={!!busy}>Deshacer</button></div></div>
      )}
    </div>
  )
}

// ── Piezas, una por tipo de tarjeta (mismas que components/results.tsx de la app) ──

function PrizeFace({ view, p, compact }: { view: CustomerView; p: Pal; compact?: boolean }) {
  const s = view.stamp!
  return (
    <div className="esc-prize" style={compact ? { padding: '8px 0' } : undefined}>
      {s.flipImageUrl && <img src={s.flipImageUrl} alt="" style={compact ? { width: 110, height: 110 } : undefined} />}
      <div className="esc-prize-title" style={{ color: p.fg }}>{s.flipMessage || '¡Felicitaciones!'}</div>
      <div className="esc-prize-pill" style={{ borderColor: p.fg, color: p.fg }}>{s.reward}</div>
      {!!s.flipSubMessage && <div className="esc-subline" style={{ color: p.label }}>{s.flipSubMessage}</div>}
    </div>
  )
}

function PointsBody({ view, p, unlocked, onRedeem }: { view: CustomerView; p: Pal; unlocked: string[]; onRedeem?: (item: CatalogItem) => void }) {
  const pts = view.points!
  const items = [...pts.catalog].sort((a, b) => a.pointsCost - b.pointsCost)
  const max = items.length ? items[items.length - 1].pointsCost : 0
  const next = items.find(i => !i.affordable)
  const ready = items.filter(i => i.affordable).length
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="esc-balance">
        {view.card.pointsIcon && <img src={view.card.pointsIcon} alt="" />}
        <b style={{ color: p.fg }}>{pts.balance}</b>
        <span style={{ color: p.label }}>puntos</span>
      </div>
      {max > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="esc-bar">
            <div className="esc-bar-track" style={{ background: p.fg }} />
            <div className="esc-bar-fill" style={{ background: p.fg, width: `${Math.min(100, (pts.balance / max) * 100)}%` }} />
            {items.map(i => <div key={i.id} className="esc-bar-mark" style={{ left: `${(i.pointsCost / max) * 100}%`, background: i.affordable ? p.fg : p.bg, borderColor: p.fg }} />)}
          </div>
          <div className="esc-subline" style={{ color: p.label }}>
            {next ? `${ready ? `${ready} para canjear · ` : ''}Le ${next.pointsCost - pts.balance === 1 ? 'falta 1 punto' : `faltan ${next.pointsCost - pts.balance} puntos`} para ${next.name}` : '¡Puede canjear cualquier premio!'}
          </div>
        </div>
      )}
      {unlocked.length > 0 && <div className="esc-unlocked" style={{ background: p.fg, color: p.bg }}>¡Ya puede canjear {unlocked.join(' y ')}!</div>}
      <div className="esc-catalog">
        {items.length === 0 && <div className="esc-subline" style={{ color: p.label }}>Esta tarjeta todavía no tiene premios cargados.</div>}
        {items.length > 0 && <div className="esc-section-label" style={{ color: p.label }}>{ready ? 'Tocá el premio que se lleva' : 'Premios'}</div>}
        {items.map(item => item.affordable ? (
          <button key={item.id} className="esc-cat ready" style={{ background: p.fg, borderColor: p.fg, color: p.bg }} onClick={() => onRedeem?.(item)} disabled={!onRedeem} aria-label={`Canjear ${item.name} por ${item.pointsCost} puntos`}>
            <span className="esc-cat-name">{item.name}</span>
            <span className="esc-cat-cost">{item.pointsCost} pts</span>
            <span className="esc-cat-pill" style={{ background: p.bg, color: p.fg }}>Canjear</span>
          </button>
        ) : (
          <div key={item.id} className="esc-cat" style={{ borderColor: p.fg, color: p.fg, opacity: 0.55 }}>
            <span className="esc-cat-name">{item.name}</span>
            <span className="esc-cat-cost">faltan {item.pointsCost - pts.balance}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TierBadge({ tier }: { tier: Tier }) {
  // tier.bg suele ser translúcido (como en el pase): va sobre blanco.
  return (
    <span className="esc-badge"><div style={{ background: tier.bg, color: tier.color }}>{tier.icon && <img src={tier.icon} alt="" />}{tier.name}</div></span>
  )
}

function MembershipBody({ view, p }: { view: CustomerView; p: Pal }) {
  const m = view.membership!
  if (!m.tiers.length || !m.currentTier) return <div className="esc-subline" style={{ color: p.label }}>Esta tarjeta todavía no tiene niveles cargados. Visitas: {m.totalVisits}</div>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div><TierBadge tier={m.currentTier} /></div>
      {!!m.currentTier.perk && <div className="esc-subline" style={{ color: p.label }}>Beneficio: {m.currentTier.perk}</div>}
      <div className="esc-ladder">
        {m.tiers.map((t, i) => {
          const reached = i <= m.currentTierIndex
          return (
            <div key={t.id}>
              {i > 0 && <span className="esc-ladder-line" style={{ background: p.fg, opacity: reached ? 1 : 0.3 }} />}
              <span className="esc-ladder-dot" style={{ borderColor: p.fg, background: reached ? p.fg : 'transparent', opacity: reached ? 1 : 0.5 }} />
              <span className="esc-ladder-name" style={{ color: p.fg, fontWeight: i === m.currentTierIndex ? 800 : 500, opacity: reached ? 1 : 0.6 }}>{t.name}</span>
            </div>
          )
        })}
      </div>
      <div className="esc-big">
        {m.nextTier ? (m.visitsToNext === 0 ? `¡Alcanzó ${m.nextTier.name}!` : `${m.visitsToNext} visita${m.visitsToNext === 1 ? '' : 's'} para ${m.nextTier.name}`) : 'Está en el nivel más alto'}
      </div>
      <div className="esc-subline" style={{ color: p.label }}>{m.totalVisits} visita{m.totalVisits === 1 ? '' : 's'} en total</div>
    </div>
  )
}
