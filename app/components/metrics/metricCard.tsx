// components/metrics/MetricCard.tsx
import { ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: number
  delta: number
  icon: ReactNode
  color: string
  delay?: number
}

export default function MetricCard({ label, value, delta, icon, color, delay = 1 }: MetricCardProps) {
  const isUp = delta >= 0
  return (
    <div className={`glass-card fade-up fade-up-${delay}`} style={{ cursor: 'default' }}>
      <div className="metric-card-top">
        <div className="metric-icon" style={{ background: `${color}18` }}>
          <span style={{ color }}>{icon}</span>
        </div>
        <div className={`delta-badge ${isUp ? 'up' : 'down'}`}>
          <span>{isUp ? '↑' : '↓'}</span>
          {Math.abs(delta)}%
        </div>
      </div>
      <div className="metric-value">{value.toLocaleString('es-AR')}</div>
      <div className="metric-label">{label}</div>
    </div>
  )
}