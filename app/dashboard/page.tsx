'use client'
import React, { useState, useEffect, useRef } from 'react'
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

function Sidebar({ active, setActive, collapsed, setCollapsed, t, mobileOpen, setMobileOpen }: {
  active: TabId
  setActive: (t: TabId) => void
  collapsed: boolean
  setCollapsed: (c: boolean) => void
  t: (k: any) => string
  mobileOpen: boolean
  setMobileOpen: (o: boolean) => void
}) {
  const NAV_KEYS: Record<TabId, string> = {
    overview:'nav_overview', customers:'nav_customers', analytics:'nav_analytics',
    rewards:'nav_rewards', notifications:'nav_notifications', form:'nav_form',
    design:'nav_design', users:'nav_users', settings:'nav_settings',
  }

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && <div className="sb-overlay" onClick={() => setMobileOpen(false)} />}

      <aside className={`db-sb${collapsed ? ' db-sb--collapsed' : ''}${mobileOpen ? ' db-sb--mobile-open' : ''}`}>
        {/* Logo */}
        <div className="sb-logo">
          <div className="sb-logo-mark">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.4-.3-.4-.5-.8-.5-1.4 0-1.1.9-2 2-2h2.4c2.3 0 4.1-1.8 4.1-4.1C21.5 6 17.2 2 12 2z"/><circle cx="6.5" cy="11.5" r="1.5" fill="#fff"/><circle cx="9.5" cy="7.5" r="1.5" fill="#fff"/></svg>
          </div>
          {!collapsed && <span className="sb-wordmark">Stampa</span>}
        </div>

        {/* Nav */}
        <nav className="sb-nav">
          {NAV_IDS.map(id => (
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

        {/* Footer: user + collapse */}
        <div className="sb-footer">
          {!collapsed && (
            <div className="sb-user">
              <div className="sb-user-av">MG</div>
              <div>
                <div className="sb-user-name">María Gómez</div>
                <div className="sb-user-role">{t('nav_settings' as any)}</div>
              </div>
            </div>
          )}
          <button className="sb-collapse-btn" onClick={() => setCollapsed(!collapsed)} title={collapsed ? 'Expandir' : 'Contraer'}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {collapsed
                ? <path d="M9 18l6-6-6-6"/>
                : <path d="M15 18l-6-6 6-6"/>}
            </svg>
          </button>
        </div>
      </aside>
    </>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────
function Header({ title, t, setMobileOpen }: { title: string; t: (k: any) => string; setMobileOpen: (o: boolean) => void }) {
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [showUser, setShowUser] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const notifRef  = useRef<HTMLDivElement>(null)
  const userRef   = useRef<HTMLDivElement>(null)

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
      if (userRef.current   && !userRef.current.contains(e.target as Node))   setShowUser(false)
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
          <button className="hd-icon-btn" onClick={() => { setShowNotif(!showNotif); setShowUser(false) }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <span className="hd-notif-dot" />
          </button>
          {showNotif && (
            <div className="hd-dropdown hd-notif-dropdown">
              <div className="hd-drop-head">
                <span className="hd-drop-title">{t('notifications_title' as any)}</span>
                <button className="hd-mark-read">{t('mark_all_read' as any)}</button>
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

        {/* User menu */}
        <div className="hd-icon-wrap" ref={userRef}>
          <button className="hd-avatar-btn" onClick={() => { setShowUser(!showUser); setShowNotif(false) }}>
            MG
          </button>
          {showUser && (
            <div className="hd-dropdown hd-user-dropdown">
              <div className="hd-user-head">
                <div className="hd-user-av-lg">MG</div>
                <div>
                  <div className="hd-user-name">María Gómez</div>
                  <div className="hd-user-email">maria@stampa.com</div>
                </div>
              </div>
              <div className="hd-drop-divider" />
              {[
                { label: t('my_profile' as any), icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
                { label: t('go_to_settings' as any), icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
              ].map(({ label, icon }) => (
                <button key={label} className="hd-user-item" onClick={() => setShowUser(false)}>
                  {icon} {label}
                </button>
              ))}
              <div className="hd-drop-divider" />
              <button className="hd-user-item hd-user-item--danger" onClick={() => setShowUser(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                {t('logout' as any)}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

// ─── Overview ─────────────────────────────────────────────────────────────────
function OverviewTab({ t }: { t: (k: any) => string }) {
  const m = mockData.metrics
  const activeCards = mockData.cardDesigns.filter((c: any) => c.isActive)
  const hasStamp      = activeCards.some((c: any) => c.type === 'stamp')
  const hasMembership = activeCards.some((c: any) => c.type === 'membership')
  const hasPoints     = activeCards.some((c: any) => c.type === 'points')
  const initials = (n: string) => n.split(' ').map((w: string) => w[0]).join('')

  const ADVANCED = [
    { v: '68.4%', l: t('recurring' as any),       color: '#5B8C5A',  bg: 'rgba(91,140,90,.1)'   },
    { v: '6.6',   l: t('avg_progress' as any),    color: '#185FA5',  bg: 'rgba(24,95,165,.1)'   },
    { v: '42.3%', l: t('redemption_rate' as any), color: '#C75D3A',  bg: 'rgba(199,93,58,.1)'   },
    { v: '4.2',   l: t('visits_to_prize' as any), color: '#9C7530',  bg: 'rgba(212,162,76,.15)' },
  ]

  const TIER_MEMBERS: Record<string, number> = { '1': 111, '2': 89, '3': 52, '4': 15 }

  return (
    <div className="db-content">
      {/* Core metrics */}
      <div className="ov-section-label">{t('section_growth' as any)}</div>
      <div className="ov-metric-grid">
        {[
          { label: t('total_customers' as any), value: m.totalUsers,    delta: m.totalUsersDelta,    color: '#C75D3A' },
          { label: t('active' as any),          value: m.activeUsers,   delta: m.activeUsersDelta,   color: '#5B8C5A' },
          { label: t('new_signups' as any),     value: m.newSignUps,    delta: m.newSignUpsDelta,    color: '#185FA5' },
          { label: t('inactive' as any),        value: m.inactiveUsers, delta: m.inactiveUsersDelta, color: '#B23B3B' },
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
          <div className="ov-card-title">{t('customer_growth' as any)}</div>
          <div className="ov-card-sub">{t('last_6_months' as any)}</div>
          <div className="ov-bars">
            {mockData.customerGrowth.map(({ month, users }: any) => (
              <div key={month} className="ov-bar-col">
                <div className="ov-bar-fill" style={{ height: `${(users / 5000) * 100}%` }} />
                <div className="ov-bar-label">{month}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="db-card ov-near-card">
          <div className="ov-card-title">{t('near_prize' as any)}</div>
          <div className="ov-card-sub">{t('near_prize_sub' as any)}</div>
          <div className="ov-near-num">{m.nearPrize}</div>
          <div className="ov-near-label">{t('customers_label' as any)}</div>
        </div>
      </div>

      {/* Advanced metrics — colored */}
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
            {mockData.topRewards.map((r: any, i: number) => (
              <div key={r.name} className="ov-reward-row">
                <span className={`ov-reward-rank${i === 0 ? ' ov-reward-rank--first' : ''}`}>{i + 1}</span>
                <div className="ov-reward-info">
                  <div className="ov-reward-name">{r.name}</div>
                  <div className="ov-reward-bar"><div className="ov-reward-fill" style={{ width: `${(r.redeemed / r.max) * 100}%` }} /></div>
                </div>
                <span className="ov-reward-count">{r.redeemed}</span>
              </div>
            ))}
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
          {mockData.recentActivity.map((a: any) => (
            <div key={a.id} className="ov-activity-row">
              <div className={`ov-av ov-av--${a.type}`}>{initials(a.user)}</div>
              <div className="ov-activity-text"><strong>{a.user}</strong> {a.action}{a.reward ? ` · ${a.reward}` : ''}</div>
              <div className="ov-activity-time">{a.time}</div>
            </div>
          ))}
        </div>

        {/* Insights */}
        <div className="db-card">
          <div className="ov-card-title">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C75D3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: 'middle' }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            {t('smart_insights' as any)}
          </div>
          {mockData.insights.map((ins: any) => (
            <div key={ins.id} className={`ov-insight ov-insight--${ins.type}`}>{ins.text}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Coming soon ──────────────────────────────────────────────────────────────
function ComingSoon({ label }: { label: string }) {
  return (
    <div className="db-coming-soon">
      <div className="db-coming-soon-mark" />
      <div className="db-coming-soon-label">{label}</div>
    </div>
  )
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Inter',sans-serif;background:#FBF6EE;color:#2B2620;}

  /* ── Shell ── */
  .db-shell{display:flex;height:100vh;overflow:hidden;}
  .db-main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0;}

  /* ── Sidebar ── */
  .db-sb{width:230px;flex-shrink:0;background:#1E3329;display:flex;flex-direction:column;padding:18px 12px;transition:width .25s ease;}
  .db-sb--collapsed{width:68px;}
  .sb-overlay{display:none;}
  .sb-logo{display:flex;align-items:center;gap:10px;padding:4px 8px 24px;}
  .sb-logo-mark{width:36px;height:36px;border-radius:10px;background:#C75D3A;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .sb-wordmark{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:20px;color:#F7F0E4;letter-spacing:-.01em;white-space:nowrap;}
  .sb-nav{display:flex;flex-direction:column;gap:2px;flex:1;}
  .sb-item{display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:10px;border:none;cursor:pointer;background:transparent;color:rgba(247,240,228,.5);font-family:'Inter',sans-serif;font-size:15px;font-weight:500;width:100%;text-align:left;transition:all .15s;position:relative;white-space:nowrap;}
  .db-sb--collapsed .sb-item{justify-content:center;padding:11px;}
  .sb-item:hover{background:rgba(255,255,255,.07);color:rgba(247,240,228,.85);}
  .sb-item--on{background:rgba(199,93,58,.22);color:#E8794F;font-weight:600;}
  .sb-item-label{font-size:15px;}
  .sb-active-dot{position:absolute;right:8px;top:50%;transform:translateY(-50%);width:6px;height:6px;border-radius:50%;background:#C75D3A;}
  .sb-footer{display:flex;align-items:center;gap:8px;padding-top:12px;border-top:1px solid rgba(255,255,255,.08);margin-top:8px;}
  .sb-user{display:flex;align-items:center;gap:9px;flex:1;min-width:0;}
  .sb-user-av{width:32px;height:32px;border-radius:50%;background:#C75D3A;display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;font-weight:700;flex-shrink:0;}
  .sb-user-name{font-size:13px;color:#F7F0E4;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .sb-user-role{font-size:10.5px;color:rgba(247,240,228,.4);}
  .sb-collapse-btn{background:none;border:none;cursor:pointer;color:rgba(247,240,228,.4);padding:6px;border-radius:8px;display:flex;align-items:center;flex-shrink:0;transition:all .15s;}
  .sb-collapse-btn:hover{background:rgba(255,255,255,.08);color:rgba(247,240,228,.8);}

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
  .hd-avatar-btn{width:38px;height:38px;border-radius:50%;background:#C75D3A;border:none;display:flex;align-items:center;justify-content:center;font-size:13px;color:#fff;font-weight:700;cursor:pointer;}

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
  .ov-bars{display:flex;align-items:flex-end;gap:8px;height:90px;margin-top:8px;}
  .ov-bar-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;height:100%;justify-content:flex-end;}
  .ov-bar-fill{width:100%;background:#C75D3A;border-radius:4px 4px 0 0;min-height:4px;}
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
    .db-sb{position:fixed;left:-100%;top:0;bottom:0;z-index:50;width:260px !important;transition:left .25s ease;box-shadow:4px 0 24px rgba(43,38,32,.2);}
    .db-sb--mobile-open{left:0 !important;}
    .db-sb--collapsed{left:-100% !important;}
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

function injectStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById('db-css')) return
  const s = document.createElement('style')
  s.id = 'db-css'
  s.textContent = CSS
  document.head.appendChild(s)
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [active, setActive] = useState<TabId>('overview')

useEffect(() => {
  const saved = localStorage.getItem('stampa_active_tab') as TabId
  if (saved) setActive(saved)
}, [])
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
        // Load team
        try {
          const teamData = await apiGetTeam(bid)
          setTeam((teamData as any[]).map(u => ({
            id:           u._id,
            name:         u.fullName,
            email:        u.email || '',
            role:         u.role,
            access:       u.role === 'manager' ? 'Dashboard' : 'Scanner app',
            status:       u.status,
            lastActivity: u.lastActivityAt ? new Date(u.lastActivityAt).toLocaleDateString('es-AR') : '—',
          })))
        } catch (e) { console.error('team load error:', e) }

        // Load cards
        try {
          const cardsData = await apiGetCards(bid)
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
          })))
        } catch (e) { console.error('cards load error:', e) }

        // Load customers
        try {
          const custRes = await fetch(`http://localhost:5002/api/businesses/${bid}/customers`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + localStorage.getItem('stampa_token')
            }
          })
          const custData = await custRes.json()
          setCustomers(custData.customers || [])
        } catch (e) { console.error('customers load error:', e) }

        // Load notification history
        try {
          const notifRes = await fetch(`http://localhost:5002/api/businesses/${bid}/notifications`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + localStorage.getItem('stampa_token')
            }
          })
          const notifData = await notifRes.json()
          setNotifHistory(notifData.history || [])
          setNotifSentThisMonth(notifData.sentThisMonth || 0)
        } catch (e) { console.error('notif load error:', e) }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    injectStyles()
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
      case 'overview':      return <OverviewTab t={t} />
      case 'customers':     return <CustomersTab customers={customers.length > 0 ? customers : mockData.customers} dynamicFieldLabel="Bebida favorita" />
      case 'analytics':     return <AnalyticsTab data={mockData} />
      case 'rewards':       return <RewardsTab data={mockData} />
      case 'notifications': return <NotificationsTab
        businessId={businessId}
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
      case 'design':        return businessId
        ? <DesignTab key={businessId} data={mockData} businessId={businessId} />
        : <DesignTab data={mockData} />
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
    <div className="db-shell">
      <Sidebar
        active={active}
        setActive={tab => { setActive(tab); localStorage.setItem('stampa_active_tab', tab) }}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        t={t}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className="db-main">
        <Header title={t(TITLES[active] as any)} t={t} setMobileOpen={setMobileOpen} />
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