# Cambios del panel y la landing

Formato: la versión más nueva arriba. El panel y el backend llevan el mismo número; cómo se numera está en `docs/versiones.md` del backend.

## 1.6.0 (22/10/2026) — Pedidos, landing nueva y Empresas

**Landing nueva** (components/landing2)
- Una sola hoja con marco, menú en píldora y el mismo sistema en todas las secciones: títulos en dos tonos, etiqueta chica en brasa y tarjetas como las del Wallet de hoy, en los tres modelos (sellos, puntos y membresía).
- Inicio: maqueta blanca de un barrio que se va llenando de negocios con Stampa. Cada uno que se suma se pinta, cae su pin y aparece un chip; arriba, los negocios del barrio y las visitas del día.
- Cómo funciona con un celular que guarda la tarjeta y la escanean; "Lo que pasa después" con la analítica al frente, avisos, la app de escaneo, WhatsApp y locales.
- "Lo que hace tu tarjeta sola": pestañas de avisos automáticos (cumpleaños desde Growth; bienvenida, te extrañamos y reseñas en Pro), cercanía (desde Growth, iPhone) y pedidos (Pro).
- Vidriera de negocios con el caso de Surge; Probala con rubro y modelo y el QR del negocio demo; precios reales por país con selector Argentina / España; preguntas nuevas sobre WhatsApp y pedidos; pie de página completo.
- Se borró la landing anterior (StampaLanding y components/landing).

**Empresas** (/empresas)
- Página para marcas con 4 locales o más: maqueta con los locales de una marca y lo que pasa en vivo, Pro contra Enterprise, los tres modelos, el panel por local, lo que necesita una empresa y cómo arrancamos.
- El pedido de demo se manda por WhatsApp con los datos ya escritos.


**Nuevo**
- Pestaña Pedidos (Pro):
  - productos con precio, por kilo (de a medio kilo) o por unidad, con pausa "sin stock" y hasta 30;
  - días de reparto, anticipación, pedido mínimo y formas de pago, con la página en vivo al lado;
  - pedidos recibidos, que se marcan como entregados.
- Página de pedido (`/p/[customerId]`): una sola página con la barra del total fija abajo. El botón dice qué falta. La dirección queda guardada; tiene aclaraciones y forma de pago. El pedido llega escrito al WhatsApp del negocio.
- Configuración → WhatsApp: cada botón puede ser "Directo a WhatsApp" o "Con pedido" (Pro).
- Inicio: "Pedidos esta semana" y "Pedidos para entregar hoy".
- Clientes: los pedidos y la dirección en la ficha; filtro "Pidieron por la tarjeta".
- Analítica: sección Pedidos (del botón al pedido, lo más pedido, días más elegidos, ticket promedio, clientes que repiten).
- Admin: plan especial de Mercado Pago por negocio (ej. Pro al precio de Growth).

**Mejoras de Pedidos**
- "Cómo se vende": por unidad, por kilo (de a ½ kg) o por 100 gramos. Con Enter se agrega otro producto.
- Zonas de reparto en Entregas; en Pedidos recibidos se ve la zona y se filtra por zona.
- Página de pedido: varios días en el mismo pedido, elegir la zona, "Sin stock" en lo pausado y el total por entrega y en total.
- Formas de pago según el país del negocio (en España, Bizum).
- Carga con Stampy en Pedidos, en la página de pedido y en WhatsApp de Configuración, que ahora se precarga con el panel.
- El selector de vistas de Pedidos es como el de Analítica, y todos los desplegables tienen la flecha con su margen.
- Vista previa de WhatsApp: los links del dorso dicen "Tocá para…" y el saludo lleva el nombre del negocio.

## 1.5.0 (21/10/2026) — WhatsApp en la tarjeta

**Nuevo**
- Configuración → WhatsApp en la tarjeta: número, hasta 2 botones sugeridos según el rubro (con el texto editable) y la línea del frente con vista previa. Todos los planes.
- Analítica → Clientes: Toques en WhatsApp, por botón.
- Inicio → Primeros pasos: "Cargá tu WhatsApp".
- Rubro nuevo en el onboarding y en Configuración: Carnicería / Almacén.
- Configuración → WhatsApp: dos columnas, con la vista en vivo de cómo lo ve el cliente (frente y dorso). Cada botón es una fila con su tipo y su texto; el título en la tarjeta sale del primer botón.
- Configuración → Reglas del programa en dos columnas: lo de todo el negocio a la izquierda y lo de cada tarjeta a la derecha.
- Analítica → Programa: "¿Cuándo viene tu gente?" pasa a ser un solo gráfico de líneas con visitas, canjes y registros por horario, con los colores de Stampa, sin las horas en que el local está cerrado y debajo de los destacados. Reemplaza el mapa de calor y las tarjetas de canjes y registros.
- Analítica → Clientes: empieza con los segmentos (activos, inactivos, nuevos, con Wallet), que antes estaban en Programa. "Clientes por nivel" pasa al final.
- Diseño (tarjetas de puntos): foto de fondo opcional.

**Arreglos**
- Formulario público: el desplegable mide y se ve igual que los campos de nombre y email (en el iPhone quedaba más chico).

## 1.4.0 (21/10/2026)

