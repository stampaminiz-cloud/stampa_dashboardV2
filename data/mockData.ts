// data/mockData.ts
// All mock data used across dashboard tabs.
// Replace each section with a real API call when connecting to the backend.

export const mockData = {

  // ─── Overview ────────────────────────────────────────────────────────
  metrics: {
    totalUsers: 4821,    activeUsers: 3102,
    newSignUps: 287,     inactiveUsers: 1432,
    totalUsersDelta: 12.4, activeUsersDelta: 8.1,
    newSignUpsDelta: 23.7, inactiveUsersDelta: -5.2,
    nearPrize: 23,
  },
  customerGrowth: [
    { month: 'Jan', users: 2800 }, { month: 'Feb', users: 3100 },
    { month: 'Mar', users: 3400 }, { month: 'Apr', users: 3750 },
    { month: 'May', users: 4200 }, { month: 'Jun', users: 4821 },
  ],
  topRewards: [
    { name: 'Free Coffee',  redeemed: 120, max: 120 },
    { name: 'Free Pastry',  redeemed: 85,  max: 120 },
    { name: '10% Discount', redeemed: 60,  max: 120 },
    { name: 'Smoothie',     redeemed: 42,  max: 120 },
  ],
  recentActivity: [
    { id: 1, user: 'Maria Gomez',   action: 'redeemed',  reward: 'Free Coffee', time: '2m',  type: 'redeem' as const },
    { id: 2, user: 'Lucas Martin',  action: 'signed up', reward: null,          time: '14m', type: 'signup' as const },
    { id: 3, user: 'Ana Perez',     action: 'redeemed',  reward: 'Free Pastry', time: '31m', type: 'redeem' as const },
    { id: 4, user: 'Carlos Rivera', action: 'logged in', reward: null,          time: '48m', type: 'login'  as const },
    { id: 5, user: 'Sofia Torres',  action: 'redeemed',  reward: '10% Disc.',   time: '1h',  type: 'redeem' as const },
  ],
  insights: [
    { id: 1, type: 'positive' as const, text: 'Loyalty program conversion grew 12% this month.' },
    { id: 2, type: 'info'     as const, text: 'Free Coffee is your top reward — consider stocking up.' },
    { id: 3, type: 'warning'  as const, text: 'Activity dropped 18% this week. Consider a push notification.' },
  ],

  // ─── Customers ───────────────────────────────────────────────────────
  customers: [
    { id: '1', name: 'Maria Gomez',   email: 'maria@mail.com',   progress: 5, total: 8, dynamicField: 'Latte',      status: 'active'   as const, joined: '12 Jan 2026', dob: '14/03/1994', preference: 'Sweet', lastActivity: '2h ago',    totalRedeemed: 3 },
    { id: '2', name: 'Carlos Rivera', email: 'carlos@mail.com',  progress: 2, total: 8, dynamicField: 'Espresso',   status: 'active'   as const, joined: '28 Jan 2026', dob: '07/09/1990', preference: 'Salty', lastActivity: '1 day ago', totalRedeemed: 1 },
    { id: '3', name: 'Ana Torres',    email: 'ana@mail.com',     progress: 8, total: 8, dynamicField: 'Cappuccino', status: 'active'   as const, joined: '03 Feb 2026', dob: '22/11/1995', preference: 'Sweet', lastActivity: '30m ago',   totalRedeemed: 5 },
    { id: '4', name: 'Lucas Martin',  email: 'lucas@mail.com',   progress: 7, total: 8, dynamicField: 'Cortado',    status: 'active'   as const, joined: '15 Feb 2026', dob: '30/06/1988', preference: 'Sweet', lastActivity: '4h ago',    totalRedeemed: 2 },
    { id: '5', name: 'Sofia Ruiz',    email: 'sofia@mail.com',   progress: 3, total: 8, dynamicField: 'Latte',      status: 'inactive' as const, joined: '02 Nov 2025', dob: '18/04/1992', preference: 'Salty', lastActivity: '68 days ago', totalRedeemed: 1 },
    { id: '6', name: 'Miguel Santos', email: 'miguel@mail.com',  progress: 6, total: 8, dynamicField: 'Espresso',   status: 'active'   as const, joined: '20 Mar 2026', dob: '11/12/1985', preference: 'Sweet', lastActivity: '3 days ago', totalRedeemed: 4 },
    { id: '7', name: 'Elena Vega',    email: 'elena@mail.com',   progress: 4, total: 8, dynamicField: 'Cappuccino', status: 'inactive' as const, joined: '08 Sep 2025', dob: '25/07/1997', preference: 'Sweet', lastActivity: '72 days ago', totalRedeemed: 0 },
  ],

  // ─── Analytics ───────────────────────────────────────────────────────
  visitsOverTime: [
    { day: 'Mon', stamps: 42 }, { day: 'Tue', stamps: 58 }, { day: 'Wed', stamps: 51 },
    { day: 'Thu', stamps: 75 }, { day: 'Fri', stamps: 89 }, { day: 'Sat', stamps: 112 }, { day: 'Sun', stamps: 67 },
  ],
  heatmap: [
    { block: 'Morning',   L:2, M:3, Mi:5, J:3, V:6,  S:10, D:5 },
    { block: 'Afternoon', L:5, M:6, Mi:6, J:7, V:9,  S:11, D:6 },
    { block: 'Night',     L:1, M:2, Mi:2, J:4, V:8,  S:9,  D:2 },
  ],
  topCustomers: [
    { name: 'Maria Gomez',   visits: 42, lastVisit: '—', memberSince: '—', cardName: '—', progress: '—' },
    { name: 'Carlos Rivera', visits: 38, lastVisit: '—', memberSince: '—', cardName: '—', progress: '—' },
    { name: 'Ana Torres',    visits: 31, lastVisit: '—', memberSince: '—', cardName: '—', progress: '—' },
    { name: 'Miguel Santos', visits: 27, lastVisit: '—', memberSince: '—', cardName: '—', progress: '—' },
  ],
  funnel: [
    { stage: 'Register',       value: 320 },
    { stage: '1st visit',      value: 290 },
    { stage: 'Recurring',      value: 180 },
    { stage: 'Prize redeemed', value: 95  },
  ],
  comparison: [
    { label: 'New customers',   current: 287, previous: 198, unit: ''  },
    { label: 'Stamps given',    current: 890, previous: 750, unit: ''  },
    { label: 'Redemption rate', current: 42,  previous: 38,  unit: '%' },
  ],

  // ─── Analytics — nuevas métricas ─────────────────────────────────────
  frequency: {
    avgDays: 8.4,
    trend: -1.2,  // negativo = mejoró (menos días entre visitas)
    distribution: [
      { label: '1-3d',  count: 12 },
      { label: '4-7d',  count: 28 },
      { label: '8-14d', count: 35 },
      { label: '15-30d',count: 18 },
      { label: '30d+',  count: 7  },
    ],
  },
  segments: {
    champions:    142,
    atRisk:       89,
    newCustomers: 287,
    dormant:      432,
  },
  prizeTimeDistribution: [
    { time: 'Mañana',       count: 45 },
    { time: 'Tarde',        count: 78 },
    { time: 'Noche',        count: 32 },
    { time: 'Fin de semana',count: 102},
  ],

  // ─── Rewards — Stamp ─────────────────────────────────────────────────
  prizeDistribution: [
    { name: 'Latte',      count: 12 },
    { name: 'Espresso',   count: 7  },
    { name: 'Cappuccino', count: 4  },
  ],
  recentRedemptions: [
    { customer: 'Maria Gomez',   prize: 'Latte',      time: '2m'  },
    { customer: 'Ana Torres',    prize: 'Cappuccino', time: '1h'  },
    { customer: 'Miguel Santos', prize: 'Espresso',   time: '3h'  },
  ],

  // ─── Rewards — Points ────────────────────────────────────────────────
  pointsCatalog: [
    { id: '1', points: 50,  name: 'Free Pastry',          redeemed: 32 },
    { id: '2', points: 100, name: 'Free Coffee',           redeemed: 58 },
    { id: '3', points: 250, name: '10% off next purchase', redeemed: 14 },
  ],

  // ─── Rewards — Membership ────────────────────────────────────────────
  membershipTiers: [
    { id: '1', name: 'Bronze', threshold: 0,  perk: 'No extra benefits',  color: '#854F0B', bg: '#FAEEDA' },
    { id: '2', name: 'Silver', threshold: 10, perk: '5% discount',         color: '#444441', bg: '#F1EFE8' },
    { id: '3', name: 'Gold',   threshold: 25, perk: 'Birthday item on us', color: '#633806', bg: '#FAC775' },
    { id: '4', name: 'Black',  threshold: 50, perk: 'Beneficios exclusivos', color: '#F7F0E4', bg: '#1A1A18' },
  ],
  tierHistory: [
    { customer: 'Ana Torres',    change: 'Reached Gold',   time: '2h ago'    },
    { customer: 'Carlos Rivera', change: 'Reached Silver', time: '1 day ago' },
  ],

  // ─── Notifications ───────────────────────────────────────────────────
  scheduledNotifications: [
    { id: '1', message: '¡Hoy tenés 2x1 en café de la tarde!', audience: 'Near prize' as const, scheduledAt: 'Fri Jun 21, 16:00' },
  ],
  sentNotifications: [
    { id: '1', message: 'We miss you, come back this week!', audience: 'Inactive' as const, sentCount: 142, sentAt: 'Jun 14' },
    { id: '2', message: '¡Bienvenido a Stampa!',             audience: 'All'      as const, sentCount: 320, sentAt: 'Jun 1'  },
  ],

  // ─── Design ──────────────────────────────────────────────────────────
  cardDesigns: [
    { id: '1', name: 'Tarjeta de sellos', type: 'stamp' as const, isActive: true, color: '#1E3329', secondColor: '#16271F', stampsRequired: 8, rewardMode: 'dynamic', rewardField: 'Bebida favorita' },
  ],
  formFields: [
    { id: '1', label: 'Nombre completo',     type: 'text',   isLocked: true,  isActive: true,  isRewardSource: false, order: 1 },
    { id: '2', label: 'Email',               type: 'email',  isLocked: true,  isActive: true,  isRewardSource: false, order: 2 },
    { id: '3', label: 'Fecha de nacimiento', type: 'date',   isLocked: false, isActive: true,  isRewardSource: false, order: 3 },
    { id: '4', label: 'Bebida favorita',     type: 'text',   isLocked: false, isActive: true,  isRewardSource: true,  order: 4 },
    { id: '5', label: '¿Dulce o salado?',    type: 'select', isLocked: false, isActive: true,  isRewardSource: false, order: 5 },
  ],

  // ─── Users (team) ────────────────────────────────────────────────────
  staffUsers: [
    { id: '1', name: 'María Gómez',  email: 'maria@stampa.com', role: 'owner'   as const, access: 'Dashboard', status: 'active'  as const, lastActivity: '5m ago'  },
    { id: '2', name: 'Sofia Torres', email: 'sofia@stampa.com', role: 'manager' as const, access: 'Dashboard', status: 'invited' as const, lastActivity: '—'        },
    { id: '3', name: 'Juan López',   email: '',                 role: 'scanner' as const, access: 'PIN 4821',  status: 'active'  as const, lastActivity: '12m ago' },
  ],

  // ─── Settings ────────────────────────────────────────────────────────
  business: {
    name: 'Cafetería Don Pepe',
    sector: 'Café',
    timezone: 'GMT-3 · Buenos Aires',
    inactiveDays: 60,
    plan: 'Starter',
    planActiveCards: 1,
    planMaxCards: 1,
    alerts: {
      newCustomer: true,
      nearPrize: true,
      weeklyDigest: false,
    },
  },
}