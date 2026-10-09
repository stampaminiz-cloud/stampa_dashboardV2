// Link de Stampa Escáner en la App Store. La app está publicada como no
// listada (no aparece en la búsqueda): este link es la única forma de
// bajarla. Variable NEXT_PUBLIC_SCANNER_IOS_URL en Vercel; sin ella, el
// panel muestra "Próximamente" y la ayuda dice que nos pidan el link.
export const SCANNER_IOS_URL = process.env.NEXT_PUBLIC_SCANNER_IOS_URL || ''
