'use client'
import React, { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { apiGetTeam, apiCreateTeamMember, apiUpdateTeamMember, apiDeleteTeamMember, apiResendInvite, apiTeamActivity, type TeamActivity } from '@/lib/api'
import { usePlan } from '@/data/plans'

// Equipo: el dueño, los Administradores (entran al dashboard con email y
// contraseña) y los Scanners (entran a la app de escaneo con su PIN).
// Deshabilitar o eliminar quita el acceso al instante (el backend revisa el
// usuario en cada pedido).

type Role   = 'owner' | 'manager' | 'scanner'
type Status = 'active' | 'invited' | 'disabled'
interface StaffUser {
  id: string; name: string; email: string; role: Role; status: Status
  lastActivityAt: string | null; scans30: number; lastScanAt: string | null
}

// URL de la app de escaneo (TestFlight / App Store). Se carga como variable
// de entorno cuando esté disponible; sin ella se muestra "próximamente".
const SCANNER_IOS_URL = process.env.NEXT_PUBLIC_SCANNER_IOS_URL || ''

const ROLE: Record<Role, { label: string; color: string; bg: string; desc: string; perms: string[] }> = {
  owner:   { label: 'Dueño',         color: '#C75D3A', bg: 'rgba(199,93,58,.1)',   desc: 'La cuenta que paga el plan', perms: ['Todo el dashboard', 'Plan y facturación', 'Gestión del equipo', 'Eliminar clientes y la cuenta'] },
  manager: { label: 'Administrador', color: '#185FA5', bg: 'rgba(24,95,165,.1)',   desc: 'Entra al dashboard con su email', perms: ['Clientes, premios, notificaciones y diseño', 'Analítica y formulario', 'Sin plan, equipo ni eliminar clientes'] },
  scanner: { label: 'Scanner',       color: '#9C7530', bg: 'rgba(212,162,76,.15)', desc: 'Usa la app de escaneo con su PIN', perms: ['Solo la app de escaneo', 'Suma sellos, puntos y visitas', 'Entrega premios'] },
}
const STATUS: Record<Status, { label: string; color: string; bg: string }> = {
  active:   { label: 'Activo',        color: '#5B8C5A', bg: 'rgba(91,140,90,.12)' },
  invited:  { label: 'Invitado',      color: '#9C7530', bg: 'rgba(212,162,76,.15)' },
  disabled: { label: 'Deshabilitado', color: 'rgba(43,38,32,.45)', bg: 'rgba(43,38,32,.07)' },
}

function initials(name: string) { return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() }
function relTime(d: string | number | null) {
  if (!d) return null
  const ms = typeof d === 'number' ? d : new Date(d).getTime()
  const min = Math.floor((Date.now() - ms) / 60000)
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const days = Math.floor(h / 24)
  return days < 30 ? `hace ${days} día${days === 1 ? '' : 's'}` : new Date(ms).toLocaleDateString('es-AR')
}
const fmtAt = (ms: number) => new Date(ms).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
const mapUser = (u: any): StaffUser => ({
  id: String(u._id || u.id), name: u.fullName, email: u.email || '', role: u.role, status: u.status,
  lastActivityAt: u.lastActivityAt || null, scans30: u.scans30 || 0, lastScanAt: u.lastScanAt || null,
})
const newPin = () => Math.floor(1000 + Math.random() * 9000).toString()

function AppleIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16.365 1.43c0 1.14-.415 2.06-1.246 2.76-.997.83-2.145 1.15-3.44 1.05-.11-1.24.36-2.16 1.18-2.86.86-.72 2.13-1.11 3.5-.95zm4.24 16.79c-.36.83-.79 1.6-1.29 2.31-.68.98-1.24 1.66-1.68 2.03-.68.62-1.41.94-2.19.96-.56.02-1.24-.16-2.03-.5-.79-.34-1.51-.5-2.17-.5-.69 0-1.43.16-2.22.5-.79.34-1.43.53-1.9.5-.75-.03-1.5-.37-2.24-1.02-.48-.42-1.07-1.13-1.78-2.15C1.68 18.7.86 17 .3 15.11c-.6-2.05-.9-4.04-.9-5.96 0-2.19.47-4.08 1.42-5.66.75-1.27 1.75-2.27 3-3 1.25-.73 2.6-1.11 4.06-1.14.6-.01 1.44.19 2.53.6.99.37 1.63.56 1.9.56.2 0 .89-.22 2.06-.66 1.11-.41 2.05-.58 2.83-.51 2.09.17 3.66.99 4.71 2.47-1.87 1.13-2.79 2.72-2.77 4.76.02 1.6.58 2.94 1.68 4.02.5.48 1.06.85 1.68 1.12-.14.4-.29.79-.45 1.15z"/></svg>
}

