import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// Solo el sitio de producción se indexa. Cualquier otro entorno (staging,
// previews) pide que no lo indexen, para que Google no muestre staging.
export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.VERCEL_ENV === 'production' || !process.env.VERCEL_ENV
  if (!isProduction) return { rules: { userAgent: '*', disallow: '/' } }
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
