// lib/pantalla.ts
//
// Pantalla Stampa (/pantalla): una tablet o un celular fijo en el mostrador que
// lee el QR del pase del cliente y suma sin empleado. Habla con /api/screen del
// backend. No hay sesión ni PIN: la pantalla guarda la clave que recibió al
// vincularse con el link del dueño y la manda en cada pedido (X-Screen-Key). Si
// el dueño la quita desde Configuración, el backend contesta 401 y la pantalla
// vuelve a pedir un link nuevo.

import { BASE_URL } from './api'

const K_SCREEN = 'stampa_pantalla'

export interface ScreenLink { key: string; businessName: string }

function read(): ScreenLink | null {
  try { const v = localStorage.getItem(K_SCREEN); return v ? JSON.parse(v) as ScreenLink : null } catch { return null }
}
export const getScreen = read
export const setScreen = (s: ScreenLink | null) => {
  try { if (s) localStorage.setItem(K_SCREEN, JSON.stringify(s)); else localStorage.removeItem(K_SCREEN) } catch { /* modo privado */ }
}

export type ScreenState = 'ok' | 'prize' | 'tier_up' | 'limit' | 'needs_staff'
export interface TierLook { name: string; perk: string | null; color: string | null; bg: string | null; icon: string | null }
export interface CatalogRow { name: string; pointsCost: number; affordable: boolean; unlocked: boolean }
export interface ScanResult {
  state: ScreenState
  repeat: boolean
  message: string | null
  name: string
  card: { id: string; type: 'stamp' | 'points' | 'membership'; name: string; color: string; secondColor: string; textColor: string; flipMessage: string | null }
  limit?: { rule: 'day' | 'hours'; nextAt: string | null }
  stamp?: { stamps: number; required: number; remaining: number; completed: boolean; reward: string | null }
  points?: { added: number | null; balance: number; catalog: CatalogRow[]; unlocked: string[] }
  membership?: { totalVisits: number; tier: TierLook | null; nextTier: { name: string } | null; visitsToNext: number | null; progress: number | null; tierUp: TierLook | null }
}
// Marca de una tarjeta: colores y textos viajan siempre; las imágenes (base64,
// pesadas) solo con /brand.
export interface BrandCard {
  id: string; type: 'stamp' | 'points' | 'membership'
  color: string; secondColor: string; textColor: string; flipMessage: string | null
  logoUrl: string | null; earnedIcon: string | null; emptyIcon: string | null; pointsIcon: string | null; flipImageUrl: string | null
}
export interface ScreenStatus { business: { name: string }; location: { name: string }; screen: { name: string }; active: boolean; reason: 'paused' | 'plan' | 'disabled' | null; message: string | null }

export class ScreenError extends Error {
  constructor(public status: number, public code: string | null, message: string) { super(message) }
}

async function call<T>(method: string, path: string, key: string | null, body?: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(key ? { 'X-Screen-Key': key } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ScreenError(0, 'offline', 'Sin conexión.')
  }
  const text = await res.text()
  let data: any = null
  try { data = text ? JSON.parse(text) : null } catch { /* respuesta rara */ }
  if (!res.ok) {
    const code = typeof data?.error === 'string' && /^[a-z_]+$/.test(data.error) ? data.error : null
    throw new ScreenError(res.status, code, data?.message || (code ? '' : data?.error) || 'Algo falló. Probá de nuevo.')
  }
  return data as T
}

export const pantalla = {
  claim: (token: string) => call<{ deviceKey: string; kind: string; business: { id: string; name: string } }>('POST', '/api/auth/scanner-link/claim', null, { token, kind: 'screen' }),
  status: (key: string) => call<ScreenStatus>('GET', '/api/screen/status', key),
  brand: (key: string) => call<{ cards: BrandCard[] }>('GET', '/api/screen/brand', key),
  scan: (key: string, qrValue: string) => call<ScanResult>('POST', '/api/screen/scan', key, { qrValue }),
}
