// data/ayuda.tsx — artículos del centro de ayuda (/ayuda).
//
// Cada artículo: slug (la URL), grupo, título, resumen (lo que se ve en la
// lista y en Google) y el cuerpo. Las capturas están en public/ayuda/ y
// salen de un negocio de ejemplo ("Café Aurora"), nunca de uno real.
//
// Tono: como le explicaría alguien de Stampa a un dueño en el mostrador.
// Frases cortas, lo que hay que tocar entre comillas tal como aparece en
// la pantalla, y nada que el sistema no haga.
import Link from 'next/link'
import type { ReactNode } from 'react'
import { Shot, Steps, Note } from '@/components/ayuda/AyudaUI'

export type Article = {
  slug: string
  group: string
  title: string
  summary: string
  body: ReactNode
}

export const GROUPS = ['Para empezar', 'La tarjeta', 'En el mostrador', 'Tus clientes', 'Avisos y reglas', 'Tu cuenta'] as const

const A = ({ to, children }: { to: string; children: ReactNode }) => <Link href={`/ayuda/${to}`}>{children}</Link>

export const ARTICLES: Article[] = [
  // ── Para empezar ────────────────────────────────────────────────────────
  {
    slug: 'primeros-pasos',
    group: 'Para empezar',
    title: 'Tu primera semana con Stampa',
    summary: 'Los cinco pasos para que el primer cliente se lleve la tarjeta. Se hace en una tarde.',
    body: <>
      <p>Desde que creás la cuenta hasta que el primer cliente tiene la tarjeta en el celular hay cinco pasos. Ninguno lleva más de un rato, y el panel te los marca en Inicio a medida que los completás.</p>
      <Steps items={[
        <><strong>Diseñá la tarjeta.</strong> Subí tu logo, elegí los colores, cuántos sellos y el premio. En la vista previa ves cómo queda en un iPhone y en un Android. <A to="disenar-la-tarjeta">Cómo diseñarla</A>.</>,
        <><strong>Poné el QR en el mostrador.</strong> En Formulario descargás un cartel listo para imprimir. El cliente lo escanea con la cámara, deja su nombre y su email y guarda la tarjeta. <A to="qr-del-mostrador">Dónde ponerlo</A>.</>,
        <><strong>Sumá a tu equipo.</strong> Cada empleado tiene un PIN de 4 números para la app de escaneo. <A to="equipo">Cómo sumarlos</A>.</>,
        <><strong>Vinculá el celular del local.</strong> Instalás la app de escaneo y escaneás el código que te muestra el panel. Se hace una vez por celular. <A to="app-de-escaneo">Paso a paso</A>.</>,
        <><strong>Escaneá la primera tarjeta.</strong> Probá con la tuya: registrate en tu propio formulario y sumate un sello. Así ves lo mismo que va a ver tu cliente. <A to="escanear">Cómo escanear</A>.</>,
      ]} />
      <Shot src="inicio" alt="Pantalla de Inicio del panel con el resumen de clientes, visitas y premios" caption="Inicio, unas semanas después: clientes, visitas y lo que conviene mirar hoy." />
      <h2>Después del primer día</h2>
      <p>Lo que más trae gente de vuelta es avisarle al que le falta poco. En Notificaciones elegís "Cerca del premio" y le escribís a los que están a uno o dos sellos. <A to="notificaciones">Cómo mandar avisos</A>.</p>
      <p>Si tenés días flojos, probá un día doble: ese día cada visita suma dos sellos. Se activa en Configuración. <A to="reglas">Ver las reglas</A>.</p>
      <Note>Tenés 14 días de prueba con todo habilitado y sin cargar tarjeta de crédito. Cuando quieras, elegís un plan en Configuración.</Note>
    </>,
  },

  // ── La tarjeta ──────────────────────────────────────────────────────────
  {
    slug: 'disenar-la-tarjeta',
    group: 'La tarjeta',
    title: 'Diseñar la tarjeta',
    summary: 'Logo, colores, cantidad de sellos y la imagen que aparece cuando el cliente completa la tarjeta.',
    body: <>
      <p>Entrá a <strong>Diseño</strong> y tocá "Editar" en tu tarjeta. A la derecha ves la tarjeta como la va a ver tu cliente, con un cliente de ejemplo. Podés cambiar entre "Apple Wallet" y "Google Wallet" para ver las dos.</p>
      <Shot src="diseno" alt="Editor de diseño de la tarjeta con la vista previa del pase de iPhone" />
      <h2>Qué se puede cambiar</h2>
      <ul>
        <li><strong>Logo del negocio.</strong> Un PNG con fondo transparente queda mejor. Se muestra arriba a la izquierda de la tarjeta.</li>
        <li><strong>Íconos de los sellos.</strong> Por defecto son círculos. Podés subir tu propio ícono para el sello ganado y para el vacío, por ejemplo una taza.</li>
        <li><strong>Color de fondo y de texto.</strong> Elegís de una paleta pensada para que la tarjeta se lea bien: 8 colores en Starter y 16 en Growth. Desde Pro, cualquier color.</li>
        <li><strong>Sellos requeridos.</strong> 4, 6, 8, 10 o 12. Para un café, 8 o 10 funciona bien; para algo más caro, menos.</li>
        <li><strong>Cara del premio.</strong> Es lo que ve el cliente cuando completa la tarjeta: una imagen, un mensaje de felicitación y el texto de canje. Tocá "Ver cara del premio" para verla.</li>
        <li><strong>Descripción pública.</strong> Una línea que aparece en el formulario si tenés más de una tarjeta, para que el cliente elija.</li>
      </ul>
      <p>Cuando guardás, las tarjetas que tus clientes ya tienen se actualizan solas. No tienen que volver a descargar nada.</p>
      <h2>Más de una tarjeta</h2>
      <p>Podés tener una tarjeta de sellos y otra de puntos, o una para el café y otra para la panadería. Starter tiene 1 tarjeta activa, Growth 3 y Pro las que quieras. Las tarjetas nuevas se crean con "Nueva tarjeta" en Diseño.</p>
    </>,
  },
  {
    slug: 'premios',
    group: 'La tarjeta',
    title: 'Elegir el premio',
    summary: 'Sellos, puntos o niveles: cómo se define el premio en cada tipo de tarjeta.',
    body: <>
      <p>Hay tres tipos de tarjeta. El tipo se elige al crearla.</p>
      <h2>Sellos</h2>
      <p>Una visita, un sello. Al completar la tarjeta, el premio. En Diseño, en "¿Cómo se define el premio?", tenés dos opciones:</p>
      <ul>
        <li><strong>Yo lo defino:</strong> el mismo premio para todos, por ejemplo "Un café de especialidad".</li>
        <li><strong>Lo elige el cliente:</strong> le das opciones en el formulario ("Café", "Medialuna", "Tostado") y lo que elige pasa a ser su premio.</li>
      </ul>
      <p>La tarjeta queda completa hasta que el empleado entrega el premio y toca "Confirmar entrega" en la app. Ahí vuelve a cero.</p>
      <h2>Puntos</h2>
      <p>Cada visita suma una cantidad fija de puntos. En <strong>Premios</strong> armás un catálogo: "Café gratis, 100 puntos", "Torta entera, 250 puntos". El cliente elige qué canjear y el empleado lo marca en la app.</p>
      <h2>Niveles</h2>
      <p>Una membresía que sube con las visitas: por ejemplo Bronce, Plata y Oro, cada uno con su beneficio. En Premios definís cuántas visitas hacen falta para cada nivel.</p>
      <Shot src="premios" alt="Pestaña Premios con los premios para entregar y los últimos entregados" caption="En Premios ves cuántos están por completar y los últimos premios entregados." />
    </>,
  },
  {
    slug: 'formulario',
    group: 'La tarjeta',
    title: 'El formulario de registro',
    summary: 'Qué completa el cliente para llevarse la tarjeta y cómo agregar tus propias preguntas.',
    body: <>
      <p>El formulario es lo que ve el cliente cuando escanea tu QR. Tiene los colores y el logo de tu tarjeta. Siempre pide nombre y email; el resto lo decidís vos en <strong>Formulario</strong>.</p>
      <Shot src="formulario" alt="Pestaña Formulario con los campos y la vista previa del celular" />
      <ul>
        <li><strong>Pregunta del rubro.</strong> Según tu rubro viene una pregunta armada, por ejemplo "¿Con qué acompañás tu café?". Podés cambiar las opciones, ocultarla o hacerla obligatoria.</li>
        <li><strong>Fecha de cumpleaños.</strong> Aparece si activás el regalo de cumpleaños. Es opcional para el cliente.</li>
        <li><strong>Preguntas propias.</strong> Con "Agregar campo propio": texto, lista de opciones, fecha, teléfono o número. Growth y Pro tienen 3.</li>
      </ul>
      <p>Las respuestas te sirven para mandar avisos a una parte de tus clientes, por ejemplo solo a los que eligieron "Algo dulce". Se ordenan con las flechas y se guardan con "Guardar cambios".</p>
      <Note>Pedí lo justo. Cada pregunta de más es un cliente menos que termina el registro en la caja.</Note>
    </>,
  },
  {
    slug: 'qr-del-mostrador',
    group: 'La tarjeta',
    title: 'Poner el QR en el mostrador',
    summary: 'El cartel para imprimir, el link para Instagram y WhatsApp, y dónde conviene ponerlos.',
    body: <>
      <p>Al final de <strong>Formulario</strong>, en "Compartir", tenés el link de tu formulario y el QR.</p>
      <Shot src="compartir" alt="Sección Compartir con el link del formulario, el QR y el botón para descargar el cartel" />
      <ul>
        <li><strong>"Descargar cartel (A5)"</strong> te da un cartel listo para imprimir con tu QR. Entra en un portacartel de mesa.</li>
        <li><strong>"Solo el QR"</strong> descarga el código suelto, para sumarlo a tu menú o a tu propio diseño.</li>
        <li><strong>El link</strong> lo podés pegar en la bio de Instagram, en tu estado de WhatsApp o mandárselo a un cliente.</li>
      </ul>
      <h2>Dónde ponerlo</h2>
      <p>Al lado de la caja, a la altura de la vista, funciona mejor que en la vidriera. El momento en que el cliente está esperando el vuelto o el café es cuando más se registra. Y que el que cobra diga "¿Querés la tarjeta? Escaneá acá" hace más diferencia que cualquier cartel.</p>
      <p>Si tenés varias sucursales, cada una tiene su propio QR. Así sabés dónde se registró cada cliente.</p>
    </>,
  },

  // ── En el mostrador ─────────────────────────────────────────────────────
  {
    slug: 'app-de-escaneo',
    group: 'En el mostrador',
    title: 'Instalar y vincular la app de escaneo',
    summary: 'La app Stampa Escáner va en el celular o la tablet del local. Se vincula una vez y después cada empleado entra con su PIN.',
    body: <>
      <p>Para sumar sellos se usa la app <strong>Stampa Escáner</strong>. Va en el celular o la tablet del local; no hace falta que cada empleado la tenga en su teléfono.</p>
      <Note>La app está en camino a la App Store. Mientras tanto, escribinos y te mandamos el link para instalarla en el iPhone del local.</Note>
      <h2>Vincular el celular del local</h2>
      <Steps items={[
        <>En el panel, entrá a <strong>Equipo</strong> y tocá "Activar dispositivo". Aparece un código QR.</>,
        <>En el celular, abrí la app, tocá "Soy empleado" y apuntá la cámara a ese código.</>,
        <>Listo: el celular queda vinculado a tu negocio. Desde ahí, cada empleado entra con su PIN.</>,
      ]} />
      <div className="ay-shots">
        <Shot src="activar" alt="Ventana Activar dispositivo de escaneo con el código QR" />
      </div>
      <div className="ay-phones">
        <Shot phone src="app-inicio" alt="Pantalla de bienvenida de Stampa Escáner" caption="La primera vez, tocá &quot;Soy empleado&quot;." />
        <Shot phone src="app-pin" alt="Pantalla para entrar con el PIN" caption="Después, cada uno entra con su PIN." />
      </div>
      <p>Se hace una sola vez por celular. Sin un PIN válido nadie puede sumar sellos ni ver clientes, así que si el celular queda en el mostrador no pasa nada.</p>
      <h2>Si sos el dueño</h2>
      <p>Vos no necesitás vincular nada. Tocá "Soy dueño o administrador" y entrá con el mismo email y contraseña del panel. Sirve para escanear desde tu propio celular.</p>
      <h2>Si tenés varias sucursales</h2>
      <p>Cada sucursal tiene su código de activación. El celular queda en la sucursal cuyo código escaneaste. Para moverlo, tocá "Cambiar de sucursal" en la pantalla del PIN o en el escáner.</p>
    </>,
  },
  {
    slug: 'escanear',
    group: 'En el mostrador',
    title: 'Escanear, sumar sellos y entregar premios',
    summary: 'Lo que hace el empleado en cada visita, cómo se entrega un premio y qué hacer si se equivocó.',
    body: <>
      <p>El cliente abre su tarjeta en el Wallet del celular. El empleado apunta la cámara al QR de la tarjeta: el teléfono vibra y aparece la tarjeta del cliente con sus sellos.</p>
      <div className="ay-phones">
        <Shot phone src="app-cliente" alt="Tarjeta de un cliente al que le falta un sello" caption="Le falta 1 sello: se toca &quot;+ Sello&quot;." />
        <Shot phone src="app-completa" alt="Aviso de tarjeta completa" caption="Si con ese sello completa, la app lo avisa." />
        <Shot phone src="app-entrega" alt="Tarjeta completa con el botón Confirmar entrega" caption="Al entregar el premio, &quot;Confirmar entrega&quot;." />
      </div>
      <h2>En cada visita</h2>
      <ul>
        <li><strong>Sellos:</strong> "+ Sello".</li>
        <li><strong>Puntos:</strong> "+ Puntos". Si le alcanza para algo del catálogo, aparece marcado y se canjea tocándolo.</li>
        <li><strong>Niveles:</strong> "+ Visita". Si con esa visita sube de nivel, la app lo muestra.</li>
      </ul>
      <p>La tarjeta del cliente se actualiza en su celular en unos segundos.</p>
      <h2>Entregar el premio</h2>
      <p>Cuando la tarjeta de sellos está completa, queda así hasta que se entrega el premio. Entregalo y tocá "Confirmar entrega": la tarjeta vuelve a cero y el premio queda registrado en Premios.</p>
      <h2>Si te equivocaste</h2>
      <p>Justo después de sumar aparece "Deshacer" por unos segundos. Si ya no está, escribinos y lo corregimos.</p>
      <h2>Si el QR no se lee o el cliente no tiene el celular</h2>
      <p>Tocá "Buscar cliente por nombre o email" y elegilo de la lista. Si la cámara no anda, revisá que la app tenga permiso de cámara en los ajustes del celular.</p>
      <h2>Cumpleaños y días dobles</h2>
      <p>Si el cliente cumple años, arriba de su tarjeta aparece el regalo con el botón "Entregar". Los días dobles, cada escaneo suma el doble solo; el empleado no tiene que hacer nada distinto.</p>
    </>,
  },
  {
    slug: 'equipo',
    group: 'En el mostrador',
    title: 'Sumar a tu equipo',
    summary: 'Empleados con PIN para escanear y administradores que entran al panel.',
    body: <>
      <p>En <strong>Equipo</strong>, con "+ Sumar al equipo", hay dos tipos de persona:</p>
      <ul>
        <li><strong>Scanner:</strong> usa solo la app de escaneo, con un PIN de 4 números que le das vos. Suma sellos, puntos y visitas y entrega premios. No ve el panel.</li>
        <li><strong>Administrador:</strong> entra al panel con su email. Ve clientes, premios, notificaciones, diseño, analítica y formulario. No puede cambiar el plan, el equipo ni borrar clientes.</li>
      </ul>
      <Shot src="equipo" alt="Pestaña Equipo con el dueño, un administrador y dos scanners" />
      <p>Al lado de cada scanner ves cuántos escaneos hizo en los últimos 30 días. Si alguien deja de trabajar con vos, "Deshabilitar" le corta el acceso enseguida y su historial queda.</p>
      <p>Starter incluye 1 persona además de vos, Growth 5 y Pro las que necesites.</p>
      <Note>Si un scanner suma varios sellos seguidos al mismo cliente o hace muchos escaneos en poco tiempo, te llega un mail. Se activa en Configuración, en "Mis alertas".</Note>
    </>,
  },

  // ── Tus clientes ────────────────────────────────────────────────────────
  {
    slug: 'clientes',
    group: 'Tus clientes',
    title: 'Ver y buscar clientes',
    summary: 'La lista de clientes, los filtros, el historial de cada uno y cómo exportarla.',
    body: <>
      <p>En <strong>Clientes</strong> está todo el que se registró, con su progreso, su premio y cuándo vino por última vez.</p>
      <Shot src="clientes" alt="Lista de clientes con progreso, premio, estado y última visita" />
      <ul>
        <li><strong>Filtros:</strong> todos, activos, inactivos, para entregar y cerca del premio.</li>
        <li><strong>Inactivo</strong> es quien no vuelve hace más de 60 días. El plazo lo cambiás en Configuración.</li>
        <li>Tocando un cliente ves su historial: cada sello, canje y cambio de nivel, con fecha y quién lo hizo.</li>
        <li>En tarjetas de puntos, desde el cliente podés canjear un premio a mano con "Canjear premio".</li>
        <li><strong>"Exportar"</strong> descarga la lista con los filtros aplicados, para abrirla en Excel.</li>
      </ul>
      <p>Arriba ves cuántos clientes llevás sobre el límite de tu plan. Starter tiene 200 y Growth 500. Al llegar al 80 % te avisamos; tenés 20 lugares de margen y recién después dejan de entrar clientes nuevos. Los que ya tienen la tarjeta la siguen usando siempre.</p>
    </>,
  },
  {
    slug: 'cliente-sin-tarjeta',
    group: 'Tus clientes',
    title: 'Un cliente perdió la tarjeta o no la ve',
    summary: 'Qué decirle a un cliente que cambió de celular, borró la tarjeta o no la encuentra.',
    body: <>
      <p>La tarjeta vive en el Wallet del celular. Si el cliente la borró o cambió de teléfono, sus sellos no se pierden: están guardados en Stampa.</p>
      <h2>Para recuperarla</h2>
      <Steps items={[
        <>Que escanee de nuevo el QR del mostrador.</>,
        <>Abajo del formulario, que toque "¿Ya te registraste y perdiste tu tarjeta? Recuperala" y escriba su email.</>,
        <>Le llega un mail con su tarjeta, con los mismos sellos que tenía.</>,
      ]} />
      <p>Si intenta registrarse de nuevo con el mismo email, el formulario le avisa que ya está registrado y le ofrece mandarle la tarjeta por mail.</p>
      <Shot phone src="form-listo" alt="Pantalla del formulario con los botones para agregar la tarjeta a Apple Wallet y Google Wallet" caption="Al registrarse, el cliente elige Apple Wallet o Google Wallet." />
      <h2>Otros casos</h2>
      <ul>
        <li><strong>No le llega el mail:</strong> que revise el spam. El mail sale de hola@stampaclub.com.</li>
        <li><strong>No quiere guardar la tarjeta:</strong> al registrarse ve un código QR en pantalla. Con una captura de ese código alcanza para que lo escaneen.</li>
        <li><strong>No tiene el celular encima:</strong> el empleado lo busca por nombre o email en la app.</li>
        <li><strong>Android:</strong> funciona con Google Wallet. Si no lo tiene instalado, Google se lo ofrece al tocar "Agregar a Google Wallet".</li>
      </ul>
    </>,
  },

  // ── Avisos y reglas ─────────────────────────────────────────────────────
  {
    slug: 'notificaciones',
    group: 'Avisos y reglas',
    title: 'Mandar notificaciones',
    summary: 'Avisos que llegan a la pantalla del celular de tus clientes: a quién mandarlos, cuándo y cuántos por mes.',
    body: <>
      <p>Desde <strong>Notificaciones</strong> le mandás un mensaje a tus clientes. Les llega como un aviso en la pantalla bloqueada y queda guardado en su tarjeta.</p>
      <Shot src="notificaciones" alt="Pestaña Notificaciones con el mensaje, la audiencia y la vista previa en el iPhone" />
      <h2>A quién</h2>
      <ul>
        <li><strong>Todos los clientes:</strong> novedades, horarios, un producto nuevo.</li>
        <li><strong>Activos</strong> e <strong>Inactivos:</strong> a los inactivos, un "te extrañamos" con una excusa para volver.</li>
        <li><strong>Cerca del premio</strong> y <strong>Premio para entregar:</strong> los que más gente traen de vuelta.</li>
        <li><strong>Por respuesta:</strong> según lo que contestaron en el formulario. Desde Growth.</li>
        <li><strong>Clientes puntuales:</strong> elegís a quién, uno por uno. En Pro.</li>
      </ul>
      <p>Al lado de cada audiencia ves dos números, por ejemplo 94/138: a cuántos les llega y cuántos son. Llega solo a quienes guardaron la tarjeta en el Wallet.</p>
      <h2>Cuándo</h2>
      <p>"Enviar ahora" o "Programar" para un día y una hora. Las programadas aparecen abajo y se pueden cancelar hasta que salen. Mandalas antes de tu horario fuerte, no a la noche.</p>
      <h2>Probar antes de mandar</h2>
      <p>"Enviarme una prueba" te lo manda solo a vos y no cuenta para el límite. Para recibirla tenés que tener tu propia tarjeta, registrada con el mismo email de tu cuenta.</p>
      <h2>Cuántas por mes</h2>
      <p>Starter tiene 4 envíos por mes, Growth 20 y Pro los que quieras. Cuenta cada envío, sin importar a cuántos clientes les llega. Los avisos automáticos (cumpleaños, vencimientos) no cuentan.</p>
      <Note>En Android, Google limita cuántos avisos de una misma tarjeta muestra por día. Si mandás dos seguidos, puede que el segundo no aparezca en la pantalla, aunque queda en la tarjeta.</Note>
    </>,
  },
  {
    slug: 'reglas',
    group: 'Avisos y reglas',
    title: 'Cumpleaños, días dobles y vencimiento',
    summary: 'Reglas que funcionan solas una vez que las activás. Están en todos los planes.',
    body: <>
      <p>En <strong>Configuración</strong>, en "Reglas del programa":</p>
      <Shot src="reglas" alt="Reglas del programa: cliente inactivo, vencimiento, días dobles y cumpleaños" />
      <ul>
        <li><strong>Cumpleaños:</strong> escribís el regalo, por ejemplo "Un café con medialuna". El día del cumpleaños el cliente recibe un aviso y tiene 7 días para pasar a buscarlo. Cuando lo escanean, el empleado ve el regalo en la app. Solo aplica a quienes cargaron su fecha en el formulario.</li>
        <li><strong>Días dobles:</strong> marcás los días de la semana en que cada visita suma el doble. Sirve para mover gente a los días flojos.</li>
        <li><strong>Vencimiento por inactividad:</strong> nunca, 3, 6 o 12 meses. Si un cliente no vuelve en ese plazo, sus sellos o puntos vencen. Una semana antes le llega un aviso.</li>
        <li><strong>Cliente inactivo:</strong> después de cuántos días sin venir lo consideramos inactivo (30, 60 o 90). Solo cambia cómo se ve en Clientes y en Notificaciones.</li>
      </ul>
      <p>Los avisos que mandan estas reglas no cuentan para tus envíos del mes.</p>
    </>,
  },
  {
    slug: 'alertas',
    group: 'Avisos y reglas',
    title: 'Los mails que te mandamos',
    summary: 'El resumen de los lunes y los avisos de premios por entregar y escaneos raros.',
    body: <>
      <p>En <strong>Configuración</strong>, en "Mis alertas", elegís qué mails querés recibir. Te llegan solo a vos, nunca a tus clientes.</p>
      <ul>
        <li><strong>Resumen semanal:</strong> los lunes a la mañana. Clientes nuevos, visitas, premios entregados y lo que conviene revisar.</li>
        <li><strong>Premios para entregar:</strong> un mail por día, no uno por cliente, si hay tarjetas completas esperando su premio.</li>
        <li><strong>Escaneos raros del equipo:</strong> si un scanner suma varios sellos seguidos al mismo cliente o hace muchos escaneos en poco tiempo.</li>
      </ul>
      <p>Los mails salen de hola@stampaclub.com. Si no te llegan, buscalos en spam y marcalos como "no es spam".</p>
    </>,
  },

  // ── Tu cuenta ───────────────────────────────────────────────────────────
  {
    slug: 'sucursales',
    group: 'Tu cuenta',
    title: 'Sucursales y horarios',
    summary: 'Dirección, horarios y ubicación de cada local, y cómo funcionan varias sucursales.',
    body: <>
      <p>En <strong>Sucursales</strong> cargás la dirección y los horarios de tu local. Los horarios aparecen en el dorso de la tarjeta y en el formulario ("Abierto ahora").</p>
      <Shot src="sucursales" alt="Pestaña Sucursales con la dirección y los horarios de la semana" />
      <p>Con el link de Google Maps de tu local, el cliente ve "¡Estás cerca!" en la pantalla bloqueada de su iPhone cuando pasa cerca. Ubicación y horarios están desde Growth.</p>
      <h2>Varias sucursales</h2>
      <p>Pro incluye hasta 3 sucursales; para más, Enterprise. Cada sucursal tiene su QR de registro y su código para vincular celulares, y los escaneos quedan registrados por sucursal. La tarjeta y los sellos son los mismos en todas: el cliente suma en cualquiera.</p>
      <p>Si bajás de plan, las sucursales que sobran quedan en pausa: no escanean ni registran, pero el historial queda. Se reactivan solas si volvés a un plan que las incluya.</p>
    </>,
  },
  {
    slug: 'plan-y-pago',
    group: 'Tu cuenta',
    title: 'Plan, pago y cancelación',
    summary: 'Qué pasa al terminar la prueba, cómo se paga, cómo cambiar de plan y cómo cancelar.',
    body: <>
      <p>Todo está en <strong>Configuración</strong>, en "Plan y facturación".</p>
      <Shot src="plan" alt="Configuración: alertas, plan y facturación" />
      <h2>Al terminar la prueba</h2>
      <p>Los primeros 14 días tenés todo habilitado sin pagar. Si al terminar no elegiste un plan, la cuenta queda en pausa: podés entrar y mirar todo, pero no editar, escanear ni mandar notificaciones. Las tarjetas que tus clientes ya tienen siguen funcionando, y apenas elegís un plan se reactiva todo.</p>
      <h2>Cómo se paga</h2>
      <p>Con tarjeta, todos los meses o una vez por año. En Argentina el cobro es en pesos con Mercado Pago. En España y el resto del mundo es en euros más IVA con Stripe, y recibís factura. El pago se hace en la misma pantalla, sin salir del panel.</p>
      <h2>Cambiar de plan</h2>
      <p>"Cambiar plan" y elegís el nuevo. Se cobra el plan nuevo y la suscripción anterior se cancela sola.</p>
      <h2>Cancelar</h2>
      <p>"Cancelar suscripción". Seguís con acceso hasta la fecha que ya pagaste; después la cuenta queda en pausa, como al terminar la prueba. Tus clientes no pierden la tarjeta.</p>
      <h2>Tus datos</h2>
      <p>En "Zona de peligro" podés exportar todos tus datos o pedir la baja de la cuenta. La baja se hace efectiva a los 30 días: hasta entonces la podés cancelar. Después se borran tus negocios, tus clientes y su historial, y ya no se puede deshacer.</p>
    </>,
  },
]

export const FAQ: { q: string; a: ReactNode }[] = [
  { q: '¿Mis clientes tienen que bajar una app?', a: 'No. La tarjeta se guarda en Apple Wallet o Google Wallet, que ya vienen en el celular.' },
  { q: '¿Funciona con Android?', a: 'Sí, con Google Wallet. La tarjeta, los sellos y los avisos funcionan igual que en iPhone.' },
  { q: '¿Cuánto tarda en actualizarse la tarjeta del cliente?', a: 'Unos segundos después del escaneo.' },
  { q: '¿La app de escaneo funciona sin internet?', a: 'No. El celular del local necesita conexión, por wifi o datos, para sumar sellos.' },
  { q: '¿Puedo cambiar el diseño después?', a: <>Sí, cuando quieras. Las tarjetas que ya están en los celulares se actualizan solas. <A to="disenar-la-tarjeta">Diseñar la tarjeta</A>.</> },
]
