import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminUpdateProfessionalAction } from "@/features/admin/actions-professional-edit";

// Mocks de Supabase
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockRpc = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockImplementation(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
    rpc: mockRpc,
  })),
}));

const mockAdminUpdate = vi.fn();
const mockAdminUpsert = vi.fn();
const mockAdminDelete = vi.fn();
const mockAdminInsert = vi.fn();
const mockAdminSingle = vi.fn();
const mockAdminMaybeSingle = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn().mockImplementation(() => ({
    from: (table: string) => {
      if (table === "professionals") {
        return {
          select: () => ({
            eq: () => ({
              single: mockAdminSingle,
              neq: () => ({
                maybeSingle: mockAdminMaybeSingle,
              }),
            }),
          }),
          update: (...args: any[]) => {
            mockAdminUpdate(...args);
            return {
              eq: () => Promise.resolve({ error: null }),
            };
          },
        };
      }
      if (table === "professional_contacts") {
        return {
          upsert: (...args: any[]) => {
            mockAdminUpsert(...args);
            return Promise.resolve({ error: null });
          },
        };
      }
      if (table === "professional_categories") {
        return {
          delete: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
          insert: (...args: any[]) => {
            mockAdminInsert(...args);
            return Promise.resolve({ error: null });
          },
        };
      }
      if (table === "audit_logs") {
        return {
          insert: () => Promise.resolve({ error: null }),
        };
      }
      return {};
    },
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Acciones Administrativas de Edición de Profesionales (CLAUDE.md)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe rechazar la acción si el usuario no está autenticado", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });

    const formData = new FormData();
    formData.append("professional_id", "a0000000-0000-0000-0000-000000000001");
    formData.append("business_name", "Taller Eléctrico Central");

    const result = await adminUpdateProfessionalAction(null, formData);

    expect(result.success).toBe(false);
    expect(result.message).toContain("No autenticado");
  });

  it("debe rechazar la acción si el usuario autenticado NO es admin", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123", email: "tech@example.com" } },
    });

    mockFrom.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          single: vi.fn().mockResolvedValueOnce({
            data: { role: "professional" },
          }),
        }),
      }),
    });

    const formData = new FormData();
    formData.append("professional_id", "a0000000-0000-0000-0000-000000000001");

    const result = await adminUpdateProfessionalAction(null, formData);

    expect(result.success).toBe(false);
    expect(result.message).toContain("permisos de administrador");
  });

  it("debe validar formato de teléfono venezolano y campos requeridos", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "admin-1", email: "admin@example.com" } },
    });

    mockFrom.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          single: vi.fn().mockResolvedValueOnce({
            data: { role: "admin" },
          }),
        }),
      }),
    });

    const formData = new FormData();
    formData.append("professional_id", "a0000000-0000-0000-0000-000000000001");
    formData.append("business_name", "A"); // Menos de 2 caracteres
    formData.append("whatsapp_phone", "12345"); // Teléfono inválido

    const result = await adminUpdateProfessionalAction(null, formData);

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.business_name).toBeDefined();
    expect(result.errors?.whatsapp_phone).toBeDefined();
  });

  it("debe actualizar exitosamente el perfil y normalizar el número a E.164 (+58)", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "admin-1", email: "admin@example.com" } },
    });

    mockFrom.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          single: vi.fn().mockResolvedValueOnce({
            data: { role: "admin" },
          }),
        }),
      }),
    });

    mockAdminSingle.mockResolvedValueOnce({
      data: {
        id: "11111111-1111-4111-a111-111111111111",
        slug: "electricista-anterior",
        business_name: "Electricista Anterior",
        locality_id: "22222222-2222-4222-a222-222222222222",
        status: "approved",
      },
      error: null,
    });

    mockAdminMaybeSingle.mockResolvedValueOnce({ data: null }); // Slug no tomado

    const formData = new FormData();
    formData.append("professional_id", "11111111-1111-4111-a111-111111111111");
    formData.append("business_name", "Servicios Eléctricos Puerto La Cruz");
    formData.append("category_id", "33333333-3333-4333-a333-333333333333");
    formData.append("locality_id", "22222222-2222-4222-a222-222222222222");
    formData.append("experience_years", "12");
    formData.append("whatsapp_phone", "0414-2801234"); // Formato local
    formData.append("phone", "0281-2865544");
    formData.append("description", "Instalaciones de tableros trifásicos y residenciales.");

    const result = await adminUpdateProfessionalAction(null, formData);

    expect(result.success).toBe(true);
    expect(result.message).toContain("actualizada exitosamente");

    // Verificar que el teléfono de WhatsApp fue normalizado a E.164 (+58...)
    expect(mockAdminUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        professional_id: "11111111-1111-4111-a111-111111111111",
        whatsapp_phone: "+584142801234",
        phone: "+582812865544",
      }),
      expect.any(Object)
    );
  });
});
