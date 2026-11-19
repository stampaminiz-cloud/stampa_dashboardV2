// Logo de Stampa: solo el nombre, en la letra de la marca (Red Hat Display
// 800), sin mascota. Crema sobre el verde, verde sobre fondos claros.
export function BrandLogo({ height = 36, tone = 'coral' }: { height?: number; tone?: 'coral' | 'cream' | 'pino' }) {
  const color = tone === 'cream' ? '#F7F0E4' : tone === 'pino' ? 'var(--s-pino-texto)' : '#C75D3A'
  return (
    <span aria-label="Stampa" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: Math.round(height * 0.74), letterSpacing: '-0.01em', lineHeight: 1, color, whiteSpace: 'nowrap', display: 'inline-block' }}>
      STAMPA
    </span>
  )
}
