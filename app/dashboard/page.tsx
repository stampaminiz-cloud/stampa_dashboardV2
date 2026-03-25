'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { mockData } from '@/app/data/mockData'
import { Icons } from '@/app/components/icons'

// ─── LOGO ─────────────────────────────────────────────────────────────────────
const StampaLogo = ({ height = 32, opacity = 1 }: { height?: number; opacity?: number }) => (
  <Image
    src="/logo/stampa-logo.png"
    alt="Stampa"
    width={160}
    height={48}
    style={{ height, width: 'auto', filter: 'brightness(0) invert(1)', opacity, flexShrink: 0 }}
  />
)

// ─── TOOLTIP ──────────────────────────────────────────────────────────────────
const CT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="ctt">
      <div className="ctl">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="ctv" style={{ color: p.color }}>{p.name}: {p.value.toLocaleString()}</div>
      ))}
    </div>
  )
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const navItems = [
  { icon: 'Overview',  label: 'Overview',    id: 'overview'   },
  { icon: 'Users',     label: 'Usuarios',    id: 'users'      },
  { icon: 'Analytics', label: 'Analytics',   id: 'analytics'  },
  { icon: 'Rewards',   label: 'Recompensas', id: 'rewards'    },
  { icon: 'Settings',  label: 'Ajustes',     id: 'settings'   },
]

const Sidebar = ({ col, setCol, act, setAct }: any) => (
  <div className={`sb ${col ? 'col' : ''}`}>
    <div className="sblogo">
      <StampaLogo height={col ? 24 : 30} />
    </div>
    {!col && <div className="sbsec">Menú</div>}
    {navItems.map(({ icon, label, id }) => (
      <div key={id} className={`sbi ${act === id ? 'on' : ''}`} onClick={() => setAct(id)}>
        {Icons[icon]?.(18)}{!col && label}
      </div>
    ))}
    <div className="sbsp" />
    <div className="sbtog" onClick={() => setCol(!col)}>
      {col ? Icons.ChevRight(15) : <>{Icons.ChevLeft(15)}<span>Colapsar</span></>}
    </div>
    {!col && (
      <div className="sbusr">
        <div className="sbav">MG</div>
        <div><div className="sbun">María Gómez</div><div className="sbur">Administrador</div></div>
      </div>
    )}
  </div>
)

// ─── HEADER ───────────────────────────────────────────────────────────────────
const Header = ({ title }: { title: string }) => (
  <div className="dh">
    <div className="dht">{title}</div>
    <div className="dhs">{Icons.Search(14)}<input placeholder="Buscar..." /></div>
    <div className="ib">{Icons.Bell(16)}<div className="nd" /></div>
    <div className="hav">MG</div>
  </div>
)

// ─── METRIC CARD ──────────────────────────────────────────────────────────────
const MetricCard = ({ label, value, delta, iconKey, color, delay }: any) => {
  const up = delta >= 0
  return (
    <div className={`gc fu f${delay}`} style={{ cursor: 'default' }}>
      <div className="mct">
        <div className="mi" style={{ background: `${color}18` }}>
          <span style={{ color }}>{Icons[iconKey]?.(20)}</span>
        </div>
        <div className={`db ${up ? 'up' : 'dn'}`}>
          <span>{up ? '↑' : '↓'}</span>{Math.abs(delta)}%
        </div>
      </div>
      <div className="mv">{value.toLocaleString()}</div>
      <div className="mlb">{label}</div>
    </div>
  )
}

