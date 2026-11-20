"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInAction } from "@/features/auth/actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(signInAction, null);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold tracking-tight text-brand-text-primary">
          Iniciar sesión
        </h2>
        <p className="mt-1 text-sm text-brand-text-muted">
          Ingresa a tu panel de administración o perfil profesional
        </p>
      </div>

      {state?.message && !state.success && (
        <Alert variant="error">{state.message}</Alert>
      )}

      <form action={formAction} className="space-y-4">
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
          autoComplete="current-password"
          required
          placeholder="••••••••"
          error={state?.fieldErrors?.password}
        />

        <Button type="submit" className="w-full mt-2" isLoading={isPending}>
          Ingresar al panel
        </Button>
      </form>

      <div className="text-center pt-2 border-t border-brand-border">
        <p className="text-xs text-brand-text-muted">
          ¿Aún no tienes cuenta?{" "}
          <Link
            href="/register"
            className="font-semibold text-brand-primary hover:text-brand-primary-hover hover:underline"
          >
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  );
}
