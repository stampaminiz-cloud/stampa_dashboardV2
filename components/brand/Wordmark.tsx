// STAMPA como texto, en la letra de la marca (Red Hat Display 800). Reemplaza la
// imagen wordmark.png, que traía la M deformada. El tamaño lo pone cada
// lugar con `font-size` (antes era el alto de la imagen, por 0,74); el color
// sigue al tema (`--wm-color`, o el naranja del sistema).
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span
      className={`wm ${className}`.trim()}
      aria-label="Stampa"
      style={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1, color: 'var(--wm-color, var(--s-brasa, #C75D3A))', whiteSpace: 'nowrap', display: 'block' }}
    >
      STAMPA
    </span>
  )
}
