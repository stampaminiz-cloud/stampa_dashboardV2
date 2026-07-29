import Link from 'next/link';

export const metadata = {
  title: 'Política de Privacidad — Stampa',
};

export default function PrivacyPage() {
  return (
    <div data-theme="cream" style={{ background: 'var(--stampa-cream)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '64px 32px 96px' }}>
        <Link href="/" style={{ color: 'var(--stampa-ember)', fontSize: 'var(--text-sm)', fontWeight: 700 }}>
          ← Volver a Stampa
        </Link>

        <div
          style={{
            marginTop: 24,
            marginBottom: 40,
            background: 'var(--ember-soft)',
            border: '1px solid var(--ember-glow)',
            borderRadius: 'var(--radius-xl)',
            padding: '18px 22px',
            fontSize: 'var(--text-sm)',
            color: 'var(--stampa-ink)',
            lineHeight: 'var(--leading-body)',
          }}
        >
          <strong>Borrador pendiente de revisión legal.</strong> Este texto es un punto de partida razonable
          para una plataforma que opera en España y Argentina, pero no reemplaza el asesoramiento de un
          abogado matriculado en cada jurisdicción antes de publicarlo.
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 34, color: 'var(--stampa-ink)', marginBottom: 8 }}>
          Política de Privacidad
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 40 }}>Última actualización: [completar fecha]</p>

        <Section title="1. Responsable del tratamiento">
          <p>
            Stampa (&quot;nosotros&quot;, &quot;la Plataforma&quot;) es responsable del tratamiento de los datos personales
            descritos en esta política. Podés contactarnos en{' '}
            <a href="mailto:stampa.miniz@gmail.com" style={{ color: 'var(--stampa-ember)', fontWeight: 700 }}>
              stampa.miniz@gmail.com
            </a>
            . [Completar: razón social, domicilio legal, CIF/CUIT.]
          </p>
        </Section>

        <Section title="2. Qué datos recopilamos">
          <p>Recopilamos dos tipos de datos distintos, según quién los provee:</p>
          <ul>
            <li>
              <strong>Datos del negocio (dueño/administrador):</strong> nombre, email, teléfono, datos de facturación
              y datos operativos del negocio (nombre comercial, sector, sucursales).
            </li>
            <li>
              <strong>Datos del cliente final</strong> (quien se suma a un programa de fidelización de un negocio
              que usa Stampa): nombre, email y/o teléfono, y los eventos de uso de su tarjeta (sellos, puntos,
              visitas, canjes). Estos datos los recolecta el negocio a través de nuestro formulario de alta, y
              nosotros los procesamos en su nombre.
            </li>
          </ul>
        </Section>

        <Section title="3. Finalidad y base legal">
          <p>Tratamos estos datos para:</p>
          <ul>
            <li>Prestar el servicio (crear y actualizar tarjetas de fidelización en Apple Wallet / Google Wallet).</li>
            <li>Enviar notificaciones push relacionadas al programa de fidelización, cuando el cliente final lo autorizó.</li>
            <li>Generar analíticas agregadas para el negocio (visitas, retención, clientes activos).</li>
            <li>Facturación y soporte a los negocios que usan la Plataforma.</li>
          </ul>
          <p>
            La base legal es la ejecución de un contrato (para el negocio que contrata Stampa) y el interés legítimo
            o consentimiento del cliente final (para el uso de su tarjeta de fidelización), según corresponda.
          </p>
        </Section>

        <Section title="4. Conservación de datos">
          <p>
            Conservamos los datos mientras la cuenta del negocio esté activa, y durante el plazo legal exigido
            luego de una baja (por ejemplo, por obligaciones fiscales). El cliente final puede solicitar la
            eliminación de sus datos en cualquier momento, sin perjuicio de la información que el negocio deba
            conservar por ley.
          </p>
        </Section>

        <Section title="5. Tus derechos">
          <p>
            <strong>Si estás en España o la UE</strong> (Reglamento General de Protección de Datos y LOPDGDD),
            tenés derecho a acceder, rectificar, suprimir, oponerte, limitar el tratamiento y portar tus datos, y
            a presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD).
          </p>
          <p>
            <strong>Si estás en Argentina</strong> (Ley 25.326 de Protección de Datos Personales), tenés derecho de
            acceso, rectificación, actualización y supresión de tus datos, y podés reclamar ante la Agencia de
            Acceso a la Información Pública (AAIP).
          </p>
          <p>
            Para ejercer cualquiera de estos derechos, escribinos a{' '}
            <a href="mailto:stampa.miniz@gmail.com" style={{ color: 'var(--stampa-ember)', fontWeight: 700 }}>
              stampa.miniz@gmail.com
            </a>
            .
          </p>
        </Section>

        <Section title="6. Con quién compartimos datos">
          <p>Usamos los siguientes proveedores para operar la Plataforma, que actúan como encargados del tratamiento:</p>
          <ul>
            <li>MongoDB Atlas (alojamiento de base de datos)</li>
            <li>Vercel (hosting de la aplicación)</li>
            <li>Apple (Wallet / PassKit) y Google (Google Wallet API), para emitir y actualizar las tarjetas</li>
          </ul>
          <p>No vendemos datos personales a terceros con fines publicitarios.</p>
        </Section>

        <Section title="7. Transferencias internacionales">
          <p>
            Algunos de nuestros proveedores (Vercel, MongoDB Atlas, Apple, Google) pueden procesar datos fuera de
            España o Argentina. En esos casos, nos apoyamos en las garantías que ofrecen dichos proveedores
            (cláusulas contractuales tipo u otros mecanismos reconocidos) para proteger tus datos.
          </p>
        </Section>

        <Section title="8. Cookies">
          <p>
            Esta landing page no utiliza cookies de seguimiento propias más allá de las estrictamente necesarias
            para su funcionamiento. [Completar si se agrega analytics de terceros como Google Analytics o Meta Pixel.]
          </p>
        </Section>

        <Section title="9. Cambios a esta política">
          <p>
            Podemos actualizar esta política ocasionalmente. Publicaremos cualquier cambio importante en esta misma
            página con su fecha de actualización.
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-h2)', color: 'var(--stampa-ink)', marginBottom: 12 }}>
        {title}
      </h2>
      <div className="legalContent" style={{ fontSize: 'var(--text-base)', color: 'var(--text-body)', lineHeight: 'var(--leading-body)' }}>
        {children}
      </div>
    </section>
  );
}