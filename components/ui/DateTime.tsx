'use client'
// Selectores de fecha y hora del sistema (decididos el 19/10/2026), en lugar
// de los del navegador: en castellano, 24 horas y con lo más usado a un toque.
//   DateTimePicker  programar un envío (accesos rápidos, mes, horarios)
//   TimeField       una hora suelta (horarios de sucursal)
//   DateParts       una fecha conocida, como el cumpleaños (día, mes y año)
// Todos trabajan con los mismos textos que los inputs nativos:
// "YYYY-MM-DDTHH:mm", "HH:mm" y "YYYY-MM-DD".
import React, { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'

const pad = (n: number) => String(n).padStart(2, '0')
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const hm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const DOW_SHORT = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
const HALF_HOURS = Array.from({ length: 48 }, (_, i) => `${pad(Math.floor(i / 2))}:${i % 2 ? '30' : '00'}`)
const SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00']

// "mar 20/10" (o "hoy" / "mañana")
export function shortDay(day: string, today = ymd(new Date())) {
  const d = new Date(`${day}T12:00`)
  const tomorrow = ymd(new Date(Date.now() + 864e5))
  if (day === today) return 'hoy'
  if (day === tomorrow) return 'mañana'
  return `${DOW_SHORT[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`
}

// ─── Programar un envío ───────────────────────────────────────────────────────
export function DateTimePicker({ value, onChange, peakHours = [], minLeadMinutes = 5 }: {
  value: string; onChange: (v: string) => void; peakHours?: number[]; minLeadMinutes?: number
}) {
  const [day, time] = value.split('T')
  const now = new Date(Date.now() + minLeadMinutes * 60e3)
  const today = ymd(new Date()), minHM = hm(now)
  const [month, setMonth] = useState(() => { const d = new Date(`${day}T12:00`); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [otherTime, setOtherTime] = useState(!SLOTS.includes(time))
  const past = (d: string, t: string) => d < today || (d === today && t < minHM)

  function pick(d: string, t = time) {
    // Si la hora ya pasó ese día, se corre al primer horario que quede.
    if (past(d, t)) t = SLOTS.find(s => !past(d, s)) || HALF_HOURS.find(s => !past(d, s)) || t
    onChange(`${d}T${t}`)
  }
  const sat = (() => { const d = new Date(); d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7)); return ymd(d) })()
  const quick: [string, string][] = [['Hoy', today], ['Mañana', ymd(new Date(Date.now() + 864e5))]]
  if (!quick.some(([, d]) => d === sat)) quick.push([`Sáb ${new Date(`${sat}T12:00`).getDate()}`, sat])

  const first = month.getDay() === 0 ? 6 : month.getDay() - 1 // lunes primero
  const daysIn = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const canPrev = month > new Date(new Date().getFullYear(), new Date().getMonth(), 1)

  return (
    <div className="sdt">
      <style>{CSS}</style>
      <div className="sdt-chips">
        {quick.map(([l, d]) => <button key={d} type="button" className={`sdt-chip${day === d ? ' is-on' : ''}`} onClick={() => { pick(d); setMonth(new Date(+d.slice(0, 4), +d.slice(5, 7) - 1, 1)) }}>{l}</button>)}
      </div>
      <div className="sdt-cal-head">
        <button type="button" className="sdt-nav" disabled={!canPrev} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Mes anterior"><Icon name="anterior" /></button>
        <span>{MONTHS[month.getMonth()]} {month.getFullYear()}</span>
        <button type="button" className="sdt-nav" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Mes siguiente"><Icon name="siguiente" /></button>
      </div>
      <div className="sdt-cal" role="grid">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((x, i) => <span key={i} className="sdt-dow">{x}</span>)}
        {Array.from({ length: first }, (_, i) => <span key={`e${i}`} />)}
        {Array.from({ length: daysIn }, (_, i) => {
          const d = ymd(new Date(month.getFullYear(), month.getMonth(), i + 1))
          return (
            <button key={d} type="button" disabled={d < today} onClick={() => pick(d)}
              className={`sdt-day${d === today ? ' is-today' : ''}${d === day ? ' is-on' : ''}`}
              aria-label={`${i + 1} de ${MONTHS[month.getMonth()]}`} aria-pressed={d === day}>{i + 1}</button>
          )
        })}
      </div>
      <div className="sdt-label">Hora</div>
      <div className="sdt-slots">
        {SLOTS.map(s => (
          <button key={s} type="button" disabled={past(day, s)} onClick={() => { setOtherTime(false); pick(day, s) }}
            className={`sdt-slot${!otherTime && time === s ? ' is-on' : ''}${peakHours.includes(+s.slice(0, 2)) ? ' is-peak' : ''}`}>{s}</button>
        ))}
        <button type="button" className={`sdt-slot${otherTime ? ' is-on' : ''}`} onClick={() => setOtherTime(o => !o)}>Otra</button>
      </div>
      {otherTime && (
        <div className="sdt-slots sdt-slots--all" role="listbox" aria-label="Elegir otra hora">
          {HALF_HOURS.filter(s => s >= '07:00').map(s => (
            <button key={s} type="button" disabled={past(day, s)} className={`sdt-slot${time === s ? ' is-on' : ''}`} onClick={() => pick(day, s)}>{s}</button>
          ))}
        </div>
      )}
      {peakHours.length > 0 && <div className="sdt-note">La línea coral marca los horarios en que más escanean tus clientes.</div>}
      <div className={`sdt-sum${past(day, time) ? ' is-bad' : ''}`}>
        {past(day, time) ? 'Ese horario ya pasó: elegí otro.' : <><span className="sdt-k">Envío</span><b>{shortDay(day)} · {time}</b></>}
      </div>
    </div>
  )
}

