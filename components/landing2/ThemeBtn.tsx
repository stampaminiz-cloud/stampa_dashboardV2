'use client'
// Botón de sol y luna de la landing y de Empresas: alterna claro y oscuro y
// se acuerda (misma preferencia que el panel).
import { useEffect, useState } from 'react'
import { getTema, isDark, setTema, TEMA_EVENT } from '@/components/ThemeSync'

export function ThemeBtn() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const sync = () => setDark(isDark(getTema()))
    sync()
    window.addEventListener(TEMA_EVENT, sync)
    return () => window.removeEventListener(TEMA_EVENT, sync)
  }, [])
  return (
    <button type="button" className="l2-theme" aria-label={dark ? 'Pasar a modo claro' : 'Pasar a modo oscuro'} onClick={() => setTema(dark ? 'claro' : 'oscuro')}>
      {dark
        ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
        : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" /></svg>}
    </button>
  )
}
