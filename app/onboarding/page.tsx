'use client'
import React, { useState, useEffect, useRef } from 'react'
import { apiOnboarding } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────
type CardType    = 'stamp' | 'points' | 'membership'
type RewardMode  = 'customer' | 'fixed'

interface OBState {
  businessName:   string
  sector:         string
  cardType:       CardType
  stampsRequired: number
  pointsPerVisit: number
  rewardMode:     RewardMode
  rewardValue:    string
  brandColor:     string
  brandLogo:      string | null
}

// ─── Sector → card recommendation ────────────────────────────────────────────
const SECTOR_CARD: Record<string, CardType> = {
  cafe: 'stamp', restaurant: 'stamp', hair: 'membership',
  gym: 'points', bakery: 'stamp', spa: 'points',
  clothing: 'membership', bookstore: 'stamp', other: 'stamp',
}

const SECTOR_STAMPS: Record<string, number> = {
  cafe: 8, restaurant: 8, bakery: 6, bookstore: 10,
  hair: 8, gym: 10, spa: 10, clothing: 8, other: 8,
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function IcoCoffee()    { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg> }
function IcoFork()      { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg> }
function IcoScissors()  { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg> }
function IcoDumbbell()  { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="5" x2="6" y2="19"/><line x1="18" y1="5" x2="18" y2="19"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg> }
function IcoBread()     { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg> }
function IcoLeaf()      { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 4 13c0-7 7-12 7-12s7 5 7 12a7 7 0 0 1-7 7z"/><path d="M11 20V13"/></svg> }
function IcoShirt()     { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/></svg> }
function IcoBook()      { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> }
function IcoStore()     { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> }
function IcoCheck()     { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> }
function IcoArrowR()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg> }
function IcoArrowL()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> }

const SECTORS = [
  { id: 'cafe',      label: 'Cafetería / Bar',        icon: <IcoCoffee /> },
  { id: 'restaurant',label: 'Restaurante',             icon: <IcoFork /> },
  { id: 'hair',      label: 'Peluquería / Barbería',   icon: <IcoScissors /> },
  { id: 'gym',       label: 'Gym / Fitness',           icon: <IcoDumbbell /> },
  { id: 'bakery',    label: 'Panadería / Pastelería',  icon: <IcoBread /> },
  { id: 'spa',       label: 'Spa / Belleza',           icon: <IcoLeaf /> },
  { id: 'clothing',  label: 'Ropa / Indumentaria',     icon: <IcoShirt /> },
  { id: 'bookstore', label: 'Librería',                icon: <IcoBook /> },
  { id: 'other',     label: 'Otro rubro',              icon: <IcoStore /> },
]

const PRESET_COLORS = ['#1E3329','#C75D3A','#185FA5','#533FB7','#854F0B','#2C2C2A','#5B8C5A','#9C3030']

function darken(hex: string): string {
  const c = hex.replace('#','')
  if (c.length !== 6) return hex
  return '#' + [0,2,4].map(i => Math.round(parseInt(c.slice(i,i+2),16)*0.72).toString(16).padStart(2,'0')).join('')
}

// ─── Stampa mascot ────────────────────────────────────────────────────────────
function StampaFrog({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx="32" cy="28" r="15" fill="#E46C31"/>
      <circle cx="68" cy="28" r="15" fill="#E46C31"/>
      <circle cx="32" cy="28" r="7" fill="#01231A"/>
      <circle cx="68" cy="28" r="7" fill="#01231A"/>
      <circle cx="35" cy="25" r="3" fill="#E46C31"/>
      <circle cx="71" cy="25" r="3" fill="#E46C31"/>
      <ellipse cx="50" cy="50" rx="36" ry="14" fill="#E46C31"/>
      <path d="M14 50 Q2 62 10 76" stroke="#E46C31" strokeWidth="9" strokeLinecap="round" fill="none"/>
      <path d="M86 50 Q98 62 90 76" stroke="#E46C31" strokeWidth="9" strokeLinecap="round" fill="none"/>
      <path d="M38 63 Q35 78 30 88" stroke="#E46C31" strokeWidth="7" strokeLinecap="round" fill="none"/>
      <path d="M62 63 Q65 78 70 88" stroke="#E46C31" strokeWidth="7" strokeLinecap="round" fill="none"/>
      <ellipse cx="27" cy="91" rx="11" ry="5" fill="#E46C31"/>
      <ellipse cx="73" cy="91" rx="11" ry="5" fill="#E46C31"/>
    </svg>
  )
}

// ─── QR code ──────────────────────────────────────────────────────────────────
function QRCode({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 21 21" fill="none">
      <rect x="0" y="0" width="7" height="7" fill="#000"/><rect x="1" y="1" width="5" height="5" fill="#fff"/><rect x="2" y="2" width="3" height="3" fill="#000"/>
      <rect x="14" y="0" width="7" height="7" fill="#000"/><rect x="15" y="1" width="5" height="5" fill="#fff"/><rect x="16" y="2" width="3" height="3" fill="#000"/>
      <rect x="0" y="14" width="7" height="7" fill="#000"/><rect x="1" y="15" width="5" height="5" fill="#fff"/><rect x="2" y="16" width="3" height="3" fill="#000"/>
      <rect x="9" y="0" width="1" height="1" fill="#000"/><rect x="11" y="1" width="2" height="1" fill="#000"/>
      <rect x="8" y="8" width="2" height="4" fill="#000"/><rect x="11" y="8" width="3" height="1" fill="#000"/>
      <rect x="9" y="13" width="3" height="1" fill="#000"/><rect x="9" y="15" width="1" height="3" fill="#000"/>
      <rect x="11" y="15" width="2" height="2" fill="#000"/><rect x="15" y="15" width="4" height="1" fill="#000"/>
      <rect x="14" y="17" width="3" height="1" fill="#000"/><rect x="18" y="16" width="2" height="2" fill="#000"/>
    </svg>
  )
}

