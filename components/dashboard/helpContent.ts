// Ayuda de cada pantalla del panel: un solo botón "Ayuda" en la barra de arriba
// abre estas preguntas. Criterio: lo que hace falta para usar la pantalla sin
// equivocarse (una pérdida, algo que no se puede deshacer, una regla que
// cambia lo que ven los clientes) se queda escrito en la pantalla, en una
// línea. Acá va el resto: el cómo y el por qué.
import type { HelpItem } from './HelpDrawer'

export interface TabHelp { title: string; items: HelpItem[] }

export const HELP: Record<string, TabHelp> = {
  users: { title: 'Ayuda de Equipo', items: [
    { q: '¿Cómo activo el celular del local?', a: 'En "Celulares del local", tocá "Mandar link por WhatsApp" y abrilo en ese celular. Se hace una sola vez por celular; después cada empleado entra con su PIN.' },
    { q: '¿Cómo entra cada persona?', a: 'El empleado, con un PIN de 4 números en el celular del local. El encargado y el dueño, con su email y contraseña. Cada persona entra con lo suyo y se sabe quién hizo qué.' },
    { q: '¿Y si alguien olvidó su PIN?', a: 'Elegí a la persona en la lista y tocá "Nuevo PIN". El anterior deja de servir y el nuevo se muestra una sola vez.' },
    { q: '¿Cuánto dura el link de un celular?', a: 'Sirve para un solo celular y vence en 24 horas. Para otro celular, generá uno nuevo.' },
    { q: '¿Qué sucursales ve cada encargado?', a: 'Con una sola, Inicio, Analítica, Clientes y Premios le muestran solo esa sucursal. Con "Todas", ve todo.' },
    { q: '¿Qué son los avisos "Para revisar"?', a: 'No bloquean nada. Son patrones que conviene mirar, como varios sellos seguidos al mismo cliente o muchos escaneos en poco tiempo.' },
  ] },

  orders: { title: 'Ayuda de Pedidos', items: [
    { q: '¿Cómo cargo el precio de un producto?', a: 'El precio es por la unidad que elegiste: por kilo, el precio del kilo; por 100 gramos, el de 100 g.' },
    { q: '¿Cómo agrego o pauso un producto?', a: 'Con Enter agregás otro producto. Si pausás uno, tu cliente lo ve con "Sin stock" y no lo puede pedir.' },
    { q: '¿Para qué sirven las zonas?', a: 'Si cargás zonas, tu cliente elige la suya al pedir y podés ver los pedidos agrupados por zona. Sin zonas, solo deja la dirección.' },
    { q: '¿Stampa cobra los pedidos?', a: 'No cobra ni se queda con una comisión. El cliente avisa cómo va a pagar y vos le confirmás.' },
  ] },

  rewards: { title: 'Ayuda de Premios', items: [
    { q: '¿Cómo se gana el premio?', a: 'Definís cuántos sellos hacen falta y qué recibe el cliente al completar la tarjeta.' },
    { q: '¿Cuántos niveles puedo tener?', a: 'Entre 2 y 6. Cada cliente sube de nivel al llegar a las visitas indicadas.' },
    { q: '¿Qué pasa si cambio las visitas de un nivel?', a: 'Si las bajás, los clientes que ya las cumplen suben al guardar. Si las subís, nadie pierde el nivel que ya ganó.' },
  ] },

  design: { title: 'Ayuda de Diseño', items: [
    { q: '¿Puedo cambiar el tipo de tarjeta?', a: 'No se cambia después de crear la tarjeta. Si necesitás otro programa, creá una tarjeta nueva.' },
    { q: '¿Para qué sirve la descripción?', a: 'Se muestra a tus clientes si tenés 2 o más tarjetas activas, para que sepan a cuál sumarse. Si la dejás vacía, usamos un texto automático.' },
    { q: '¿Dónde se usan el color y el logo?', a: 'El formulario de registro usa el color y el logo de esta tarjeta.' },
    { q: '¿Qué es el color de texto?', a: 'El color del nombre, los números y los datos de la tarjeta, tal como se ve en la Wallet.' },
    { q: '¿Y el color de las etiquetas?', a: 'Son los títulos chicos (TITULAR, PREMIO…). En Automático usan el color de texto.' },
  ] },

  locations: { title: 'Ayuda de Sucursales', items: [
    { q: '¿Cómo consigo el enlace de Google Maps?', a: 'Abrí el local en Google Maps, tocá "Compartir" y copiá el enlace.' },
    { q: '¿Qué es el aviso de cercanía?', a: 'El iPhone del cliente muestra la tarjeta en la pantalla bloqueada cuando pasa cerca del local. Nosotros nunca sabemos dónde está el cliente.' },
    { q: '¿Dónde se ven los horarios?', a: 'Aparecen en el dorso del pase y en el formulario de registro. Se usa la zona horaria del negocio (Configuración).' },
  ] },

  customers: { title: 'Ayuda de Clientes', items: [
    { q: '¿Qué es la sucursal de un cliente?', a: 'Donde más viene. Si todavía no vino, donde se registró.' },
  ] },

  settings: { title: 'Ayuda de Configuración', items: [
    { q: '¿Quién suma los sellos?', a: 'Un empleado escanea el pase, o el cliente lo apoya en la pantalla del mostrador (Growth). Con cada cobro y la cajita llegan pronto.' },
    { q: '¿Cómo se entrega el premio?', a: 'Al escanear, el empleado ve "Tiene un premio" y lo entrega. "Sin personas", para locales sin empleados, llega próximamente, desde Pro.' },
    { q: '¿Cómo funciona el vencimiento por inactividad?', a: 'Si un cliente no vuelve en ese tiempo, pierde los sellos o puntos acumulados; en membresía baja un nivel por cada período sin venir. Cada visita vuelve a empezar el plazo. Le avisamos por push 7 días antes. Un premio listo para entregar no vence.' },
    { q: '¿Qué define el tipo de cada botón de WhatsApp?', a: 'El tipo define el mensaje que llega escrito y el título en la tarjeta. "Con pedido" abre primero la página de pedido (se arma en la pestaña Pedidos).' },
    { q: '¿Qué es el título en el frente de la tarjeta?', a: 'Va en la fila de abajo, al lado de las visitas. Si lo dejás vacío, sale del primer botón.' },
  ] },
}
