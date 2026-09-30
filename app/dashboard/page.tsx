'use client'
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { mockData } from '@/data/mockData'
import { detectLang, createT, LangContext } from '@/data/i18n'
import { PlanProvider, PLAN_LIMITS, usePlan } from '@/data/plans'
import { apiMe, apiGetTeam, apiGetCards, getBusinessId, setBusinessId, BASE_URL, apiBillingStatus, apiCancelSubscription, type BillingStatus } from '@/lib/api'
import { BillingBanner, BillingStyles, PlanModal } from '@/components/dashboard/Billing'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { SettingsTab }       from '@/components/dashboard/SettingsTab'
import { CustomersTab }      from '@/components/dashboard/CustomersTab'
import { AnalyticsTab }      from '@/components/dashboard/AnalyticsTab'
import { RewardsTab }        from '@/components/dashboard/RewardsTab'
import { NotificationsTab }  from '@/components/dashboard/NotificationsTab'
import { FormTab }           from '@/components/dashboard/FormTab'
import { DesignTab }         from '@/components/dashboard/DesignTab'
import { UsersTab }          from '@/components/dashboard/UsersTab'

// ─── Types ────────────────────────────────────────────────────────────────────
type TabId = 'overview' | 'customers' | 'analytics' | 'rewards' | 'notifications' | 'design' | 'form' | 'users' | 'settings'
type CustomerStatusFilter = 'all' | 'active' | 'inactive' | 'near' | 'ready'

