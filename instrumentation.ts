// Sentry en el servidor de Next (páginas que se arman en el servidor). Sin
// NEXT_PUBLIC_SENTRY_DSN no hace nada. Mismo criterio de privacidad que
// instrumentation-client.ts.
import * as Sentry from '@sentry/nextjs'

export async function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
  if (!dsn || process.env.NEXT_RUNTIME !== 'nodejs') return
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
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
      return event
    },
  })
}

export const onRequestError = Sentry.captureRequestError