// ─── Una hora suelta ─────────────────────────────────────────────────────────
export function TimeField({ value, onChange, disabled, label }: { value: string; onChange: (v: string) => void; disabled?: boolean; label: string }) {
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    list.current?.querySelector('.is-on')?.scrollIntoView({ block: 'center' })
    const out = (e: PointerEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', out); document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('pointerdown', out); document.removeEventListener('keydown', esc) }
  }, [open])
  return (
    <div className="stf" ref={wrap}>
      <style>{CSS}</style>
      <button type="button" className="stf-btn" disabled={disabled} onClick={() => setOpen(o => !o)} aria-label={`${label}: ${value}`} aria-expanded={open}>{value || '--:--'}</button>
      {open && (
        <div className="stf-pop" ref={list} role="listbox" aria-label={label}>
          {HALF_HOURS.map(s => (
            <button key={s} type="button" role="option" aria-selected={s === value} className={`sdt-slot${s === value ? ' is-on' : ''}`} onClick={() => { onChange(s); setOpen(false) }}>{s}</button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Una fecha conocida (cumpleaños) ─────────────────────────────────────────
export function DateParts({ value, onChange, className, required, minYear = 1920 }: {
  value: string; onChange: (v: string) => void; className?: string; required?: boolean; minYear?: number
}) {
  const [y, m, d] = (value || '--').split('-')
  const [parts, setParts] = useState({ d: d || '', m: m || '', y: y || '' })
  useEffect(() => { if (value) { const [yy, mm, dd] = value.split('-'); setParts({ d: dd, m: mm, y: yy }) } }, [value])
  const set = (p: Partial<typeof parts>) => {
    const n = { ...parts, ...p }
    // Un 31 en un mes de 30 días se corrige al último día.
    if (n.d && n.m && n.y) {
      const max = new Date(+n.y, +n.m, 0).getDate()
      if (+n.d > max) n.d = pad(max)
    }
    setParts(n)
    onChange(n.d && n.m && n.y ? `${n.y}-${n.m}-${n.d}` : '')
  }
  const thisYear = new Date().getFullYear()
  return (
    <div className="sdp">
      <style>{CSS}</style>
      <select className={className} value={parts.d} required={required} onChange={e => set({ d: e.target.value })} aria-label="Día">
        <option value="">Día</option>
        {Array.from({ length: 31 }, (_, i) => <option key={i} value={pad(i + 1)}>{i + 1}</option>)}
      </select>
      <select className={className} value={parts.m} required={required} onChange={e => set({ m: e.target.value })} aria-label="Mes">
        <option value="">Mes</option>
        {MONTHS.map((n, i) => <option key={n} value={pad(i + 1)}>{n}</option>)}
      </select>
      <select className={className} value={parts.y} required={required} onChange={e => set({ y: e.target.value })} aria-label="Año">
        <option value="">Año</option>
        {Array.from({ length: thisYear - minYear + 1 }, (_, i) => thisYear - i).map(n => <option key={n} value={n}>{n}</option>)}
      </select>
    </div>
  )
}

const CSS = `
  .sdt{display:flex;flex-direction:column;gap:10px;}
  .sdt-chips{display:flex;flex-wrap:wrap;gap:6px;}
  .sdt-chip{font:inherit;font-size:12.5px;font-weight:600;padding:6px 12px;border-radius:999px;border:1.5px solid rgba(34,32,27,.14);background:#fff;color:var(--s-tinta);cursor:pointer;}
  .sdt-chip.is-on{border-color:var(--s-brasa);background:rgba(199,93,58,.08);color:var(--s-brasa);}
  .sdt-cal-head{display:flex;align-items:center;justify-content:space-between;font-family:var(--font-display);font-weight:700;font-size:14px;color:var(--s-tinta);text-transform:capitalize;}
  .sdt-nav{width:28px;height:28px;border-radius:8px;border:none;background:transparent;color:var(--s-tinta);cursor:pointer;display:flex;align-items:center;justify-content:center;}
  .sdt-nav:hover:not(:disabled){background:rgba(34,32,27,.06);}
  .sdt-nav:disabled{opacity:.3;cursor:default;}
  .sdt-cal{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:3px;text-align:center;}
  .sdt-dow{font-size:10.5px;font-weight:600;color:rgba(34,32,27,.45);padding-bottom:2px;}
  .sdt-day{font:inherit;font-size:13px;aspect-ratio:1;max-height:36px;border-radius:50%;border:none;background:transparent;color:var(--s-tinta);cursor:pointer;position:relative;font-variant-numeric:tabular-nums;}
  .sdt-day:hover:not(:disabled):not(.is-on){background:rgba(34,32,27,.06);}
  .sdt-day:disabled{opacity:.3;cursor:default;}
  .sdt-day.is-today::after{content:'';position:absolute;bottom:4px;left:50%;width:4px;height:4px;margin-left:-2px;border-radius:50%;background:var(--s-brasa);}
  .sdt-day.is-on{background:var(--s-brasa);color:#fff;}
  .sdt-day.is-on::after{background:#fff;}
  .sdt-label{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:rgba(34,32,27,.5);margin-top:2px;}
  .sdt-slots{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;}
  .sdt-slots--all{max-height:150px;overflow-y:auto;padding:6px;border-radius:10px;background:var(--s-salvia);}
  .sdt-slot{font:inherit;font-size:13px;font-weight:600;padding:7px 0;border-radius:8px;border:1.5px solid rgba(34,32,27,.12);background:#fff;color:var(--s-tinta);cursor:pointer;font-variant-numeric:tabular-nums;}
  .sdt-slot:hover:not(:disabled):not(.is-on){border-color:rgba(34,32,27,.3);}
  .sdt-slot:disabled{opacity:.3;cursor:default;}
  .sdt-slot.is-on{background:var(--s-pino);border-color:var(--s-pino);color:#fff;}
  .sdt-slot.is-peak{box-shadow:inset 0 -3px 0 rgba(199,93,58,.45);}
  .sdt-note{font-size:11px;color:rgba(34,32,27,.5);}
  .sdt-sum{display:flex;align-items:baseline;gap:8px;padding:9px 12px;border-radius:10px;background:var(--s-salvia);font-size:14px;font-variant-numeric:tabular-nums;}
  .sdt-sum b{color:var(--s-pino);}
  .sdt-sum.is-bad{background:rgba(180,68,42,.08);color:var(--s-error);font-size:12.5px;}
  .sdt-k{font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(34,32,27,.5);}
  .sdt-chip:focus-visible,.sdt-day:focus-visible,.sdt-slot:focus-visible,.sdt-nav:focus-visible,.stf-btn:focus-visible{outline:2px solid var(--s-brasa);outline-offset:2px;}
  .stf{position:relative;display:inline-block;}
  .stf-btn{font:inherit;font-size:13.5px;font-weight:600;font-variant-numeric:tabular-nums;min-width:68px;padding:6px 10px;border-radius:9px;border:1.5px solid rgba(34,32,27,.14);background:#fff;color:var(--s-tinta);cursor:pointer;}
  .stf-btn:disabled{opacity:.5;cursor:default;}
  .stf-pop{position:absolute;z-index:40;top:calc(100% + 4px);left:0;width:220px;max-height:210px;overflow-y:auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;padding:8px;background:#fff;border:1px solid rgba(34,32,27,.12);border-radius:12px;box-shadow:0 12px 32px rgba(34,32,27,.16);}
  .sdp{display:grid;grid-template-columns:minmax(78px,1fr) minmax(0,1.5fr) minmax(88px,1.1fr);gap:8px;}
  .sdp select{min-width:0;}
`
