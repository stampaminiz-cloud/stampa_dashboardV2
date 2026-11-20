'use client'

// Ejemplos (los "Ej: …" de los campos) que siguen el rubro del negocio: un
// gimnasio no ve "Café gratis". Un solo lugar para todos los textos.
import { createContext, useContext } from 'react'

export interface Ejemplos {
  /** Premio de una tarjeta de sellos. */
  premio: string
  /** Nombre de la tarjeta del local (pase de socio). */
  tarjetaLocal: string
  /** Beneficio permanente de la tarjeta del local. */
  beneficioPermanente: string
  /** Beneficio que se entrega una vez por mes. */
  beneficioMensual: string
  /** Descuento para un nivel de membresía. */
  descuento: string
  /** Mensaje de una notificación. */
  mensaje: string
}

const BASE: Record<string, Ejemplos> = {
  cafe: { premio: 'Café gratis', tarjetaLocal: 'Club del café', beneficioPermanente: '10% en todo', beneficioMensual: 'Café del mes', descuento: '10% de descuento', mensaje: '¡Hoy 2x1 en café de 16 a 18!' },
  restaurant: { premio: 'Postre gratis', tarjetaLocal: 'Mesa de socios', beneficioPermanente: '10% en la cuenta', beneficioMensual: 'Postre del mes', descuento: '10% de descuento', mensaje: '¡Este jueves, postre gratis con tu plato principal!' },
  hair: { premio: 'Corte gratis', tarjetaLocal: 'Socios de la peluquería', beneficioPermanente: '15% en servicios', beneficioMensual: 'Lavado y peinado del mes', descuento: '15% de descuento', mensaje: '¡Esta semana, tratamiento capilar con 20% off!' },
  gym: { premio: 'Clase gratis', tarjetaLocal: 'Socios del gym', beneficioPermanente: '10% en clases', beneficioMensual: 'Día de invitado', descuento: '10% de descuento', mensaje: '¡Mañana clase abierta de funcional a las 19!' },
  bakery: { premio: 'Factura gratis', tarjetaLocal: 'Club de la panadería', beneficioPermanente: '10% en todo', beneficioMensual: 'Porción de torta del mes', descuento: '10% de descuento', mensaje: '¡Hoy, 6 facturas al precio de 5!' },
  spa: { premio: 'Masaje de 30 min', tarjetaLocal: 'Socios del spa', beneficioPermanente: '15% en tratamientos', beneficioMensual: 'Limpieza facial del mes', descuento: '15% de descuento', mensaje: '¡Esta semana, masaje descontracturante con 20% off!' },
  clothing: { premio: '10% de descuento', tarjetaLocal: 'Club de la tienda', beneficioPermanente: '15% en toda la tienda', beneficioMensual: 'Accesorio del mes', descuento: '10% de descuento', mensaje: '¡Llegó la nueva colección! Pasá a verla.' },
  bookstore: { premio: 'Libro de regalo', tarjetaLocal: 'Club de lectores', beneficioPermanente: '10% en libros', beneficioMensual: 'Señalador del mes', descuento: '10% de descuento', mensaje: '¡Este sábado, 2x1 en libros de bolsillo!' },
  carniceria: { premio: 'Chorizos de regalo', tarjetaLocal: 'Club de la carnicería', beneficioPermanente: '10% en cortes', beneficioMensual: 'Chorizos del mes', descuento: '10% de descuento', mensaje: '¡Este finde, asado especial con 15% off!' },
  other: { premio: '10% de descuento', tarjetaLocal: 'Tarjeta del local', beneficioPermanente: '10% en todo', beneficioMensual: 'Regalo del mes', descuento: '10% de descuento', mensaje: '¡Esta semana, sorpresa para nuestros clientes!' },
}

export function ejemplosDe(sector?: string | null): Ejemplos {
  return BASE[sector || ''] || BASE.other
}

const Ctx = createContext<string | null>(null)

/** Lo pone el dashboard con el rubro del negocio. */
export const RubroProvider = Ctx.Provider

/** Ejemplos del rubro del negocio actual. */
export function useEjemplos(): Ejemplos {
  return ejemplosDe(useContext(Ctx))
}
