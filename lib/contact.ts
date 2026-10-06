// Contacto de ventas de Stampa (Enterprise se consulta por WhatsApp o mail:
// no tiene precio público).
export const SALES_EMAIL = 'hola@stampaclub.com'
export const SALES_WHATSAPP = '5493512638999'
export const whatsappLink = (text: string) => `https://wa.me/${SALES_WHATSAPP}?text=${encodeURIComponent(text)}`
export const mailLink = (subject: string) => `mailto:${SALES_EMAIL}?subject=${encodeURIComponent(subject)}`
