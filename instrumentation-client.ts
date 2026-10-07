// Sentry en el navegador (errores del panel y la landing). Sin
// NEXT_PUBLIC_SENTRY_DSN no hace nada. No manda datos personales: ni IP ni
// cookies ni el contenido de los pedidos; del usuario, como mucho el id.
import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
    // Nada de datos personales: ni usuario, cookies, headers, cuerpos,
    // parámetros de la URL ni datos de las consultas a la base.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      databaseQueryData: false,
    },
    tracesSampleRate: 0,
    beforeSend(event) {
      if (event.request) {
        delete event.request.headers
        delete event.request.cookies
        delete event.request.data
      }
      if (event.user) event.user = { id: event.user.id }
      return event
    },
  })
}

export const onRouterTransitionStart = dsn ? Sentry.captureRouterTransitionStart : undefined
