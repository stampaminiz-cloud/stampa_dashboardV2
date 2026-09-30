'use client'
import React, { useState, useEffect } from 'react'
import { useLang } from '@/data/i18n'
import { PLAN_LIMITS, type Plan } from '@/data/plans'
import { BASE_URL, apiResyncPass, apiGetPointsCatalog, apiRedeemPoints } from '@/lib/api'
import { InfoTooltip } from './InfoTooltip'

interface CardEntry {
  customerId: string; cardId: string | null
  cardType: 'stamp' | 'points' | 'membership'; cardName: string | null
  cardStampsRequired: number | null; stamps: number; pointsBalance: number
  membershipTier: string | null; lastUpdate: number
  premio: string | null
  formResponses: Array<{ label: string; value: string }>
}

interface Customer {
  id: string // email — agrupa todas las tarjetas de la misma persona en este negocio
  name: string; email: string
  status: 'active' | 'inactive'
  near: boolean; ready: boolean
  joined: string; lastUpdate: number; lastActivity: string
  cards: CardEntry[]
}

type StatusFilter = 'all' | 'active' | 'inactive' | 'near' | 'ready'
type SortKey = 'name' | 'progress' | 'status' | 'lastActivity' | 'card'
type SortDir = 'asc' | 'desc'

interface CustomersTabProps {
  customers: Customer[]
  // Tarjetas activas del negocio — para el filtro por tarjeta cuando hay más de una.
  cards?: Array<{ id: string; name: string; type: string }>
  cardFilter?: string
  onCardFilterChange?: (cardId: string) => void
  // El backend filtra, ordena, pagina y cuenta; esto solo dispara callbacks.
  page: number
  totalPages: number
  total: number
  counts: { all: number; active: number; inactive: number; near: number; ready: number } | null
  inactiveDays: number
  search: string
  statusFilter: StatusFilter
  sortKey: SortKey
  sortDir: SortDir
  loading?: boolean
  isManager?: boolean
  plan: Plan
  businessTotal: number | null
  onChoosePlan: () => void
  onSearchChange: (q: string) => void
  onStatusFilterChange: (s: StatusFilter) => void
  onSortChange: (key: SortKey, dir: SortDir) => void
  onPageChange: (page: number) => void
  onRefresh: () => void
  autoOpenEmail?: string | null
  onAutoOpened?: () => void
}

function initials(name: string) {
  return name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = ['#C75D3A','#185FA5','#5B8C5A','#533FB7','#854F0B','#9C7530']
function avatarColor(name: string) {
  const code = name.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0)
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

function CardTypeIcon({ type }: { type: string }) {
  if (type === 'points') return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
  if (type === 'membership') return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></svg>
}

function cardTypeLabel(type: string) {
  return type === 'stamp' ? 'Sellos' : type === 'points' ? 'Puntos' : 'Membresía'
}

const isReady = (card: CardEntry) => card.cardType === 'stamp' && !!card.cardStampsRequired && card.stamps >= card.cardStampsRequired
const isNear = (card: CardEntry) => card.cardType === 'stamp' && !!card.cardStampsRequired && card.stamps < card.cardStampsRequired && card.cardStampsRequired - card.stamps <= 2

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ opacity: active ? 1 : 0.25, marginLeft: 4, verticalAlign: 'middle' }}>
      {active && dir === 'asc' ? <path d="M12 19V5M5 12l7-7 7 7" /> : <path d="M12 5v14M5 12l7 7 7-7" />}
    </svg>
  )
}

