'use client'
import { Icon, type IconName } from '@/components/ui/Icon'
import { readCache, getJson } from '@/lib/cache'
import React, { useState, useEffect, useRef } from 'react'
import { usePlan } from '@/data/plans'
import { BASE_URL, apiGetTiers } from '@/lib/api'
import { DateTimePicker } from '@/components/ui/DateTime'
import { withLoc } from '@/lib/location'
import { AutoNotices } from './AutoNotices'

// Notificaciones: se mandan al Wallet del cliente (Apple Wallet y Google
// Wallet; Google limita cuántos avisos muestra por tarjeta y por día). El límite del plan cuenta ENVÍOS (campañas), no
// destinatarios. Todo lo que cuenta y filtra lo hace el backend
// (services/broadcast.js); acá se arma el envío y se muestra el alcance real.

type BaseAudience = 'all' | 'active' | 'inactive' | 'near' | 'ready'
type Audience = BaseAudience | 'card' | 'tier' | 'answer' | 'customers' | 'location'
interface AnswerField { fieldId: string; label: string; cardName: string; options: string[] }
interface Reach { total: number; reachable: number }
interface HistoryItem { message: string; audience: string; audienceLabel?: string | null; sentCount: number; recipients?: number | null; sentAt: string }
interface ScheduledItem { index: number; message: string; audience: string; audienceLabel?: string | null; scheduledAt: string }
interface Picked { email: string; name: string; ids: string[] }

const MAX_CHARS = 160
const BASE: { key: BaseAudience; label: string; desc: (d: number) => string; stampOnly?: boolean }[] = [
  { key: 'all',      label: 'Todos los clientes',   desc: () => 'Novedades generales, horarios, lanzamientos' },
  { key: 'active',   label: 'Activos',              desc: d => `Vinieron en los últimos ${d} días o se registraron hace poco` },
  { key: 'inactive', label: 'Inactivos',            desc: d => `Hace más de ${d} días que no vienen — ideal para un "te extrañamos"` },
  { key: 'near',     label: 'Cerca del premio',     desc: () => 'A 1–2 sellos de completar la tarjeta', stampOnly: true },
  { key: 'ready',    label: 'Premio para entregar', desc: () => 'Completaron la tarjeta y todavía no retiraron su premio', stampOnly: true },
]
const AUD_LABEL: Record<string, string> = {
  all: 'Todos', active: 'Activos', inactive: 'Inactivos', near: 'Cerca del premio', ready: 'Premio para entregar',
  card: 'Por tarjeta', tier: 'Por nivel', answer: 'Por respuesta', customers: 'Clientes puntuales', location: 'Por sucursal',
}

function fmtDateTime(d: string | number) {
  return new Date(d).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
}
function localInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('stampa_token') })

function Lock() {
  return <Icon name="candado" size={12} />
}