// ─── Nav items ────────────────────────────────────────────────────────────────
function NavIcon({ id }: { id: TabId }) {
  const icons: Record<TabId, React.ReactNode> = {
    overview:      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
    customers:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    analytics:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    rewards:       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
    notifications: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    design:        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.4-.3-.4-.5-.8-.5-1.4 0-1.1.9-2 2-2h2.4c2.3 0 4.1-1.8 4.1-4.1C21.5 6 17.2 2 12 2z"/><circle cx="6.5" cy="11.5" r="1.5" fill="currentColor"/><circle cx="9.5" cy="7.5" r="1.5" fill="currentColor"/><circle cx="14.5" cy="7.5" r="1.5" fill="currentColor"/><circle cx="17.5" cy="11.5" r="1.5" fill="currentColor"/></svg>,
    form:          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    users:         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    settings:      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  }
  return icons[id]
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const NAV_IDS: TabId[] = ['overview','customers','analytics','rewards','notifications','form','design','users','settings']

function Sidebar({ active, setActive, collapsed, setCollapsed, t, mobileOpen, setMobileOpen, owner, business, loading }: {
  active: TabId
  setActive: (t: TabId) => void
  collapsed: boolean
  setCollapsed: (c: boolean) => void
  t: (k: any) => string
  mobileOpen: boolean
  setMobileOpen: (o: boolean) => void
  owner?: any
  business?: any
  loading?: boolean
}) {
  const [showUserMenu, setShowUserMenu] = React.useState(false)
  const userMenuRef = React.useRef<HTMLDivElement>(null)

  const NAV_KEYS: Record<TabId, string> = {
    overview:'nav_overview', customers:'nav_customers', analytics:'nav_analytics',
    rewards:'nav_rewards', notifications:'nav_notifications', form:'nav_form',
    design:'nav_design', users:'nav_users', settings:'nav_settings',
  }

  // Close menu on outside click
  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleLogout() {
    localStorage.clear()
    window.location.href = '/login'
  }

  const businessName = business?.name || 'Mi negocio'
  const businessInitials = businessName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const ownerName = owner?.fullName || 'Usuario'
  const ownerEmail = owner?.email || ''
  const ownerInitials = ownerName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const plan = owner?.plan || 'Starter'

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && <div className="sb-overlay" onClick={() => setMobileOpen(false)} />}

      <aside className={`db-sb${collapsed ? ' db-sb--collapsed' : ''}${mobileOpen ? ' db-sb--mobile-open' : ''}`}>
        {/* Logo */}
        <div className="sb-logo" onClick={() => setCollapsed(!collapsed)} style={{cursor:'pointer', justifyContent: collapsed ? 'center' : 'flex-start'}}>
          {collapsed
            ? <img src="/stampa-mascot-cream.png" alt="Stampa" width={40} height={38} style={{ display: 'block' }} />
            : <BrandLogo height={40} tone="cream" />}
        </div>

        {/* Business block */}
        <div className="sb-business" style={{justifyContent: collapsed ? 'center' : 'flex-start'}}>
          {loading
            ? <div className="sb-skel-av" />
            : <div className="sb-business-av">{businessInitials}</div>
          }
          {!collapsed && (
            <div className="sb-business-info" style={{minWidth:0,flex:1,overflow:'hidden'}}>
              {loading
                ? <><div className="sb-skel-line" style={{ width: '70%' }} /><div className="sb-skel-line" style={{ width: '40%', marginTop: 6 }} /></>
                : <><div className="sb-business-name">{businessName}</div><div className="sb-business-plan">Plan {plan}</div></>
              }
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="sb-nav">
          {/* Managers: sin Equipo (lo gestiona el dueño) */}
          {NAV_IDS.filter(id => !(owner?.role === 'manager' && id === 'users')).map(id => (
            <button
              key={id}
              className={`sb-item${active === id ? ' sb-item--on' : ''}`}
              onClick={() => { setActive(id); setMobileOpen(false) }}
              title={collapsed ? t(NAV_KEYS[id] as any) : undefined}
            >
              <NavIcon id={id} />
              {!collapsed && <span className="sb-item-label">{t(NAV_KEYS[id] as any)}</span>}
              {collapsed && active === id && <div className="sb-active-dot" />}
            </button>
          ))}
        </nav>

        {/* Footer: owner */}
        <div className="sb-footer">
          <div className="sb-user-wrap" ref={userMenuRef}>
            {showUserMenu && !collapsed && (
              <div className="sb-user-popover">
                <div className="sb-popover-label">CUENTA</div>
                <button className="sb-popover-item" onClick={() => { setActive('settings'); setShowUserMenu(false) }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Mi perfil
                </button>
                <div className="sb-popover-divider" />
                <button className="sb-popover-item sb-popover-item--danger" onClick={handleLogout}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Cerrar sesión
                </button>
              </div>
            )}
            <div className="sb-user" onClick={() => setShowUserMenu(!showUserMenu)} style={{justifyContent: collapsed ? 'center' : 'flex-start'}}>
              <div className="sb-user-av">{ownerInitials}</div>
              {!collapsed && (
                <div style={{minWidth:0,flex:1,overflow:'hidden'}}>
                  <div className="sb-user-name">{ownerName}</div>
                  <div className="sb-user-role">{ownerEmail}</div>
                </div>
              )}
            </div>
          </div>

        </div>
      </aside>
    </>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────
function Header({ title, t, setMobileOpen, setActive, recentActivity: realActivity }: { title: string; t: (k: any) => string; setMobileOpen: (o: boolean) => void; setActive?: (t: any) => void; recentActivity?: any[] }) {
  const [showNotif, setShowNotif] = useState(false)
  const notifRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifRef.current  && !notifRef.current.contains(e.target as Node))  setShowNotif(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const recentActivity = (realActivity || []).slice(0, 4)

  // Punto rojo solo si hay actividad posterior a la última vez que se abrió
  // la campanita (antes estaba siempre prendido).
  const [seenAt, setSeenAt] = useState<number>(() => {
    try { return Number(localStorage.getItem('stampa_activity_seen') || 0) } catch { return 0 }
  })
  const newestAt = Math.max(0, ...(realActivity || []).map((a: any) => a.at || 0))
  const hasUnseen = newestAt > seenAt
  function toggleNotif() {
    const opening = !showNotif
    setShowNotif(opening)
    if (opening && newestAt) {
      setSeenAt(newestAt)
      try { localStorage.setItem('stampa_activity_seen', String(newestAt)) } catch { /* sin storage */ }
    }
  }

  return (
    <header className="db-header">
      {/* Mobile hamburger */}
      <button className="hd-hamburger" onClick={() => setMobileOpen(true)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>

      <h1 className="hd-title">{title}</h1>

      <div className="hd-right">
        {/* Notifications */}
        <div className="hd-icon-wrap" ref={notifRef}>
          <button className="hd-icon-btn" onClick={toggleNotif} aria-label="Actividad reciente">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            {hasUnseen && <span className="hd-notif-dot" />}
          </button>
          {showNotif && (
            <div className="hd-dropdown hd-notif-dropdown">
              <div className="hd-drop-head">
                <span className="hd-drop-title">Actividad reciente</span>
                <button className="hd-mark-read" onClick={() => { setShowNotif(false); setActive?.('customers') }}>Ver clientes →</button>
              </div>
              {recentActivity.length === 0 ? (
                <div style={{padding:'20px 16px',fontSize:12,color:'rgba(43,38,32,.4)',textAlign:'center'}}>Todavía no hay actividad reciente.</div>
              ) : recentActivity.map((a: any, i: number) => (
                <div key={i} className="hd-notif-row">
                  <div className={`hd-notif-av hd-notif-av--${a.type === 'redeem' ? 'redeem' : a.type === 'signup' ? 'signup' : 'login'}`}>
                    {a.name.split(' ').map((w: string) => w[0]).join('').slice(0,2)}
                  </div>
                  <div className="hd-notif-info">
                    <div className="hd-notif-text"><strong>{a.name}</strong> {a.action}</div>
                    <div className="hd-notif-time">{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>


      </div>
    </header>
  )
}

// ─── Overview ─────────────────────────────────────────────────────────────────
// Todo lo que muestra Inicio sale de /analytics y /analytics/detailed (datos
// reales). Antes había números fijos de ejemplo (niveles 111/89/52/15,
// flechas "↑ 0%", "9 visitas al premio") que veían todos los negocios.
const ACTIVITY_AV: Record<string, string> = { redeem: 'redeem', signup: 'signup', points: 'login', visit: 'login', tier_change: 'login', stamp: 'stamp' }

function OverviewTab({ t, analyticsData, detailedAnalytics, cards, setActive, isManager, onChoosePlan }: {
  t: (k: any) => string
  analyticsData?: any
  detailedAnalytics?: any
  cards?: any[]
  setActive: (tab: TabId) => void
  isManager: boolean
  onChoosePlan: () => void
}) {
  const a = analyticsData
  // Growth+ tiene Analítica: Inicio queda como lectura rápida y el detalle
  // vive allá. Starter ve lo básico y el resto con candado.
  const fullAnalytics = usePlan().can('analyticsLevel')
  const loadingData = !a
  const activeCards = (cards || []).filter((c: any) => c.isActive)
  const types: string[] = a?.cardTypes?.length ? a.cardTypes : [...new Set(activeCards.map((c: any) => c.type))] as string[]
  const hasStamp = types.includes('stamp')
  const hasPoints = types.includes('points')
  const hasMembership = types.includes('membership')
  const stampCard = activeCards.find((c: any) => c.type === 'stamp')
  const pointsCard = activeCards.find((c: any) => c.type === 'points')
  const initials = (n: string) => n.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  // ── Gráfico ──
  // Con un solo tipo de tarjeta, el gráfico cuenta ese tipo; con varios,
  // es "Actividad" (todo junto) con el desglose en el tooltip.
  const single = types.length === 1 ? types[0] : null
  const CHART: Record<string, { title: string; unit: string; key: string }> = {
    stamp:      { title: 'Sellos otorgados',    unit: 'sellos',     key: 'stamp' },
    points:     { title: 'Visitas con puntos',  unit: 'visitas',    key: 'points' },
    membership: { title: 'Visitas registradas', unit: 'visitas',    key: 'visit' },
  }
  const chartCfg = single ? CHART[single] : { title: 'Actividad', unit: 'movimientos', key: 'total' }

  const [granularity, setGranularity] = useState<'7d' | '30d'>('7d')
  const [hoveredBar, setHoveredBar] = useState<string | null>(null)
  const [rangeVisits, setRangeVisits] = useState<any[] | null>(null)
  const [chartLoading, setChartLoading] = useState(true)

  async function loadRange(g: '7d' | '30d') {
    setGranularity(g)
    const businessId = localStorage.getItem('stampa_business_id')
    if (!businessId) return
    setChartLoading(true)
    try {
      const res = await fetch(`${BASE_URL}/api/businesses/${businessId}/analytics/detailed?range=${g}`, {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('stampa_token') }
      })
      const data = await res.json()
      setRangeVisits(data.visitsOverTime || [])
    } catch (err) {
      console.error('Error loading chart:', err)
      setRangeVisits([])
    } finally {
      setChartLoading(false)
    }
  }
  useEffect(() => { loadRange('7d') }, [])

  const bars = (rangeVisits || []).map((v: any) => ({ label: v.day, value: v[chartCfg.key] ?? v.stamps ?? 0, raw: v }))
  const chartMax = Math.max(...bars.map(b => b.value), 1)
  const axisSteps = [1, 0.75, 0.5, 0.25, 0].map(f => Math.round(chartMax * f))
  const chartEmpty = bars.every(b => b.value === 0)
  const RANGE_SUBTITLES: Record<string, string> = { '7d': 'Últimos 7 días', '30d': 'Últimos 30 días' }
  function tooltip(b: { label: string; value: number; raw: any }) {
    if (single) return `${b.label} · ${b.value} ${chartCfg.unit}`
    const parts = [
      b.raw.stamp ? `${b.raw.stamp} sello${b.raw.stamp === 1 ? '' : 's'}` : null,
      b.raw.points ? `${b.raw.points} con puntos` : null,
      b.raw.visit ? `${b.raw.visit} visita${b.raw.visit === 1 ? '' : 's'}` : null,
      b.raw.redeem ? `${b.raw.redeem} canje${b.raw.redeem === 1 ? '' : 's'}` : null,
    ].filter(Boolean)
    return `${b.label} · ${parts.length ? parts.join(' · ') : 'sin movimientos'}`
  }

  // ── Resumen: 4 tarjetas, cada flecha compara contra un período real ──
  const fmt = (n: number | undefined) => (n ?? 0).toLocaleString('es-AR')
  const METRICS: { label: string; value?: number; color: string; delta: number | null; deltaTitle?: string; sub: string }[] = [
    { label: 'Clientes', value: a?.total, color: '#C75D3A', delta: null,
      sub: `${fmt(a?.active)} activos · ${fmt(a?.inactive)} inactivos` },
    { label: 'Nuevos este mes', value: a?.newThisMonth, color: '#185FA5', delta: a?.newLastMonth > 0 ? a.newDelta : null, deltaTitle: 'Respecto al mismo período del mes pasado',
      sub: `mes pasado a esta fecha: ${fmt(a?.newLastMonth)}` },
    { label: 'Visitas · 7 días', value: a?.visitsThisWeek, color: '#5B8C5A', delta: a?.visitsWeekDelta ?? null, deltaTitle: 'Respecto a los 7 días anteriores',
      sub: `hoy: ${fmt(a?.visitsToday)} · ${new Date().toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', '')}. pasado: ${fmt(a?.visitsSameDayLastWeek)}` },
    { label: 'Premios entregados este mes', value: a?.rewardsThisMonth, color: '#9C7530', delta: a?.rewardsDelta ?? null, deltaTitle: 'Respecto al mismo período del mes pasado',
      sub: `mes pasado a esta fecha: ${fmt(a?.rewardsLastMonth)}` },
  ]

  // ── Para atender (según los tipos de tarjeta) ──
  const ATTENTION = [
    hasStamp && { key: 'deliver', value: a?.toDeliver ?? 0, label: 'Premios para entregar', hint: 'Tarjetas completas: el premio se entrega desde la app de escaneo.', strong: true },
    hasStamp && { key: 'near', value: a?.nearPrize ?? 0, label: 'A 1–2 sellos del premio', hint: 'Buen momento para una notificación.' },
    hasPoints && { key: 'redeem', value: a?.canRedeem ?? 0, label: 'Pueden canjear un premio', hint: 'Ya les alcanzan los puntos.' },
    hasMembership && { key: 'level', value: a?.nearLevel ?? 0, label: 'Cerca de subir de nivel', hint: 'A 2 visitas o menos.' },
  ].filter(Boolean) as { key: string; value: number; label: string; hint: string; strong?: boolean }[]

  // ── Métricas avanzadas (solo las que aplican) ──
  const ADVANCED = [
    { v: `${a?.recurringRate ?? 0}%`, l: 'Clientes que volvieron', sub: '2 visitas o más', color: '#5B8C5A' },
    { v: `${a?.redemptionRate ?? 0}%`, l: 'Tasa de canje', sub: 'canjearon al menos una vez', color: '#C75D3A' },
    hasStamp && a?.avgStampProgress != null && { v: `${a.avgStampProgress}%`, l: 'Progreso promedio', sub: 'de la tarjeta de sellos', color: '#185FA5' },
    hasStamp && stampCard && { v: `${stampCard.stampsRequired}`, l: 'Visitas al premio', sub: 'sellos para completar', color: '#9C7530' },
    !hasStamp && hasPoints && pointsCard?.pointsPerVisit && { v: `${pointsCard.pointsPerVisit}`, l: 'Puntos por visita', sub: 'suma cada escaneo', color: '#9C7530' },
  ].filter(Boolean) as { v: string; l: string; sub: string; color: string }[]

  // ── Primeros pasos (se tildan solos) ──
  const setup = a?.setup
  const STEPS = setup ? [
    { done: setup.hasCustomers, title: 'Compartí el link de tu formulario', body: 'Tus clientes se registran y se llevan la tarjeta a su Wallet.', cta: 'Ver mi formulario', tab: 'form' as TabId },
    !isManager && { done: setup.hasScanner, title: 'Creá un empleado para la app de escaneo', body: 'Cada empleado entra con su propio PIN.', cta: 'Ir a Equipo', tab: 'users' as TabId },
    !isManager && { done: setup.scannerUsed, title: 'Activá el celular del local', body: 'Equipo → "Activar dispositivo de escaneo" y escaneá el QR con la app.', cta: 'Ir a Equipo', tab: 'users' as TabId },
    { done: setup.hasVisits, title: 'Escaneá la tarjeta de tu primer cliente', body: 'Con la app, sumale su primer sello, puntos o visita.', cta: null, tab: null },
  ].filter(Boolean) as { done: boolean; title: string; body: string; cta: string | null; tab: TabId | null }[] : []
  const stepsDone = STEPS.filter(s => s.done).length
  const showSetup = STEPS.length > 0 && stepsDone < STEPS.length

  // ── Insights ──
  const insights: { type: string; text: string }[] = []
  if (a?.toDeliver > 0) insights.push({ type: 'info', text: `${a.toDeliver} cliente${a.toDeliver === 1 ? ' completó su tarjeta y espera' : 's completaron su tarjeta y esperan'} el premio.` })
  if (a?.nearPrize > 0) insights.push({ type: 'positive', text: `${a.nearPrize} cliente${a.nearPrize === 1 ? ' está' : 's están'} a 1–2 sellos del premio: es un buen momento para mandarles una notificación.` })
  if (a?.newLastMonth > 0 && a?.newDelta) insights.push({ type: a.newDelta > 0 ? 'positive' : 'warning', text: a.newDelta > 0 ? `Los registros nuevos crecieron ${a.newDelta}% respecto al mismo período del mes pasado.` : `Los registros nuevos bajaron ${Math.abs(a.newDelta)}% respecto al mismo período del mes pasado.` })
  if (a?.visitsWeekDelta != null && Math.abs(a.visitsWeekDelta) >= 10) insights.push({ type: a.visitsWeekDelta > 0 ? 'positive' : 'warning', text: a.visitsWeekDelta > 0 ? `Esta semana hubo ${a.visitsWeekDelta}% más visitas que la anterior.` : `Esta semana las visitas bajaron ${Math.abs(a.visitsWeekDelta)}% respecto a la anterior: una notificación puede ayudar.` })
  if (a?.topChosenRewards?.length > 0) insights.push({ type: 'info', text: `"${a.topChosenRewards[0].prize}" es el premio más elegido: tenelo bien abastecido.` })
  if (a?.inactive > 0 && a?.total > 0 && a.inactive / a.total >= 0.3) insights.push({ type: 'warning', text: `${Math.round(a.inactive / a.total * 100)}% de tus clientes no vuelve hace tiempo. Probá una notificación a "Inactivos".` })

  const Sk = ({ w = '60%', h = 12 }: { w?: string | number; h?: number }) => <div className="ov-skel" style={{ width: w, height: h }} />

  return (
    <div className="db-content">
      {showSetup && (
        <div className="db-card ov-setup">
          <div className="ov-setup-head">
            <div>
              <div className="ov-card-title">Primeros pasos</div>
              <div className="ov-card-sub">{stepsDone} de {STEPS.length} listos · con esto ya podés sumar tu primer cliente</div>
            </div>
            <div className="ov-setup-bar"><div style={{ width: `${(stepsDone / STEPS.length) * 100}%` }} /></div>
          </div>
          <div className="ov-setup-list">
            {STEPS.map(step => (
              <div key={step.title} className={`ov-setup-step${step.done ? ' ov-setup-step--done' : ''}`}>
                <div className="ov-setup-check">{step.done ? '✓' : ''}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ov-setup-title">{step.title}</div>
                  {!step.done && <div className="ov-setup-body">{step.body}</div>}
                </div>
                {!step.done && step.cta && step.tab && <button className="ov-setup-cta" onClick={() => setActive(step.tab!)}>{step.cta}</button>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="ov-section-label">{t('section_summary' as any)}</div>
      <div className="ov-metric-grid">
        {METRICS.map(({ label, value, delta, deltaTitle, color, sub }) => (
          <div key={label} className="ov-metric-card">
            <div className="ov-metric-top">
              <div className="ov-metric-dot" style={{ background: `${color}20` }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: color }} />
              </div>
              {delta != null && (
                <span className={`ov-delta ${delta >= 0 ? 'ov-delta--up' : 'ov-delta--down'}`} title={deltaTitle}>
                  {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}%
                </span>
              )}
            </div>
            <div className="ov-metric-value">{loadingData ? <Sk w={48} h={26} /> : fmt(value)}</div>
            <div className="ov-metric-label">{label}</div>
            <div className="ov-metric-sub">{loadingData ? <Sk w="80%" h={10} /> : sub}</div>
          </div>
        ))}
      </div>

      <div className="ov-two-col">
        <div className="db-card">
          <div className="ov-card-title-row">
            <div>
              <div className="ov-card-title">{chartCfg.title}</div>
              <div className="ov-card-sub">{RANGE_SUBTITLES[granularity]}</div>
            </div>
            <div className="ov-granularity-toggle">
              {(['7d', '30d'] as const).map(g => (
                <button key={g} className={`ov-gran-btn${granularity === g ? ' ov-gran-btn--on' : ''}`} onClick={() => loadRange(g)}>{g.replace('d', ' días')}</button>
              ))}
            </div>
          </div>
          {chartLoading
            ? <div className="ov-chart-skel">{Array.from({ length: 7 }).map((_, i) => <div key={i} style={{ height: `${30 + ((i * 37) % 60)}%` }} />)}</div>
            : chartEmpty
            ? <div className="ov-chart-loading">Todavía no hay movimientos en este período. Aparecen cuando escaneás tarjetas con la app.</div>
            : <div className="ov-chart-wrap">
                <div className="ov-chart-axis">
                  {axisSteps.map((v, i) => <span key={i}>{v}</span>)}
                </div>
                <div className="ov-chart-plot">
                  <div className="ov-chart-gridlines">
                    {axisSteps.map((_, i) => <div key={i} className="ov-chart-gridline" />)}
                  </div>
                  <div className="ov-bars">
                    {bars.map(b => (
                      <div key={b.label} className="ov-bar-col" onMouseEnter={() => setHoveredBar(b.label)} onMouseLeave={() => setHoveredBar(null)}>
                        {hoveredBar === b.label && (
                          <div className="ov-bar-tooltip">{tooltip(b)}<div className="ov-bar-tooltip-arrow" /></div>
                        )}
                        <div className={`ov-bar-fill${hoveredBar === b.label ? ' ov-bar-fill--active' : ''}`} style={{ height: `${(b.value / chartMax) * 100}%` }} />
                        <div className="ov-bar-label">{b.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
          }
          {fullAnalytics && (
            <button className="ov-more-link" onClick={() => setActive('analytics')}>Ver analítica completa →</button>
          )}
        </div>
        <div className="db-card">
          <div className="ov-card-title">Para atender</div>
          <div className="ov-card-sub">Lo que conviene mirar hoy</div>
          <div className="ov-attention">
            {loadingData
              ? [0, 1].map(i => <div key={i} className="ov-attention-row"><Sk w={32} h={22} /><Sk w="70%" /></div>)
              : ATTENTION.length === 0
              ? <div className="ov-empty-note">Activá una tarjeta en Diseño para ver esto.</div>
              : ATTENTION.map(item => (
                  <div key={item.key} className={`ov-attention-row${item.strong && item.value > 0 ? ' ov-attention-row--strong' : ''}`}>
                    <div className="ov-attention-num">{item.value}</div>
                    <div>
                      <div className="ov-attention-label">{item.label}</div>
                      <div className="ov-attention-hint">{item.hint}</div>
                    </div>
                  </div>
                ))
            }
          </div>
        </div>
      </div>

      {!loadingData && a.total > 0 ? (
        <>
          {!fullAnalytics && (
            <>
              <div className="ov-section-label">{t('section_advanced' as any)}</div>
              <div className="ov-adv-grid">
                {ADVANCED.slice(0, 1).map(({ v, l, sub, color }) => (
                  <div key={l} className="ov-adv-card" style={{ borderTop: `3px solid ${color}` }}>
                    <div className="ov-adv-val" style={{ color }}>{v}</div>
                    <div className="ov-adv-label">{l}</div>
                    <div className="ov-adv-sub">{sub}</div>
                  </div>
                ))}
                <div className="ov-adv-card ov-locked">
                  <div className="ov-locked-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="ov-adv-label">{['Tasa de canje', hasStamp && 'progreso promedio', hasMembership && 'clientes por nivel', 'horarios pico'].filter(Boolean).join(', ')} y más</div>
                    <div className="ov-adv-sub">Disponible desde el plan Growth</div>
                  </div>
                  {isManager
                    ? <span className="ov-adv-sub">Pedile al dueño que mejore el plan</span>
                    : <button className="ov-setup-cta" onClick={onChoosePlan}>Ver planes</button>}
                </div>
              </div>
            </>
          )}

          <div className="ov-section-label">{t('section_engagement' as any)}</div>
          <div className="ov-three-col">
            {hasStamp && (
              <div className="db-card ov-card--fill">
                <div className="ov-card-title-row"><span className="ov-card-title">Premios más elegidos</span></div>
                {a.topChosenRewards?.length > 0
                  ? <div className="ov-reward-list">
                      {a.topChosenRewards.map((r: any, i: number) => {
                        const max = a.topChosenRewards[0]?.count || 1
                        return (
                          <div key={r.prize} className="ov-reward-row">
                            <span className={`ov-reward-rank${i === 0 ? ' ov-reward-rank--first' : ''}`}>{i + 1}</span>
                            <div className="ov-reward-info">
                              <div className="ov-reward-name">{r.prize}</div>
                              <div className="ov-reward-bar"><div className="ov-reward-fill" style={{ width: `${(r.count / max) * 100}%` }} /></div>
                            </div>
                            <span className="ov-reward-count">{r.count}</span>
                          </div>
                        )
                      })}
                    </div>
                  : <div className="ov-empty-note">{stampCard?.rewardMode !== 'dynamic' ? 'Tu tarjeta tiene un premio fijo para todos.' : 'Aparece cuando tus clientes elijan su premio al registrarse.'}</div>
                }
              </div>
            )}

            <div className="db-card">
              <div className="ov-card-title-row">
                <span className="ov-card-title">{t('recent_activity' as any)}</span>
              </div>
              {detailedAnalytics?.recentActivity?.length > 0
                ? detailedAnalytics.recentActivity.map((act: any, i: number) => (
                    <div key={i} className="ov-activity-row">
                      <div className={`ov-av ov-av--${ACTIVITY_AV[act.type] || 'stamp'}`}>{initials(act.name)}</div>
                      <div className="ov-activity-text"><strong>{act.name}</strong> {act.action}</div>
                      <div className="ov-activity-time">{act.time}</div>
                    </div>
                  ))
                : <div className="ov-empty-note">Todavía no hay actividad registrada.</div>
              }
            </div>

            <div className="db-card ov-card--fill">
              <div className="ov-card-title">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C75D3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: 'middle' }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                {t('smart_insights' as any)}
              </div>
              {insights.length > 0
                ? <div className="ov-insight-list">{insights.map((ins, i) => <div key={i} className={`ov-insight ov-insight--${ins.type}`}>{ins.text}</div>)}</div>
                : <div className="ov-empty-note">Todavía no hay suficientes datos para generar insights.</div>}
            </div>
          </div>
        </>
      ) : !loadingData && !showSetup ? (
        <div className="db-card" style={{ display: 'flex', flex: 1 }}>
          <EmptyState
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>}
            title="Los datos van a aparecer acá"
            body="Cuando tus primeros clientes se registren vas a ver métricas de retención, crecimiento y engagement."
            cta="Ver mi formulario"
            onCta={() => setActive('form')}
          />
        </div>
      ) : null}
    </div>
  )
}

// ─── Coming soon ──────────────────────────────────────────────────────────────
function EmptyState({ icon, title, body, cta, onCta }: {
  icon: React.ReactNode; title: string; body: string; cta?: string; onCta?: () => void
}) {
  return (
    <div className="db-empty">
      <div className="db-empty-icon">{icon}</div>
      <div className="db-empty-title">{title}</div>
      <div className="db-empty-body">{body}</div>
      {cta && onCta && <button className="db-empty-cta" onClick={onCta}>{cta}</button>}
    </div>
  )
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="db-coming-soon">
      <div className="db-coming-soon-mark" />
      <div className="db-coming-soon-label">{label}</div>
    </div>
  )
}

// ─── Mapeo de clientes: API cruda → shape que espera CustomersTab ─────────────
// "hace 5 min", "hace 3 h", "hace 2 días" — antes salía en inglés ("5m ago").
function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return 'Sin visitas aún'
  const diffMin = Math.floor((Date.now() - timestamp) / 60000)
  if (diffMin < 1) return 'Ahora'
  if (diffMin < 60) return `Hace ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `Hace ${diffH} h`
  const diffDays = Math.floor(diffH / 24)
  if (diffDays < 60) return `Hace ${diffDays} día${diffDays === 1 ? '' : 's'}`
  return new Date(timestamp).toLocaleDateString('es-AR')
}

function mapCustomersForTab(rawCustomers: any[]) {
  return rawCustomers.map(c => ({
    id: c.id,
    name: c.name,
    email: c.email,
    status: c.status,
    near: !!c.near,
    ready: !!c.ready,
    joined: c.createdAt ? new Date(c.createdAt).toLocaleDateString('es-AR') : '—',
    lastUpdate: c.lastUpdate || 0,
    lastActivity: formatRelativeTime(c.lastUpdate),
    cards: (c.cards || []).map((card: any) => ({
      customerId: card.customerId,
      cardId: card.cardId,
      cardType: card.cardType,
      cardName: card.cardName,
      cardStampsRequired: card.cardStampsRequired,
      stamps: card.stamps || 0,
      pointsBalance: card.pointsBalance || 0,
      membershipTier: card.membershipTier || null,
      lastUpdate: card.lastUpdate || 0,
      premio: card.premio,
      formResponses: card.formResponses || [],
    })),
  }))
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html, body { overflow-x: hidden; }
  body{font-family:'Inter',sans-serif;background:#FBF6EE;color:#2B2620;}

  .db-shell{display:flex;height:100vh;height:100dvh;overflow:hidden;}
  .db-main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0;}

  .db-sb{width:230px;flex-shrink:0;background:#1B412F;display:flex;flex-direction:column;padding:6px 12px;transition:width .25s ease;}
  .db-sb--collapsed{width:68px;}
  .sb-overlay{display:none;}
  .sb-logo{display:flex;align-items:center;gap:10px;padding:6px 10px 18px;}
  .sb-logo-mark{width:36px;height:36px;border-radius:10px;background:#C75D3A;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .sb-wordmark{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:20px;color:#F7F0E4;letter-spacing:-.01em;white-space:nowrap;}
  .sb-nav{display:flex;flex-direction:column;gap:2px;flex:1;}
  .sb-item{display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:10px;border:none;cursor:pointer;background:transparent;color:rgba(247,240,228,.5);font-family:'Inter',sans-serif;font-size:15px;font-weight:500;width:100%;text-align:left;transition:all .15s;position:relative;white-space:nowrap;}
  .db-sb--collapsed .sb-item{justify-content:center;padding:11px;}
  .sb-item:hover{background:rgba(255,255,255,.07);color:rgba(247,240,228,.85);}
  .sb-item--on{background:rgba(199,93,58,.22);color:#E8794F;font-weight:600;}
  .sb-item-label{font-size:15px;}
  .sb-active-dot{position:absolute;right:8px;top:50%;transform:translateY(-50%);width:6px;height:6px;border-radius:50%;background:#C75D3A;}
  .sb-footer{padding-top:12px;border-top:1px solid rgba(255,255,255,.08);margin-top:8px;}
  .sb-user{display:flex;align-items:center;gap:9px;flex:1;min-width:0;}
  .sb-user-av{width:32px;height:32px;border-radius:50%;background:#C75D3A;display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;font-weight:700;flex-shrink:0;}
  .sb-user-name{font-size:12px;color:#F7F0E4;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .sb-user-role{font-size:10.5px;color:rgba(247,240,228,.4);}
  .sb-collapse-btn{background:none;border:none;cursor:pointer;color:rgba(247,240,228,.4);padding:6px;border-radius:8px;display:flex;align-items:center;flex-shrink:0;transition:all .15s;}
  .sb-collapse-btn:hover{background:rgba(255,255,255,.08);color:rgba(247,240,228,.8);}
  .sb-business{display:flex;align-items:center;gap:9px;padding:8px 10px;margin-bottom:8px;background:rgba(255,255,255,.06);border-radius:10px;}
  .sb-business-av{width:32px;height:32px;border-radius:8px;background:#C75D3A;display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;font-weight:700;flex-shrink:0;}
  .sb-business-info{min-width:0;}
  .sb-business-name{font-size:13px;color:#F7F0E4;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .sb-business-plan{font-size:10px;color:rgba(247,240,228,.4);}
  .sb-skel-av{width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,.1);flex-shrink:0;animation:pulse 1.5s infinite;}
  .sb-skel-line{height:9px;border-radius:4px;background:rgba(255,255,255,.1);animation:pulse 1.5s infinite;}
  .sb-user-wrap{position:relative;width:100%;}
  .sb-user{display:flex;align-items:center;gap:9px;cursor:pointer;padding:6px 8px;border-radius:9px;transition:background .15s;width:100%;}
  .sb-user:hover{background:rgba(199,93,58,.2);}
  .sb-user-av{width:32px;height:32px;border-radius:50%;background:#C75D3A;display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;font-weight:700;flex-shrink:0;}
  .sb-user-name{font-size:12px;color:#F7F0E4;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .sb-user-role{font-size:10.5px;color:rgba(247,240,228,.4);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}

  .sb-user-popover{position:absolute;bottom:calc(100% + 8px);left:0;right:0;background:#2A4438;border:1px solid rgba(255,255,255,.15);border-radius:12px;padding:6px;box-shadow:0 8px 24px rgba(0,0,0,.3);z-index:100;}
  .sb-popover-label{font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:rgba(247,240,228,.3);padding:4px 8px 6px;font-weight:700;}
  .sb-popover-item{display:flex;align-items:center;gap:8px;width:100%;padding:9px 10px;border:none;background:none;cursor:pointer;color:rgba(247,240,228,.8);font-size:13px;font-family:'Inter',sans-serif;border-radius:8px;text-align:left;transition:background .1s;}
  .sb-popover-item:hover{background:rgba(255,255,255,.08);}
  .sb-popover-item--danger{color:#E57373;}
  .sb-popover-item--danger:hover{background:rgba(178,59,59,.15);}
  .sb-popover-divider{height:1px;background:rgba(255,255,255,.08);margin:4px 0;}

  .db-header{height:62px;flex-shrink:0;background:#FFFFFF;border-bottom:1px solid rgba(43,38,32,.08);display:flex;align-items:center;padding:0 24px;gap:14px;}
  .hd-hamburger{display:none;background:none;border:none;cursor:pointer;color:rgba(43,38,32,.6);padding:6px;border-radius:8px;}
  .hd-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:20px;color:#2B2620;flex:1;}
  .hd-right{display:flex;align-items:center;gap:10px;}
  .hd-icon-wrap{position:relative;}
  .hd-icon-btn{width:38px;height:38px;border-radius:10px;background:#FBF6EE;border:1px solid rgba(43,38,32,.1);display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(43,38,32,.55);position:relative;transition:all .15s;}
  .hd-icon-btn:hover{background:#F0EBE3;}
  .hd-notif-dot{position:absolute;top:7px;right:7px;width:7px;height:7px;border-radius:50%;background:#C75D3A;border:1.5px solid #fff;}

  .hd-dropdown{position:absolute;top:calc(100% + 8px);right:0;background:#FFFFFF;border:1px solid rgba(43,38,32,.1);border-radius:14px;box-shadow:0 8px 32px rgba(43,38,32,.12);z-index:50;min-width:280px;}
  .hd-drop-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid rgba(43,38,32,.07);}
  .hd-drop-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:14px;color:#2B2620;}
  .hd-mark-read{font-size:11px;color:#C75D3A;font-weight:600;background:none;border:none;cursor:pointer;}
  .hd-notif-dropdown{width:320px;}
  .hd-notif-row{display:flex;align-items:flex-start;gap:10px;padding:10px 14px;border-bottom:1px solid rgba(43,38,32,.06);}
  .hd-notif-row:last-child{border-bottom:none;}
  .hd-notif-av{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0;}
  .hd-notif-av--redeem{background:rgba(199,93,58,.15);color:#C75D3A;}
  .hd-notif-av--signup{background:rgba(91,140,90,.15);color:#5B8C5A;}
  .hd-notif-av--login{background:rgba(24,95,165,.12);color:#185FA5;}
  .hd-notif-info{flex:1;}
  .hd-notif-text{font-size:12px;color:rgba(43,38,32,.75);line-height:1.4;}
  .hd-notif-text strong{color:#2B2620;font-weight:600;}
  .hd-notif-time{font-size:10.5px;color:rgba(43,38,32,.4);margin-top:2px;}
  .hd-user-dropdown{width:240px;}
  .hd-user-head{display:flex;align-items:center;gap:10px;padding:14px 16px;}
  .hd-user-av-lg{width:36px;height:36px;border-radius:50%;background:#C75D3A;display:flex;align-items:center;justify-content:center;font-size:12px;color:#fff;font-weight:700;flex-shrink:0;}
  .hd-user-name{font-size:13px;font-weight:700;color:#2B2620;}
  .hd-user-email{font-size:11px;color:rgba(43,38,32,.45);}
  .hd-drop-divider{height:1px;background:rgba(43,38,32,.07);margin:4px 0;}
  .hd-user-item{display:flex;align-items:center;gap:10px;width:100%;padding:10px 16px;background:none;border:none;cursor:pointer;font-size:13px;color:rgba(43,38,32,.7);font-family:'Inter',sans-serif;transition:background .1s;text-align:left;}
  .hd-user-item:hover{background:#FBF6EE;color:#2B2620;}
  .hd-user-item--danger{color:#B23B3B;}
  .hd-user-item--danger:hover{background:rgba(178,59,59,.06);}

  .db-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;padding:48px 24px;text-align:center;gap:10px;}
  .db-empty-icon{width:52px;height:52px;border-radius:16px;background:rgba(199,93,58,.08);display:flex;align-items:center;justify-content:center;color:#C75D3A;margin-bottom:8px;}
  .db-empty-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:16px;color:#2B2620;}
  .db-empty-body{font-size:13px;color:rgba(43,38,32,.5);max-width:300px;line-height:1.7;}
  .db-empty-cta{margin-top:12px;padding:11px 22px;background:#C75D3A;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;}
  .db-empty-cta:hover{background:#B34E2F;}

  .db-content{flex:1;overflow-y:auto;padding:22px 24px;display:flex;flex-direction:column;gap:16px;}
  .db-card{background:#FFFFFF;border:1px solid rgba(43,38,32,.07);border-radius:14px;padding:16px;box-shadow:0 1px 8px rgba(43,38,32,.04);}

  .ov-section-label{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:rgba(43,38,32,.38);font-weight:600;display:flex;align-items:center;gap:10px;}
  .ov-section-label::after{content:'';flex:1;height:1px;background:rgba(43,38,32,.1);}
  .ov-metric-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
  .ov-metric-card{background:#FFFFFF;border:1px solid rgba(43,38,32,.07);border-radius:14px;padding:16px;box-shadow:0 1px 8px rgba(43,38,32,.04);}
  .ov-metric-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
  .ov-metric-dot{width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;}
  .ov-delta{font-size:11.5px;font-weight:600;}
  .ov-delta--up{color:#5B8C5A;}.ov-delta--down{color:#B23B3B;}
  .ov-metric-value{font-family:'Plus Jakarta Sans',sans-serif;font-size:28px;font-weight:800;color:#2B2620;line-height:1;margin-bottom:4px;}
  .ov-metric-label{font-size:12px;color:rgba(43,38,32,.5);}
  .ov-metric-sub{font-size:10.5px;color:rgba(43,38,32,.4);margin-top:4px;line-height:1.35;}
  .ov-more-link{display:block;margin:10px 0 0 auto;background:none;border:none;padding:0;font-size:12px;font-weight:600;color:#C75D3A;cursor:pointer;font-family:inherit;}
  .ov-more-link:hover{text-decoration:underline;}
  .ov-locked{grid-column:span 3;display:flex;align-items:center;gap:14px;background:rgba(43,38,32,.025);border-style:dashed;}
  .ov-locked-icon{width:34px;height:34px;border-radius:10px;background:rgba(43,38,32,.06);color:rgba(43,38,32,.45);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .ov-two-col{display:grid;grid-template-columns:1.8fr 1fr;gap:12px;}
  .ov-card-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:13.5px;color:#2B2620;margin-bottom:2px;}
  .ov-card-sub{font-size:11px;color:rgba(43,38,32,.45);margin-bottom:12px;}
  .ov-card-title-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
  .ov-granularity-toggle{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;max-width:200px;}
  .ov-gran-btn{font-size:11px;padding:5px 11px;border-radius:20px;border:1.5px solid rgba(43,38,32,.15);background:none;color:rgba(43,38,32,.5);cursor:pointer;font-family:'Inter',sans-serif;transition:all .15s;white-space:nowrap;}
  .ov-gran-btn--on{border-color:#C75D3A;background:rgba(199,93,58,.08);color:#C75D3A;font-weight:600;}
  .ov-chart-loading{font-size:12px;color:rgba(43,38,32,.4);padding:32px 0;text-align:center;}
  .ov-chart-wrap{display:flex;gap:8px;margin-top:8px;}
  .ov-chart-axis{display:flex;flex-direction:column;justify-content:space-between;height:90px;font-size:9.5px;color:rgba(43,38,32,.35);text-align:right;flex-shrink:0;padding-bottom:16px;}
  .ov-chart-plot{position:relative;flex:1;}
  .ov-chart-gridlines{position:absolute;top:0;left:0;right:0;height:90px;display:flex;flex-direction:column;justify-content:space-between;pointer-events:none;}
  .ov-chart-gridline{border-top:1px solid rgba(43,38,32,.07);}
  .ov-bars{display:flex;align-items:flex-end;gap:8px;height:90px;position:relative;z-index:1;}
  .ov-bar-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;height:100%;justify-content:flex-end;position:relative;}
  .ov-bar-fill{width:100%;background:#C75D3A;border-radius:4px 4px 0 0;min-height:4px;cursor:default;transition:opacity .15s;}
  .ov-bar-fill:hover{opacity:.8;}
  .ov-bar-fill--active{box-shadow:0 0 0 2px rgba(199,93,58,.3);}
  .ov-bar-tooltip{position:absolute;bottom:calc(100% + 10px);left:50%;transform:translateX(-50%);background:#2B2620;color:#fff;font-size:11px;font-weight:600;padding:6px 10px;border-radius:8px;white-space:nowrap;z-index:2;pointer-events:none;}
  .ov-bar-tooltip-arrow{position:absolute;top:100%;left:50%;transform:translateX(-50%);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:5px solid #2B2620;}
  .ov-bar-label{font-size:10px;color:rgba(43,38,32,.45);}
  .ov-near-card{display:flex;flex-direction:column;justify-content:center;text-align:center;}
  .ov-near-num{font-family:'Plus Jakarta Sans',sans-serif;font-size:48px;font-weight:800;color:#C75D3A;line-height:1;margin:8px 0 4px;}
  .ov-near-label{font-size:12px;color:rgba(43,38,32,.45);}
  .ov-adv-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
  .ov-adv-card{background:#FFFFFF;border:1px solid rgba(43,38,32,.07);border-radius:14px;padding:16px;box-shadow:0 1px 8px rgba(43,38,32,.04);}
  .ov-adv-val{font-family:'Plus Jakarta Sans',sans-serif;font-size:24px;font-weight:800;margin-bottom:4px;}
  .ov-adv-label{font-size:12px;color:rgba(43,38,32,.5);}
  .ov-three-col{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
  .ov-card--fill{display:flex;flex-direction:column;}
  .ov-reward-list{flex:1;display:flex;flex-direction:column;justify-content:flex-start;gap:2px;}
  .ov-insight-list{flex:1;display:flex;flex-direction:column;justify-content:flex-start;gap:10px;}
  .ov-reward-row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(43,38,32,.06);}
  .ov-reward-row:last-child{border-bottom:none;}
  .ov-reward-rank{width:22px;height:22px;border-radius:6px;background:rgba(43,38,32,.06);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:rgba(43,38,32,.4);flex-shrink:0;}
  .ov-reward-rank--first{background:rgba(199,93,58,.12);color:#C75D3A;}
  .ov-reward-info{flex:1;}
  .ov-reward-name{font-size:12px;color:#2B2620;margin-bottom:4px;}
  .ov-reward-bar{height:5px;background:rgba(43,38,32,.07);border-radius:3px;overflow:hidden;}
  .ov-reward-fill{height:100%;background:linear-gradient(90deg,#C75D3A,#D4A24C);border-radius:3px;}
  .ov-reward-count{font-size:11px;font-weight:600;color:rgba(43,38,32,.5);flex-shrink:0;}
  .ov-activity-row{display:flex;align-items:center;gap:9px;padding:8px 0;border-bottom:1px solid rgba(43,38,32,.06);}
  .ov-activity-row:last-child{border-bottom:none;}
  .ov-av{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;}
  .ov-av--redeem{background:rgba(199,93,58,.15);color:#C75D3A;}
  .ov-av--signup{background:rgba(91,140,90,.15);color:#5B8C5A;}
  .ov-av--login{background:rgba(24,95,165,.12);color:#185FA5;}
  .ov-av--stamp{background:rgba(83,63,183,.12);color:#533FB7;}
  .ov-skel{border-radius:6px;background:linear-gradient(90deg,rgba(43,38,32,.06) 25%,rgba(43,38,32,.11) 50%,rgba(43,38,32,.06) 75%);background-size:200% 100%;animation:ov-shimmer 1.2s ease-in-out infinite;}
  @keyframes ov-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
  .ov-chart-skel{display:flex;align-items:flex-end;gap:10px;height:150px;padding:10px 4px 22px;}
  .ov-chart-skel div{flex:1;border-radius:6px 6px 0 0;background:rgba(43,38,32,.07);animation:ov-pulse 1.2s ease-in-out infinite;}
  @keyframes ov-pulse{0%,100%{opacity:.6}50%{opacity:1}}
  .ov-attention{display:flex;flex-direction:column;gap:10px;margin-top:14px;}
  .ov-attention-row{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:12px;background:rgba(43,38,32,.03);}
  .ov-attention-row--strong{background:rgba(199,93,58,.08);}
  .ov-attention-num{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:22px;color:#2B2620;min-width:34px;text-align:center;}
  .ov-attention-row--strong .ov-attention-num{color:#C75D3A;}
  .ov-attention-label{font-size:13px;font-weight:600;color:#2B2620;}
  .ov-attention-hint{font-size:11px;color:rgba(43,38,32,.45);margin-top:2px;}
  .ov-adv-sub{font-size:10.5px;color:rgba(43,38,32,.4);margin-top:2px;}
  .ov-setup{margin-bottom:6px;border:1px solid rgba(199,93,58,.22);}
  .ov-setup-head{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:12px;}
  .ov-setup-bar{width:160px;height:6px;border-radius:999px;background:rgba(43,38,32,.08);overflow:hidden;}
  .ov-setup-bar div{height:100%;background:#C75D3A;border-radius:999px;transition:width .3s;}
  .ov-setup-list{display:flex;flex-direction:column;gap:6px;}
  .ov-setup-step{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:12px;background:#FBF6EE;}
  .ov-setup-step--done{background:transparent;}
  .ov-setup-check{width:22px;height:22px;border-radius:50%;border:2px solid rgba(43,38,32,.2);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#fff;flex-shrink:0;}
  .ov-setup-step--done .ov-setup-check{background:#5B8C5A;border-color:#5B8C5A;}
  .ov-setup-title{font-size:13px;font-weight:600;color:#2B2620;}
  .ov-setup-step--done .ov-setup-title{color:rgba(43,38,32,.45);text-decoration:line-through;}
  .ov-setup-body{font-size:11.5px;color:rgba(43,38,32,.5);margin-top:2px;}
  .ov-setup-cta{flex-shrink:0;background:#C75D3A;color:#fff;border:none;border-radius:9px;padding:8px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;}
  .ov-empty-note{font-size:12px;color:rgba(43,38,32,.4);padding:16px 0;text-align:center;}
  .ov-activity-text{flex:1;font-size:12px;color:rgba(43,38,32,.65);}
  .ov-activity-text strong{color:#2B2620;font-weight:600;}
  .ov-activity-time{font-size:10px;color:rgba(43,38,32,.35);flex-shrink:0;}
  .ov-live{display:flex;align-items:center;gap:5px;font-size:11px;color:#5B8C5A;}
  .ov-live-dot{width:7px;height:7px;border-radius:50%;background:#5B8C5A;animation:pulse 1.5s infinite;}
  .ov-insight{font-size:12px;color:rgba(43,38,32,.7);line-height:1.5;padding:12px 14px;border-radius:9px;background:rgba(43,38,32,.03);}
  .ov-insight--positive{border-left:2.5px solid #5B8C5A;}
  .ov-insight--warning{border-left:2.5px solid #C75D3A;}
  .ov-insight--info{border-left:2.5px solid #185FA5;}

  .db-coming-soon{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;}
  .db-coming-soon-mark{width:36px;height:36px;border-radius:10px;background:#C75D3A;opacity:.15;}
  .db-coming-soon-label{font-size:14px;color:rgba(43,38,32,.38);}

  @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.4;}}

  @media (max-width: 768px) {
    .db-sb{position:fixed;left:0;transform:translateX(-100%);top:0;bottom:0;z-index:50;width:260px !important;transition:transform .25s ease;box-shadow:4px 0 24px rgba(43,38,32,.2);}
    .db-sb--mobile-open{transform:translateX(0) !important;}
    .db-sb--collapsed{transform:translateX(-100%) !important;}
    .sb-overlay{display:block;position:fixed;inset:0;background:rgba(43,38,32,.4);z-index:49;backdrop-filter:blur(2px);}
    .hd-hamburger{display:flex;}
    .ov-metric-grid{grid-template-columns:repeat(2,1fr);}
    .ov-adv-grid{grid-template-columns:repeat(2,1fr);}
    .ov-locked{grid-column:1 / -1;flex-wrap:wrap;}
    .ov-three-col{grid-template-columns:1fr;}
    .ov-two-col{grid-template-columns:1fr;}
    .db-content{padding:16px;}
    .db-header{padding:0 16px;}
  }
  @media (max-width: 480px) {
    .ov-metric-grid{grid-template-columns:1fr 1fr;}
    .hd-title{font-size:17px;}
  }
`


// ─── Main page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [active, setActive]         = useState<TabId>('overview')
  const [collapsed, setCollapsed]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [t, setT]                   = useState(() => createT('es'))
  const [owner, setOwner]           = useState<any>(null)
  // Suscripción del dueño: banner de prueba/pausa y ventana de planes.
  const [billing, setBilling]       = useState<BillingStatus | null>(null)
  const [showPlans, setShowPlans]   = useState(false)
  const [business, setBusiness]     = useState<any>(null)
  const [businessId, setBusinessIdState] = useState<string | null>(null)
  const [team, setTeam]             = useState<any[]>([])
  const [cards, setCards]           = useState<any[]>([])
  const [customers, setCustomers]                   = useState<any[]>([])
  const [customersPage, setCustomersPage]           = useState(1)
  const [customersTotalPages, setCustomersTotalPages] = useState(1)
  const [customersTotal, setCustomersTotal]         = useState(0)
  const [customersSearch, setCustomersSearch]       = useState('')
  const [customersStatus, setCustomersStatus]       = useState<CustomerStatusFilter>('all')
  const [customersCounts, setCustomersCounts]       = useState<{ all: number; active: number; inactive: number; near: number; ready: number } | null>(null)
  const [customersInactiveDays, setCustomersInactiveDays] = useState(60)
  const [customersCardFilter, setCustomersCardFilter] = useState<string>('all')
  const [customersSortKey, setCustomersSortKey]     = useState<'name' | 'progress' | 'status' | 'lastActivity' | 'card'>('progress')
  const [customersSortDir, setCustomersSortDir]     = useState<'asc' | 'desc'>('desc')
  const [customersLoading, setCustomersLoading]     = useState(false)
  // Email del cliente a abrir al llegar a Clientes (desde los rankings de Analítica)
  const [customerToOpen, setCustomerToOpen]         = useState<string | null>(null)
  const customersCacheRef = useRef<Map<string, any>>(new Map())
  const [analyticsData, setAnalyticsData]           = useState<any>(null)
  const [detailedAnalytics, setDetailedAnalytics]   = useState<any>(null)
  const [loading, setLoading]       = useState(true)

  async function loadBusiness() {
    try {
      const { owner: o, businesses } = await apiMe()
      setOwner(o)
      apiBillingStatus().then(setBilling).catch(() => setBilling(null))
      if (o?.role === 'manager') setActive(prev => (prev === 'users' ? 'overview' : prev))
      // Cuenta sin negocio = no terminó el onboarding (cerró la ventana a
      // mitad de camino): va a terminarlo. Antes entraba a un dashboard de
      // "Mi negocio" vacío donde nada funcionaba.
      if (businesses.length === 0 && o?.role !== 'manager') {
        window.location.replace('/onboarding')
        return
      }
      if (businesses.length > 0) {
        const bid = businesses[0]._id
        setBusinessId(bid)
        setBusinessIdState(bid)
        setBusiness(businesses[0])

        const authHeaders = {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('stampa_token'),
        }

        const cardsPromise      = apiGetCards(bid)
        // Equipo es solo del dueño: el backend le responde 403 a un manager.
        const teamPromise       = o?.role === 'manager' ? Promise.resolve([]) : apiGetTeam(bid)
        const analyticsPromise  = fetch(`${BASE_URL}/api/businesses/${bid}/analytics`, { headers: authHeaders }).then(r => r.json())
        const detailedPromise   = fetch(`${BASE_URL}/api/businesses/${bid}/analytics/detailed?range=30d`, { headers: authHeaders }).then(r => r.json())
        const customersPromise  = fetch(`${BASE_URL}/api/businesses/${bid}/customers?page=1&limit=50&sortBy=progress&sortDir=desc`, { headers: authHeaders }).then(r => r.json())
        const [teamRes, cardsRes, analyticsRes, customersRes, detailedRes] = await Promise.allSettled([
          teamPromise, cardsPromise, analyticsPromise, customersPromise, detailedPromise,
        ])

        if (teamRes.status === 'fulfilled') {
          setTeam((teamRes.value as any[]).map(u => ({
            id:           u._id,
            name:         u.fullName,
            email:        u.email || '',
            role:         u.role,
            access:       u.role === 'manager' ? 'Dashboard' : 'Scanner app',
            status:       u.status,
            lastActivity: u.lastActivityAt ? new Date(u.lastActivityAt).toLocaleDateString('es-AR') : '—',
          })))
        } else console.error('team load error:', teamRes.reason)

        if (cardsRes.status === 'fulfilled') {
          setCards((cardsRes.value as any[]).map(c => ({
            id:             c._id,
            name:           c.name,
            type:           c.type,
            isActive:       c.isActive,
            color:          c.color || '#1B412F',
            secondColor:    c.secondColor || '#132F22',
            stampsRequired: c.stampsRequired || 8,
            rewardMode:     c.rewardMode || null,
            rewardField:    c.rewardFixedValue || null,
            logoUrl:        c.logoUrl || null,
            earnedIcon:     c.earnedIcon || null,
            emptyIcon:      c.emptyIcon || null,
            pointsIcon:     c.pointsIcon || null,
            flipImageUrl:   c.flipImageUrl || null,
            flipMessage:    c.flipMessage || null,
            flipSubMessage: c.flipSubMessage || null,
            pointsPerVisit: c.pointsPerVisit || null,
            textColor: c.textColor || null,
            publicDescription: c.publicDescription || null,
          })))
        } else console.error('cards load error:', cardsRes.reason)

        if (analyticsRes.status === 'fulfilled') setAnalyticsData(analyticsRes.value)
        else console.error('analytics load error:', analyticsRes.reason)

        if (customersRes.status === 'fulfilled') {
          setCustomers(customersRes.value.customers || [])
          setCustomersCounts(customersRes.value.counts || null)
          setCustomersTotal(customersRes.value.total || 0)
          setCustomersTotalPages(customersRes.value.pages || 1)
          customersCacheRef.current.set('1||all|progress|desc', customersRes.value)
        } else console.error('customers load error:', customersRes.reason)



        if (detailedRes.status === 'fulfilled') setDetailedAnalytics(detailedRes.value)
        else console.error('detailed analytics load error:', detailedRes.reason)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function refreshCards() {
    if (!businessId) return
    try {
      const cardsData = await apiGetCards(businessId)
      setCards((cardsData as any[]).map(c => ({
        id:             c._id,
        name:           c.name,
        type:           c.type,
        isActive:       c.isActive,
        color:          c.color || '#1B412F',
        secondColor:    c.secondColor || '#132F22',
        stampsRequired: c.stampsRequired || 8,
        rewardMode:     c.rewardMode || null,
        rewardField:    c.rewardFixedValue || null,
        logoUrl:        c.logoUrl || null,
        earnedIcon:     c.earnedIcon || null,
        emptyIcon:      c.emptyIcon || null,
        pointsIcon:     c.pointsIcon || null,
        flipImageUrl:   c.flipImageUrl || null,
        flipMessage:    c.flipMessage || null,
        flipSubMessage: c.flipSubMessage || null,
            pointsPerVisit: c.pointsPerVisit || null,
            textColor: c.textColor || null,
            publicDescription: c.publicDescription || null,
      })))
    } catch (err) {
      console.error('Error refreshing cards:', err)
    }
  }

  async function loadCustomers(
    page: number,
    search: string,
    status: CustomerStatusFilter,
    sortKey: 'name' | 'progress' | 'status' | 'lastActivity' | 'card' = customersSortKey,
    sortDir: 'asc' | 'desc' = customersSortDir,
    cardFilter: string = customersCardFilter,
    opts: { bypassCache?: boolean } = {}
  ) {
    if (!businessId) return

    const cacheKey = `${page}|${search}|${status}|${sortKey}|${sortDir}|${cardFilter}`
    const cached = customersCacheRef.current.get(cacheKey)
    if (cached && !opts.bypassCache) {
      setCustomers(cached.customers || [])
      setCustomersCounts(cached.counts || null)
      setCustomersTotal(cached.total || 0)
      setCustomersTotalPages(cached.pages || 1)
      setCustomersPage(page)
      setCustomersSortKey(sortKey)
      setCustomersSortDir(sortDir)
      return
    }

    setCustomersLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50', sortBy: sortKey, sortDir })
      if (search) params.set('search', search)
      if (status !== 'all') params.set('status', status)
      if (cardFilter !== 'all') params.set('cardId', cardFilter)
      const res = await fetch(`${BASE_URL}/api/businesses/${businessId}/customers?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('stampa_token'),
        }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
      customersCacheRef.current.set(cacheKey, data)
      setCustomers(data.customers || [])
      setCustomersCounts(data.counts || null)
      if (data.inactiveDays) setCustomersInactiveDays(data.inactiveDays)
      setCustomersTotal(data.total || 0)
      setCustomersTotalPages(data.pages || 1)
      setCustomersPage(page)
      setCustomersSortKey(sortKey)
      setCustomersSortDir(sortDir)
    } catch (err) {
      console.error('Error loading customers page:', err)
    } finally {
      setCustomersLoading(false)
    }
  }

  // Al entrar a Clientes se vuelve a pedir la página actual: los escaneos
  // de la app cambian sellos/puntos y la lista guardada quedaba vieja.
  useEffect(() => {
    if (active !== 'customers' || !businessId) return
    customersCacheRef.current.clear()
    loadCustomers(customersPage, customersSearch, customersStatus, customersSortKey, customersSortDir, customersCardFilter, { bypassCache: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, businessId])

  useLayoutEffect(() => {
    const saved = localStorage.getItem('stampa_active_tab') as TabId | null
    if (saved) setActive(saved)
    // (si era 'users' y entra un manager, el efecto de abajo lo corrige)
  }, [])

  const loadedRef = useRef(false)
  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    setT(() => createT(detectLang()))
    loadBusiness()
  }, [])

  const TITLES: Record<TabId, string> = {
    overview:'nav_overview', customers:'nav_customers', analytics:'nav_analytics',
    rewards:'nav_rewards', notifications:'nav_notifications', design:'nav_design',
    form:'nav_form', users:'nav_users', settings:'nav_settings',
  } as any

  // Abre Clientes filtrado por ese email, con la ficha abierta (desde los
  // rankings de Analítica y los canjes de Premios).
  function openCustomerByEmail(email: string) {
    setCustomersSearch(email); setCustomersStatus('all'); setCustomersCardFilter('all')
    loadCustomers(1, email, 'all', customersSortKey, customersSortDir, 'all')
    setCustomerToOpen(email)
    setActive('customers'); localStorage.setItem('stampa_active_tab', 'customers')
  }

  function renderTab() {
    switch (active) {
      case 'overview':      return <OverviewTab t={t} analyticsData={analyticsData} detailedAnalytics={detailedAnalytics} cards={cards} setActive={tab => { setActive(tab); localStorage.setItem('stampa_active_tab', tab) }} isManager={owner?.role === 'manager'} onChoosePlan={() => setShowPlans(true)} />
      case 'customers': return (analyticsData?.total ?? customersCounts?.all ?? customersTotal) > 0 || customersSearch
        ? <CustomersTab
            customers={mapCustomersForTab(customers)}
            cards={cards.filter((c: any) => c.isActive)}
            cardFilter={customersCardFilter}
            page={customersPage}
            totalPages={customersTotalPages}
            total={customersTotal}
            counts={customersCounts}
            inactiveDays={customersInactiveDays}
            search={customersSearch}
            autoOpenEmail={customerToOpen}
            onAutoOpened={() => setCustomerToOpen(null)}
            statusFilter={customersStatus}
            sortKey={customersSortKey}
            sortDir={customersSortDir}
            loading={customersLoading}
            isManager={owner?.role === 'manager'}
            plan={(owner?.plan || 'Starter') as any}
            businessTotal={analyticsData?.total ?? null}
            onChoosePlan={() => setShowPlans(true)}
            onSearchChange={(q: string) => { setCustomersSearch(q); loadCustomers(1, q, customersStatus) }}
            onStatusFilterChange={(s: CustomerStatusFilter) => { setCustomersStatus(s); loadCustomers(1, customersSearch, s) }}
            onSortChange={(key: any, dir: any) => loadCustomers(1, customersSearch, customersStatus, key, dir)}
            onPageChange={(p: number) => loadCustomers(p, customersSearch, customersStatus)}
            onCardFilterChange={(cid: string) => { setCustomersCardFilter(cid); loadCustomers(1, customersSearch, customersStatus, customersSortKey, customersSortDir, cid) }}
            onRefresh={() => { customersCacheRef.current.clear(); loadCustomers(customersPage, customersSearch, customersStatus, customersSortKey, customersSortDir, customersCardFilter, { bypassCache: true }) }}
          />
        : <div className="db-content"><EmptyState
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>}
            title="Todavía no tenés clientes registrados"
            body="Compartí el formulario de registro con tus clientes para que se sumen al programa."
            cta="Ver formulario"
            onCta={() => { setActive('form'); localStorage.setItem('stampa_active_tab', 'form') }}
          /></div>
      case 'analytics': return analyticsData?.total > 0 || PLAN_LIMITS[(owner?.plan || 'Starter') as keyof typeof PLAN_LIMITS]?.analyticsLevel !== 'full'
        ? <AnalyticsTab analyticsData={analyticsData} cards={cards} isManager={owner?.role === 'manager'} onChoosePlan={() => setShowPlans(true)}
            onOpenCustomer={openCustomerByEmail} />
        : <div className="db-content"><EmptyState
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>}
            title="Las métricas aparecen cuando tenés clientes"
            body="Analytics te muestra retención, visitas y comportamiento. Empezá compartiendo tu formulario de registro."
            cta="Ver formulario"
            onCta={() => { setActive('form'); localStorage.setItem('stampa_active_tab', 'form') }}
          /></div>
      case 'rewards': return <RewardsTab cards={cards} businessId={businessId} onGoToDesign={() => { setActive('design'); localStorage.setItem('stampa_active_tab', 'design') }} onOpenCustomer={openCustomerByEmail} />
          case 'notifications': return <NotificationsTab
          businessId={businessId}
          cards={cards}
          businessName={business?.name || 'Tu negocio'}
          inactiveDays={customersInactiveDays}
          isManager={owner?.role === 'manager'}
          onChoosePlan={() => setShowPlans(true)}
        />
      case 'form':          return <FormTab businessName={business?.name || 'Tu negocio'} businessSlug={business?.slug} cards={cards} businessId={businessId}
          isManager={owner?.role === 'manager'} onChoosePlan={() => setShowPlans(true)}
          onGoToDesign={() => { setActive('design'); localStorage.setItem('stampa_active_tab', 'design') }} />
      case 'design':        return <DesignTab key={businessId ?? 'loading'} cards={cards} businessId={businessId} businessName={business?.name} onSaved={refreshCards}
          onChoosePlan={() => setShowPlans(true)}
          onGoTo={(tab) => { setActive(tab); localStorage.setItem('stampa_active_tab', tab) }} />
      case 'users':         if (owner?.role === 'manager') return null
                            return <UsersTab key={businessId ?? 'loading'} users={team} businessId={businessId} onRefresh={loadBusiness} owner={owner} />
      case 'settings':      return (
        <SettingsTab
          key={businessId ?? 'loading'}
          businessId={businessId ?? undefined}
          onSave={loadBusiness}
          ownerName={owner?.fullName || ''}
          ownerEmail={owner?.email || ''}
          isManager={owner?.role === 'manager'}
          billing={billing}
          onChoosePlan={() => setShowPlans(true)}
          onCancelSubscription={async () => {
            const res = await apiCancelSubscription()
            setBilling(res)
          }}
          deletionRequestedAt={owner?.deletionRequestedAt || null}
          business={business ? {
            ...mockData.business,
            name: business.name,
            sector: business.sector,
            timezone: business.timezone || mockData.business.timezone,
            inactiveDays: business.inactiveDays || mockData.business.inactiveDays,
            alerts: business.alerts || mockData.business.alerts,
            plan: owner?.plan || mockData.business.plan,
            planActiveCards: cards.filter((c: any) => c.isActive).length,
            planMaxCards: PLAN_LIMITS[(owner?.plan || 'Starter') as keyof typeof PLAN_LIMITS]?.maxActiveCards ?? mockData.business.planMaxCards,
          } : mockData.business}
        />
      )
      default: return <ComingSoon label={t(TITLES[active])} />
    }
  }

  return (
    <PlanProvider plan={(owner?.plan || mockData.business.plan) as any}>
    <LangContext.Provider value={t}>
    <style dangerouslySetInnerHTML={{ __html: CSS }} />
    <div className="db-shell">
      <Sidebar
        active={active}
        setActive={tab => { setActive(tab); localStorage.setItem('stampa_active_tab', tab) }}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        t={t}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        owner={owner}
        business={business}
        loading={loading}
      />
      <div className="db-main">
        <Header title={t(TITLES[active] as any)} t={t} setMobileOpen={setMobileOpen} setActive={setActive} recentActivity={detailedAnalytics?.recentActivity} />
        <BillingStyles />
        <BillingBanner billing={billing} isManager={owner?.role === 'manager'} onChoosePlan={() => setShowPlans(true)} />
        {loading
          ? <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, border: '3px solid rgba(43,38,32,.1)', borderTopColor: '#C75D3A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <div style={{ fontSize: 12, color: 'rgba(43,38,32,.35)' }}>Cargando...</div>
              </div>
            </div>
          : renderTab()
        }
      </div>
    </div>
    {showPlans && (
      <PlanModal
        billing={billing}
        ownerEmail={owner?.email || ''}
        onClose={() => setShowPlans(false)}
        onDone={b => { setBilling(b); setOwner((o: any) => (o ? { ...o, plan: b.plan } : o)) }}
      />
    )}
    </LangContext.Provider>
    </PlanProvider>
  )
}