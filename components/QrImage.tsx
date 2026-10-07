'use client'

// Código QR generado en el navegador (librería qrcode), sin servicios
// externos: antes se pedía a api.qrserver.com, que además recibía el código
// de cada cliente. Mientras se genera, ocupa su lugar en blanco.
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export function QrImage({ value, size, dark = '#2B2620', light = '#FFFFFF', margin = 1, alt, className, style }: {
  value: string; size: number; dark?: string; light?: string; margin?: number; alt: string; className?: string; style?: React.CSSProperties
}) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    let alive = true
    QRCode.toDataURL(value, { width: size * 2, margin, errorCorrectionLevel: 'M', color: { dark, light } })
      .then(url => { if (alive) setSrc(url) })
      .catch(() => { if (alive) setSrc('') })
    return () => { alive = false }
  }, [value, size, dark, light, margin])
  if (!src) return <div className={className} style={{ width: size, height: size, background: light, ...style }} aria-label={alt} role="img" />
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} width={size} height={size} className={className} style={style} />
}
