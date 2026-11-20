import React from "react";
import Link from "next/link";
import { getPaymentsForAdmin } from "@/services/payments";
import { ReceiptViewerButton } from "@/components/payments/ReceiptViewerModal";
import { AdminPaymentActions } from "@/features/payments/AdminPaymentActions";

interface AdminPagosPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminPagosPage({ searchParams }: AdminPagosPageProps) {
  const { status } = await searchParams;

  const validStatus =
    status === "approved" || status === "rejected" || status === "pending"
      ? status
      : undefined;

  const payments = await getPaymentsForAdmin(validStatus);

  const pendingCount = payments.filter((p) => p.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav className="text-xs text-brand-text-muted flex items-center gap-1.5 mb-1">
            <Link href="/admin" className="hover:text-brand-primary">
              Admin
            </Link>
            <span>/</span>
            <span className="text-brand-text-primary font-medium">Pagos</span>
          </nav>
          <h1 className="text-2xl font-bold text-brand-text-primary tracking-tight">
            Verificación de Pagos y Suscripciones
          </h1>
          <p className="text-xs text-brand-text-muted mt-0.5">
            Comprueba los comprobantes bancarios y activa o rechaza manualmente las suscripciones.
          </p>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-1 bg-brand-surface p-1 rounded-xl border border-brand-border">
          <Link
            href="/admin/pagos"
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              !validStatus
                ? "bg-slate-900 text-white"
                : "text-brand-text-muted hover:text-brand-text-primary"
            }`}
          >
            Todos
          </Link>
          <Link
            href="/admin/pagos?status=pending"
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              validStatus === "pending"
                ? "bg-amber-600 text-white"
                : "text-brand-text-muted hover:text-brand-text-primary"
            }`}
          >
            <span>Pendientes</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 bg-white/20 text-white rounded-full text-[10px]">
                {pendingCount}
              </span>
            )}
          </Link>
          <Link
            href="/admin/pagos?status=approved"
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              validStatus === "approved"
                ? "bg-emerald-600 text-white"
                : "text-brand-text-muted hover:text-brand-text-primary"
            }`}
          >
            Aprobados
          </Link>
          <Link
            href="/admin/pagos?status=rejected"
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              validStatus === "rejected"
                ? "bg-red-600 text-white"
                : "text-brand-text-muted hover:text-brand-text-primary"
            }`}
          >
            Rechazados
          </Link>
        </div>
      </div>

      {/* Tabla de Pagos */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border shadow-xs overflow-hidden">
        {payments.length === 0 ? (
          <div className="py-12 text-center text-sm text-brand-text-muted">
            No se encontraron pagos con el filtro seleccionado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-surface-muted border-b border-brand-border text-brand-text-muted uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Profesional</th>
                  <th className="py-3 px-4">Plan y Monto</th>
                  <th className="py-3 px-4">Método / Ref</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Comprobante</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-brand-text-primary">
                        {p.professional?.business_name || "Profesional"}
                      </div>
                      <div className="text-[11px] font-mono text-brand-text-muted">
                        /{p.professional?.slug || "—"}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-brand-text-primary">
                        Plan {p.plan?.name || "Suscripción"}
                      </div>
                      <div className="font-bold text-emerald-700">
                        ${p.amount} {p.currency}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="capitalize font-medium text-brand-text-primary">
                        {p.payment_method.replace("_", " ")}
                      </div>
                      <div className="font-mono text-slate-500 font-semibold">
                        Ref: {p.reference_number || "—"}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-brand-text-muted">
                      {new Date(p.created_at).toLocaleDateString("es-VE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td className="py-3 px-4">
                      {p.receipt?.storage_path ? (
                        <ReceiptViewerButton
                          storagePath={p.receipt.storage_path}
                          buttonLabel="Ver Captura"
                          variant="secondary"
                        />
                      ) : (
                        <span className="text-slate-400">Sin archivo</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {p.status === "approved" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ✓ Aprobado
                        </span>
                      )}
                      {p.status === "pending" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          ⏳ Pendiente
                        </span>
                      )}
                      {p.status === "rejected" && (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                            ✕ Rechazado
                          </span>
                          {p.rejection_reason && (
                            <p className="text-[10px] text-red-600 max-w-xs">
                              {p.rejection_reason}
                            </p>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {p.status === "pending" ? (
                        <AdminPaymentActions
                          paymentId={p.id}
                          professionalName={p.professional?.business_name || "Profesional"}
                          amount={p.amount}
                        />
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          Revisado {p.reviewed_at ? "el " + new Date(p.reviewed_at).toLocaleDateString("es-VE") : ""}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
