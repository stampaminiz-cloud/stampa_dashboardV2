'use client'
import React, { useState } from 'react'
import { useLang } from '@/data/i18n'

interface Customer {
  id: string; name: string; email: string; progress: number; total: number
  dynamicField: string; status: 'active' | 'inactive'; joined: string
  dob: string; preference: string; lastActivity: string; totalRedeemed: number
}

interface CustomersTabProps {
  customers: Customer[]
  dynamicFieldLabel?: string
}

type SortKey = 'name' | 'progress' | 'status' | 'lastActivity'
type SortDir = 'asc' | 'desc'

function initials(name: string) {
  return name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = ['#C75D3A','#185FA5','#5B8C5A','#533FB7','#854F0B','#9C7530']
function avatarColor(name: string) {
  const code = name.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0)
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

function isNearPrize(c: Customer) {
  return c.total - c.progress <= 2 && c.progress < c.total
}

function sortCustomers(list: Customer[], key: SortKey, dir: SortDir): Customer[] {
  return [...list].sort((a, b) => {
    let cmp = 0
    if (key === 'name')         cmp = a.name.localeCompare(b.name)
    if (key === 'progress')     cmp = (b.progress / b.total) - (a.progress / a.total)
    if (key === 'status')       cmp = a.status.localeCompare(b.status)
    if (key === 'lastActivity') cmp = a.lastActivity.localeCompare(b.lastActivity)
    return dir === 'asc' ? cmp : -cmp
  })
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ opacity: active ? 1 : 0.25, marginLeft: 4, verticalAlign: 'middle' }}>
      {active && dir === 'asc' ? <path d="M12 19V5M5 12l7-7 7 7" /> : <path d="M12 5v14M5 12l7 7 7-7" />}
    </svg>
  )
}

function CustomerPanel({ customer, dynamicFieldLabel, onClose, onDelete }: {
  customer: Customer; dynamicFieldLabel: string; onClose: () => void; onDelete: (id: string) => void
}) {
  const t = useLang()
  const [confirmDel, setConfirmDel] = useState(false)
  const stamps = Array.from({ length: customer.total }, (_: unknown, i: number) => i < customer.progress)
  const color = avatarColor(customer.name)
  const nearPrize = isNearPrize(customer)

  return (
    <div className="ct-panel">
      <div className="ct-panel-header">
        <button className="ct-panel-delete-btn" onClick={() => setConfirmDel(true)} title="Eliminar cliente">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </button>
        <button className="ct-panel-close" onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      {confirmDel && (
        <div className="ct-confirm-del">
          <div className="ct-confirm-del-text">¿Eliminar a <strong>{customer.name}</strong>? Esta acción no se puede deshacer.</div>
          <div className="ct-confirm-del-btns">
            <button className="ct-confirm-cancel" onClick={() => setConfirmDel(false)}>Cancelar</button>
            <button className="ct-confirm-ok" onClick={() => onDelete(customer.id)}>Eliminar</button>
          </div>
        </div>
      )}
      <div className="ct-panel-avatar" style={{ background: color }}>{initials(customer.name)}</div>
      <div className="ct-panel-name">{customer.name}</div>
      <div className="ct-panel-email">{customer.email}</div>
      <div className="ct-panel-badges">
        <span className={`ct-status-badge ct-status-badge--${customer.status}`}>
          {customer.status === 'active' ? t('status_active') : t('status_inactive')}
        </span>
        {nearPrize && <span className="ct-near-badge">{t('ct_near_badge')}</span>}
      </div>

      <div className="ct-panel-section">
        <div className="ct-panel-section-title">{t('ct_panel_progress')}</div>
        <div className="ct-panel-progress-num">{customer.progress}<span className="ct-panel-progress-den"> / {customer.total}</span></div>
        <div className="ct-panel-stamps">
          {stamps.map((filled: boolean, i: number) => <div key={i} className={`ct-panel-stamp${filled ? ' ct-panel-stamp--filled' : ''}`} />)}
        </div>
        <div className="ct-panel-progress-bar"><div className="ct-panel-progress-fill" style={{ width: `${(customer.progress / customer.total) * 100}%` }} /></div>
        {nearPrize && (
          <div className="ct-near-note">
            {customer.total - customer.progress === 0
              ? t('ct_prize_ready')
              : `${customer.total - customer.progress} ${t('ct_stamps_away')}`}
          </div>
        )}
      </div>

      <div className="ct-panel-section">
        <div className="ct-panel-section-title">{t('ct_activity')}</div>
        <div className="ct-panel-field-row"><span className="ct-panel-field-label">{t('ct_last_visit')}</span><span className="ct-panel-field-val">{customer.lastActivity}</span></div>
        <div className="ct-panel-field-row"><span className="ct-panel-field-label">{t('ct_member_since')}</span><span className="ct-panel-field-val">{customer.joined}</span></div>
        <div className="ct-panel-field-row"><span className="ct-panel-field-label">{t('ct_total_prizes')}</span><span className="ct-panel-field-val">{customer.totalRedeemed > 0 ? `${customer.totalRedeemed} ${t('redeemed')}` : t('none_yet')}</span></div>
      </div>

      <div className="ct-panel-section">
        <div className="ct-panel-section-title">{t('ct_form_responses')}</div>
        <div className="ct-panel-field-row"><span className="ct-panel-field-label">{t('ct_dob')}</span><span className="ct-panel-field-val">{customer.dob}</span></div>
        <div className="ct-panel-field-row ct-panel-field-row--highlight">
          <span className="ct-panel-field-label">{dynamicFieldLabel}</span>
          <span className="ct-panel-field-val ct-panel-field-val--highlight">{customer.dynamicField}</span>
        </div>
        <div className="ct-panel-field-row"><span className="ct-panel-field-label">{t('ct_preference')}</span><span className="ct-panel-field-val">{customer.preference}</span></div>
      </div>
    </div>
  )
}

