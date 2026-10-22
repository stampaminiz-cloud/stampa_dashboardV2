'use client'
// Página de pedido (Pedidos, Pro). La abre el cliente desde el botón "con
// pedido" de su tarjeta (/api/w → /p/:customerId). Una sola página: productos,
// días (uno o varios: el mismo pedido se repite en cada entrega), zona,
// dirección, aclaraciones y forma de pago; abajo, fija, la barra con el
// total y el botón, que dice qué falta. El total se recalcula en el backend
// (services/orders.js) y el pedido llega escrito al WhatsApp del negocio.
import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { BASE_URL } from '@/lib/api'
import { formatMoney } from '@/lib/money'
import { MascotLoader } from '@/components/ui/MascotLoader'

type Product = { id: string; name: string; price: number; unit: 'unidad' | 'kg' | '100g'; active: boolean }
type Day = { date: string; label: string; dayNum: number; long: string; available: boolean; reason: string | null }
type Page = {
  voice: 'vos' | 'tu'
  business: { name: string; region: string }
  card: { color: string; textColor: string; logoUrl: string | null }
  customer: { firstName: string; address: string; zone: string }
  header: string
  products: Product[]
  days: Day[]
  maxDeliveries: number
  zones: string[]
  minTotal: number
  payments: { key: string; label: string }[]
  currency: any
}

// Por kilo se pide de a ½ kg; por 100 g, de a 100 g (qty cuenta los 100 g).
const step = (p: Product) => (p.unit === 'kg' ? 0.5 : 1)
const comma = (n: number) => String(n).replace('.', ',')
const qtyText = (q: number, p: Product) => p.unit === 'kg' ? `${comma(q)} kg` : p.unit === '100g' ? (q >= 10 ? `${comma(q / 10)} kg` : `${q * 100} g`) : String(q)
const PER = { unidad: 'c/u', kg: 'el kg · de a medio kilo', '100g': 'los 100 g' } as Record<string, string>

