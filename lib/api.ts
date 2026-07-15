// lib/api.ts
//
// Capa de comunicación entre el dashboard Next.js y el backend Express.
// Todos los requests pasan por aquí — nunca llames a fetch() directo
// desde los componentes. Esto centraliza el manejo de tokens, errores
// y la URL base.

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002'

// ─── Token helpers ────────────────────────────────────────────────────────────
export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('stampa_token')
}

export function setToken(token: string) {
  localStorage.setItem('stampa_token', token)
}

export function clearToken() {
  localStorage.removeItem('stampa_token')
  localStorage.removeItem('stampa_business_id')
}

export function getBusinessId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('stampa_business_id')
}

export function setBusinessId(id: string) {
  localStorage.setItem('stampa_business_id', id)
}

// ─── Base fetch ───────────────────────────────────────────────────────────────
interface RequestOptions {
  method?: string
  body?: unknown
  token?: string | null
  noAuth?: boolean // para rutas públicas (login, register)
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, noAuth = false } = opts
  const token = opts.token ?? getToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (!noAuth && token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  // Token expirado o inválido → limpiar sesión y redirigir al login
  if (res.status === 401) {
    clearToken()
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    throw new Error('Session expired')
  }

  const data = await res.json()

  if (!res.ok) {
    throw { status: res.status, ...data }
  }

  return data as T
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Owner {
  id: string
  email: string
  fullName: string
  plan: 'Starter' | 'Growth' | 'Pro' | 'Enterprise'
  maxLocations: number
}

export interface Business {
  _id: string
  name: string
  slug: string
  sector: string
  timezone: string
  region: string
  inactiveDays: number
  alerts: { newCustomer: boolean; nearPrize: boolean; weeklyDigest: boolean }
}

export interface Card {
  _id: string
  businessId: string
  name: string
  type: 'stamp' | 'points' | 'membership'
  color: string
  secondColor: string
  logoUrl: string | null
  earnedIcon?: string | null
  emptyIcon?: string | null
  stampsRequired: number
  rewardMode: 'dynamic' | 'fixed' | null
  rewardFixedValue: string | null
  pointsPerVisit: number
  flipMessage: string
  flipSubMessage: string
  flipImageUrl: string | null
  isActive: boolean
}

export interface FormField {
  _id: string
  cardId: string
  label: string
  fieldType: string
  options?: string[]
  placeholder: string
  isLocked: boolean
  isActive: boolean
  isRewardSource: boolean
  isCustom: boolean
  order: number
}

export interface TeamMember {
  _id: string
  fullName: string
  email: string | null
  role: 'manager' | 'scanner'
  status: 'active' | 'invited' | 'disabled'
  lastActivityAt: string | null
}

export interface NotificationHistory {
  title: string
  message: string
  audience: string
  sentCount: number
  sentAt: string
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export async function apiRegister(data: {
  email: string
  password: string
  fullName: string
  termsAccepted: string
  region?: string
}) {
  const res = await request<{ token: string; owner: Owner }>('/api/auth/register', {
    method: 'POST',
    body: data,
    noAuth: true,
  })
  setToken(res.token)
  return res
}

export async function apiLogin(email: string, password: string) {
  const res = await request<{ token: string; owner: Owner }>('/api/auth/login', {
    method: 'POST',
    body: { email, password },
    noAuth: true,
  })
  setToken(res.token)
  return res
}

export async function apiMe() {
  return request<{ owner: Owner; businesses: Business[] }>('/api/auth/me')
}

export async function apiChangePassword(currentPassword: string, newPassword: string) {
  return request<{ success: boolean; message: string }>('/api/auth/change-password', {
    method: 'PATCH',
    body: { currentPassword, newPassword },
  })
}

export async function apiLogout() {
  clearToken()
  window.location.href = '/login'
}

// ─── Businesses ───────────────────────────────────────────────────────────────
export async function apiOnboarding(data: {
  businessName: string
  sector: string
  cardType: 'stamp' | 'points' | 'membership'
  stampsRequired?: number
  pointsPerVisit?: number
  rewardMode?: 'dynamic' | 'fixed'
  rewardFixedValue?: string
  brandColor?: string
  brandLogo?: string | null
  flipMessage?: string
  flipSubMessage?: string
}) {
  const res = await request<{ businessId: string; businessSlug: string; cardId: string }>(
    '/api/businesses/onboarding',
    { method: 'POST', body: data }
  )
  setBusinessId(res.businessId)
  return res
}

export async function apiGetBusinesses() {
  return request<Business[]>('/api/businesses')
}

export async function apiUpdateBusiness(businessId: string, data: Partial<Business>) {
  return request<Business>(`/api/businesses/${businessId}`, {
    method: 'PATCH',
    body: data,
  })
}

// ─── Cards ────────────────────────────────────────────────────────────────────
export async function apiGetCards(businessId: string) {
  return request<Card[]>(`/api/businesses/${businessId}/cards`)
}

export async function apiCreateCard(businessId: string, data: Partial<Card>) {
  return request<Card>(`/api/businesses/${businessId}/cards`, {
    method: 'POST',
    body: data,
  })
}

export async function apiUpdateCard(businessId: string, cardId: string, data: Partial<Card>) {
  return request<Card>(`/api/businesses/${businessId}/cards/${cardId}`, {
    method: 'PATCH',
    body: data,
  })
}

export async function apiDeleteCard(businessId: string, cardId: string) {
  return request<void>(`/api/businesses/${businessId}/cards/${cardId}`, {
    method: 'DELETE',
  })
}

// ─── Form Fields ──────────────────────────────────────────────────────────────
export async function apiGetFields(businessId: string, cardId: string) {
  return request<FormField[]>(`/api/businesses/${businessId}/cards/${cardId}/fields`)
}

export async function apiCreateField(businessId: string, cardId: string, data: Partial<FormField>) {
  return request<FormField>(`/api/businesses/${businessId}/cards/${cardId}/fields`, {
    method: 'POST',
    body: data,
  })
}

export async function apiUpdateField(businessId: string, cardId: string, fieldId: string, data: Partial<FormField>) {
  return request<FormField>(`/api/businesses/${businessId}/cards/${cardId}/fields/${fieldId}`, {
    method: 'PATCH',
    body: data,
  })
}

export async function apiDeleteField(businessId: string, cardId: string, fieldId: string) {
  return request<void>(`/api/businesses/${businessId}/cards/${cardId}/fields/${fieldId}`, {
    method: 'DELETE',
  })
}

export async function apiReorderFields(businessId: string, cardId: string, order: { id: string; order: number }[]) {
  return request<FormField[]>(`/api/businesses/${businessId}/cards/${cardId}/fields/reorder`, {
    method: 'PUT',
    body: { order },
  })
}

// ─── Team ─────────────────────────────────────────────────────────────────────
export async function apiGetTeam(businessId: string) {
  return request<TeamMember[]>(`/api/businesses/${businessId}/team`)
}

export async function apiCreateTeamMember(businessId: string, data: {
  fullName: string
  role: 'manager' | 'scanner'
  email?: string
  pin?: string
}) {
  return request<TeamMember>(`/api/businesses/${businessId}/team`, {
    method: 'POST',
    body: data,
  })
}

export async function apiUpdateTeamMember(businessId: string, userId: string, data: {
  fullName?: string
  status?: 'active' | 'disabled'
  pin?: string
}) {
  return request<TeamMember>(`/api/businesses/${businessId}/team/${userId}`, {
    method: 'PATCH',
    body: data,
  })
}

export async function apiDeleteTeamMember(businessId: string, userId: string) {
  return request<void>(`/api/businesses/${businessId}/team/${userId}`, {
    method: 'DELETE',
  })
}

// ─── Notifications ────────────────────────────────────────────────────────────
export async function apiGetNotifications(businessId: string) {
  return request<{
    history: NotificationHistory[]
    sentThisMonth: number
    monthlyLimit: number
    plan: string
  }>(`/api/businesses/${businessId}/notifications`)
}

export async function apiBroadcast(businessId: string, data: {
  title?: string
  message: string
  audience: 'all' | 'active' | 'inactive' | 'near'
}) {
  return request<{ success: boolean; sent: number; message: string }>(
    `/api/businesses/${businessId}/notifications/broadcast`,
    { method: 'POST', body: data }
  )
}

export async function apiScheduleNotification(businessId: string, data: {
  title?: string
  message: string
  audience: string
  scheduledAt: string
}) {
  return request<{ success: boolean; scheduledAt: string }>(
    `/api/businesses/${businessId}/notifications/scheduled`,
    { method: 'POST', body: data }
  )
}