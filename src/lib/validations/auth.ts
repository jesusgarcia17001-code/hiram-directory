import { z } from "zod";

/**
 * Esquema de validación para inicio de sesión.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Ingresa un correo electrónico válido."),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres."),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Esquema de validación para registro de usuario.
 */
export const registerSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres.")
      .max(120, "El nombre no puede superar los 120 caracteres."),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Ingresa un correo electrónico válido."),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres."),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Las contraseñas no coinciden.",
    path: ["confirm_password"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
