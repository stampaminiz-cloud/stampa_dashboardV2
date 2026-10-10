'use client'

// Portada y artículo del centro de ayuda. El contenido (data/ayuda.tsx) se
// pide recién después de comprobar la sesión: así no viaja en el HTML que
// manda el servidor ni lo ve quien no tiene cuenta.
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getToken } from '@/lib/api'
import { AyudaSearch } from './AyudaSearch'

type Data = typeof import('@/data/ayuda')

function useAyudaData() {
  const [data, setData] = useState<Data | null>(null)
  useEffect(() => {
    if (!getToken()) {
      window.location.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    import('@/data/ayuda').then(setData)
  }, [])
  return data
}

export function AyudaIndex() {
  const data = useAyudaData()
  if (!data) return <main className="ay-main" />
  const { ARTICLES, FAQ, GROUPS } = data
  const start = ARTICLES.find(a => a.slug === 'primeros-pasos')!
  const list = ARTICLES.map(({ slug, title, summary, group }) => ({ slug, title, summary, group }))

  return (
    <main className="ay-main">
      <div className="ay-head">
        <h1>Ayuda</h1>
        <p>Cómo usar Stampa en tu negocio, paso a paso.</p>
        <AyudaSearch articles={list} />
      </div>

      <Link href={`/ayuda/${start.slug}`} className="ay-start">
        <span className="ay-start-k">Si recién empezás</span>
        <span className="ay-start-t">{start.title}</span>
        <span className="ay-start-s">{start.summary}</span>
      </Link>

      <div className="ay-groups">
        {GROUPS.filter(g => g !== 'Para empezar').map(group => (
          <section key={group} className="ay-group">
            <h2>{group}</h2>
            <ul>
              {ARTICLES.filter(a => a.group === group).map(a => (
                <li key={a.slug}><Link href={`/ayuda/${a.slug}`}>{a.title}</Link></li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="ay-faq">
        <h2>Preguntas rápidas</h2>
        {FAQ.map(item => (
          <div key={item.q} className="ay-faq-item">
            <h3>{item.q}</h3>
            <p>{item.a}</p>
          </div>
        ))}
      </section>
    </main>
  )
}

export function AyudaArticle({ slug }: { slug: string }) {
  const data = useAyudaData()
  if (!data) return <main className="ay-main" />
  const { ARTICLES, GROUPS } = data
  const i = ARTICLES.findIndex(x => x.slug === slug)
  if (i < 0) {
    return (
      <main className="ay-main">
        <div className="ay-head">
          <h1>No encontramos ese artículo</h1>
          <p><Link href="/ayuda">Volver a la ayuda</Link></p>
        </div>
      </main>
    )
  }
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
