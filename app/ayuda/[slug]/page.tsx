import type { Metadata } from 'next'
import { AyudaArticle } from '../AyudaViews'

export const metadata: Metadata = { title: 'Ayuda — Stampa' }

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <AyudaArticle slug={slug} />
}
