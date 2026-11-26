import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Contar perfiles según su estado
  const { count: pendingCount } = await supabase
    .from("professionals")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const { count: approvedCount } = await supabase
    .from("professionals")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved");

  const { count: totalCount } = await supabase
    .from("professionals")
    .select("*", { count: "exact", head: true });

  const { count: totalUsers } = await supabase
    .from("user_profiles")
    .select("*", { count: "exact", head: true });

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-950/80 text-red-400 border border-red-800">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          Acceso Restringido - Rol Administrador
        </span>
        <h1 className="text-3xl font-black text-white tracking-tight mt-3">
          Panel de Control y Supervisión
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Supervisión de prestadores de servicios, aprobación de perfiles y métricas en Anzoátegui.
        </p>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Perfiles Pendientes */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-amber-900/40 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              En Revisión
            </span>
            <span className="text-xl">⏳</span>
          </div>
          <p className="text-3xl font-black text-white mt-3">
            {pendingCount ?? 0}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Perfiles esperando aprobación
          </p>
          {(pendingCount ?? 0) > 0 && (
            <Link
              href="/admin/profesionales"
              className="inline-block mt-3 text-xs font-bold text-amber-400 hover:text-amber-300 underline"
            >
              Revisar pendientes
            </Link>
          )}
        </div>

        {/* Perfiles Aprobados */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-emerald-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Activos / Aprobados
            </span>
            <span className="text-xl">✓</span>
          </div>
          <p className="text-3xl font-black text-white mt-3">
            {approvedCount ?? 0}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Visibles en el directorio público
          </p>
        </div>

        {/* Total Profesionales */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Fichas
            </span>
            <span className="text-xl">🛠️</span>
          </div>
          <p className="text-3xl font-black text-white mt-3">
            {totalCount ?? 0}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Técnicos y empresas registrados
          </p>
        </div>

        {/* Total Usuarios */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Usuarios Registrados
            </span>
            <span className="text-xl">👥</span>
          </div>
          <p className="text-3xl font-black text-white mt-3">
            {totalUsers ?? 0}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Cuentas con acceso al sistema
          </p>
        </div>
      </div>

      {/* Módulo de Acciones Rápidas */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white">
          Gestión de Directorio
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>📋</span> Aprobación de Profesionales
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Verifica la documentación (cédula o RIF), teléfonos y localidades antes de hacer visible a un técnico o empresa en la web pública.
            </p>
            <div className="pt-2">
              <Link
                href="/admin/profesionales"
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-500 transition-colors"
              >
                Ir al listado de profesionales
              </Link>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>🔒</span> Auditoría y Seguridad
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Todas las aprobaciones, suspensiones y cambios administrativos quedan registrados automáticamente con fecha y usuario en la tabla de auditoría.
            </p>
            <div className="pt-2">
              <span className="text-xs text-slate-500 font-medium">
                Auditoría transaccional activa en Supabase
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
