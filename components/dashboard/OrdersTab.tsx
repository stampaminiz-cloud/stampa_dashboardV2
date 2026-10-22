'use client'
// Pedidos (Pro). Dos vistas:
//   Página de pedido  productos (hasta 30, por unidad, por kilo o por 100 g,
//                     con pausa "sin stock"), días y zonas de reparto,
//                     anticipación, pedido mínimo y formas de pago (según
//                     el país: en España, Bizum en lugar de Mercado Pago). A la derecha, la página en vivo.
//   Pedidos recibidos los que mandaron los clientes; se marcan entregados.
// Backend: routes/orders.js y services/orders.js. La página pública es
// app/p/[customerId]. Fuera de Pro se ve bloqueada.
import React, { useEffect, useRef, useState } from 'react'
import { BASE_URL } from '@/lib/api'
import { formatMoney } from '@/lib/money'
import { Icon } from '@/components/ui/Icon'
import { Switch } from '@/components/ui/Switch'
import { MascotLoader } from '@/components/ui/MascotLoader'
import { readCache, getJson, writeCache } from '@/lib/cache'

type Product = { _id?: string; name: string; price: number | string; unit: 'unidad' | 'kg' | '100g'; active: boolean }
type Settings = { enabled: boolean; products: Product[]; days: number[]; leadHours: number; minTotal: number; payments: string[]; zones: string[] }
type Order = { _id: string; customerName: string; deliveryDate: string; items: { name: string; unit: string; qty: number }[]; total: number; status: 'enviado' | 'entregado' | 'cancelado'; address: string; zone?: string; payment: string | null; note: string; createdAt: string }

const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const DAY_FULL = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
const LEADS = [0, 12, 24, 48, 72]
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('stampa_token') })
const UNITS: { key: Product['unit']; label: string }[] = [
  { key: 'unidad', label: 'Por unidad' },
  { key: 'kg', label: 'Por kilo (de a ½ kg)' },
  { key: '100g', label: 'Por 100 gramos' },
]
const PER = { unidad: 'c/u', kg: 'el kg', '100g': 'los 100 g' } as Record<string, string>
const comma = (n: number) => String(n).replace('.', ',')
const qtyText = (q: number, unit: string) => unit === 'kg' ? `${comma(q)} kg` : unit === '100g' ? (q >= 10 ? `${comma(q / 10)} kg` : `${q * 100} g`) : `${q}`
const fmtDate = (ymd: string) => { const [, m, d] = ymd.split('-'); const wd = new Date(`${ymd}T12:00:00Z`).getUTCDay(); return `${['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'][wd]} ${d}/${m}` }

