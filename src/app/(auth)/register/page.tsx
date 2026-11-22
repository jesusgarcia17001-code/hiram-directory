"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpAction } from "@/features/auth/actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(signUpAction, null);

  if (state?.success && state.needsEmailConfirmation) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-2xl">
          ✓
        </div>
        <h2 className="text-xl font-bold tracking-tight text-brand-text-primary">
          ¡Cuenta creada con éxito!
        </h2>
        <Alert variant="success">{state.message}</Alert>
        <div className="pt-4">
          <Link href="/login">
            <Button variant="outline" className="w-full">
              Volver a Iniciar Sesión
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold tracking-tight text-brand-text-primary">
          Crear cuenta
        </h2>
        <p className="mt-1 text-sm text-brand-text-muted">
          Para técnicos independientes y empresas de servicios
        </p>
      </div>

      {state?.message && !state.success && (
        <Alert variant="error">{state.message}</Alert>
      )}

      <form action={formAction} className="space-y-4">
        <Input
          label="Nombre completo o representante"
          name="full_name"
          type="text"
          autoComplete="name"
          required
          placeholder="Ej: Carlos Pérez o Representante Legal"
          error={state?.fieldErrors?.full_name}
        />

        <Input
          label="Correo electrónico"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="tu@correo.com"
          error={state?.fieldErrors?.email}
        />

        <Input
          label="Contraseña"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="Mínimo 8 caracteres"
          error={state?.fieldErrors?.password}
        />

        <Input
          label="Confirmar contraseña"
          name="confirm_password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="Repite tu contraseña"
          error={state?.fieldErrors?.confirm_password}
        />

        <Button type="submit" className="w-full mt-2" isLoading={isPending}>
          Crear cuenta gratis
        </Button>

        <p className="text-[11px] text-brand-text-muted text-center pt-1">
          🔒 Tu cédula o RIF no se muestra públicamente. Solo tú y los administradores pueden verla. La usamos para evitar perfiles falsos.{" "}
          <Link
            href="/privacidad"
            className="text-brand-accent-dark font-medium underline hover:text-brand-accent"
            target="_blank"
          >
            Ver privacidad
          </Link>
        </p>
      </form>

      <div className="text-center pt-2 border-t border-brand-border">
        <p className="text-xs text-brand-text-muted">
          ¿Ya tienes una cuenta?{" "}
          <Link
            href="/login"
            className="font-semibold text-brand-primary hover:text-brand-primary-hover hover:underline"
          >
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
