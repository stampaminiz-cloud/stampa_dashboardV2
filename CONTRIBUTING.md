# Reglas de desarrollo — Stampa Dashboard

## Ramas
- `main` → PRODUCCIÓN. NUNCA pushear directo.
- `staging` → Para probar antes de publicar
- `dev` → Desarrollo activo del día a día

## Workflow
1. Trabajar siempre en `dev`
2. Para probar en staging: mergear `dev` → `staging`
3. Para publicar en producción: PR de `staging` → `main`

## Regla de oro
Si vas a pushear a main → avisale al dev primero.
Producción es intocable sin aprobación.

## Variables de entorno
- Local: NEXT_PUBLIC_API_URL=http://localhost:5002
- Staging: NEXT_PUBLIC_API_URL=https://stampa-staging.vercel.app
- Producción: NEXT_PUBLIC_API_URL=https://surge-malaga-olive.vercel.app

## Antes de cada push a main
□ Probado en local
□ Probado en staging
□ Avisado al dev
□ No hay datos sensibles en el código
