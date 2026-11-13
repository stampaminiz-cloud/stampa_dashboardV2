// lib/escaner.ts
//
// Escáner web (/escaner): la misma API que la app Stampa Escáner
// (/api/scanner del backend), desde el navegador del celular del local.
//
// Guarda su propia sesión, separada de la del panel (stampa_token): en la
// compu del local puede estar el panel del dueño abierto y el escáner de un
// empleado en otra pestaña, y salir de uno no tiene que sacar del otro.

import { BASE_URL } from './api'

const K_DEVICE = 'stampa_escaner_device'
const K_TOKEN = 'stampa_escaner_token'
const K_ONBOARDED = 'stampa_escaner_vio_bienvenida'
const K_TIP = 'stampa_escaner_tip_inicio'

// ─── Celular vinculado ────────────────────────────────────────────────────────
// deviceKey: solo si se vinculó con el link de Equipo (se puede quitar desde
// el panel). Con el QR de "Activar dispositivo" no hay clave, igual que la app.
export interface Device {
  businessId: string
  businessName: string
  locationId: string | null
  locationName: string | null
  deviceKey?: string
}

function read<T>(key: string): T | null {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) as T : null } catch { return null }
}
function write(key: string, value: unknown) {
  try { if (value == null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(value)) } catch { /* modo privado */ }
}

export const getDevice = () => read<Device>(K_DEVICE)
export const setDevice = (d: Device | null) => write(K_DEVICE, d)
export const getToken = () => read<string>(K_TOKEN)
export const setToken = (t: string | null) => write(K_TOKEN, t)
// Consejo "agregalo a la pantalla de inicio": queda pendiente al vincular el
// celular y se muestra una sola vez, ya adentro y con la bienvenida hecha.
export const tipPending = () => read<boolean>(K_TIP) === true
export const setTipPending = (v: boolean) => write(K_TIP, v ? true : null)
export const sawWelcome = (id: string) => (read<string[]>(K_ONBOARDED) || []).includes(id)
export const markWelcome = (id: string) => write(K_ONBOARDED, [...new Set([...(read<string[]>(K_ONBOARDED) || []), id])].slice(-30))

// ─── Tipos (mismos que la app) ───────────────────────────────────────────────
export type CardType = 'stamp' | 'points' | 'membership'
export interface Tier { id: string; name: string; threshold: number; perk?: string; color?: string; bg?: string; icon?: string }
export interface CatalogItem { id: string; name: string; pointsCost: number; affordable: boolean }
export interface Limit { reached: boolean; message: string | null; canOverride: boolean; nextAt: string | null; maxPerDay: number | null; minHoursBetween: number }
export interface CustomerView {
  customer: { id: string; fullName: string }
  card: { id: string; name: string; type: CardType; color?: string; secondColor?: string; textColor?: string; labelColor?: string; logoUrl?: string | null; earnedIcon?: string; emptyIcon?: string; pointsIcon?: string }
  lastActionAt: string | null
  doubleToday?: boolean
  birthdayGift?: { gift: string; until?: string } | null
  limit?: Limit | null
  stamp?: { stamps: number; required: number; remaining: number; completed: boolean; reward: string; flipMessage?: string; flipSubMessage?: string; flipImageUrl?: string | null }
  points?: { balance: number; mode: 'visit' | 'amount'; pointsPerVisit: number; rule: { perAmount: number; unit: number; currency: 'ARS' | 'EUR' } | null; catalog: CatalogItem[]; canRedeem: boolean }
  membership?: { totalVisits: number; tiers: Tier[]; currentTierIndex: number; currentTier: Tier | null; nextTier: Tier | null; visitsToNext: number | null }
}
export interface ActionResult extends CustomerView {
  action?: { visitId: string; kind: string; amount?: number; double?: boolean; purchase?: number | null }
  events?: { completed?: boolean; newlyUnlocked?: { id: string; name: string; pointsCost: number }[]; tierUp?: Tier | null; redeemedItem?: { name: string } }
}
export type Role = 'scanner' | 'owner' | 'manager'
export interface Me {
  scanner: { id: string; fullName: string; role: Role }
  business: { id: string; name: string }
  location: { id: string; name: string; isPrimary: boolean; status: string; multi: boolean }
  today: { mine: number; total: number }
}
export interface SearchResult { id: string; fullName: string; email: string; phone?: string | null; card: { name: string; type: CardType; color?: string; textColor?: string } }
export interface TodayItem { id: string; type: 'stamp' | 'points' | 'visit' | 'redeem'; customerId: string; customerName: string; delta: number | null; purchase: number | null; rewardName: string | null; overLimit: boolean; createdAt: string; canUndo: boolean }
export interface LocationChoice { id: string; name: string; address?: string }

// ─── Pedidos ──────────────────────────────────────────────────────────────────
export class EscanerError extends Error {
  constructor(public status: number, public code: string | null, message: string, public data: any = null) { super(message) }
  get isUnauthorized() { return this.status === 401 }
}

let onUnauthorized: (() => void) | null = null
export const setUnauthorizedHandler = (fn: (() => void) | null) => { onUnauthorized = fn }