export function NotificationsTab({ businessId, cards = [], businessName, inactiveDays = 60, isManager = false, onChoosePlan, selectedLocationId = null, preset = null, onPresetUsed }: {
  selectedLocationId?: string | null
  preset?: { fieldId: string; answer: string } | null
  onPresetUsed?: () => void
  businessId?: string | null
  cards?: any[]
  businessName: string
  inactiveDays?: number
  isManager?: boolean
  onChoosePlan: () => void
}) {
  const { plan, limit, can } = usePlan()
  // Horarios fuertes (los dos tramos de 2 horas con más escaneos en 30 días),
  // para marcarlos al programar. Sale de la misma consulta que Analítica.
  const [peakHours, setPeakHours] = useState<number[]>([])
  useEffect(() => {
    if (!businessId) return
    const path = withLoc(`/api/businesses/${businessId}/analytics/detailed?range=30d`)
    const peaks = (d: any) => {
      const grid: number[][] = d?.hourly?.visits || []
      const tot = Array.from({ length: 12 }, (_, s) => grid.reduce((a, row) => a + (row?.[s] || 0), 0))
      return tot.map((v, s) => [v, s]).filter(([v]) => v > 0).sort((x, y) => y[0] - x[0]).slice(0, 2).flatMap(([, s]) => [s * 2, s * 2 + 1])
    }
    const cached = readCache<any>(path)
    if (cached) setPeakHours(peaks(cached))
    getJson<any>(path).then(d => setPeakHours(peaks(d))).catch(() => {})
  }, [businessId])
  const activeCards = cards.filter((c: any) => c.isActive)
  const hasStamp = activeCards.some((c: any) => c.type === 'stamp')
  const membershipCards = activeCards.filter((c: any) => c.type === 'membership')
  const canTarget = can('notifTargeting')
  const canIndividual = can('notifIndividual')

  // ── Datos del servidor ──
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [scheduled, setScheduled] = useState<ScheduledItem[]>([])
  const [failedScheduled, setFailedScheduled] = useState<Array<{ message: string; scheduledAt: string; error: string }>>([])
  const [reach, setReach] = useState<Record<string, Reach>>({})
  const [answerFields, setAnswerFields] = useState<AnswerField[]>([])
  // Sucursales habilitadas (solo llegan con 2+, en Pro o Enterprise).
  const [locationOpts, setLocationOpts] = useState<{ id: string; name: string }[]>([])
  const [used, setUsed] = useState(0)
  const [monthlyLimit, setMonthlyLimit] = useState(limit('monthlyNotifs'))

  async function load() {
    if (!businessId) return
    const path = `/api/businesses/${businessId}/notifications`
    const apply = (d: any) => {
      setHistory(d.history || []); setScheduled(d.scheduled || []); setFailedScheduled(d.failedScheduled || [])
      setReach(d.reach || {}); setAnswerFields(d.answerFields || []); setLocationOpts(d.locations || []); setUsed(d.sentThisMonth || 0); setMonthlyLimit(d.monthlyLimit ?? limit('monthlyNotifs'))
    }
    // Lo guardado (o precargado por Inicio) aparece al instante (lib/cache).
    const cached = readCache<any>(path)
    if (cached) { apply(cached); setLoaded(true) }
    try {
      apply(await getJson<any>(path))
      setLoadError(false)
    } catch {
      if (!cached) setLoadError(true)
    } finally {
      setLoaded(true)
    }
  }
  useEffect(() => { load() }, [businessId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Formulario ──
  const [message, setMessage] = useState('')
  const [audience, setAudience] = useState<Audience>('all')
  const [cardId, setCardId] = useState<string>(activeCards[0]?.id || '')
  const [tierCardId, setTierCardId] = useState<string>(membershipCards[0]?.id || '')
  const [tiers, setTiers] = useState<string[]>([])
  const [tierName, setTierName] = useState('')
  const [answerFieldId, setAnswerFieldId] = useState('')
  const [answer, setAnswer] = useState('')
  const answerField = answerFields.find(f => f.fieldId === answerFieldId) || answerFields[0]
  // Llegando desde Analítica: audiencia "Por respuesta" con esa respuesta.
  useEffect(() => {
    if (!preset || !answerFields.some(f => f.fieldId === preset.fieldId)) return
    setAudience('answer'); setAnswerFieldId(preset.fieldId); setAnswer(preset.answer)
    onPresetUsed?.()
  }, [preset, answerFields]) // eslint-disable-line react-hooks/exhaustive-deps
  const [picked, setPicked] = useState<Picked[]>([])
  const [locId, setLocId] = useState('')
  const locPick = locationOpts.find(l => l.id === locId) || locationOpts[0]
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Picked[]>([])
  const [searching, setSearching] = useState(false)
  const [sendType, setSendType] = useState<'now' | 'later'>('now')
  const [when, setWhen] = useState(() => `${localInputValue(new Date(Date.now() + 24 * 3600 * 1000)).slice(0, 10)}T12:00`)
  const [busy, setBusy] = useState<'send' | 'test' | null>(null)
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null)
  const [paramReach, setParamReach] = useState<Reach | null>(null)

  // Niveles de la membresía elegida
  useEffect(() => {
    if (!businessId || !tierCardId) return
    apiGetTiers(businessId, tierCardId).then(list => {
      const names = list.map(t => t.name); setTiers(names); setTierName(n => names.includes(n) ? n : names[0] || '')
    }).catch(() => setTiers([]))
  }, [businessId, tierCardId])

  // Alcance de audiencias con parámetros (tarjeta, nivel, clientes)
  const reachTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    setParamReach(null)
    if (!businessId || !['card', 'tier', 'answer', 'customers', 'location'].includes(audience)) return
    const body = audienceBody()
    if ((audience === 'card' && !cardId) || (audience === 'tier' && !tierName) || (audience === 'answer' && !(answerField && answer)) || (audience === 'customers' && !picked.length) || (audience === 'location' && !locPick)) return
    if (reachTimer.current) clearTimeout(reachTimer.current)
    reachTimer.current = setTimeout(() => {
      fetch(`${BASE_URL}/api/businesses/${businessId}/notifications/reach`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) })
        .then(r => r.ok ? r.json() : null).then(d => setParamReach(d)).catch(() => {})
    }, 250)
  }, [audience, cardId, tierCardId, tierName, answerFieldId, answer, picked, businessId, locPick?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Buscador de clientes puntuales
  useEffect(() => {
    if (!businessId || audience !== 'customers' || search.trim().length < 2) { setResults([]); return }
    const id = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`${BASE_URL}/api/businesses/${businessId}/customers?limit=8&sortBy=name&sortDir=asc&search=${encodeURIComponent(search.trim())}`, { headers: authHeaders() })
        const d = await res.json()
        setResults((d.customers || []).map((c: any) => ({ email: c.email, name: c.name, ids: (c.cards || []).map((x: any) => x.customerId) })))
      } catch { setResults([]) } finally { setSearching(false) }
    }, 300)
    return () => clearTimeout(id)
  }, [search, audience, businessId])

  function audienceBody() {
    if (audience === 'card') return { audience, cardId }
    if (audience === 'tier') return { audience, cardId: tierCardId, tierName }
    if (audience === 'answer') return { audience, fieldId: answerField?.fieldId, answer }
    if (audience === 'customers') return { audience, customerIds: picked.flatMap(p => p.ids) }
    if (audience === 'location') return { audience, locationId: locPick?.id }
    return { audience }
  }

  const currentReach: Reach | null = ['card', 'tier', 'answer', 'customers', 'location'].includes(audience) ? paramReach : reach[audience] || null
  const unlimited = monthlyLimit >= 999999
  const atLimit = !unlimited && used >= monthlyLimit
  const audienceReady = audience === 'card' ? !!cardId : audience === 'tier' ? !!tierName : audience === 'answer' ? !!(answerField && answer) : audience === 'customers' ? picked.length > 0 : audience === 'location' ? !!locPick : true

  async function send() {
    if (!businessId || !message.trim() || busy) return
    setBusy('send'); setFeedback(null)
    try {
      const later = sendType === 'later'
      if (later && (!when || new Date(when) <= new Date())) throw { error: 'Elegí una fecha y hora en el futuro.' }
      const res = await fetch(`${BASE_URL}/api/businesses/${businessId}/notifications/${later ? 'scheduled' : 'broadcast'}`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ message: message.trim(), ...audienceBody(), ...(later ? { scheduledAt: new Date(when).toISOString() } : {}) }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw d
      setFeedback({ ok: true, text: later
        ? `Programada para el ${fmtDateTime(new Date(when).getTime())}.`
        : `Enviada: le llegó a ${d.customers} cliente${d.customers === 1 ? '' : 's'}${d.failed ? ` (${d.failed} no se pudieron entregar)` : ''}.` })
      setMessage('')
      await load()
    } catch (err: any) {
      setFeedback({ ok: false, text: err?.error || 'No pudimos enviar la notificación. Probá de nuevo.' })
    } finally {
      setBusy(null)
    }
  }

  async function sendTestNotif() {
    if (!businessId || !message.trim() || busy) return
    setBusy('test'); setFeedback(null)
    try {
      const res = await fetch(`${BASE_URL}/api/businesses/${businessId}/notifications/test`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ message: message.trim() }) })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw d
      setFeedback({ ok: true, text: 'Prueba enviada a tu tarjeta. Revisá tu iPhone (no cuenta para el límite del mes).' })
    } catch (err: any) {
      setFeedback({ ok: false, text: err?.error || 'No pudimos mandar la prueba.' })
    } finally {
      setBusy(null)
    }
  }

  async function cancelScheduled(index: number) {
    if (!businessId) return
    const prev = scheduled
    setScheduled(scheduled.filter(n => n.index !== index))
    try {
      const res = await fetch(`${BASE_URL}/api/businesses/${businessId}/notifications/scheduled/${index}`, { method: 'DELETE', headers: authHeaders() })
      if (!res.ok) throw new Error()
      await load() // re-sincroniza índices
    } catch {
      setScheduled(prev)
      setFeedback({ ok: false, text: 'No se pudo cancelar: puede que ya se esté enviando.' })
    }
  }

  const logo = activeCards.find((c: any) => c.logoUrl)?.logoUrl as string | undefined
  const passName = activeCards[0]?.name || businessName
  const sendLabel = sendType === 'later' ? 'Programar envío'
    : currentReach ? `Enviar a ${currentReach.reachable} cliente${currentReach.reachable === 1 ? '' : 's'}` : 'Enviar'

  // Función (no componente): si fuera un componente definido acá adentro,
  // React lo recrearía en cada tecla y el buscador perdería el foco.
  const audienceRow = ({ k, label, desc, locked, lockText, children }: { k: Audience; label: string; desc: string; locked?: boolean; lockText?: string; children?: React.ReactNode }) => {
    const on = audience === k
    const r = k === audience ? currentReach : (reach as any)[k] as Reach | undefined
    return (
      <div key={k} className={`nt-aud${on ? ' nt-aud--on' : ''}${locked ? ' nt-aud--locked' : ''}`}>
        <button className="nt-aud-main" onClick={() => locked ? (!isManager && onChoosePlan()) : setAudience(k)}>
          <span className="nt-radio">{on && <span />}</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span className="nt-aud-name">{label}{locked && <span className="nt-lock"><Lock /> {lockText}</span>}</span>
            <span className="nt-aud-desc">{desc}</span>
          </span>
          {!locked && r && (
            <span className="nt-aud-count" title={`${r.reachable} de ${r.total} tienen la tarjeta en Apple Wallet o Google Wallet`}>
              {r.reachable}<small> de {r.total}</small>
            </span>
          )}
        </button>
        {on && !locked && r && r.total > r.reachable && (
          <div className="nt-aud-miss">A {r.total - r.reachable} no les llega: no tienen la tarjeta guardada en Apple Wallet ni en Google Wallet.</div>
        )}
        {on && !locked && children && <div className="nt-aud-extra">{children}</div>}
      </div>
    )
  }

  return (
    <>
      <style>{`
        .nt-content{flex:1;overflow-y:auto;padding:20px 24px;display:flex;flex-direction:column;gap:14px;}
        .nt-lbl{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:rgba(34,32,27,.38);font-weight:600;display:flex;align-items:center;gap:10px;margin-top:4px;}
        .nt-lbl::after{content:'';flex:1;height:1px;background:rgba(34,32,27,.1);}
        .nt-card{background:#FFFFFF;border:1px solid rgba(34,32,27,.07);border-radius:14px;padding:18px 20px;box-shadow:0 1px 8px rgba(34,32,27,.04);min-width:0;}
        .nt-card-title{font-family:var(--font-display);font-weight:700;font-size:13px;color:var(--s-tinta);margin-bottom:2px;}
        .nt-card-sub{font-size:11px;color:rgba(34,32,27,.45);margin-bottom:14px;line-height:1.5;}
        .nt-2col{display:grid;grid-template-columns:1.4fr 1fr;gap:16px;align-items:start;}
        .nt-usage{display:flex;align-items:center;gap:12px;flex-wrap:wrap;background:#fff;border:1px solid rgba(34,32,27,.07);border-radius:12px;padding:10px 14px;font-size:12px;color:rgba(34,32,27,.65);}
        .nt-usage strong{color:var(--s-tinta);}
        .nt-usage-bar{flex:1;min-width:120px;max-width:240px;height:5px;background:rgba(34,32,27,.07);border-radius:3px;overflow:hidden;}
        .nt-usage-bar div{height:100%;background:var(--s-listo);border-radius:3px;}
        .nt-usage--full{background:rgba(178,59,59,.05);border-color:rgba(178,59,59,.2);}
        .nt-usage--full .nt-usage-bar div{background:var(--s-error);}
        .nt-textarea{width:100%;padding:12px 14px;font-size:13px;border:1.5px solid rgba(34,32,27,.12);border-radius:11px;background:var(--s-salvia);color:var(--s-tinta);font-family:var(--font-body);resize:vertical;outline:none;line-height:1.6;min-height:90px;}
        .nt-textarea:focus{border-color:var(--s-brasa);}
        .nt-char{text-align:right;font-size:10.5px;color:rgba(34,32,27,.4);margin:4px 0 14px;}
        .nt-char--warn{color:var(--s-brasa);font-weight:600;}
        .nt-field{font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:rgba(34,32,27,.45);font-weight:700;margin-bottom:8px;}
        .nt-loc-hint{display:block;width:100%;text-align:left;font-size:12.5px;font-weight:600;color:#A9472A;background:rgba(199,93,58,.08);border:1px dashed rgba(199,93,58,.4);border-radius:10px;padding:9px 12px;margin-bottom:8px;cursor:pointer;font-family:var(--font-body);}
        .nt-auds{display:flex;flex-direction:column;gap:6px;margin-bottom:16px;}
        .nt-aud{border:1.5px solid rgba(34,32,27,.1);border-radius:11px;transition:border-color .15s;}
        .nt-aud--on{border-color:var(--s-brasa);background:rgba(199,93,58,.04);}
        .nt-aud--locked .nt-aud-main{opacity:.65;}
        .nt-aud-main{display:flex;align-items:center;gap:10px;padding:10px 13px;width:100%;background:none;border:none;cursor:pointer;text-align:left;font-family:inherit;}
        .nt-radio{width:15px;height:15px;border-radius:50%;border:2px solid rgba(34,32,27,.2);flex-shrink:0;display:flex;align-items:center;justify-content:center;}
        .nt-aud--on .nt-radio{border-color:var(--s-brasa);}
        .nt-radio span{width:7px;height:7px;border-radius:50%;background:var(--s-brasa);}
        .nt-aud-name{display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:700;color:var(--s-tinta);flex-wrap:wrap;}
        .nt-aud-desc{display:block;font-size:10.5px;color:rgba(34,32,27,.5);margin-top:1px;line-height:1.4;}
        .nt-aud-count{font-size:12px;font-weight:800;color:var(--s-tinta);background:rgba(34,32,27,.06);padding:3px 9px;border-radius:20px;white-space:nowrap;}
        .nt-aud-count small{font-weight:500;color:rgba(34,32,27,.45);font-size:10.5px;}
        .nt-lock{display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:700;color:#9C7530;background:rgba(212,162,76,.15);padding:2px 8px;border-radius:20px;}
        .nt-aud-extra{padding:0 13px 12px 38px;display:flex;flex-direction:column;gap:8px;}
        .nt-select,.nt-input{padding:8px 11px;font-size:12px;border:1px solid rgba(34,32,27,.15);border-radius:9px;background:#fff;color:var(--s-tinta);font-family:var(--font-body);outline:none;width:100%;}
        .nt-select:focus,.nt-input:focus{border-color:var(--s-brasa);}
        .nt-row{display:flex;gap:8px;}
        .nt-results{display:flex;flex-direction:column;border:1px solid rgba(34,32,27,.1);border-radius:9px;overflow:hidden;}
        .nt-result{display:flex;justify-content:space-between;gap:8px;padding:8px 11px;font-size:12px;background:#fff;border:none;border-bottom:1px solid rgba(34,32,27,.06);cursor:pointer;text-align:left;font-family:inherit;color:var(--s-tinta);}
        .nt-result:last-child{border-bottom:none;}
        .nt-result:hover{background:var(--s-salvia);}
        .nt-result small{color:rgba(34,32,27,.45);}
        .nt-chips{display:flex;flex-wrap:wrap;gap:6px;}
        .nt-chip{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:600;background:rgba(199,93,58,.1);color:var(--s-brasa);border-radius:20px;padding:4px 6px 4px 10px;}
        .nt-chip button{border:none;background:rgba(199,93,58,.15);color:var(--s-brasa);border-radius:50%;width:16px;height:16px;line-height:14px;cursor:pointer;font-size:12px;padding:0;}
        .nt-hint{font-size:10.5px;color:rgba(34,32,27,.45);line-height:1.45;}
        .nt-types{display:flex;gap:6px;margin-bottom:10px;}
        .nt-chips{display:flex;flex-wrap:wrap;align-items:center;gap:6px;}
        .nt-chip{padding:6px 13px;border-radius:999px;border:1.5px solid rgba(34,32,27,.12);background:#fff;font-size:12px;font-weight:600;color:rgba(34,32,27,.65);cursor:pointer;font-family:var(--font-body);}
        .nt-chip:hover:not(:disabled){border-color:rgba(34,32,27,.3);}
        .nt-chip:disabled{opacity:.35;cursor:default;}
        .nt-chip--on{background:rgba(199,93,58,.1);border-color:var(--s-brasa);color:var(--s-brasa);}
        .nt-type{flex:1;padding:9px;border-radius:10px;border:1.5px solid rgba(34,32,27,.1);background:#fff;cursor:pointer;font-size:12px;font-weight:600;color:rgba(34,32,27,.55);display:flex;align-items:center;justify-content:center;gap:7px;font-family:var(--font-body);}
        .nt-type--on{border-color:var(--s-brasa);background:rgba(199,93,58,.06);color:var(--s-brasa);}
        .nt-actions{display:flex;gap:8px;margin-top:6px;flex-wrap:wrap;}
        .nt-send{flex:1;min-width:180px;}
        .nt-feedback{font-size:12.5px;border-radius:10px;padding:10px 12px;margin-top:10px;line-height:1.45;}
        .nt-feedback--ok{background:rgba(91,140,90,.12);color:var(--s-listo);}
        .nt-feedback--err{background:rgba(178,59,59,.08);color:var(--s-error);}
        .nt-wallet-note{font-size:10.5px;color:rgba(34,32,27,.45);margin-top:10px;line-height:1.5;}
        .nt-phone{background:linear-gradient(160deg,#2B3A4A,#1B2530);border-radius:18px;padding:18px 12px 14px;}
        .nt-phone-time{text-align:center;color:rgba(255,255,255,.85);font-family:var(--font-display);font-size:28px;font-weight:600;margin-bottom:14px;}
        .nt-notif{background:rgba(245,245,247,.92);border-radius:14px;padding:10px 12px;display:flex;gap:10px;}
        .nt-notif-icon{width:30px;height:30px;border-radius:7px;background:var(--s-brasa);flex-shrink:0;overflow:hidden;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:800;}
        .nt-notif-icon img{width:100%;height:100%;object-fit:cover;}
        .nt-notif-head{display:flex;justify-content:space-between;font-size:11.5px;color:#1c1c1e;font-weight:600;}
        .nt-notif-head span{font-weight:400;color:rgba(60,60,67,.6);}
        .nt-notif-body{font-size:12.5px;color:#1c1c1e;line-height:1.35;margin-top:1px;word-break:break-word;}
        .nt-notif-empty{color:rgba(60,60,67,.45);font-style:italic;}
        .nt-onpass{margin-top:12px;background:#fff;border:1px solid rgba(34,32,27,.08);border-radius:10px;padding:10px 12px;}
        .nt-onpass-k{font-size:9.5px;text-transform:uppercase;letter-spacing:.06em;color:rgba(34,32,27,.45);font-weight:700;}
        .nt-onpass-v{font-size:12px;color:var(--s-tinta);margin-top:2px;word-break:break-word;}
        .nt-tip{display:flex;gap:10px;padding:8px 0;border-bottom:1px solid rgba(34,32,27,.06);font-size:11.5px;color:rgba(34,32,27,.65);line-height:1.5;}
        .nt-tip:last-child{border-bottom:none;}
        .nt-tip-ic{color:var(--s-brasa);flex-shrink:0;margin-top:1px;}
        .nt-list-row{display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid rgba(34,32,27,.06);}
        .nt-list-row:last-child{border-bottom:none;}
        .nt-list-icon{width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .nt-list-msg{font-size:12.5px;color:var(--s-tinta);font-weight:500;margin-bottom:5px;word-break:break-word;}
        .nt-list-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:11px;color:rgba(34,32,27,.45);}
        .nt-badge{font-size:10px;padding:2px 9px;border-radius:20px;font-weight:600;background:rgba(34,32,27,.06);color:rgba(34,32,27,.7);}
        .nt-reached{font-weight:700;color:var(--s-listo);}
        .nt-empty{font-size:12px;color:rgba(34,32,27,.45);text-align:center;padding:18px 0;line-height:1.5;}
        .nt-aud-miss{font-size:11px;color:rgba(34,32,27,.55);padding:0 14px 10px 40px;line-height:1.45;}
        .nt-skel{background:rgba(34,32,27,.07);border-radius:8px;animation:ntPulse 1.2s ease-in-out infinite;}
        @keyframes ntPulse{0%,100%{opacity:.45}50%{opacity:1}}
        @media(max-width:900px){.nt-2col{grid-template-columns:1fr;}}
        @media(max-width:768px){.nt-content{padding:14px 16px;}.nt-aud-extra{padding-left:13px;}}
      `}</style>

      <div className="nt-content">
        {loadError && <div className="nt-feedback nt-feedback--err" style={{ marginTop: 0 }}>No pudimos cargar tus notificaciones. <button className="s-btn s-btn--text s-btn--sm" onClick={load}>Reintentar</button></div>}

        {!unlimited && (
          <div className={`nt-usage${atLimit ? ' nt-usage--full' : ''}`}>
            <span><strong>{used} de {monthlyLimit} envíos</strong> este mes · plan {plan}</span>
            <div className="nt-usage-bar"><div style={{ width: `${Math.min(100, (used / monthlyLimit) * 100)}%` }} /></div>
            <span>{atLimit ? 'Se renuevan el 1° del mes que viene.' : 'Cada envío cuenta 1, llegue a quienes llegue.'}</span>
            {(atLimit || used >= monthlyLimit - 1) && !isManager && <button className="s-btn s-btn--primary s-btn--sm" onClick={onChoosePlan}>Más envíos con otro plan</button>}
          </div>
        )}

        <div className="nt-2col">
          <div className="nt-card">
            <div className="nt-card-title">Redactá tu mensaje</div>
            <div className="nt-card-sub">Le llega como notificación al celular y queda guardado en su tarjeta del Wallet.</div>
            <textarea className="nt-textarea" placeholder="Ej: ¡Hoy 2x1 en café de 16 a 18!" value={message} maxLength={MAX_CHARS}
              onChange={e => { setMessage(e.target.value); setFeedback(null) }} />
            <div className={`nt-char${message.length > MAX_CHARS * 0.8 ? ' nt-char--warn' : ''}`}>{message.length} / {MAX_CHARS}</div>

            <div className="nt-field">A quién</div>
            {/* Parado en una sucursal: la audiencia sigue en "Todos" (para no
                mandar sin querer a un solo local), con un atajo a esa sucursal. */}
            {(() => {
              const here = locationOpts.find(l => l.id === selectedLocationId)
              if (!loaded || !here || (audience === 'location' && locPick?.id === here.id)) return null
              return (
                <button type="button" className="nt-loc-hint" onClick={() => { setLocId(here.id); setAudience('location') }}>
                  Estás viendo {here.name}. ¿Mandar solo a clientes de {here.name}? →
                </button>
              )
            })()}
            <div className="nt-auds">
              {!loaded
                ? [0, 1, 2].map(i => <div key={i} className="nt-skel" style={{ height: 50 }} />)
                : <>
                    {BASE.filter(b => !b.stampOnly || hasStamp).map(b => (
                      audienceRow({ k: b.key, label: b.label, desc: b.desc(inactiveDays) })
                    ))}
                    {activeCards.length > 1 && (
                      audienceRow({ k: 'card', label: 'Por tarjeta', desc: 'Solo a los clientes de una de tus tarjetas', locked: !canTarget, lockText: 'Growth', children: (
                        <select className="nt-select" value={cardId} onChange={e => setCardId(e.target.value)}>
                          {activeCards.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      ) })
                    )}
                    {membershipCards.length > 0 && (
                      audienceRow({ k: 'tier', label: 'Por nivel', desc: 'Beneficios para un nivel de tu membresía', locked: !canTarget, lockText: 'Growth', children: (
                        <div className="nt-row">
                          {membershipCards.length > 1 && (
                            <select className="nt-select" value={tierCardId} onChange={e => setTierCardId(e.target.value)}>
                              {membershipCards.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          )}
                          <select className="nt-select" value={tierName} onChange={e => setTierName(e.target.value)}>
                            {tiers.map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                        </div>
                      ) })
                    )}
                    {answerFields.length > 0 && (
                      audienceRow({ k: 'answer', label: 'Por respuesta', desc: 'Según lo que contestaron en el formulario (ej: talle M)', locked: !canTarget, lockText: 'Growth', children: (
                        <div className="nt-row">
                          <select className="nt-select" value={answerField?.fieldId || ''} onChange={e => { setAnswerFieldId(e.target.value); setAnswer('') }} aria-label="Pregunta">
                            {answerFields.map(f => <option key={f.fieldId} value={f.fieldId}>{f.label}{answerFields.some(x => x !== f && x.label === f.label) ? ` · ${f.cardName}` : ''}</option>)}
                          </select>
                          <select className="nt-select" value={answer} onChange={e => setAnswer(e.target.value)} aria-label="Respuesta">
                            <option value="">Elegí la respuesta</option>
                            {(answerField?.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                      ) })
                    )}
                    {locationOpts.length >= 2 && audienceRow({ k: 'location', label: 'Por sucursal', desc: 'Los que se registraron o sellaron en esa sucursal (ej: "Hoy 2x1 en Playa")', children: (
                      <div className="nt-row">
                        <select className="nt-select" value={locPick?.id || ''} onChange={e => setLocId(e.target.value)} aria-label="Sucursal">
                          {locationOpts.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                      </div>
                    ) })}
                    {audienceRow({ k: 'customers', label: 'Clientes puntuales', desc: 'Elegí a quién: cumpleaños, clientes VIP, una respuesta', locked: !canIndividual, lockText: 'Pro', children: (<>
                      <input className="nt-input" placeholder="Buscar por nombre o email…" value={search} onChange={e => setSearch(e.target.value)} />
                      {search.trim().length >= 2 && (
                        <div className="nt-results">
                          {searching && !results.length ? <div className="nt-result" style={{ cursor: 'default' }}>Buscando…</div>
                            : results.length === 0 ? <div className="nt-result" style={{ cursor: 'default' }}>Sin resultados</div>
                            : results.map(r => {
                                const already = picked.some(p => p.email === r.email)
                                return (
                                  <button key={r.email} className="nt-result" disabled={already || picked.length >= 50}
                                    onClick={() => { setPicked([...picked, r]); setSearch('') }}>
                                    <span>{r.name} <small>{r.email}</small></span><small>{already ? 'Agregado' : '+ Agregar'}</small>
                                  </button>
                                )
                              })}
                        </div>
                      )}
                      {picked.length > 0 && (
                        <div className="nt-chips">
                          {picked.map(p => <span key={p.email} className="nt-chip">{p.name}<button onClick={() => setPicked(picked.filter(x => x.email !== p.email))} aria-label={`Quitar a ${p.name}`}>×</button></span>)}
                        </div>
                      )}
                      <div className="nt-hint">Hasta 50 clientes por envío. Cuenta como 1 envío.</div>
                    </>) })}
                  </>}
            </div>

            <div className="nt-field">Cuándo</div>
            <div className="nt-types">
              <button className={`nt-type${sendType === 'now' ? ' nt-type--on' : ''}`} onClick={() => setSendType('now')}>Enviar ahora</button>
              <button className={`nt-type${sendType === 'later' ? ' nt-type--on' : ''}`} onClick={() => setSendType('later')}>Programar</button>
            </div>
            {sendType === 'later' && (
              <div style={{ marginBottom: 12 }}><DateTimePicker value={when} onChange={setWhen} peakHours={peakHours} /></div>
            )}

            <div className="nt-actions">
              <button className="s-btn s-btn--secondary nt-test" onClick={sendTestNotif} disabled={!message.trim() || !!busy} title="Te llega solo a vos (tu tarjeta registrada con tu email). No cuenta para el límite.">
                {busy === 'test' ? 'Enviando…' : 'Enviarme una prueba'}
              </button>
              <button className="s-btn s-btn--primary nt-send" onClick={send}
                disabled={!message.trim() || !!busy || atLimit || !audienceReady || (sendType === 'now' && currentReach?.reachable === 0)}>
                {busy === 'send' ? (sendType === 'later' ? 'Programando…' : 'Enviando…') : atLimit ? 'Límite del mes alcanzado' : sendLabel}
              </button>
            </div>
            {sendType === 'now' && currentReach?.reachable === 0 && audienceReady && loaded && (
              <div className="nt-hint" style={{ marginTop: 8 }}>Nadie de esta audiencia tiene la tarjeta en Apple Wallet o Google Wallet todavía.</div>
            )}
            {feedback && <div className={`nt-feedback nt-feedback--${feedback.ok ? 'ok' : 'err'}`}>{feedback.text}</div>}
            <div className="nt-wallet-note">
              El número de cada audiencia es <strong>a cuántos les llega / cuántos son</strong>: la notificación llega a quienes guardaron la tarjeta en Apple Wallet o Google Wallet. En Android, Google limita cuántos avisos muestra por tarjeta en el día.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="nt-card">
              <div className="nt-card-title">Así le llega</div>
              <div className="nt-card-sub">En la pantalla del iPhone y en su tarjeta</div>
              <div className="nt-phone">
                <div className="nt-phone-time">9:41</div>
                <div className="nt-notif">
                  <div className="nt-notif-icon">{logo ? <img src={logo} alt="" /> : passName.slice(0, 1).toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="nt-notif-head">{passName}<span>ahora</span></div>
                    <div className={`nt-notif-body${message ? '' : ' nt-notif-empty'}`}>{message || 'Tu mensaje va a aparecer acá…'}</div>
                  </div>
                </div>
              </div>
              <div className="nt-onpass">
                <div className="nt-onpass-k">Última novedad (en la tarjeta)</div>
                <div className="nt-onpass-v">{message || '—'}</div>
              </div>
            </div>
            <div className="nt-card">
              <div className="nt-card-title">Consejos</div>
              {[
                ['objetivo', 'Un mensaje concreto funciona mejor que uno general: una promo, un horario, un producto nuevo.'],
                ['hora', 'Mandalo cuando tus clientes pueden venir: antes del horario fuerte del local, no a la noche.'],
                ['escribir', 'Corto y directo: en la pantalla bloqueada se leen las primeras líneas.'],
                ['premios', '"Cerca del premio" y "Premio para entregar" son los que más traen gente de vuelta.'],
              ].map(([ic, tx]) => <div key={tx} className="nt-tip"><span className="nt-tip-ic"><Icon name={ic as IconName} size={16} /></span><span>{tx}</span></div>)}
            </div>
          </div>
        </div>

        <div className="nt-lbl">Automáticas</div>
        <AutoNotices businessId={businessId} businessName={businessName} hasStamp={hasStamp} isManager={isManager} onChoosePlan={onChoosePlan} />

        <div className="nt-lbl">Programadas</div>
        <div className="nt-card">
          {failedScheduled.map((f, i) => (
            <div key={`f${i}`} className="nt-feedback nt-feedback--err" style={{ marginTop: 0, marginBottom: 8 }}>
              No se pudo enviar la programada del {fmtDateTime(f.scheduledAt)} ("{f.message.slice(0, 40)}{f.message.length > 40 ? '…' : ''}"): {f.error}
            </div>
          ))}
          {!loaded ? <div className="nt-skel" style={{ height: 40 }} />
            : scheduled.length === 0 ? <div className="nt-empty">No tenés notificaciones programadas.</div>
            : scheduled.map(n => (
                <div key={n.index} className="nt-list-row">
                  <div className="nt-list-icon" style={{ background: 'rgba(24,95,165,.1)', color: '#185FA5' }}>
                    <Icon name="fecha" size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="nt-list-msg">{n.message}</div>
                    <div className="nt-list-meta"><span className="nt-badge">{n.audienceLabel || AUD_LABEL[n.audience] || n.audience}</span><span>{fmtDateTime(n.scheduledAt)}</span></div>
                  </div>
                  <button className="s-btn s-btn--text s-btn--sm" onClick={() => cancelScheduled(n.index)}>Cancelar</button>
                </div>
              ))}
        </div>

        <div className="nt-lbl">Enviadas</div>
        <div className="nt-card">
          {!loaded ? <div className="nt-skel" style={{ height: 40 }} />
            : history.length === 0 ? <div className="nt-empty">Todavía no mandaste ninguna notificación.<br />Probá con una promo para tus clientes "Cerca del premio".</div>
            : history.map((n, i) => (
                <div key={i} className="nt-list-row">
                  <div className="nt-list-icon" style={{ background: 'rgba(91,140,90,.1)', color: '#5B8C5A' }}>
                    <Icon name="listo" size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="nt-list-msg">{n.message}</div>
                    <div className="nt-list-meta">
                      <span className="nt-badge">{n.audienceLabel || AUD_LABEL[n.audience] || n.audience}</span>
                      <span className="nt-reached">{n.recipients != null ? `Llegó a ${n.recipients} cliente${n.recipients === 1 ? '' : 's'}` : `${n.sentCount} dispositivos`}</span>
                      <span>{fmtDateTime(n.sentAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </>
  )
}
