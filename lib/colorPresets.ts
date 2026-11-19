// Paleta de colores de tarjeta sugeridos. Espejo de config/colorPresets.js
// del backend: si cambia allá, cambiar acá también. Todos los planes pueden
// elegir cualquier color; la paleta son sugerencias que se leen bien.

export interface ColorPreset { label: string; start: string; end: string }

export const STARTER_PRESETS: ColorPreset[] = [
  { label: 'Verde bosque', start: '#1B412F', end: '#132F22' },
  { label: 'Azul',         start: '#185FA5', end: '#0C447C' },
  { label: 'Terracota',    start: '#993C1D', end: '#712B13' },
  { label: 'Violeta',      start: '#533FB7', end: '#3C3489' },
  { label: 'Grafito',      start: '#2C2C2A', end: '#141414' },
  { label: 'Coral',        start: '#C75D3A', end: '#9E4529' },
  { label: 'Rosa',         start: '#D4537E', end: '#993556' },
  { label: 'Esmeralda',    start: '#1D9E75', end: '#0F6E56' },
]

export const GROWTH_EXTRA_PRESETS: ColorPreset[] = [
  { label: 'Mostaza',    start: '#EF9F27', end: '#854F0B' },
  { label: 'Petróleo',   start: '#0E5E6F', end: '#093F4B' },
  { label: 'Bordó',      start: '#7A1F3D', end: '#561429' },
  { label: 'Oliva',      start: '#6B7A2E', end: '#4A5520' },
  { label: 'Azul noche', start: '#1E2A5A', end: '#131B3C' },
  { label: 'Chocolate',  start: '#5C3A21', end: '#3E2716' },
  { label: 'Lavanda',    start: '#7B6CD9', end: '#5A4DB3' },
  { label: 'Turquesa',   start: '#1AA3A3', end: '#117373' },
]

export const DEFAULT_CARD_COLOR = STARTER_PRESETS[0]

export function presetsForPlan(plan?: string | null): ColorPreset[] {
  void plan
  return [...STARTER_PRESETS, ...GROWTH_EXTRA_PRESETS]
}

export function allowsFreeColor(plan?: string | null) {
  void plan
  return true
}

// Tono ~30% más oscuro para el degradé (igual que darken() del backend).
export function darkenHex(hex: string, factor = 0.7): string {
  const c = hex.replace('#', '')
  if (c.length !== 6) return hex
  const f = (i: number) => Math.round(parseInt(c.slice(i, i + 2), 16) * factor).toString(16).padStart(2, '0')
  return `#${f(0)}${f(2)}${f(4)}`
}

// Color de tarjeta que sale del logo: el primero de los colores que más
// aparecen en el logo que se lea bien con texto blanco (ni muy claro ni
// casi blanco). Si ninguno sirve, null y queda el color que ya había.
const lumOf = (hex: string) => {
  const n = parseInt(hex.slice(1), 16)
  const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
  return 0.2126 * f(n >> 16) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255)
}
export function brandFromLogo(colors: string[]): string | null {
  for (const c of colors) {
    if (!/^#[0-9a-fA-F]{6}$/.test(c)) continue
    if (1.05 / (lumOf(c) + 0.05) >= 3) return c   // contraste con blanco
  }
  return null
}
