// Logo de Stampa: mascota + "STAMPA", pegados y a la misma altura.
// Imágenes recortadas (sin margen) y en los colores de marca actuales:
// coral #C75D3A sobre fondos claros, crema #F7F0E4 sobre el verde.
// Antes cada pantalla usaba el PNG de 1080×1080 con márgenes enormes y los
// compensaba con márgenes negativos — por eso se veían lejos o chicos.

export function BrandLogo({ height = 36, tone = 'coral' }: { height?: number; tone?: 'coral' | 'cream' }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: Math.round(height * 0.22) }} aria-label="Stampa">
      {/* 458×432 y 754×156: proporciones de las imágenes recortadas */}
      <img src={`/stampa-mascot-${tone}.png`} alt="" width={Math.round(height * 1.06)} height={height} style={{ display: 'block' }} />
      <img src={`/stampa-wordmark-${tone}.png`} alt="Stampa" width={Math.round(height * 0.62 * 4.83)} height={Math.round(height * 0.62)} style={{ display: 'block' }} />
    </span>
  )
}
