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

// Color de tarjeta que sale del logo: el color con más presencia del logo
// que tenga color de verdad (no blanco, gris ni negro). Si es muy claro para
// el texto blanco, se usa un tono más oscuro del mismo color. Si el logo no
// tiene color (blanco y negro), null: el dueño elige.
const rgbOf = (hex: string) => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255] }
const lumOf = (hex: string) => {
  const [r, g, b] = rgbOf(hex).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const okWithWhite = (hex: string) => 1.05 / (lumOf(hex) + 0.05) >= 3
const hasColor = (hex: string) => {
  const [r, g, b] = rgbOf(hex).map(v => v / 255)
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  const sat = max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1))
  return sat >= 0.25 && l > 0.08 && l < 0.95
}
const toHex = (v: number[]) => '#' + v.map(x => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('')
export function logoBrand(colors: string[]): { color: string; darkened: boolean } | null {
  const c = colors.find(x => /^#[0-9a-fA-F]{6}$/.test(x) && hasColor(x))
  if (!c) return null
  if (okWithWhite(c)) return { color: c, darkened: false }
  const rgb = rgbOf(c)
  for (let k = 0.96; k > 0.2; k -= 0.04) {
    const t = toHex(rgb.map(v => v * k))
    if (okWithWhite(t)) return { color: t, darkened: true }
  }
  return null
}
