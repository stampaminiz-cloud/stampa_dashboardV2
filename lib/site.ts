// URL pública del sitio: la usan las etiquetas de compartir, el sitemap y
// el canonical. En Vercel, NEXT_PUBLIC_SITE_URL por entorno (staging
// apunta a su propia URL para no presentarse como el sitio real).
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.stampaclub.com'
