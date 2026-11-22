"use server";

import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import { redirect } from "next/navigation";

export interface AuthActionResult {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  needsEmailConfirmation?: boolean;
}

/**
 * Acción del Servidor para registrar un nuevo usuario.
 * Pasa `full_name` en metadata para que el trigger PostgreSQL cree su perfil en `public.user_profiles`.
 */
export async function signUpAction(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const rawData = {
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirm_password: formData.get("confirm_password"),
    terms_accepted:
      formData.get("terms_accepted") === "on" ||
      formData.get("terms_accepted") === "true",
  };

  const parsed = registerSchema.safeParse(rawData);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      const field = issue.path[0]?.toString() || "form";
      fieldErrors[field] = issue.message;
    });
    return {
      success: false,
      message: "Por favor corrige los errores del formulario.",
      fieldErrors,
    };
  }

  const { full_name, email, password } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        terms_accepted_at: new Date().toISOString(),
      },
    },
  });

  if (error) {
    return {
      success: false,
      message: error.message || "Ocurrió un error al registrar la cuenta.",
    };
  }

  // Si Supabase exige confirmación por correo electrónico
  if (data.user && !data.session) {
    return {
      success: true,
      needsEmailConfirmation: true,
      message:
        "Registro exitoso. Te hemos enviado un correo de confirmación. Por favor revisa tu bandeja de entrada.",
    };
  }

  // Si no requiere confirmación, redirigir al panel
  redirect("/panel");
}

/**
 * Acción del Servidor para iniciar sesión con correo y contraseña.
 */
export async function signInAction(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(rawData);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      const field = issue.path[0]?.toString() || "form";
      fieldErrors[field] = issue.message;
    });
    return {
      success: false,
      message: "Credenciales inválidas.",
      fieldErrors,
    };
  }

  const { email, password } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    let friendlyMessage = "Error al iniciar sesión.";
    if (error.message.includes("Invalid login credentials")) {
      friendlyMessage = "Correo electrónico o contraseña incorrectos.";
    } else if (error.message.includes("Email not confirmed")) {
      friendlyMessage =
        "Tu correo electrónico no ha sido confirmado aún. Revisa tu bandeja de entrada.";
    }
    return {
      success: false,
      message: friendlyMessage,
    };
  }

  redirect("/panel");
}

/**
 * Acción del Servidor para cerrar sesión.
 */
export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
