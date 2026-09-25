import type { MetadataRoute } from 'next'
import { IS_PUBLIC_SITE, SITE_URL } from '@/lib/site'

// Solo el sitio real (stampaclub.com) se indexa. Staging y previews piden
// que no los indexen, para que Google no muestre staging.
export default function robots(): MetadataRoute.Robots {
  if (!IS_PUBLIC_SITE || process.env.VERCEL_ENV === 'preview') return { rules: { userAgent: '*', disallow: '/' } }
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Pantallas privadas o de un negocio puntual: no tienen sentido en Google.
      disallow: ['/dashboard', '/onboarding', '/r/', '/reset-password', '/forgot-password'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
