// lib/api.ts
//
// Capa de comunicación entre el dashboard Next.js y el backend Express.
// Todos los requests pasan por aquí — nunca llames a fetch() directo
// desde los componentes. Esto centraliza el manejo de tokens, errores
// y la URL base.

import { writeCache, clearCache } from './cache'

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
  clearCache()
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

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    // Sin conexión o servidor caído: antes cada pantalla mostraba su error
    // genérico ("Error al crear la cuenta") sin decir que era la conexión.
    throw { status: 0, error: 'No pudimos conectarnos con Stampa. Revisá tu conexión a internet y probá de nuevo.' }
  }

  // Token expirado o inválido → limpiar sesión y redirigir al login.
  // OJO: nunca en una llamada noAuth (páginas públicas como el registro de
  // clientes) — ahí no hay ninguna sesión de owner que romper, y sacar a
  // alguien de su sesión real por un 401 de una llamada pública sería un bug.
  if (res.status === 401 && !noAuth) {
    clearToken()
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    throw new Error('Session expired')
  }

  // Parseamos como texto primero — un 204 No Content (típico de los DELETE
  // exitosos) no tiene body, y llamar res.json() directo ahí explota con
  // "Unexpected end of JSON input". Mismo cuidado para respuestas de error
  // que a veces tampoco traen body.
  const text = await res.text()
  const data = text ? JSON.parse(text) : null

  if (!res.ok) {
    throw { status: res.status, ...(data || {}) }
  }

  // Los GET quedan en caché para que las tabs abran al instante (lib/cache).
  if (method === 'GET' && !noAuth) writeCache(path, data)
  return data as T
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Owner {
  id: string
  email: string
  fullName: string
  plan: 'Starter' | 'Growth' | 'Pro' | 'Enterprise'
  maxLocations: number
  locationId?: string | null // administrador limitado a una sucursal
  // 'manager' = miembro del equipo invitado por el dueño: ve un solo
  // negocio, sin Equipo, plan ni zona de peligro.
  role?: 'owner' | 'manager'
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
  labelColor?: string | null
  publicDescription?: string | null
  logoUrl: string | null
  earnedIcon?: string | null
  emptyIcon?: string | null
  pointsIcon?: string | null
  stampsRequired: number
  rewardMode: 'dynamic' | 'fixed' | null
  rewardFixedValue: string | null
  pointsPerVisit: number
  flipMessage: string
  flipSubMessage: string
  flipImageUrl: string | null
  isActive: boolean
}

export interface MembershipTier {
  _id: string
  businessId: string
  cardId: string
  name: string
  threshold: number
  perk: string
  color: string
  bg: string
  icon?: string | null
  order: number
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
  isRequired?: boolean
  isDefaultOptional?: boolean
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
  scans30?: number
  lastScanAt?: string | null
}

