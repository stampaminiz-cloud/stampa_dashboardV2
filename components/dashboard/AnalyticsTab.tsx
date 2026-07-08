'use client'
import React, { useState } from 'react'
import { usePlan } from '@/data/plans'
import { useLang } from '@/data/i18n'

// ─── Types ────────────────────────────────────────────────────────────────────
interface VisitDay    { day: string; stamps: number }
interface HeatRow     { block: string; L: number; M: number; Mi: number; J: number; V: number; S: number; D: number }
interface TopCustomer { name: string; visits: number }
interface FunnelStage { stage: string; value: number }
interface CompItem    { label: string; current: number; previous: number; unit: string }
interface FreqBucket  { label: string; count: number }
interface PrizeTime   { time: string; count: number }
interface CardDesign  { id: string; name: string; type: 'stamp' | 'points' | 'membership'; isActive: boolean }

interface AnalyticsData {
  visitsOverTime: VisitDay[]
  heatmap: HeatRow[]
  topCustomers: TopCustomer[]
  funnel: FunnelStage[]
  comparison: CompItem[]
  frequency: { avgDays: number; trend: number; distribution: FreqBucket[] }
  segments: { champions: number; atRisk: number; newCustomers: number; dormant: number }
  prizeTimeDistribution: PrizeTime[]
  cardDesigns: CardDesign[]
}

type Range = '7d' | '30d' | '90d'
type CardType = 'stamp' | 'points' | 'membership'

function pctChange(cur: number, prev: number) {
  if (prev === 0) return 0
  return Math.round(((cur - prev) / prev) * 100)
}

// ─── Card type config — all labels that change per type ───────────────────────
const CARD_CONFIG: Record<CardType, {
  chartTitle: string
  chartSub: string
  retentionSub: string
  funnelStages: FunnelStage[]
  compItems: CompItem[]
  progressUnit: string
  segmentBasis: string
}> = {
  stamp: {
    chartTitle: 'Sellos otorgados por día',
    chartSub: 'Actividad del programa de sellos',
    retentionSub: 'clientes con +1 visita en los últimos 30 días',
    funnelStages: [
      { stage: 'Registro',         value: 320 },
      { stage: '1ra visita',       value: 290 },
      { stage: 'Recurrente',       value: 180 },
      { stage: 'Premio canjeado',  value: 95  },
    ],
    compItems: [
      { label: 'Nuevos clientes',  current: 287, previous: 198, unit: '' },
      { label: 'Sellos otorgados', current: 890, previous: 750, unit: '' },
      { label: 'Tasa de canje',    current: 42,  previous: 38,  unit: '%' },
    ],
    progressUnit: 'sellos',
    segmentBasis: 'por progreso de sellos',
  },
  points: {
    chartTitle: 'Puntos acumulados por día',
    chartSub: 'Actividad del programa de puntos',
    retentionSub: 'clientes con +1 acumulación en los últimos 30 días',
    funnelStages: [
      { stage: 'Registro',          value: 320 },
      { stage: '1ra acumulación',   value: 285 },
      { stage: 'Canjea puntos',     value: 160 },
      { stage: 'Premio del catálogo', value: 88 },
    ],
    compItems: [
      { label: 'Nuevos clientes',  current: 287, previous: 198, unit: '' },
      { label: 'Puntos otorgados', current: 12400, previous: 9800, unit: '' },
      { label: 'Premios canjeados', current: 88, previous: 62, unit: '' },
    ],
    progressUnit: 'puntos',
    segmentBasis: 'por puntos acumulados',
  },
  membership: {
    chartTitle: 'Visitas registradas por día',
    chartSub: 'Actividad del programa de membresía',
    retentionSub: 'miembros activos en los últimos 30 días',
    funnelStages: [
      { stage: 'Registro',       value: 320 },
      { stage: '1ra visita',     value: 290 },
      { stage: 'Alcanzó Silver', value: 142 },
      { stage: 'Alcanzó Gold+',  value: 67  },
    ],
    compItems: [
      { label: 'Nuevos miembros',  current: 287, previous: 198, unit: '' },
      { label: 'Upgrades de tier', current: 54,  previous: 38,  unit: '' },
      { label: 'Miembros Gold+',   current: 67,  previous: 48,  unit: '' },
    ],
    progressUnit: 'visitas',
    segmentBasis: 'por tier y actividad',
  },
}

