// Interruptor del sistema (styles/sistema.css). Reemplaza los checkbox y los
// interruptores hechos en cada pestaña.
import React from 'react'

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} className="s-switch" onClick={() => onChange(!checked)} />
}
