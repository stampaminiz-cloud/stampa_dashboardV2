'use client'
import { CardSwitcher } from '@/components/ui/CardSwitcher'
import { readCache, getJson } from '@/lib/cache'
import { MascotLoader } from '@/components/ui/MascotLoader'
import React, { useState, useEffect } from 'react'
import {
  BASE_URL, apiGetPointsCatalog, apiCreatePointsCatalogItem, apiUpdatePointsCatalogItem, apiDeletePointsCatalogItem,
  apiGetTiers, apiSaveTiers, apiCreateDefaultTiers,
} from '@/lib/api'
import { NumberStepper } from '@/components/ui/NumberStepper'
import { withLoc } from '@/lib/location'

// Premios, por tarjeta. Todo sale de /rewards-stats (canjes reales que
// registra la app de escaneo o el dashboard) y de los editores de catálogo
// (puntos) y niveles (membresía). El premio de las tarjetas de sellos se
// edita en Diseño: acá se muestra y se linkea.

type CardType = 'stamp' | 'points' | 'membership'
interface ActiveCard { id: string; name: string; type: CardType; isActive: boolean }
interface Redemption { name: string; email: string | null; prize: string; at: number }


function relTime(ms: number) {
  const min = Math.floor((Date.now() - ms) / 60000)
  if (min < 1) return 'Ahora'
  if (min < 60) return `Hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `Hace ${h} h`
  const d = Math.floor(h / 24)
  return d < 30 ? `Hace ${d} día${d === 1 ? '' : 's'}` : new Date(ms).toLocaleDateString('es-AR')
}
function avatarInit(name: string) { return name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() }
function monthDelta(cur: number, prev: number) {
  if (!prev) return cur > 0 ? 'mes pasado a esta fecha: 0' : 'sin canjes el mes pasado a esta fecha'
  const d = Math.round(((cur - prev) / prev) * 100)
  return `${d >= 0 ? '↑' : '↓'} ${Math.abs(d)}% vs mes pasado a esta fecha (${prev})`
}

function Stat({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub?: string; tone?: 'good' | 'warn' }) {
  return (
    <div className={`rw-card rw-stat${tone ? ` rw-stat--${tone}` : ''}`}>
      <div className="rw-stat-label">{label}</div>
      <div className="rw-stat-val">{value}</div>
      {sub && <div className="rw-stat-sub">{sub}</div>}
    </div>
  )
}

function Redemptions({ items, onOpenCustomer, empty }: { items: Redemption[]; onOpenCustomer?: (email: string) => void; empty: string }) {
  if (!items.length) return <div className="rw-empty-note">{empty}</div>
  return (
    <table className="rw-table">
      <thead><tr><th>Cliente</th><th>Premio</th><th style={{ textAlign: 'right' }}>Cuándo</th></tr></thead>
      <tbody>
        {items.map((r, i) => (
          <tr key={i}>
            <td>
              <div className="rw-av-row">
                <div className="rw-av">{avatarInit(r.name)}</div>
                {onOpenCustomer && r.email
                  ? <button className="rw-link" onClick={() => onOpenCustomer(r.email!)}>{r.name}</button>
                  : r.name}
              </div>
            </td>
            <td><span className="rw-prize-tag">{r.prize}</span></td>
            <td className="rw-time-col">{relTime(r.at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ─── Sellos ───────────────────────────────────────────────────────────────────
function StampRewards({ data, onGoToDesign, onOpenCustomer }: { data: any; onGoToDesign: () => void; onOpenCustomer?: (email: string) => void }) {
  const chosen: Array<{ prize: string; count: number }> = data.chosen || []
  const maxCount = Math.max(1, ...chosen.map(d => d.count))
  const dynamic = data.reward?.mode === 'dynamic'
  const options: string[] = data.reward?.options || []
  return (
    <div className="rw-content">
      <div className="rw-card rw-reward-summary">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="rw-card-title">Tu premio</div>
          {dynamic ? (
            <>
              <div className="rw-reward-main">Lo elige cada cliente al registrarse</div>
              <div className="rw-reward-sub">
                {options.length > 0
                  ? <>Opciones: {options.map(o => <span key={o} className="rw-chip">{o}</span>)}</>
                  : 'Todavía no cargaste opciones en la pregunta del premio del formulario.'}
              </div>
            </>
          ) : (
            <div className="rw-reward-main">{data.reward?.fixedValue || <span style={{ color: '#B23B3B' }}>Sin definir</span>}</div>
          )}
          <div className="rw-reward-sub">Se completa con <strong>{data.stampsRequired} sellos</strong>. Se entrega desde la app de escaneo.</div>
        </div>
        <button className="rw-secondary-btn" onClick={onGoToDesign}>Editar en Diseño</button>
      </div>

      <div className="rw-3col">
        <Stat label="Para entregar" value={data.toDeliver ?? 0} sub="tarjetas completas esperando su premio" tone={data.toDeliver > 0 ? 'good' : undefined} />
        <Stat label="A 1–2 sellos del premio" value={data.nearPrize ?? 0} sub="buen momento para una notificación" />
        <Stat label="Premios entregados este mes" value={data.redeemedThisMonth ?? 0} sub={monthDelta(data.redeemedThisMonth ?? 0, data.redeemedLastMonth ?? 0)} />
      </div>

      {dynamic && (
        <div className="rw-card">
          <div className="rw-card-title">Premios más elegidos</div>
          <div className="rw-card-sub">Lo que eligieron tus clientes al registrarse — para tener stock de lo que más sale</div>
          {chosen.length === 0 ? (
            <div className="rw-empty-note">Aparece cuando tus clientes elijan su premio al registrarse.</div>
          ) : (
            <div className="rw-dist-list">
              {chosen.map(d => (
                <div key={d.prize} className="rw-dist-row">
                  <span className="rw-dist-name">{d.prize}</span>
                  <div className="rw-dist-bar-wrap"><div className="rw-dist-bar" style={{ width: `${(d.count / maxCount) * 100}%` }} /></div>
                  <span className="rw-dist-count">{d.count} cliente{d.count === 1 ? '' : 's'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="rw-card">
        <div className="rw-card-title">Últimos premios entregados</div>
        <div className="rw-card-sub">Registrados desde la app de escaneo</div>
        <Redemptions items={data.recentRedemptions || []} onOpenCustomer={onOpenCustomer} empty="Todavía no entregaste ningún premio con esta tarjeta." />
      </div>
    </div>
  )
}

// ─── Puntos ───────────────────────────────────────────────────────────────────
function PointsRewards({ businessId, cardId, data, onOpenCustomer, onChanged }: { businessId: string; cardId: string; data: any; onOpenCustomer?: (email: string) => void; onChanged: () => void }) {
  const [catalog, setCatalog] = useState<Array<{ _id: string; name: string; pointsCost: number; isActive: boolean }> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ id: string; name: string; points: string } | null>(null)
  const [confirmDel, setConfirmDel] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newItem, setNewItem] = useState({ points: '50', name: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setCatalog(readCache<any[]>(`/api/businesses/${businessId}/cards/${cardId}/points-catalog`) ?? null); setError(null)
    apiGetPointsCatalog(businessId, cardId)
      .then(items => setCatalog(items))
      .catch((err: any) => { setCatalog([]); setError(err?.error || 'No se pudo cargar el catálogo.') })
  }, [businessId, cardId])

  const validate = (name: string, points: string) => {
    if (!name.trim()) return 'Poné un nombre para el premio.'
    if (name.trim().length > 40) return 'El nombre puede tener hasta 40 caracteres.'
    const n = Number(points)
    if (!Number.isInteger(n) || n < 1) return 'Los puntos tienen que ser un número entero mayor a 0.'
    return null
  }

  async function addItem() {
    const v = validate(newItem.name, newItem.points)
    if (v) { setError(v); return }
    setSaving(true); setError(null)
    try {
      const created = await apiCreatePointsCatalogItem(businessId, cardId, { name: newItem.name.trim(), pointsCost: Number(newItem.points) })
      setCatalog(c => [...(c || []), { isActive: true, ...(created as any) }].sort((a, b) => a.pointsCost - b.pointsCost))
      setNewItem({ points: '50', name: '' }); setShowAdd(false); onChanged()
    } catch (err: any) {
      setError(err?.error || 'No se pudo crear el premio.')
    } finally { setSaving(false) }
  }

  async function saveEdit() {
    if (!editing) return
    const v = validate(editing.name, editing.points)
    if (v) { setError(v); return }
    setSaving(true); setError(null)
    try {
      const upd = await apiUpdatePointsCatalogItem(businessId, cardId, editing.id, { name: editing.name.trim(), pointsCost: Number(editing.points) })
      setCatalog(c => (c || []).map(i => i._id === editing.id ? { ...i, ...(upd as any) } : i).sort((a, b) => a.pointsCost - b.pointsCost))
      setEditing(null); onChanged()
    } catch (err: any) {
      setError(err?.error || 'No se pudo guardar el cambio.')
    } finally { setSaving(false) }
  }

  async function toggleActive(id: string, isActive: boolean) {
    setError(null)
    const prev = catalog
    setCatalog(c => (c || []).map(i => i._id === id ? { ...i, isActive } : i))
    try { await apiUpdatePointsCatalogItem(businessId, cardId, id, { isActive }); onChanged() }
    catch (err: any) { setCatalog(prev); setError(err?.error || 'No se pudo cambiar el estado.') }
  }

  async function deleteItem(id: string) {
    setError(null)
    const prev = catalog
    setCatalog(c => (c || []).filter(i => i._id !== id))
    setConfirmDel(null)
    try { await apiDeletePointsCatalogItem(businessId, cardId, id); onChanged() }
    catch (err: any) { setCatalog(prev); setError(err?.error || 'No se pudo eliminar el premio.') }
  }

  const stats: Record<string, number> = data.catalogStats || {}
  const top: Array<{ name: string; email: string; points: number }> = data.topCustomers || []

  return (
    <div className="rw-content">
      <div className="rw-3col">
        <Stat label="Canjes este mes" value={data.redeemedThisMonth ?? 0} sub={`${(data.pointsRedeemedThisMonth ?? 0).toLocaleString('es-AR')} puntos canjeados · ${monthDelta(data.redeemedThisMonth ?? 0, data.redeemedLastMonth ?? 0)}`} />
        <Stat label="Pueden canjear ahora" value={data.canRedeem ?? 0} sub="ya les alcanza para el premio más barato" tone={data.canRedeem > 0 ? 'good' : undefined} />
        <Stat label="Saldo promedio" value={`${(data.avgBalance ?? 0).toLocaleString('es-AR')} pts`} sub={`suman ${data.pointsPerVisit ?? 0} pts por visita`} />
      </div>

      <div className="rw-card">
        <div className="rw-card-head-row">
          <div><div className="rw-card-title">Catálogo de premios</div><div className="rw-card-sub" style={{ marginBottom: 0 }}>Lo que tus clientes pueden canjear con sus puntos</div></div>
          <button className="rw-add-btn" onClick={() => { setShowAdd(!showAdd); setError(null) }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo premio
          </button>
        </div>
        {showAdd && (
          <div className="rw-add-form">
            <input className="rw-input" placeholder="Nombre del premio (ej: Café gratis)" maxLength={40} value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} onKeyDown={e => e.key === 'Enter' && addItem()} autoFocus />
            <NumberStepper value={Number(newItem.points) || 50} onChange={n => setNewItem(it => ({ ...it, points: String(n) }))} min={1} max={100000} step={5} suffix="pts" size="sm" ariaLabel="Puntos del premio" />
            <button className="rw-confirm-btn" onClick={addItem} disabled={saving}>{saving ? 'Guardando…' : 'Agregar'}</button>
            <button className="rw-cancel-btn" onClick={() => { setShowAdd(false); setError(null) }}>Cancelar</button>
          </div>
        )}
        {error && <div className="rw-error">{error}</div>}
        {catalog === null ? (
          [0, 1, 2].map(i => <div key={i} className="rw-skel" style={{ height: 36, marginBottom: 8 }} />)
        ) : catalog.length === 0 ? (
          <div className="rw-empty-note">Todavía no armaste ningún premio. Agregá el primero: sin premios, los puntos no se pueden canjear.</div>
        ) : (
          <table className="rw-table">
            <thead><tr><th>Premio</th><th>Puntos</th><th>Canjes</th><th></th></tr></thead>
            <tbody>
              {catalog.map(item => (
                <tr key={item._id} className={item.isActive === false ? 'rw-row--off' : ''}>
                  {editing?.id === item._id ? (
                    <>
                      <td><input className="rw-inline-input" maxLength={40} value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} onKeyDown={e => e.key === 'Enter' && saveEdit()} autoFocus /></td>
                      <td><NumberStepper value={Number(editing.points) || 1} onChange={n => setEditing(ed => ed ? { ...ed, points: String(n) } : ed)} min={1} max={100000} step={5} suffix="pts" size="sm" ariaLabel="Puntos del premio" /></td>
                      <td />
                      <td>
                        <div className="rw-actions">
                          <button className="rw-mini-btn rw-mini-btn--primary" onClick={saveEdit} disabled={saving}>{saving ? '…' : 'Guardar'}</button>
                          <button className="rw-mini-btn" onClick={() => { setEditing(null); setError(null) }}>Cancelar</button>
                        </div>
                      </td>
                    </>
                  ) : confirmDel === item._id ? (
                    <td colSpan={4}>
                      <div className="rw-confirm-row">
                        <span>¿Eliminar <strong>{item.name}</strong>? Si solo querés sacarlo un tiempo, mejor pausalo.</span>
                        <div className="rw-actions">
                          <button className="rw-mini-btn" onClick={() => setConfirmDel(null)}>Cancelar</button>
                          <button className="rw-mini-btn rw-mini-btn--danger" onClick={() => deleteItem(item._id)}>Eliminar</button>
                        </div>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td><span className="rw-item-name">{item.name}</span>{item.isActive === false && <span className="rw-paused">Pausado</span>}</td>
                      <td><span className="rw-pts-badge">{item.pointsCost.toLocaleString('es-AR')} pts</span></td>
                      <td className="rw-muted">{stats[item._id] ?? 0}</td>
                      <td>
                        <div className="rw-actions">
                          <button className="rw-mini-btn" onClick={() => toggleActive(item._id, item.isActive === false)} title={item.isActive === false ? 'Volver a ofrecerlo' : 'Dejar de ofrecerlo por un tiempo'}>{item.isActive === false ? 'Activar' : 'Pausar'}</button>
                          <button className="rw-icon-btn" onClick={() => { setEditing({ id: item._id, name: item.name, points: String(item.pointsCost) }); setError(null) }} title="Editar"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>
                          <button className="rw-icon-btn rw-icon-btn--danger" onClick={() => setConfirmDel(item._id)} title="Eliminar"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rw-2col">
        <div className="rw-card">
          <div className="rw-card-title">Últimos canjes</div>
          <div className="rw-card-sub">Desde la app de escaneo o desde la ficha del cliente</div>
          <Redemptions items={data.recentRedemptions || []} onOpenCustomer={onOpenCustomer} empty="Todavía no hubo ningún canje." />
        </div>
        <div className="rw-card">
          <div className="rw-card-title">Más puntos acumulados</div>
          <div className="rw-card-sub">Clientes con más saldo para canjear</div>
          {top.length === 0 ? <div className="rw-empty-note">Todavía nadie sumó puntos.</div> : (
            <table className="rw-table">
              <tbody>{top.map((c, i) => (
                <tr key={i}>
                  <td><div className="rw-av-row"><div className="rw-av">{avatarInit(c.name)}</div>{onOpenCustomer && c.email ? <button className="rw-link" onClick={() => onOpenCustomer(c.email)}>{c.name}</button> : c.name}</div></td>
                  <td style={{ textAlign: 'right' }}><span className="rw-pts-badge">{c.points.toLocaleString('es-AR')} pts</span></td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Membresía ────────────────────────────────────────────────────────────────
interface EditTier { key: string; id?: string; name: string; threshold: string; perk: string; color: string; bg: string }
// Texto del badge del nivel: oscuro sobre colores claros (ej. Black, que
// tiene texto crema) y blanco sobre los oscuros.
function badgeText(hex: string) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})/i.exec(hex || '')
  if (!m) return '#FFFFFF'
  const [r, g, b] = [m[1], m[2], m[3]].map(x => parseInt(x, 16))
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? '#2B2620' : '#FFFFFF'
}

// Pares color de texto / fondo (el pase del Wallet usa el fondo del nivel).
const TIER_PALETTE = [
  { label: 'Bronce',  color: '#854F0B', bg: '#FAEEDA' },
  { label: 'Plata',   color: '#444441', bg: '#EAEAEA' },
  { label: 'Oro',     color: '#633806', bg: '#FAC775' },
  { label: 'Negro',   color: '#F7F0E4', bg: '#1A1A18' },
  { label: 'Azul',    color: '#0C447C', bg: '#DCEBFA' },
  { label: 'Verde',   color: '#0F6E56', bg: '#DDF3EC' },
  { label: 'Violeta', color: '#3C3489', bg: '#E8E5FA' },
  { label: 'Rosa',    color: '#993556', bg: '#FBE3EC' },
]
let tierKey = 0

function validateTiers(tiers: EditTier[]): string | null {
  if (tiers.length < 2) return 'La membresía necesita al menos 2 niveles.'
  if (tiers.length > 6) return 'Hasta 6 niveles.'
  for (const [i, t] of tiers.entries()) {
    if (!t.name.trim()) return `El nivel ${i + 1} necesita un nombre.`
    const n = Number(t.threshold)
    if (!Number.isInteger(n) || n < 0) return `Las visitas de "${t.name}" tienen que ser un número entero.`
    if (i > 0 && n <= Number(tiers[i - 1].threshold)) return `"${t.name}" tiene que pedir más visitas que "${tiers[i - 1].name}".`
    if (tiers.slice(0, i).some(o => o.name.trim().toLowerCase() === t.name.trim().toLowerCase())) return `Hay dos niveles llamados "${t.name}".`
  }
  return null
}

function MembershipRewards({ businessId, cardId, data, onChanged }: { businessId: string; cardId: string; data: any; onChanged: () => void }) {
  const [saved, setSaved] = useState<EditTier[] | null>(null)
  const [draft, setDraft] = useState<EditTier[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [paletteFor, setPaletteFor] = useState<string | null>(null)

  const toEdit = (items: any[]): EditTier[] => items.map(t => ({ key: `t${tierKey++}`, id: t._id, name: t.name, threshold: String(t.threshold ?? 0), perk: t.perk || '', color: t.color || '#854F0B', bg: t.bg || '#FAEEDA' }))
  useEffect(() => {
    const cachedTiers = readCache<any[]>(`/api/businesses/${businessId}/cards/${cardId}/tiers`)
    if (cachedTiers) { const e = toEdit(cachedTiers); setSaved(e); setDraft(e) } else { setSaved(null); setDraft(null) }
    setError(null); setNotice(null)
    apiGetTiers(businessId, cardId)
      .then(items => { const e = toEdit(items); setSaved(e); setDraft(e) })
      .catch((err: any) => { setSaved([]); setDraft([]); setError(err?.error || 'No se pudieron cargar los niveles.') })
  }, [businessId, cardId])

  const dirty = JSON.stringify(saved?.map(({ key, ...r }) => r)) !== JSON.stringify(draft?.map(({ key, ...r }) => r))
  const dist: Array<{ tier: string; count: number; color: string; bg: string }> = data.distribution || []
  const total = data.total ?? 0

  function update(key: string, patch: Partial<EditTier>) { setDraft(d => (d || []).map(t => t.key === key ? { ...t, ...patch } : t)); setNotice(null) }
  function remove(key: string) { setDraft(d => (d || []).filter(t => t.key !== key)); setNotice(null) }
  function add() {
    setDraft(d => {
      const list = d || []
      const last = list[list.length - 1]
      const p = TIER_PALETTE[list.length % TIER_PALETTE.length]
      return [...list, { key: `t${tierKey++}`, name: '', threshold: String(last ? Number(last.threshold) + 10 : 0), perk: '', color: p.color, bg: p.bg }]
    })
    setNotice(null)
  }
  async function createDefaults() {
    setSaving(true); setError(null)
    try { const items = await apiCreateDefaultTiers(businessId, cardId); const e = toEdit(items); setSaved(e); setDraft(e); onChanged() }
    catch (err: any) { setError(err?.error || 'No se pudieron crear los niveles.') }
    finally { setSaving(false) }
  }
  async function save() {
    if (!draft) return
    const v = validateTiers(draft)
    if (v) { setError(v); return }
    setSaving(true); setError(null); setNotice(null)
    try {
      const res = await apiSaveTiers(businessId, cardId, draft.map(t => ({ id: t.id, name: t.name.trim(), threshold: Number(t.threshold), perk: t.perk.trim(), color: t.color, bg: t.bg })))
      const e = toEdit(res.tiers); setSaved(e); setDraft(e)
      setNotice(res.promoted > 0
        ? `Guardado. ${res.promoted} cliente${res.promoted === 1 ? ' subió' : 's subieron'} de nivel y ya ${res.promoted === 1 ? 've' : 'ven'} su tarjeta actualizada.`
        : res.updatedCustomers > 0 ? `Guardado. Se actualizó el nivel de ${res.updatedCustomers} cliente${res.updatedCustomers === 1 ? '' : 's'}.` : 'Guardado.')
      onChanged()
    } catch (err: any) {
      setError(err?.error || 'No se pudieron guardar los niveles.')
    } finally { setSaving(false) }
  }

  const willDeleteWithMembers = (saved || []).filter(s => !(draft || []).some(d => d.id === s.id)).map(s => ({ name: s.name, count: dist.find(x => x.tier === s.name)?.count || 0 })).filter(x => x.count > 0)

  return (
    <div className="rw-content">
      {dist.length > 0 && (
        <div className="rw-tier-grid" style={{ ['--n' as any]: Math.min(dist.length, 6) }}>
          {dist.map(d => (
            <div key={d.tier} className="rw-card rw-tier-card" style={{ background: d.bg, border: `1px solid ${d.color}22` }}>
              <div className="rw-tier-badge" style={{ background: d.color, color: badgeText(d.color) }}>{d.tier}</div>
              <div className="rw-tier-members" style={{ color: d.color }}>{d.count}</div>
              <div className="rw-tier-sub" style={{ color: d.color }}>{total > 0 ? Math.round((d.count / total) * 100) : 0}% de tus miembros</div>
            </div>
          ))}
        </div>
      )}

      <div className="rw-card">
        <div className="rw-card-head-row">
          <div>
            <div className="rw-card-title">Niveles y beneficios</div>
            <div className="rw-card-sub" style={{ marginBottom: 0 }}>Cada cliente sube de nivel al llegar a las visitas indicadas. Entre 2 y 6 niveles.</div>
          </div>
        </div>
        {error && <div className="rw-error">{error}</div>}
        {notice && <div className="rw-notice">{notice}</div>}
        {draft === null ? (
          [0, 1, 2].map(i => <div key={i} className="rw-skel" style={{ height: 40, marginBottom: 8 }} />)
        ) : draft.length === 0 ? (
          <div className="rw-empty-note">
            Esta membresía todavía no tiene niveles.
            <div style={{ marginTop: 10 }}><button className="rw-add-btn" onClick={createDefaults} disabled={saving}>{saving ? 'Creando…' : 'Crear niveles sugeridos'}</button></div>
          </div>
        ) : (
          <>
            <div className="rw-tier-editor">
              <div className="rw-tier-row rw-tier-row--head"><span /><span>Nivel</span><span>Desde</span><span>Beneficio</span><span /></div>
              {draft.map((t, i) => (
                <div key={t.key} className="rw-tier-row">
                  <div style={{ position: 'relative' }}>
                    <button className="rw-swatch" style={{ background: t.bg, borderColor: t.color }} onClick={() => setPaletteFor(paletteFor === t.key ? null : t.key)} title="Color del nivel" aria-label="Color del nivel" />
                    {paletteFor === t.key && (
                      <div className="rw-palette">
                        {TIER_PALETTE.map(p => (
                          <button key={p.label} className="rw-swatch" title={p.label} style={{ background: p.bg, borderColor: p.color }} onClick={() => { update(t.key, { color: p.color, bg: p.bg }); setPaletteFor(null) }} />
                        ))}
                      </div>
                    )}
                  </div>
                  <input className="rw-inline-input" placeholder="Nombre" maxLength={20} value={t.name} onChange={e => update(t.key, { name: e.target.value })} aria-label="Nombre del nivel" />
                  <div className="rw-visits">
                    {i === 0
                      ? <span>Desde el registro</span>
                      : <NumberStepper value={Number(t.threshold) || 1} onChange={n => update(t.key, { threshold: String(n) })} min={1} max={10000} suffix="visitas" size="sm" ariaLabel="Visitas necesarias" />}
                  </div>
                  <input className="rw-inline-input" placeholder="Ej: 10% de descuento" maxLength={80} value={t.perk} onChange={e => update(t.key, { perk: e.target.value })} aria-label="Beneficio" />
                  <button className="rw-icon-btn rw-icon-btn--danger" onClick={() => remove(t.key)} disabled={draft.length <= 2 || i === 0} title={i === 0 ? 'El primer nivel no se puede borrar' : draft.length <= 2 ? 'Mínimo 2 niveles' : 'Borrar nivel'}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                  </button>
                </div>
              ))}
            </div>
            {willDeleteWithMembers.length > 0 && (
              <div className="rw-warn">Al guardar, los clientes de {willDeleteWithMembers.map(x => `"${x.name}" (${x.count})`).join(', ')} pasan al nivel que les corresponde por sus visitas.</div>
            )}
            <div className="rw-editor-foot">
              <button className="rw-secondary-btn" onClick={add} disabled={draft.length >= 6}>+ Agregar nivel</button>
              <div style={{ flex: 1 }} />
              {dirty && <button className="rw-cancel-btn" onClick={() => { setDraft(saved); setError(null) }} disabled={saving}>Descartar</button>}
              <button className="rw-confirm-btn" onClick={save} disabled={!dirty || saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</button>
            </div>
            <div className="rw-hint">Si bajás las visitas de un nivel, los clientes que ya las cumplen suben al guardar. Si las subís, nadie pierde el nivel que ya ganó.</div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function RewardsTab({ cards, businessId, onGoToDesign, onOpenCustomer }: {
  cards?: any[]; businessId?: string | null
  onGoToDesign: () => void
  onOpenCustomer?: (email: string) => void
}) {
  const activeCards: ActiveCard[] = (cards || []).filter((c: any) => c.isActive)
  const [selectedId, setSelectedId] = useState<string>(activeCards[0]?.id || '')
  const selected = activeCards.find(c => c.id === selectedId) || activeCards[0]
  const [data, setData] = useState<any>(null)
  const [dataFor, setDataFor] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    if (!businessId || !selected) return
    let cancelled = false
    setError(false)
    // Lo guardado (o precargado por Inicio) se muestra al instante (lib/cache).
    const path = withLoc(`/api/businesses/${businessId}/rewards-stats?cardId=${selected.id}`)
    const cached = readCache<any>(path)
    if (cached?.cardType) { setData(cached); setDataFor(selected.id) }
    getJson<any>(path)
      .then(d => { if (!d?.cardType) throw new Error(); return d })
      .then(d => { if (!cancelled) { setData(d); setDataFor(selected.id) } })
      .catch(() => { if (!cancelled && !cached?.cardType) { setError(true); setDataFor(selected.id) } })
    return () => { cancelled = true }
  }, [businessId, selected?.id, reload])

  const ready = !!selected && dataFor === selected.id && !error && data?.cardId === selected.id

  return (
    <>
      <style>{`
        .rw-shell{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .rw-toolbar{display:flex;align-items:center;gap:8px;padding:12px 24px;background:#FFFFFF;border-bottom:1px solid rgba(43,38,32,.08);flex-shrink:0;flex-wrap:wrap;}
        .rw-card-pill{display:flex;align-items:center;gap:6px;font-size:12px;padding:7px 14px;border-radius:20px;border:1.5px solid rgba(43,38,32,.12);background:#FFFFFF;color:rgba(43,38,32,.55);cursor:pointer;transition:all .15s;font-family:'Inter',sans-serif;}
        .rw-card-pill--on{background:#1B412F;border-color:#1B412F;color:#F7F0E4;font-weight:600;}
        .rw-content{flex:1;overflow-y:auto;padding:20px 24px;display:flex;flex-direction:column;gap:14px;}
        .rw-empty-note{font-size:12px;color:rgba(43,38,32,.5);padding:8px 0;line-height:1.5;}
        .rw-error{font-size:12px;color:#8E2F2F;background:rgba(178,59,59,.07);border:1px solid rgba(178,59,59,.2);border-radius:9px;padding:8px 11px;margin-bottom:12px;}
        .rw-notice{font-size:12px;color:#3F6E3E;background:rgba(91,140,90,.1);border:1px solid rgba(91,140,90,.25);border-radius:9px;padding:8px 11px;margin-bottom:12px;}
        .rw-warn{font-size:11.5px;color:#7A5A12;background:rgba(212,162,76,.12);border-radius:9px;padding:8px 11px;margin-top:10px;}
        .rw-hint{font-size:11px;color:rgba(43,38,32,.45);margin-top:10px;line-height:1.5;}
        .rw-card{background:#FFFFFF;border:1px solid rgba(43,38,32,.07);border-radius:14px;padding:16px;box-shadow:0 1px 8px rgba(43,38,32,.04);min-width:0;}
        .rw-card-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:13px;color:#2B2620;margin-bottom:2px;}
        .rw-card-sub{font-size:11px;color:rgba(43,38,32,.45);margin-bottom:14px;}
        .rw-card-head-row{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px;}
        .rw-3col{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
        .rw-2col{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
        .rw-stat-label{font-size:10.5px;color:rgba(43,38,32,.5);margin-bottom:6px;}
        .rw-stat-val{font-family:'Plus Jakarta Sans',sans-serif;font-size:24px;font-weight:800;color:#2B2620;}
        .rw-stat-sub{font-size:10.5px;color:rgba(43,38,32,.45);margin-top:3px;line-height:1.4;}
        .rw-stat--good{border-color:rgba(91,140,90,.3);background:rgba(91,140,90,.05);}
        .rw-stat--good .rw-stat-val{color:#3F6E3E;}
        .rw-reward-summary{display:flex;align-items:center;gap:14px;flex-wrap:wrap;}
        .rw-reward-main{font-family:'Plus Jakarta Sans',sans-serif;font-size:17px;font-weight:800;color:#C75D3A;margin:4px 0 6px;}
        .rw-reward-sub{font-size:12px;color:rgba(43,38,32,.6);line-height:1.6;margin-top:2px;}
        .rw-chip{display:inline-block;font-size:11px;font-weight:600;padding:2px 9px;border-radius:20px;background:rgba(199,93,58,.1);color:#C75D3A;margin:0 4px 4px 0;}
        .rw-secondary-btn{font-size:12px;font-weight:600;border:1px solid rgba(43,38,32,.18);background:#fff;color:#2B2620;border-radius:9px;padding:8px 14px;cursor:pointer;font-family:inherit;white-space:nowrap;}
        .rw-secondary-btn:hover:not(:disabled){border-color:rgba(43,38,32,.35);}
        .rw-secondary-btn:disabled{opacity:.45;cursor:not-allowed;}
        .rw-dist-list{display:flex;flex-direction:column;gap:10px;}
        .rw-dist-row{display:flex;align-items:center;gap:12px;}
        .rw-dist-name{font-size:12px;color:#2B2620;font-weight:500;width:140px;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .rw-dist-bar-wrap{flex:1;height:12px;background:rgba(43,38,32,.06);border-radius:6px;overflow:hidden;}
        .rw-dist-bar{height:100%;background:linear-gradient(90deg,#C75D3A,#D4A24C);border-radius:6px;transition:width .4s;}
        .rw-dist-count{font-size:11px;font-weight:600;color:rgba(43,38,32,.5);width:80px;text-align:right;flex-shrink:0;}
        .rw-table{width:100%;border-collapse:collapse;}
        .rw-table thead{border-bottom:1px solid rgba(43,38,32,.08);}
        .rw-table th{text-align:left;font-size:9.5px;text-transform:uppercase;letter-spacing:.05em;color:rgba(43,38,32,.4);font-weight:700;padding:8px 10px;}
        .rw-table td{padding:10px 10px;font-size:12px;color:rgba(43,38,32,.8);border-bottom:1px solid rgba(43,38,32,.05);vertical-align:middle;}
        .rw-table tr:last-child td{border-bottom:none;}
        .rw-row--off td{opacity:.55;}
        .rw-time-col{color:rgba(43,38,32,.45);font-size:11px;text-align:right;white-space:nowrap;}
        .rw-muted{color:rgba(43,38,32,.55);}
        .rw-av-row{display:flex;align-items:center;gap:8px;}
        .rw-av{width:26px;height:26px;border-radius:50%;background:#C75D3A;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff;flex-shrink:0;}
        .rw-link{background:none;border:none;padding:0;cursor:pointer;font:inherit;color:#2B2620;text-align:left;}
        .rw-link:hover{color:#C75D3A;text-decoration:underline;}
        .rw-prize-tag{font-size:11px;padding:3px 10px;border-radius:20px;background:rgba(199,93,58,.1);color:#C75D3A;font-weight:600;white-space:nowrap;}
        .rw-pts-badge{font-size:11px;padding:3px 10px;border-radius:20px;background:rgba(24,95,165,.1);color:#185FA5;font-weight:700;white-space:nowrap;}
        .rw-item-name{font-size:12px;color:#2B2620;font-weight:500;}
        .rw-paused{font-size:10px;font-weight:700;margin-left:8px;padding:2px 8px;border-radius:20px;background:rgba(43,38,32,.08);color:rgba(43,38,32,.55);}
        .rw-actions{display:flex;gap:6px;justify-content:flex-end;align-items:center;}
        .rw-confirm-row{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;font-size:12px;color:#2B2620;background:rgba(178,59,59,.05);border-radius:8px;padding:6px 8px;}
        .rw-icon-btn{background:none;border:none;cursor:pointer;color:rgba(43,38,32,.45);padding:5px;border-radius:6px;display:flex;align-items:center;transition:color .15s;}
        .rw-icon-btn:hover:not(:disabled){color:#2B2620;background:rgba(43,38,32,.05);}
        .rw-icon-btn--danger:hover:not(:disabled){color:#B23B3B;}
        .rw-icon-btn:disabled{opacity:.25;cursor:not-allowed;}
        .rw-mini-btn{font-size:11px;font-weight:600;border:1px solid rgba(43,38,32,.15);background:#fff;color:rgba(43,38,32,.7);border-radius:7px;padding:5px 9px;cursor:pointer;font-family:inherit;white-space:nowrap;}
        .rw-mini-btn--primary{background:#C75D3A;border-color:#C75D3A;color:#fff;}
        .rw-mini-btn--danger{background:#B23B3B;border-color:#B23B3B;color:#fff;}
        .rw-add-btn{display:flex;align-items:center;gap:6px;font-size:12px;background:#C75D3A;color:#fff;border:none;border-radius:9px;padding:8px 16px;cursor:pointer;font-weight:700;font-family:'Plus Jakarta Sans',sans-serif;white-space:nowrap;}
        .rw-add-btn:disabled{opacity:.6;}
        .rw-add-form{display:flex;gap:8px;align-items:center;padding:12px;background:#FBF6EE;border-radius:10px;margin-bottom:14px;flex-wrap:wrap;}
        .rw-input{padding:8px 11px;font-size:12px;border:1px solid rgba(43,38,32,.15);border-radius:8px;background:#FFFFFF;color:#2B2620;font-family:'Inter',sans-serif;outline:none;flex:1;min-width:160px;}
        .rw-input--sm{max-width:100px;min-width:80px;flex:none;}
        .rw-input:focus,.rw-inline-input:focus{border-color:#C75D3A;}
        .rw-confirm-btn{background:#C75D3A;color:#fff;border:none;border-radius:8px;padding:8px 14px;font-size:12px;cursor:pointer;font-weight:600;font-family:inherit;}
        .rw-confirm-btn:disabled{opacity:.5;cursor:default;}
        .rw-cancel-btn{background:none;border:1px solid rgba(43,38,32,.15);border-radius:8px;padding:8px 14px;font-size:12px;cursor:pointer;color:rgba(43,38,32,.55);font-family:inherit;}
        .rw-inline-input{padding:6px 9px;font-size:12px;border:1px solid rgba(43,38,32,.18);border-radius:7px;background:#fff;color:#2B2620;font-family:'Inter',sans-serif;outline:none;width:100%;min-width:0;}
        .rw-inline-input:disabled{background:rgba(43,38,32,.04);color:rgba(43,38,32,.5);}
        .rw-inline-input--sm{max-width:74px;}
        .rw-tier-grid{display:grid;grid-template-columns:repeat(var(--n),1fr);gap:12px;}
        .rw-tier-badge{display:inline-block;font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;margin-bottom:8px;}
        .rw-tier-members{font-family:'Plus Jakarta Sans',sans-serif;font-size:26px;font-weight:800;}
        .rw-tier-sub{font-size:11px;margin-top:2px;opacity:.75;}
        .rw-tier-editor{display:flex;flex-direction:column;gap:8px;}
        .rw-tier-row{display:grid;grid-template-columns:30px minmax(100px,1fr) 190px minmax(140px,2fr) 30px;gap:10px;align-items:center;}
        .rw-tier-row--head span{font-size:9.5px;text-transform:uppercase;letter-spacing:.05em;color:rgba(43,38,32,.4);font-weight:700;}
        .rw-visits{display:flex;align-items:center;gap:6px;font-size:11px;color:rgba(43,38,32,.5);white-space:nowrap;}
        .rw-swatch{width:26px;height:26px;border-radius:8px;border:2px solid;cursor:pointer;padding:0;}
        .rw-palette{position:absolute;top:32px;left:0;z-index:20;background:#fff;border:1px solid rgba(43,38,32,.12);border-radius:10px;padding:8px;display:grid;grid-template-columns:repeat(4,26px);gap:6px;box-shadow:0 8px 24px rgba(43,38,32,.15);}
        .rw-editor-foot{display:flex;align-items:center;gap:8px;margin-top:14px;flex-wrap:wrap;}
        .rw-skel{background:rgba(43,38,32,.07);border-radius:8px;animation:rwPulse 1.2s ease-in-out infinite;}
        @keyframes rwPulse{0%,100%{opacity:.45}50%{opacity:1}}
        @media(max-width:900px){.rw-tier-grid{grid-template-columns:repeat(3,1fr);}}
        @media(max-width:768px){
          .rw-3col,.rw-2col{grid-template-columns:1fr;}
          .rw-tier-grid{grid-template-columns:1fr 1fr;}
          .rw-content{padding:14px 16px;}
          .rw-card-head-row{flex-direction:column;}
          .rw-add-btn{width:100%;justify-content:center;}
          .rw-toolbar{padding:10px 14px;}
          .rw-tier-row{grid-template-columns:30px 1fr 30px;grid-template-areas:"sw name del" "vis vis vis" "perk perk perk";}
          .rw-tier-row > :nth-child(1){grid-area:sw;} .rw-tier-row > :nth-child(2){grid-area:name;} .rw-tier-row > :nth-child(3){grid-area:vis;} .rw-tier-row > :nth-child(4){grid-area:perk;} .rw-tier-row > :nth-child(5){grid-area:del;}
          .rw-tier-row:not(.rw-tier-row--head){padding:10px;border:1px solid rgba(43,38,32,.08);border-radius:10px;}
          .rw-tier-row--head{display:none;}
          .rw-dist-name{width:100px;}
        }
      `}</style>

      <div className="rw-shell">
        {activeCards.length > 1 && (
          <div className="rw-toolbar">
            <CardSwitcher value={selected?.id || ''} onChange={setSelectedId} options={activeCards.map(c => ({ id: c.id, label: c.name }))} />
          </div>
        )}
        {!selected ? (
          <div className="rw-content"><div className="rw-card"><div className="rw-empty-note">Activá una tarjeta en Diseño para configurar sus premios.</div><button className="rw-secondary-btn" onClick={onGoToDesign}>Ir a Diseño</button></div></div>
        ) : error && dataFor === selected.id ? (
          <div className="rw-content"><div className="rw-error" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>No pudimos cargar los premios. <button className="rw-mini-btn" onClick={() => { setDataFor(null); setReload(n => n + 1) }}>Reintentar</button></div></div>
        ) : !ready ? (
          <div className="rw-content"><MascotLoader text="Buscando tus premios…" /></div>
        ) : selected.type === 'stamp' ? (
          <StampRewards data={data} onGoToDesign={onGoToDesign} onOpenCustomer={onOpenCustomer} />
        ) : selected.type === 'points' ? (
          <PointsRewards businessId={businessId!} cardId={selected.id} data={data} onOpenCustomer={onOpenCustomer} onChanged={() => setReload(n => n + 1)} />
        ) : (
          <MembershipRewards businessId={businessId!} cardId={selected.id} data={data} onChanged={() => setReload(n => n + 1)} />
        )}
      </div>
    </>
  )
}