**Nuevo**
- Letras nuevas en todo el sistema: Red Hat Display (títulos) y Red Hat Text (texto), en lugar de Familjen Grotesk y Albert Sans.
- Analítica en dos secciones: **Programa** (lo que antes eran Resumen, Horarios y Tarjetas) y **Clientes**. La sección Pedidos se suma con Pedidos.
- Respuestas del formulario en tabla: por respuesta, clientes, % activos, visitas promedio y canjes. Con menos de 5 clientes no se muestran porcentajes ni promedios. La cantidad de clientes abre Notificaciones con esa audiencia ya elegida.

**Cambios**
- Barras de un solo color (verde de marca) en Analítica, Inicio, Premios y Clientes; sin degradés.
- Recorrido de clientes: el porcentaje va en gris y dice sobre quiénes se calcula ("97% de los registrados").
- Frecuencia de visita: la comparación con el período anterior va en una frase en gris.
- Mismo criterio en todo el sistema:
  - textos de apoyo en gris (el verde y el rojo quedan para estados: guardado, error, activo o inactivo, subió o bajó);
  - acciones sin flechas ("Ver clientes", "Mejorar plan");
  - textos sin rayas.
- Tarjetas del programa en Analítica con ícono del color de cada dato, igual que las de Inicio.
- Anillo de retención sin texto adentro: los números van en las tarjetas del costado.
- Grupos chicos: con menos de 5 clientes no se muestran porcentajes en Inicio (comparación con el período anterior), Analítica (programa y segmentos) ni en la comparación del anillo de retención.

**Arreglos**
- Botones, campos y menús toman la letra del sistema (algunos quedaban en Arial, por ejemplo "Cancelar suscripción").

## 1.3.1 (20/10/2026)

**Arreglos**
- Los estilos de marca y del sistema visual se importan directo en `app/layout.tsx` y no encadenados desde `globals.css`. El 20/10 un build de producción con caché vieja dejó el panel sin colores ni botones.

## 1.3.0 (20/10/2026) — sistema visual

**Nuevo**
- Letras propias: Familjen Grotesk (títulos) y Albert Sans (texto), cargadas una sola vez con next/font. Chau Inter, Plus Jakarta, Syne y DM Sans.
- Fondo salvia en todo el sistema (antes crema).
- Íconos de una sola familia (Tabler, un grosor), por nombre (`components/ui/Icon.tsx`): de 109 dibujados a mano quedan 3 que son dibujos (QR y gráfico). Sin emojis haciendo de ícono.
- Base del sistema (`styles/sistema.css`): 12 colores con nombre, botones, interruptor, avisos y chips únicos.
- Selectores propios de fecha y hora (`components/ui/DateTime.tsx`): programar envíos con horarios fuertes marcados, horarios de sucursal en 24 hs y cumpleaños con día, mes y año.
- Todas las pestañas del panel, landing, login, registro, onboarding y formulario público migrados al sistema.

**Arreglos**
- Onboarding: íconos de rubro correctos (gym y panadería tenían íconos equivocados).
- Login: textos en castellano (Bronce, Plata, Oro) e ícono de puntos correcto.
- Landing: en el plan destacado las tildes se ven.
- Clientes: las etiquetas no se parten en dos renglones.

## 1.2.0 (19/10/2026)

**Nuevo**
- Onboarding: el último paso muestra el pase real (Apple y Google).
- Premios → membresía: vista previa en vivo con los niveles que se están editando, y aviso si el logo no se ve sobre algún nivel (también en Diseño).

**Cambios**
- Inicio: el anillo muestra el período anterior en % (sin "pts").
- Notificaciones: "74 de 78" y a cuántos no les llega.

## 1.1.0 (15/10/2026)

**Nuevo**
- Notificaciones → Automáticas (Pro): bienvenida, a un sello del premio, te extrañamos y reseña en Google, con texto editable y cuántos salieron en el mes.
- Pro y Enterprise sin "Powered by Stampa" en la vista previa, el formulario y el cartel del QR.
- Premios → puntos: debajo de la regla, cuánto le cuesta al cliente llegar a cada premio del catálogo.
- Modal de nueva tarjeta: la regla de puntos completa (por visita o por monto).

**Cambios**
- Membresía: en Diseño queda "Color de la tarjeta" (Google Wallet, formulario y app) y los colores de cada nivel (Apple), sin texto ni etiquetas, que no cambiaban nada.
- Onboarding: más aire entre secciones, textos en castellano (Bronce, Plata, Oro), la opción recomendada ya no parece elegida y el selector de color nuevo con los colores del logo.
- Premios → vista previa: el logo deja el mismo margen que el pase real y el premio largo no se corta.

## 1.0.0 (14/10/2026)

Primera versión numerada: es lo que estaba en producción ese día.

- Panel: Inicio, Clientes, Analítica, Premios, Notificaciones, Formulario, Diseño, Equipo, Sucursales y Configuración.
- Premios con la regla de cada tarjeta y la tarjeta en vivo; Diseño solo para lo visual; Formulario para las preguntas y el QR.
- Selector de color con los colores del logo, paleta sugerida, color libre en todos los planes y aviso de contraste.
- Onboarding de 5 o 6 pasos, landing, centro de ayuda (`/ayuda`, con sesión) y panel de administración (`/admin`).
