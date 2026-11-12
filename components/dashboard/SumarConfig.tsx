'use client'
// Configuración → "Cómo suman tus clientes" (1.8.0). Por tarjeta:
// - Quién suma: hoy, un empleado que escanea (app o escáner web). El modo
//   automático y el pago conectado aparecen como "Próximamente".
// - Cada cuánto: máximo por día, horas entre una y otra, y si el empleado
//   puede saltear la regla con un aviso (backend: services/frequency.js).
//   Starter solo "1 por día"; el resto desde Growth (customLimits).
// - Cómo se entrega el premio: hoy, un empleado; "sin personas", próximamente.
import { useEffect, useMemo, useState } from 'react'
import { apiUpdateCard } from '@/lib/api'
import { usePlan } from '@/data/plans'
import { Switch } from '@/components/ui/Switch'

export interface SumarCard { id: string; name: string; type: string; isActive: boolean; pointsMode?: string; maxPerDay?: number | null; minHoursBetween?: number; limitOverride?: boolean }
type Rule = { maxPerDay: number | null; minHoursBetween: number; limitOverride: boolean }

const PER_DAY: (number | null)[] = [1, 2, 3, null]
const HOURS = [0, 1, 3, 6]

function words(card: SumarCard) {
  if (card.type === 'points') return card.pointsMode === 'amount'
    ? { title: 'Máximo de compras que suman por día', one: 'compra', many: 'compras' }
    : { title: 'Máximo de visitas que suman puntos por día', one: 'visita', many: 'visitas' }
  if (card.type === 'membership') return { title: 'Máximo de visitas que cuentan por día', one: 'visita', many: 'visitas' }
  return { title: 'Máximo por día', one: 'sello', many: 'sellos' }
}
const ruleOf = (c?: SumarCard): Rule => ({ maxPerDay: c?.maxPerDay ?? null, minHoursBetween: c?.minHoursBetween || 0, limitOverride: c?.limitOverride !== false })

