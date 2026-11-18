'use client'
// Modo oscuro: pone data-theme="dark" en <html> según la preferencia guardada
// (stampa_tema: 'claro' | 'oscuro' | 'auto') o, si es 'auto', la del
// dispositivo. Solo vale en el panel, el escáner web, la pantalla del mostrador
// y la ayuda: la landing, el login y los formularios de cada negocio quedan
// claros. El mismo cálculo corre antes de pintar (THEME_SCRIPT en
// app/layout.tsx) para que no haya un destello claro al abrir.
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export type Tema = 'claro' | 'oscuro' | 'auto'
export const K_TEMA = 'stampa_tema'
export const TEMA_EVENT = 'stampa-tema'

// Rutas que tienen modo oscuro.
export const THEMED = /^\/(dashboard|ayuda|escaner|pantalla|login|register|forgot-password|reset-password|onboarding)(\/|$)|^\/$/

export function getTema(): Tema {
  try { const v = localStorage.getItem(K_TEMA); return v === 'claro' || v === 'oscuro' ? v : 'auto' } catch { return 'auto' }
}
export function setTema(t: Tema) {
  try { if (t === 'auto') localStorage.removeItem(K_TEMA); else localStorage.setItem(K_TEMA, t) } catch { /* modo privado */ }
  window.dispatchEvent(new Event(TEMA_EVENT))
}
export const isDark = (t: Tema) => t === 'oscuro' || (t === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)

export function ThemeSync() {
  const path = usePathname()
  useEffect(() => {
    const apply = () => {
      const on = THEMED.test(window.location.pathname) && isDark(getTema())
      if (on) document.documentElement.setAttribute('data-theme', 'dark'); else document.documentElement.removeAttribute('data-theme')
    }
    apply()
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', apply)
    window.addEventListener(TEMA_EVENT, apply)
    window.addEventListener('storage', apply)
    return () => { mq.removeEventListener('change', apply); window.removeEventListener(TEMA_EVENT, apply); window.removeEventListener('storage', apply) }
  }, [path])
  return null
}
