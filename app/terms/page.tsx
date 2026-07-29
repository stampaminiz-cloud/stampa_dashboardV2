import Link from 'next/link';

export const metadata = {
  title: 'Términos y Condiciones — Stampa',
};

export default function TermsPage() {
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
          Términos y Condiciones
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 40 }}>Última actualización: [completar fecha]</p>

        <Section title="1. Aceptación de los términos">
          <p>
            Al crear una cuenta o usar Stampa, aceptás estos Términos y Condiciones y nuestra{' '}
            <Link href="/privacidad" style={{ color: 'var(--stampa-ember)', fontWeight: 700 }}>
              Política de Privacidad
            </Link>
            . Si no estás de acuerdo, no debés usar la Plataforma.
          </p>
        </Section>

        <Section title="2. Qué es Stampa">
          <p>
            Stampa es una plataforma de fidelización digital que permite a negocios (cafeterías, panaderías, salones,
            gimnasios, etc.) crear y gestionar tarjetas de fidelización — de sellos, puntos o membresía — entregadas
            a través de Apple Wallet y Google Wallet.
          </p>
        </Section>

        <Section title="3. Cuenta y responsabilidades del negocio">
          <p>Como titular de una cuenta de negocio en Stampa, sos responsable de:</p>
          <ul>
            <li>Mantener la confidencialidad de tus credenciales de acceso.</li>
            <li>La veracidad de los datos que cargás sobre tu negocio.</li>
            <li>
              Contar con base legal suficiente para recolectar y tratar los datos de tus clientes finales
              (por ejemplo, el consentimiento que obtenés al momento del alta), y cumplir con la normativa de
              protección de datos aplicable en tu jurisdicción.
            </li>
            <li>El uso que le des a las notificaciones push (no usarlas para spam o contenido no autorizado).</li>
          </ul>
        </Section>

        <Section title="4. Planes, precios y período de prueba">
          <p>
            Los planes disponibles (Starter, Growth, Pro, Enterprise) y sus precios se detallan en{' '}
            <Link href="/#precios" style={{ color: 'var(--stampa-ember)', fontWeight: 700 }}>
              nuestra página de precios
            </Link>
            . Ofrecemos 14 días de prueba gratuita sin necesidad de tarjeta de crédito. Al finalizar el período de
            prueba, se te pedirá elegir un plan pago para continuar usando la Plataforma.
          </p>
        </Section>

        <Section title="5. Cancelación">
          <p>
            Podés cancelar tu suscripción en cualquier momento desde el dashboard, sin permanencia mínima. La
            cancelación surte efecto al final del período de facturación vigente; no se realizan reembolsos
            proporcionales por el tiempo no utilizado, salvo que la ley aplicable indique lo contrario.
          </p>
        </Section>

        <Section title="6. Propiedad intelectual">
          <p>
            El software, diseño, marca e isologo de Stampa son propiedad de Stampa. El contenido que cargás
            (nombre de tu negocio, logo, datos de tus tarjetas) sigue siendo tuyo; nos otorgás una licencia
            limitada para almacenarlo y mostrarlo únicamente con el fin de prestarte el servicio.
          </p>
        </Section>

        <Section title="7. Disponibilidad del servicio">
          <p>
            Hacemos nuestro mejor esfuerzo para mantener la Plataforma disponible de forma continua, pero no
            garantizamos un funcionamiento ininterrumpido o libre de errores. Podemos realizar mantenimientos
            programados, notificándolo con antelación razonable cuando sea posible.
          </p>
        </Section>

        <Section title="8. Limitación de responsabilidad">
          <p>
            En la medida permitida por la ley aplicable, Stampa no será responsable por daños indirectos,
            incidentales o consecuentes derivados del uso de la Plataforma, incluyendo pérdida de datos, de
            ingresos o de clientes.
          </p>
        </Section>

        <Section title="9. Legislación aplicable">
          <p>
            Si tu negocio está radicado en España, estos términos se rigen por la legislación española, con
            sometimiento a los juzgados y tribunales que correspondan según la normativa de protección al
            consumidor aplicable. Si tu negocio está radicado en Argentina, se rigen por la legislación argentina,
            con sometimiento a los tribunales ordinarios competentes. [Completar con jurisdicción específica una
            vez definida la estructura societaria.]
          </p>
        </Section>

        <Section title="10. Contacto">
          <p>
            Para cualquier consulta sobre estos términos, escribinos a{' '}
            <a href="mailto:stampa.miniz@gmail.com" style={{ color: 'var(--stampa-ember)', fontWeight: 700 }}>
              stampa.miniz@gmail.com
            </a>
            .
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