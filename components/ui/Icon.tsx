// Íconos del sistema (decidido el 19/10/2026): Tabler en línea, un solo
// grosor. Se usan por nombre, así toda la app muestra el mismo ícono para
// la misma cosa. Para agregar uno: sumarlo a ICONS con un nombre en
// castellano que diga qué representa, no cómo se dibuja.
import React from 'react'
import {
  IconHome, IconUsers, IconChartBar, IconGift, IconBell, IconClipboardList, IconPalette, IconUserCircle,
  IconMapPin, IconSettings, IconCalendar, IconClock, IconQrcode, IconRosetteDiscountCheck, IconHandStop,
  IconStar, IconHeartHandshake, IconAt, IconMessageStar, IconAbc, IconHash, IconList, IconPhone, IconCake,
  IconChevronDown, IconChevronLeft, IconChevronRight, IconPlus, IconTrash, IconPencil, IconLock, IconCheck, IconX, IconUser, IconHelpCircle, IconLogout, IconMenu2, IconBolt, IconAlertTriangle, IconInfoCircle, IconCircleCheck, IconCoins, IconCrown, IconArrowUp, IconArrowDown, IconSearch, IconDownload, IconArrowBackUp, IconHourglass, IconRepeat, IconFlame, IconMoon, IconTarget, IconUpload, IconBrandWhatsapp, IconCoffee, IconToolsKitchen2, IconScissors, IconBarbell, IconBread, IconLeaf, IconShirt, IconBook, IconMinus, IconBuildingStore, IconListCheck, IconMail, IconCreditCard, IconBrandApple, IconBrandGooglePlay, IconPhoto, IconArrowLeft, IconStarFilled, IconPencilMinus,
  type Icon as TablerIcon,
} from '@tabler/icons-react'

export const ICONS = {
  inicio: IconHome, clientes: IconUsers, analitica: IconChartBar, premios: IconGift, notificaciones: IconBell,
  formulario: IconClipboardList, diseno: IconPalette, equipo: IconUserCircle, sucursales: IconMapPin, configuracion: IconSettings,
  fecha: IconCalendar, hora: IconClock, qr: IconQrcode, sello: IconRosetteDiscountCheck,
  // Avisos automáticos
  bienvenida: IconHandStop, unSello: IconStar, teExtranamos: IconHeartHandshake, resena: IconMessageStar,
  // Tipos de pregunta del formulario
  texto: IconAbc, email: IconAt, numero: IconHash, lista: IconList, telefono: IconPhone, cumple: IconCake,
  // Acciones
  abrir: IconChevronDown, anterior: IconChevronLeft, siguiente: IconChevronRight, agregar: IconPlus,
  borrar: IconTrash, editar: IconPencil, candado: IconLock, listo: IconCheck, cerrar: IconX,
  perfil: IconUser, ayuda: IconHelpCircle, salir: IconLogout, menu: IconMenu2, idea: IconBolt,
  puntos: IconCoins, membresia: IconCrown, flechaArriba: IconArrowUp, flechaAbajo: IconArrowDown, buscar: IconSearch,
  descargar: IconDownload, nivel: IconArrowUp, vencio: IconHourglass, deshacer: IconArrowBackUp,
  apple: IconBrandApple, googlePlay: IconBrandGooglePlay,
  negocio: IconBuildingStore, reglas: IconListCheck, mail: IconMail, plan: IconCreditCard,
  menos: IconMinus,
  // Rubros
  cafe: IconCoffee, restaurante: IconToolsKitchen2, peluqueria: IconScissors, gym: IconBarbell, panaderia: IconBread,
  spa: IconLeaf, ropa: IconShirt, libreria: IconBook,
  whatsapp: IconBrandWhatsapp,
  subir: IconUpload, imagen: IconPhoto, volver: IconArrowLeft, estrella: IconStarFilled,
  objetivo: IconTarget, escribir: IconPencilMinus,
  vuelve: IconRepeat, fuerte: IconFlame, flojo: IconMoon,
  atencion: IconAlertTriangle, info: IconInfoCircle, hecho: IconCircleCheck,
} satisfies Record<string, TablerIcon>

export type IconName = keyof typeof ICONS

// Tamaños: 12 (en etiquetas chicas), 14 (botones y tablas), 16 (por defecto), 18-20 (menú y títulos).
export function Icon({ name, size = 16, className, title }: { name: IconName; size?: 12 | 14 | 16 | 18 | 20 | 24 | 28; className?: string; title?: string }) {
  const C = ICONS[name]
  return <C size={size} stroke={1.75} className={className} aria-hidden={title ? undefined : true} aria-label={title} role={title ? 'img' : undefined} />
}