// ─── Invitar ──────────────────────────────────────────────────────────────────
function InviteModal({ businessId, onClose, onAdd }: { businessId: string; onClose: () => void; onAdd: (u: StaffUser) => void }) {
  const [role, setRole] = useState<'manager' | 'scanner'>('scanner')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState(newPin)
  const [done, setDone] = useState<{ inviteFailed?: boolean } | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  async function create() {
    if (!name.trim() || (role === 'manager' && !emailOk)) return
    setSaving(true); setError(null)
    try {
      let created: any = null
      let tryPin = pin
      // Si el PIN sorteado ya lo usa otro Scanner, se sortea otro.
      for (let attempt = 0; attempt < 6 && !created; attempt++) {
        try {
          created = await apiCreateTeamMember(businessId, { fullName: name.trim(), role, ...(role === 'manager' ? { email: email.trim() } : { pin: tryPin }) })
        } catch (err: any) {
          if (err?.error === 'pin_taken' && role === 'scanner') { tryPin = newPin(); setPin(tryPin); continue }
          throw err
        }
      }
      if (!created) throw { error: 'No pudimos generar un PIN libre. Probá de nuevo.' }
      onAdd(mapUser({ ...created, _id: created.id }))
      setDone({ inviteFailed: role === 'manager' && created.inviteSent === false })
    } catch (err: any) {
      setError(err?.message || err?.error || 'No se pudo crear el usuario. Probá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="us-overlay" onClick={done ? undefined : onClose}>
      <div className="us-modal" onClick={e => e.stopPropagation()}>
        <div className="us-modal-head">
          <div className="us-modal-title">Sumar al equipo</div>
          <button className="us-x" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        {!done ? (
          <>
            <div className="us-label">Rol</div>
            <div className="us-roles">
              {(['scanner', 'manager'] as const).map(r => (
                <button key={r} className={`us-role-opt${role === r ? ' us-role-opt--on' : ''}`} onClick={() => { setRole(r); setError(null) }}>
                  <strong>{ROLE[r].label}</strong><span>{ROLE[r].desc}</span>
                </button>
              ))}
            </div>
            <div className="us-label">Nombre</div>
            <input className="us-input" placeholder="Ej: Julieta Pérez" maxLength={60} value={name} onChange={e => setName(e.target.value)} autoFocus />
            {role === 'manager' ? (
              <>
                <div className="us-label">Email</div>
                <input className="us-input" type="email" placeholder="email@ejemplo.com" value={email} onChange={e => setEmail(e.target.value)} />
                <div className="us-hint">Le llega un link para crear su contraseña y entrar al dashboard.</div>
              </>
            ) : (
              <>
                <div className="us-label">PIN para la app</div>
                <div className="us-pin-box"><span className="us-pin-num">{pin}</span><button className="us-link" onClick={() => setPin(newPin())}>Otro PIN</button></div>
                <div className="us-hint">Con este PIN entra a la app de escaneo. No se repite con el de otro Scanner.</div>
              </>
            )}
            {error && <div className="us-error">{error}</div>}
            <button className="us-primary" onClick={create} disabled={saving || !name.trim() || (role === 'manager' && !emailOk)}>
              {saving ? 'Guardando…' : role === 'manager' ? 'Enviar invitación' : 'Crear Scanner'}
            </button>
          </>
        ) : role === 'scanner' ? (
          <>
            <div className="us-success">✓ {name.trim()} ya puede entrar a la app de escaneo.</div>
            <div className="us-label" style={{ marginTop: 16 }}>Su PIN</div>
            <div className="us-pin-box"><span className="us-pin-num">{pin}</span></div>
            <div className="us-hint">Anotalo o pasáselo ahora: por seguridad no se vuelve a mostrar. Si lo pierde, eliminalo y crealo de nuevo (su historial se conserva).</div>
            <button className="us-primary" onClick={onClose}>Listo, ya lo anoté</button>
          </>
        ) : (
          <>
            <div className="us-success">✓ Invitación creada para {email.trim()}.</div>
            {done.inviteFailed && <div className="us-error">No pudimos mandar el email. Probá con "Reenviar invitación" desde la lista.</div>}
            <button className="us-primary" onClick={onClose}>Listo</button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Activar dispositivo ──────────────────────────────────────────────────────
function ActivateDeviceModal({ businessId, onClose }: { businessId: string; onClose: () => void }) {
  const [qr, setQr] = useState('')
  useEffect(() => {
    QRCode.toDataURL(`stampa-device:${businessId}`, { width: 440, margin: 1, color: { dark: '#2B2620', light: '#FFFFFF' } }).then(setQr).catch(() => setQr(''))
  }, [businessId])
  return (
    <div className="us-overlay" onClick={onClose}>
      <div className="us-modal" onClick={e => e.stopPropagation()}>
        <div className="us-modal-head">
          <div className="us-modal-title">Activar dispositivo de escaneo</div>
          <button className="us-x" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        <div className="us-qr">{qr ? <img src={qr} width={220} height={220} alt="QR de activación" /> : <div className="us-skel" style={{ width: 220, height: 220 }} />}</div>
        <ol className="us-steps">
          <li>Instalá la app de escaneo de Stampa en el celular o tablet del local.</li>
          <li>Abrila y apuntá la cámara a este código.</li>
          <li>Listo: ese dispositivo queda vinculado a este negocio. Cada Scanner entra con su PIN.</li>
        </ol>
        <div className="us-hint">Se hace una sola vez por dispositivo. Sin un PIN válido, nadie puede sumar sellos ni ver clientes.</div>
      </div>
    </div>
  )
}

// ─── Actividad de un Scanner ──────────────────────────────────────────────────
function ActivityPanel({ businessId, user, onClose, onOpenCustomer }: { businessId: string; user: StaffUser; onClose: () => void; onOpenCustomer?: (email: string) => void }) {
  const [data, setData] = useState<TeamActivity | null>(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    apiTeamActivity(businessId, user.id).then(setData).catch(() => setError(true))
  }, [businessId, user.id])
  const t = data?.totals
  return (
    <div className="us-overlay" onClick={onClose}>
      <div className="us-modal us-modal--wide" onClick={e => e.stopPropagation()}>
        <div className="us-modal-head">
          <div>
            <div className="us-modal-title">{user.name}</div>
            <div className="us-hint" style={{ margin: 0 }}>Actividad de los últimos 30 días</div>
          </div>
          <button className="us-x" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        {error ? <div className="us-error">No pudimos cargar la actividad.</div> : !data ? (
          [0, 1, 2].map(i => <div key={i} className="us-skel" style={{ height: 38, marginBottom: 8 }} />)
        ) : (
          <>
            <div className="us-stats">
              <div><strong>{t!.total}</strong><span>movimientos</span></div>
              {t!.stamp > 0 && <div><strong>{t!.stamp}</strong><span>sellos</span></div>}
              {t!.points > 0 && <div><strong>{t!.points}</strong><span>con puntos</span></div>}
              {t!.visit > 0 && <div><strong>{t!.visit}</strong><span>visitas</span></div>}
              <div><strong>{t!.redeem}</strong><span>premios</span></div>
            </div>
            {data.alerts.length > 0 && (
              <div className="us-alerts">
                <div className="us-alerts-title">⚠ Para revisar</div>
                {data.alerts.map((a, i) => (
                  <div key={i} className="us-alert">
                    <span>{a.text}</span><span className="us-muted">{fmtAt(a.at)}</span>
                  </div>
                ))}
                <div className="us-hint" style={{ margin: '6px 0 0' }}>No bloquea nada: son patrones que conviene mirar (varios sellos seguidos al mismo cliente, o muchos escaneos en poco tiempo).</div>
              </div>
            )}
            <div className="us-label" style={{ marginTop: 14 }}>A quién le escaneó</div>
            {data.recent.length === 0 ? <div className="us-empty">No escaneó a nadie en los últimos 30 días.</div> : (
              <div className="us-recent">
                {data.recent.map((r, i) => (
                  <div key={i} className="us-recent-row">
                    <span>
                      {onOpenCustomer && r.email ? <button className="us-link" onClick={() => { onClose(); onOpenCustomer(r.email!) }}>{r.customer}</button> : <strong>{r.customer}</strong>}
                      {' '}{r.text}{r.detail ? `: ${r.detail}` : ''}
                    </span>
                    <span className="us-muted">{fmtAt(r.at)}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function UsersTab({ users: initUsers, businessId, owner, onChoosePlan, onOpenCustomer }: {
  users: any[]; businessId?: string | null
  owner?: { fullName: string; email: string; plan: string } | null
  onChoosePlan?: () => void
  onOpenCustomer?: (email: string) => void
}) {
  const { limit } = usePlan()
  const teamLimit = limit('maxTeamMembers')
  const [users, setUsers] = useState<StaffUser[]>(() => initUsers.map(u => ('name' in u ? { scans30: 0, lastScanAt: null, lastActivityAt: null, ...u } : mapUser(u))))
  const [loaded, setLoaded] = useState(false)
  const [filter, setFilter] = useState<'all' | 'manager' | 'scanner'>('all')
  const [showInvite, setShowInvite] = useState(false)
  const [showActivate, setShowActivate] = useState(false)
  const [activityOf, setActivityOf] = useState<StaffUser | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<StaffUser | null>(null)
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  // Siempre datos frescos al entrar (escaneos de los últimos 30 días).
  async function load() {
    if (!businessId) return
    try { setUsers((await apiGetTeam(businessId)).map(mapUser)) } catch { /* quedan los que vinieron */ } finally { setLoaded(true) }
  }
  useEffect(() => { load() }, [businessId]) // eslint-disable-line react-hooks/exhaustive-deps

  const occupying = users.filter(u => u.status !== 'disabled').length
  const atLimit = teamLimit < 999 && occupying >= teamLimit
  const shown = filter === 'all' ? users : users.filter(u => u.role === filter)

  async function toggleDisable(u: StaffUser) {
    if (!businessId) return
    setBusyId(u.id); setNotice(null)
    try {
      const res: any = await apiUpdateTeamMember(businessId, u.id, { status: u.status === 'disabled' ? 'active' : 'disabled' })
      setUsers(list => list.map(x => x.id === u.id ? { ...x, status: res.status } : x))
      setNotice({ ok: true, text: res.status === 'disabled' ? `${u.name} ya no puede entrar.` : `${u.name} puede volver a entrar.` })
    } catch (err: any) {
      setNotice({ ok: false, text: err?.message || err?.error || 'No se pudo cambiar el estado.' })
    } finally { setBusyId(null) }
  }
  async function remove(u: StaffUser) {
    if (!businessId) return
    setBusyId(u.id); setNotice(null)
    try {
      await apiDeleteTeamMember(businessId, u.id)
      setUsers(list => list.filter(x => x.id !== u.id))
      setNotice({ ok: true, text: `${u.name} ya no es parte del equipo. Su nombre se conserva en el historial de los clientes.` })
    } catch (err: any) {
      setNotice({ ok: false, text: err?.message || err?.error || 'No se pudo eliminar.' })
    } finally { setBusyId(null); setConfirmDelete(null) }
  }
  async function resend(u: StaffUser) {
    if (!businessId) return
    setBusyId(u.id); setNotice(null)
    try { const r = await apiResendInvite(businessId, u.id); setNotice({ ok: true, text: r.message }) }
    catch (err: any) { setNotice({ ok: false, text: err?.error || 'No se pudo reenviar la invitación.' }) }
    finally { setBusyId(null) }
  }

  const activityText = (u: StaffUser) => {
    if (u.role === 'scanner') return u.scans30 > 0 ? `${u.scans30} escaneo${u.scans30 === 1 ? '' : 's'} (30 días) · último ${relTime(u.lastScanAt)}` : u.lastScanAt ? `Sin escaneos en 30 días · último ${relTime(u.lastScanAt)}` : 'Todavía no escaneó'
    if (u.status === 'invited') return 'No aceptó la invitación todavía'
    return u.lastActivityAt ? `Entró ${relTime(u.lastActivityAt)}` : '—'
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="us-content">
        <div className="us-app-card">
          <div style={{ flex: 1, minWidth: 220 }}>
            <div className="us-app-title">App de escaneo para tu equipo</div>
            <div className="us-app-sub">Los Scanners la usan para sumar sellos, puntos y visitas y entregar premios.</div>
          </div>
          <div className="us-app-btns">
            {SCANNER_IOS_URL
              ? <a className="us-app-btn" href={SCANNER_IOS_URL} target="_blank" rel="noreferrer"><AppleIcon /> Descargar para iPhone</a>
              : <span className="us-app-btn us-app-btn--soon"><AppleIcon /> Próximamente en App Store</span>}
            {businessId && <button className="us-app-btn us-app-btn--light" onClick={() => setShowActivate(true)}>Activar dispositivo</button>}
          </div>
        </div>

        {notice && <div className={notice.ok ? 'us-success' : 'us-error'} style={{ marginTop: 0 }}>{notice.text}</div>}

        <div className="us-card">
          <div className="us-toolbar">
            <div className="us-pills">
              {(['all', 'scanner', 'manager'] as const).map(k => (
                <button key={k} className={`us-pill${filter === k ? ' us-pill--on' : ''}`} onClick={() => setFilter(k)}>
                  {k === 'all' ? 'Todos' : k === 'manager' ? 'Administradores' : 'Scanners'} ({k === 'all' ? users.length : users.filter(u => u.role === k).length})
                </button>
              ))}
            </div>
            <div className="us-toolbar-end">
              {teamLimit < 999 && <span className={`us-count${atLimit ? ' us-count--full' : ''}`}>{occupying} de {teamLimit} en tu plan</span>}
              {atLimit
                ? (onChoosePlan && <button className="us-secondary" onClick={onChoosePlan}>Más lugares</button>)
                : <button className="us-primary us-primary--sm" onClick={() => setShowInvite(true)} disabled={!businessId}>+ Sumar al equipo</button>}
            </div>
          </div>

          <div className="us-list">
            <div className="us-row us-row--owner">
              <div className="us-person">
                <div className="us-av" style={{ background: ROLE.owner.color }}>{initials(owner?.fullName || 'D')}</div>
                <div style={{ minWidth: 0 }}><div className="us-name">{owner?.fullName || 'Vos'}</div><div className="us-sub">{owner?.email}</div></div>
              </div>
              <span className="us-badge" style={{ color: ROLE.owner.color, background: ROLE.owner.bg }}>Dueño</span>
              <span className="us-activity">Plan {owner?.plan || '—'}</span>
              <span />
            </div>
            {!loaded && users.length === 0 && [0, 1].map(i => <div key={i} className="us-skel" style={{ height: 52, margin: '8px 16px' }} />)}
            {loaded && users.length === 0 && (
              <div className="us-empty">Todavía no sumaste a nadie. Creá un Scanner para que tu equipo pueda escanear tarjetas con la app.</div>
            )}
            {shown.map(u => {
              const st = STATUS[u.status]
              return (
                <div key={u.id} className={`us-row${u.status === 'disabled' ? ' us-row--off' : ''}`}>
                  <div className="us-person">
                    <div className="us-av" style={{ background: ROLE[u.role].color }}>{initials(u.name)}</div>
                    <div style={{ minWidth: 0 }}>
                      <div className="us-name">{u.name}</div>
                      <div className="us-sub">{u.role === 'manager' ? u.email : 'Entra con PIN'}</div>
                    </div>
                  </div>
                  <span className="us-badges">
                    <span className="us-badge" style={{ color: ROLE[u.role].color, background: ROLE[u.role].bg }}>{ROLE[u.role].label}</span>
                    <span className="us-badge" style={{ color: st.color, background: st.bg }}>{st.label}</span>
                  </span>
                  <span className="us-activity">
                    {u.role === 'scanner' && businessId
                      ? <button className="us-link" onClick={() => setActivityOf(u)}>{activityText(u)} →</button>
                      : activityText(u)}
                  </span>
                  <span className="us-actions">
                    {u.role === 'manager' && u.status !== 'disabled' && (
                      <button className="us-act" disabled={busyId === u.id} onClick={() => resend(u)} title={u.status === 'invited' ? 'Reenviar invitación' : 'Mandar link para nueva contraseña'}>
                        {u.status === 'invited' ? 'Reenviar invitación' : 'Nueva contraseña'}
                      </button>
                    )}
                    <button className="us-act" disabled={busyId === u.id} onClick={() => toggleDisable(u)}>{u.status === 'disabled' ? 'Reactivar' : 'Deshabilitar'}</button>
                    <button className="us-act us-act--danger" disabled={busyId === u.id} onClick={() => setConfirmDelete(u)}>Eliminar</button>
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="us-lbl">Roles y permisos</div>
        <div className="us-3col">
          {(['owner', 'manager', 'scanner'] as Role[]).map(r => (
            <div key={r} className="us-role-card">
              <div className="us-role-head"><span className="us-badge" style={{ color: ROLE[r].color, background: ROLE[r].bg }}>{ROLE[r].label}</span></div>
              <div className="us-sub" style={{ marginBottom: 8 }}>{ROLE[r].desc}</div>
              {ROLE[r].perms.map(p => <div key={p} className="us-perm">✓ {p}</div>)}
            </div>
          ))}
        </div>
      </div>

      {showActivate && businessId && <ActivateDeviceModal businessId={businessId} onClose={() => setShowActivate(false)} />}
      {showInvite && businessId && <InviteModal businessId={businessId} onClose={() => { setShowInvite(false); load() }} onAdd={u => setUsers(prev => [...prev, u])} />}
      {activityOf && businessId && <ActivityPanel businessId={businessId} user={activityOf} onClose={() => setActivityOf(null)} onOpenCustomer={onOpenCustomer} />}
      {confirmDelete && (
        <div className="us-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="us-modal" onClick={e => e.stopPropagation()}>
            <div className="us-modal-head"><div className="us-modal-title">Eliminar a {confirmDelete.name}</div><button className="us-x" onClick={() => setConfirmDelete(null)}>×</button></div>
            <p className="us-text">Pierde el acceso {confirmDelete.role === 'manager' ? 'al dashboard' : 'a la app de escaneo'} al instante y deja de ocupar un lugar del plan. Lo que ya hizo queda registrado con su nombre en el historial de los clientes.</p>
            <p className="us-text">Si solo querés frenarlo un tiempo, mejor <strong>deshabilitalo</strong>.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="us-secondary" style={{ flex: 1 }} onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="us-danger" style={{ flex: 1 }} disabled={busyId === confirmDelete.id} onClick={() => remove(confirmDelete)}>{busyId === confirmDelete.id ? 'Eliminando…' : 'Sí, eliminar'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const CSS = `
  .us-content{flex:1;overflow-y:auto;padding:20px 24px;display:flex;flex-direction:column;gap:14px;}
  .us-app-card{display:flex;align-items:center;gap:14px;background:#1B412F;border-radius:14px;padding:16px 18px;flex-wrap:wrap;}
  .us-app-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:13.5px;color:#F7F0E4;}
  .us-app-sub{font-size:11.5px;color:rgba(247,240,228,.65);margin-top:2px;}
  .us-app-btns{display:flex;gap:8px;flex-wrap:wrap;}
  .us-app-btn{display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:600;padding:9px 14px;border-radius:9px;background:#C75D3A;color:#fff;border:none;cursor:pointer;text-decoration:none;font-family:'Inter',sans-serif;white-space:nowrap;}
  .us-app-btn--light{background:#F7F0E4;color:#1B412F;}
  .us-app-btn--soon{background:rgba(247,240,228,.1);color:rgba(247,240,228,.6);cursor:default;}
  .us-lbl{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:rgba(43,38,32,.38);font-weight:600;display:flex;align-items:center;gap:10px;margin-top:4px;}
  .us-lbl::after{content:'';flex:1;height:1px;background:rgba(43,38,32,.1);}
  .us-card{background:#fff;border:1px solid rgba(43,38,32,.07);border-radius:14px;box-shadow:0 1px 8px rgba(43,38,32,.04);}
  .us-toolbar{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid rgba(43,38,32,.07);flex-wrap:wrap;}
  .us-pills{display:flex;gap:5px;flex:1;flex-wrap:wrap;}
  .us-pill{font-size:11px;padding:6px 12px;border-radius:20px;border:1px solid rgba(43,38,32,.12);background:#fff;color:rgba(43,38,32,.55);cursor:pointer;font-family:'Inter',sans-serif;}
  .us-pill--on{background:rgba(199,93,58,.1);border-color:#C75D3A;color:#C75D3A;font-weight:600;}
  .us-toolbar-end{display:flex;align-items:center;gap:10px;}
  .us-count{font-size:11.5px;color:rgba(43,38,32,.5);}
  .us-count--full{color:#B23B3B;font-weight:600;}
  .us-list{display:flex;flex-direction:column;}
  .us-row{display:grid;grid-template-columns:minmax(180px,1.4fr) auto minmax(160px,1.3fr) auto;gap:14px;align-items:center;padding:12px 16px;border-top:1px solid rgba(43,38,32,.05);}
  .us-row:first-child{border-top:none;}
  .us-row--owner{background:rgba(199,93,58,.03);}
  .us-row--off{opacity:.6;}
  .us-person{display:flex;align-items:center;gap:10px;min-width:0;}
  .us-av{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;flex-shrink:0;}
  .us-name{font-weight:600;color:#2B2620;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .us-sub{font-size:11px;color:rgba(43,38,32,.45);overflow:hidden;text-overflow:ellipsis;}
  .us-badges{display:flex;gap:5px;flex-wrap:wrap;}
  .us-badge{font-size:10px;padding:3px 10px;border-radius:20px;font-weight:700;white-space:nowrap;}
  .us-activity{font-size:11.5px;color:rgba(43,38,32,.6);}
  .us-actions{display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap;}
  .us-act{font-size:11px;font-weight:600;border:1px solid rgba(43,38,32,.14);background:#fff;color:rgba(43,38,32,.7);border-radius:7px;padding:5px 9px;cursor:pointer;font-family:inherit;white-space:nowrap;}
  .us-act:hover:not(:disabled){border-color:rgba(43,38,32,.3);color:#2B2620;}
  .us-act--danger:hover:not(:disabled){border-color:#B23B3B;color:#B23B3B;}
  .us-act:disabled{opacity:.5;cursor:default;}
  .us-link{background:none;border:none;padding:0;color:#C75D3A;font-weight:600;cursor:pointer;font-family:inherit;font-size:inherit;text-align:left;}
  .us-link:hover{text-decoration:underline;}
  .us-muted{color:rgba(43,38,32,.45);white-space:nowrap;}
  .us-empty{font-size:12.5px;color:rgba(43,38,32,.5);padding:18px 16px;line-height:1.5;}
  .us-3col{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
  .us-role-card{background:#fff;border:1px solid rgba(43,38,32,.07);border-radius:14px;padding:14px 16px;box-shadow:0 1px 8px rgba(43,38,32,.04);}
  .us-role-head{margin-bottom:6px;}
  .us-perm{font-size:11.5px;color:rgba(43,38,32,.7);padding:4px 0;}
  .us-overlay{position:fixed;inset:0;background:rgba(43,38,32,.4);display:flex;align-items:center;justify-content:center;z-index:100;padding:16px;}
  .us-modal{background:#fff;border-radius:18px;padding:24px;width:100%;max-width:420px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(43,38,32,.2);}
  .us-modal--wide{max-width:560px;}
  .us-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:16px;}
  .us-modal-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:16px;color:#2B2620;}
  .us-x{background:none;border:none;font-size:20px;line-height:1;color:rgba(43,38,32,.4);cursor:pointer;padding:2px 6px;}
  .us-label{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:rgba(43,38,32,.45);font-weight:700;margin:14px 0 7px;}
  .us-roles{display:flex;gap:8px;}
  .us-role-opt{flex:1;display:flex;flex-direction:column;gap:3px;text-align:left;padding:10px 12px;border:1.5px solid rgba(43,38,32,.12);border-radius:10px;background:#fff;cursor:pointer;font-family:inherit;}
  .us-role-opt strong{font-size:12.5px;color:#2B2620;}
  .us-role-opt span{font-size:10.5px;color:rgba(43,38,32,.5);line-height:1.35;}
  .us-role-opt--on{border-color:#C75D3A;background:rgba(199,93,58,.05);}
  .us-input{width:100%;padding:10px 13px;font-size:13px;border:1.5px solid rgba(43,38,32,.12);border-radius:10px;background:#FBF6EE;color:#2B2620;font-family:'Inter',sans-serif;outline:none;}
  .us-input:focus{border-color:#C75D3A;}
  .us-hint{font-size:11px;color:rgba(43,38,32,.5);margin-top:6px;line-height:1.5;}
  .us-pin-box{display:flex;align-items:center;justify-content:space-between;gap:12px;background:#FBF6EE;border:1px solid rgba(43,38,32,.1);border-radius:10px;padding:10px 14px;}
  .us-pin-num{font-family:monospace;font-size:26px;font-weight:800;color:#2B2620;letter-spacing:5px;}
  .us-primary{width:100%;background:#C75D3A;color:#fff;border:none;border-radius:11px;padding:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;margin-top:18px;}
  .us-primary--sm{width:auto;margin:0;padding:8px 14px;font-size:12px;border-radius:9px;}
  .us-primary:disabled{opacity:.45;cursor:not-allowed;}
  .us-secondary{background:#fff;border:1px solid rgba(43,38,32,.18);border-radius:9px;padding:9px 14px;font-size:12px;font-weight:600;color:#2B2620;cursor:pointer;font-family:inherit;}
  .us-danger{background:#B23B3B;color:#fff;border:none;border-radius:9px;padding:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}
  .us-danger:disabled{opacity:.6;}
  .us-text{font-size:13px;color:rgba(43,38,32,.7);line-height:1.6;margin-bottom:12px;}
  .us-error{padding:10px 14px;background:rgba(178,59,59,.08);border-radius:10px;font-size:12.5px;color:#8E2F2F;margin-top:12px;line-height:1.5;}
  .us-success{padding:10px 14px;background:rgba(91,140,90,.12);border-radius:10px;font-size:12.5px;color:#3F6E3E;font-weight:600;margin-top:12px;line-height:1.5;}
  .us-qr{display:flex;justify-content:center;background:#FBF6EE;border:1px solid rgba(43,38,32,.1);border-radius:14px;padding:18px;margin-bottom:14px;}
  .us-qr img{border-radius:6px;background:#fff;}
  .us-steps{margin:0 0 8px;padding-left:18px;font-size:12.5px;color:rgba(43,38,32,.75);line-height:1.6;}
  .us-stats{display:flex;gap:10px;flex-wrap:wrap;}
  .us-stats div{flex:1;min-width:90px;background:#FBF6EE;border-radius:10px;padding:10px 12px;display:flex;flex-direction:column;}
  .us-stats strong{font-family:'Plus Jakarta Sans',sans-serif;font-size:20px;color:#2B2620;}
  .us-stats span{font-size:10.5px;color:rgba(43,38,32,.5);}
  .us-alerts{margin-top:12px;background:rgba(212,162,76,.1);border:1px solid rgba(212,162,76,.35);border-radius:11px;padding:10px 12px;}
  .us-alerts-title{font-size:12px;font-weight:700;color:#7A5A12;margin-bottom:6px;}
  .us-alert{display:flex;justify-content:space-between;gap:10px;font-size:12px;color:#2B2620;padding:4px 0;flex-wrap:wrap;}
  .us-recent{display:flex;flex-direction:column;}
  .us-recent-row{display:flex;justify-content:space-between;gap:10px;font-size:12px;color:rgba(43,38,32,.75);padding:7px 0;border-bottom:1px solid rgba(43,38,32,.05);flex-wrap:wrap;}
  .us-recent-row:last-child{border-bottom:none;}
  .us-skel{background:rgba(43,38,32,.07);border-radius:10px;animation:usPulse 1.2s ease-in-out infinite;}
  @keyframes usPulse{0%,100%{opacity:.45}50%{opacity:1}}
  @media(max-width:900px){
    .us-row{grid-template-columns:1fr auto;grid-template-areas:"person badges" "activity activity" "actions actions";}
    .us-person{grid-area:person;} .us-badges{grid-area:badges;justify-content:flex-end;} .us-activity{grid-area:activity;} .us-actions{grid-area:actions;justify-content:flex-start;}
    .us-3col{grid-template-columns:1fr;}
  }
  @media(max-width:768px){.us-content{padding:14px 16px;}.us-roles{flex-direction:column;}}
`
