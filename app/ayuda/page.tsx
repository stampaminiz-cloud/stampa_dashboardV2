import Link from 'next/link'
import type { Metadata } from 'next'
import { ARTICLES, FAQ, GROUPS } from '@/data/ayuda'
import { AyudaSearch } from './AyudaSearch'

export const metadata: Metadata = {
  title: 'Ayuda — Stampa',
  description: 'Cómo usar Stampa en tu negocio: diseñar la tarjeta, poner el QR, escanear, mandar notificaciones y más.',
  alternates: { canonical: '/ayuda' },
}

export default function AyudaPage() {
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