// ─── GROWTH CHART ─────────────────────────────────────────────────────────────
const GrowthChart = () => (
  <div className="gc fu f1">
    <div className="ch">
      <div><div className="ct2">Crecimiento de Clientes</div><div className="cs">Registros mensuales</div></div>
      <div className="cpill">Últimos 6 meses</div>
    </div>
    <ResponsiveContainer width="100%" height={195}>
      <BarChart data={mockData.customerGrowth} barSize={28}>
        <CartesianGrid vertical={false} stroke="rgba(255,255,255,.05)" />
        <XAxis dataKey="month" tick={{ fill: 'var(--t2)', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: 'var(--t2)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`} />
        <Tooltip content={<CT />} cursor={{ fill: 'rgba(255,255,255,.03)' }} />
        <Bar dataKey="users" name="Usuarios" fill="#E8622A" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
)

// ─── DISTRIBUTION CHART ───────────────────────────────────────────────────────
const DistChart = () => (
  <div className="gc fu f2">
    <div className="ch">
      <div><div className="ct2">Distribución</div><div className="cs">Activos vs Inactivos</div></div>
    </div>
    <ResponsiveContainer width="100%" height={148}>
      <PieChart>
        <Pie data={mockData.userDistribution} cx="50%" cy="50%" innerRadius={48} outerRadius={68} paddingAngle={4} dataKey="value" startAngle={90} endAngle={-270}>
          {mockData.userDistribution.map((e: any, i: number) => <Cell key={i} fill={e.color} stroke="none" />)}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
    <div className="pl2">
      {mockData.userDistribution.map((e: any) => (
        <div key={e.name} className="plr">
          <div className="pld"><div style={{ width: 9, height: 9, borderRadius: 3, background: e.color, flexShrink: 0 }} />{e.name}</div>
          <div className="plv">{e.value.toLocaleString()}</div>
        </div>
      ))}
    </div>
  </div>
)

// ─── LOYALTY CHART ────────────────────────────────────────────────────────────
const LoyaltyChart = () => (
  <div className="gc fu f1">
    <div className="ch">
      <div><div className="ct2">Rendimiento del Programa</div><div className="cs">Sellos vs canjes</div></div>
      <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--t2)', alignItems: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: '#E8622A', display: 'inline-block' }} /> Sellos</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--blu)', display: 'inline-block' }} /> Canjes</span>
      </div>
    </div>
    <ResponsiveContainer width="100%" height={195}>
      <BarChart data={mockData.loyaltyPerformance} barGap={4} barSize={18}>
        <CartesianGrid vertical={false} stroke="rgba(255,255,255,.05)" />
        <XAxis dataKey="month" tick={{ fill: 'var(--t2)', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: 'var(--t2)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CT />} cursor={{ fill: 'rgba(255,255,255,.03)' }} />
        <Bar dataKey="stamps"   name="Sellos" fill="#E8622A"      radius={[4, 4, 0, 0]} />
        <Bar dataKey="redeemed" name="Canjes" fill="var(--blu)"   radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
)

// ─── CONVERSION CARD ──────────────────────────────────────────────────────────
const ConvCard = () => {
  const d = mockData.programConversion
  return (
    <div className="gc fu f2" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div><div className="ct2">Conversión del Programa</div><div className="cs">Pipeline sello → recompensa</div></div>
      <div className="cvs"><span className="cvsl">Usuarios con sellos</span><span className="cvsv">{d.usersWithStamps.toLocaleString()}</span></div>
      <div className="cvs"><span className="cvsl">Recompensas canjeadas</span><span className="cvsv">{d.rewardsRedeemed}</span></div>
      <div className="crb">
        <div className="crbl">Tasa de conversión</div>
        <div className="crbv">{d.conversionRate}%</div>
      </div>
    </div>
  )
}

// ─── ADVANCED METRICS ─────────────────────────────────────────────────────────
const advC = [
  { icon: 'Refresh', name: 'Clientes Recurrentes', val: '68.4%', desc: 'Regresan más de una vez' },
  { icon: 'Award',   name: 'Sellos Promedio',       val: '6.6',   desc: 'Por usuario activo'     },
  { icon: 'Percent', name: 'Tasa de Canje',         val: '42.3%', desc: 'Del total disponible'   },
  { icon: 'Clock',   name: 'Visitas para Premio',   val: '4.2',   desc: 'Promedio de visitas'     },
]
const AdvancedRow = () => (
  <div className="ag2">
    {advC.map((c, i) => (
      <div key={i} className={`gc fu f${i + 1}`} style={{ cursor: 'default' }}>
        <div className="aic"><span>{Icons[c.icon]?.(18)}</span></div>
        <div className="av2">{c.val}</div>
        <div className="an2">{c.name}</div>
        <div className="ad2">{c.desc}</div>
      </div>
    ))}
  </div>
)

// ─── TOP REWARDS ──────────────────────────────────────────────────────────────
const TopRewards = () => (
  <div className="gc fu f1">
    <div className="ch"><div><div className="ct2">Top Recompensas</div><div className="cs">Más canjeadas este período</div></div></div>
    {mockData.topRewards.map((r: any, i: number) => (
      <div key={i} className="ri">
        <div className={`rr2 ${i === 0 ? 'g' : ''}`}>{i + 1}</div>
        <div className="rinfo">
          <div className="rn">{r.name}</div>
          <div className="rtr"><div className="rf" style={{ width: `${(r.redeemed / r.max) * 100}%` }} /></div>
        </div>
        <div className="rc2">{r.redeemed}</div>
      </div>
    ))}
  </div>
)

// ─── RECENT ACTIVITY ──────────────────────────────────────────────────────────
const ini = (n: string) => n.split(' ').map((w: string) => w[0]).join('')
const RecentActivity = () => (
  <div className="gc fu f2">
    <div className="ch">
      <div><div className="ct2">Actividad Reciente</div><div className="cs">Feed en vivo</div></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--grn)' }}><div className="ld" />En vivo</div>
    </div>
    {mockData.recentActivity.map((a: any) => (
      <div key={a.id} className="aci">
        <div className={`aav ${a.type}`}>{ini(a.user)}</div>
        <div className="at2"><b>{a.user}</b> {a.action}{a.reward ? ` · ${a.reward}` : ''}</div>
        <div className="atm">{a.time}</div>
      </div>
    ))}
  </div>
)

// ─── SMART INSIGHTS ───────────────────────────────────────────────────────────
const SmartInsights = () => (
  <div className="gc fu f3">
    <div className="ch" style={{ marginBottom: 14 }}>
      <div>
        <div className="ct2" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ color: 'var(--org)' }}>{Icons.Zap(15)}</span>Smart Insights
        </div>
        <div className="cs">Recomendaciones automáticas</div>
      </div>
    </div>
    {mockData.insights.map((ins: any) => (
      <div key={ins.id} className={`ii ${ins.type}`}>
        <div className={`iico ${ins.type}`}><span>{Icons[ins.icon]?.(14)}</span></div>
        <div className="itx">{ins.text}</div>
      </div>
    ))}
  </div>
)

