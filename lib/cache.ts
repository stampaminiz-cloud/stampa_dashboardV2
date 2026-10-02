// Caché en memoria de respuestas GET del backend, mientras la pestaña del
// navegador está abierta. Cada tab muestra al instante lo último que se
// cargó (o lo que el dashboard ya precargó al abrir Inicio) y lo actualiza
// en silencio con una consulta nueva, así abrir una tab por primera vez no
// muestra "Cargando…". La clave es el path (incluye el businessId).
import { BASE_URL } from './api'

const store = new Map<string, unknown>()

export function readCache<T>(path: string): T | undefined {
  return store.get(path) as T | undefined
}

export function writeCache(path: string, data: unknown) {
  store.set(path, data)
}

export function clearCache() {
  store.clear()
}

// GET con la sesión actual; guarda la respuesta si salió bien.
export async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: 'Bearer ' + (typeof window !== 'undefined' ? localStorage.getItem('stampa_token') : '') },
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw Object.assign(new Error(`GET ${path} ${res.status}`), { status: res.status, data })
  store.set(path, data)
  return data as T
}

// Precarga en segundo plano, de a una para no competir con lo que el
// usuario está mirando. Los errores se ignoran: la tab vuelve a pedir.
export async function prefetch(paths: string[]) {
  for (const p of paths) {
    if (store.has(p)) continue
    try { await getJson(p) } catch { /* se reintenta al abrir la tab */ }
  }
}
