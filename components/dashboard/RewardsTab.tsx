'use client'
import React, { useState } from 'react'
import { useLang } from '@/data/i18n'

interface CardDesign  { id: string; name: string; type: 'stamp' | 'points' | 'membership'; isActive: boolean }
interface PrizeDist   { name: string; count: number }
interface Redemption  { customer: string; prize: string; time: string }
interface CatalogItem { id: string; points: number; name: string; redeemed: number }
interface MemberTier  { id: string; name: string; threshold: number; perk: string; color: string; bg: string }
interface TierChange  { customer: string; change: string; time: string }
interface RewardsData {
  cardDesigns: CardDesign[]
  prizeDistribution: PrizeDist[]
  recentRedemptions: Redemption[]
  pointsCatalog: CatalogItem[]
  membershipTiers: MemberTier[]
  tierHistory: TierChange[]
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rw-card">
      <div className="rw-stat-label">{label}</div>
      <div className="rw-stat-val">{value}</div>
      {sub && <div className="rw-stat-sub">{sub}</div>}
    </div>
  )
}

function avatarInit(name: string) { return name.split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase() }

function StampRewards({ distribution, redemptions }: { distribution: PrizeDist[]; redemptions: Redemption[] }) {
  const t = useLang()
  const total = distribution.reduce((a: number, d: PrizeDist) => a + d.count, 0)
  const maxCount = Math.max(...distribution.map((d: PrizeDist) => d.count))
  return (
    <div className="rw-content">
      <div className="rw-3col">
        <StatCard label={t('rw_pending')} value={total} sub={t('rw_pending_sub')} />
        <StatCard label={t('rw_redeemed_month')} value={23} sub="+8 vs mes anterior" />
        <StatCard label={t('rw_top_prize')} value="Latte" sub="12 clientes" />
      </div>
      <div className="rw-card">
        <div className="rw-card-title">{t('rw_queue')}</div>
        <div className="rw-card-sub">{t('rw_queue_sub')}</div>
        <div className="rw-dist-list">
          {distribution.map((d: PrizeDist) => (
            <div key={d.name} className="rw-dist-row">
              <span className="rw-dist-name">{d.name}</span>
              <div className="rw-dist-bar-wrap"><div className="rw-dist-bar" style={{ width: `${(d.count / maxCount) * 100}%` }} /></div>
              <span className="rw-dist-count">{d.count} {t('customers')}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rw-card">
        <div className="rw-card-title">{t('rw_last')}</div>
        <div className="rw-card-sub">{t('rw_completed')}</div>
        <table className="rw-table">
          <thead><tr><th>{t('rw_col_customer')}</th><th>{t('rw_col_prize')}</th><th>{t('rw_col_when')}</th></tr></thead>
          <tbody>
            {redemptions.map((r: Redemption, i: number) => (
              <tr key={i}>
                <td><div className="rw-av-row"><div className="rw-av">{avatarInit(r.customer)}</div>{r.customer}</div></td>
                <td><span className="rw-prize-tag">{r.prize}</span></td>
                <td className="rw-time">{r.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PointsRewards({ catalog: initCatalog, redemptions }: { catalog: CatalogItem[]; redemptions: Redemption[] }) {
  const t = useLang()
  const [catalog, setCatalog] = useState<CatalogItem[]>(initCatalog)
  const [editing, setEditing] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newItem, setNewItem] = useState({ points: '', name: '' })

  function saveEdit(id: string, field: keyof CatalogItem, val: string | number) {
    setCatalog(catalog.map((c: CatalogItem) => c.id === id ? { ...c, [field]: val } : c))
  }
  function deleteItem(id: string) { setCatalog(catalog.filter((c: CatalogItem) => c.id !== id)) }
  function addItem() {
    if (!newItem.name || !newItem.points) return
    setCatalog([...catalog, { id: Date.now().toString(), points: Number(newItem.points), name: newItem.name, redeemed: 0 }])
    setNewItem({ points: '', name: '' })
    setShowAdd(false)
  }
  const totalRedeemed = catalog.reduce((a: number, c: CatalogItem) => a + c.redeemed, 0)

  return (
    <div className="rw-content">
      <div className="rw-3col">
        <StatCard label={t('rw_total_pts')} value="12.400" sub="+27% vs mes anterior" />
        <StatCard label={t('rw_redeemed_month')} value={totalRedeemed} sub={t('rw_catalog')} />
        <StatCard label={t('rw_top_prize')} value="Café gratis" sub="58 canjes" />
      </div>
      <div className="rw-card">
        <div className="rw-card-head-row">
          <div><div className="rw-card-title">{t('rw_catalog')}</div><div className="rw-card-sub">{t('rw_catalog_sub')}</div></div>
          <button className="rw-add-btn" onClick={() => setShowAdd(!showAdd)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {t('rw_new_prize')}
          </button>
        </div>
        {showAdd && (
          <div className="rw-add-form">
            <input className="rw-input" placeholder={t('rw_prize_name')} value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
            <input className="rw-input rw-input--sm" type="number" placeholder={t('points')} value={newItem.points} onChange={e => setNewItem({ ...newItem, points: e.target.value })} />
            <button className="rw-confirm-btn" onClick={addItem}>{t('add')}</button>
            <button className="rw-cancel-btn" onClick={() => setShowAdd(false)}>{t('cancel')}</button>
          </div>
        )}
        <table className="rw-table">
          <thead><tr><th>{t('rw_col_prize')}</th><th>{t('rw_col_pts')}</th><th>{t('rw_col_redeemed')}</th><th></th></tr></thead>
          <tbody>
            {catalog.map((item: CatalogItem) => (
              <tr key={item.id}>
                <td>{editing === item.id ? <input className="rw-inline-input" defaultValue={item.name} onBlur={e => { saveEdit(item.id, 'name', e.target.value); setEditing(null) }} autoFocus /> : <span className="rw-item-name">{item.name}</span>}</td>
                <td>{editing === item.id ? <input className="rw-inline-input rw-inline-input--sm" type="number" defaultValue={item.points} onBlur={e => { saveEdit(item.id, 'points', Number(e.target.value)); setEditing(null) }} /> : <span className="rw-pts-badge">{item.points} pts</span>}</td>
                <td><span className="rw-redeemed">{item.redeemed}</span></td>
                <td>
                  <div className="rw-actions">
                    <button className="rw-icon-btn" onClick={() => setEditing(editing === item.id ? null : item.id)} title={t('edit')}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>
                    <button className="rw-icon-btn rw-icon-btn--danger" onClick={() => deleteItem(item.id)} title={t('delete')}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rw-card">
        <div className="rw-card-title">{t('rw_last')}</div>
        <table className="rw-table">
          <thead><tr><th>{t('rw_col_customer')}</th><th>{t('rw_col_prize')}</th><th>{t('rw_col_when')}</th></tr></thead>
          <tbody>{redemptions.map((r: Redemption, i: number) => (<tr key={i}><td><div className="rw-av-row"><div className="rw-av">{avatarInit(r.customer)}</div>{r.customer}</div></td><td><span className="rw-prize-tag">{r.prize}</span></td><td className="rw-time">{r.time}</td></tr>))}</tbody>
        </table>
      </div>
    </div>
  )
}

function MembershipRewards({ tiers: initTiers, history }: { tiers: MemberTier[]; history: TierChange[] }) {
  const t = useLang()
  const [tiers, setTiers] = useState<MemberTier[]>(initTiers)
  const [editing, setEditing] = useState<string | null>(null)
  const TIER_MEMBERS: Record<string, number> = { '1': 111, '2': 89, '3': 52, '4': 15 }
  const total = Object.values(TIER_MEMBERS).reduce((a, b) => a + b, 0)

  function updateTier(id: string, field: keyof MemberTier, val: string | number) {
    setTiers(tiers.map((t: MemberTier) => t.id === id ? { ...t, [field]: val } : t))
  }

  return (
    <div className="rw-content">
      <div className="rw-4col">
        {tiers.map((tier: MemberTier) => (
          <div key={tier.id} className="rw-card" style={{ background: tier.bg, border: `1px solid ${tier.color}22` }}>
            <div className="rw-tier-badge" style={{ background: tier.color, color: tier.bg }}>{tier.name}</div>
            <div className="rw-tier-members" style={{ color: tier.color }}>{TIER_MEMBERS[tier.id] || 0}</div>
            <div className="rw-tier-sub" style={{ color: tier.color, opacity: .7 }}>{t('rw_active_members')}</div>
            <div className="rw-tier-pct" style={{ color: tier.color, opacity: .55 }}>{Math.round(((TIER_MEMBERS[tier.id] || 0) / total) * 100)}{t('rw_pct_total')}</div>
          </div>
        ))}
      </div>
      <div className="rw-card">
        <div className="rw-card-title">{t('rw_tier_benefits')}</div>
        <div className="rw-card-sub">{t('rw_tier_ben_sub')}</div>
        <table className="rw-table">
          <thead><tr><th>Tier</th><th>{t('rw_min_visits')}</th><th>{t('rw_benefit')}</th><th></th></tr></thead>
          <tbody>
            {tiers.map((tier: MemberTier) => (
              <tr key={tier.id}>
                <td><div className="rw-tier-cell"><div className="rw-tier-dot" style={{ background: tier.bg, border: `2px solid ${tier.color}` }} /><span style={{ fontWeight: 600, color: '#2B2620' }}>{tier.name}</span></div></td>
                <td>{editing === tier.id ? <input className="rw-inline-input rw-inline-input--sm" type="number" defaultValue={tier.threshold} onBlur={e => { updateTier(tier.id, 'threshold', Number(e.target.value)); setEditing(null) }} autoFocus /> : <span className="rw-threshold">{tier.threshold === 0 ? t('rw_automatic') : `${tier.threshold}+ ${t('visits')}`}</span>}</td>
                <td>{editing === tier.id ? <input className="rw-inline-input" defaultValue={tier.perk} onBlur={e => { updateTier(tier.id, 'perk', e.target.value); setEditing(null) }} /> : <span className="rw-perk-text">{tier.perk}</span>}</td>
                <td><button className="rw-icon-btn" onClick={() => setEditing(editing === tier.id ? null : tier.id)}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rw-card">
        <div className="rw-card-title">{t('rw_recent_changes')}</div>
        <table className="rw-table">
          <thead><tr><th>{t('rw_col_customer')}</th><th>{t('rw_col_change')}</th><th>{t('rw_col_when')}</th></tr></thead>
          <tbody>{history.map((h: TierChange, i: number) => (<tr key={i}><td><div className="rw-av-row"><div className="rw-av">{avatarInit(h.customer)}</div>{h.customer}</div></td><td><span className="rw-prize-tag" style={{ background:'rgba(91,140,90,.12)',color:'#5B8C5A' }}>↑ {h.change}</span></td><td className="rw-time">{h.time}</td></tr>))}</tbody>
        </table>
      </div>
    </div>
  )
}

export function RewardsTab({ data, rewardsData, cards, businessId }: { data: RewardsData; rewardsData?: any; cards?: any[]; businessId?: string | null }) {
  const t = useLang()
  const activeCards = (cards && cards.length > 0)
    ? cards.filter((c: any) => c.isActive)
    : data.cardDesigns.filter((c: CardDesign) => c.isActive)
  const [selectedId, setSelectedId] = useState<string>(activeCards[0]?.id || '')
  const selected = activeCards.find((c: CardDesign) => c.id === selectedId) || activeCards[0]
  const cardType = selected?.type || 'stamp'
  const TYPE_ICONS: Record<string, string> = { stamp: '☕', points: '🪙', membership: '🎫' }

  return (
    <>
      <style>{`
        .rw-shell{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .rw-toolbar{display:flex;align-items:center;gap:8px;padding:12px 24px;background:#FFFFFF;border-bottom:1px solid rgba(43,38,32,.08);flex-shrink:0;}
        .rw-card-pill{display:flex;align-items:center;gap:6px;font-size:12px;padding:7px 14px;border-radius:20px;border:1.5px solid rgba(43,38,32,.12);background:#FFFFFF;color:rgba(43,38,32,.55);cursor:pointer;transition:all .15s;font-family:'Inter',sans-serif;}
        .rw-card-pill--on{background:#1E3329;border-color:#1E3329;color:#F7F0E4;font-weight:600;}
        .rw-content{flex:1;overflow-y:auto;padding:20px 24px;display:flex;flex-direction:column;gap:14px;}
        .rw-card{background:#FFFFFF;border:1px solid rgba(43,38,32,.07);border-radius:14px;padding:16px;box-shadow:0 1px 8px rgba(43,38,32,.04);}
        .rw-card-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:13px;color:#2B2620;margin-bottom:2px;}
        .rw-card-sub{font-size:11px;color:rgba(43,38,32,.45);margin-bottom:14px;}
        .rw-card-head-row{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;}
        .rw-3col{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
        .rw-4col{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
        .rw-stat-label{font-size:10.5px;color:rgba(43,38,32,.45);margin-bottom:6px;}
        .rw-stat-val{font-family:'Plus Jakarta Sans',sans-serif;font-size:24px;font-weight:800;color:#2B2620;}
        .rw-stat-sub{font-size:10.5px;color:rgba(43,38,32,.4);margin-top:3px;}
        .rw-dist-list{display:flex;flex-direction:column;gap:10px;}
        .rw-dist-row{display:flex;align-items:center;gap:12px;}
        .rw-dist-name{font-size:12px;color:#2B2620;font-weight:500;width:90px;flex-shrink:0;}
        .rw-dist-bar-wrap{flex:1;height:12px;background:rgba(43,38,32,.06);border-radius:6px;overflow:hidden;}
        .rw-dist-bar{height:100%;background:linear-gradient(90deg,#C75D3A,#D4A24C);border-radius:6px;transition:width .4s;}
        .rw-dist-count{font-size:11px;font-weight:600;color:rgba(43,38,32,.5);width:80px;text-align:right;flex-shrink:0;}
        .rw-table{width:100%;border-collapse:collapse;}
        .rw-table thead{border-bottom:1px solid rgba(43,38,32,.08);}
        .rw-table th{text-align:left;font-size:9.5px;text-transform:uppercase;letter-spacing:.05em;color:rgba(43,38,32,.38);font-weight:700;padding:8px 10px;}
        .rw-table td{padding:10px 10px;font-size:12px;color:rgba(43,38,32,.8);border-bottom:1px solid rgba(43,38,32,.05);}
        .rw-table tr:last-child td{border-bottom:none;}
        .rw-av-row{display:flex;align-items:center;gap:8px;}
        .rw-av{width:26px;height:26px;border-radius:50%;background:#C75D3A;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff;flex-shrink:0;}
        .rw-prize-tag{font-size:11px;padding:3px 10px;border-radius:20px;background:rgba(199,93,58,.1);color:#C75D3A;font-weight:600;}
        .rw-time{font-size:11px;color:rgba(43,38,32,.4);}
        .rw-pts-badge{font-size:11px;padding:3px 10px;border-radius:20px;background:rgba(24,95,165,.1);color:#185FA5;font-weight:700;}
        .rw-item-name{font-size:12px;color:#2B2620;font-weight:500;}
        .rw-redeemed{font-size:12px;font-weight:600;color:rgba(43,38,32,.6);}
        .rw-actions{display:flex;gap:6px;justify-content:flex-end;}
        .rw-icon-btn{background:none;border:none;cursor:pointer;color:rgba(43,38,32,.4);padding:4px;border-radius:6px;display:flex;align-items:center;transition:color .15s;}
        .rw-icon-btn:hover{color:#2B2620;}
        .rw-icon-btn--danger:hover{color:#B23B3B;}
        .rw-add-btn{display:flex;align-items:center;gap:6px;font-size:12px;background:#C75D3A;color:#fff;border:none;border-radius:9px;padding:8px 16px;cursor:pointer;font-weight:700;font-family:'Plus Jakarta Sans',sans-serif;}
        .rw-add-form{display:flex;gap:8px;align-items:center;padding:12px;background:#FBF6EE;border-radius:10px;margin-bottom:14px;}
        .rw-input{padding:8px 11px;font-size:12px;border:1px solid rgba(43,38,32,.15);border-radius:8px;background:#FFFFFF;color:#2B2620;font-family:'Inter',sans-serif;outline:none;flex:1;}
        .rw-input--sm{max-width:90px;flex:none;}
        .rw-input:focus{border-color:#C75D3A;}
        .rw-confirm-btn{background:#C75D3A;color:#fff;border:none;border-radius:8px;padding:8px 14px;font-size:12px;cursor:pointer;font-weight:600;}
        .rw-cancel-btn{background:none;border:1px solid rgba(43,38,32,.15);border-radius:8px;padding:8px 14px;font-size:12px;cursor:pointer;color:rgba(43,38,32,.5);}
        .rw-inline-input{padding:5px 8px;font-size:12px;border:1.5px solid #C75D3A;border-radius:7px;background:#FBF6EE;color:#2B2620;font-family:'Inter',sans-serif;outline:none;width:100%;}
        .rw-inline-input--sm{max-width:70px;}
        .rw-tier-badge{display:inline-block;font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;margin-bottom:8px;}
        .rw-tier-members{font-family:'Plus Jakarta Sans',sans-serif;font-size:26px;font-weight:800;}
        .rw-tier-sub{font-size:11px;margin-top:2px;}
        .rw-tier-pct{font-size:10px;margin-top:2px;}
        .rw-tier-cell{display:flex;align-items:center;gap:8px;}
        .rw-tier-dot{width:14px;height:14px;border-radius:50%;flex-shrink:0;}
        .rw-threshold{font-size:11.5px;color:rgba(43,38,32,.6);}
        .rw-perk-text{font-size:12px;color:#2B2620;}
        @media(max-width:768px){.rw-3col{grid-template-columns:1fr;}.rw-4col{grid-template-columns:1fr 1fr;}.rw-content{padding:14px 16px;}.rw-card-head-row{flex-direction:column;gap:10px;}.rw-add-btn{width:100%;}.rw-toolbar{padding:10px 14px;flex-wrap:wrap;}}
        @media(max-width:480px){.rw-4col{grid-template-columns:1fr;}}
      `}</style>

      <div className="rw-shell">
        <div className="rw-toolbar">
          {activeCards.map((card: CardDesign) => (
            <button key={card.id} className={`rw-card-pill${selectedId === card.id ? ' rw-card-pill--on' : ''}`} onClick={() => setSelectedId(card.id)}>
              {TYPE_ICONS[card.type]} {card.name}
            </button>
          ))}
        </div>
        {cardType === 'stamp'      && <StampRewards      distribution={data.prizeDistribution} redemptions={data.recentRedemptions} />}
        {cardType === 'points'     && <PointsRewards     catalog={data.pointsCatalog} redemptions={data.recentRedemptions} />}
        {cardType === 'membership' && <MembershipRewards tiers={data.membershipTiers} history={data.tierHistory} />}
      </div>
    </>
  )
}