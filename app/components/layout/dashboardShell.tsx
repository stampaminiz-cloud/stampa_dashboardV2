// components/layout/DashboardShell.tsx
'use client'
import { useState } from 'react'
import Sidebar from './sidebar'
import Header from './header'

interface DashboardShellProps {
  title: string
  children: React.ReactNode
}

export default function DashboardShell({ title, children }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="stampa-bg dash-wrap">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header title={title} />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}