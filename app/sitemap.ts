import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'
import { ARTICLES } from '@/data/ayuda'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/register`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/login`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/ayuda`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    ...ARTICLES.map(a => ({ url: `${SITE_URL}/ayuda/${a.slug}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.4 })),
    { url: `${SITE_URL}/soporte`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ]
}
