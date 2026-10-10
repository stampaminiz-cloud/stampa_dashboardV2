import type { Metadata } from 'next'
import { AyudaIndex } from './AyudaViews'

export const metadata: Metadata = { title: 'Ayuda — Stampa' }

export default function AyudaPage() {
  return <AyudaIndex />
}
