# Cambios del panel y la landing

Formato: la versión más nueva arriba. El panel y el backend llevan el mismo número; cómo se numera está en `docs/versiones.md` del backend.

## 1.5.0 (por salir) — WhatsApp en la tarjeta

**Nuevo**
- Configuración → WhatsApp en la tarjeta: número, hasta 2 botones sugeridos según el rubro (con el texto editable) y la línea del frente con vista previa. Todos los planes.
- Analítica → Clientes: Toques en WhatsApp, por botón.
- Inicio → Primeros pasos: "Cargá tu WhatsApp".
- Rubro nuevo en el onboarding y en Configuración: Carnicería / Almacén.
- Configuración → WhatsApp: dos columnas, con la vista en vivo de cómo lo ve el cliente (frente y dorso). Cada botón es una fila con su tipo y su texto; el título en la tarjeta sale del primer botón.
- Configuración → Reglas del programa en dos columnas: lo de todo el negocio a la izquierda y lo de cada tarjeta a la derecha.
- Analítica → "¿Cuándo viene tu gente?", "¿Cuándo canjean?" y "¿Cuándo se registran?": dos gráficos simples (por día y por horario) en lugar del mapa de calor, sin las horas en que el local está cerrado.
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
