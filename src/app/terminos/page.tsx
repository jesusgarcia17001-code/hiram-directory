import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Términos y Condiciones de Uso | Ofir Oficios",
  description:
    "Términos y condiciones de uso de la plataforma Ofir Oficios para visitantes y profesionales en el estado Anzoátegui, Venezuela.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function TerminosPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-brand-surface-soft/40 py-10 px-4 sm:px-6 lg:px-8">
        <article className="max-w-3xl mx-auto bg-brand-surface rounded-2xl border border-brand-border shadow-xs p-6 sm:p-10 space-y-8">
          {/* Navegación y Encabezado */}
          <div className="space-y-3 border-b border-brand-border pb-6">
            <Link
              href="/"
              className="text-xs font-semibold text-brand-primary hover:underline inline-flex items-center gap-1"
            >
              ← Volver al inicio
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-brand-text-primary tracking-tight">
              Términos y Condiciones de Uso — Ofir Oficios
            </h1>
            <p className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg inline-block">
              BORRADOR — debe ser revisado por un abogado antes de publicarse.
            </p>
            <p className="text-xs text-brand-text-muted">
              Última actualización: Noviembre 2026
            </p>
          </div>

          <div className="space-y-6 text-sm text-brand-text-primary leading-relaxed">
            {/* 1. Quiénes somos */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-brand-text-primary">
                1. Quiénes somos
              </h2>
              <p className="text-brand-text-muted">
                Ofir Oficios es una plataforma web de directorio que permite a las personas encontrar técnicos y prestadores de servicios en el estado Anzoátegui, Venezuela. La plataforma es propiedad de HIRAM, operada por Jesús García, persona natural, con domicilio en [CIUDAD], Estado Anzoátegui, Venezuela. Contacto:{" "}
                <a href="mailto:jesusgarcia17001@gmail.com" className="text-brand-primary font-medium underline">
                  jesusgarcia17001@gmail.com
                </a>.
              </p>
              <p className="text-brand-text-muted">
                Al usar el sitio, registrarte o contratar un plan, aceptas estos Términos.
              </p>
            </section>

            {/* 2. Qué es (y qué no es) Ofir Oficios */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-brand-text-primary">
                2. Qué es (y qué no es) Ofir Oficios
              </h2>
              <ul className="list-disc pl-5 space-y-1.5 text-brand-text-muted">
                <li>
                  Ofir Oficios es un <strong>medio de publicidad y contacto</strong>. Conecta a visitantes con profesionales independientes.
                </li>
                <li>
                  <strong>No somos empleadores, contratistas ni agentes</strong> de los profesionales, ni parte de los acuerdos entre ellos y sus clientes.
                </li>
                <li>
                  No garantizamos la calidad, seguridad, precio, puntualidad ni resultado de ningún trabajo, ni que un perfil reciba visitas, contactos o clientes. Las visitas y contactos son indicadores de interés, no garantías de contratación.
                </li>
                <li>
                  La información de cada perfil la proporciona el profesional. Cada persona debe evaluar y decidir por su cuenta a quién contrata.
                </li>
              </ul>
            </section>

            {/* 3. Cuentas y registro */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-brand-text-primary">
                3. Cuentas y registro
              </h2>
              <ul className="list-disc pl-5 space-y-1.5 text-brand-text-muted">
                <li>
                  Debes ser mayor de 18 años y dar información veraz y actualizada.
                </li>
                <li>
                  Debes indicar tu cédula (persona natural) o tu RIF (empresa o taller) reales y que te correspondan. Se usan para identificarte, evitar perfiles falsos o duplicados y prevenir fraudes, son <strong>privados</strong> (no se muestran públicamente) y se tratan según la Política de Privacidad. Podemos rechazar o suspender un perfil con un documento falso, ajeno o repetido en otro perfil.
                </li>
                <li>
                  Eres responsable de tu contraseña y de todo lo que ocurra desde tu cuenta.
                </li>
                <li>
                  Cada profesional puede tener un perfil. Ofir Oficios puede aprobar, rechazar o suspender perfiles a su criterio, por ejemplo si la información es falsa, engañosa o incumple estos Términos.
                </li>
              </ul>
            </section>

            {/* 4. Reglas para los profesionales */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-brand-text-primary">
                4. Reglas para los profesionales
              </h2>
              <p className="text-brand-text-muted">Te comprometes a:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-brand-text-muted">
                <li>
                  Publicar solo información verdadera sobre tu oficio, experiencia, zona y datos de contacto.
                </li>
                <li>
                  Subir solo fotos propias o que tengas derecho a usar, sin contenido ofensivo, ilegal ni engañoso.
                </li>
                <li>
                  No suplantar a otras personas ni empresas, no publicar perfiles falsos ni duplicados.
                </li>
                <li>
                  Atender con respeto a quienes te contacten.
                </li>
              </ul>
              <p className="text-brand-text-muted pt-1">
                Nos otorgas una licencia limitada, gratuita y no exclusiva para mostrar tu perfil y tus fotos dentro de la plataforma y en sus materiales de promoción, mientras tu perfil esté publicado.
              </p>
            </section>

            {/* 5. Plan gratuito */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-brand-text-primary">
                5. Plan gratuito
              </h2>
              <p className="text-brand-text-muted">
                Cada perfil incluye una cuota gratuita <strong>acumulada</strong> de hasta <strong>10 visitas únicas</strong> o <strong>5 contactos únicos</strong>, lo que ocurra primero. No se reinicia cada mes. Al alcanzarse, el perfil sigue visible, pero WhatsApp y llamada quedan bloqueados hasta que se active un plan de pago. Los contactos realizados durante un plan pagado no consumen esta cuota.
              </p>
            </section>

            {/* 6. Planes de pago y pagos */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-brand-text-primary">
                6. Planes de pago y pagos
              </h2>
              <ul className="list-disc pl-5 space-y-1.5 text-brand-text-muted">
                <li>
                  Los planes (por ejemplo Profesional y Premium), sus precios en dólares (USD) y sus beneficios se muestran en la sección de planes y pueden cambiar. Un cambio no afecta al período ya pagado.
                </li>
                <li>
                  Los pagos se hacen de forma manual (Pago Móvil u otro método indicado). Si pagas en bolívares, el monto se calcula con la tasa oficial del BCV vigente el día del pago, según se indique en pantalla.
                </li>
                <li>
                  El profesional debe reportar el pago con su referencia y comprobante. <strong>El plan se activa solo cuando un administrador verifica el pago</strong>, normalmente dentro de [X] horas hábiles. Subir un comprobante no activa el plan por sí solo.
                </li>
                <li>
                  Cada plan dura el período contratado (por ejemplo 30 días) desde su activación. Al vencer, el perfil sigue visible y los contactos se bloquean hasta renovar.
                </li>
                <li>
                  Las comisiones bancarias son responsabilidad de quien paga. Pagos con datos incorrectos pueden ser rechazados.
                </li>
              </ul>
            </section>

            {/* 7. Política de reembolsos */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-brand-text-primary">
                7. Política de reembolsos
              </h2>
              <ol className="list-decimal pl-5 space-y-1.5 text-brand-text-muted">
                <li>
                  <strong>Regla general:</strong> los pagos por planes <strong>no son reembolsables</strong> una vez activado el plan, porque el servicio (visibilidad y contactos) se presta de inmediato.
                </li>
                <li>
                  <strong>Excepciones</strong>, que debes solicitar por escrito a{" "}
                  <a href="mailto:jesusgarcia17001@gmail.com" className="text-brand-primary underline">
                    jesusgarcia17001@gmail.com
                  </a>{" "}
                  dentro de <strong>48 horas</strong> del pago, con el comprobante:
                  <ul className="list-disc pl-5 pt-1 space-y-1">
                    <li>Cobro duplicado del mismo plan.</li>
                    <li>Pago realizado y no activado por causa atribuible a la plataforma, si no puede resolverse con la activación del plan.</li>
                  </ul>
                </li>
                <li>
                  No hay reembolsos parciales ni prorrateo por cancelación anticipada, por suspensión del perfil debida al incumplimiento de estos Términos, ni porque el perfil reciba pocas visitas o contactos.
                </li>
                <li>
                  Si se aprueba un reembolso, se devolverá por el mismo medio, en el monto en USD pagado, menos comisiones bancarias, dentro de [X] días hábiles.
                </li>
              </ol>
              <p className="text-xs text-brand-text-muted italic pt-1">
                *Nota para el abogado: confirmar que esta política es compatible con la normativa de protección al consumidor aplicable.*
              </p>
            </section>

            {/* 8. Conductas prohibidas */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-brand-text-primary">
                8. Conductas prohibidas
              </h2>
              <p className="text-brand-text-muted">
                Usar la plataforma para actividades ilegales o fraudulentas; inflar artificialmente visitas o contactos; intentar acceder a datos que no te pertenecen o saltarte los límites del sistema; extraer datos masivamente (scraping); enviar spam a los profesionales; o interferir con el funcionamiento del sitio.
              </p>
            </section>

            {/* 9. Suspensión y terminación */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-brand-text-primary">
                9. Suspensión y terminación
              </h2>
              <p className="text-brand-text-muted">
                Podemos suspender o eliminar perfiles o cuentas que incumplan estos Términos, sin reembolso. Puedes pedir que eliminemos tu cuenta escribiendo al correo de contacto.
              </p>
            </section>

            {/* 10. Limitación de responsabilidad */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-brand-text-primary">
                10. Limitación de responsabilidad
              </h2>
              <p className="text-brand-text-muted">
                En la medida permitida por la ley, Ofir Oficios y HIRAM no son responsables por daños derivados de trabajos, acuerdos, pagos o disputas entre visitantes y profesionales, ni por interrupciones, errores o pérdida de datos del servicio, que se ofrece &ldquo;tal cual&rdquo; y según disponibilidad.
              </p>
            </section>

            {/* 11. Privacidad */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-brand-text-primary">
                11. Privacidad
              </h2>
              <p className="text-brand-text-muted">
                El tratamiento de datos se describe en la{" "}
                <Link href="/privacidad" className="text-brand-primary font-semibold underline">
                  Política de Privacidad
                </Link>.
              </p>
            </section>

            {/* 12. Cambios y ley aplicable */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-brand-text-primary">
                12. Cambios y ley aplicable
              </h2>
              <p className="text-brand-text-muted">
                Podemos actualizar estos Términos; la versión vigente estará siempre publicada con su fecha. Si continúas usando el sitio después de un cambio, lo aceptas. Estos Términos se rigen por las leyes de la República Bolivariana de Venezuela. Para cualquier controversia, las partes se someten a los tribunales competentes del Estado Anzoátegui, salvo que la ley disponga otra cosa.
              </p>
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
