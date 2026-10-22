// Landing → datos de ejemplo. Los negocios son inventados (salvo los de
// PROOF y el caso de Surge, que son clientes reales): sirven para mostrar
// cómo se ve la tarjeta en cada rubro y en los tres modelos.
import type { IconName } from '@/components/ui/Icon'

export type Model = 'sellos' | 'puntos' | 'membresia'

export type Biz = {
  name: string
  color: string
  icon: IconName
  model: Model
  head: [string, string]          // arriba a la derecha del pase
  stamps?: number                 // sellos
  points?: string; next?: string  // puntos
  tier?: [string, string, number, string] // membresía: nivel, próximo, %, texto
  who: string
  wa: string                      // título del botón de WhatsApp del frente
  word?: string                   // "tu cafetería", para la frase de la landing
  label?: string                  // rubro, para "Probala"
}

// Los 4 primeros arrancan con Stampa en la maqueta; el resto se va sumando.
export const SHOPS: Biz[] = [
  { name: 'Café Aurora', color: '#6B2D1F', icon: 'cafe', model: 'sellos', head: ['SELLOS', '3 de 8'], stamps: 3, who: 'Lucía Gómez', wa: 'PEDIDOS', word: 'tu cafetería', label: 'Cafetería' },
  { name: 'Raíz Criolla', color: '#5C1414', icon: 'carniceria', model: 'puntos', head: ['PRÓXIMO PREMIO', '1 kg de vacío'], points: '840', next: 'Te faltan 160', who: 'Martín Ruiz', wa: 'PEDIDOS', word: 'tu carnicería', label: 'Carnicería' },
  { name: 'Studio Nina', color: '#3D3350', icon: 'peluqueria', model: 'membresia', head: ['NIVEL', 'Plata'], tier: ['Plata', 'Oro', 62, 'Te faltan 3 visitas para Oro'], who: 'Sofía Paz', wa: 'TURNOS', word: 'tu peluquería', label: 'Peluquería' },
  { name: 'La Espiga', color: '#8A5A2B', icon: 'panaderia', model: 'sellos', head: ['SELLOS', '7 de 8'], stamps: 7, who: 'Ana López', wa: 'ENCARGOS', word: 'tu panadería', label: 'Panadería' },
  { name: 'Fit Gym', color: '#1F3A5F', icon: 'gym', model: 'membresia', head: ['NIVEL', 'Oro'], tier: ['Oro', 'Black', 40, 'Una clase gratis por mes'], who: 'Juan Díaz', wa: 'CLASES', word: 'tu gimnasio', label: 'Gimnasio' },
  { name: 'Polo Sur', color: '#2F5D57', icon: 'heladeria', model: 'puntos', head: ['PRÓXIMO PREMIO', '1/4 kg gratis'], points: '320', next: 'Te faltan 80', who: 'Clara Ríos', wa: 'PEDIDOS', word: 'tu heladería', label: 'Heladería' },
]

export const JOIN: Biz[] = [
  { name: 'Pizzería Don Tano', color: '#7A3B1E', icon: 'pizzeria', model: 'sellos', head: ['SELLOS', '2 de 10'], stamps: 2, who: 'Pablo V.', wa: 'PEDIDOS' },
  { name: 'Librería del Puerto', color: '#1E4D3A', icon: 'libreria', model: 'puntos', head: ['PRÓXIMO PREMIO', 'Un libro'], points: '560', next: 'Te faltan 440', who: 'Inés T.', wa: 'ENCARGOS' },
  { name: 'Spa Agua', color: '#2E5468', icon: 'gota', model: 'membresia', head: ['NIVEL', 'Bronce'], tier: ['Bronce', 'Plata', 35, 'Te faltan 5 visitas para Plata'], who: 'Carla M.', wa: 'TURNOS' },
  { name: 'Veterinaria Patitas', color: '#4B5B2A', icon: 'veterinaria', model: 'sellos', head: ['PREMIO', 'Baño gratis'], stamps: 5, who: 'Diego F.', wa: 'TURNOS' },
  { name: 'Vinoteca Malbec', color: '#5A1B3A', icon: 'vinoteca', model: 'membresia', head: ['NIVEL', 'Socio'], tier: ['Socio', 'Reserva', 55, 'Te faltan 2 compras para Reserva'], who: 'Lara B.', wa: 'PEDIDOS' },
  { name: 'Barbería Filo', color: '#2B2B2B', icon: 'peluqueria', model: 'sellos', head: ['SELLOS', '4 de 6'], stamps: 4, who: 'Tomás G.', wa: 'TURNOS' },
  { name: 'Óptica Visión', color: '#2C4A6B', icon: 'optica', model: 'puntos', head: ['PRÓXIMO PREMIO', 'Limpieza'], points: '210', next: 'Te faltan 90', who: 'Rocío A.', wa: 'CONSULTAS' },
  { name: 'Verdulería La Huerta', color: '#3F6A2E', icon: 'verduleria', model: 'puntos', head: ['PRÓXIMO PREMIO', 'Bolsa de frutas'], points: '150', next: 'Te faltan 50', who: 'Hugo P.', wa: 'PEDIDOS' },
]

export const EVENT: Record<Model, string> = { sellos: '+1 sello', puntos: '+120 puntos', membresia: 'Subió de nivel' }

// Clientes reales (logos en public/assets).
export const PROOF = [
  { name: 'Surge Málaga', category: 'Cafetería de especialidad', logo: '/assets/logo-surge-malaga.jpg', bg: '#000000' },
  { name: 'Raíz Criolla', category: 'Carne envasada premium', logo: '/assets/logo-raiz-criolla.png', bg: '#5C1414' },
  { name: 'Living4Malaga', category: 'Alojamiento turístico', logo: '/assets/logo-living4malaga.png', bg: '#0C2A2A' },
  { name: 'Nogal', category: 'Comercio', logo: '/assets/logo-nogal.png', bg: '#EDEFE8' },
]

export const SURGE = {
  quote: 'Para los clientes tener otra app descargada puede llegar a ser molesto. Además puedo enviar notificaciones a los usuarios para informar de descuentos, horarios y actividades, sin depender de las redes sociales.',
  stats: [['150', 'clientes en dos meses'], ['70%', 'vuelve al local']] as [string, string][],
}

// La tarjeta un paso antes del escaneo: un sello menos, 120 puntos menos o
// menos barra de nivel. Para animar "escanean y se suma".
export function before(b: Biz): Biz {
  if (b.model === 'sellos') return { ...b, stamps: Math.max(0, (b.stamps ?? 3) - 1) }
  if (b.model === 'puntos') return { ...b, points: String(Math.max(0, parseInt(b.points || '200', 10) - 120)) }
  if (b.tier) return { ...b, tier: [b.tier[0], b.tier[1], Math.max(5, b.tier[2] - 22), b.tier[3]] }
  return b
}

// Ventas por WhatsApp: en comercios es el canal que más convierte.
const WHATSAPP_NUMBER = '5493512638999'
export const whatsappLink = (text: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
export const WHATSAPP_SALES = whatsappLink('Hola! Quiero saber más sobre Stampa para mi negocio.')
export const WHATSAPP_ENTERPRISE = whatsappLink('Hola! Me interesa el plan Enterprise de Stampa.')
export const INSTAGRAM = 'https://instagram.com/stampa.app'
export const SCANNER_IOS_URL = process.env.NEXT_PUBLIC_SCANNER_IOS_URL || ''
// Negocio demo para "Probala": el QR lleva al registro real y da una tarjeta.
export const DEMO_BUSINESS_ID = process.env.NEXT_PUBLIC_DEMO_BUSINESS_ID || ''
