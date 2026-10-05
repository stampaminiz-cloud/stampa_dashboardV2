// Sucursal elegida en el filtro de arriba del dashboard (multilocal). Se
// agrega como ?locationId= a las consultas de Inicio, Analítica, Clientes y
// Premios; null = todas. Vive en localStorage por negocio, así se recuerda
// entre visitas. Un administrador limitado a una sucursal la tiene fija
// (el backend la impone igual).
const key = () => `stampa_location_id:${typeof window !== 'undefined' ? localStorage.getItem('stampa_business_id') || '' : ''}`

export function getLocationId(): string | null {
  try { return localStorage.getItem(key()) || null } catch { return null }
}

export function setLocationId(id: string | null) {
  try { id ? localStorage.setItem(key(), id) : localStorage.removeItem(key()) } catch { /* sin storage: queda "todas" */ }
}

// Path con la sucursal elegida (si hay una).
export function withLoc(path: string): string {
  const id = getLocationId()
  if (!id) return path
  return `${path}${path.includes('?') ? '&' : '?'}locationId=${encodeURIComponent(id)}`
}

export type LocationStatus = 'active' | 'paused' | 'off'
export interface Location {
  id: string
  name: string
  address: string
  mapsUrl: string
  lat: number | null
  lng: number | null
  hasCoords: boolean
  isPrimary: boolean
  status: LocationStatus
  deviceCode: string
  signupUrl: string
}
export interface LocationsResponse { locations: Location[]; max: number | null; activeCount: number; plan: string }
