import type { NextConfig } from "next";

// Encabezados de seguridad para todo el sitio (landing y panel): nadie puede
// meter el panel dentro de otra página para engañar con clics, el navegador
// no adivina tipos de archivo y la página no pide cámara, micrófono ni
// ubicación (salvo la cámara en /escaner). La CSP es la mínima que no rompe Mercado Pago, Stripe ni Sentry.
const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      // Escáner web: necesita la cámara (solo este sitio, nunca un iframe).
      // Va después para pisar el Permissions-Policy general en esa ruta.
      { source: "/escaner/:path*", headers: [{ key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" }] },
      { source: "/escaner", headers: [{ key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" }] },
    ];
  },
};

export default nextConfig;
