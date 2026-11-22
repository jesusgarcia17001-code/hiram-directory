import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Política de Privacidad | Ofir Oficios",
  description:
    "Política de privacidad y tratamiento de datos personales de la plataforma Ofir Oficios en el estado Anzoátegui, Venezuela.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacidadPage() {
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
              Política de Privacidad — Ofir Oficios
            </h1>
            <p className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg inline-block">
              BORRADOR — debe ser revisado por un abogado antes de publicarse.
            </p>
            <p className="text-xs text-brand-text-muted">
              Última actualización: Noviembre 2026
            </p>
          </div>

          <div className="space-y-6 text-sm text-brand-text-primary leading-relaxed">
            {/* 1. Responsable */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-brand-text-primary">
                1. Responsable
              </h2>
              <p className="text-brand-text-muted">
                HIRAM, operada por Jesús García, persona natural, [CIUDAD], Estado Anzoátegui, Venezuela. Contacto para temas de privacidad:{" "}
                <a href="mailto:jesusgarcia17001@gmail.com" className="text-brand-primary font-medium underline">
                  jesusgarcia17001@gmail.com
                </a>.
              </p>
            </section>

            {/* 2. Qué datos recopilamos */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-brand-text-primary">
                2. Qué datos recopilamos
              </h2>

              <div className="space-y-2">
                <h3 className="font-bold text-brand-text-primary">Si eres visitante</h3>
                <ul className="list-disc pl-5 space-y-1.5 text-brand-text-muted">
                  <li>
                    Un identificador anónimo guardado en una cookie, para contar visitas y contactos únicos y aplicar los límites del plan gratuito. Se procesa de forma cifrada; <strong>no guardamos tu dirección IP en nuestra base de datos</strong>.
                  </li>
                  <li>
                    Datos técnicos básicos que los proveedores de alojamiento pueden registrar para operar y proteger el servicio (por ejemplo, registros de acceso).
                  </li>
                </ul>
              </div>

              <div className="space-y-2 pt-2">
                <h3 className="font-bold text-brand-text-primary">Si eres profesional</h3>
                <ul className="list-disc pl-5 space-y-1.5 text-brand-text-muted">
                  <li>
                    Datos de cuenta: nombre, correo electrónico y contraseña (la contraseña se guarda cifrada por el proveedor de autenticación).
                  </li>
                  <li>
                    <strong>Documento de identidad:</strong> si eres persona natural, tu cédula (V o E); si eres empresa o taller, tu RIF (J o G); y el tipo de prestador (persona o empresa). <strong>Es un dato privado: nunca se muestra en tu perfil público, ni a los visitantes, ni a otros profesionales.</strong> Solo puedes verlo tú, desde tu panel, y los administradores de la plataforma.
                  </li>
                  <li>
                    Datos del perfil: nombre comercial, descripción, oficio, localidad, zonas de atención, experiencia, horario, servicios, logotipo y fotografías. <strong>Estos datos son públicos</strong> una vez que tu perfil es aprobado.
                  </li>
                  <li>
                    Teléfono y WhatsApp: <strong>no se muestran en el código público de la página</strong>; se entregan al visitante solo cuando usa el botón de contacto y mientras tu cuota o plan lo permitan.
                  </li>
                  <li>
                    Datos de pago: método, referencia, monto, fecha y la imagen del comprobante. Son <strong>privados</strong>: solo tú y el administrador pueden verlos.
                  </li>
                  <li>
                    Métricas de tu perfil: visitas y contactos.
                  </li>
                </ul>
              </div>

              <div className="bg-brand-surface-soft p-4 rounded-xl border border-brand-border text-xs sm:text-sm text-brand-text-muted mt-3">
                <p>
                  <strong>Por qué pedimos tu cédula o RIF:</strong> para identificar a cada profesional, evitar perfiles falsos o duplicados, prevenir fraudes en los pagos y, si ofrecemos una insignia de verificación, poder comprobar tu identidad. Solo la usamos para esos fines. No la publicamos, no la vendemos y no la compartimos con terceros, salvo que una autoridad competente la exija conforme a la ley.
                </p>
              </div>
            </section>

            {/* 3. Para qué usamos los datos */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-brand-text-primary">
                3. Para qué usamos los datos
              </h2>
              <p className="text-brand-text-muted">
                Crear y mostrar tu perfil; identificar y verificar a los profesionales y prevenir perfiles falsos o duplicados; permitir que te contacten; aplicar los límites del plan; verificar pagos y activar suscripciones; enviarte avisos del servicio (por ejemplo, perfil aprobado o plan por vencer); prevenir fraudes y abusos; y mejorar la plataforma. No vendemos tus datos.
              </p>
            </section>

            {/* 4. Con quién los compartimos */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-brand-text-primary">
                4. Con quién los compartimos
              </h2>
              <p className="text-brand-text-muted">
                Con proveedores que hacen posible el servicio y solo para ese fin: alojamiento y base de datos (Vercel y Supabase), y, cuando se activen, servicios de correo y monitoreo de errores. Estos proveedores pueden procesar datos en servidores fuera de Venezuela. También podríamos divulgar datos si una autoridad competente lo exige conforme a la ley.
              </p>
            </section>

            {/* 5. Cookies */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-brand-text-primary">
                5. Cookies
              </h2>
              <p className="text-brand-text-muted">
                Usamos cookies necesarias para mantener tu sesión y para el identificador anónimo de visitante. No usamos cookies de publicidad.
              </p>
            </section>

            {/* 6. Cuánto tiempo guardamos los datos */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-brand-text-primary">
                6. Cuánto tiempo guardamos los datos
              </h2>
              <p className="text-brand-text-muted">
                Mientras tengas cuenta o perfil activo y el tiempo necesario para cumplir obligaciones legales o resolver disputas. Los comprobantes de pago se conservan [X] meses. Cuando eliminas tu cuenta, borramos tus datos de perfil, salvo los registros que debamos conservar.
              </p>
            </section>

            {/* 7. Tus derechos */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-brand-text-primary">
                7. Tus derechos
              </h2>
              <p className="text-brand-text-muted">
                Puedes pedir por correo: acceder a tus datos, corregirlos, que los eliminemos u oponerte a algún uso. Responderemos en un plazo razonable. Parte de tus datos puedes editarlos tú mismo desde tu panel.
              </p>
            </section>

            {/* 8. Seguridad */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-brand-text-primary">
                8. Seguridad
              </h2>
              <p className="text-brand-text-muted">
                Aplicamos controles de acceso por rol (tu cédula o RIF solo es visible para ti y para los administradores, y no forma parte de los datos públicos del sitio), cifrado en tránsito, almacenamiento privado para comprobantes y registros de acciones administrativas. Ningún sistema es 100% seguro; si ocurriera una brecha que te afecte, te lo informaremos.
              </p>
            </section>

            {/* 9. Menores de edad */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-brand-text-primary">
                9. Menores de edad
              </h2>
              <p className="text-brand-text-muted">
                El servicio está dirigido a mayores de 18 años.
              </p>
            </section>

            {/* 10. Cambios */}
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-brand-text-primary">
                10. Cambios
              </h2>
              <p className="text-brand-text-muted">
                Publicaremos aquí cualquier cambio con su fecha de actualización.
              </p>
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
