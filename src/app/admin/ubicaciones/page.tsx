import React from "react";
import Link from "next/link";
import { getLocationsTree } from "@/services/locations";
import { LocationsTree } from "@/components/admin/LocationsTree";

export const metadata = {
  title: "Gestión de Ubicaciones | Administración",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminUbicacionesPage() {
  const states = await getLocationsTree();

  return (
    <div className="space-y-6">
      {/* Encabezado y migas de pan */}
      <div>
        <nav className="flex items-center gap-2 text-xs text-slate-400 mb-2">
          <Link href="/admin" className="hover:text-white transition-colors">
            Administración
          </Link>
          <span>/</span>
          <span className="text-white font-medium">Ubicaciones</span>
        </nav>

        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Estructura Geográfica y Cobertura
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Administra la jerarquía territorial de tres niveles:{" "}
          <strong className="text-slate-200">Estado &gt; Municipio &gt; Localidad</strong> (incluyendo
          ciudades, pueblos y zonas rurales). Activa o desactiva zonas sin perder información.
        </p>
      </div>

      {/* Árbol interactivo */}
      <LocationsTree initialStates={states} />
    </div>
  );
}