export function CustomersTab({ customers: initCustomers, dynamicFieldLabel = 'Premio' }: CustomersTabProps) {
  const t = useLang()
  const [search, setSearch]       = useState('')
  const [statusFilter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [customers, setCustomers] = useState(initCustomers)
  const [selected, setSelected]   = useState<Customer | null>(null)

  async function deleteCustomer(id: string) {
    const businessId = localStorage.getItem('stampa_business_id')
    if (businessId) {
      try {
        await fetch(`http://localhost:5002/api/businesses/${businessId}/customers/${id}`, {
          method: 'DELETE',
          headers: { Authorization: 'Bearer ' + localStorage.getItem('stampa_token') }
        })
      } catch (err) { console.error('Error deleting customer:', err) }
    }
    setCustomers(customers.filter((c: Customer) => c.id !== id))
    setSelected(null)
  }
  const [sortKey, setSortKey]     = useState<SortKey>('progress')
  const [sortDir, setSortDir]     = useState<SortDir>('desc')

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const filtered = sortCustomers(
    customers.filter((c: Customer) => {
      const q = search.toLowerCase()
      return (c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)) &&
             (statusFilter === 'all' || c.status === statusFilter)
    }),
    sortKey, sortDir
  )

  const activeCount   = customers.filter((c: Customer) => c.status === 'active').length
  const inactiveCount = customers.filter((c: Customer) => c.status === 'inactive').length
  const nearCount     = customers.filter(isNearPrize).length

  return (
    <>
      <style>{`
        .ct-shell{flex:1;display:grid;grid-template-columns:${selected ? '1fr 268px' : '1fr'};overflow:hidden;}
        .ct-main{display:flex;flex-direction:column;overflow:hidden;}
        .ct-toolbar{display:flex;align-items:center;gap:10px;padding:14px 24px;border-bottom:1px solid rgba(43,38,32,.07);background:#FFFFFF;flex-shrink:0;flex-wrap:wrap;}
        .ct-search{display:flex;align-items:center;gap:8px;background:#FBF6EE;border:1px solid rgba(43,38,32,.1);border-radius:9px;padding:8px 12px;flex:1;max-width:280px;}
        .ct-search input{background:none;border:none;outline:none;font-family:'Inter',sans-serif;font-size:12.5px;color:#2B2620;width:100%;}
        .ct-search input::placeholder{color:rgba(43,38,32,.38);}
        .ct-filter-pills{display:flex;gap:5px;margin-left:auto;flex-wrap:wrap;}
        .ct-pill{font-size:11px;padding:6px 12px;border-radius:20px;border:1px solid rgba(43,38,32,.12);background:#FFFFFF;color:rgba(43,38,32,.55);cursor:pointer;transition:all .15s;font-family:'Inter',sans-serif;}
        .ct-pill:hover{border-color:rgba(43,38,32,.25);}
        .ct-pill--on{background:rgba(199,93,58,.1);border-color:#C75D3A;color:#C75D3A;font-weight:600;}
        .ct-table-wrap{flex:1;overflow-y:auto;}
        table.ct{width:100%;border-collapse:collapse;}
        table.ct thead{background:#FFFFFF;position:sticky;top:0;z-index:2;border-bottom:1px solid rgba(43,38,32,.08);}
        table.ct th{text-align:left;font-size:9.5px;text-transform:uppercase;letter-spacing:.06em;color:rgba(43,38,32,.38);font-weight:700;padding:10px 14px;white-space:nowrap;user-select:none;cursor:pointer;}
        table.ct th:hover{color:rgba(43,38,32,.6);}
        table.ct th.th-active{color:#2B2620;}
        table.ct th.th-dynamic{color:#C75D3A;cursor:default;}
        table.ct tbody tr{border-bottom:1px solid rgba(43,38,32,.05);cursor:pointer;transition:background .1s;}
        table.ct tbody tr:hover{background:rgba(199,93,58,.04);}
        table.ct tbody tr.ct-row--selected{background:rgba(199,93,58,.08);}
        table.ct td{padding:11px 14px;font-size:12px;color:rgba(43,38,32,.8);vertical-align:middle;}
        .ct-customer-cell{display:flex;align-items:center;gap:10px;}
        .ct-av{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;flex-shrink:0;}
        .ct-customer-name{font-weight:600;color:#2B2620;font-size:12.5px;display:flex;align-items:center;gap:6px;}
        .ct-customer-email{font-size:10.5px;color:rgba(43,38,32,.45);}
        .ct-near-dot{width:7px;height:7px;border-radius:50%;background:#D4A24C;flex-shrink:0;}
        .ct-prog-cell{display:flex;flex-direction:column;gap:4px;}
        .ct-prog-txt{font-size:12px;font-weight:600;color:#2B2620;}
        .ct-prog-mini{display:flex;gap:2px;}
        .ct-prog-dot{width:8px;height:8px;border-radius:50%;background:rgba(43,38,32,.1);}
        .ct-prog-dot--filled{background:#C75D3A;}
        .ct-dynamic{color:#C75D3A;font-weight:600;font-size:12px;}
        .ct-status-badge{font-size:10px;padding:3px 10px;border-radius:20px;font-weight:600;display:inline-block;}
        .ct-status-badge--active{background:rgba(91,140,90,.12);color:#5B8C5A;}
        .ct-status-badge--inactive{background:rgba(43,38,32,.07);color:rgba(43,38,32,.5);}
        .ct-near-badge{font-size:10px;padding:3px 10px;border-radius:20px;font-weight:600;background:rgba(212,162,76,.15);color:#9C7530;}
        .ct-activity{font-size:11.5px;color:rgba(43,38,32,.55);}
        .ct-activity--recent{color:#5B8C5A;font-weight:600;}
        .ct-activity--old{color:#B23B3B;}
        .ct-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:60px;}
        .ct-empty-icon{width:44px;height:44px;border-radius:50%;background:rgba(43,38,32,.06);display:flex;align-items:center;justify-content:center;color:rgba(43,38,32,.3);}
        .ct-empty-txt{font-size:13px;color:rgba(43,38,32,.38);}
        .ct-panel{background:#FFFFFF;border-left:1px solid rgba(43,38,32,.08);display:flex;flex-direction:column;align-items:center;padding:16px;overflow-y:auto;}
        .ct-panel-header{width:100%;display:flex;justify-content:flex-end;margin-bottom:6px;}
        .ct-panel-delete-btn{background:none;border:none;cursor:pointer;color:rgba(43,38,32,.25);padding:4px;border-radius:6px;display:flex;align-items:center;transition:all .15s;}
        .ct-panel-delete-btn:hover{color:#B23B3B;background:rgba(178,59,59,.08);}
        .ct-panel-close{background:none;border:none;cursor:pointer;color:rgba(43,38,32,.4);padding:4px;border-radius:6px;display:flex;align-items:center;transition:all .15s;}
        .ct-panel-close:hover{background:#FBF6EE;color:#2B2620;}
        .ct-confirm-del{width:100%;background:rgba(178,59,59,.07);border:1px solid rgba(178,59,59,.2);border-radius:10px;padding:12px 14px;margin-bottom:10px;}
        .ct-confirm-del-text{font-size:12px;color:rgba(43,38,32,.7);line-height:1.5;margin-bottom:10px;}
        .ct-confirm-del-btns{display:flex;gap:8px;}
        .ct-confirm-cancel{flex:1;background:none;border:1px solid rgba(43,38,32,.15);border-radius:8px;padding:7px;font-size:12px;cursor:pointer;color:rgba(43,38,32,.55);}
        .ct-confirm-ok{flex:1;background:#B23B3B;color:#fff;border:none;border-radius:8px;padding:7px;font-size:12px;font-weight:700;cursor:pointer;}
        .ct-panel-avatar{width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#fff;margin-bottom:8px;}
        .ct-panel-name{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:14px;color:#2B2620;text-align:center;}
        .ct-panel-email{font-size:11px;color:rgba(43,38,32,.45);margin-bottom:10px;text-align:center;}
        .ct-panel-badges{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;}
        .ct-panel-section{width:100%;margin-top:14px;padding-top:13px;border-top:1px solid rgba(43,38,32,.07);}
        .ct-panel-section-title{font-size:9.5px;text-transform:uppercase;letter-spacing:.06em;color:rgba(43,38,32,.38);font-weight:700;margin-bottom:10px;}
        .ct-panel-progress-num{font-family:'Plus Jakarta Sans',sans-serif;font-size:24px;font-weight:800;color:#C75D3A;margin-bottom:8px;}
        .ct-panel-progress-den{font-size:14px;color:rgba(43,38,32,.4);font-weight:500;}
        .ct-panel-stamps{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px;}
        .ct-panel-stamp{width:18px;height:18px;border-radius:50%;background:rgba(43,38,32,.08);}
        .ct-panel-stamp--filled{background:#C75D3A;}
        .ct-panel-progress-bar{width:100%;height:5px;background:rgba(43,38,32,.08);border-radius:3px;overflow:hidden;margin-bottom:6px;}
        .ct-panel-progress-fill{height:100%;background:linear-gradient(90deg,#C75D3A,#D4A24C);border-radius:3px;transition:width .3s;}
        .ct-near-note{font-size:11px;color:#9C7530;font-weight:600;background:rgba(212,162,76,.12);padding:6px 10px;border-radius:8px;}
        .ct-panel-field-row{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid rgba(43,38,32,.05);font-size:11.5px;}
        .ct-panel-field-row:last-child{border-bottom:none;}
        .ct-panel-field-row--highlight{background:rgba(212,162,76,.07);margin:0 -6px;padding:7px 6px;border-radius:8px;border-bottom:none;}
        .ct-panel-field-label{color:rgba(43,38,32,.5);}
        .ct-panel-field-val{color:#2B2620;font-weight:600;text-align:right;max-width:140px;}
        .ct-panel-field-val--highlight{color:#C75D3A;}
        @media(max-width:768px){
          .ct-shell{grid-template-columns:1fr;}
          .ct-panel{display:none;}
          .ct-toolbar{padding:10px 14px;gap:8px;}
          .ct-search{max-width:100%;}
          .ct-filter-pills{gap:4px;}
          .ct-pill{font-size:10px;padding:5px 10px;}
          .ct-table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;}
          table.ct{min-width:480px;}
          table.ct th,table.ct td{padding:9px 10px;}
        }
        @media(max-width:480px){
          .ct-filter-pills{width:100%;}
          .ct-pill{flex:1;text-align:center;}
        }
      `}</style>

      <div className="ct-shell">
        <div className="ct-main">
          <div className="ct-toolbar">
            <div className="ct-search">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input placeholder={t('ct_search')} value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="ct-filter-pills">
              <button className={`ct-pill${statusFilter === 'all' ? ' ct-pill--on' : ''}`} onClick={() => setFilter('all')}>{t('ct_all')} ({customers.length})</button>
              <button className={`ct-pill${statusFilter === 'active' ? ' ct-pill--on' : ''}`} onClick={() => setFilter('active')}>{t('ct_active')} ({activeCount})</button>
              <button className={`ct-pill${statusFilter === 'inactive' ? ' ct-pill--on' : ''}`} onClick={() => setFilter('inactive')}>{t('ct_inactive')} ({inactiveCount})</button>
              {nearCount > 0 && <button className="ct-pill" onClick={() => { setFilter('all'); setSortKey('progress'); setSortDir('desc') }}>{t('ct_near_prize')} ({nearCount})</button>}
            </div>
          </div>

          <div className="ct-table-wrap">
            {filtered.length === 0
              ? <div className="ct-empty"><div className="ct-empty-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div><div className="ct-empty-txt">{t('ct_no_match')}</div></div>
              : <table className="ct">
                  <thead>
                    <tr>
                      <th className={sortKey === 'name' ? 'th-active' : ''} onClick={() => handleSort('name')}>{t('ct_col_customer')}<SortIcon active={sortKey === 'name'} dir={sortDir} /></th>
                      <th className={sortKey === 'progress' ? 'th-active' : ''} onClick={() => handleSort('progress')}>{t('ct_col_progress')}<SortIcon active={sortKey === 'progress'} dir={sortDir} /></th>
                      <th className="th-dynamic">{dynamicFieldLabel}</th>
                      <th className={sortKey === 'status' ? 'th-active' : ''} onClick={() => handleSort('status')}>{t('ct_col_status')}<SortIcon active={sortKey === 'status'} dir={sortDir} /></th>
                      <th className={sortKey === 'lastActivity' ? 'th-active' : ''} onClick={() => handleSort('lastActivity')}>{t('ct_col_last')}<SortIcon active={sortKey === 'lastActivity'} dir={sortDir} /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c: Customer) => {
                      const near = isNearPrize(c)
                      const dots = Array.from({ length: c.total }, (_: unknown, i: number) => i < c.progress)
                      const isOld    = c.lastActivity.includes('day') && parseInt(c.lastActivity) > 30
                      const isRecent = c.lastActivity.includes('h ago') || c.lastActivity.includes('m ago')
                      return (
                        <tr key={c.id} className={selected?.id === c.id ? 'ct-row--selected' : ''} onClick={() => setSelected(selected?.id === c.id ? null : c)}>
                          <td>
                            <div className="ct-customer-cell">
                              <div className="ct-av" style={{ background: avatarColor(c.name) }}>{initials(c.name)}</div>
                              <div>
                                <div className="ct-customer-name">{c.name}{near && <div className="ct-near-dot" />}</div>
                                <div className="ct-customer-email">{c.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="ct-prog-cell">
                              <span className="ct-prog-txt">{c.progress}/{c.total}</span>
                              <div className="ct-prog-mini">{dots.map((filled: boolean, i: number) => <div key={i} className={`ct-prog-dot${filled ? ' ct-prog-dot--filled' : ''}`} />)}</div>
                            </div>
                          </td>
                          <td><span className="ct-dynamic">{c.dynamicField}</span></td>
                          <td>
                            <div style={{ display:'flex',flexDirection:'column',gap:4 }}>
                              <span className={`ct-status-badge ct-status-badge--${c.status}`}>{c.status === 'active' ? t('status_active') : t('status_inactive')}</span>
                              {near && <span className="ct-near-badge">{t('ct_near_badge')}</span>}
                            </div>
                          </td>
                          <td><span className={`ct-activity${isRecent ? ' ct-activity--recent' : isOld ? ' ct-activity--old' : ''}`}>{c.lastActivity}</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
            }
          </div>
        </div>

        {selected && <CustomerPanel customer={selected} dynamicFieldLabel={dynamicFieldLabel} onClose={() => setSelected(null)} onDelete={deleteCustomer} />}
      </div>
    </>
  )
}