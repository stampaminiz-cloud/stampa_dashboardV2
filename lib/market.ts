// Mercado según el país de quien entra (Vercel lo manda en el header
// x-vercel-ip-country): Argentina paga en pesos con Mercado Pago; el resto
// (España, Europa y el resto del mundo) en euros + IVA con Stripe.
// Si la IP se equivoca, el país de la cuenta se cambia desde /admin.
export type Market = 'AR' | 'EU'
export type Region = 'AR' | 'ES' | 'EU'

export const marketFromCountry = (country?: string | null): Market => (!country || country.toUpperCase() === 'AR' ? 'AR' : 'EU')
export const regionFromCountry = (country?: string | null): Region => {
  const c = (country || 'AR').toUpperCase()
  return c === 'AR' ? 'AR' : c === 'ES' ? 'ES' : 'EU'
}
