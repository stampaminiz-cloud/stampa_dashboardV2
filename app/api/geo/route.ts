// País de quien hace el pedido, según la IP (header de Vercel). Lo usa el
// registro para saber si la cuenta paga en pesos (Mercado Pago) o en euros
// (Stripe). En local no hay header: queda Argentina.
import { NextResponse, type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export function GET(req: NextRequest) {
  const country = req.headers.get('x-vercel-ip-country') || null
  return NextResponse.json({ country }, { headers: { 'Cache-Control': 'private, no-store' } })
}
