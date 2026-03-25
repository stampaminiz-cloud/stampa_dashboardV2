// types/dashboard.ts

export interface DashboardMetrics {
    totalUsers: number
    activeUsers: number
    newSignUps: number
    inactiveUsers: number
    totalUsersDelta: number
    activeUsersDelta: number
    newSignUpsDelta: number
    inactiveUsersDelta: number
  }
  
  export interface MonthlyGrowth {
    month: string
    users: number
  }
  
  export interface UserDistributionItem {
    name: string
    value: number
    color: string
  }
  
  export interface LoyaltyPerformanceItem {
    month: string
    stamps: number
    redeemed: number
  }
  
  export interface ProgramConversion {
    usersWithStamps: number
    rewardsRedeemed: number
    conversionRate: number
  }
  
  export interface RewardItem {
    name: string
    redeemed: number
    max: number
  }
  
  export type ActivityType = 'redeem' | 'signup' | 'login'
  
  export interface ActivityItem {
    id: number
    user: string
    action: string
    reward: string | null
    time: string
    type: ActivityType
  }
  
  export type InsightType = 'positive' | 'warning' | 'info'
  
  export interface InsightItem {
    id: number
    type: InsightType
    text: string
    icon: string
  }
  
  export interface MockData {
    metrics: DashboardMetrics
    customerGrowth: MonthlyGrowth[]
    userDistribution: UserDistributionItem[]
    loyaltyPerformance: LoyaltyPerformanceItem[]
    programConversion: ProgramConversion
    topRewards: RewardItem[]
    recentActivity: ActivityItem[]
    insights: InsightItem[]
  }