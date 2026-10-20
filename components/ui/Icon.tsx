// Íconos del sistema (decidido el 19/10/2026): Tabler en línea, un solo
// grosor. Se usan por nombre, así toda la app muestra el mismo ícono para
// la misma cosa. Para agregar uno: sumarlo a ICONS con un nombre en
// castellano que diga qué representa, no cómo se dibuja.
import React from 'react'
import {
  IconHome, IconUsers, IconChartBar, IconGift, IconBell, IconClipboardList, IconPalette, IconUserCircle,
  IconMapPin, IconSettings, IconCalendar, IconClock, IconQrcode, IconRosetteDiscountCheck, IconHandStop,
  IconStar, IconHeartHandshake, IconAt, IconMessageStar, IconAbc, IconHash, IconList, IconPhone, IconCake,
  IconChevronDown, IconChevronLeft, IconChevronRight, IconPlus, IconTrash, IconPencil, IconLock, IconCheck, IconX, IconUser, IconHelpCircle, IconLogout, IconMenu2, IconBolt, IconAlertTriangle, IconInfoCircle, IconCircleCheck,
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
  atencion: IconAlertTriangle, info: IconInfoCircle, hecho: IconCircleCheck,
} satisfies Record<string, TablerIcon>

export type IconName = keyof typeof ICONS

// Tamaños: 14 (en botones y tablas), 16 (por defecto) y 20 (menú y títulos).
export function Icon({ name, size = 16, className, title }: { name: IconName; size?: 14 | 16 | 18 | 20 | 24; className?: string; title?: string }) {
  const C = ICONS[name]
  return <C size={size} stroke={1.75} className={className} aria-hidden={title ? undefined : true} aria-label={title} role={title ? 'img' : undefined} />
}
