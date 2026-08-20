// lib/api.ts
//
// Capa de comunicación entre el dashboard Next.js y el backend Express.
// Todos los requests pasan por aquí — nunca llames a fetch() directo
// desde los componentes. Esto centraliza el manejo de tokens, errores
// y la URL base.

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002'

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
  textColor?: string | null
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
  plan?: string
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

export async function apiGetPointsCatalog(businessId: string, cardId: string) {
  return request<Array<{ _id: string; name: string; pointsCost: number; isActive: boolean }>>(
    `/api/businesses/${businessId}/cards/${cardId}/points-catalog`
  )
}

export async function apiCreatePointsCatalogItem(businessId: string, cardId: string, data: { name: string; pointsCost: number }) {
  return request<{ _id: string; name: string; pointsCost: number }>(
    `/api/businesses/${businessId}/cards/${cardId}/points-catalog`,
    { method: 'POST', body: data }
  )
}

export async function apiUpdatePointsCatalogItem(businessId: string, cardId: string, itemId: string, data: Partial<{ name: string; pointsCost: number; isActive: boolean }>) {
  return request<{ _id: string; name: string; pointsCost: number }>(
    `/api/businesses/${businessId}/cards/${cardId}/points-catalog/${itemId}`,
    { method: 'PATCH', body: data }
  )
}

export async function apiDeletePointsCatalogItem(businessId: string, cardId: string, itemId: string) {
  return request<void>(`/api/businesses/${businessId}/cards/${cardId}/points-catalog/${itemId}`, { method: 'DELETE' })
}

export async function apiRedeemPoints(businessId: string, customerId: string, catalogItemId: string) {
  return request<{ message: string; pointsBalance: number; redeemedItem: string }>(
    `/api/businesses/${businessId}/customers/${customerId}/redeem-points`,
    { method: 'POST', body: { catalogItemId } }
  )
}

export async function apiResyncPass(businessId: string, customerId: string) {
  return request<{ message: string; results: { apple: any; google: any } }>(`/api/businesses/${businessId}/customers/${customerId}/resync-pass`, {
    method: 'POST',
  })
}

export async function apiExportCustomers(businessId: string) {
  const res = await fetch(`${BASE_URL}/api/businesses/${businessId}/customers/export`, {
    headers: { Authorization: 'Bearer ' + getToken() },
  })
  if (!res.ok) throw new Error('No se pudo exportar los clientes.')
  const blob = await res.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = res.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || 'clientes.csv'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

export async function apiRequestDeletion() {
  return request<{ success: boolean; message: string; purgeDate: string }>('/api/auth/request-deletion', {
    method: 'POST',
  })
}

export async function apiCancelDeletion() {
  return request<{ success: boolean; message: string }>('/api/auth/cancel-deletion', {
    method: 'POST',
  })
}

export async function apiGetPublicBusiness(businessId: string) {
  return request<{
    business: { id: string; name: string; slug: string }
    cards: Array<{ id: string; name: string; type: string }>
    fields: Array<{ label: string; fieldType: string; isLocked: boolean; options?: string[] }>
  }>(`/api/businesses/${businessId}/public`, { noAuth: true })
}

export async function apiGetPublicCardFields(businessId: string, cardId: string) {
  return request<{ fields: Array<{ label: string; fieldType: string; isLocked: boolean; options?: string[] }> }>(
    `/api/businesses/${businessId}/cards/${cardId}/public-fields`, { noAuth: true }
  )
}

export async function apiRegisterCustomer(businessId: string, data: {
  cardId?: string
  fullName: string
  email: string
  formResponses?: Array<{ fieldId: string; value: string }>
}) {
  return request<{ customerId: string; qrValue: string; card: { id: string; name: string; type: string } }>(
    `/api/businesses/${businessId}/register`, { method: 'POST', body: data, noAuth: true }
  )
}

export async function apiUpdateProfile(fullName: string) {
  return request<{ id: string; email: string; fullName: string }>('/api/auth/me', {
    method: 'PATCH',
    body: { fullName },
  })
}

export async function apiForgotPassword(email: string) {
  return request<{ success: boolean; message: string; devResetUrl?: string }>('/api/auth/forgot-password', {
    method: 'POST',
    body: { email },
    noAuth: true,
  })
}

export async function apiResetPassword(token: string, newPassword: string) {
  return request<{ success: boolean; message: string }>('/api/auth/reset-password', {
    method: 'POST',
    body: { token, newPassword },
    noAuth: true,
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