export function OrdersTab({ businessId, isManager = false, onChoosePlan, onOpenSettings, cardColor = '#1B412F', cardText = '#FFFFFF', businessName }: {
  businessId?: string | null; isManager?: boolean; onChoosePlan: () => void; onOpenSettings: () => void; cardColor?: string; cardText?: string; businessName: string
}) {
  const [view, setView] = useState<'page' | 'orders'>('page')
  const [data, setData] = useState<any>(null)
  const [s, setS] = useState<Settings | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState<'all' | 'enviado' | 'entregado'>('all')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [zoneDraft, setZoneDraft] = useState('')
  const [zoneFilter, setZoneFilter] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!businessId) return
    // Precargado con el resto del panel (page.tsx → prefetch).
    const path = `/api/businesses/${businessId}/orders/settings`
    const use = (d: any) => { setData(d); setS({ ...d.settings, zones: d.settings.zones || [], products: (d.settings.products || []).map((p: any) => ({ ...p })) }) }
    const cached = readCache<any>(path)
    if (cached) use(cached)
    getJson<any>(path).then(use).catch(() => { if (!cached) setLoadError(true) })
    loadOrders()
  }, [businessId]) // eslint-disable-line react-hooks/exhaustive-deps

  function loadOrders() {
    if (!businessId) return
    fetch(`${BASE_URL}/api/businesses/${businessId}/orders?limit=100`, { headers: authHeaders() })
      .then(r => (r.ok ? r.json() : { orders: [] }))
      .then(d => setOrders(d.orders || []))
      .catch(() => {})
  }

  if (loadError) return <div className="od-content"><style>{CSS}</style><div className="od-note">No pudimos cargar Pedidos. Recargá la página.</div></div>
  if (!data || !s) return <div className="od-content"><style>{CSS}</style><MascotLoader text="Cargando Pedidos…" /></div>

  if (!data.allowed) return (
    <div className="od-content"><style>{CSS}</style>
      <div className="od-card od-locked">
        <div className="od-locked-ic"><Icon name="candado" size={20} /></div>
        <h2>Pedidos está disponible en el plan Pro</h2>
        <p>Tus clientes arman el pedido desde su tarjeta, con tus productos y precios, el día de entrega y la dirección, y te llega escrito a tu WhatsApp.</p>
        {isManager ? <p className="od-note">Avisale al dueño.</p> : <button type="button" className="s-btn s-btn--primary" onClick={onChoosePlan}>Ver planes</button>}
      </div>
    </div>
  )

  const cur = data.currency
  const setP = (i: number, patch: Partial<Product>) => { setMsg(null); setS({ ...s, products: s.products.map((p, j) => (j === i ? { ...p, ...patch } : p)) }) }
  const toggle = <K extends 'days' | 'payments'>(k: K, v: any) => { setMsg(null); setS({ ...s, [k]: (s[k] as any[]).includes(v) ? (s[k] as any[]).filter(x => x !== v) : [...(s[k] as any[]), v] }) }

  // Enter en un producto agrega otro abajo y pone el cursor en su nombre.
  function addProduct() {
    if (isManager || s!.products.length >= data.maxProducts) return
    setS({ ...s!, products: [...s!.products, { name: '', price: '', unit: 'unidad', active: true }] })
    setTimeout(() => {
      const names = listRef.current?.querySelectorAll<HTMLInputElement>('input[data-name]')
      names?.[names.length - 1]?.focus()
    }, 0)
  }
  const onEnter = (e: React.KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); addProduct() } }

  function addZone() {
    const z = zoneDraft.trim().slice(0, 40)
    if (!z || s!.zones.length >= data.maxZones || s!.zones.some(x => x.toLowerCase() === z.toLowerCase())) { setZoneDraft(''); return }
    setMsg(null); setS({ ...s!, zones: [...s!.zones, z] }); setZoneDraft('')
  }

  async function save() {
    if (busy || isManager) return
    setBusy(true); setMsg(null)
    try {
      const body = { ...s, products: s!.products.filter(p => String(p.name).trim()).map(p => ({ ...p, price: Number(String(p.price).replace(',', '.')) || 0 })) }
      const r = await fetch(`${BASE_URL}/api/businesses/${businessId}/orders/settings`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(body) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw d
      setS({ ...d.settings, products: d.settings.products.map((p: any) => ({ ...p })) })
      setData({ ...data, configured: true, settings: d.settings })
      writeCache(`/api/businesses/${businessId}/orders/settings`, { ...data, configured: true, settings: d.settings })
      setMsg({ ok: true, text: 'Guardado. La página de pedido ya está al día.' })
    } catch (err: any) {
      setMsg({ ok: false, text: err?.error || 'No se pudo guardar.' })
    } finally {
      setBusy(false)
    }
  }

  async function setStatus(o: Order, status: Order['status']) {
    const prev = orders
    setOrders(orders.map(x => (x._id === o._id ? { ...x, status } : x)))
    const r = await fetch(`${BASE_URL}/api/businesses/${businessId}/orders/${o._id}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ status }) }).catch(() => null)
    if (!r?.ok) setOrders(prev)
  }

  const orderZones = Array.from(new Set(orders.map(o => o.zone).filter(Boolean))) as string[]
  const shown = orders.filter(o => o.status !== 'cancelado' && (filter === 'all' || o.status === filter) && (!zoneFilter || o.zone === zoneFilter))
  const pending = orders.filter(o => o.status === 'enviado').length
  const sample = s.products.filter(p => p.active && String(p.name).trim()).slice(0, 4)

  return (
    <div className="od-content">
      <style>{CSS}</style>
      <div className="s-tabs od-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={view === 'page'} className="s-tab" onClick={() => setView('page')}>Página de pedido</button>
        <button type="button" role="tab" aria-selected={view === 'orders'} className="s-tab" onClick={() => { setView('orders'); loadOrders() }}>Pedidos recibidos{pending ? ` · ${pending}` : ''}</button>
      </div>

      {!data.hasWhatsapp && (
        <div className="s-notice s-notice--warn">
          <span>Para que tus clientes puedan pedir, cargá tu WhatsApp y marcá un botón como "Con pedido".</span>
          {!isManager && <button type="button" className="s-btn s-btn--text s-btn--sm" onClick={onOpenSettings}>Ir a Configuración</button>}
        </div>
      )}

      {view === 'page' ? (
        <div className="od-cols">
          <div className="od-left">
            <div className="od-card">
              <div className="od-title">Productos <span className="od-count">{s.products.length} de {data.maxProducts}</span></div>
              <div className="od-prod od-prod--head"><span>Producto</span><span>Precio</span><span>Cómo se vende</span><span>Activo</span><span /></div>
              <div ref={listRef} className="od-prods">
              {s.products.map((p, i) => (
                <div key={p._id || `n${i}`} className="od-prod">
                  <input className="od-input" data-name value={p.name} maxLength={40} placeholder="Ej: Vacío" disabled={isManager} onKeyDown={onEnter} aria-label={`Nombre del producto ${i + 1}`} onChange={e => setP(i, { name: e.target.value })} />
                  <input className="od-input od-num" inputMode="decimal" value={p.price} disabled={isManager} onKeyDown={onEnter} aria-label={`Precio de ${p.name || 'el producto'}`} onChange={e => setP(i, { price: e.target.value })} />
                  <select className="od-input" value={p.unit} disabled={isManager} aria-label={`Unidad de ${p.name || 'el producto'}`} onChange={e => setP(i, { unit: e.target.value as Product['unit'] })}>
                    {UNITS.map(u => <option key={u.key} value={u.key}>{u.label}</option>)}
                  </select>
                  <Switch checked={p.active} disabled={isManager} label={`${p.name || 'Producto'}: ${p.active ? 'activo' : 'sin stock'}`} onChange={v => setP(i, { active: v })} />
                  {!isManager ? <button type="button" className="od-x" aria-label={`Quitar ${p.name || 'el producto'}`} onClick={() => setS({ ...s, products: s.products.filter((_, j) => j !== i) })}><Icon name="cerrar" size={14} /></button> : <span />}
                </div>
              ))}
              </div>
              {!isManager && s.products.length < data.maxProducts && (
                <button type="button" className="s-btn s-btn--secondary s-btn--sm od-add" onClick={addProduct}><Icon name="agregar" size={14} />Agregar producto</button>
              )}
              <div className="od-note">El precio es por esa unidad: por kilo, el precio del kilo; por 100 gramos, el de 100 g. Con Enter agregás otro producto. Si pausás uno, tu cliente lo ve con "Sin stock" y no lo puede pedir.</div>
            </div>

            <div className="od-card">
              <div className="od-title">Entregas y pago</div>
              <div className="od-row"><span className="od-k">Días de reparto</span>
                <div className="od-days">{DAYS.map((l, d) => <button key={d} type="button" disabled={isManager} aria-pressed={s.days.includes(d)} aria-label={DAY_FULL[d]} className={`od-day${s.days.includes(d) ? ' is-on' : ''}`} onClick={() => toggle('days', d)}>{l}</button>)}</div>
              </div>
              <div className="od-row"><span className="od-k">Zonas de reparto</span>
                <div className="od-zones">
                  {s.zones.map(z => (
                    <span key={z} className="od-zone">{z}{!isManager && <button type="button" aria-label={`Quitar ${z}`} onClick={() => { setMsg(null); setS({ ...s, zones: s.zones.filter(x => x !== z) }) }}><Icon name="cerrar" size={12} /></button>}</span>
                  ))}
                  {!isManager && s.zones.length < data.maxZones && (
                    <input className="od-input od-zone-in" value={zoneDraft} maxLength={40} placeholder={s.zones.length ? 'Otra zona' : 'Ej: Palermo'} aria-label="Agregar zona de reparto"
                      onChange={e => setZoneDraft(e.target.value)} onBlur={addZone} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addZone() } }} />
                  )}
                </div>
              </div>
              <div className="od-row"><span className="od-k">Anticipación</span>
                <select className="od-input od-short" value={s.leadHours} disabled={isManager} onChange={e => setS({ ...s, leadHours: Number(e.target.value) })}>
                  {LEADS.map(h => <option key={h} value={h}>{h ? `${h} horas` : 'Sin anticipación'}</option>)}
                </select>
              </div>
              <div className="od-row"><span className="od-k">Pedido mínimo</span>
                <input className="od-input od-short od-num" inputMode="numeric" value={s.minTotal || ''} placeholder="Sin mínimo" disabled={isManager} onChange={e => setS({ ...s, minTotal: Number(e.target.value.replace(/\D/g, '')) || 0 })} />
              </div>
              <div className="od-row"><span className="od-k">Formas de pago</span>
                <div className="od-chips">{data.payments.map((p: any) => <button key={p.key} type="button" disabled={isManager} className="s-chip" aria-pressed={s.payments.includes(p.key)} onClick={() => toggle('payments', p.key)}>{p.label}</button>)}</div>
              </div>
              <div className="od-note">Si cargás zonas, tu cliente elige la suya al pedir y podés ver los pedidos agrupados por zona. Sin zonas, solo deja la dirección. Stampa no cobra los pedidos: el cliente avisa cómo va a pagar y vos le confirmás el total por WhatsApp.</div>
            </div>

            {!isManager && (
              <div className="od-actions">
                <button type="button" className="s-btn s-btn--primary" disabled={busy} onClick={save}>{busy ? 'Guardando…' : 'Guardar'}</button>
                {msg && <div className={`s-notice s-notice--${msg.ok ? 'ok' : 'error'}`}>{msg.text}</div>}
              </div>
            )}
          </div>

          <div className="od-preview" aria-label="Así lo ve tu cliente">
            <div className="od-pv-label">Así lo ve tu cliente</div>
            <div className="od-pv-phone">
              <div className="od-pv-head" style={{ background: cardColor, color: cardText }}><b>{businessName}</b><span>Hola, Lucía{s.leadHours ? ` · Pedí con ${s.leadHours} horas de anticipación` : ''}</span></div>
              <div className="od-pv-box">
                {sample.length ? sample.map((p, i) => (
                  <div key={i} className="od-pv-item"><span>{p.name}<small>{formatMoney(Number(String(p.price).replace(',', '.')) || 0, cur)} {PER[p.unit]}</small></span><span className="od-pv-q">− 0 +</span></div>
                )) : <div className="od-note">Tus productos aparecen acá.</div>}
              </div>
              <div className="od-pv-box">
                <small className="od-pv-k">DÍAS DE ENTREGA</small>
                <div className="od-pv-days">{DAYS.map((l, d) => <span key={d} className={s.days.includes(d) ? '' : 'off'}>{l}</span>)}</div>
                {s.zones.length > 0 && <><small className="od-pv-k">ZONA</small><div className="od-chips">{s.zones.slice(0, 6).map(z => <span key={z} className="od-pv-chip">{z}</span>)}</div></>}
                {s.payments.length > 0 && <><small className="od-pv-k">¿CÓMO PAGÁS?</small><div className="od-chips">{s.payments.map(k => <span key={k} className="od-pv-chip">{data.payments.find((p: any) => p.key === k)?.label}</span>)}</div></>}
              </div>
              <div className="od-pv-bar"><span>Total aproximado</span><b>{formatMoney(0, cur)}</b></div>
              <div className="od-pv-send">{s.minTotal ? `Mínimo ${formatMoney(s.minTotal, cur)}` : 'Enviar por WhatsApp'}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="od-card">
          <div className="od-filters">
            {([['all', 'Todos'], ['enviado', 'Por entregar'], ['entregado', 'Entregados']] as const).map(([k, l]) => <button key={k} type="button" className="s-chip" aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}</button>)}
            {orderZones.length > 0 && (
              <select className="od-input od-short od-zone-f" value={zoneFilter} aria-label="Filtrar por zona" onChange={e => setZoneFilter(e.target.value)}>
                <option value="">Todas las zonas</option>
                {orderZones.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            )}
          </div>
          {!shown.length ? <div className="od-empty">Todavía no hay pedidos{filter !== 'all' ? ' acá' : ''}. Llegan cuando un cliente toca el botón "Con pedido" de su tarjeta.</div> : (
            <div className="od-list">
              <div className="od-o od-o--head"><span>Cliente</span><span>Entrega</span><span>Pedido</span><span>Total aprox.</span><span>Estado</span></div>
              {shown.map(o => (
                <div key={o._id} className="od-o">
                  <span className="od-o-name">{o.customerName}<small>{[o.zone, o.address].filter(Boolean).join(' · ')}</small></span>
                  <span>{fmtDate(o.deliveryDate)}</span>
                  <span className="od-o-items">{o.items.map(i => `${i.name}: ${qtyText(i.qty, i.unit)}`).join(' · ')}{o.note && <small>Aclaración: {o.note}</small>}</span>
                  <span className="od-num">{formatMoney(o.total, cur)}</span>
                  <span>
                    {o.status === 'entregado'
                      ? <span className="od-pill od-pill--ok">Entregado</span>
                      : <button type="button" className="s-btn s-btn--secondary s-btn--sm" disabled={isManager && false} onClick={() => setStatus(o, 'entregado')}>Marcar entregado</button>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const CSS = `
  .od-content{flex:1;overflow-y:auto;padding:20px 24px;display:flex;flex-direction:column;gap:14px;}
  .od-tabs{align-self:flex-start;}
  .od-prods{display:flex;flex-direction:column;gap:10px;}
  .od-zones{display:flex;flex-wrap:wrap;gap:6px;align-items:center;flex:1;min-width:0;}
  .od-zone{display:inline-flex;align-items:center;gap:4px;border:1px solid var(--s-linea);border-radius:999px;padding:4px 6px 4px 11px;font-size:12.5px;background:var(--s-salvia);}
  .od-zone button{border:none;background:none;color:var(--s-tinta-2);cursor:pointer;padding:2px;display:flex;border-radius:50%;}
  .od-zone-in{width:140px;padding:6px 10px;}
  .od-zone-f{margin-left:auto;}
  .od-cols{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:16px;align-items:start;}
  .od-left{display:flex;flex-direction:column;gap:14px;min-width:0;}
  .od-card{background:var(--s-blanco);border:1px solid var(--s-linea);border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:10px;min-width:0;}
  .od-title{font-family:var(--font-display);font-weight:700;font-size:15px;display:flex;align-items:center;gap:8px;}
  .od-count{font-family:var(--font-body);font-weight:400;font-size:12px;color:var(--s-tinta-3);}
  .od-prod{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(70px,.7fr) minmax(150px,1.1fr) 40px 28px;gap:8px;align-items:center;}
  .od-prod--head{font-size:11px;color:var(--s-tinta-3);}
  .od-input{padding:8px 10px;font-size:13px;border:1px solid var(--s-linea);border-radius:8px;background:var(--s-blanco);color:var(--s-tinta);width:100%;min-width:0;}
  .od-input:focus{outline:2px solid var(--s-brasa);outline-offset:1px;}
  .od-short{max-width:180px;}
  .od-num{font-variant-numeric:tabular-nums;}
  .od-x{width:28px;height:28px;border-radius:8px;border:1px solid var(--s-linea);background:var(--s-blanco);color:var(--s-tinta-2);display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;}
  .od-add{align-self:flex-start;}
  .od-note{font-size:12px;color:var(--s-tinta-2);line-height:1.45;}
  .od-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:6px 0;border-top:1px solid var(--s-linea);}
  .od-row:first-of-type{border-top:none;}
  .od-k{font-size:12.5px;color:var(--s-tinta-2);min-width:120px;}
  .od-days{display:flex;gap:6px;}
  .od-day{width:32px;height:32px;border-radius:50%;border:1.5px solid var(--s-linea);background:var(--s-blanco);font-size:12px;font-weight:700;color:var(--s-tinta-2);cursor:pointer;padding:0;}
  .od-day.is-on{background:var(--s-pino);border-color:var(--s-pino);color:#fff;}
  .od-chips{display:flex;flex-wrap:wrap;gap:6px;}
  .od-actions{display:flex;flex-direction:column;gap:8px;align-items:flex-start;}
  .od-preview{background:var(--s-blanco);border:1px solid var(--s-linea);border-radius:14px;padding:16px;position:sticky;top:0;}
  .od-pv-label{font-size:12.5px;font-weight:600;margin-bottom:10px;}
  .od-pv-phone{background:var(--s-salvia);border-radius:18px;padding:10px;display:flex;flex-direction:column;gap:8px;}
  .od-pv-head{border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:3px;}
  .od-pv-head b{font-family:var(--font-display);font-size:16px;}
  .od-pv-head span{font-size:11.5px;opacity:.9;}
  .od-pv-box{background:var(--s-blanco);border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:6px;font-size:12.5px;}
  .od-pv-item{display:flex;justify-content:space-between;gap:8px;}
  .od-pv-item small{display:block;font-size:11px;color:var(--s-tinta-2);}
  .od-pv-q{color:var(--s-tinta-2);white-space:nowrap;}
  .od-pv-k{font-size:10px;letter-spacing:.06em;color:var(--s-tinta-3);}
  .od-pv-days{display:flex;gap:4px;}
  .od-pv-days span{flex:1;text-align:center;border:1px solid var(--s-linea);border-radius:6px;padding:3px 0;font-size:11px;}
  .od-pv-days span.off{background:var(--s-hueco);color:var(--s-tinta-3);}
  .od-pv-chip{border:1px solid var(--s-linea);border-radius:999px;padding:2px 9px;font-size:11px;}
  .od-pv-bar{display:flex;justify-content:space-between;font-size:12.5px;background:var(--s-blanco);border-radius:10px;padding:8px 10px;}
  .od-pv-send{background:#1F7A4A;color:#fff;border-radius:10px;padding:9px;text-align:center;font-size:12.5px;font-weight:600;}
  .od-filters{display:flex;gap:6px;flex-wrap:wrap;}
  .od-empty{font-size:13px;color:var(--s-tinta-2);padding:20px 0;}
  .od-list{display:flex;flex-direction:column;}
  .od-o{display:grid;grid-template-columns:minmax(0,1.2fr) 80px minmax(0,2fr) 110px 140px;gap:12px;align-items:center;padding:10px 0;border-top:1px solid var(--s-linea);font-size:13px;}
  .od-o--head{border-top:none;font-size:11px;color:var(--s-tinta-3);padding-top:0;}
  .od-o small{display:block;font-size:11.5px;color:var(--s-tinta-2);}
  .od-o-name{font-weight:600;min-width:0;}
  .od-o-items{min-width:0;}
  .od-pill{font-size:11.5px;font-weight:600;border-radius:999px;padding:3px 10px;}
  .od-pill--ok{background:var(--s-listo-suave);color:var(--s-listo);}
  .od-locked{align-items:center;text-align:center;max-width:520px;margin:24px auto;padding:32px 24px;}
  .od-locked h2{font-family:var(--font-display);font-size:18px;}
  .od-locked p{font-size:13px;color:var(--s-tinta-2);line-height:1.55;}
  .od-locked-ic{width:44px;height:44px;border-radius:12px;background:var(--s-brasa-suave);color:var(--s-brasa);display:flex;align-items:center;justify-content:center;}
  @media(max-width:980px){.od-cols{grid-template-columns:1fr;}.od-preview{position:static;}}
  @media(max-width:700px){.od-content{padding:14px 16px;}.od-prod{grid-template-columns:minmax(0,1fr) 80px 40px 28px;}.od-prod>select{grid-column:1 / 2;}.od-prod--head{display:none;}.od-o{grid-template-columns:1fr auto;}.od-o--head{display:none;}}
`