export default function OrderPage() {
  const { customerId } = useParams() as { customerId: string }
  const [page, setPage] = useState<Page | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [qty, setQty] = useState<Record<string, number>>({})
  const [dates, setDates] = useState<string[]>([])
  const [zone, setZone] = useState('')
  const [address, setAddress] = useState('')
  const [editAddress, setEditAddress] = useState(false)
  const [note, setNote] = useState('')
  const [payment, setPayment] = useState('')
  const [busy, setBusy] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${BASE_URL}/api/orders/${encodeURIComponent(customerId)}`)
      .then(async r => { const d = await r.json().catch(() => ({})); if (!r.ok) throw d; return d as Page })
      .then(d => { setPage(d); setAddress(d.customer.address || ''); setEditAddress(!d.customer.address); if (d.zones.includes(d.customer.zone)) setZone(d.customer.zone); else if (d.zones.length === 1) setZone(d.zones[0]); if (d.payments.length === 1) setPayment(d.payments[0].key) })
      .catch(err => setLoadError(err?.error || 'No pudimos cargar la página. Probá de nuevo.'))
  }, [customerId])

  const t = page?.voice === 'tu'
    ? { pick: 'Elige al menos un producto', day: 'Elige el día de entrega', zone: 'Elige tu zona', addr: 'Escribe la dirección de entrega', pay: 'Elige cómo vas a pagar', saved: 'La guardamos para la próxima vez.', hello: 'Hola' }
    : { pick: 'Elegí al menos un producto', day: 'Elegí el día de entrega', zone: 'Elegí tu zona', addr: 'Escribí la dirección de entrega', pay: 'Elegí cómo vas a pagar', saved: 'La guardamos para la próxima.', hello: 'Hola' }

  const total = useMemo(() => (page ? page.products.reduce((a, p) => a + (qty[p.id] || 0) * p.price, 0) : 0), [page, qty])
  const count = Object.values(qty).filter(q => q > 0).length

  // Lo que falta, en orden: el botón lo dice y no deja enviar.
  const missing = !page ? null
    : !count ? t.pick
    : page.minTotal && total < page.minTotal ? `Te faltan ${formatMoney(page.minTotal - total, page.currency)} para el mínimo`
    : !dates.length ? t.day
    : page.zones.length && !zone ? t.zone
    : !address.trim() ? t.addr
    : page.payments.length && !payment ? t.pay
    : null

  function change(p: Product, dir: 1 | -1) {
    setSendError(null)
    setQty(q => ({ ...q, [p.id]: Math.max(0, Math.round(((q[p.id] || 0) + dir * step(p)) * 10) / 10) }))
  }

  // Varios días: se tocan de a uno, en el orden del calendario, hasta el máximo.
  function toggleDate(d: string) {
    setSendError(null)
    setDates(ds => ds.includes(d) ? ds.filter(x => x !== d) : ds.length >= page!.maxDeliveries ? ds : [...ds, d].sort())
  }
  const chosen = page ? page.days.filter(d => dates.includes(d.date)) : []

  async function send() {
    if (!page || missing || busy) return
    setBusy(true); setSendError(null)
    try {
      const r = await fetch(`${BASE_URL}/api/orders/${encodeURIComponent(customerId)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: Object.entries(qty).filter(([, q]) => q > 0).map(([productId, q]) => ({ productId, qty: q })), dates, zone: zone || null, address, note, payment: payment || null }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw d
      // En la misma pestaña: el celular abre WhatsApp y la página queda atrás.
      window.location.href = d.whatsappUrl
    } catch (err: any) {
      setSendError(err?.error || 'No pudimos mandar el pedido. Probá de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  if (loadError) return <Shell><div className="op-msg">{loadError}</div></Shell>
  if (!page) return <Shell><MascotLoader text="Cargando tu pedido…" minHeight={320} /></Shell>

  return (
    <Shell color={page.card.color} textColor={page.card.textColor}>
      <header className="op-head">
        {page.card.logoUrl && <img src={page.card.logoUrl} alt="" className="op-logo" />}
        <h1>{page.business.name}</h1>
        <p>{page.customer.firstName ? `${t.hello}, ${page.customer.firstName}` : ''}{page.customer.firstName && page.header ? ' · ' : ''}{page.header}</p>
      </header>

      <section className="op-sec">
        <h2>Productos</h2>
        {page.products.map(p => {
          const q = qty[p.id] || 0
          return (
            <div key={p.id} className={`op-item${p.active ? '' : ' op-item--off'}`}>
              <div className="op-item-info">
                <b>{p.name}</b>
                <small>{formatMoney(p.price, page.currency)} {PER[p.unit]}</small>
              </div>
              {p.active
                ? <div className="op-qty">
                    <button type="button" aria-label={`Quitar ${p.name}`} disabled={!q} onClick={() => change(p, -1)}>−</button>
                    <span aria-live="polite">{q ? qtyText(q, p) : '0'}</span>
                    <button type="button" className="op-plus" aria-label={`Agregar ${p.name}`} onClick={() => change(p, 1)}>+</button>
                  </div>
                : <span className="op-off">Sin stock</span>}
            </div>
          )
        })}
      </section>

      <section className="op-sec">
        <h2>{page.maxDeliveries > 1 ? 'Días de entrega' : 'Día de entrega'}</h2>
        <div className="op-days">
          {page.days.map(d => {
            const on = dates.includes(d.date)
            return (
              <button key={d.date} type="button" disabled={!d.available} aria-pressed={on} className={`op-day${on ? ' is-on' : ''}`}
                title={d.reason || d.long} onClick={() => toggleDate(d.date)}>
                <span>{d.label}</span><b>{d.dayNum}</b>
              </button>
            )
          })}
        </div>
        {page.maxDeliveries > 1 && page.days.some(d => d.available) && (
          <p className="op-note">
            {chosen.length > 1
              ? `${chosen.length} entregas: ${chosen.map(d => d.long).join(', ').replace(/, ([^,]*)$/, ' y $1')}. Te llega lo mismo en cada una.`
              : `${page.voice === 'tu' ? 'Puedes' : 'Podés'} elegir varios días: te llega lo mismo en cada entrega.`}
          </p>
        )}
        {!page.days.some(d => d.available) && <p className="op-note">Por ahora no hay días de entrega disponibles. {page.voice === 'tu' ? 'Escríbenos' : 'Escribinos'} por WhatsApp.</p>}
      </section>

      {page.zones.length > 0 && (
        <section className="op-sec">
          <h2>Zona</h2>
          <div className="op-chips">
            {page.zones.map(z => (
              <button key={z} type="button" aria-pressed={zone === z} className={`op-chip${zone === z ? ' is-on' : ''}`} onClick={() => { setZone(z); setSendError(null) }}>{z}</button>
            ))}
          </div>
        </section>
      )}

      <section className="op-sec">
        <h2>Dirección de entrega</h2>
        {editAddress
          ? <>
              <input className="op-input" value={address} maxLength={140} placeholder="Calle, número, piso y depto" onChange={e => { setAddress(e.target.value); setSendError(null) }} autoComplete="street-address" />
              <p className="op-note">{t.saved}</p>
            </>
          : <div className="op-saved"><span>{address}</span><button type="button" onClick={() => setEditAddress(true)}>Cambiar</button></div>}
      </section>

      <section className="op-sec">
        <h2>Aclaraciones <em>(opcional)</em></h2>
        <textarea className="op-input" rows={2} value={note} maxLength={200} placeholder="Ej: el vacío en dos piezas" onChange={e => setNote(e.target.value)} />
      </section>

      {page.payments.length > 0 && (
        <section className="op-sec">
          <h2>{page.voice === 'tu' ? '¿Cómo pagas?' : '¿Cómo pagás?'}</h2>
          <div className="op-chips">
            {page.payments.map(p => (
              <button key={p.key} type="button" aria-pressed={payment === p.key} className={`op-chip${payment === p.key ? ' is-on' : ''}`} onClick={() => setPayment(p.key)}>{p.label}</button>
            ))}
          </div>
        </section>
      )}

      <div className="op-bar">
        <div className="op-total"><span>{chosen.length > 1 ? 'Total aproximado por entrega' : 'Total aproximado'}</span><b>{formatMoney(total, page.currency)}</b></div>
        {chosen.length > 1 && <p className="op-note op-sum">{chosen.length} entregas: {formatMoney(total * chosen.length, page.currency)} en total</p>}
        <p className="op-note">El negocio te confirma el total por WhatsApp.</p>
        {sendError && <p className="op-err" role="alert">{sendError}</p>}
        <button type="button" className="op-send" disabled={!!missing || busy} onClick={send}>{busy ? 'Enviando…' : missing || 'Enviar por WhatsApp'}</button>
      </div>
    </Shell>
  )
}

function Shell({ children, color = '#1B412F', textColor = '#FFFFFF' }: { children: React.ReactNode; color?: string; textColor?: string }) {
  return (
    <main className="op" style={{ ['--op-color' as any]: color, ['--op-text' as any]: textColor }}>
      <style>{CSS}</style>
      <div className="op-wrap">{children}</div>
    </main>
  )
}

const CSS = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  body{background:var(--s-salvia);color:var(--s-tinta);font-family:var(--font-body);}
  .op{min-height:100dvh;padding:0 0 170px;background:var(--s-salvia);}
  .op-wrap{max-width:520px;margin:0 auto;padding:16px;display:flex;flex-direction:column;gap:12px;}
  .op-msg{padding:48px 8px;text-align:center;color:var(--s-tinta-2);font-size:14px;line-height:1.5;}
  .op-head{background:var(--op-color);color:var(--op-text);border-radius:16px;padding:18px 18px 16px;display:flex;flex-direction:column;gap:6px;}
  .op-logo{width:44px;height:44px;border-radius:12px;object-fit:contain;background:rgba(255,255,255,.12);}
  .op-head h1{font-family:var(--font-display);font-size:22px;font-weight:800;line-height:1.15;}
  .op-head p{font-size:13px;opacity:.9;}
  .op-sec{background:var(--s-blanco);border-radius:14px;padding:14px 16px;display:flex;flex-direction:column;gap:10px;}
  .op-sec h2{font-size:11px;letter-spacing:.07em;text-transform:uppercase;color:var(--s-tinta-3);font-weight:600;}
  .op-sec h2 em{font-style:normal;text-transform:none;letter-spacing:0;}
  .op-item{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:4px 0;}
  .op-item+.op-item{border-top:1px solid var(--s-linea);padding-top:10px;}
  .op-item--off{opacity:.5;}
  .op-item-info{display:flex;flex-direction:column;gap:2px;min-width:0;}
  .op-item-info b{font-size:15px;font-weight:600;}
  .op-item-info small{font-size:12px;color:var(--s-tinta-2);font-variant-numeric:tabular-nums;}
  .op-qty{display:flex;align-items:center;gap:10px;flex-shrink:0;}
  .op-qty span{min-width:44px;text-align:center;font-weight:600;font-variant-numeric:tabular-nums;}
  .op-qty button{width:36px;height:36px;border-radius:50%;border:1.5px solid var(--s-linea);background:var(--s-blanco);font-size:18px;color:var(--s-tinta);cursor:pointer;}
  .op-qty button:disabled{opacity:.35;cursor:default;}
  .op-qty .op-plus{background:var(--s-pino);border-color:var(--s-pino);color:#fff;}
  .op-off{font-size:12px;color:var(--s-tinta-2);}
  .op-sum{text-align:right;margin-top:-4px;font-variant-numeric:tabular-nums;}
  .op-days{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px;}
  .op-day{border:1.5px solid var(--s-linea);background:var(--s-blanco);border-radius:10px;padding:8px 0;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;color:var(--s-tinta);}
  .op-day span{font-size:11px;color:var(--s-tinta-2);}
  .op-day b{font-size:15px;font-weight:600;}
  .op-day:disabled{background:var(--s-hueco);color:var(--s-tinta-3);cursor:default;}
  .op-day:disabled span{color:var(--s-tinta-3);}
  .op-day.is-on{border-color:var(--s-pino);background:rgba(27,65,47,.08);}
  .op-input{width:100%;padding:11px 12px;font-size:15px;border:1.5px solid var(--s-linea);border-radius:10px;background:var(--s-salvia);color:var(--s-tinta);resize:vertical;}
  .op-input:focus{outline:none;border-color:var(--s-pino);background:#fff;}
  .op-saved{display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:15px;}
  .op-saved button{background:none;border:none;color:var(--s-pino);font-weight:600;font-size:13px;cursor:pointer;}
  .op-note{font-size:12px;color:var(--s-tinta-2);line-height:1.45;}
  .op-chips{display:flex;flex-wrap:wrap;gap:8px;}
  .op-chip{border:1.5px solid var(--s-linea);background:var(--s-blanco);border-radius:999px;padding:8px 14px;font-size:14px;color:var(--s-tinta);cursor:pointer;}
  .op-chip.is-on{border-color:var(--s-pino);background:rgba(27,65,47,.08);font-weight:600;}
  .op-bar{position:fixed;left:0;right:0;bottom:0;background:var(--s-blanco);box-shadow:0 -8px 24px rgba(34,32,27,.1);padding:12px 16px calc(12px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:6px;max-width:520px;margin:0 auto;border-radius:16px 16px 0 0;}
  .op-total{display:flex;justify-content:space-between;align-items:baseline;font-variant-numeric:tabular-nums;}
  .op-total span{font-size:13px;color:var(--s-tinta-2);}
  .op-total b{font-family:var(--font-display);font-size:20px;font-weight:800;}
  .op-err{font-size:13px;color:var(--s-error);}
  .op-send{border:none;border-radius:12px;padding:14px;font-size:15px;font-weight:600;background:#1F7A4A;color:#fff;cursor:pointer;}
  .op-send:disabled{background:rgba(31,122,74,.35);cursor:default;}
`