// ─── Wallet pass preview (Apple style, same as Design tab) ────────────────────
function WalletPass({ state }: { state: OBState }) {
  const stamps = Array.from({ length: state.stampsRequired }, (_: unknown, i: number) => i < 3)
  const rewardLabel = state.rewardMode === 'customer' ? 'Lo que el cliente elija' : (state.rewardValue || 'Premio')

  return (
    <div style={{ width: 300, borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(43,38,32,.25)', background: `linear-gradient(170deg, ${state.brandColor}, ${darken(state.brandColor)})` }}>
      {/* Top */}
      <div style={{ padding: '22px 22px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          {state.brandLogo
            ? <img src={state.brandLogo} style={{ maxHeight: 36, maxWidth: 140, objectFit: 'contain' }} alt="" />
            : <div style={{ fontWeight: 800, fontSize: 20, color: '#fff', letterSpacing: '-.01em' }}>{state.businessName || 'Tu negocio'}</div>
          }
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,.55)', textTransform: 'uppercase', letterSpacing: '.06em' }}>TITULAR</div>
          <div style={{ fontSize: 13, color: '#fff', fontWeight: 600, marginTop: 2 }}>Tu cliente</div>
        </div>
      </div>

      {/* Primary value */}
      <div style={{ padding: '4px 22px 12px' }}>
        <div style={{ fontSize: 8, color: 'rgba(255,255,255,.55)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>
          {state.cardType === 'stamp' ? 'PROGRESO' : state.cardType === 'points' ? 'PUNTOS' : 'NIVEL'}
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
          {state.cardType === 'stamp' ? `3 / ${state.stampsRequired}` : state.cardType === 'points' ? '120 pts' : 'Silver'}
        </div>
      </div>

      {/* Card-type content */}
      {state.cardType === 'stamp' && (
        <div style={{ padding: '4px 22px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {stamps.map((filled: boolean, i: number) => (
            <div key={i} style={{ width: 24, height: 24, borderRadius: '50%', background: filled ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.18)', border: filled ? 'none' : '1.5px dashed rgba(255,255,255,.4)' }} />
          ))}
        </div>
      )}
      {state.cardType === 'points' && (
        <div style={{ padding: '4px 22px 16px' }}>
          <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,.2)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: '24%', height: '100%', background: 'rgba(255,255,255,.85)', borderRadius: 3 }} />
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.55)', marginTop: 6 }}>480 pts para el próximo premio</div>
        </div>
      )}
      {state.cardType === 'membership' && (
        <div style={{ padding: '4px 22px 16px', display: 'flex', gap: 6 }}>
          {['Bronze','Silver','Gold','Black'].map((t, i) => (
            <div key={t} style={{ fontSize: 9, padding: '4px 10px', borderRadius: 20, background: i === 1 ? 'rgba(255,255,255,.88)' : 'rgba(255,255,255,.16)', color: i === 1 ? '#2B2620' : 'rgba(255,255,255,.7)', fontWeight: 700 }}>{t}</div>
          ))}
        </div>
      )}

      {/* Secondary fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '10px 22px', background: 'rgba(0,0,0,.18)' }}>
        <div>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
            {state.cardType === 'membership' ? 'NIVEL ACTUAL' : state.cardType === 'points' ? 'ACUMULADO' : 'PREMIO'}
          </div>
          <div style={{ fontSize: 12, color: '#fff', fontWeight: 600, marginTop: 3 }}>
            {state.cardType === 'stamp' ? rewardLabel : state.cardType === 'points' ? '120 pts' : 'Silver'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: '.06em' }}>VISITAS</div>
          <div style={{ fontSize: 12, color: '#fff', fontWeight: 600, marginTop: 3 }}>12</div>
        </div>
      </div>

      {/* QR */}
      <div style={{ background: '#fff', padding: '18px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <QRCode size={90} />
        <div style={{ fontSize: 10, color: '#aaa' }}>Powered by Stampa</div>
      </div>
    </div>
  )
}

// ─── Google Pass ──────────────────────────────────────────────────────────────
function GooglePass({ state }: { state: OBState }) {
  const stamps = Array.from({ length: state.stampsRequired }, (_: unknown, i: number) => i < 3)
  return (
    <div style={{ width: 300, borderRadius: 18, overflow: 'hidden', boxShadow: '0 20px 60px rgba(43,38,32,.25)', background: '#fff' }}>
      <div style={{ height: 100, background: `linear-gradient(135deg, ${state.brandColor}, ${darken(state.brandColor)})`, padding: '14px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,.3)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.8)', fontWeight: 500 }}>{state.businessName || 'Tu negocio'}</span>
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>
          {state.cardType === 'stamp' ? `3 de ${state.stampsRequired} sellos` : state.cardType === 'points' ? '120 pts' : 'Silver'}
        </div>
      </div>
      <div style={{ padding: '16px 18px' }}>
        {state.cardType === 'stamp' && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {stamps.map((f: boolean, i: number) => (
              <div key={i} style={{ width: 22, height: 22, borderRadius: '50%', background: f ? '#e8f0fe' : '#f1f3f4', border: f ? '1.5px solid #1a73e8' : '1.5px dashed #c4c7c5' }} />
            ))}
          </div>
        )}
        <div style={{ borderTop: '1px solid #e8eaed', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
          <div><div style={{ fontSize: 10, color: '#5f6368' }}>Titular</div><div style={{ color: '#202124', fontWeight: 500 }}>Tu cliente</div></div>
          <div><div style={{ fontSize: 10, color: '#5f6368' }}>Visitas</div><div style={{ color: '#202124', fontWeight: 500 }}>12</div></div>
        </div>
      </div>
      <div style={{ padding: '12px 18px', borderTop: '1px solid #e8eaed', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <QRCode size={60} />
        <div style={{ fontSize: 9, color: '#5f6368' }}>Powered by Stampa</div>
      </div>
    </div>
  )
}

// ─── Nav buttons ──────────────────────────────────────────────────────────────
function Nav({ onBack, onNext, nextLabel = 'Siguiente', disabled = false, showSkip = false, onSkip }: {
  onBack: () => void; onNext: () => void; nextLabel?: string; disabled?: boolean; showSkip?: boolean; onSkip?: () => void
}) {
  return (
    <div className="ob-nav">
      <button className="ob-btn-back" onClick={onBack}>
        <IcoArrowL /> Atrás
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {showSkip && <button className="ob-btn-skip" onClick={onSkip}>Saltear</button>}
        <button className="ob-btn-next" onClick={onNext} disabled={disabled}>
          {nextLabel} <IcoArrowR />
        </button>
      </div>
    </div>
  )
}

// ─── Steps ────────────────────────────────────────────────────────────────────
function Step1({ state, onChange, onNext }: { state: OBState; onChange: (p: Partial<OBState>) => void; onNext: () => void }) {
  return (
    <div className="ob-step">
      <div className="ob-step-title">Contanos sobre tu negocio</div>
      <div className="ob-step-sub">Nombre y rubro — con esto configuramos todo lo demás.</div>

      <input
        className="ob-input"
        placeholder="Nombre del negocio"
        value={state.businessName}
        onChange={e => onChange({ businessName: e.target.value })}
        autoFocus
      />

      <div className="ob-section-label">¿En qué rubro trabajás?</div>
      <div className="ob-sector-grid">
        {SECTORS.map(s => (
          <button key={s.id}
            className={`ob-sector-btn${state.sector === s.id ? ' ob-sector-btn--on' : ''}`}
            onClick={() => onChange({ sector: s.id, cardType: SECTOR_CARD[s.id], stampsRequired: SECTOR_STAMPS[s.id] || 8 })}
          >
            <span className="ob-sector-icon">{s.icon}</span>
            <span className="ob-sector-label">{s.label}</span>
            {state.sector === s.id && <span className="ob-sector-check"><IcoCheck /></span>}
          </button>
        ))}
      </div>

      <div className="ob-nav" style={{ marginTop: 28 }}>
        <div />
        <button className="ob-btn-next" onClick={onNext} disabled={!state.businessName.trim() || !state.sector}>
          Siguiente <IcoArrowR />
        </button>
      </div>
    </div>
  )
}

function Step2({ state, onChange, onNext, onBack }: { state: OBState; onChange: (p: Partial<OBState>) => void; onNext: () => void; onBack: () => void }) {
  const recommendedType = SECTOR_CARD[state.sector] || 'stamp'
  const sectorLabel = SECTORS.find(s => s.id === state.sector)?.label || ''

  const CARD_TYPES: Array<{ id: CardType; name: string; desc: string; reason: string }> = [
    { id: 'stamp',      name: 'Tarjeta de sellos',   desc: 'Sellos por visita · Premio al completar', reason: 'Ideal para negocios de consumo frecuente. Simple y efectivo.' },
    { id: 'points',     name: 'Puntos por visita',   desc: 'Puntos acumulables · Catálogo de premios', reason: 'Perfecto cuando tenés múltiples servicios o distintos precios.' },
    { id: 'membership', name: 'Membresía por niveles', desc: 'Bronze → Silver → Gold → Black', reason: 'Genera exclusividad. Tus mejores clientes sienten que progresan.' },
  ]

  return (
    <div className="ob-step">
      <div className="ob-step-title">¿Qué tipo de programa querés ofrecer?</div>
      <div className="ob-step-sub">Te recomendamos uno según tu rubro, pero podés elegir el que quieras.</div>

      <div className="ob-card-types">
        {CARD_TYPES.map(ct => {
          const isRec = ct.id === recommendedType
          const isOn  = state.cardType === ct.id
          return (
            <button key={ct.id}
              className={`ob-type-card${isOn ? ' ob-type-card--on' : ''}${isRec ? ' ob-type-card--rec' : ''}`}
              onClick={() => onChange({ cardType: ct.id })}
            >
              <div className="ob-type-left">
                <div className="ob-type-name">{ct.name}</div>
                <div className="ob-type-desc">{ct.desc}</div>
                {isRec && <div className="ob-type-rec-note">{ct.reason}</div>}
              </div>
              <div className="ob-type-right">
                {isRec && <div className="ob-rec-badge">Recomendado para {sectorLabel}</div>}
                <div className={`ob-radio${isOn ? ' ob-radio--on' : ''}`}>
                  {isOn && <div className="ob-radio-dot" />}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <Nav onBack={onBack} onNext={onNext} />
    </div>
  )
}

function Step3({ state, onChange, onNext, onBack }: { state: OBState; onChange: (p: Partial<OBState>) => void; onNext: () => void; onBack: () => void }) {
  const titles: Record<CardType, string> = {
    stamp:      '¿Cuántas visitas para completar la tarjeta?',
    points:     '¿Cuántos puntos suma el cliente por visita?',
    membership: 'Tu programa tiene 4 niveles de membresía',
  }
  const subs: Record<CardType, string> = {
    stamp:      'Es la cantidad de visitas necesarias para que el cliente gane su premio.',
    points:     'Cada vez que el scanner registra la visita, el cliente acumula estos puntos.',
    membership: 'Los clientes suben de nivel a medida que acumulan visitas. Podés editar los beneficios desde la sección Premios.',
  }
  return (
    <div className="ob-step">
      <div className="ob-step-title">{titles[state.cardType]}</div>
      <div className="ob-step-sub">{subs[state.cardType]}</div>

      {state.cardType === 'stamp' && (
        <>
          <div className="ob-stamp-grid">
            {[4,6,8,10,12].map(n => (
              <button key={n} className={`ob-stamp-btn${state.stampsRequired === n ? ' ob-stamp-btn--on' : ''}`}
                onClick={() => onChange({ stampsRequired: n })}>
                <span className="ob-stamp-num">{n}</span>
                <span className="ob-stamp-sub">visitas</span>
              </button>
            ))}
          </div>
          <div className="ob-hint">La mayoría elige entre 6 y 8 visitas.</div>
        </>
      )}

      {state.cardType === 'points' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <input type="number" className="ob-pts-input" min={1} max={1000}
              value={state.pointsPerVisit} onChange={e => onChange({ pointsPerVisit: Number(e.target.value) })} />
            <span className="ob-pts-lbl">puntos por visita</span>
          </div>
          <div className="ob-hint" style={{ marginTop: 12 }}>Los premios y sus umbrales los configurás desde la sección Premios del dashboard.</div>
        </>
      )}

      {state.cardType === 'membership' && (
        <div className="ob-tiers">
          {[
            { name: 'Bronze', threshold: 0,  color: '#854F0B', bg: '#FAEEDA' },
            { name: 'Silver', threshold: 10, color: '#444441', bg: '#EAEAEA' },
            { name: 'Gold',   threshold: 25, color: '#633806', bg: '#FAC775' },
            { name: 'Black',  threshold: 50, color: '#F7F0E4', bg: '#1A1A18' },
          ].map(t => (
            <div key={t.name} className="ob-tier-row">
              <div className="ob-tier-badge" style={{ background: t.bg, color: t.color }}>★ {t.name}</div>
              <div className="ob-tier-info">
                <span className="ob-tier-name">{t.name}</span>
                <span className="ob-tier-threshold">{t.threshold === 0 ? 'Nivel inicial · automático' : `Desde ${t.threshold} visitas`}</span>
              </div>
            </div>
          ))}
          <div className="ob-hint">Editá nombres y beneficios desde la sección Premios.</div>
        </div>
      )}

      <Nav onBack={onBack} onNext={onNext} />
    </div>
  )
}

function Step4({ state, onChange, onNext, onBack }: { state: OBState; onChange: (p: Partial<OBState>) => void; onNext: () => void; onBack: () => void }) {
  // Membership: skip automatically (no prize to define)
  // Points: brief note
  if (state.cardType === 'membership') {
    return (
      <div className="ob-step">
        <div className="ob-step-title">Los beneficios van con los niveles</div>
        <div className="ob-step-sub">En una membresía, cada nivel tiene su propio beneficio. Vas a poder editarlos desde la sección Premios una vez que estés en el dashboard.</div>
        <div className="ob-info-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>Bronze: bienvenida · Silver: 5% dto · Gold: regalo de cumpleaños · Black: beneficios exclusivos</span>
        </div>
        <Nav onBack={onBack} onNext={onNext} nextLabel="Entendido, seguir" />
      </div>
    )
  }

  if (state.cardType === 'points') {
    return (
      <div className="ob-step">
        <div className="ob-step-title">Los premios se arman desde el dashboard</div>
        <div className="ob-step-sub">Con puntos, vos definís el catálogo de premios y los puntos que cuesta cada uno. Es más flexible que un premio fijo.</div>
        <div className="ob-info-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>Ej: Clase gratis (500 pts) · Mes de descuento (1200 pts) · Producto gratis (800 pts)</span>
        </div>
        <Nav onBack={onBack} onNext={onNext} nextLabel="Entendido, seguir" />
      </div>
    )
  }

  // Stamp: full prize config
  return (
    <div className="ob-step">
      <div className="ob-step-title">¿Cómo se define el premio?</div>
      <div className="ob-step-sub">Al completar las {state.stampsRequired} visitas, ¿qué recibe el cliente?</div>

      <div className="ob-reward-opts">
        <div className={`ob-reward-opt${state.rewardMode === 'customer' ? ' ob-reward-opt--on' : ''}`}
          onClick={() => onChange({ rewardMode: 'customer' })}>
          <div className={`ob-radio${state.rewardMode === 'customer' ? ' ob-radio--on' : ''}`}>
            {state.rewardMode === 'customer' && <div className="ob-radio-dot" />}
          </div>
          <div>
            <div className="ob-reward-title">El cliente elige su premio</div>
            <div className="ob-reward-desc">Al registrarse, el cliente completa un campo con lo que quiere como premio. El scanner ve esa respuesta al momento del canje. Cada cliente tiene su propio premio.</div>
          </div>
        </div>
        <div className={`ob-reward-opt${state.rewardMode === 'fixed' ? ' ob-reward-opt--on' : ''}`}
          onClick={() => onChange({ rewardMode: 'fixed' })}>
          <div className={`ob-radio${state.rewardMode === 'fixed' ? ' ob-radio--on' : ''}`}>
            {state.rewardMode === 'fixed' && <div className="ob-radio-dot" />}
          </div>
          <div>
            <div className="ob-reward-title">Yo defino el premio</div>
            <div className="ob-reward-desc">El mismo premio para todos los clientes.</div>
          </div>
        </div>
      </div>

      {state.rewardMode === 'fixed' && (
        <input className="ob-input" style={{ marginTop: 12 }}
          placeholder="Ej: Café gratis, 10% de descuento..."
          value={state.rewardValue} onChange={e => onChange({ rewardValue: e.target.value })} />
      )}

      <Nav onBack={onBack} onNext={onNext}
        disabled={state.rewardMode === 'fixed' && !state.rewardValue.trim()} />
    </div>
  )
}

function Step5({ state, onChange, onNext, onBack }: { state: OBState; onChange: (p: Partial<OBState>) => void; onNext: () => void; onBack: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const r = new FileReader()
    r.onload = ev => onChange({ brandLogo: ev.target?.result as string })
    r.readAsDataURL(file)
  }
  return (
    <div className="ob-step">
      <div className="ob-step-title">Dale identidad a tu tarjeta</div>
      <div className="ob-step-sub">El logo y el color se muestran en la wallet pass de tus clientes.</div>

      <div className="ob-brand-row">
        <div>
          <div className="ob-brand-label">Logo del negocio</div>
          <div className="ob-logo-zone" onClick={() => fileRef.current?.click()}>
            {state.brandLogo
              ? <img src={state.brandLogo} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} alt="" />
              : <>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(43,38,32,.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <span className="ob-logo-hint">Subir logo</span>
                </>
            }
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
          </div>
          {state.brandLogo && <button className="ob-logo-remove" onClick={() => onChange({ brandLogo: null })}>Quitar</button>}
        </div>

        <div style={{ flex: 1 }}>
          <div className="ob-brand-label">Color de la tarjeta</div>
          <div className="ob-color-row">
            {PRESET_COLORS.map(c => (
              <button key={c} className={`ob-color-dot${state.brandColor === c ? ' ob-color-dot--on' : ''}`}
                style={{ background: c }} onClick={() => onChange({ brandColor: c })} />
            ))}
            <label className="ob-color-custom" style={{ background: state.brandColor }}>
              <input type="color" value={state.brandColor} onChange={e => onChange({ brandColor: e.target.value })} style={{ opacity: 0, width: 1, height: 1 }} />
            </label>
          </div>
        </div>
      </div>

      <Nav onBack={onBack} onNext={onNext} nextLabel="Ver mi tarjeta" showSkip onSkip={onNext} />
    </div>
  )
}

function Step6({ state, onBack, onFinish }: { state: OBState; onBack: () => void; onFinish: () => void }) {
  const [platform, setPlatform] = useState<'apple' | 'google'>('apple')
  const sectorLabel = SECTORS.find(s => s.id === state.sector)?.label || ''

  return (
    <div className="ob-step ob-step--wide">
      <div className="ob-step-title">Así queda tu tarjeta</div>
      <div className="ob-step-sub">Esto es exactamente lo que van a ver tus clientes en su wallet.</div>

      <div className="ob-final-layout">
        {/* Pass preview */}
        <div>
          <div className="ob-platform-switch">
            <button className={`ob-platform-btn${platform === 'apple' ? ' ob-platform-btn--on' : ''}`} onClick={() => setPlatform('apple')}>Apple Wallet</button>
            <button className={`ob-platform-btn${platform === 'google' ? ' ob-platform-btn--on' : ''}`} onClick={() => setPlatform('google')}>Google Wallet</button>
          </div>
          {platform === 'apple' ? <WalletPass state={state} /> : <GooglePass state={state} />}
          <div className="ob-preview-note">{platform === 'apple' ? 'Apple Wallet — formato real del pase' : 'Google Wallet — tarjeta Material'}</div>
        </div>

        {/* Summary */}
        <div className="ob-summary">
          <div className="ob-summary-title">Resumen del programa</div>
          {[
            { label: 'Negocio',   val: state.businessName || '—' },
            { label: 'Rubro',     val: sectorLabel || '—' },
            { label: 'Programa',  val: state.cardType === 'stamp' ? `Sellos (${state.stampsRequired} visitas)` : state.cardType === 'points' ? `Puntos (${state.pointsPerVisit} por visita)` : 'Membresía (4 niveles)' },
            { label: 'Premio',    val: state.cardType === 'stamp' ? (state.rewardMode === 'customer' ? 'El cliente elige' : state.rewardValue || '—') : state.cardType === 'points' ? 'Catálogo de premios' : 'Beneficios por nivel' },
          ].map(({ label, val }) => (
            <div key={label} className="ob-summary-row">
              <span className="ob-summary-label">{label}</span>
              <span className="ob-summary-val">{val}</span>
            </div>
          ))}
          <div className="ob-summary-note">Todo esto se puede editar desde el dashboard en cualquier momento.</div>
          <button className="ob-finish-btn" onClick={onFinish}>Ir a mi dashboard →</button>
        </div>
      </div>

      <div className="ob-nav" style={{ marginTop: 28 }}>
        <button className="ob-btn-back" onClick={onBack}><IcoArrowL /> Atrás</button>
        <div />
      </div>
    </div>
  )
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  :root { --font-d: 'Plus Jakarta Sans', sans-serif; --font-b: 'Inter', sans-serif; }
  *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:var(--font-b); background:#FBF6EE; color:#2B2620; }
  .ob-shell { min-height:100vh; display:flex; flex-direction:column; }
  /* Header */
  .ob-header { display:flex; align-items:center; justify-content:space-between; padding:16px 32px; background:#fff; border-bottom:1px solid rgba(43,38,32,.08); }
  .ob-logo { display:flex; align-items:center; gap:9px; }
  .ob-wordmark { font-family:var(--font-d); font-weight:800; font-size:18px; color:#2B2620; letter-spacing:.05em; }
  .ob-progress-wrap { display:flex; align-items:center; gap:12px; }
  .ob-progress-bar { width:140px; height:5px; background:rgba(43,38,32,.1); border-radius:3px; overflow:hidden; }
  .ob-progress-fill { height:100%; background:linear-gradient(90deg,#C75D3A,#D4A24C); border-radius:3px; transition:width .4s ease; }
  .ob-progress-label { font-size:11.5px; color:rgba(43,38,32,.45); }
  /* Content */
  .ob-content { flex:1; display:flex; align-items:flex-start; justify-content:center; padding:48px 24px 32px; }
  .ob-step { width:100%; max-width:560px; display:flex; flex-direction:column; }
  .ob-step--wide { max-width:760px; }
  .ob-step-title { font-family:var(--font-d); font-weight:700; font-size:28px; color:#2B2620; line-height:1.2; margin-bottom:8px; }
  .ob-step-sub { font-size:14px; color:rgba(43,38,32,.5); line-height:1.6; margin-bottom:28px; max-width:480px; }
  .ob-section-label { font-size:13px; font-weight:600; color:#2B2620; margin-bottom:12px; }
  /* Nav */
  .ob-nav { display:flex; align-items:center; justify-content:space-between; margin-top:24px; }
  .ob-btn-back { display:flex; align-items:center; gap:6px; background:none; border:1.5px solid rgba(43,38,32,.15); border-radius:10px; padding:11px 20px; font-size:13px; font-weight:600; color:rgba(43,38,32,.55); cursor:pointer; font-family:var(--font-b); transition:all .15s; }
  .ob-btn-back:hover { border-color:rgba(43,38,32,.3); color:#2B2620; }
  .ob-btn-back:disabled { opacity:.4; cursor:default; }
  .ob-btn-next { display:flex; align-items:center; gap:7px; background:#C75D3A; color:#fff; border:none; border-radius:10px; padding:12px 24px; font-size:13.5px; font-weight:700; cursor:pointer; font-family:var(--font-d); transition:background .15s; }
  .ob-btn-next:hover { background:#B14F2F; }
  .ob-btn-next:disabled { opacity:.4; cursor:not-allowed; }
  .ob-btn-skip { background:none; border:none; font-size:12.5px; color:rgba(43,38,32,.4); cursor:pointer; font-family:var(--font-b); }
  .ob-btn-skip:hover { color:rgba(43,38,32,.7); }
  /* Input */
  .ob-input { width:100%; padding:14px 16px; font-size:16px; font-weight:600; border:2px solid rgba(43,38,32,.12); border-radius:12px; background:#fff; color:#2B2620; font-family:var(--font-d); outline:none; transition:border-color .15s; margin-bottom:24px; }
  .ob-input:focus { border-color:#C75D3A; }
  /* Sector */
  .ob-sector-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
  .ob-sector-btn { display:flex; align-items:center; gap:10px; padding:13px 14px; background:#fff; border:2px solid rgba(43,38,32,.1); border-radius:13px; cursor:pointer; transition:all .15s; text-align:left; position:relative; }
  .ob-sector-btn:hover { border-color:rgba(43,38,32,.25); background:#FBF6EE; }
  .ob-sector-btn--on { border-color:#C75D3A; background:rgba(199,93,58,.06); }
  .ob-sector-icon { color:rgba(43,38,32,.5); flex-shrink:0; }
  .ob-sector-btn--on .ob-sector-icon { color:#C75D3A; }
  .ob-sector-label { font-size:12.5px; font-weight:600; color:#2B2620; line-height:1.3; }
  .ob-sector-check { position:absolute; top:8px; right:8px; width:18px; height:18px; border-radius:50%; background:#C75D3A; display:flex; align-items:center; justify-content:center; color:#fff; }
  /* Card types */
  .ob-card-types { display:flex; flex-direction:column; gap:10px; }
  .ob-type-card { display:flex; align-items:flex-start; justify-content:space-between; gap:14px; padding:16px 18px; background:#fff; border:2px solid rgba(43,38,32,.1); border-radius:14px; cursor:pointer; transition:all .15s; text-align:left; }
  .ob-type-card:hover { border-color:rgba(43,38,32,.25); }
  .ob-type-card--on { border-color:#C75D3A; background:rgba(199,93,58,.05); }
  .ob-type-card--rec { border-color:#C75D3A; }
  .ob-type-name { font-size:15px; font-weight:700; color:#2B2620; margin-bottom:4px; }
  .ob-type-desc { font-size:12px; color:rgba(43,38,32,.5); }
  .ob-type-rec-note { font-size:12px; color:rgba(43,38,32,.65); margin-top:6px; line-height:1.5; }
  .ob-type-right { display:flex; flex-direction:column; align-items:flex-end; gap:10px; flex-shrink:0; }
  .ob-rec-badge { font-size:9.5px; font-weight:700; background:#C75D3A; color:#fff; padding:3px 10px; border-radius:20px; white-space:nowrap; }
  .ob-radio { width:20px; height:20px; border-radius:50%; border:2px solid rgba(43,38,32,.2); flex-shrink:0; display:flex; align-items:center; justify-content:center; margin-top:2px; }
  .ob-radio--on { border-color:#C75D3A; }
  .ob-radio-dot { width:10px; height:10px; border-radius:50%; background:#C75D3A; }
  /* Stamps */
  .ob-stamp-grid { display:flex; gap:10px; flex-wrap:wrap; }
  .ob-stamp-btn { display:flex; flex-direction:column; align-items:center; gap:4px; width:76px; padding:14px 0; background:#fff; border:2px solid rgba(43,38,32,.12); border-radius:14px; cursor:pointer; transition:all .15s; font-family:var(--font-d); }
  .ob-stamp-btn:hover { border-color:rgba(43,38,32,.3); }
  .ob-stamp-btn--on { border-color:#C75D3A; background:#C75D3A; color:#fff; }
  .ob-stamp-num { font-size:26px; font-weight:800; }
  .ob-stamp-sub { font-size:9px; opacity:.7; }
  .ob-hint { font-size:12px; color:rgba(43,38,32,.4); margin-top:10px; background:rgba(43,38,32,.04); padding:9px 14px; border-radius:9px; line-height:1.5; }
  /* Points */
  .ob-pts-input { width:88px; padding:10px; font-size:24px; font-weight:800; text-align:center; border:2px solid rgba(43,38,32,.12); border-radius:12px; background:#fff; color:#2B2620; font-family:var(--font-d); outline:none; }
  .ob-pts-input:focus { border-color:#C75D3A; }
  .ob-pts-lbl { font-size:15px; color:rgba(43,38,32,.6); }
  /* Tiers */
  .ob-tiers { display:flex; flex-direction:column; gap:8px; }
  .ob-tier-row { display:flex; align-items:center; gap:12px; padding:12px 16px; background:#fff; border:1px solid rgba(43,38,32,.08); border-radius:12px; }
  .ob-tier-badge { font-size:11px; font-weight:700; padding:4px 12px; border-radius:20px; flex-shrink:0; }
  .ob-tier-info { display:flex; flex-direction:column; gap:2px; }
  .ob-tier-name { font-size:13px; font-weight:600; color:#2B2620; }
  .ob-tier-threshold { font-size:11px; color:rgba(43,38,32,.45); }
  /* Info box */
  .ob-info-box { display:flex; align-items:flex-start; gap:10px; padding:14px 16px; background:rgba(24,95,165,.07); border:1px solid rgba(24,95,165,.2); border-radius:12px; font-size:13px; color:rgba(43,38,32,.7); line-height:1.5; }
  /* Reward */
  .ob-reward-opts { display:flex; flex-direction:column; gap:10px; }
  .ob-reward-opt { display:flex; align-items:flex-start; gap:14px; padding:16px 18px; background:#fff; border:2px solid rgba(43,38,32,.1); border-radius:14px; cursor:pointer; transition:all .15s; }
  .ob-reward-opt:hover { border-color:rgba(43,38,32,.25); }
  .ob-reward-opt--on { border-color:#C75D3A; background:rgba(199,93,58,.05); }
  .ob-reward-title { font-size:14px; font-weight:700; color:#2B2620; margin-bottom:4px; }
  .ob-reward-desc { font-size:12px; color:rgba(43,38,32,.55); line-height:1.5; }
  /* Branding */
  .ob-brand-row { display:flex; gap:24px; align-items:flex-start; margin-bottom:8px; }
  .ob-brand-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:rgba(43,38,32,.45); margin-bottom:10px; }
  .ob-logo-zone { width:90px; height:90px; border:2px dashed rgba(43,38,32,.2); border-radius:14px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; cursor:pointer; transition:all .15s; background:#fff; overflow:hidden; }
  .ob-logo-zone:hover { border-color:#C75D3A; }
  .ob-logo-hint { font-size:10px; color:rgba(43,38,32,.4); }
  .ob-logo-remove { font-size:11px; color:#B23B3B; background:none; border:none; cursor:pointer; margin-top:6px; }
  .ob-color-row { display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-bottom:8px; }
  .ob-color-dot { width:32px; height:32px; border-radius:50%; border:2.5px solid transparent; cursor:pointer; transition:all .15s; }
  .ob-color-dot--on { border-color:#2B2620; transform:scale(1.1); }
  .ob-color-custom { width:32px; height:32px; border-radius:50%; border:2px solid rgba(43,38,32,.2); cursor:pointer; overflow:hidden; display:block; }
  /* Final */
  .ob-final-layout { display:flex; gap:32px; align-items:flex-start; flex-wrap:wrap; }
  .ob-platform-switch { display:flex; gap:20px; margin-bottom:18px; }
  .ob-platform-btn { font-size:13px; color:rgba(43,38,32,.4); background:none; border:none; cursor:pointer; padding-bottom:6px; border-bottom:2.5px solid transparent; font-family:var(--font-b); transition:all .15s; }
  .ob-platform-btn--on { color:#2B2620; border-bottom-color:#C75D3A; font-weight:600; }
  .ob-preview-note { font-size:11px; color:rgba(43,38,32,.4); text-align:center; margin-top:14px; }
  .ob-summary { background:#fff; border:1px solid rgba(43,38,32,.08); border-radius:16px; padding:22px; min-width:240px; flex:1; box-shadow:0 2px 12px rgba(43,38,32,.06); }
  .ob-summary-title { font-family:var(--font-d); font-weight:700; font-size:15px; color:#2B2620; margin-bottom:14px; }
  .ob-summary-row { display:flex; justify-content:space-between; align-items:flex-start; padding:10px 0; border-bottom:1px solid rgba(43,38,32,.06); gap:16px; }
  .ob-summary-row:last-of-type { border-bottom:none; }
  .ob-summary-label { font-size:12px; color:rgba(43,38,32,.45); flex-shrink:0; }
  .ob-summary-val { font-size:12.5px; font-weight:600; color:#2B2620; text-align:right; }
  .ob-summary-note { font-size:11px; color:rgba(43,38,32,.4); margin-top:14px; padding-top:12px; border-top:1px solid rgba(43,38,32,.07); line-height:1.5; }
  .ob-finish-btn { width:100%; background:#5B8C5A; color:#fff; border:none; border-radius:12px; padding:14px; font-size:14px; font-weight:700; cursor:pointer; font-family:var(--font-d); margin-top:16px; transition:background .15s; }
  .ob-finish-btn:hover { background:#4A7349; }
  @media (max-width:640px) {
    .ob-header { padding:14px 20px; }
    .ob-progress-bar { width:100px; }
    .ob-content { padding:32px 16px 24px; }
    .ob-step-title { font-size:22px; }
    .ob-sector-grid { grid-template-columns:repeat(2,1fr); }
    .ob-final-layout { flex-direction:column; }
    .ob-brand-row { flex-direction:column; }
  }
`

function injectStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById('ob-css')) return
  const s = document.createElement('style')
  s.id = 'ob-css'
  s.textContent = CSS
  document.head.appendChild(s)
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const TOTAL = 6
  const [step, setStep] = useState(1)
  const [state, setState] = useState<OBState>({
    businessName: '', sector: '', cardType: 'stamp',
    stampsRequired: 8, pointsPerVisit: 10,
    rewardMode: 'customer', rewardValue: '',
    brandColor: '#1E3329', brandLogo: null,
  })

  useEffect(() => { injectStyles() }, [])

  function update(patch: Partial<OBState>) { setState(prev => ({ ...prev, ...patch })) }
  function next() { setStep(s => Math.min(s + 1, TOTAL)) }
  function back() { setStep(s => Math.max(s - 1, 1)) }

  const props = { state, onChange: update, onNext: next, onBack: back }

  const STEPS: Record<number, React.ReactNode> = {
    1: <Step1 {...props} />,
    2: <Step2 {...props} />,
    3: <Step3 {...props} />,
    4: <Step4 {...props} />,
    5: <Step5 {...props} />,
    6: <Step6 state={state} onBack={back} onFinish={() => {
      apiOnboarding({
        businessName: state.businessName,
        sector: state.sector,
        cardType: state.cardType,
        stampsRequired: state.stampsRequired,
        pointsPerVisit: state.pointsPerVisit,
        rewardMode: state.rewardMode === 'customer' ? 'dynamic' : 'fixed',
        rewardFixedValue: state.rewardValue || undefined,
        brandColor: state.brandColor,
        brandLogo: state.brandLogo,
      }).then((res) => {
        console.log('Onboarding response:', res)
        console.log('businessId guardado:', localStorage.getItem('stampa_business_id'))
        localStorage.removeItem('stampa_active_tab')
        window.location.href = '/dashboard'
      })
  }} />,
  }

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500&display=swap" rel="stylesheet" />
      <div className="ob-shell">
        <div className="ob-header">
          <div className="ob-logo">
            <StampaFrog size={28} />
            <span className="ob-wordmark">STAMPA</span>
          </div>
          <div className="ob-progress-wrap">
            <div className="ob-progress-bar">
              <div className="ob-progress-fill" style={{ width: `${(step / TOTAL) * 100}%` }} />
            </div>
            <span className="ob-progress-label">Paso {step} de {TOTAL}</span>
          </div>
        </div>
        <div className="ob-content">
          {STEPS[step]}
        </div>
      </div>
    </>
  )
}