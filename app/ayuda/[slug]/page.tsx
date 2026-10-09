import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ARTICLES, GROUPS } from '@/data/ayuda'

export function generateStaticParams() {
  return ARTICLES.map(a => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const a = ARTICLES.find(x => x.slug === slug)
  if (!a) return {}
  return { title: `${a.title} — Ayuda de Stampa`, description: a.summary, alternates: { canonical: `/ayuda/${a.slug}` } }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const i = ARTICLES.findIndex(x => x.slug === slug)
  if (i < 0) notFound()
  const a = ARTICLES[i]
  const next = ARTICLES[i + 1]

  return (
    <main className="ay-main ay-main--article">
      <nav className="ay-side" aria-label="Artículos de ayuda">
        {GROUPS.map(group => (
          <div key={group}>
            <div className="ay-side-k">{group}</div>
            {ARTICLES.filter(x => x.group === group).map(x => (
              <Link key={x.slug} href={`/ayuda/${x.slug}`} aria-current={x.slug === a.slug ? 'page' : undefined}>{x.title}</Link>
            ))}
          </div>
        ))}
      </nav>

      <article className="ay-article">
        <div className="ay-crumb"><Link href="/ayuda">Ayuda</Link> · {a.group}</div>
        <h1>{a.title}</h1>
        <p className="ay-lede">{a.summary}</p>
        <div className="ay-body">{a.body}</div>
        {next && (
          <Link href={`/ayuda/${next.slug}`} className="ay-next">
            <span>Siguiente</span>
            <strong>{next.title}</strong>
          </Link>
        )}
      </article>
    </main>
  )
}
