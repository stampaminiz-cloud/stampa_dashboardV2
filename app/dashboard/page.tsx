'use client'
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { mockData } from '@/data/mockData'
import { detectLang, createT, LangContext } from '@/data/i18n'
import { PlanProvider } from '@/data/plans'
import { apiMe, apiGetTeam, apiGetCards, getBusinessId, setBusinessId } from '@/lib/api'
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

  const NAV_LABELS: Record<TabId, string> = {
    overview:'Overview', customers:'Customers', analytics:'Analytics',
    rewards:'Premios', notifications:'Campañas', form:'Form',
    design:'Design', users:'Team', settings:'Settings',
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
          <img 
            src="/stampa-mascot.png" 
            alt="Stampa" 
            style={{ width: collapsed ? 44 : 72, height: collapsed ? 44 : 72, objectFit: 'contain', flexShrink: 0 }}
          />
          {!collapsed && (
            <img 
              src="/stampa-wordmark.png" 
              alt="Stampa" 
              style={{ height: 100, objectFit: 'contain', marginLeft: -18, filter: 'brightness(0) invert(1)' }}
            />
          )}
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
          {NAV_IDS.map(id => (
            <button
              key={id}
              className={`sb-item${active === id ? ' sb-item--on' : ''}`}
              onClick={() => { setActive(id); setMobileOpen(false) }}
              title={collapsed ? NAV_LABELS[id] : undefined}
            >
              <NavIcon id={id} />
              {!collapsed && <span className="sb-item-label">{NAV_LABELS[id]}</span>}
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
function Header({ title, t, setMobileOpen, setActive }: { title: string; t: (k: any) => string; setMobileOpen: (o: boolean) => void; setActive?: (t: any) => void }) {
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const notifRef  = useRef<HTMLDivElement>(null)

  const customers = mockData.customers.filter(c =>
    search.length > 1 && (
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    )
  )

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false)
      if (notifRef.current  && !notifRef.current.contains(e.target as Node))  setShowNotif(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const recentActivity = mockData.recentActivity.slice(0, 4)

  return (
    <header className="db-header">
      {/* Mobile hamburger */}
      <button className="hd-hamburger" onClick={() => setMobileOpen(true)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>

      <h1 className="hd-title">{title}</h1>

      <div className="hd-right">
        {/* Search */}
        <div className="hd-search-wrap" ref={searchRef}>
          <div className="hd-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              placeholder={t('search_placeholder' as any)}
              value={search}
              onChange={e => { setSearch(e.target.value); setShowSearch(true) }}
              onFocus={() => setShowSearch(true)}
            />
          </div>
          {showSearch && search.length > 1 && (
            <div className="hd-dropdown hd-search-dropdown">
              {customers.length === 0
                ? <div className="hd-empty">{t('no_results' as any)}</div>
                : customers.slice(0, 5).map((c: any) => (
                    <div key={c.id} className="hd-search-row" onClick={() => { setSearch(''); setShowSearch(false) }}>
                      <div className="hd-srch-av">{c.name.split(' ').map((w: string) => w[0]).join('').slice(0,2)}</div>
                      <div>
                        <div className="hd-srch-name">{c.name}</div>
                        <div className="hd-srch-email">{c.email}</div>
                      </div>
                      <div className="hd-srch-prog">{c.progress}/{c.total}</div>
                    </div>
                  ))
              }
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="hd-icon-wrap" ref={notifRef}>
          <button className="hd-icon-btn" onClick={() => { setShowNotif(!showNotif) }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <span className="hd-notif-dot" />
          </button>
          {showNotif && (
            <div className="hd-dropdown hd-notif-dropdown">
              <div className="hd-drop-head">
                <span className="hd-drop-title">{t('notifications_title' as any)}</span>
                <button className="hd-mark-read" onClick={() => { setShowNotif(false); setActive?.('notifications') }}>Ver campañas →</button>
              </div>
              {recentActivity.map((a: any) => (
                <div key={a.id} className="hd-notif-row">
                  <div className={`hd-notif-av hd-notif-av--${a.type}`}>
                    {a.user.split(' ').map((w: string) => w[0]).join('').slice(0,2)}
                  </div>
                  <div className="hd-notif-info">
                    <div className="hd-notif-text"><strong>{a.user}</strong> {a.action}{a.reward ? ` · ${a.reward}` : ''}</div>
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
function OverviewTab({ t, analyticsData, rewardsData, detailedAnalytics, cards }: { 
  t: (k: any) => string
  analyticsData?: any
  rewardsData?: any
  detailedAnalytics?: any
  cards?: any[]
}) {
  const m = mockData.metrics
  const activeCards = (cards && cards.length > 0)
    ? cards.filter((c: any) => c.isActive)
    : mockData.cardDesigns.filter((c: any) => c.isActive)

  // Use real data when available
  const totalUsers    = analyticsData?.total          ?? 0
  const activeUsers   = analyticsData?.active         ?? 0
  const newSignUps    = analyticsData?.newThisMonth   ?? 0
  const inactiveUsers = analyticsData?.inactive       ?? 0
  const nearPrize     = rewardsData?.nearPrize ?? 0
  const newDelta      = analyticsData?.newDelta       ?? 0
  const hasStamp      = activeCards.some((c: any) => c.type === 'stamp')
  const hasMembership = activeCards.some((c: any) => c.type === 'membership')
  const hasPoints     = activeCards.some((c: any) => c.type === 'points')
  const initials = (n: string) => n.split(' ').map((w: string) => w[0]).join('')

  const stampCard = activeCards.find((c: any) => c.type === 'stamp')
  const primaryCardType = activeCards[0]?.type || 'stamp'
  const CHART_LABELS: Record<string, { title: string; unit: string }> = {
    stamp:      { title: 'Sellos otorgados',     unit: 'sellos otorgados' },
    points:     { title: 'Puntos acumulados',    unit: 'puntos otorgados' },
    membership: { title: 'Visitas registradas',  unit: 'visitas' },
  }
  const chartCfg = CHART_LABELS[primaryCardType] || CHART_LABELS.stamp

  const [granularity, setGranularity] = useState<'weekly' | 'monthly'>('weekly')
  const [hoveredBar, setHoveredBar] = useState<string | null>(null)
  const [monthlyVisits, setMonthlyVisits] = useState<any[] | null>(null)
  const [chartLoading, setChartLoading] = useState(false)

  async function switchGranularity(g: 'weekly' | 'monthly') {
    if (g === granularity) return
    setGranularity(g)
    if (g === 'weekly') return // ya lo tenemos en analyticsData, no hace falta refetch
    const businessId = localStorage.getItem('stampa_business_id')
    if (!businessId) return
    setChartLoading(true)
    try {
      const res = await fetch(`http://localhost:5002/api/businesses/${businessId}/analytics?granularity=monthly`, {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('stampa_token') }
      })
      const data = await res.json()
      setMonthlyVisits(data.visitsOverTime || [])
    } catch (err) {
      console.error('Error loading monthly chart:', err)
    } finally {
      setChartLoading(false)
    }
  }

  const weeklyVisits = granularity === 'monthly' ? monthlyVisits : (analyticsData?.visitsOverTime ?? null)
  const chartMax = weeklyVisits ? Math.max(...weeklyVisits.map((w: any) => w.visits), 1) : 5000
  // 4 líneas de referencia del eje Y, redondeadas a algo legible
  const axisSteps = [1, 0.75, 0.5, 0.25, 0].map(f => Math.round(chartMax * f))

  const ADVANCED = [
    { v: `${detailedAnalytics?.recurringRate ?? 0}%`, l: t('recurring' as any),       color: '#5B8C5A',  bg: 'rgba(91,140,90,.1)'   },
    { v: `${detailedAnalytics?.avgProgress ?? 0}`,    l: t('avg_progress' as any),    color: '#185FA5',  bg: 'rgba(24,95,165,.1)'   },
    { v: `${detailedAnalytics?.comparison?.[2]?.current ?? 0}%`, l: t('redemption_rate' as any), color: '#C75D3A',  bg: 'rgba(199,93,58,.1)'   },
    { v: `${stampCard?.stampsRequired ?? 0}`, l: t('visits_to_prize' as any), color: '#9C7530',  bg: 'rgba(212,162,76,.15)' },
  ]

  const TIER_MEMBERS: Record<string, number> = { '1': 111, '2': 89, '3': 52, '4': 15 }

  return (
    <div className="db-content">
      {/* Core metrics */}
      <div className="ov-section-label">{t('section_growth' as any)}</div>
      <div className="ov-metric-grid">
        {[
          { label: t('total_customers' as any), value: totalUsers,    delta: 0,    color: '#C75D3A' },
          { label: t('active' as any),          value: activeUsers,   delta: 0,   color: '#5B8C5A' },
          { label: t('new_signups' as any),     value: newSignUps,    delta: newDelta,              color: '#185FA5' },
          { label: t('inactive' as any),        value: inactiveUsers, delta: 0, color: '#B23B3B' },
        ].map(({ label, value, delta, color }) => (
          <div key={label} className="ov-metric-card">
            <div className="ov-metric-top">
              <div className="ov-metric-dot" style={{ background: `${color}20` }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: color }} />
              </div>
              <span className={`ov-delta ${delta >= 0 ? 'ov-delta--up' : 'ov-delta--down'}`}>
                {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}%
              </span>
            </div>
            <div className="ov-metric-value">{value.toLocaleString()}</div>
            <div className="ov-metric-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Growth chart + near prize */}
      <div className="ov-two-col">
        <div className="db-card">
          <div className="ov-card-title-row">
            <div>
              <div className="ov-card-title">{chartCfg.title}</div>
              <div className="ov-card-sub">{granularity === 'weekly' ? 'Últimas 8 semanas' : 'Últimos 8 meses'}</div>
            </div>
            <div className="ov-granularity-toggle">
              <button className={`ov-gran-btn${granularity === 'weekly' ? ' ov-gran-btn--on' : ''}`} onClick={() => switchGranularity('weekly')}>8 semanas</button>
              <button className={`ov-gran-btn${granularity === 'monthly' ? ' ov-gran-btn--on' : ''}`} onClick={() => switchGranularity('monthly')}>8 meses</button>
            </div>
          </div>
          {chartLoading
            ? <div className="ov-chart-loading">Cargando...</div>
            : !weeklyVisits || weeklyVisits.length === 0
            ? <div className="ov-chart-loading">Todavía no hay suficientes datos.</div>
            : <div className="ov-chart-wrap">
                <div className="ov-chart-axis">
                  {axisSteps.map((v, i) => <span key={i}>{v}</span>)}
                </div>
                <div className="ov-chart-plot">
                  <div className="ov-chart-gridlines">
                    {axisSteps.map((_, i) => <div key={i} className="ov-chart-gridline" />)}
                  </div>
                  <div className="ov-bars">
                    {(weeklyVisits || []).map(({ label, visits }: any) => (
                      <div
                        key={label}
                        className="ov-bar-col"
                        onMouseEnter={() => setHoveredBar(label)}
                        onMouseLeave={() => setHoveredBar(null)}
                      >
                        {hoveredBar === label && (
                          <div className="ov-bar-tooltip">
                            {label} · {visits} {chartCfg.unit}
                            <div className="ov-bar-tooltip-arrow" />
                          </div>
                        )}
                        <div
                          className={`ov-bar-fill${hoveredBar === label ? ' ov-bar-fill--active' : ''}`}
                          style={{ height: `${(visits / chartMax) * 100}%` }}
                        />
                        <div className="ov-bar-label">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
          }
        </div>
        <div className="db-card ov-near-card">
          <div className="ov-card-title">{t('near_prize' as any)}</div>
          <div className="ov-card-sub">{t('near_prize_sub' as any)}</div>
          <div className="ov-near-num">{nearPrize}</div>
          <div className="ov-near-label">{t('customers_label' as any)}</div>
        </div>
      </div>

      {/* Advanced + Engagement — solo cuando hay datos reales */}
      {analyticsData !== null && analyticsData?.total > 0 ? (
        <>
      <div className="ov-section-label">{t('section_advanced' as any)}</div>
      <div className="ov-adv-grid">
        {ADVANCED.map(({ v, l, color, bg }) => (
          <div key={l} className="ov-adv-card" style={{ borderTop: `3px solid ${color}` }}>
            <div className="ov-adv-val" style={{ color }}>{v}</div>
            <div className="ov-adv-label">{l}</div>
          </div>
        ))}
      </div>

      {/* Engagement — conditional per active cards */}
      <div className="ov-section-label">{t('section_engagement' as any)}</div>
      <div className="ov-three-col">
        {/* Top rewards (stamp/points) */}
        {(hasStamp || hasPoints) && (
          <div className="db-card">
            <div className="ov-card-title-row">
              <span className="ov-card-title">{t('top_rewards' as any)}</span>
            </div>
            {rewardsData?.topPrizes?.length > 0
              ? rewardsData.topPrizes.map((r: any, i: number) => {
                  const max = rewardsData.topPrizes[0]?.count || 1
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
                })
              : <div className="ov-empty-note">Todavía no hay premios canjeados.</div>
            }
          </div>
        )}

        {/* Membership tier distribution */}
        {hasMembership && (
          <div className="db-card">
            <div className="ov-card-title">{t('tier_distribution' as any)}</div>
            {mockData.membershipTiers.map((tier: any) => {
              const count = TIER_MEMBERS[tier.id] || 0
              const total = Object.values(TIER_MEMBERS).reduce((a: number, b: number) => a + b, 0)
              return (
                <div key={tier.id} className="ov-tier-row">
                  <div className="ov-tier-dot" style={{ background: tier.bg, border: `2px solid ${tier.color}` }} />
                  <span className="ov-tier-name">{tier.name}</span>
                  <div className="ov-tier-bar-wrap">
                    <div className="ov-tier-bar" style={{ width: `${(count / total) * 100}%`, background: tier.bg, border: `1px solid ${tier.color}40` }} />
                  </div>
                  <span className="ov-tier-count">{count}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Activity feed */}
        <div className="db-card">
          <div className="ov-card-title-row">
            <span className="ov-card-title">{t('recent_activity' as any)}</span>
            <span className="ov-live"><span className="ov-live-dot" />{t('live' as any)}</span>
          </div>
          {detailedAnalytics?.recentActivity?.length > 0
            ? detailedAnalytics.recentActivity.map((a: any, i: number) => (
                <div key={i} className="ov-activity-row">
                  <div className={`ov-av ov-av--${a.action === 'canjeó su premio' ? 'redeem' : a.action === 'se registró' ? 'signup' : 'stamp'}`}>{initials(a.name)}</div>
                  <div className="ov-activity-text"><strong>{a.name}</strong> {a.action}</div>
                  <div className="ov-activity-time">{a.time}</div>
                </div>
              ))
            : <div className="ov-empty-note">Todavía no hay actividad registrada.</div>
          }
        </div>

        {/* Insights */}
        <div className="db-card">
          <div className="ov-card-title">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C75D3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: 'middle' }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            {t('smart_insights' as any)}
          </div>
          {(() => {
            const insights: { type: string; text: string }[] = []
            if (newDelta !== 0) {
              insights.push({
                type: newDelta >= 0 ? 'positive' : 'warning',
                text: newDelta >= 0
                  ? `Los nuevos registros crecieron ${newDelta}% este mes.`
                  : `Los nuevos registros bajaron ${Math.abs(newDelta)}% este mes.`,
              })
            }
            if (rewardsData?.topPrize && rewardsData.topPrize !== '—') {
              insights.push({ type: 'info', text: `${rewardsData.topPrize} es tu premio más popular — considerá tenerlo bien abastecido.` })
            }
            const vot = detailedAnalytics?.visitsOverTime || []
            if (vot.length >= 2) {
              const last = vot[vot.length - 1].stamps
              const prev = vot[vot.length - 2].stamps
              if (prev > 0) {
                const changePct = Math.round(((last - prev) / prev) * 100)
                if (Math.abs(changePct) >= 10) {
                  insights.push({
                    type: changePct < 0 ? 'warning' : 'positive',
                    text: changePct < 0
                      ? `La actividad bajó ${Math.abs(changePct)}% en el último período. Considerá una notificación push.`
                      : `La actividad subió ${changePct}% en el último período.`,
                  })
                }
              }
            }
            return insights.length > 0
              ? insights.map((ins, i) => <div key={i} className={`ov-insight ov-insight--${ins.type}`}>{ins.text}</div>)
              : <div className="ov-empty-note">Todavía no hay suficientes datos para generar insights.</div>
          })()}
        </div>
      </div>
        </>
      ) : analyticsData !== null ? (
        <div className="db-card" style={{display:'flex',flex:1}}>
          <EmptyState
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>}
            title="Los datos van a aparecer acá"
            body="Cuando tus primeros clientes se registren vas a ver métricas de retención, crecimiento y engagement en tiempo real."
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
function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return '—'
  const diffMs = Date.now() - timestamp
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'ahora'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  const diffDays = Math.floor(diffH / 24)
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
}

function mapCustomersForTab(rawCustomers: any[], activeCard: any) {
  const total = activeCard?.stampsRequired || 8
  return rawCustomers.map(c => ({
    id: c.id,
    name: c.name,
    email: c.email,
    progress: c.stamps ?? 0,
    total,
    dynamicField: c.favoriteDrink || (c.formResponses?.[0]?.value ?? '—'),
    status: c.status,
    joined: c.joinedAt,
    dob: c.birthdate || '—',
    preference: c.favoriteFood
      ? `${c.favoriteFood === 'sweet' ? 'Dulce' : 'Salado'}${c.timeVisit ? ' · ' + (c.timeVisit === 'morning' ? 'Mañana' : 'Tarde') : ''}`
      : '—',
    lastActivity: formatRelativeTime(c.lastUpdate),
    // No tenemos todavía un historial de canjes por cliente en el modelo de
    // datos (solo el conteo agregado del negocio en rewards-stats) — queda
    // en 0 hasta que se agregue esa colección/campo.
    totalRedeemed: 0,
  }))
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html, body { overflow-x: hidden; }
  body{font-family:'Inter',sans-serif;background:#FBF6EE;color:#2B2620;}

  /* ── Shell ── */
  .db-shell{display:flex;height:100vh;height:100dvh;overflow:hidden;}
  .db-main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0;}

  /* ── Sidebar ── */
  .db-sb{width:230px;flex-shrink:0;background:#1E3329;display:flex;flex-direction:column;padding:6px 12px;transition:width .25s ease;}
  .db-sb--collapsed{width:68px;}
  .sb-overlay{display:none;}
  .sb-logo{display:flex;align-items:center;gap:10px;padding:0px 8px 16px;}
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

  /* ── Header ── */
  .db-header{height:62px;flex-shrink:0;background:#FFFFFF;border-bottom:1px solid rgba(43,38,32,.08);display:flex;align-items:center;padding:0 24px;gap:14px;}
  .hd-hamburger{display:none;background:none;border:none;cursor:pointer;color:rgba(43,38,32,.6);padding:6px;border-radius:8px;}
  .hd-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:20px;color:#2B2620;flex:1;}
  .hd-right{display:flex;align-items:center;gap:10px;}
  .hd-search-wrap{position:relative;}
  .hd-search{display:flex;align-items:center;gap:8px;background:#FBF6EE;border:1px solid rgba(43,38,32,.1);border-radius:10px;padding:8px 13px;width:220px;}
  .hd-search input{background:none;border:none;outline:none;font-family:'Inter',sans-serif;font-size:13px;color:#2B2620;width:100%;}
  .hd-search input::placeholder{color:rgba(43,38,32,.38);}
  .hd-icon-wrap{position:relative;}
  .hd-icon-btn{width:38px;height:38px;border-radius:10px;background:#FBF6EE;border:1px solid rgba(43,38,32,.1);display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(43,38,32,.55);position:relative;transition:all .15s;}
  .hd-icon-btn:hover{background:#F0EBE3;}
  .hd-notif-dot{position:absolute;top:7px;right:7px;width:7px;height:7px;border-radius:50%;background:#C75D3A;border:1.5px solid #fff;}


  /* ── Dropdowns ── */
  .hd-dropdown{position:absolute;top:calc(100% + 8px);right:0;background:#FFFFFF;border:1px solid rgba(43,38,32,.1);border-radius:14px;box-shadow:0 8px 32px rgba(43,38,32,.12);z-index:50;min-width:280px;}
  .hd-search-dropdown{left:0;right:auto;}
  .hd-drop-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid rgba(43,38,32,.07);}
  .hd-drop-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:14px;color:#2B2620;}
  .hd-mark-read{font-size:11px;color:#C75D3A;font-weight:600;background:none;border:none;cursor:pointer;}
  .hd-empty{padding:20px;text-align:center;font-size:12px;color:rgba(43,38,32,.4);}
  .hd-search-row{display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;transition:background .1s;}
  .hd-search-row:hover{background:#FBF6EE;}
  .hd-srch-av{width:28px;height:28px;border-radius:50%;background:#C75D3A;display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;font-weight:700;flex-shrink:0;}
  .hd-srch-name{font-size:12.5px;font-weight:600;color:#2B2620;}
  .hd-srch-email{font-size:10.5px;color:rgba(43,38,32,.45);}
  .hd-srch-prog{font-size:11px;font-weight:700;color:#C75D3A;margin-left:auto;}
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

  /* ── Content area ── */
  .db-content{flex:1;overflow-y:auto;padding:22px 24px;display:flex;flex-direction:column;gap:16px;}
  .db-card{background:#FFFFFF;border:1px solid rgba(43,38,32,.07);border-radius:14px;padding:16px;box-shadow:0 1px 8px rgba(43,38,32,.04);}

  /* ── Overview ── */
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
  .ov-two-col{display:grid;grid-template-columns:1.8fr 1fr;gap:12px;}
  .ov-card-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:13.5px;color:#2B2620;margin-bottom:2px;}
  .ov-card-sub{font-size:11px;color:rgba(43,38,32,.45);margin-bottom:12px;}
  .ov-card-title-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
  .ov-granularity-toggle{display:flex;gap:6px;}
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
  .ov-reward-row{display:flex;align-items:center;gap:10px;margin-bottom:10px;}
  .ov-reward-row:last-child{margin-bottom:0;}
  .ov-reward-rank{width:22px;height:22px;border-radius:6px;background:rgba(43,38,32,.06);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:rgba(43,38,32,.4);flex-shrink:0;}
  .ov-reward-rank--first{background:rgba(199,93,58,.12);color:#C75D3A;}
  .ov-reward-info{flex:1;}
  .ov-reward-name{font-size:12px;color:#2B2620;margin-bottom:4px;}
  .ov-reward-bar{height:5px;background:rgba(43,38,32,.07);border-radius:3px;overflow:hidden;}
  .ov-reward-fill{height:100%;background:linear-gradient(90deg,#C75D3A,#D4A24C);border-radius:3px;}
  .ov-reward-count{font-size:11px;font-weight:600;color:rgba(43,38,32,.5);flex-shrink:0;}
  .ov-tier-row{display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid rgba(43,38,32,.05);}
  .ov-tier-row:last-child{border-bottom:none;}
  .ov-tier-dot{width:14px;height:14px;border-radius:50%;flex-shrink:0;}
  .ov-tier-name{font-size:12px;color:#2B2620;width:52px;flex-shrink:0;}
  .ov-tier-bar-wrap{flex:1;height:8px;background:rgba(43,38,32,.06);border-radius:4px;overflow:hidden;}
  .ov-tier-bar{height:100%;border-radius:4px;}
  .ov-tier-count{font-size:11px;font-weight:700;color:#2B2620;width:28px;text-align:right;}
  .ov-activity-row{display:flex;align-items:center;gap:9px;padding:8px 0;border-bottom:1px solid rgba(43,38,32,.06);}
  .ov-activity-row:last-child{border-bottom:none;}
  .ov-av{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;}
  .ov-av--redeem{background:rgba(199,93,58,.15);color:#C75D3A;}
  .ov-av--signup{background:rgba(91,140,90,.15);color:#5B8C5A;}
  .ov-av--login{background:rgba(24,95,165,.12);color:#185FA5;}
  .ov-av--stamp{background:rgba(83,63,183,.12);color:#533FB7;}
  .ov-empty-note{font-size:12px;color:rgba(43,38,32,.4);padding:16px 0;text-align:center;}
  .ov-activity-text{flex:1;font-size:12px;color:rgba(43,38,32,.65);}
  .ov-activity-text strong{color:#2B2620;font-weight:600;}
  .ov-activity-time{font-size:10px;color:rgba(43,38,32,.35);flex-shrink:0;}
  .ov-live{display:flex;align-items:center;gap:5px;font-size:11px;color:#5B8C5A;}
  .ov-live-dot{width:7px;height:7px;border-radius:50%;background:#5B8C5A;animation:pulse 1.5s infinite;}
  .ov-insight{font-size:12px;color:rgba(43,38,32,.7);line-height:1.5;padding:10px 12px;border-radius:9px;background:rgba(43,38,32,.03);margin-bottom:8px;}
  .ov-insight:last-child{margin-bottom:0;}
  .ov-insight--positive{border-left:2.5px solid #5B8C5A;}
  .ov-insight--warning{border-left:2.5px solid #C75D3A;}
  .ov-insight--info{border-left:2.5px solid #185FA5;}

  /* ── Coming soon ── */
  .db-coming-soon{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;}
  .db-coming-soon-mark{width:36px;height:36px;border-radius:10px;background:#C75D3A;opacity:.15;}
  .db-coming-soon-label{font-size:14px;color:rgba(43,38,32,.38);}

  @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.4;}}

  /* ── RESPONSIVE ── */
  @media (max-width: 768px) {
    .db-sb{position:fixed;left:0;transform:translateX(-100%);top:0;bottom:0;z-index:50;width:260px !important;transition:transform .25s ease;box-shadow:4px 0 24px rgba(43,38,32,.2);}
    .db-sb--mobile-open{transform:translateX(0) !important;}
    .db-sb--collapsed{transform:translateX(-100%) !important;}
    .sb-overlay{display:block;position:fixed;inset:0;background:rgba(43,38,32,.4);z-index:49;backdrop-filter:blur(2px);}
    .hd-hamburger{display:flex;}
    .hd-search{width:160px;}
    .ov-metric-grid{grid-template-columns:repeat(2,1fr);}
    .ov-adv-grid{grid-template-columns:repeat(2,1fr);}
    .ov-three-col{grid-template-columns:1fr;}
    .ov-two-col{grid-template-columns:1fr;}
    .db-content{padding:16px;}
    .db-header{padding:0 16px;}
  }
  @media (max-width: 480px) {
    .ov-metric-grid{grid-template-columns:1fr 1fr;}
    .hd-search{display:none;}
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
  const [business, setBusiness]     = useState<any>(null)
  const [businessId, setBusinessIdState] = useState<string | null>(null)
  const [team, setTeam]             = useState<any[]>([])
  const [cards, setCards]           = useState<any[]>([])
  const [notifHistory, setNotifHistory]             = useState<any[]>([])
  const [notifSentThisMonth, setNotifSentThisMonth] = useState(0)
  const [customers, setCustomers]                   = useState<any[]>([])
  const [customersPage, setCustomersPage]           = useState(1)
  const [customersTotalPages, setCustomersTotalPages] = useState(1)
  const [customersTotal, setCustomersTotal]         = useState(0)
  const [customersSearch, setCustomersSearch]       = useState('')
  const [customersStatus, setCustomersStatus]       = useState<'all' | 'active' | 'inactive'>('all')
  const [customersSortKey, setCustomersSortKey]     = useState<'name' | 'progress' | 'status' | 'lastActivity'>('progress')
  const [customersSortDir, setCustomersSortDir]     = useState<'asc' | 'desc'>('desc')
  const [customersLoading, setCustomersLoading]     = useState(false)
  // Cache en memoria: mismo filtro/orden/página ya pedido antes → instantáneo,
  // sin volver a golpear la API. Se invalida (bypass) en onRefresh, ej. tras un delete.
  const customersCacheRef = useRef<Map<string, any>>(new Map())
  const [analyticsData, setAnalyticsData]           = useState<any>(null)
  const [detailedAnalytics, setDetailedAnalytics]   = useState<any>(null)
  const [rewardsData, setRewardsData]               = useState<any>(null)
  const [loading, setLoading]       = useState(true)

  async function loadBusiness() {
    try {
      const { owner: o, businesses } = await apiMe()
      setOwner(o)
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
        const teamPromise       = apiGetTeam(bid)
        const analyticsPromise  = fetch(`http://localhost:5002/api/businesses/${bid}/analytics`, { headers: authHeaders }).then(r => r.json())
        const detailedPromise   = fetch(`http://localhost:5002/api/businesses/${bid}/analytics/detailed?range=30d`, { headers: authHeaders }).then(r => r.json())
        const customersPromise  = fetch(`http://localhost:5002/api/businesses/${bid}/customers?page=1&limit=50&sortBy=progress&sortDir=desc`, { headers: authHeaders }).then(r => r.json())
        const notifPromise      = fetch(`http://localhost:5002/api/businesses/${bid}/notifications`, { headers: authHeaders }).then(r => r.json())
        // rewards-stats needs the first card's type, so it chains off cardsPromise instead of
        // blocking behind team/analytics/customers/notifications like it used to
        const rewardsPromise    = cardsPromise.then(cardsData => {
          const firstCard = (cardsData as any[])[0]
          if (!firstCard) return null
          return fetch(
            `http://localhost:5002/api/businesses/${bid}/rewards-stats?cardType=${firstCard.type}&stampsRequired=${firstCard.stampsRequired || 8}`,
            { headers: authHeaders }
          ).then(r => r.json())
        })

        const [teamRes, cardsRes, analyticsRes, customersRes, notifRes, rewardsRes, detailedRes] = await Promise.allSettled([
          teamPromise, cardsPromise, analyticsPromise, customersPromise, notifPromise, rewardsPromise, detailedPromise,
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
            color:          c.color || '#1E3329',
            secondColor:    c.secondColor || '#16271F',
            stampsRequired: c.stampsRequired || 8,
            rewardMode:     c.rewardMode || null,
            rewardField:    c.rewardFixedValue || null,
            logoUrl:        c.logoUrl || null,
            earnedIcon:     c.earnedIcon || null,
            emptyIcon:      c.emptyIcon || null,
          })))
        } else console.error('cards load error:', cardsRes.reason)

        if (analyticsRes.status === 'fulfilled') setAnalyticsData(analyticsRes.value)
        else console.error('analytics load error:', analyticsRes.reason)

        if (customersRes.status === 'fulfilled') {
          setCustomers(customersRes.value.customers || [])
          setCustomersTotal(customersRes.value.total || 0)
          setCustomersTotalPages(customersRes.value.pages || 1)
          customersCacheRef.current.set('1||all|progress|desc', customersRes.value)
        } else console.error('customers load error:', customersRes.reason)

        if (notifRes.status === 'fulfilled') {
          setNotifHistory(notifRes.value.history || [])
          setNotifSentThisMonth(notifRes.value.sentThisMonth || 0)
        } else console.error('notif load error:', notifRes.reason)

        if (rewardsRes.status === 'fulfilled' && rewardsRes.value) setRewardsData(rewardsRes.value)
        else if (rewardsRes.status === 'rejected') console.error('rewards load error:', rewardsRes.reason)

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
        color:          c.color || '#1E3329',
        secondColor:    c.secondColor || '#16271F',
        stampsRequired: c.stampsRequired || 8,
        rewardMode:     c.rewardMode || null,
        rewardField:    c.rewardFixedValue || null,
        logoUrl:        c.logoUrl || null,
        earnedIcon:     c.earnedIcon || null,
        emptyIcon:      c.emptyIcon || null,
      })))
    } catch (err) {
      console.error('Error refreshing cards:', err)
    }
  }

  async function loadCustomers(
    page: number,
    search: string,
    status: 'all' | 'active' | 'inactive',
    sortKey: 'name' | 'progress' | 'status' | 'lastActivity' = customersSortKey,
    sortDir: 'asc' | 'desc' = customersSortDir,
    opts: { bypassCache?: boolean } = {}
  ) {
    if (!businessId) return

    const cacheKey = `${page}|${search}|${status}|${sortKey}|${sortDir}`
    const cached = customersCacheRef.current.get(cacheKey)
    if (cached && !opts.bypassCache) {
      // Ya lo pedimos antes con estos mismos filtros — mostralo al toque,
      // sin spinner ni round-trip.
      setCustomers(cached.customers || [])
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
      const res = await fetch(`http://localhost:5002/api/businesses/${businessId}/customers?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('stampa_token'),
        }
      })
      const data = await res.json()
      customersCacheRef.current.set(cacheKey, data)
      setCustomers(data.customers || [])
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

  useLayoutEffect(() => {
    const saved = localStorage.getItem('stampa_active_tab') as TabId | null
    if (saved) setActive(saved)
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

  function renderTab() {
    switch (active) {
      case 'overview':      return <OverviewTab t={t} analyticsData={analyticsData} rewardsData={rewardsData} detailedAnalytics={detailedAnalytics} cards={cards} />
      case 'customers': return customersTotal > 0
        ? <CustomersTab
            customers={mapCustomersForTab(customers, cards.find((c: any) => c.isActive) || cards[0])}
            dynamicFieldLabel="Bebida favorita"
            page={customersPage}
            totalPages={customersTotalPages}
            total={customersTotal}
            activeCount={analyticsData?.active ?? 0}
            inactiveCount={analyticsData?.inactive ?? 0}
            nearCount={rewardsData?.nearPrize ?? 0}
            search={customersSearch}
            statusFilter={customersStatus}
            sortKey={customersSortKey}
            sortDir={customersSortDir}
            loading={customersLoading}
            onSearchChange={(q: string) => { setCustomersSearch(q); loadCustomers(1, q, customersStatus) }}
            onStatusFilterChange={(s: any) => { setCustomersStatus(s); loadCustomers(1, customersSearch, s) }}
            onSortChange={(key: any, dir: any) => loadCustomers(1, customersSearch, customersStatus, key, dir)}
            onPageChange={(p: number) => loadCustomers(p, customersSearch, customersStatus)}
            onRefresh={() => { customersCacheRef.current.clear(); loadCustomers(customersPage, customersSearch, customersStatus, customersSortKey, customersSortDir, { bypassCache: true }) }}
          />
        : <div className="db-content"><EmptyState
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>}
            title="Todavía no tenés clientes registrados"
            body="Compartí el formulario de registro con tus clientes para que se sumen al programa."
            cta="Ver formulario"
            onCta={() => { setActive('form'); localStorage.setItem('stampa_active_tab', 'form') }}
          /></div>
      case 'analytics': return analyticsData?.total > 0
        ? <AnalyticsTab key={cards.length > 0 ? cards[0].id : 'loading'} data={mockData} analyticsData={analyticsData} cards={cards} />
        : <div className="db-content"><EmptyState
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>}
            title="Las métricas aparecen cuando tenés clientes"
            body="Analytics te muestra retención, visitas y comportamiento. Empezá compartiendo tu formulario de registro."
            cta="Ver formulario"
            onCta={() => { setActive('form'); localStorage.setItem('stampa_active_tab', 'form') }}
          /></div>
      case 'rewards': return analyticsData?.total > 0
        ? <RewardsTab data={mockData} rewardsData={rewardsData} cards={cards} businessId={businessId} />
        : <div className="db-content"><EmptyState
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/></svg>}
            title="Los premios aparecen cuando hay canjes"
            body="Acá vas a ver qué premios eligen tus clientes y cuántos canjearon este mes."
          /></div>
          case 'notifications': return <NotificationsTab
          businessId={businessId}
          analyticsData={analyticsData}
          rewardsData={rewardsData}
          data={{
            ...mockData,
            sentNotifications: notifHistory.map((n: any) => ({
              id: n._id || n.sentAt,
              message: n.message,
              audience: n.audience,
              sentCount: n.sentCount,
              sentAt: new Date(n.sentAt).toLocaleDateString('es-AR'),
            })),
            scheduledNotifications: [],
          }}
        />
      case 'form':          return <FormTab businessName={business?.name || mockData.business.name} businessSlug={business?.slug || 'mi-negocio'} cardDesigns={cards.length > 0 ? cards : mockData.cardDesigns} />
      case 'design':        return <DesignTab key={businessId ?? 'loading'} data={mockData} cards={cards} businessId={businessId} onSaved={refreshCards} />
      case 'users':         return <UsersTab key={businessId ?? 'loading'} users={team} businessId={businessId} onRefresh={loadBusiness} owner={owner} />
      case 'settings':      return (
        <SettingsTab
          key={businessId ?? 'loading'}
          businessId={businessId ?? undefined}
          onSave={loadBusiness}
          business={business ? {
            ...mockData.business,
            name: business.name,
            sector: business.sector,
            inactiveDays: business.inactiveDays || mockData.business.inactiveDays,
            alerts: business.alerts || mockData.business.alerts,
            plan: owner?.plan || mockData.business.plan,
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
        <Header title={t(TITLES[active] as any)} t={t} setMobileOpen={setMobileOpen} setActive={setActive} />
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
    </LangContext.Provider>
    </PlanProvider>
  )
}