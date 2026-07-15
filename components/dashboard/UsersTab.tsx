'use client'
import React, { useState, useEffect } from 'react'
import { useLang } from '@/data/i18n'
import { apiCreateTeamMember, apiUpdateTeamMember, apiDeleteTeamMember, getBusinessId } from '@/lib/api'
import { usePlan } from '@/data/plans'

type Role   = 'owner' | 'manager' | 'scanner'
type Status = 'active' | 'invited' | 'disabled'

interface StaffUser { id: string; name: string; email: string; role: Role; access: string; status: Status; lastActivity: string }

function initials(name: string) { return name.split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase() }
const AVATAR_COLORS: Record<Role, string> = { owner: '#C75D3A', manager: '#185FA5', scanner: '#9C7530' }

function InviteModal({ onClose, onAdd, onRefresh }: { onClose: () => void; onAdd: (u: StaffUser) => void; onRefresh?: () => void }) {
  const t = useLang()
  const [role, setRole] = useState<'manager' | 'scanner'>('manager')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pin] = useState(() => Math.floor(1000 + Math.random() * 9000).toString())
  const [sent, setSent] = useState(false)

  function handleInvite() {
    if (!name.trim()) return
    if (role === 'manager' && !email.trim()) return
    onAdd({ id: Date.now().toString(), name, email: role === 'manager' ? email : '', role, access: role === 'manager' ? 'Dashboard' : `PIN ${pin}`, status: role === 'manager' ? 'invited' : 'active', lastActivity: '—' })
    setSent(true)
    setTimeout(() => { setSent(false); onClose() }, 2000)
  }

  return (
    <div className="us-modal-overlay" onClick={onClose}>
      <div className="us-modal" onClick={e => e.stopPropagation()}>
        <div className="us-modal-header">
          <div className="us-modal-title">{t('us_invite_title')}</div>
          <button className="us-modal-close" onClick={onClose}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div className="us-field-label">{t('us_role_label')}</div>
        <div className="us-role-toggle">
          <button className={`us-role-btn${role === 'manager' ? ' us-role-btn--on' : ''}`} onClick={() => setRole('manager')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
            Manager
          </button>
          <button className={`us-role-btn${role === 'scanner' ? ' us-role-btn--on' : ''}`} onClick={() => setRole('scanner')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
            Scanner
          </button>
        </div>
        <div className="us-role-desc">{role === 'manager' ? t('us_manager_desc') : t('us_scanner_desc')}</div>
        <div className="us-field-label" style={{ marginTop: 16 }}>{t('us_name_label')}</div>
        <input className="us-input" placeholder={t('us_name_label')} value={name} onChange={e => setName(e.target.value)} />
        {role === 'manager' ? (
          <>
            <div className="us-field-label" style={{ marginTop: 12 }}>{t('us_email_label')}</div>
            <input className="us-input" type="email" placeholder="email@negocio.com" value={email} onChange={e => setEmail(e.target.value)} />
            <div className="us-field-hint">{t('us_invite_hint')}</div>
          </>
        ) : (
          <>
            <div className="us-field-label" style={{ marginTop: 12 }}>{t('us_pin_generated')}</div>
            <div className="us-pin-display">
              <span className="us-pin-num">{pin}</span>
              <span className="us-pin-hint">{t('us_pin_hint')}</span>
            </div>
            <div className="us-field-hint">{t('us_pin_note')}</div>
          </>
        )}
        {sent
          ? <div className="us-success"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>{role === 'manager' ? t('us_invite_sent') : t('us_scan_created')}</div>
          : <button className="us-invite-btn" onClick={handleInvite} disabled={!name.trim() || (role === 'manager' && !email.trim())}>{role === 'manager' ? t('us_send_invite') : t('us_create_scan')}</button>
        }
      </div>
    </div>
  )
}

export function UsersTab({ users: initUsers, businessId, onRefresh, owner }: { users: StaffUser[]; businessId?: string | null; onRefresh?: () => void; owner?: { fullName: string; email: string; plan: string } | null }) {
  const t = useLang()
  const { limit } = usePlan()
  const teamLimit   = limit('maxTeamMembers')
  const [users, setUsers]                 = useState<StaffUser[]>(initUsers)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [roleFilter, setFilter]           = useState<'all' | Role>('all')
  const [showInvite, setInvite]           = useState(false)

  const nonOwners = users.filter((u: StaffUser) => u.role !== 'owner').length
  const atLimit   = teamLimit < 999 && nonOwners >= teamLimit

  // Data comes from dashboard-page.tsx via props — no internal fetching needed

  async function deleteUser(id: string) {
    if (businessId) {
      try { await apiDeleteTeamMember(businessId, id) } catch (err) { console.error(err) }
    }
    setUsers(users.filter((u: StaffUser) => u.id !== id))
    setConfirmDelete(null)
    onRefresh?.()
  }

  async function toggleDisable(id: string) {
    const user = users.find((u: StaffUser) => u.id === id)
    if (!user) return
    const newStatus = user.status === 'disabled' ? 'active' : 'disabled'
    if (businessId) {
      try { await apiUpdateTeamMember(businessId, id, { status: newStatus as any }) } catch (err) { console.error(err) }
    }
    setUsers(users.map((u: StaffUser) => u.id === id
      ? { ...u, status: newStatus as Status }
      : u
    ))
  }

  const filtered = roleFilter === 'all' ? users : users.filter((u: StaffUser) => u.role === roleFilter)
  const counts: Record<string, number> = {
    all: users.length,
    owner:   users.filter((u: StaffUser) => u.role === 'owner').length,
    manager: users.filter((u: StaffUser) => u.role === 'manager').length,
    scanner: users.filter((u: StaffUser) => u.role === 'scanner').length,
  }

  const ROLE_CONFIG: Record<Role, { label: string; color: string; bg: string; desc: string; perms: string[] }> = {
    owner:   { label: 'Owner',   color: '#C75D3A', bg: 'rgba(199,93,58,.1)',   desc: t('us_owner_desc'),   perms: ['Todo el dashboard', 'Billing y plan', 'Gestión de equipo', 'Zona de peligro'] },
    manager: { label: 'Manager', color: '#185FA5', bg: 'rgba(24,95,165,.1)',   desc: t('us_manager_desc'), perms: ['Todo el dashboard', 'Sin billing ni equipo', 'Sin zona de peligro'] },
    scanner: { label: 'Scanner', color: '#9C7530', bg: 'rgba(212,162,76,.15)', desc: t('us_scanner_desc'), perms: ['Solo app scanner', 'Escanea tarjetas', 'Sin acceso al dashboard'] },
  }

  const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string }> = {
    active:   { label: t('status_active'),   color: '#5B8C5A', bg: 'rgba(91,140,90,.12)'  },
    invited:  { label: t('status_invited'),  color: '#9C7530', bg: 'rgba(212,162,76,.15)' },
    disabled: { label: t('status_disabled'), color: 'rgba(43,38,32,.4)', bg: 'rgba(43,38,32,.07)' },
  }

  return (
    <>
      <style>{`
        .us-content{flex:1;overflow-y:auto;padding:20px 24px;display:flex;flex-direction:column;gap:14px;}
        .us-lbl{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:rgba(43,38,32,.38);font-weight:600;display:flex;align-items:center;gap:10px;}
        .us-lbl::after{content:'';flex:1;height:1px;background:rgba(43,38,32,.1);}
        .us-card{background:#FFFFFF;border:1px solid rgba(43,38,32,.07);border-radius:14px;box-shadow:0 1px 8px rgba(43,38,32,.04);}
        .us-toolbar{display:flex;align-items:center;gap:10px;padding:14px 20px;border-bottom:1px solid rgba(43,38,32,.07);}
        .us-filter-pills{display:flex;gap:5px;flex:1;}
        .us-pill{font-size:11px;padding:6px 12px;border-radius:20px;border:1px solid rgba(43,38,32,.12);background:#FFFFFF;color:rgba(43,38,32,.5);cursor:pointer;transition:all .15s;font-family:'Inter',sans-serif;}
        .us-pill--on{background:rgba(199,93,58,.1);border-color:#C75D3A;color:#C75D3A;font-weight:600;}
        .us-invite-btn-sm{display:flex;align-items:center;gap:6px;font-size:12px;background:#C75D3A;color:#fff;border:none;border-radius:9px;padding:8px 16px;cursor:pointer;font-weight:700;font-family:'Plus Jakarta Sans',sans-serif;white-space:nowrap;}
        table.us{width:100%;border-collapse:collapse;}
        table.us th{text-align:left;font-size:9.5px;text-transform:uppercase;letter-spacing:.06em;color:rgba(43,38,32,.38);font-weight:700;padding:10px 16px;}
        table.us td{padding:12px 16px;font-size:12px;color:rgba(43,38,32,.8);border-top:1px solid rgba(43,38,32,.05);}
        .us-user-cell{display:flex;align-items:center;gap:10px;}
        .us-av{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;flex-shrink:0;}
        .us-uname{font-weight:600;color:#2B2620;font-size:12.5px;}
        .us-uemail{font-size:10.5px;color:rgba(43,38,32,.4);}
        .us-role-badge{font-size:10px;padding:3px 10px;border-radius:20px;font-weight:700;}
        .us-status-badge{font-size:10px;padding:3px 10px;border-radius:20px;font-weight:600;}
        .us-access{font-size:11.5px;color:rgba(43,38,32,.6);}
        .us-pin{font-family:monospace;font-size:12px;background:#FBF6EE;padding:3px 9px;border-radius:6px;border:1px solid rgba(43,38,32,.1);color:#2B2620;font-weight:700;}
        .us-last{font-size:11px;color:rgba(43,38,32,.4);}
        .us-row-actions{display:flex;gap:6px;justify-content:flex-end;}
        .us-action-btn{background:none;border:none;cursor:pointer;color:rgba(43,38,32,.3);padding:5px;border-radius:7px;display:flex;align-items:center;transition:all .15s;}
        .us-action-btn:hover{color:#2B2620;background:rgba(43,38,32,.06);}
        .us-action-btn--danger:hover{color:#B23B3B;background:rgba(178,59,59,.08);}
        .us-3col{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
        .us-role-card{background:#FFFFFF;border:1px solid rgba(43,38,32,.07);border-radius:14px;padding:16px;box-shadow:0 1px 8px rgba(43,38,32,.04);}
        .us-role-card-head{display:flex;align-items:center;gap:8px;margin-bottom:12px;}
        .us-role-icon{width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .us-role-name{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:13px;color:#2B2620;}
        .us-role-desc{font-size:10.5px;color:rgba(43,38,32,.45);margin-bottom:10px;line-height:1.5;}
        .us-role-perm{display:flex;align-items:center;gap:7px;font-size:11px;color:rgba(43,38,32,.65);padding:5px 0;border-bottom:1px solid rgba(43,38,32,.05);}
        .us-role-perm:last-child{border-bottom:none;padding-bottom:0;}
        .us-perm-check{width:14px;height:14px;border-radius:4px;background:rgba(91,140,90,.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .us-modal-overlay{position:fixed;inset:0;background:rgba(43,38,32,.4);display:flex;align-items:center;justify-content:center;z-index:100;backdrop-filter:blur(2px);}
        .us-modal{background:#FFFFFF;border-radius:18px;padding:28px;width:100%;max-width:400px;box-shadow:0 20px 60px rgba(43,38,32,.2);}
        .us-modal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}
        .us-modal-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:16px;color:#2B2620;}
        .us-modal-close{background:none;border:none;cursor:pointer;color:rgba(43,38,32,.4);padding:4px;border-radius:6px;}
        .us-field-label{font-size:9.5px;text-transform:uppercase;letter-spacing:.06em;color:rgba(43,38,32,.45);font-weight:700;margin-bottom:7px;}
        .us-role-toggle{display:flex;gap:6px;margin-bottom:8px;}
        .us-role-btn{flex:1;display:flex;align-items:center;justify-content:center;gap:7px;padding:10px;border:1.5px solid rgba(43,38,32,.12);border-radius:10px;background:#FFFFFF;color:rgba(43,38,32,.5);cursor:pointer;font-size:12.5px;font-weight:600;transition:all .15s;font-family:'Inter',sans-serif;}
        .us-role-btn--on{border-color:#C75D3A;background:rgba(199,93,58,.06);color:#C75D3A;}
        .us-role-desc{font-size:10.5px;color:rgba(43,38,32,.45);}
        .us-input{width:100%;padding:10px 13px;font-size:13px;border:1.5px solid rgba(43,38,32,.12);border-radius:10px;background:#FBF6EE;color:#2B2620;font-family:'Inter',sans-serif;outline:none;}
        .us-input:focus{border-color:#C75D3A;}
        .us-field-hint{font-size:10.5px;color:rgba(43,38,32,.4);margin-top:6px;line-height:1.5;}
        .us-pin-display{display:flex;align-items:center;gap:12px;background:#FBF6EE;border:1px solid rgba(43,38,32,.1);border-radius:10px;padding:12px 14px;}
        .us-pin-num{font-family:monospace;font-size:26px;font-weight:800;color:#2B2620;letter-spacing:4px;}
        .us-pin-hint{font-size:11px;color:rgba(43,38,32,.45);line-height:1.4;}
        .us-invite-btn{width:100%;background:#C75D3A;color:#fff;border:none;border-radius:11px;padding:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;margin-top:20px;}
        .us-invite-btn:disabled{opacity:.4;cursor:not-allowed;}
        .us-success{display:flex;align-items:center;gap:8px;padding:12px 14px;background:rgba(91,140,90,.12);border-radius:10px;font-size:12.5px;color:#5B8C5A;font-weight:600;margin-top:20px;}
        @media(max-width:768px){.us-3col{grid-template-columns:1fr;}.us-content{padding:14px 16px;}.us-card{overflow-x:auto;}.us-toolbar{flex-wrap:wrap;padding:10px 14px;}}
        @media(max-width:480px){table.us{min-width:460px;}}
      `}</style>

      <div className="us-content">
        <div className="us-lbl">{t('us_team')}</div>
        <div className="us-card">
          <div className="us-toolbar">
            <div className="us-filter-pills">
              {(['all','manager','scanner'] as const).map(key => (
                <button key={key} className={`us-pill${roleFilter === key ? ' us-pill--on' : ''}`} onClick={() => setFilter(key)}>
                  {key === 'all' ? `${t('us_all')} (${counts.all})` : `${ROLE_CONFIG[key as Role]?.label} (${counts[key]})`}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {teamLimit < 999 && (
                <span style={{ fontSize: 11, color: atLimit ? '#B23B3B' : 'rgba(43,38,32,.4)' }}>
                  {nonOwners}/{teamLimit}
                </span>
              )}
              <button className="us-invite-btn-sm" onClick={() => setInvite(true)} disabled={atLimit} title={atLimit ? `Límite de ${teamLimit} miembros alcanzado` : undefined}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
              {t('us_invite')}
              </button>
            </div>
          </div>
          <table className="us">
            <thead><tr><th>{t('us_col_user')}</th><th>{t('us_col_role')}</th><th>{t('us_col_access')}</th><th>{t('us_col_status')}</th><th>{t('us_col_last')}</th><th></th></tr></thead>
            <tbody>
              {filtered.map((u: StaffUser) => {
                const role   = ROLE_CONFIG[u.role]
                const status = STATUS_CONFIG[u.status]
                return (
                  <tr key={u.id}>
                    <td><div className="us-user-cell"><div className="us-av" style={{ background: AVATAR_COLORS[u.role] }}>{initials(u.name)}</div><div><div className="us-uname">{u.name}</div>{u.email && <div className="us-uemail">{u.email}</div>}</div></div></td>
                    <td><span className="us-role-badge" style={{ color: role.color, background: role.bg }}>{role.label}</span></td>
                    <td>{u.access.startsWith('PIN') ? <span className="us-pin">{u.access}</span> : <span className="us-access">{u.access}</span>}</td>
                    <td><span className="us-status-badge" style={{ color: status.color, background: status.bg }}>{status.label}</span></td>
                    <td><span className="us-last">{u.lastActivity}</span></td>
                    <td>
                      {u.role !== 'owner' && (
                        <div className="us-row-actions">
                          <button
                            className="us-action-btn"
                            onClick={() => toggleDisable(u.id)}
                            title={u.status === 'disabled' ? 'Reactivar' : 'Deshabilitar'}
                          >
                            {u.status === 'disabled'
                              ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                              : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                            }
                          </button>
                          <button
                            className="us-action-btn us-action-btn--danger"
                            onClick={() => setConfirmDelete(u.id)}
                            title="Eliminar usuario"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="us-lbl">{t('us_roles_title')}</div>
        <div className="us-3col">
          {/* Owner card — muestra info del owner logueado */}
          <div className="us-role-card">
            <div className="us-role-card-head">
              <div className="us-role-icon" style={{ background: 'rgba(199,93,58,.1)' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C75D3A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div>
                <div className="us-role-name">Owner</div>
                <div style={{ fontSize: 11, color: '#C75D3A', fontWeight: 600 }}>{owner?.fullName || '—'}</div>
              </div>
            </div>
            <div className="us-role-desc">{owner?.email || ''}</div>
            <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(43,38,32,.4)' }}>Plan {owner?.plan || 'Starter'}</div>
            {ROLE_CONFIG.owner.perms.map((p: string) => (
              <div key={p} className="us-role-perm">
                <div className="us-perm-check"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#5B8C5A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
                {p}
              </div>
            ))}
          </div>

          {/* Manager and Scanner cards */}
          {(['manager','scanner'] as Role[]).map(r => {
            const cfg = ROLE_CONFIG[r]
            return (
              <div key={r} className="us-role-card">
                <div className="us-role-card-head">
                  <div className="us-role-icon" style={{ background: cfg.bg }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      {r === 'manager' && <><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></>}
                      {r === 'scanner' && <><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></>}
                    </svg>
                  </div>
                  <div>
                    <div className="us-role-name">{cfg.label}</div>
                    <div style={{ fontSize: 10, color: cfg.color, fontWeight: 600 }}>{counts[r]} {counts[r] !== 1 ? t('us_users_count_pl') : t('us_users_count')}</div>
                  </div>
                </div>
                <div className="us-role-desc">{cfg.desc}</div>
                {cfg.perms.map((p: string) => (
                  <div key={p} className="us-role-perm">
                    <div className="us-perm-check"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#5B8C5A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
                    {p}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {showInvite && <InviteModal onClose={() => setInvite(false)} onAdd={u => setUsers([...users, u])} onRefresh={onRefresh} />}

      {confirmDelete && (() => {
        const user = users.find((u: StaffUser) => u.id === confirmDelete)
        if (!user) return null
        return (
          <div className="us-modal-overlay" onClick={() => setConfirmDelete(null)}>
            <div className="us-modal" style={{ maxWidth: 380 }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <div className="us-modal-header">
                <div className="us-modal-title">Eliminar usuario</div>
                <button className="us-modal-close" onClick={() => setConfirmDelete(null)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(43,38,32,.65)', lineHeight: 1.6, marginBottom: 20 }}>
                ¿Eliminar a <strong>{user.name}</strong>? Perderá acceso al dashboard o a la app de scanner inmediatamente.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button style={{ flex: 1, background: 'none', border: '1px solid rgba(43,38,32,.15)', borderRadius: 9, padding: '10px', fontSize: 13, cursor: 'pointer', color: 'rgba(43,38,32,.55)' }} onClick={() => setConfirmDelete(null)}>{t('cancel')}</button>
                <button style={{ flex: 1, background: '#B23B3B', color: '#fff', border: 'none', borderRadius: 9, padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }} onClick={() => deleteUser(user.id)}>Sí, eliminar</button>
              </div>
            </div>
          </div>
        )
      })()}
    </>
  )
}