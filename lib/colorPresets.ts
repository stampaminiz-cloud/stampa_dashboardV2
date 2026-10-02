// Paleta de colores de tarjeta por plan. Espejo EXACTO de
// config/colorPresets.js del backend (que es el que la hace cumplir):
// si cambia allá, cambiar acá también.
//
//   Starter:          8 colores (STARTER_PRESETS)
//   Growth:           16 (STARTER + GROWTH_EXTRA)
//   Pro / Enterprise: cualquier color (selector libre)

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
  return ['Growth', 'Pro', 'Enterprise'].includes(plan || '') ? [...STARTER_PRESETS, ...GROWTH_EXTRA_PRESETS] : STARTER_PRESETS
}

export function allowsFreeColor(plan?: string | null) {
  return ['Pro', 'Enterprise'].includes(plan || '')
}

// Tono ~30% más oscuro para el degradé (igual que darken() del backend).
export function darkenHex(hex: string, factor = 0.7): string {
  const c = hex.replace('#', '')
  if (c.length !== 6) return hex
  const f = (i: number) => Math.round(parseInt(c.slice(i, i + 2), 16) * factor).toString(16).padStart(2, '0')
  return `#${f(0)}${f(2)}${f(4)}`
}
