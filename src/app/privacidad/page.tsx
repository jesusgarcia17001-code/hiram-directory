import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "Política de Privacidad y Protección de Datos",
  description:
    "Conoce cómo protegemos tus datos, el resguardo estricto de tu cédula o RIF y el uso confidencial de tu información.",
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-brand-surface-soft/40 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-brand-surface rounded-2xl border border-brand-border shadow-xs p-6 sm:p-10 space-y-8">
        {/* Encabezado */}
        <div className="space-y-3 border-b border-brand-border pb-6">
          <Link
            href="/"
            className="text-xs font-semibold text-brand-primary hover:underline inline-flex items-center gap-1"
          >
            ← Volver al inicio
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-text-primary tracking-tight">
            Política de Privacidad y Protección de Datos
          </h1>
          <p className="text-xs sm:text-sm text-brand-text-muted">
            Última actualización: Noviembre 2026 · {brand.name}
          </p>
        </div>

        {/* Sección destacada sobre Cédula y RIF */}
        <div className="bg-brand-surface-soft p-5 rounded-xl border border-brand-primary/20 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔒</span>
            <h2 className="text-base font-bold text-brand-text-primary">
              Privacidad Estricta de tu Cédula y RIF
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-brand-text-primary leading-relaxed">
            Tu cédula o RIF <strong>nunca se muestra públicamente</strong> en el directorio,
            no aparece en las fichas de búsqueda, no figura en los motores de búsqueda (Google)
            ni en el código fuente visible para los visitantes.
          </p>
          <p className="text-xs sm:text-sm text-brand-text-muted leading-relaxed">
            Este dato es de acceso exclusivo para ti (en tu panel privado) y para los administradores
            centrales con el único fin de verificar la identidad, prevenir duplicidades y evitar
            perfiles falsos.
          </p>
        </div>

        {/* Secciones de política */}
        <div className="space-y-6 text-xs sm:text-sm text-brand-text-primary leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-brand-text-primary">
              1. Datos que recopilamos
            </h2>
            <p className="text-brand-text-muted">
              Al registrarte como técnico independiente o empresa de servicios en {brand.name},
              solicitamos datos de contacto (correo, teléfono o WhatsApp), nombre comercial,
              descripción de servicios prestados, áreas de atención geográfica y un documento de
              identidad legal venezolano (Cédula V/E o RIF J/G).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-brand-text-primary">
              2. Finalidad del tratamiento de datos
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-brand-text-muted">
              <li>
                <strong>Verificación y confianza:</strong> Validar la autenticidad del prestador
                de servicios para proteger a los usuarios frente a fraudes y perfiles falsos.
              </li>
              <li>
                <strong>Directorio público:</strong> Publicar únicamente la información comercial
                que autorices (nombre comercial, fotos de trabajos, especialidades y zona de cobertura).
              </li>
              <li>
                <strong>Protección de contacto:</strong> Gestionar el acceso seguro a tus canales de
                contacto directo sin exponer tu información de forma indiscriminada a bots o spam.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-brand-text-primary">
              3. Quién tiene acceso a tus documentos legales
            </h2>
            <p className="text-brand-text-muted">
              La base de datos cuenta con políticas de seguridad a nivel de fila (Row Level Security - RLS).
              La cédula y el RIF solo pueden ser leídos por el propietario de la cuenta autenticada y por el
              equipo de administración central de {brand.name}. No se ceden, comercializan ni comparten
              con terceros bajo ninguna circunstancia.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-brand-text-primary">
              4. Tus derechos
            </h2>
            <p className="text-brand-text-muted">
              En cualquier momento puedes ingresar a tu panel de control para actualizar tus datos,
              corregir la información de tu perfil o solicitar el cierre y eliminación definitiva
              de tu cuenta a través de los canales de soporte.
            </p>
          </section>
        </div>

        {/* Pie de página de privacidad */}
        <div className="pt-6 border-t border-brand-border text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-brand-primary bg-brand-surface-soft hover:bg-brand-surface-soft/80 rounded-xl transition-colors"
          >
            Regresar al Directorio
          </Link>
        </div>
      </div>
    </div>
  );
}
