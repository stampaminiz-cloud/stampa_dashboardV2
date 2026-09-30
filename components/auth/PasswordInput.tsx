'use client'
// Campo de contraseña con botón "Mostrar / Ocultar". Con esto el registro
// no necesita "Repetir contraseña": la persona ve lo que escribió.
import { useState } from 'react'

export function PasswordInput({ className, value, onChange, placeholder, autoComplete, id }: {
  className: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoComplete: 'current-password' | 'new-password'
  id?: string
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <input
        id={id}
        className={className}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        style={{ paddingRight: 76 }}
      />
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        style={{
          position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px',
          fontSize: 12, fontWeight: 600, color: 'rgba(43,38,32,.55)', fontFamily: 'inherit',
        }}
      >
        {visible ? 'Ocultar' : 'Mostrar'}
      </button>
    </div>
  )
}