async function request<T>(method: string, path: string, body?: unknown, auth = true): Promise<T> {
  const token = auth ? getToken() : null
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new EscanerError(0, 'offline', 'Sin conexión. Revisá el wifi o los datos y probá de nuevo.')
  }
  const text = await res.text()
  let data: any = null
  try { data = text ? JSON.parse(text) : null } catch { /* respuesta rara */ }
  if (!res.ok) {
    const code = typeof data?.error === 'string' && /^[a-z_]+$/.test(data.error) ? data.error : null
    const message = data?.message || (code ? null : data?.error) || 'Algo falló. Probá de nuevo.'
    const err = new EscanerError(res.status, code, message, data)
    if (res.status === 401 && token && !path.startsWith('/api/auth/')) onUnauthorized?.()
    throw err
  }
  return data as T
}

export const escaner = {
  claimLink: (token: string) => request<{ deviceKey: string; business: { id: string; name: string }; location: { id: string; name: string } }>('POST', '/api/auth/scanner-link/claim', { token }, false),
  publicBusiness: (businessId: string, locationId?: string | null) =>
    request<{ business: { id: string; name: string }; branch?: { multi: boolean; name: string | null } | null }>('GET', `/api/businesses/${businessId}/public${locationId ? `?s=${encodeURIComponent(locationId)}` : ''}`, undefined, false),
  login: (d: Device, pin: string) =>
    request<{ token: string; scanner: { id: string; fullName: string }; location: { id: string; name: string } }>('POST', '/api/auth/scanner-login', { businessId: d.businessId, pin, ...(d.locationId ? { locationId: d.locationId } : {}), ...(d.deviceKey ? { deviceKey: d.deviceKey } : {}) }, false),
  ownerLogin: (email: string, password: string, d: Device | null, pick: { businessId?: string; locationId?: string } = {}) =>
    request<{ token: string; scanner: { id: string; fullName: string; role: Role }; business: { id: string; name: string }; location: { id: string; name: string } }>('POST', '/api/auth/scanner-owner-login', {
      email, password,
      ...(pick.businessId || d?.businessId ? { businessId: pick.businessId || d?.businessId } : {}),
      ...(pick.locationId || d?.locationId ? { locationId: pick.locationId || d?.locationId } : {}),
      ...(d?.deviceKey ? { deviceKey: d.deviceKey } : {}),
    }, false),
  me: () => request<Me>('GET', '/api/scanner/me'),
  locations: () => request<{ current: string; locations: LocationChoice[] }>('GET', '/api/scanner/locations'),
  switchLocation: (locationId: string) => request<{ token: string; location: { id: string; name: string } }>('POST', '/api/scanner/switch-location', { locationId }),
  todayList: () => request<{ items: TodayItem[]; undoMinutes: number }>('GET', '/api/scanner/today/list'),
  search: (q: string) => request<{ results: SearchResult[] }>('GET', `/api/scanner/search?q=${encodeURIComponent(q)}`),
  customer: (id: string) => request<CustomerView>('GET', `/api/scanner/customers/${id}`),
  lookup: (qrValue: string) => request<CustomerView>('POST', '/api/scanner/lookup', { qrValue }),
  addStamp: (id: string, force = false) => request<ActionResult>('POST', `/api/scanner/customers/${id}/stamp`, force ? { force } : {}),
  deliverReward: (id: string) => request<ActionResult>('POST', `/api/scanner/customers/${id}/deliver-reward`),
  deliverBirthday: (id: string) => request<CustomerView>('POST', `/api/scanner/customers/${id}/deliver-birthday`),
  addPoints: (id: string, purchase?: number, force = false) => request<ActionResult>('POST', `/api/scanner/customers/${id}/points`, { ...(purchase != null ? { amount: purchase } : {}), ...(force ? { force } : {}) }),
  redeemPoints: (id: string, catalogItemId: string) => request<ActionResult>('POST', `/api/scanner/customers/${id}/redeem-points`, { catalogItemId }),
  addVisit: (id: string, force = false) => request<ActionResult>('POST', `/api/scanner/customers/${id}/visit`, force ? { force } : {}),
  undo: (visitId: string) => request<CustomerView>('POST', `/api/scanner/undo/${visitId}`),
}

// ─── Montos (mismo cálculo que la app y el backend) ──────────────────────────
export function formatMoney(amount: number, currency: 'ARS' | 'EUR' = 'ARS') {
  const n = Number(amount) || 0
  const num = n.toLocaleString('es-AR', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })
  return currency === 'EUR' ? `${num} €` : `$${num}`
}
export function parseAmount(text: string) {
  const t = text.trim().replace(/\s/g, '')
  if (!t) return NaN
  const n = Number(t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : /^\d{1,3}(\.\d{3})+$/.test(t) ? t.replace(/\./g, '') : t)
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN
}
export function pointsFor(amount: number, rule: { perAmount: number; unit: number }, double = false) {
  if (!Number.isFinite(amount) || amount <= 0) return 0
  return Math.floor(amount / rule.unit + 1e-9) * rule.perAmount * (double ? 2 : 1)
}

// ─── Sonido + vibración al leer un QR (la vibración no existe en iPhone) ─────
let audio: AudioContext | null = null
export function beep(ok = true) {
  try { navigator.vibrate?.(ok ? 60 : [40, 60, 40]) } catch { /* sin vibración */ }
  try {
    audio ||= new (window.AudioContext || (window as any).webkitAudioContext)()
    const o = audio.createOscillator(), g = audio.createGain()
    o.frequency.value = ok ? 1320 : 330
    g.gain.setValueAtTime(0.08, audio.currentTime)
    g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.15)
    o.connect(g).connect(audio.destination)
    o.start(); o.stop(audio.currentTime + 0.16)
  } catch { /* sin audio */ }
}