// ─── OVERVIEW PAGE ────────────────────────────────────────────────────────────
const Overview = () => {
  const m = mockData.metrics
  return (
    <div className="dc">
      <div className="rl">Métricas Principales</div>
      <div className="mg">
        <MetricCard label="Total Usuarios"     value={m.totalUsers}    delta={m.totalUsersDelta}    iconKey="Users"     color="#E8622A" delay={1} />
        <MetricCard label="Usuarios Activos"   value={m.activeUsers}   delta={m.activeUsersDelta}   iconKey="UserCheck" color="#3DBF8A" delay={2} />
        <MetricCard label="Nuevos Registros"   value={m.newSignUps}    delta={m.newSignUpsDelta}    iconKey="UserPlus"  color="#5B9FE0" delay={3} />
        <MetricCard label="Usuarios Inactivos" value={m.inactiveUsers} delta={m.inactiveUsersDelta} iconKey="UserX"     color="#E05252" delay={4} />
      </div>

      <div className="rl">Análisis de Crecimiento</div>
      <div className="cg2"><GrowthChart /><DistChart /></div>

      <div className="rl">Rendimiento del Programa</div>
      <div className="lg2"><LoyaltyChart /><ConvCard /></div>

      <div className="rl">Métricas Avanzadas</div>
      <AdvancedRow />

      <div className="rl">Engagement</div>
      <div className="eg2"><TopRewards /><RecentActivity /><SmartInsights /></div>
    </div>
  )
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const injectStyles = () => {
  if (document.getElementById('st-css')) return
  const s = document.createElement('style')
  s.id = 'st-css'
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    :root{
      --org:#E8622A;--org2:#D45520;--odim:rgba(232,98,42,.14);--oglow:rgba(232,98,42,.26);
      --card:rgba(13,38,31,.80);--cb:rgba(255,255,255,.08);
      --t1:#F5EFE6;--t2:rgba(245,239,230,.58);--t3:rgba(245,239,230,.26);
      --grn:#3DBF8A;--red:#E05252;--blu:#5B9FE0;
      --sw:248px;--hh:66px;--r:14px;--rl:18px;--sh:0 8px 32px rgba(0,0,0,.36);
    }
    body{font-family:'DM Sans',sans-serif;background:#0C211C;color:var(--t1);}
    ::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:3px;}
    .bg{min-height:100vh;background:radial-gradient(ellipse 80% 60% at 50% -5%,rgba(52,108,86,.48) 0%,transparent 70%),radial-gradient(ellipse 55% 45% at 90% 85%,rgba(22,62,48,.38) 0%,transparent 60%),radial-gradient(ellipse 45% 40% at 6% 65%,rgba(30,72,56,.32) 0%,transparent 60%),linear-gradient(155deg,#122d20 0%,#0c211c 50%,#091b17 100%);}
    .dw{display:flex;height:100vh;overflow:hidden;}
    .sb{width:var(--sw);flex-shrink:0;background:rgba(8,22,17,.90);backdrop-filter:blur(24px);border-right:1px solid var(--cb);display:flex;flex-direction:column;padding:20px 14px;transition:width .3s;overflow:hidden;}
    .sb.col{width:66px;}
    .sblogo{display:flex;align-items:center;gap:10px;padding:6px 6px 22px;overflow:hidden;white-space:nowrap;}
    .sbsec{font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--t3);padding:0 10px;margin:8px 0 6px;white-space:nowrap;overflow:hidden;}
    .sbi{display:flex;align-items:center;gap:12px;padding:10px;border-radius:10px;cursor:pointer;color:var(--t2);font-size:14px;font-weight:500;transition:all .15s;position:relative;white-space:nowrap;overflow:hidden;margin-bottom:2px;}
    .sbi:hover{background:rgba(255,255,255,.06);color:var(--t1);}
    .sbi.on{background:var(--odim);color:var(--org);}
    .sbi.on::before{content:'';position:absolute;left:0;top:15%;bottom:15%;width:3px;background:var(--org);border-radius:0 3px 3px 0;}
    .sbsp{flex:1;}
    .sbtog{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:9px;cursor:pointer;color:var(--t3);font-size:12px;transition:all .15s;}
    .sbtog:hover{color:var(--t2);}
    .sbusr{display:flex;align-items:center;gap:10px;padding:12px 10px;border-top:1px solid var(--cb);margin-top:8px;white-space:nowrap;overflow:hidden;}
    .sbav{width:32px;height:32px;border-radius:50%;background:var(--org);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:700;font-size:12px;color:#fff;flex-shrink:0;}
    .sbun{font-size:13px;font-weight:600;color:var(--t1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .sbur{font-size:11px;color:var(--t2);}
    .dm{flex:1;display:flex;flex-direction:column;overflow:hidden;}
    .dh{height:var(--hh);flex-shrink:0;background:rgba(8,22,17,.84);backdrop-filter:blur(20px);border-bottom:1px solid var(--cb);display:flex;align-items:center;padding:0 26px;gap:14px;}
    .dht{font-family:'Syne',sans-serif;font-weight:700;font-size:18px;flex:1;}
    .dhs{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.05);border:1px solid var(--cb);border-radius:10px;padding:9px 14px;width:210px;transition:all .2s;}
    .dhs:focus-within{border-color:rgba(232,98,42,.35);background:rgba(232,98,42,.05);}
    .dhs input{background:none;border:none;outline:none;font-family:'DM Sans',sans-serif;font-size:13px;color:var(--t1);width:100%;}
    .dhs input::placeholder{color:var(--t3);}
    .ib{width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,.05);border:1px solid var(--cb);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--t2);transition:all .15s;position:relative;flex-shrink:0;}
    .ib:hover{background:rgba(255,255,255,.09);color:var(--t1);}
    .nd{position:absolute;top:7px;right:7px;width:7px;height:7px;border-radius:50%;background:var(--org);border:1.5px solid #0C211C;}
    .hav{width:36px;height:36px;border-radius:50%;background:var(--org);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:700;font-size:13px;color:#fff;cursor:pointer;border:2px solid rgba(232,98,42,.3);flex-shrink:0;}
    .dc{flex:1;overflow-y:auto;padding:24px 26px;display:flex;flex-direction:column;gap:20px;}
    .rl{font-size:10.5px;text-transform:uppercase;letter-spacing:.1em;color:var(--t3);font-weight:600;display:flex;align-items:center;gap:10px;margin-bottom:-4px;}
    .rl::after{content:'';flex:1;height:1px;background:var(--cb);}
    .gc{background:var(--card);backdrop-filter:blur(16px);border:1px solid var(--cb);border-radius:var(--rl);padding:22px;transition:border-color .2s;}
    .gc:hover{border-color:rgba(255,255,255,.13);}
    .mg{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;}
    .mct{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;}
    .mi{width:42px;height:42px;border-radius:11px;display:flex;align-items:center;justify-content:center;}
    .db{display:flex;align-items:center;gap:3px;font-size:12px;font-weight:600;padding:4px 9px;border-radius:20px;}
    .db.up{background:rgba(61,191,138,.12);color:var(--grn);}
    .db.dn{background:rgba(224,82,82,.12);color:var(--red);}
    .mv{font-family:'Syne',sans-serif;font-size:34px;font-weight:700;line-height:1;margin-bottom:6px;}
    .mlb{font-size:13px;color:var(--t2);}
    .cg2{display:grid;grid-template-columns:1fr 320px;gap:14px;}
    .lg2{display:grid;grid-template-columns:1fr 290px;gap:14px;}
    .ag2{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;}
    .eg2{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;}
    .ch{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px;}
    .ct2{font-family:'Syne',sans-serif;font-weight:600;font-size:15px;margin-bottom:3px;}
    .cs{font-size:12px;color:var(--t2);}
    .cpill{font-size:11px;color:var(--t2);background:rgba(255,255,255,.05);border:1px solid var(--cb);border-radius:7px;padding:4px 10px;flex-shrink:0;}
    .pl2{margin-top:14px;display:flex;flex-direction:column;gap:10px;}
    .plr{display:flex;align-items:center;justify-content:space-between;}
    .pld{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--t2);}
    .plv{font-family:'Syne',sans-serif;font-weight:600;font-size:14px;}
    .cvs{display:flex;align-items:center;justify-content:space-between;padding:13px 14px;background:rgba(255,255,255,.04);border-radius:10px;border:1px solid var(--cb);}
    .cvsl{font-size:13px;color:var(--t2);}
    .cvsv{font-family:'Syne',sans-serif;font-size:20px;font-weight:700;}
    .crb{background:var(--odim);border:1px solid var(--oglow);border-radius:12px;padding:18px;text-align:center;}
    .crbl{font-size:11px;color:var(--org);text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;}
    .crbv{font-family:'Syne',sans-serif;font-size:40px;font-weight:700;color:var(--org);}
    .aic{width:40px;height:40px;border-radius:10px;background:var(--odim);border:1px solid var(--oglow);display:flex;align-items:center;justify-content:center;color:var(--org);margin-bottom:14px;}
    .av2{font-family:'Syne',sans-serif;font-size:30px;font-weight:700;margin-bottom:4px;}
    .an2{font-size:13px;font-weight:600;margin-bottom:2px;}
    .ad2{font-size:12px;color:var(--t2);}
    .ri{display:flex;align-items:center;gap:12px;margin-bottom:13px;}
    .ri:last-child{margin-bottom:0;}
    .rr2{width:24px;height:24px;border-radius:7px;background:rgba(255,255,255,.05);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:var(--t3);flex-shrink:0;}
    .rr2.g{background:var(--odim);color:var(--org);}
    .rinfo{flex:1;}
    .rn{font-size:13px;font-weight:500;margin-bottom:5px;}
    .rtr{height:5px;background:rgba(255,255,255,.06);border-radius:3px;overflow:hidden;}
    .rf{height:100%;background:linear-gradient(90deg,#E8622A,#F5A072);border-radius:3px;}
    .rc2{font-size:12px;color:var(--t2);font-weight:600;flex-shrink:0;}
    .aci{display:flex;align-items:center;gap:11px;padding:9px 0;border-bottom:1px solid var(--cb);}
    .aci:last-child{border-bottom:none;}
    .aav{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;font-family:'Syne',sans-serif;}
    .aav.redeem{background:var(--odim);color:var(--org);}
    .aav.signup{background:rgba(61,191,138,.15);color:var(--grn);}
    .aav.login{background:rgba(91,159,224,.15);color:var(--blu);}
    .at2{flex:1;font-size:13px;color:var(--t2);}
    .at2 b{color:var(--t1);font-weight:600;}
    .atm{font-size:11px;color:var(--t3);}
    .ii{display:flex;align-items:flex-start;gap:11px;padding:12px 13px;border-radius:11px;background:rgba(255,255,255,.03);border:1px solid var(--cb);margin-bottom:9px;transition:border-color .15s;}
    .ii:last-child{margin-bottom:0;}
    .ii:hover{border-color:rgba(255,255,255,.12);}
    .ii.positive{border-left:2.5px solid var(--grn);}
    .ii.warning{border-left:2.5px solid var(--org);}
    .ii.info{border-left:2.5px solid var(--blu);}
    .iico{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .iico.positive{background:rgba(61,191,138,.12);color:var(--grn);}
    .iico.warning{background:var(--odim);color:var(--org);}
    .iico.info{background:rgba(91,159,224,.12);color:var(--blu);}
    .itx{font-size:13px;color:var(--t2);line-height:1.5;padding-top:5px;}
    .ctt{background:rgba(7,20,16,.95);border:1px solid var(--cb);border-radius:9px;padding:10px 14px;font-size:12.5px;backdrop-filter:blur(12px);}
    .ctl{color:var(--t2);font-size:11px;margin-bottom:4px;}
    .ctv{font-family:'Syne',sans-serif;font-weight:600;}
    @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.4;}}
    .ld{width:7px;height:7px;border-radius:50%;background:var(--grn);animation:pulse 1.5s infinite;}
    @keyframes fu{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
    .fu{animation:fu .5s ease both;}
    .f1{animation-delay:.05s;}.f2{animation-delay:.1s;}.f3{animation-delay:.15s;}.f4{animation-delay:.2s;}
  `
  document.head.appendChild(s)
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [col, setCol] = useState(false)
  const [act, setAct] = useState('overview')
  const titles: Record<string, string> = {
    overview: 'Overview', users: 'Usuarios', analytics: 'Analytics',
    rewards: 'Recompensas', settings: 'Ajustes',
  }

  useEffect(() => { injectStyles() }, [])

  return (
    <div className="bg dw">
      <Sidebar col={col} setCol={setCol} act={act} setAct={setAct} />
      <div className="dm">
        <Header title={titles[act]} />
        {act === 'overview' ? <Overview /> : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
            <StampaLogo height={48} opacity={0.2} />
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, color: 'var(--t3)' }}>
              {titles[act]} — Próximamente
            </div>
          </div>
        )}
      </div>
    </div>
  )
}