// ─── Line chart ───────────────────────────────────────────────────────────────
function LineChart({ data }: { data: VisitDay[] }) {
  const max = Math.max(...data.map((d: VisitDay) => d.stamps))
  const min = Math.min(...data.map((d: VisitDay) => d.stamps))
  const r = max - min || 1
  const W = 400; const H = 110
  const px = 14; const py = 14

  const pts = data.map((d: VisitDay, i: number) => ({
    x: px + (i / (data.length - 1)) * (W - px * 2),
    y: H - py - ((d.stamps - min) / r) * (H - py * 2),
    day: d.day,
  }))

  const polyline = pts.map((p) => `${p.x},${p.y}`).join(' ')
  const area = `M${px},${H - py} ${pts.map((p) => `L${p.x},${p.y}`).join(' ')} L${W - px},${H - py} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
      <defs>
        <linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C75D3A" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#C75D3A" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#lg1)" />
      <polyline points={polyline} fill="none" stroke="#C75D3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i: number) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#C75D3A" stroke="#fff" strokeWidth="2" />
      ))}
    </svg>
  )
}

// ─── Heatmap ──────────────────────────────────────────────────────────────────
function Heatmap({ data }: { data: HeatRow[] }) {
  const days = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']
  const all = data.flatMap((r: HeatRow) => [r.L, r.M, r.Mi, r.J, r.V, r.S, r.D])
  const max = Math.max(...all)
  const op = (v: number) => (0.1 + (v / max) * 0.9).toFixed(2)
  return (
    <div className="an-heatmap">
      <div className="an-hgrid"><div />{days.map((d: string) => <div key={d} className="an-hdl">{d}</div>)}</div>
      {data.map((row: HeatRow) => {
        const vals = [row.L, row.M, row.Mi, row.J, row.V, row.S, row.D]
        return (
          <div key={row.block} className="an-hgrid">
            <div className="an-hbl">{row.block}</div>
            {vals.map((v: number, i: number) => (
              <div key={i} className="an-hcell" style={{ background: `rgba(199,93,58,${op(v)})` }} />
            ))}
          </div>
        )
      })}
      <div className="an-hlegend">
        <span>Menos</span>
        <div className="an-hscale">{[.1,.3,.5,.7,.9].map((o: number) => <div key={o} className="an-hsdot" style={{ background: `rgba(199,93,58,${o})` }} />)}</div>
        <span>Más visitas</span>
      </div>
    </div>
  )
}

// ─── Funnel ───────────────────────────────────────────────────────────────────
function Funnel({ data }: { data: FunnelStage[] }) {
  const max = data[0]?.value || 1
  return (
    <div className="an-funnel">
      {data.map((stage: FunnelStage, i: number) => {
        const pct = Math.round((stage.value / max) * 100)
        const conv = i > 0 ? Math.round((stage.value / data[i - 1].value) * 100) : null
        return (
          <div key={stage.stage} className="an-fstage">
            {conv !== null && (
              <div className="an-fconv">
                <span className="an-fconv-line" />
                <span className="an-fconv-pct">{conv}% continuaron</span>
                <span className="an-fconv-line" />
              </div>
            )}
            <div className="an-fbar-wrap">
              <div className="an-fbar" style={{ width: `${pct}%` }} />
            </div>
            <div className="an-finfo">
              <span className="an-fname">{stage.stage}</span>
              <span className="an-fval">{stage.value.toLocaleString()}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Membership tier distribution (solo para membership) ─────────────────────
function TierDistribution() {
  const tiers = [
    { name: 'Bronze', count: 111, color: '#854F0B', bg: '#FAEEDA' },
    { name: 'Silver', count: 89,  color: '#444441', bg: '#EAEAEA' },
    { name: 'Gold',   count: 52,  color: '#633806', bg: '#FAC775' },
    { name: 'Black',  count: 15,  color: '#F7F0E4', bg: '#1A1A18' },
  ]
  const total = tiers.reduce((a, t) => a + t.count, 0)
  return (
    <div className="an-card">
      <div className="an-ctitle">Distribución por tier</div>
      <div className="an-csub">Miembros activos en cada nivel</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tiers.map((t) => (
          <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: t.bg, border: `2px solid ${t.color}`, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#2B2620', width: 52 }}>{t.name}</span>
            <div style={{ flex: 1, height: 10, background: 'rgba(43,38,32,.06)', borderRadius: 5, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(t.count / total) * 100}%`, background: t.bg, borderRadius: 5, border: `1px solid ${t.color}40` }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#2B2620', width: 28, textAlign: 'right' }}>{t.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function AnalyticsTab({ data, analyticsData, cards }: { data: AnalyticsData; analyticsData?: any; cards?: any[] }) {  const { can } = usePlan()
  const fullAnalytics = can('analyticsLevel')
  const t = useLang()
  const [range, setRange] = useState<Range>('30d')
  const activeCards = (cards && cards.length > 0)
  ? cards.filter((c: any) => c.isActive)
  : data.cardDesigns.filter((c: CardDesign) => c.isActive)  
  const [selectedCardId, setSelectedCardId] = useState<string>(activeCards[0]?.id || '')

  const selectedCard = activeCards.find((c: CardDesign) => c.id === selectedCardId) || activeCards[0]
  const cardType: CardType = (selectedCard?.type as CardType) || 'stamp'
  const cfg = CARD_CONFIG[cardType]

  const RANGES: { key: Range; label: string }[] = [
    { key: '7d', label: '7 días' }, { key: '30d', label: '30 días' }, { key: '90d', label: '90 días' },
  ]

  // Use real analytics data when available, fall back to mockData
  const realMetrics = analyticsData || null
  const segTotal = data.segments.champions + data.segments.atRisk + data.segments.newCustomers + data.segments.dormant
  const prizeMax = Math.max(...data.prizeTimeDistribution.map((p: PrizeTime) => p.count))
  const freqMax  = Math.max(...data.frequency.distribution.map((b: FreqBucket) => b.count))

  const SEGMENTS = [
    { label: 'Activos',    desc: 'Visitaron recientemente', color: '#5B8C5A', bg: 'rgba(91,140,90,.1)',   val: realMetrics?.active ?? data.segments.champions    },
    { label: 'Inactivos',  desc: `Sin actividad reciente`,       color: '#B23B3B', bg: 'rgba(178,59,59,.08)',  val: realMetrics?.inactive ?? data.segments.dormant      },
    { label: 'Nuevos',     desc: `Registrados este mes`,         color: '#185FA5', bg: 'rgba(24,95,165,.1)',   val: realMetrics?.newThisMonth ?? data.segments.newCustomers },
    { label: 'Con wallet', desc: `Tienen la tarjeta instalada`,  color: '#533FB7', bg: 'rgba(83,63,183,.08)',  val: realMetrics?.withDevice ?? data.segments.atRisk },
  ]

  const TYPE_ICONS: Record<CardType, string> = {
    stamp: '☕', points: '🪙', membership: '🎫',
  }

  return (
    <>
      <style>{`
        .an-content{flex:1;overflow-y:auto;padding:20px 24px;display:flex;flex-direction:column;gap:14px;}
        .an-lbl{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:rgba(43,38,32,.38);font-weight:600;display:flex;align-items:center;gap:10px;}
        .an-lbl::after{content:'';flex:1;height:1px;background:rgba(43,38,32,.1);}
        .an-card{background:#FFFFFF;border:1px solid rgba(43,38,32,.07);border-radius:14px;padding:16px;box-shadow:0 1px 8px rgba(43,38,32,.04);}
        .an-ctitle{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:13px;color:#2B2620;margin-bottom:2px;}
        .an-csub{font-size:11px;color:rgba(43,38,32,.45);margin-bottom:12px;}

        /* ── Toolbar ── */
        .an-toolbar{display:flex;align-items:center;gap:8px;}
        .an-card-selector{display:flex;gap:6px;flex:1;}
        .an-card-pill{display:flex;align-items:center;gap:6px;font-size:12px;padding:7px 14px;border-radius:20px;border:1.5px solid rgba(43,38,32,.12);background:#FFFFFF;color:rgba(43,38,32,.55);cursor:pointer;transition:all .15s;font-family:'Inter',sans-serif;}
        .an-card-pill:hover{border-color:rgba(43,38,32,.25);}
        .an-card-pill--on{background:#1E3329;border-color:#1E3329;color:#F7F0E4;font-weight:600;}
        .an-range-group{display:flex;gap:5px;margin-left:auto;}
        .an-rpill{font-size:11px;padding:5px 12px;border-radius:20px;border:1px solid rgba(43,38,32,.12);background:#FFFFFF;color:rgba(43,38,32,.5);cursor:pointer;font-family:'Inter',sans-serif;transition:all .15s;}
        .an-rpill:hover{border-color:rgba(43,38,32,.25);}
        .an-rpill--on{background:rgba(199,93,58,.1);border-color:#C75D3A;color:#C75D3A;font-weight:600;}

        /* ── Grids ── */
        .an-2col{display:grid;grid-template-columns:1.7fr 1fr;gap:12px;}
        .an-3col{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
        .an-4col{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
        .an-chart-labels{display:flex;justify-content:space-between;margin-top:6px;}
        .an-chart-label{font-size:9.5px;color:rgba(43,38,32,.38);}

        /* ── Retention ── */
        .an-ret{display:flex;align-items:center;gap:16px;}
        .an-ret-num{font-family:'Plus Jakarta Sans',sans-serif;font-size:48px;font-weight:800;color:#C75D3A;line-height:1;flex-shrink:0;}
        .an-ret-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:13px;color:#2B2620;margin-bottom:3px;}
        .an-ret-def{font-size:10.5px;color:rgba(43,38,32,.45);line-height:1.5;}
        .an-ret-note{font-size:10.5px;color:rgba(43,38,32,.45);line-height:1.5;border-top:1px solid rgba(43,38,32,.07);padding-top:12px;margin-top:14px;}

        /* ── Segments ── */
        .an-seg-card{border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:4px;}
        .an-seg-top{display:flex;align-items:baseline;gap:5px;}
        .an-seg-val{font-family:'Plus Jakarta Sans',sans-serif;font-size:24px;font-weight:800;}
        .an-seg-pct{font-size:10px;font-weight:600;opacity:.7;}
        .an-seg-name{font-size:12px;font-weight:700;}
        .an-seg-desc{font-size:10px;opacity:.65;line-height:1.3;}

        /* ── Funnel ── */
        .an-funnel{display:flex;flex-direction:column;gap:6px;}
        .an-fstage{display:flex;flex-direction:column;gap:5px;}
        .an-fconv{display:flex;align-items:center;gap:8px;}
        .an-fconv-line{flex:1;height:1px;background:rgba(43,38,32,.08);}
        .an-fconv-pct{font-size:10px;color:#5B8C5A;font-weight:700;white-space:nowrap;flex-shrink:0;}
        .an-fbar-wrap{height:11px;background:rgba(43,38,32,.06);border-radius:6px;overflow:hidden;}
        .an-fbar{height:100%;background:linear-gradient(90deg,#C75D3A,#D4A24C);border-radius:6px;transition:width .4s;}
        .an-finfo{display:flex;justify-content:space-between;margin-top:1px;}
        .an-fname{font-size:11px;color:rgba(43,38,32,.55);}
        .an-fval{font-size:11px;font-weight:700;color:#2B2620;}

        /* ── Stat cards ── */
        .an-stat-label{font-size:10.5px;color:rgba(43,38,32,.45);margin-bottom:6px;}
        .an-stat-now{font-family:'Plus Jakarta Sans',sans-serif;font-size:24px;font-weight:800;color:#2B2620;}
        .an-stat-prev{font-size:11px;color:rgba(43,38,32,.35);margin-left:5px;}
        .an-stat-delta{display:flex;align-items:center;gap:4px;font-size:11px;font-weight:700;margin-top:5px;}
        .an-delta-up{color:#5B8C5A;}
        .an-delta-down{color:#B23B3B;}

        /* ── Heatmap ── */
        .an-heatmap{display:flex;flex-direction:column;gap:4px;margin-top:4px;}
        .an-hgrid{display:grid;grid-template-columns:52px repeat(7,1fr);gap:4px;align-items:center;}
        .an-hdl{font-size:9px;color:rgba(43,38,32,.4);text-align:center;}
        .an-hbl{font-size:9.5px;color:rgba(43,38,32,.45);font-weight:600;}
        .an-hcell{height:22px;border-radius:5px;}
        .an-hlegend{display:flex;align-items:center;gap:8px;margin-top:8px;font-size:9px;color:rgba(43,38,32,.4);}
        .an-hscale{display:flex;gap:3px;}
        .an-hsdot{width:14px;height:10px;border-radius:2px;}

        /* ── Top customers ── */
        .an-tr{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(43,38,32,.06);}
        .an-tr:last-child{border-bottom:none;}
        .an-trk{width:22px;height:22px;border-radius:7px;background:rgba(43,38,32,.06);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:rgba(43,38,32,.4);flex-shrink:0;}
        .an-trk--1{background:rgba(199,93,58,.12);color:#C75D3A;}
        .an-tn{flex:1;font-size:12px;color:#2B2620;font-weight:500;}
        .an-tv{font-size:12px;font-weight:700;color:#C75D3A;}
        .an-tbar{height:4px;background:rgba(43,38,32,.06);border-radius:2px;overflow:hidden;margin-top:3px;}
        .an-tfill{height:100%;background:linear-gradient(90deg,#C75D3A,#D4A24C);border-radius:2px;}

        /* ── Frequency ── */
        .an-freq-stat{font-family:'Plus Jakarta Sans',sans-serif;font-size:28px;font-weight:800;color:#2B2620;}
        .an-freq-unit{font-size:13px;color:rgba(43,38,32,.45);}
        .an-freq-trend{font-size:11px;font-weight:700;color:#5B8C5A;margin-bottom:12px;}
        .an-freq-bars{display:flex;flex-direction:column;gap:6px;}
        .an-freq-row{display:flex;align-items:center;gap:8px;}
        .an-freq-lbl{font-size:10px;color:rgba(43,38,32,.45);width:38px;flex-shrink:0;}
        .an-freq-bar{flex:1;height:9px;background:rgba(43,38,32,.06);border-radius:4px;overflow:hidden;}
        .an-freq-fill{height:100%;background:linear-gradient(90deg,#185FA5,#5B8C5A);border-radius:4px;}
        .an-freq-cnt{font-size:10px;font-weight:600;color:rgba(43,38,32,.5);width:20px;text-align:right;}

        /* ── Prize timing ── */
        .an-prize-bars{flex:1;display:flex;flex-direction:column;justify-content:space-between;}
        .an-prow{display:flex;align-items:center;gap:10px;}
        .an-plbl{font-size:11.5px;color:rgba(43,38,32,.6);width:120px;flex-shrink:0;}
        .an-pbar{flex:1;height:14px;background:rgba(43,38,32,.06);border-radius:7px;overflow:hidden;}
        .an-pfill{height:100%;background:linear-gradient(90deg,#D4A24C,#C75D3A);border-radius:7px;}
        .an-pcnt{font-size:12px;font-weight:700;color:#2B2620;width:30px;text-align:right;flex-shrink:0;}
        @media(max-width:900px){
          .an-2col{grid-template-columns:1fr;}
        }
        @media(max-width:768px){
          .an-content{padding:14px 16px;}
          .an-toolbar{flex-wrap:wrap;gap:8px;}
          .an-card-selector{flex-wrap:wrap;}
          .an-range-group{flex-wrap:wrap;}
          .an-2col{grid-template-columns:1fr;}
          .an-4col{grid-template-columns:1fr 1fr;}
          .an-chart-labels{display:none;}
          .an-comparison{overflow-x:auto;}
        }
        @media(max-width:480px){
          .an-4col{grid-template-columns:1fr;}
          .an-rpill{font-size:10px;padding:4px 8px;}
          .an-card-pill{font-size:11px;padding:6px 10px;}
        }
      `}</style>

      <div className="an-content">

        {/* ── Toolbar: card selector + range ── */}
        <div className="an-toolbar">
          <div className="an-card-selector">
            {activeCards.map((card: CardDesign) => (
              <button
                key={card.id}
                className={`an-card-pill${selectedCardId === card.id ? ' an-card-pill--on' : ''}`}
                onClick={() => setSelectedCardId(card.id)}
              >
                {TYPE_ICONS[card.type as CardType]} {card.name}
              </button>
            ))}
          </div>
          <div className="an-range-group">
            {RANGES.map(({ key, label }) => (
              <button key={key} className={`an-rpill${range === key ? ' an-rpill--on' : ''}`} onClick={() => setRange(key)}>{label}</button>
            ))}
          </div>
        </div>

        {/* ── 1. Retención ── */}
        <div className="an-lbl">{t('an_retention' as any)}</div>
        <div className="an-2col">
          <div className="an-card">
            <div className="an-ctitle">{cfg.chartTitle}</div>
            <div className="an-csub">{cfg.chartSub}</div>
            <LineChart data={data.visitsOverTime} />
            <div className="an-chart-labels">
              {data.visitsOverTime.map((d: VisitDay) => <span key={d.day} className="an-chart-label">{d.day}</span>)}
            </div>
          </div>
          <div className="an-card">
            <div className="an-ctitle">Tasa de retención</div>
            <div className="an-csub">Clientes que vuelven</div>
            <div className="an-ret">
              <div className="an-ret-num">73%</div>
              <div>
                <div className="an-ret-title">Regresan activamente</div>
                <div className="an-ret-def">{cfg.retentionSub}</div>
              </div>
            </div>
            <div className="an-ret-note">
              El 27% restante no registró actividad — considerá una campaña desde Notifications.
            </div>
          </div>
        </div>

        {/* ── 2-5. Advanced analytics (Growth+) ── */}
        {!fullAnalytics && (
          <div style={{ padding: 32, textAlign: 'center', background: '#fff', borderRadius: 14, border: '1px solid rgba(43,38,32,.07)', boxShadow: '0 1px 8px rgba(43,38,32,.04)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(43,38,32,.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#2B2620', marginBottom: 6 }}>Analítica avanzada</div>
            <div style={{ fontSize: 13, color: 'rgba(43,38,32,.5)', marginBottom: 20, lineHeight: 1.6 }}>Segmentos de clientes, heatmap de horarios,<br/>frecuencia de visita e insights avanzados<br/>disponibles desde el plan <strong>Growth</strong></div>
            <button style={{ background: '#C75D3A', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 24px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Mejorar a Growth →</button>
          </div>
        )}
        {fullAnalytics && <>
        {/* ── 2. Segmentos ── */}
        <div className="an-lbl">Segmentos de clientes <span style={{ fontSize: 10, fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'rgba(43,38,32,.35)' }}>{cfg.segmentBasis}</span></div>
        <div className="an-4col">
          {SEGMENTS.map(({ label, desc, color, bg, val }) => (
            <div key={label} className="an-card an-seg-card" style={{ background: bg, border: `1px solid ${color}22` }}>
              <div className="an-seg-top">
                <span className="an-seg-val" style={{ color }}>{val}</span>
                <span className="an-seg-pct" style={{ color }}>({Math.round((val / segTotal) * 100)}%)</span>
              </div>
              <div className="an-seg-name" style={{ color }}>{label}</div>
              <div className="an-seg-desc" style={{ color }}>{desc}</div>
            </div>
          ))}
        </div>

        {/* ── 3. Conversión ── */}
        <div className="an-lbl">{t('an_conversion' as any)}</div>
        <div className="an-card">
          <div className="an-ctitle">Funnel de conversión</div>
          <div className="an-csub">% de clientes que continúa a la siguiente etapa</div>
          <Funnel data={cfg.funnelStages} />
        </div>
        <div className="an-3col">
          {cfg.compItems.map((item: CompItem) => {
            const delta = pctChange(item.current, item.previous)
            const up = delta >= 0
            return (
              <div key={item.label} className="an-card">
                <div className="an-stat-label">{item.label}</div>
                <div>
                  <span className="an-stat-now">{item.current.toLocaleString()}{item.unit}</span>
                  <span className="an-stat-prev">vs {item.previous.toLocaleString()}{item.unit}</span>
                </div>
                <div className={`an-stat-delta ${up ? 'an-delta-up' : 'an-delta-down'}`}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    {up ? <path d="M12 19V5M5 12l7-7 7 7" /> : <path d="M12 5v14M5 12l7 7 7-7" />}
                  </svg>
                  {Math.abs(delta)}% vs período anterior
                </div>
              </div>
            )
          })}
        </div>

        {/* ── 4. Comportamiento ── */}
        <div className="an-lbl">{t('an_behavior' as any)}</div>
        <div className="an-2col">
          <div className="an-card">
            <div className="an-ctitle">Horarios pico</div>
            <div className="an-csub">Visitas por día y bloque horario</div>
            <Heatmap data={data.heatmap} />
          </div>
          <div className="an-card">
            {cardType === 'membership'
              ? <>
                  <div className="an-ctitle">Distribución por tier</div>
                  <div className="an-csub">Miembros en cada nivel actualmente</div>
                  <TierDistribution />
                </>
              : <>
                  <div className="an-ctitle">Top clientes</div>
                  <div className="an-csub">Por cantidad de {cfg.progressUnit}</div>
                  {data.topCustomers.map((c: TopCustomer, i: number) => {
                    const max = data.topCustomers[0]?.visits || 1
                    return (
                      <div key={c.name} className="an-tr">
                        <div className={`an-trk${i === 0 ? ' an-trk--1' : ''}`}>{i + 1}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span className="an-tn">{c.name}</span>
                            <span className="an-tv">{c.visits}</span>
                          </div>
                          <div className="an-tbar"><div className="an-tfill" style={{ width: `${(c.visits / max) * 100}%` }} /></div>
                        </div>
                      </div>
                    )
                  })}
                </>
            }
          </div>
        </div>

        {/* ── 5. Insights avanzados ── */}
        <div className="an-lbl">{t('an_insights' as any)}</div>
        <div className="an-2col">
          <div className="an-card">
            <div className="an-ctitle">Frecuencia de visita</div>
            <div className="an-csub">Días promedio entre visitas</div>
            <div style={{ marginBottom: 4 }}>
              <span className="an-freq-stat">{data.frequency.avgDays}</span>
              <span className="an-freq-unit"> días</span>
            </div>
            <div className="an-freq-trend">
              {data.frequency.trend < 0
                ? `↓ ${Math.abs(data.frequency.trend)} días menos — el programa está generando hábito`
                : `↑ ${data.frequency.trend} días más — los clientes tardan más en volver`}
            </div>
            <div className="an-freq-bars">
              {data.frequency.distribution.map((b: FreqBucket) => (
                <div key={b.label} className="an-freq-row">
                  <span className="an-freq-lbl">{b.label}</span>
                  <div className="an-freq-bar"><div className="an-freq-fill" style={{ width: `${(b.count / freqMax) * 100}%` }} /></div>
                  <span className="an-freq-cnt">{b.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="an-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="an-ctitle">¿Cuándo se canjean los premios?</div>
            <div className="an-csub">Distribución por horario y día</div>
            <div className="an-prize-bars">
              {data.prizeTimeDistribution.map((p: PrizeTime) => (
                <div key={p.time} className="an-prow">
                  <span className="an-plbl">{p.time}</span>
                  <div className="an-pbar"><div className="an-pfill" style={{ width: `${(p.count / prizeMax) * 100}%` }} /></div>
                  <span className="an-pcnt">{p.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        </>}
      </div>
    </>
  )
}