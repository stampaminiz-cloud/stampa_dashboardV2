// data/mockData.ts

export const mockData = {
  metrics: {
    totalUsers: 4821,
    activeUsers: 3102,
    newSignUps: 287,
    inactiveUsers: 1432,
    totalUsersDelta: 12.4,
    activeUsersDelta: 8.1,
    newSignUpsDelta: 23.7,
    inactiveUsersDelta: -5.2,
  },
  customerGrowth: [
    { month: 'Ene', users: 2800 },
    { month: 'Feb', users: 3100 },
    { month: 'Mar', users: 3400 },
    { month: 'Abr', users: 3750 },
    { month: 'May', users: 4200 },
    { month: 'Jun', users: 4821 },
  ],
  userDistribution: [
    { name: 'Activos',   value: 3102, color: '#E8622A' },
    { name: 'Inactivos', value: 1432, color: 'rgba(255,255,255,0.10)' },
  ],
  loyaltyPerformance: [
    { month: 'Ene', stamps: 4200, redeemed: 890  },
    { month: 'Feb', stamps: 5100, redeemed: 1120 },
    { month: 'Mar', stamps: 4800, redeemed: 980  },
    { month: 'Abr', stamps: 6300, redeemed: 1450 },
    { month: 'May', stamps: 7100, redeemed: 1820 },
    { month: 'Jun', stamps: 8200, redeemed: 2100 },
  ],
  programConversion: {
    usersWithStamps:  1240,
    rewardsRedeemed:  320,
    conversionRate:   25.8,
  },
  topRewards: [
    { name: 'Free Coffee',   redeemed: 120, max: 120 },
    { name: 'Free Pastry',   redeemed: 85,  max: 120 },
    { name: '10% Descuento', redeemed: 60,  max: 120 },
    { name: 'Free Smoothie', redeemed: 42,  max: 120 },
    { name: '2x1',           redeemed: 28,  max: 120 },
  ],
  recentActivity: [
    { id: 1, user: 'Maria Gomez',   action: 'canjeó',        reward: 'Free Coffee', time: '2m',  type: 'redeem' },
    { id: 2, user: 'Lucas Martin',  action: 'se registró',   reward: null,          time: '14m', type: 'signup' },
    { id: 3, user: 'Ana Perez',     action: 'canjeó',        reward: 'Free Pastry', time: '31m', type: 'redeem' },
    { id: 4, user: 'Carlos Rivera', action: 'inició sesión', reward: null,          time: '48m', type: 'login'  },
    { id: 5, user: 'Sofia Torres',  action: 'canjeó',        reward: '10% Desc.',   time: '1h',  type: 'redeem' },
    { id: 6, user: 'Miguel Santos', action: 'se registró',   reward: null,          time: '2h',  type: 'signup' },
    { id: 7, user: 'Elena Ruiz',    action: 'inició sesión', reward: null,          time: '3h',  type: 'login'  },
  ],
  insights: [
    { id: 1, type: 'positive', icon: 'trend-up', text: 'La conversión del programa creció un 12% este mes.' },
    { id: 2, type: 'info',     icon: 'star',     text: 'Free Coffee es tu recompensa más popular — considera aumentar disponibilidad.' },
    { id: 3, type: 'warning',  icon: 'activity', text: 'La actividad cayó 18% esta semana. Considera lanzar una promoción.' },
    { id: 4, type: 'positive', icon: 'users',    text: 'Los nuevos registros subieron 23.7% — tu adquisición está funcionando.' },
  ],
}