export function SumarConfig({ businessId, cards, onCardsChanged, onChoosePlan, isManager = false }: {
  businessId?: string; cards: SumarCard[]; onCardsChanged?: () => void; onChoosePlan?: () => void; isManager?: boolean
}) {
  const { can } = usePlan()
  const custom = can('customLimits')
  const list = useMemo(() => [...cards].sort((a, b) => Number(b.isActive) - Number(a.isActive)), [cards])
  const [cardId, setCardId] = useState(list[0]?.id || '')
  const card = list.find(c => c.id === cardId) || list[0]
  const [draft, setDraft] = useState<Rule>(ruleOf(card))
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  useEffect(() => { setDraft(ruleOf(card)); setMsg(null) }, [card?.id, card?.maxPerDay, card?.minHoursBetween, card?.limitOverride]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!card) return <div className="sc-empty">Creá una tarjeta para configurar cómo suman tus clientes.</div>
  const w = words(card)
  const saved = ruleOf(card)
  const dirty = JSON.stringify(saved) !== JSON.stringify(draft)
  const hasRule = !!(draft.maxPerDay || draft.minHoursBetween)
  const icon = (t: string) => t === 'points' ? '⭐' : t === 'membership' ? '👑' : '☕'

  const summary = !hasRule
    ? <>Así queda: <b>sin límite</b>. Cada escaneo suma.</>
    : <>Así queda: <b>
        {draft.maxPerDay ? `hasta ${draft.maxPerDay === 1 ? `1 ${w.one}` : `${draft.maxPerDay} ${w.many}`} por día` : 'sin máximo por día'}
        {draft.minHoursBetween ? `, con ${draft.minHoursBetween} ${draft.minHoursBetween === 1 ? 'hora' : 'horas'} entre ${draft.maxPerDay === 1 ? 'visitas' : 'una y otra'}` : ''}
      </b>. {draft.limitOverride ? 'El empleado puede saltear la regla con un aviso.' : 'Nadie puede saltear la regla.'}</>

  async function save() {
    if (!businessId || !card) return
    setSaving(true); setMsg(null)
    try {
      await apiUpdateCard(businessId, card.id, draft)
      setMsg({ ok: true, text: 'Guardado. Ya vale en la app y en el escáner web.' })
      onCardsChanged?.()
    } catch (err: any) {
      setMsg({ ok: false, text: err?.error || 'No se pudo guardar.' })
    } finally { setSaving(false) }
  }

  return (
    <div className="sc">
      <style>{CSS}</style>
      {list.length > 1 && (
        <div className="sc-tabs" role="tablist">
          {list.map(c => (
            <button key={c.id} role="tab" aria-selected={c.id === card.id} className={`sc-tab${c.id === card.id ? ' is-on' : ''}`} onClick={() => setCardId(c.id)}>
              {icon(c.type)} {c.name}{!c.isActive && <span className="sc-off"> · inactiva</span>}
            </button>
          ))}
        </div>
      )}

      <div className="sc-blk">
        <div className="sc-h">¿Quién suma?</div>
        <div className="sc-opts">
          <div className="sc-op is-on"><b>Un empleado escanea</b>Con la app o con el escáner web, desde cualquier celular.</div>
          <div className="sc-op is-soon"><b>Automático en el local</b>El cliente acerca su tarjeta a la Pantalla o a la Cajita Stampa.<span className="sc-soon">Próximamente</span></div>
          <div className="sc-op is-soon"><b>Automático con cada pago</b>Mercado Pago, Loyverse o Fudo.<span className="sc-soon">Próximamente · Pro</span></div>
        </div>
      </div>

      <div className="sc-blk">
        <div className="sc-h">¿Cada cuánto puede sumar un cliente?</div>
        <div className="sc-p">Vale para la app, el escáner web y, cuando salga, el modo automático.</div>
        <div className="sc-rules">
          <div className="sc-rl">
            <b>{w.title}</b>
            <div className="sc-sel">
              {PER_DAY.map(n => {
                const locked = !custom && n !== null && n > 1
                return <button key={String(n)} type="button" disabled={locked} className={`sc-chip${draft.maxPerDay === n ? ' is-on' : ''}`} aria-pressed={draft.maxPerDay === n} onClick={() => setDraft(d => ({ ...d, maxPerDay: n }))} title={locked ? 'Desde el plan Growth' : undefined}>{n === null ? 'Sin límite' : n}</button>
              })}
            </div>
          </div>
          <div className="sc-rl">
            <b>Tiempo mínimo entre una y otra</b>
            <div className="sc-sel">
              {HOURS.map(h => {
                const locked = !custom && h > 0
                return <button key={h} type="button" disabled={locked} className={`sc-chip${draft.minHoursBetween === h ? ' is-on' : ''}`} aria-pressed={draft.minHoursBetween === h} onClick={() => setDraft(d => ({ ...d, minHoursBetween: h }))} title={locked ? 'Desde el plan Growth' : undefined}>{h === 0 ? 'Sin mínimo' : `${h} h`}</button>
              })}
            </div>
          </div>
        </div>
        {!custom && (
          <div className="sc-up"><span>Más de una por día y horas entre visitas están en Growth.</span>{onChoosePlan && !isManager && <button className="sc-link" onClick={onChoosePlan}>Ver planes</button>}</div>
        )}
        <div className="sc-tog">
          <div><b>Dejar que el empleado lo saltee</b><span>Le pregunta "¿Sumar igual?" y queda marcado en el historial.</span></div>
          <Switch checked={draft.limitOverride} onChange={(v: boolean) => setDraft(d => ({ ...d, limitOverride: v }))} disabled={!hasRule} label="Dejar que el empleado saltee la regla" />
        </div>
        <div className="sc-sum">{summary}</div>
        <div className="sc-save">
          {msg && <span className={msg.ok ? 'sc-ok' : 'sc-err'}>{msg.text}</span>}
          {dirty && <button className="s-btn s-btn--secondary s-btn--sm" onClick={() => setDraft(saved)} disabled={saving}>Cancelar</button>}
          <button className="s-btn s-btn--primary s-btn--sm" onClick={save} disabled={!dirty || saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </div>

      <div className="sc-blk">
        <div className="sc-h">¿Cómo se entrega el premio?</div>
        <div className="sc-opts">
          <div className="sc-op is-on"><b>Lo entrega un empleado</b>Al escanear aparece "Tiene un premio" → Entregar.</div>
          <div className="sc-op is-soon"><b>Solo, sin personas</b>Devolución automática del próximo pago o un código. Para locales sin personal.<span className="sc-soon">Próximamente · Pro</span></div>
        </div>
      </div>
    </div>
  )
}

// Tabla para el modal de planes: qué incluye cada plan en "cómo suman".
const ROWS: { label: string; soon?: boolean; v: [string, string, string, string] }[] = [
  { label: 'Escanea un empleado (app y escáner web)', v: ['✓', '✓', '✓', '✓'] },
  { label: 'Límite de 1 por día', v: ['✓', '✓', '✓', '✓'] },
  { label: 'Reglas a medida (varias por día, horas entre visitas)', v: ['—', '✓', '✓', '✓'] },
  { label: 'Automático con tablet o celular propio', soon: true, v: ['—', '✓', '✓', '✓'] },
  { label: 'Cajita Stampa (QR)', soon: true, v: ['—', 'Alquiler mensual', '1 por local en el plan anual', 'Incluidas'] },
  { label: 'Pago conectado: Mercado Pago, Loyverse, Fudo', soon: true, v: ['—', '—', '✓', '✓'] },
  { label: 'Premio sin personas', soon: true, v: ['—', '—', '✓', '✓'] },
  { label: 'Cajita contactless (NFC)', soon: true, v: ['—', '—', 'Extra', '✓'] },
]
export function SumarPlanTable() {
  const [open, setOpen] = useState(false)
  const head = ['Starter', 'Growth', 'Pro', 'Enterprise']
  return (
    <div className="sc-pt">
      <style>{CSS}</style>
      <button className="sc-pt-toggle" onClick={() => setOpen(o => !o)} aria-expanded={open}>{open ? '−' : '+'} Cómo suman tus clientes en cada plan</button>
      {open && (
        <div className="sc-pt-wrap">
          <table>
            <thead><tr><th />{head.map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {ROWS.map(r => (
                <tr key={r.label}>
                  <td>{r.label}{r.soon && <span className="sc-soon sc-soon--in">Próximamente</span>}</td>
                  {r.v.map((v, i) => <td key={i} className={v === '✓' ? 'is-yes' : v === '—' ? 'is-no' : ''}>{v}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const CSS = `
.sc{display:flex;flex-direction:column;gap:12px}
.sc-empty{font-size:13px;color:var(--s-tinta-2)}
.sc-tabs{display:flex;gap:6px;flex-wrap:wrap}
.sc-tab{font:inherit;font-size:12.5px;padding:6px 12px;border-radius:999px;background:#fff;border:1px solid var(--s-linea);cursor:pointer;color:var(--s-tinta)}
.sc-tab.is-on{background:var(--s-pino);color:#fff;border-color:var(--s-pino)}
.sc-off{opacity:.7}
.sc-blk{border:1px solid var(--s-linea);border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:10px;background:#fff}
.sc-h{font-family:var(--font-display);font-weight:700;font-size:14px;color:var(--s-tinta)}
.sc-p{font-size:12px;color:var(--s-tinta-2);margin-top:-4px}
.sc-opts{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px}
.sc-op{border:1.5px solid var(--s-linea);border-radius:12px;padding:10px 12px;font-size:12px;line-height:1.45;color:var(--s-tinta-2);position:relative;display:flex;flex-direction:column;gap:2px}
.sc-op b{font-size:13px;color:var(--s-tinta)}
.sc-op.is-on{border-color:var(--s-pino);background:#F3F8F4}
.sc-op.is-on::after{content:'●';position:absolute;top:8px;right:10px;color:var(--s-pino);font-size:11px}
.sc-op.is-soon{border-style:dashed;background:#FAFAF8;opacity:.8}
.sc-soon{align-self:flex-start;margin-top:4px;font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px;background:#F5E8D2;color:#7a5214}
.sc-soon--in{margin:0 0 0 6px;display:inline-block;vertical-align:1px}
.sc-rules{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px}
.sc-rl{border:1px solid var(--s-linea);border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:8px;font-size:12.5px}
.sc-rl b{font-size:13px;color:var(--s-tinta)}
.sc-sel{display:flex;gap:5px;flex-wrap:wrap}
.sc-chip{font:inherit;font-size:12px;padding:5px 11px;border-radius:8px;border:1px solid var(--s-linea);background:#fff;cursor:pointer;color:var(--s-tinta)}
.sc-chip.is-on{background:var(--s-pino);color:#fff;border-color:var(--s-pino)}
.sc-chip:disabled{color:rgba(34,32,27,.3);background:var(--s-salvia);cursor:not-allowed}
.sc-up{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;font-size:12px;background:var(--s-salvia);border-radius:10px;padding:8px 12px;color:var(--s-tinta-2)}
.sc-link{background:none;border:none;padding:0;font:inherit;font-weight:700;color:var(--s-pino);text-decoration:underline;cursor:pointer}
.sc-tog{display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:12.5px;border-top:1px solid var(--s-linea);padding-top:10px}
.sc-tog b{display:block;color:var(--s-tinta);font-size:13px}
.sc-tog span{color:var(--s-tinta-2)}
.sc-sum{background:var(--s-pino);color:#fff;border-radius:12px;padding:10px 13px;font-size:12.5px;line-height:1.5}
.sc-sum b{color:#CFE8D6}
.sc-save{display:flex;justify-content:flex-end;align-items:center;gap:8px;flex-wrap:wrap}
.sc-ok{font-size:12px;color:var(--s-listo);font-weight:600}
.sc-err{font-size:12px;color:var(--s-error);font-weight:600}
.sc-pt{margin-top:12px}
.sc-pt-toggle{background:none;border:none;padding:4px 0;font:inherit;font-size:12.5px;font-weight:700;color:var(--s-pino);cursor:pointer}
.sc-pt-wrap{overflow-x:auto;border:1px solid var(--s-linea);border-radius:12px;margin-top:6px}
.sc-pt table{width:100%;border-collapse:collapse;font-size:11.5px;min-width:520px}
.sc-pt th{background:var(--s-pino);color:#fff;font-weight:600;padding:7px 6px;text-align:center}
.sc-pt td{padding:7px 6px;border-top:1px solid var(--s-linea);text-align:center;color:var(--s-tinta)}
.sc-pt td:first-child{text-align:left}
.sc-pt td.is-yes{color:var(--s-listo);font-weight:700}
.sc-pt td.is-no{color:rgba(34,32,27,.3)}
`