function CardSection({ customer, card, canDelete, onDelete, onChanged }: {
  customer: Customer; card: CardEntry; canDelete: boolean
  onDelete: (customerId: string) => Promise<boolean>
  onChanged: () => void
}) {
  const t = useLang()
  const [confirmDel, setConfirmDel] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [resyncing, setResyncing] = useState(false)
  const [resyncMsg, setResyncMsg] = useState<string | null>(null)
  const [showRedeem, setShowRedeem] = useState(false)
  const [catalog, setCatalog] = useState<Array<{ _id: string; name: string; pointsCost: number }>>([])
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [redeeming, setRedeeming] = useState<string | null>(null)
  const [redeemMsg, setRedeemMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [pointsBalance, setPointsBalance] = useState(card.pointsBalance)
  useEffect(() => { setPointsBalance(card.pointsBalance) }, [card.pointsBalance])

  const required = card.cardStampsRequired || 0
  const stamps = card.cardType === 'stamp' && required
    ? Array.from({ length: required }, (_: unknown, i: number) => i < card.stamps)
    : []

  async function handleResync() {
    const businessId = localStorage.getItem('stampa_business_id')
    if (!businessId) return
    setResyncing(true)
    setResyncMsg(null)
    try {
      const res = await apiResyncPass(businessId, card.customerId)
      const { apple, google } = res.results
      const parts: string[] = []
      parts.push(apple ? (apple.sent ? 'iPhone: actualizada ✓' : `iPhone: no se pudo (${apple.error})`) : 'iPhone: no la guardó en Apple Wallet')
      if (google) parts.push(google.sent ? 'Android: actualizada si la guardó en Google Wallet ✓' : 'Android: no la guardó en Google Wallet')
      setResyncMsg(parts.join(' · '))
    } catch (err: any) {
      setResyncMsg(err?.error || 'No se pudo resincronizar. Intentá de nuevo.')
    } finally {
      setResyncing(false)
    }
  }

  async function openRedeemPicker() {
    setShowRedeem(true)
    setRedeemMsg(null)
    const businessId = localStorage.getItem('stampa_business_id')
    if (!businessId || !card.cardId) return
    setCatalogLoading(true)
    try {
      setCatalog(await apiGetPointsCatalog(businessId, card.cardId))
    } catch {
      setCatalog([])
    } finally {
      setCatalogLoading(false)
    }
  }

  async function confirmRedeem(itemId: string) {
    const businessId = localStorage.getItem('stampa_business_id')
    if (!businessId) return
    setRedeeming(itemId)
    setRedeemMsg(null)
    try {
      const res = await apiRedeemPoints(businessId, card.customerId, itemId)
      setPointsBalance(res.pointsBalance)
      setRedeemMsg({ ok: true, text: `Canjeado: ${res.redeemedItem}. Le quedan ${res.pointsBalance} puntos. Su tarjeta en el Wallet ya se actualizó.` })
      setShowRedeem(false)
      onChanged()
    } catch (err: any) {
      setRedeemMsg({ ok: false, text: err?.error || 'No se pudo procesar el canje.' })
    } finally {
      setRedeeming(null)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)
    const ok = await onDelete(card.customerId)
    setDeleting(false)
    if (!ok) setDeleteError('No se pudo eliminar. Probá de nuevo.')
  }

  return (
    <div className="ct-panel-section ct-panel-card-section">
      <div className="ct-panel-card-header">
        <span className="ct-panel-card-type"><CardTypeIcon type={card.cardType} />{card.cardName || cardTypeLabel(card.cardType)}</span>
        {canDelete && (
          <button className="ct-panel-delete-btn" onClick={() => setConfirmDel(true)} title="Eliminar esta tarjeta">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        )}
      </div>
      {confirmDel && (
        <div className="ct-confirm-del">
          <div className="ct-confirm-del-text">¿Eliminar la tarjeta de <strong>{card.cardName || cardTypeLabel(card.cardType)}</strong> de {customer.name}? Pierde su progreso y no se puede deshacer.</div>
          {deleteError && <div className="ct-confirm-del-err">{deleteError}</div>}
          <div className="ct-confirm-del-btns">
            <button className="ct-confirm-cancel" onClick={() => { setConfirmDel(false); setDeleteError(null) }} disabled={deleting}>Cancelar</button>
            <button className="ct-confirm-ok" onClick={handleDelete} disabled={deleting}>{deleting ? 'Eliminando…' : 'Eliminar'}</button>
          </div>
        </div>
      )}

      {card.cardType === 'stamp' ? (
        <>
          <div className="ct-panel-progress-num">{card.stamps}<span className="ct-panel-progress-den"> / {required}</span></div>
          <div className="ct-panel-stamps">
            {stamps.map((filled: boolean, i: number) => <div key={i} className={`ct-panel-stamp${filled ? ' ct-panel-stamp--filled' : ''}`} />)}
          </div>
          <div className="ct-panel-progress-bar"><div className="ct-panel-progress-fill" style={{ width: `${required ? Math.min(100, (card.stamps / required) * 100) : 0}%` }} /></div>
          {isReady(card) ? (
            <div className="ct-ready-note">
              <strong>🎁 Premio listo para entregar</strong>
              <span>{card.premio ? `${card.premio} · ` : ''}Se entrega desde la app de escaneo: al escanear su tarjeta aparece "Entregar premio".</span>
            </div>
          ) : isNear(card) && (
            <div className="ct-near-note">{required - card.stamps} {t('ct_stamps_away')}</div>
          )}
        </>
      ) : card.cardType === 'points' ? (
        <>
          <div className="ct-panel-progress-num">{pointsBalance}<span className="ct-panel-progress-den"> pts</span></div>
          {!showRedeem ? (
            <button className="ct-resync-btn" onClick={openRedeemPicker}>Canjear premio</button>
          ) : (
            <div className="ct-redeem-picker">
              {catalogLoading ? (
                <div className="ct-resync-hint">Cargando catálogo…</div>
              ) : catalog.length === 0 ? (
                <div className="ct-resync-hint">Esta tarjeta todavía no tiene premios. Armalos en Premios.</div>
              ) : (
                catalog.map(item => (
                  <button key={item._id} className="ct-redeem-item" disabled={pointsBalance < item.pointsCost || !!redeeming} onClick={() => confirmRedeem(item._id)}>
                    <span>{item.name}</span>
                    <span className="ct-redeem-cost">{redeeming === item._id ? '…' : `${item.pointsCost} pts`}</span>
                  </button>
                ))
              )}
              <button className="ct-redeem-cancel" onClick={() => setShowRedeem(false)}>Cancelar</button>
            </div>
          )}
          {redeemMsg && <div className={`ct-resync-msg${redeemMsg.ok ? '' : ' ct-resync-msg--err'}`}>{redeemMsg.text}</div>}
        </>
      ) : (
        <div className="ct-panel-progress-num" style={{ fontSize: 22 }}>{card.membershipTier ? `Nivel ${card.membershipTier}` : 'Sin nivel todavía'}</div>
      )}

      <div className="ct-resync-row" style={{ marginTop: 10 }}>
        <button className="ct-resync-btn" onClick={handleResync} disabled={resyncing}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
          {resyncing ? 'Sincronizando…' : 'Re-sincronizar wallet'}
        </button>
        <InfoTooltip text="Vuelve a mandar al celular del cliente lo que ves acá (sellos, puntos o nivel), sin cambiar nada. Útil si su tarjeta en el Wallet quedó desactualizada." />
      </div>
      {resyncMsg && <div className="ct-resync-msg">{resyncMsg}</div>}

      {card.formResponses.length > 0 && (
        <div className="ct-panel-card-responses">
          <div className="ct-panel-section-title">{t('ct_form_responses')}</div>
          {card.formResponses.map((r, i) => (
            <div key={i} className={`ct-panel-field-row${r.value === card.premio && card.premio ? ' ct-panel-field-row--highlight' : ''}`}>
              <span className="ct-panel-field-label">{r.label}</span>
              <span className={`ct-panel-field-val${r.value === card.premio && card.premio ? ' ct-panel-field-val--highlight' : ''}`}>{r.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Historial de movimientos ─────────────────────────────────────────────────
const HISTORY_ICON: Record<string, string> = { stamp: '●', points: '★', visit: '◆', redeem: '🎁', tier_change: '▲' }
function History({ customer }: { customer: Customer }) {
  const [items, setItems] = useState<Array<{ type: string; text: string; at: number; card: string | null; by: string }> | null>(null)
  const [error, setError] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const ids = customer.cards.map(c => c.customerId).join(',')
  useEffect(() => {
    const businessId = localStorage.getItem('stampa_business_id')
    if (!businessId) return
    let cancelled = false
    setItems(null); setError(false); setShowAll(false)
    fetch(`${BASE_URL}/api/businesses/${businessId}/customers/history?ids=${encodeURIComponent(ids)}`, {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('stampa_token') },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { if (!cancelled) setItems(d.items || []) })
      .catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [ids, customer.lastUpdate])

  const fmt = (ms: number) => new Date(ms).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
  const shown = items ? (showAll ? items : items.slice(0, 5)) : []
  return (
    <div className="ct-panel-section">
      <div className="ct-panel-section-title">Historial</div>
      {error ? <div className="ct-resync-hint">No se pudo cargar el historial.</div>
        : !items ? [0, 1, 2].map(i => <div key={i} className="ct-skel" style={{ height: 30, marginBottom: 6 }} />)
        : items.length === 0 ? <div className="ct-resync-hint">Todavía no tiene movimientos. Aparecen cuando escaneás su tarjeta con la app.</div>
        : <>
            {shown.map((it, i) => (
              <div key={i} className="ct-hist-row">
                <span className={`ct-hist-ic ct-hist-ic--${it.type}`}>{HISTORY_ICON[it.type] || '•'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ct-hist-text">{it.text}</div>
                  <div className="ct-hist-meta">{fmt(it.at)} · {it.by}{customer.cards.length > 1 && it.card ? ` · ${it.card}` : ''}</div>
                </div>
              </div>
            ))}
            {items.length > 5 && (
              <button className="ct-redeem-cancel" onClick={() => setShowAll(v => !v)}>{showAll ? 'Ver menos' : `Ver los ${items.length} movimientos`}</button>
            )}
          </>}
    </div>
  )
}

function CustomerPanel({ customer, canDelete, onClose, onDelete, onChanged }: {
  customer: Customer; canDelete: boolean; onClose: () => void
  onDelete: (id: string) => Promise<boolean>; onChanged: () => void
}) {
  const t = useLang()
  const color = avatarColor(customer.name)

  return (
    <>
      <div className="ct-sheet-overlay" onClick={onClose} />
      <div className="ct-panel" role="dialog" aria-label={`Ficha de ${customer.name}`}>
        <div className="ct-sheet-grip" />
        <div className="ct-panel-header">
          <button className="ct-panel-close" onClick={onClose} aria-label="Cerrar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="ct-panel-avatar" style={{ background: color }}>{initials(customer.name)}</div>
        <div className="ct-panel-name">{customer.name}</div>
        <div className="ct-panel-email">{customer.email}</div>
        <div className="ct-panel-badges">
          <span className={`ct-status-badge ct-status-badge--${customer.status}`}>
            {customer.status === 'active' ? t('status_active') : t('status_inactive')}
          </span>
          {customer.cards.map(c => (
            <span key={c.customerId} className={`ct-card-badge ct-card-badge--${c.cardType}`}>{c.cardName || cardTypeLabel(c.cardType)}</span>
          ))}
          {customer.ready ? <span className="ct-ready-badge">🎁 Premio listo</span> : customer.near && <span className="ct-near-badge">{t('ct_near_badge')}</span>}
        </div>

        <div className="ct-panel-section">
          <div className="ct-panel-section-title">{t('ct_activity')}</div>
          <div className="ct-panel-field-row"><span className="ct-panel-field-label">{t('ct_last_visit')}</span><span className="ct-panel-field-val">{customer.lastActivity}</span></div>
          <div className="ct-panel-field-row"><span className="ct-panel-field-label">{t('ct_member_since')}</span><span className="ct-panel-field-val">{customer.joined}</span></div>
        </div>

        {customer.cards.map(card => (
          <CardSection key={card.customerId} customer={customer} card={card} canDelete={canDelete} onDelete={onDelete} onChanged={onChanged} />
        ))}

        <History customer={customer} />
      </div>
    </>
  )
}

// ─── Límite de clientes (Starter) ─────────────────────────────────────────────
function CustomerLimit({ used, max, isManager, onChoosePlan }: { used: number; max: number; isManager: boolean; onChoosePlan: () => void }) {
  const pct = Math.min(100, (used / max) * 100)
  const level = used >= max ? 'full' : pct >= 80 ? 'warn' : 'ok'
  return (
    <div className={`ct-limit ct-limit--${level}`}>
      <div style={{ flex: 1, minWidth: 180 }}>
        <div className="ct-limit-text">
          <strong>{used.toLocaleString('es-AR')} de {max} clientes</strong> en el plan Starter
          {level === 'warn' && <> · te quedan {max - used}</>}
          {level === 'full' && <> · llegaste al límite</>}
        </div>
        <div className="ct-limit-bar"><div style={{ width: `${pct}%` }} /></div>
      </div>
      {level !== 'ok' && (isManager
        ? <span className="ct-limit-hint">Pedile al dueño que mejore el plan.</span>
        : <button className="ct-limit-btn" onClick={onChoosePlan}>Clientes ilimitados con Growth</button>)}
    </div>
  )
}

export function CustomersTab({
  customers,
  cards = [], cardFilter = 'all', onCardFilterChange,
  page, totalPages, total, counts, inactiveDays,
  search, statusFilter, sortKey, sortDir, loading,
  isManager = false, plan, businessTotal, onChoosePlan,
  onSearchChange, onStatusFilterChange, onSortChange, onPageChange, onRefresh,
  autoOpenEmail, onAutoOpened,
}: CustomersTabProps) {
  const t = useLang()
  const [searchDraft, setSearchDraft] = useState(search)
  const [selected, setSelected]   = useState<Customer | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.Starter
  const canExport = limits.analyticsLevel === 'full'

  // Si la búsqueda cambia desde afuera (ej. un nombre clickeado en
  // Analítica), el input la refleja en vez de pisarla con el valor viejo.
  useEffect(() => { setSearchDraft(search) }, [search])

  // Llegando desde Analítica: abrir la ficha de ese cliente cuando carga.
  useEffect(() => {
    if (!autoOpenEmail || loading) return
    const match = customers.find(c => (c.email || '').toLowerCase() === autoOpenEmail.toLowerCase())
    if (match) { setSelected(match); onAutoOpened?.() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenEmail, loading, customers])

  // Cuando la lista se recarga (canje, borrado, volver a la pestaña), la
  // ficha abierta toma los datos nuevos de esa misma persona.
  useEffect(() => {
    if (!selected || loading) return
    const fresh = customers.find(c => c.id === selected.id)
    if (fresh && fresh !== selected) setSelected(fresh)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customers, loading])

  // Debounce: esperamos que la persona termine de tipear.
  useEffect(() => {
    const id = setTimeout(() => { if (searchDraft !== search) onSearchChange(searchDraft) }, 350)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft])

  // Esc cierra la ficha.
  useEffect(() => {
    if (!selected) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected])

  async function deleteCustomer(id: string): Promise<boolean> {
    const businessId = localStorage.getItem('stampa_business_id')
    if (!businessId) return false
    try {
      const res = await fetch(`${BASE_URL}/api/businesses/${businessId}/customers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + localStorage.getItem('stampa_token') }
      })
      if (!res.ok) return false
      if (selected && selected.cards.length <= 1) setSelected(null)
      onRefresh()
      return true
    } catch {
      return false
    }
  }

  async function exportCsv() {
    const businessId = localStorage.getItem('stampa_business_id')
    if (!businessId) return
    setExporting(true); setExportError(null)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (cardFilter !== 'all') params.set('cardId', cardFilter)
      const res = await fetch(`${BASE_URL}/api/businesses/${businessId}/customers/export?${params.toString()}`, {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('stampa_token') }
      })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const name = /filename="([^"]+)"/.exec(res.headers.get('Content-Disposition') || '')?.[1] || 'clientes.csv'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = name
      document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch {
      setExportError('No pudimos generar el archivo. Probá de nuevo.')
    } finally {
      setExporting(false)
    }
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) onSortChange(key, sortDir === 'asc' ? 'desc' : 'asc')
    else onSortChange(key, key === 'name' ? 'asc' : 'desc')
  }

  const FILTERS: { key: StatusFilter; label: string; count?: number; hideIfZero?: boolean }[] = [
    { key: 'all', label: t('ct_all'), count: counts?.all },
    { key: 'active', label: t('ct_active'), count: counts?.active },
    { key: 'inactive', label: t('ct_inactive'), count: counts?.inactive },
    { key: 'ready', label: '🎁 Para entregar', count: counts?.ready, hideIfZero: true },
    { key: 'near', label: t('ct_near_prize'), count: counts?.near, hideIfZero: true },
  ]
  const activityClass = (c: Customer) => {
    if (!c.lastUpdate) return ''
    const days = (Date.now() - c.lastUpdate) / 864e5
    return days <= 7 ? ' ct-activity--recent' : days > inactiveDays ? ' ct-activity--old' : ''
  }

  return (
    <>
      <style>{`
        .ct-shell{flex:1;display:grid;grid-template-columns:${selected ? '1fr 300px' : '1fr'};overflow:hidden;}
        .ct-main{display:flex;flex-direction:column;overflow:hidden;}
        .ct-toolbar{display:flex;align-items:center;gap:10px;padding:14px 24px;border-bottom:1px solid rgba(43,38,32,.07);background:#FFFFFF;flex-shrink:0;flex-wrap:wrap;}
        .ct-search{display:flex;align-items:center;gap:8px;background:#FBF6EE;border:1px solid rgba(43,38,32,.1);border-radius:9px;padding:8px 12px;flex:1;max-width:280px;min-width:180px;}
        .ct-search input{background:none;border:none;outline:none;font-family:'Inter',sans-serif;font-size:12.5px;color:#2B2620;width:100%;}
        .ct-search input::placeholder{color:rgba(43,38,32,.38);}
        .ct-search-clear{background:none;border:none;color:rgba(43,38,32,.4);cursor:pointer;font-size:14px;line-height:1;padding:0 2px;}
        .ct-filter-pills{display:flex;gap:5px;flex-wrap:wrap;align-items:center;}
        .ct-toolbar-end{margin-left:auto;display:flex;align-items:center;gap:8px;}
        .ct-pill{font-size:11px;padding:6px 12px;border-radius:20px;border:1px solid rgba(43,38,32,.12);background:#FFFFFF;color:rgba(43,38,32,.55);cursor:pointer;transition:all .15s;font-family:'Inter',sans-serif;white-space:nowrap;}
        .ct-pill:hover{border-color:rgba(43,38,32,.25);}
        .ct-pill--on{background:rgba(199,93,58,.1);border-color:#C75D3A;color:#C75D3A;font-weight:600;}
        .ct-pill-sep{width:1px;align-self:stretch;background:rgba(43,38,32,.1);margin:0 2px;}
        .ct-export{display:flex;align-items:center;gap:6px;font-size:11.5px;font-weight:600;padding:6px 12px;border-radius:20px;border:1px solid rgba(43,38,32,.15);background:#fff;color:#2B2620;cursor:pointer;font-family:'Inter',sans-serif;white-space:nowrap;}
        .ct-export:hover{border-color:rgba(43,38,32,.3);}
        .ct-export:disabled{opacity:.6;cursor:default;}
        .ct-export--locked{color:rgba(43,38,32,.5);}
        .ct-export-err{font-size:11px;color:#B23B3B;padding:6px 24px 0;}
        .ct-limit{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:10px 24px;border-bottom:1px solid rgba(43,38,32,.07);background:#fff;}
        .ct-limit-text{font-size:12px;color:rgba(43,38,32,.65);margin-bottom:6px;}
        .ct-limit-text strong{color:#2B2620;}
        .ct-limit-bar{height:5px;background:rgba(43,38,32,.07);border-radius:3px;overflow:hidden;max-width:360px;}
        .ct-limit-bar div{height:100%;background:#5B8C5A;border-radius:3px;}
        .ct-limit--warn .ct-limit-bar div{background:#D4A24C;}
        .ct-limit--full{background:rgba(178,59,59,.05);}
        .ct-limit--full .ct-limit-bar div{background:#B23B3B;}
        .ct-limit-btn{font-size:12px;font-weight:700;background:#C75D3A;color:#fff;border:none;border-radius:9px;padding:8px 14px;cursor:pointer;font-family:inherit;}
        .ct-limit-hint{font-size:11.5px;color:rgba(43,38,32,.5);}
        .ct-table-wrap{flex:1;overflow-y:auto;}
        .ct-pagination{display:flex;align-items:center;justify-content:center;gap:16px;padding:12px 24px;border-top:1px solid rgba(43,38,32,.07);background:#FFFFFF;flex-shrink:0;}
        .ct-page-btn{font-size:12px;font-weight:600;color:#C75D3A;background:none;border:1px solid rgba(199,93,58,.3);border-radius:8px;padding:6px 14px;cursor:pointer;transition:all .15s;}
        .ct-page-btn:hover:not(:disabled){background:rgba(199,93,58,.08);}
        .ct-page-btn:disabled{opacity:.35;cursor:not-allowed;color:rgba(43,38,32,.4);border-color:rgba(43,38,32,.15);}
        .ct-page-label{font-size:11.5px;color:rgba(43,38,32,.5);}
        table.ct{width:100%;border-collapse:collapse;}
        table.ct thead{background:#FFFFFF;position:sticky;top:0;z-index:2;border-bottom:1px solid rgba(43,38,32,.08);}
        table.ct th{text-align:left;font-size:9.5px;text-transform:uppercase;letter-spacing:.06em;color:rgba(43,38,32,.38);font-weight:700;padding:10px 14px;white-space:nowrap;user-select:none;cursor:pointer;}
        table.ct th:hover{color:rgba(43,38,32,.6);}
        table.ct th.th-active{color:#2B2620;}
        table.ct th.th-dynamic{color:#C75D3A;cursor:default;}
        table.ct tbody tr{border-bottom:1px solid rgba(43,38,32,.05);cursor:pointer;transition:background .1s;}
        table.ct tbody tr:hover{background:rgba(199,93,58,.04);}
        table.ct tbody tr.ct-row--selected{background:rgba(199,93,58,.08);}
        table.ct td{padding:11px 14px;font-size:12px;color:rgba(43,38,32,.8);vertical-align:middle;}
        .ct-customer-cell{display:flex;align-items:center;gap:10px;}
        .ct-av{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;flex-shrink:0;}
        .ct-customer-name{font-weight:600;color:#2B2620;font-size:12.5px;display:flex;align-items:center;gap:6px;}
        .ct-customer-email{font-size:10.5px;color:rgba(43,38,32,.45);}
        .ct-near-dot{width:7px;height:7px;border-radius:50%;background:#D4A24C;flex-shrink:0;}
        .ct-prog-txt{font-size:12px;font-weight:600;color:#2B2620;}
        .ct-dynamic{color:#C75D3A;font-weight:600;font-size:12px;}
        .ct-ready-tag{font-size:11px;font-weight:700;color:#5B8C5A;background:rgba(91,140,90,.12);padding:3px 9px;border-radius:20px;white-space:nowrap;}
        .ct-status-badge{font-size:10px;padding:3px 10px;border-radius:20px;font-weight:600;display:inline-block;}
        .ct-status-badge--active{background:rgba(91,140,90,.12);color:#5B8C5A;}
        .ct-status-badge--inactive{background:rgba(43,38,32,.07);color:rgba(43,38,32,.5);}
        .ct-card-badge{font-size:10px;padding:3px 10px;border-radius:20px;font-weight:600;display:inline-block;}
        .ct-card-badge--stamp{background:rgba(199,93,58,.1);color:#C75D3A;}
        .ct-card-badge--points{background:rgba(15,110,86,.1);color:#0F6E56;}
        .ct-card-badge--membership{background:rgba(83,74,183,.1);color:#534AB7;}
        .ct-near-badge{font-size:10px;padding:3px 10px;border-radius:20px;font-weight:600;background:rgba(212,162,76,.15);color:#9C7530;}
        .ct-ready-badge{font-size:10px;padding:3px 10px;border-radius:20px;font-weight:700;background:rgba(91,140,90,.14);color:#3F6E3E;}
        .ct-activity{font-size:11.5px;color:rgba(43,38,32,.55);white-space:nowrap;}
        .ct-activity--recent{color:#5B8C5A;font-weight:600;}
        .ct-activity--old{color:#B23B3B;}
        .ct-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:60px 20px;text-align:center;}
        .ct-empty-icon{width:44px;height:44px;border-radius:50%;background:rgba(43,38,32,.06);display:flex;align-items:center;justify-content:center;color:rgba(43,38,32,.3);}
        .ct-empty-txt{font-size:13px;color:rgba(43,38,32,.45);}
        .ct-empty-btn{font-size:12px;font-weight:600;color:#C75D3A;background:none;border:1px solid rgba(199,93,58,.3);border-radius:8px;padding:6px 14px;cursor:pointer;}
        .ct-skel{background:rgba(43,38,32,.07);border-radius:6px;animation:ctPulse 1.2s ease-in-out infinite;}
        @keyframes ctPulse{0%,100%{opacity:.45}50%{opacity:1}}
        .ct-skel-row{display:flex;align-items:center;gap:12px;padding:12px 14px;border-bottom:1px solid rgba(43,38,32,.05);}
        .ct-sheet-overlay,.ct-sheet-grip{display:none;}
        .ct-panel{background:#FFFFFF;border-left:1px solid rgba(43,38,32,.08);display:flex;flex-direction:column;align-items:center;padding:16px;overflow-y:auto;}
        .ct-panel-header{width:100%;display:flex;justify-content:flex-end;margin-bottom:6px;}
        .ct-panel-delete-btn{background:none;border:none;cursor:pointer;color:rgba(43,38,32,.25);padding:4px;border-radius:6px;display:flex;align-items:center;transition:all .15s;}
        .ct-panel-delete-btn:hover{color:#B23B3B;background:rgba(178,59,59,.08);}
        .ct-panel-close{background:none;border:none;cursor:pointer;color:rgba(43,38,32,.4);padding:4px;border-radius:6px;display:flex;align-items:center;transition:all .15s;}
        .ct-panel-close:hover{background:#FBF6EE;color:#2B2620;}
        .ct-confirm-del{width:100%;background:rgba(178,59,59,.07);border:1px solid rgba(178,59,59,.2);border-radius:10px;padding:12px 14px;margin-bottom:10px;}
        .ct-confirm-del-text{font-size:12px;color:rgba(43,38,32,.7);line-height:1.5;margin-bottom:10px;}
        .ct-confirm-del-err{font-size:11.5px;color:#B23B3B;font-weight:600;margin-bottom:8px;}
        .ct-confirm-del-btns{display:flex;gap:8px;}
        .ct-confirm-cancel{flex:1;background:none;border:1px solid rgba(43,38,32,.15);border-radius:8px;padding:7px;font-size:12px;cursor:pointer;color:rgba(43,38,32,.55);}
        .ct-confirm-ok{flex:1;background:#B23B3B;color:#fff;border:none;border-radius:8px;padding:7px;font-size:12px;font-weight:700;cursor:pointer;}
        .ct-confirm-ok:disabled,.ct-confirm-cancel:disabled{opacity:.6;cursor:default;}
        .ct-panel-avatar{width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#fff;margin-bottom:8px;flex-shrink:0;}
        .ct-panel-name{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:14px;color:#2B2620;text-align:center;}
        .ct-panel-email{font-size:11px;color:rgba(43,38,32,.45);margin-bottom:10px;text-align:center;word-break:break-all;}
        .ct-panel-badges{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;}
        .ct-panel-section{width:100%;margin-top:14px;padding-top:13px;border-top:1px solid rgba(43,38,32,.07);}
        .ct-resync-row{display:flex;align-items:center;gap:6px;}
        .ct-resync-btn{display:flex;align-items:center;justify-content:center;gap:7px;flex:1;font-size:12.5px;font-weight:600;padding:10px 14px;border-radius:9px;background:#FBF6EE;border:1.5px solid rgba(43,38,32,.12);color:#2B2620;cursor:pointer;font-family:'Inter',sans-serif;width:100%;}
        .ct-redeem-picker{display:flex;flex-direction:column;gap:6px;margin-top:8px;}
        .ct-redeem-item{display:flex;align-items:center;justify-content:space-between;width:100%;font-size:12px;padding:9px 12px;border-radius:8px;background:#FBF6EE;border:1px solid rgba(43,38,32,.1);color:#2B2620;cursor:pointer;font-family:'Inter',sans-serif;}
        .ct-redeem-item:disabled{opacity:.4;cursor:not-allowed;}
        .ct-redeem-cost{font-weight:700;color:#C75D3A;}
        .ct-redeem-cancel{font-size:11px;color:rgba(43,38,32,.5);background:none;border:none;cursor:pointer;align-self:center;margin-top:4px;font-family:inherit;}
        .ct-resync-btn:disabled{opacity:.6;cursor:not-allowed;}
        .ct-resync-hint{font-size:11px;color:rgba(43,38,32,.45);line-height:1.5;margin-top:4px;}
        .ct-resync-msg{font-size:11.5px;color:#2B2620;background:rgba(43,38,32,.04);border-radius:8px;padding:8px 10px;margin-top:8px;line-height:1.45;}
        .ct-resync-msg--err{background:rgba(178,59,59,.07);color:#8E2F2F;}
        .ct-panel-section-title{font-size:9.5px;text-transform:uppercase;letter-spacing:.06em;color:rgba(43,38,32,.38);font-weight:700;margin-bottom:10px;}
        .ct-panel-progress-num{font-family:'Plus Jakarta Sans',sans-serif;font-size:24px;font-weight:800;color:#C75D3A;margin-bottom:8px;}
        .ct-panel-progress-den{font-size:14px;color:rgba(43,38,32,.4);font-weight:500;}
        .ct-panel-stamps{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px;}
        .ct-panel-stamp{width:18px;height:18px;border-radius:50%;background:rgba(43,38,32,.08);}
        .ct-panel-stamp--filled{background:#C75D3A;}
        .ct-panel-progress-bar{width:100%;height:5px;background:rgba(43,38,32,.08);border-radius:3px;overflow:hidden;margin-bottom:8px;}
        .ct-panel-progress-fill{height:100%;background:linear-gradient(90deg,#C75D3A,#D4A24C);border-radius:3px;transition:width .3s;}
        .ct-near-note{font-size:11px;color:#9C7530;font-weight:600;background:rgba(212,162,76,.12);padding:6px 10px;border-radius:8px;}
        .ct-ready-note{display:flex;flex-direction:column;gap:3px;font-size:11.5px;color:#3F6E3E;background:rgba(91,140,90,.1);border:1px solid rgba(91,140,90,.25);padding:9px 11px;border-radius:9px;line-height:1.45;}
        .ct-panel-field-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid rgba(43,38,32,.05);font-size:11.5px;}
        .ct-panel-field-row:last-child{border-bottom:none;}
        .ct-panel-field-row--highlight{background:rgba(212,162,76,.07);margin:0 -6px;padding:7px 6px;border-radius:8px;border-bottom:none;}
        .ct-panel-field-label{color:rgba(43,38,32,.5);}
        .ct-panel-field-val{color:#2B2620;font-weight:600;text-align:right;max-width:160px;}
        .ct-panel-field-val--highlight{color:#C75D3A;}
        .ct-stack-cell{display:flex;flex-direction:column;gap:6px;}
        .ct-stack-line{display:flex;align-items:center;gap:6px;color:rgba(43,38,32,.7);}
        .ct-panel-card-section{border-top:1px solid rgba(43,38,32,.08);padding-top:14px;}
        .ct-panel-card-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
        .ct-panel-card-type{display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:700;color:#2B2620;}
        .ct-panel-card-responses{margin-top:12px;}
        .ct-hist-row{display:flex;gap:10px;padding:7px 0;border-bottom:1px solid rgba(43,38,32,.05);}
        .ct-hist-row:last-of-type{border-bottom:none;}
        .ct-hist-ic{width:22px;height:22px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0;background:rgba(199,93,58,.1);color:#C75D3A;}
        .ct-hist-ic--points{background:rgba(15,110,86,.1);color:#0F6E56;}
        .ct-hist-ic--visit,.ct-hist-ic--tier_change{background:rgba(83,74,183,.1);color:#534AB7;}
        .ct-hist-ic--redeem{background:rgba(91,140,90,.12);}
        .ct-hist-text{font-size:12px;color:#2B2620;font-weight:500;}
        .ct-hist-meta{font-size:10.5px;color:rgba(43,38,32,.45);margin-top:1px;}
        @media(max-width:768px){
          .ct-shell{grid-template-columns:1fr;}
          /* Ficha como hoja que sube desde abajo */
          .ct-sheet-overlay{display:block;position:fixed;inset:0;background:rgba(20,16,12,.35);z-index:60;animation:ctFade .2s ease;}
          .ct-panel{position:fixed;left:0;right:0;bottom:0;max-height:88vh;max-height:88dvh;z-index:61;border-left:none;border-radius:18px 18px 0 0;box-shadow:0 -8px 30px rgba(43,38,32,.18);padding:10px 18px calc(18px + env(safe-area-inset-bottom));animation:ctUp .25s ease;}
          .ct-sheet-grip{display:block;width:40px;height:4px;border-radius:2px;background:rgba(43,38,32,.18);margin:2px auto 4px;flex-shrink:0;}
          .ct-panel-field-val{max-width:60%;}
          .ct-toolbar{padding:10px 14px;gap:8px;}
          .ct-search{max-width:100%;flex-basis:100%;}
          .ct-toolbar-end{margin-left:0;}
          .ct-filter-pills{gap:4px;}
          .ct-pill{font-size:10.5px;padding:5px 10px;}
          .ct-limit{padding:10px 14px;}
          .ct-export-err{padding:6px 14px 0;}
          .ct-table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;}
          table.ct{min-width:520px;}
          table.ct th,table.ct td{padding:9px 10px;}
          .ct-pagination{flex-direction:column;gap:8px;padding:10px 14px;}
        }
        @keyframes ctUp{from{transform:translateY(100%)}to{transform:none}}
        @keyframes ctFade{from{opacity:0}to{opacity:1}}
      `}</style>

      <div className="ct-shell">
        <div className="ct-main">
          {limits.maxCustomers > 0 && businessTotal != null && (
            <CustomerLimit used={businessTotal} max={limits.maxCustomers} isManager={isManager} onChoosePlan={onChoosePlan} />
          )}
          <div className="ct-toolbar">
            <div className="ct-search">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input placeholder={t('ct_search')} value={searchDraft} onChange={e => setSearchDraft(e.target.value)} />
              {searchDraft && <button className="ct-search-clear" onClick={() => { setSearchDraft(''); onSearchChange('') }} aria-label="Borrar búsqueda">×</button>}
            </div>
            <div className="ct-filter-pills">
              {FILTERS.filter(f => !f.hideIfZero || (f.count ?? 0) > 0 || statusFilter === f.key).map(f => (
                <button key={f.key} className={`ct-pill${statusFilter === f.key ? ' ct-pill--on' : ''}`} onClick={() => onStatusFilterChange(f.key)}>
                  {f.label}{f.count != null ? ` (${f.count})` : ''}
                </button>
              ))}
              {cards.length > 1 && (
                <>
                  <div className="ct-pill-sep" />
                  <button className={`ct-pill${cardFilter === 'all' ? ' ct-pill--on' : ''}`} onClick={() => onCardFilterChange?.('all')}>Todas las tarjetas</button>
                  {cards.map(c => (
                    <button key={c.id} className={`ct-pill${cardFilter === c.id ? ' ct-pill--on' : ''}`} onClick={() => onCardFilterChange?.(c.id)}>{c.name}</button>
                  ))}
                </>
              )}
            </div>
            <div className="ct-toolbar-end">
              {canExport
                ? <button className="ct-export" onClick={exportCsv} disabled={exporting || total === 0} title="Descargar esta lista (con los filtros aplicados) para Excel">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    {exporting ? 'Generando…' : 'Exportar'}
                  </button>
                : <button className="ct-export ct-export--locked" onClick={isManager ? undefined : onChoosePlan} title="Exportar la lista con filtros está disponible desde Growth">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    Exportar · Growth
                  </button>}
            </div>
          </div>
          {exportError && <div className="ct-export-err">{exportError}</div>}

          <div className="ct-table-wrap">
            {loading && customers.length === 0
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="ct-skel-row">
                    <div className="ct-skel" style={{ width: 30, height: 30, borderRadius: '50%' }} />
                    <div style={{ flex: 1 }}><div className="ct-skel" style={{ width: '40%', height: 11, marginBottom: 6 }} /><div className="ct-skel" style={{ width: '55%', height: 9 }} /></div>
                    <div className="ct-skel" style={{ width: 60, height: 11 }} />
                  </div>
                ))
              : customers.length === 0
              ? <div className="ct-empty">
                  <div className="ct-empty-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div>
                  <div className="ct-empty-txt">{search ? t('ct_no_match') : statusFilter === 'inactive' ? '¡Ningún cliente inactivo! Todos vinieron hace poco.' : statusFilter === 'ready' ? 'No hay premios pendientes de entregar.' : statusFilter === 'near' ? 'Nadie está a 1–2 sellos del premio ahora.' : 'No hay clientes con este filtro.'}</div>
                  {(search || statusFilter !== 'all' || cardFilter !== 'all') && (
                    <button className="ct-empty-btn" onClick={() => { if (search) { setSearchDraft(''); onSearchChange('') } if (statusFilter !== 'all') onStatusFilterChange('all'); if (cardFilter !== 'all') onCardFilterChange?.('all') }}>Ver todos los clientes</button>
                  )}
                </div>
              : <table className="ct" style={{ opacity: loading ? 0.55 : 1, transition: 'opacity .15s' }}>
                  <thead>
                    <tr>
                      <th className={sortKey === 'name' ? 'th-active' : ''} onClick={() => handleSort('name')}>{t('ct_col_customer')}<SortIcon active={sortKey === 'name'} dir={sortDir} /></th>
                      <th className={sortKey === 'progress' ? 'th-active' : ''} onClick={() => handleSort('progress')}>{t('ct_col_progress')}<SortIcon active={sortKey === 'progress'} dir={sortDir} /></th>
                      <th className="th-dynamic">Premio</th>
                      <th className={sortKey === 'status' ? 'th-active' : ''} onClick={() => handleSort('status')}>{t('ct_col_status')}<SortIcon active={sortKey === 'status'} dir={sortDir} /></th>
                      <th className={sortKey === 'lastActivity' ? 'th-active' : ''} onClick={() => handleSort('lastActivity')}>{t('ct_col_last')}<SortIcon active={sortKey === 'lastActivity'} dir={sortDir} /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c: Customer) => (
                      <tr key={c.id} className={selected?.id === c.id ? 'ct-row--selected' : ''} onClick={() => setSelected(selected?.id === c.id ? null : c)}>
                        <td>
                          <div className="ct-customer-cell">
                            <div className="ct-av" style={{ background: avatarColor(c.name) }}>{initials(c.name)}</div>
                            <div>
                              <div className="ct-customer-name">{c.name}{c.near && !c.ready && <div className="ct-near-dot" />}</div>
                              <div className="ct-customer-email">{c.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="ct-stack-cell">
                            {c.cards.map(card => (
                              <div key={card.customerId} className="ct-stack-line">
                                <CardTypeIcon type={card.cardType} />
                                {card.cardType === 'stamp'
                                  ? <span className="ct-prog-txt">{card.stamps} de {card.cardStampsRequired || 0}</span>
                                  : card.cardType === 'points'
                                  ? <span className="ct-prog-txt">{card.pointsBalance} pts</span>
                                  : <span className="ct-prog-txt">{card.membershipTier ? `Nivel ${card.membershipTier}` : 'Sin nivel'}</span>
                                }
                              </div>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div className="ct-stack-cell">
                            {c.cards.map(card => (
                              <div key={card.customerId} className="ct-stack-line">
                                {isReady(card)
                                  ? <span className="ct-ready-tag">🎁 Para entregar{card.premio ? `: ${card.premio}` : ''}</span>
                                  : <span className="ct-dynamic">{card.premio || '—'}</span>}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                            <span className={`ct-status-badge ct-status-badge--${c.status}`}>{c.status === 'active' ? t('status_active') : t('status_inactive')}</span>
                            {c.near && !c.ready && <span className="ct-near-badge">{t('ct_near_badge')}</span>}
                          </div>
                        </td>
                        <td><span className={`ct-activity${activityClass(c)}`}>{c.lastActivity}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            }
          </div>

          {totalPages > 1 && (
            <div className="ct-pagination">
              <button className="ct-page-btn" disabled={page <= 1 || loading} onClick={() => onPageChange(page - 1)}>← Anterior</button>
              <span className="ct-page-label">Página {page} de {totalPages} · {total.toLocaleString('es-AR')} clientes</span>
              <button className="ct-page-btn" disabled={page >= totalPages || loading} onClick={() => onPageChange(page + 1)}>Siguiente →</button>
            </div>
          )}
        </div>

        {selected && <CustomerPanel customer={selected} canDelete={!isManager} onClose={() => setSelected(null)} onDelete={deleteCustomer} onChanged={onRefresh} />}
      </div>
    </>
  )
}
