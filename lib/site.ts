// URL pública del sitio: la usan las etiquetas de compartir, el sitemap y
// el canonical. Orden: NEXT_PUBLIC_SITE_URL si está; si no, el dominio de
// producción del proyecto de Vercel (VERCEL_PROJECT_PRODUCTION_URL — en el
// proyecto de staging es la URL de staging, no la del sitio real); si no,
// el dominio real.
const PRODUCTION_DOMAIN = 'www.stampaclub.com'

const vercelDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (vercelDomain ? `https://${vercelDomain}` : `https://${PRODUCTION_DOMAIN}`)

// Solo el sitio real se indexa. OJO: no alcanza con VERCEL_ENV ===
// 'production' — staging es otro proyecto de Vercel, y ahí el deploy de la
// rama staging también cuenta como "production".
export const IS_PUBLIC_SITE = new URL(SITE_URL).hostname.endsWith('stampaclub.com')
