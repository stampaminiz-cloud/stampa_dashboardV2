'use client'

import Link from 'next/link'
import { useState } from 'react'

type Item = { slug: string; title: string; summary: string; group: string }

// Sin acentos ni mayúsculas, para que "cumpleanos" encuentre "cumpleaños".
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export function AyudaSearch({ articles }: { articles: Item[] }) {
  const [q, setQ] = useState('')
  const words = norm(q).split(/\s+/).filter(Boolean)
  const results = words.length
    ? articles.filter(a => { const t = norm(`${a.title} ${a.summary} ${a.group}`); return words.every(w => t.includes(w)) })
    : []

  return (
    <div className="ay-search">
      <input
        id="ayuda-buscar"
        type="search"
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Buscar: QR, premio, PIN, cumpleaños…"
        aria-label="Buscar en la ayuda"
        autoComplete="off"
      />
      {words.length > 0 && (
        <div className="ay-results">
          {results.length === 0
            ? <p className="ay-results-empty">No encontramos nada con eso. Probá con otra palabra o escribinos.</p>
            : results.map(a => (
              <Link key={a.slug} href={`/ayuda/${a.slug}`}>
                <strong>{a.title}</strong>
                <span>{a.summary}</span>
              </Link>
            ))}
        </div>
      )}
    </div>
  )
}
