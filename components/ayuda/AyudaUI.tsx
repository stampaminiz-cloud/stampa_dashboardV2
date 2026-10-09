// Piezas de los artículos del centro de ayuda (/ayuda): captura, pasos
// numerados y nota. Los estilos están en app/ayuda/ayuda.css (prefijo ay-).
import Image from 'next/image'
import type { ReactNode } from 'react'

// Capturas en public/ayuda/<src>.webp. Panel: 1280×800 a 2x. Celular: 390×844 a 3x.
export function Shot({ src, alt, caption, phone = false }: { src: string; alt: string; caption?: string; phone?: boolean }) {
  return (
    <figure className={phone ? 'ay-shot ay-shot--phone' : 'ay-shot'}>
      <Image
        src={`/ayuda/${src}.webp`}
        alt={alt}
        width={phone ? 1170 : 2560}
        height={phone ? 2532 : 1600}
        sizes={phone ? '(max-width: 700px) 45vw, 240px' : '(max-width: 900px) 100vw, 760px'}
      />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}

export function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="ay-steps">
      {/* El div agrupa texto y negritas en una sola celda de la grilla del número. */}
      {items.map((item, i) => <li key={i}><div>{item}</div></li>)}
    </ol>
  )
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="ay-note">{children}</p>
}