export interface TeamActivity {
  name: string
  totals: { stamp: number; points: number; visit: number; redeem: number; total: number }
  alerts: Array<{ kind: 'repeat' | 'burst'; at: number; text: string; customer?: string; email?: string | null }>
  recent: Array<{ customer: string; email: string | null; type: string; text: string; detail: string | null; at: number }>
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

// ─── Panel del dueño de Stampa (/admin) ──────────────────────────────────────
// Solo responde a los emails de ADMIN_EMAILS (backend); al resto, 404.
export type Money = Record<string, number> // por moneda: { ARS: 84000, EUR: 39 }
export interface AdminSignal { kind: 'risk' | 'upsell' | 'idle'; text: string }
export interface AdminBusinessRow {
  id: string; name: string; country: string; ownerEmail: string | null; plan: string; access: string; billingStatus: string | null
  trialDaysLeft: number | null; isActive: boolean; createdAt: string
  scans: number; scansPrev: number; scansDelta: number | null; newCustomers: number; redeems: number; customers: number
  lastScanAt: string | null; pays: { currency: string; monthly: number } | null; signals: AdminSignal[]
}
export interface AdminOverview {
  generatedAt: string; days: number; country: string; countries: string[]; historyDays: number
  money: {
    mrr: Money; mrrPrev: Money | null; mrrUnknown: number; paying: number; planCount: Record<string, number>
    trials: number; trialsEnding7: number; conversion: { rate: number; of: number } | null
    projection: Money | null; arpu: Money; churn: number | null; lifetimeMonths: number | null; ltv: Money | null; legacy: number
    weeks: string[]; signups: number[]; cancels: number[]
    retention: { month: string; accounts: number; d30: number | null; d60: number | null; d90: number | null }[]
  }
  usage: {
    scans: number; scansDelta: number | null; newCustomers: number; newDelta: number | null; redeems: number; redeemsDelta: number | null
    activeBusinesses: number; businesses: number; series: { weekly: boolean; starts: string[]; values: number[] }
  }
  features: {
    notifications: number | null; birthday: number | null; doubleDays: number | null; expiry: number | null; teamScans: number | null
    team: number | null; locations: number | null; formFields: number | null; google: number | null
    cardTypes: { stamp: number | null; points: number | null; membership: number | null }
  }
  endUsers: { returning: number | null; avgVisits: number | null; medianGapDays: number | null; redeemed: number | null; passes: { total: number; apple: number; google: number }; people: number; perBusiness: number | null }
  businesses: AdminBusinessRow[]
}
export interface AdminBusinessDetail {
  id: string; name: string; createdAt: string; isActive: boolean; country: string
  owner: { email: string; plan: string; access: string; billingStatus: string | null; period: string | null; trialEndsAt: string | null; nextPaymentDate: string | null; pays: { currency: string; monthly: number } | null } | null
  period: { days: number; scans: number; redeems: number; newCustomers: number }
  customers: number; passes: { total: number; apple: number; google: number }
  weeks: string[]; scansWeekly: number[]
  features: { cards: { name: string; type: string; isActive: boolean }[]; locations: number; team: number; teamScans: boolean; birthday: boolean; doubleDays: boolean; expiry: boolean; notifications: number }
  endUsers: { returning: number | null; avgVisits: number | null; medianGapDays: number | null; redeemed: number | null }
  notifications: { title: string | null; audience: string; recipients: number | null; sentAt: string }[]
  history: { type: string; at: string; from?: string | null; to?: string | null; planFrom?: string; planTo?: string; plan?: string }[]
}
export async function apiAdminOverview(days: number, country: string) {
  return request<AdminOverview>(`/api/admin/overview?days=${days}&country=${encodeURIComponent(country)}`)
}
export async function apiAdminBusiness(id: string, days: number) {
  return request<AdminBusinessDetail>(`/api/admin/businesses/${id}?days=${days}`)
}

export async function apiChangePassword(currentPassword: string, newPassword: string) {
  return request<{ success: boolean; message: string }>('/api/auth/change-password', {
    method: 'PATCH',
    body: { currentPassword, newPassword },
  })
}

// Vista previa de Diseño: las imágenes reales del pase (Apple y Google) con
// los cambios sin guardar.
export async function apiWalletPreview(businessId: string, cardId: string, body: { design: Record<string, any>; side: 'front' | 'prize'; tierIndex: number }) {
  return request<{ apple: { logo: string | null; strip: string | null }; google: { logo: string | null; hero: string | null }; meta: Record<string, any> }>(
    `/api/businesses/${businessId}/cards/${cardId}/wallet-preview`, { method: 'POST', body })
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

export async function apiGetTiers(businessId: string, cardId: string) {
  return request<MembershipTier[]>(`/api/businesses/${businessId}/cards/${cardId}/tiers`)
}

export async function apiCreateTier(businessId: string, cardId: string, data: Partial<MembershipTier>) {
  return request<MembershipTier>(`/api/businesses/${businessId}/cards/${cardId}/tiers`, {
    method: 'POST', body: data,
  })
}

// Guarda la escalera completa (el editor de Premios). Devuelve cuántos
// clientes cambiaron de nivel y cuántos subieron.
export async function apiSaveTiers(businessId: string, cardId: string, tiers: Array<{ id?: string; name: string; threshold: number; perk: string; color: string; bg: string }>) {
  return request<{ tiers: MembershipTier[]; updatedCustomers: number; promoted: number }>(`/api/businesses/${businessId}/cards/${cardId}/tiers`, {
    method: 'PUT', body: { tiers },
  })
}

export async function apiCreateDefaultTiers(businessId: string, cardId: string) {
  return request<MembershipTier[]>(`/api/businesses/${businessId}/cards/${cardId}/tiers/defaults`, { method: 'POST' })
}

export async function apiUpdateTier(businessId: string, cardId: string, tierId: string, data: Partial<MembershipTier>) {
  return request<MembershipTier>(`/api/businesses/${businessId}/cards/${cardId}/tiers/${tierId}`, {
    method: 'PATCH', body: data,
  })
}

export async function apiDeleteTier(businessId: string, cardId: string, tierId: string) {
  return request<void>(`/api/businesses/${businessId}/cards/${cardId}/tiers/${tierId}`, { method: 'DELETE' })
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

export async function apiRequestDeletion(password: string) {
  return request<{ success: boolean; message: string; purgeDate: string }>('/api/auth/request-deletion', {
    method: 'POST', body: { password },
  })
}

// Cambio de email: manda un link al email nuevo; se aplica al confirmarlo.
export async function apiChangeEmail(newEmail: string, password: string) {
  return request<{ success: boolean; message: string }>('/api/auth/change-email', {
    method: 'POST', body: { newEmail, password },
  })
}

export async function apiConfirmEmail(token: string) {
  return request<{ success: boolean; email: string }>('/api/auth/confirm-email', {
    method: 'POST', body: { token }, noAuth: true,
  })
}

export async function apiCancelDeletion() {
  return request<{ success: boolean; message: string }>('/api/auth/cancel-deletion', {
    method: 'POST',
  })
}

export async function apiGetPublicBusiness(businessId: string, locationId?: string | null) {
  return request<{
    business: { id: string; name: string; slug: string }
    // Horarios de la sucursal del QR (o de la principal), desde Growth.
    location?: { name: string | null; hours: string; openNow: boolean | null } | null
    whiteLabel?: boolean
    cards: Array<{ id: string; name: string; type: string; description?: string; color?: string; secondColor?: string; textColor?: string; logoUrl?: string | null }>
    fields: Array<{ _id?: string; label: string; fieldType: string; isLocked: boolean; builtIn?: boolean; isRewardSource?: boolean; isRequired?: boolean; options?: string[]; placeholder?: string }>
  }>(`/api/businesses/${businessId}/public${locationId ? `?s=${encodeURIComponent(locationId)}` : ''}`, { noAuth: true })
}

export async function apiGetPublicCardFields(businessId: string, cardId: string) {
  return request<{ fields: Array<{ _id?: string; label: string; fieldType: string; isLocked: boolean; builtIn?: boolean; isRewardSource?: boolean; isRequired?: boolean; options?: string[]; placeholder?: string }> }>(
    `/api/businesses/${businessId}/cards/${cardId}/public-fields`, { noAuth: true }
  )
}

// "Ya estoy registrado": le manda al cliente su tarjeta por email.
export async function apiResendCard(businessIdOrSlug: string, email: string) {
  return request<{ success: boolean; message: string }>(`/api/businesses/${businessIdOrSlug}/resend-card`, {
    method: 'POST', body: { email }, noAuth: true,
  })
}

export async function apiRegisterCustomer(businessId: string, data: {
  cardId?: string
  fullName: string
  email: string
  formResponses?: Array<{ fieldId: string; value: string }>
  locationId?: string
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
  rewardOptions?: string[]   // "El cliente elige su premio": 2 a 6 opciones
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

export async function apiUpdateCard(businessId: string, cardId: string, data: Partial<Card> | Record<string, any>) {
  return request<Card & { passUpdates?: number }>(`/api/businesses/${businessId}/cards/${cardId}`, {
    method: 'PATCH',
    body: data,
  })
}

// Clientes por tarjeta: { [cardId]: { customers, withWallet } }
export async function apiCardStats(businessId: string) {
  return request<Record<string, { customers: number; withWallet: number }>>(`/api/businesses/${businessId}/cards/stats`)
}

// Cuántos clientes completarían la tarjeta si se bajan los sellos a `stampsRequired`.
export async function apiCardImpact(businessId: string, cardId: string, stampsRequired: number) {
  return request<{ wouldComplete: number }>(`/api/businesses/${businessId}/cards/${cardId}/impact?stampsRequired=${stampsRequired}`)
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

// ─── Sucursales ───────────────────────────────────────────────────────────────
export async function apiGetLocations(businessId: string) {
  return request<import('./location').LocationsResponse>(`/api/businesses/${businessId}/locations`)
}

export async function apiCreateLocation(businessId: string, data: { name: string; address?: string; mapsUrl?: string }) {
  return request<import('./location').LocationsResponse>(`/api/businesses/${businessId}/locations`, { method: 'POST', body: data })
}

export async function apiUpdateLocation(businessId: string, locationId: string, data: Partial<{ name: string; address: string; mapsUrl: string; hours: import('./location').DayHours[]; isActive: boolean }>) {
  return request<import('./location').LocationsResponse>(`/api/businesses/${businessId}/locations/${locationId}`, { method: 'PATCH', body: data })
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
  locationId?: string | null
}) {
  return request<TeamMember & { id?: string; inviteSent?: boolean }>(`/api/businesses/${businessId}/team`, {
    method: 'POST',
    body: data,
  })
}

export async function apiUpdateTeamMember(businessId: string, userId: string, data: {
  fullName?: string
  status?: 'active' | 'disabled'
  pin?: string
  locationId?: string | null
}) {
  return request<TeamMember>(`/api/businesses/${businessId}/team/${userId}`, {
    method: 'PATCH',
    body: data,
  })
}

export async function apiResendInvite(businessId: string, userId: string) {
  return request<{ success: boolean; message: string }>(`/api/businesses/${businessId}/team/${userId}/resend-invite`, {
    method: 'POST',
  })
}

export async function apiGetInvite(token: string) {
  return request<{ fullName: string; email: string; businessName: string }>(`/api/auth/invite/${encodeURIComponent(token)}`, { noAuth: true })
}

export async function apiAcceptInvite(token: string, password: string) {
  const res = await request<{ token: string; role: 'manager' }>('/api/auth/accept-invite', {
    method: 'POST',
    body: { token, password },
    noAuth: true,
  })
  setToken(res.token)
  return res
}

// Actividad de un Scanner en los últimos 30 días (con alertas).
export async function apiTeamActivity(businessId: string, userId: string) {
  return request<TeamActivity>(`/api/businesses/${businessId}/team/${userId}/activity`)
}

export async function apiDeleteTeamMember(businessId: string, userId: string) {
  return request<void>(`/api/businesses/${businessId}/team/${userId}`, {
    method: 'DELETE',
  })
}

// ─── Cobro (suscripción del dueño) ───────────────────────────────────────────
export type BillingAccess = 'legacy' | 'trial' | 'active' | 'paused'

export interface BillingStatus {
  access: BillingAccess
  plan: string
  status: string | null
  provider: 'mercadopago' | 'stripe' | null
  period: 'monthly' | 'annual' | null
  trialEndsAt: string | null
  trialDaysLeft: number
  nextPaymentDate: string | null
  accessUntil: string | null
  subscriptionId: string | null
}

export interface BillingPlan {
  plan: 'starter' | 'growth' | 'pro' | 'enterprise'
  name: string
  period: 'monthly' | 'annual'
  amount: number | null
  currency: string | null
  active: boolean
  error?: boolean
}

export async function apiBillingStatus() {
  return request<BillingStatus>('/api/billing')
}

export async function apiBillingPlans() {
  return request<{ provider: 'mercadopago'; plans: BillingPlan[] }>('/api/billing/plans')
}

export async function apiSubscribeMercadoPago(data: { plan: string; period: string; cardTokenId: string; payerEmail?: string }) {
  return request<BillingStatus>('/api/billing/mercadopago/subscribe', { method: 'POST', body: data })
}

export async function apiCancelSubscription() {
  return request<BillingStatus>('/api/billing/cancel', { method: 'POST' })
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