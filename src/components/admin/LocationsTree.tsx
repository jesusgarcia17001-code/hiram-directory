"use client";

import React, { useState, useMemo } from "react";
import { StateNode, MunicipalityNode, LocalityNode } from "@/services/locations";
import { LocationStatusToggle } from "@/components/admin/LocationStatusToggle";
import { LocationModal, LocationModalProps } from "@/components/admin/LocationModal";

interface LocationsTreeProps {
  initialStates: StateNode[];
}

export function LocationsTree({ initialStates }: LocationsTreeProps) {
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<LocationModalProps["mode"]>("create-state");
  const [defaultStateId, setDefaultStateId] = useState<string | undefined>(undefined);
  const [defaultMunicipalityId, setDefaultMunicipalityId] = useState<string | undefined>(undefined);
  const [itemToEdit, setItemToEdit] = useState<LocationModalProps["itemToEdit"]>(null);

  // Expansión de acordeones
  const [expandedStates, setExpandedStates] = useState<Record<string, boolean>>(() => {
    // Expandir por defecto el primer estado
    const initial: Record<string, boolean> = {};
    if (initialStates.length > 0) {
      initial[initialStates[0].id] = true;
    }
    return initial;
  });

  const [expandedMunicipalities, setExpandedMunicipalities] = useState<Record<string, boolean>>(() => {
    // Expandir por defecto los municipios del primer estado
    const initial: Record<string, boolean> = {};
    if (initialStates.length > 0 && initialStates[0].municipalities) {
      initialStates[0].municipalities.forEach((m) => {
        initial[m.id] = true;
      });
    }
    return initial;
  });

  // Filtro de búsqueda
  const [searchQuery, setSearchQuery] = useState("");

  const toggleState = (id: string) => {
    setExpandedStates((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleMunicipality = (id: string) => {
    setExpandedMunicipalities((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Extraer listas planas para los selects del modal
  const allStatesList = useMemo(
    () => initialStates.map((s) => ({ id: s.id, name: s.name })),
    [initialStates]
  );

  const allMunicipalitiesList = useMemo(() => {
    const list: { id: string; state_id: string; name: string }[] = [];
    initialStates.forEach((s) => {
      s.municipalities.forEach((m) => {
        list.push({ id: m.id, state_id: s.id, name: `${m.name} (${s.name})` });
      });
    });
    return list;
  }, [initialStates]);

  // Totales
  const totals = useMemo(() => {
    let totalStates = initialStates.length;
    let totalMunicipalities = 0;
    let totalLocalities = 0;
    let totalActiveLocalities = 0;
    let totalApprovedPros = 0;

    initialStates.forEach((s) => {
      totalMunicipalities += s.municipalities.length;
      s.municipalities.forEach((m) => {
        totalLocalities += m.localities.length;
        m.localities.forEach((l) => {
          if (l.is_active) totalActiveLocalities++;
          totalApprovedPros += l.professional_count;
        });
      });
    });

    return {
      totalStates,
      totalMunicipalities,
      totalLocalities,
      totalActiveLocalities,
      totalApprovedPros,
    };
  }, [initialStates]);

  // Handlers para abrir el modal
  const handleOpenCreateState = () => {
    setModalMode("create-state");
    setDefaultStateId(undefined);
    setDefaultMunicipalityId(undefined);
    setItemToEdit(null);
    setModalOpen(true);
  };

  const handleOpenCreateMunicipality = (stateId: string) => {
    setModalMode("create-municipality");
    setDefaultStateId(stateId);
    setDefaultMunicipalityId(undefined);
    setItemToEdit(null);
    setModalOpen(true);
  };

  const handleOpenCreateLocality = (stateId: string, munId: string) => {
    setModalMode("create-locality");
    setDefaultStateId(stateId);
    setDefaultMunicipalityId(munId);
    setItemToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (
    type: "state" | "municipality" | "locality",
    node: { id: string; name: string; slug: string; professional_count: number }
  ) => {
    setModalMode("edit");
    setItemToEdit({
      type,
      id: node.id,
      name: node.name,
      slug: node.slug,
      professional_count: node.professional_count,
    });
    setModalOpen(true);
  };

  // Filtrado simple por texto
  const query = searchQuery.trim().toLowerCase();
  const filteredStates = useMemo(() => {
    if (!query) return initialStates;

    return initialStates
      .map((s) => {
        const stateMatches = s.name.toLowerCase().includes(query) || s.slug.includes(query);

        const filteredMuns = s.municipalities
          .map((m) => {
            const munMatches = m.name.toLowerCase().includes(query) || m.slug.includes(query);
            const filteredLocs = m.localities.filter(
              (l) => l.name.toLowerCase().includes(query) || l.slug.includes(query)
            );

            if (munMatches || filteredLocs.length > 0) {
              return {
                ...m,
                localities: filteredLocs.length > 0 ? filteredLocs : m.localities,
              };
            }
            return null;
          })
          .filter(Boolean) as MunicipalityNode[];

        if (stateMatches || filteredMuns.length > 0) {
          return {
            ...s,
            municipalities: filteredMuns.length > 0 ? filteredMuns : s.municipalities,
          };
        }
        return null;
      })
      .filter(Boolean) as StateNode[];
  }, [initialStates, query]);

  return (
    <div className="space-y-6">
      {/* Barra de métricas y acciones superiores */}
      <div className="bg-brand-surface p-5 rounded-2xl border border-brand-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Contadores */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200">
            <span className="text-slate-500">Estados: </span>
            <strong className="text-brand-text-primary font-bold">{totals.totalStates}</strong>
          </div>
          <div className="px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200">
            <span className="text-slate-500">Municipios: </span>
            <strong className="text-brand-text-primary font-bold">{totals.totalMunicipalities}</strong>
          </div>
          <div className="px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200">
            <span className="text-slate-500">Localidades: </span>
            <strong className="text-brand-text-primary font-bold">
              {totals.totalActiveLocalities} activas / {totals.totalLocalities} totales
            </strong>
          </div>
          <div className="px-3 py-1.5 bg-blue-50 text-blue-900 rounded-xl border border-blue-200">
            <span>Técnicos aprobados indexados: </span>
            <strong className="font-bold">{totals.totalApprovedPros}</strong>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenCreateState}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-primary hover:bg-brand-primary/90 rounded-xl shadow-xs transition-colors"
          >
            <span>+</span> Nuevo Estado
          </button>
        </div>
      </div>

      {/* Buscador rápido */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filtrar estados, municipios, ciudades o zonas rurales..."
          className="w-full px-4 py-2.5 text-xs bg-brand-surface border border-brand-border rounded-xl text-brand-text-primary placeholder:text-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary shadow-xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
          >
            Limpiar ✕
          </button>
        )}
      </div>

      {/* Árbol jerárquico */}
      <div className="space-y-4">
        {filteredStates.length === 0 ? (
          <div className="bg-brand-surface p-8 text-center rounded-2xl border border-brand-border text-sm text-brand-text-muted">
            No se encontraron ubicaciones que coincidan con &quot;{searchQuery}&quot;.
          </div>
        ) : (
          filteredStates.map((state) => {
            const isStateExpanded = expandedStates[state.id] ?? true;

            return (
              <div
                key={state.id}
                className="bg-brand-surface rounded-2xl border border-brand-border shadow-xs overflow-hidden"
              >
                {/* 1. Nivel Estado (Fila Principal) */}
                <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleState(state.id)}
                      className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 transition-colors"
                      title={isStateExpanded ? "Colapsar estado" : "Expandir estado"}
                    >
                      {isStateExpanded ? "▼" : "▶"}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold tracking-tight">
                          {state.name}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                          /{state.slug}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {state.municipalities.length} municipio(s) registrados
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-blue-900/60 text-blue-200 border border-blue-700/60">
                      👥 {state.professional_count} técnicos aprobados
                    </span>

                    <LocationStatusToggle
                      type="state"
                      id={state.id}
                      name={state.name}
                      isActive={state.is_active}
                      professionalCount={state.professional_count}
                    />

                    <button
                      type="button"
                      onClick={() => handleOpenEdit("state", state)}
                      className="px-2.5 py-1 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenCreateMunicipality(state.id)}
                      className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-xs"
                    >
                      + Municipio
                    </button>
                  </div>
                </div>

                {/* 2. Nivel Municipios (Hijos del Estado) */}
                {isStateExpanded && (
                  <div className="p-4 bg-slate-50/60 border-t border-brand-border space-y-3">
                    {state.municipalities.length === 0 ? (
                      <p className="text-xs text-brand-text-muted italic py-2 pl-4">
                        Este estado aún no tiene municipios registrados. Haz clic en &quot;+ Municipio&quot; para añadir el primero.
                      </p>
                    ) : (
                      state.municipalities.map((mun) => {
                        const isMunExpanded = expandedMunicipalities[mun.id] ?? true;

                        return (
                          <div
                            key={mun.id}
                            className="bg-brand-surface rounded-xl border border-brand-border shadow-2xs overflow-hidden"
                          >
                            {/* Cabecera del Municipio */}
                            <div className="p-3 bg-slate-100/80 flex flex-wrap items-center justify-between gap-2 border-b border-brand-border">
                              <div className="flex items-center gap-2.5">
                                <button
                                  type="button"
                                  onClick={() => toggleMunicipality(mun.id)}
                                  className="w-5 h-5 rounded-md bg-white border border-slate-300 hover:bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 transition-colors"
                                  title={isMunExpanded ? "Colapsar municipio" : "Expandir municipio"}
                                >
                                  {isMunExpanded ? "▼" : "▶"}
                                </button>

                                <span className="text-xs font-bold text-brand-text-primary">
                                  Municipio {mun.name}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500">
                                  /{mun.slug}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  ({mun.localities.length} localidades)
                                </span>
                              </div>

                              <div className="flex items-center gap-2.5">
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                                  👥 {mun.professional_count} técnicos
                                </span>

                                <LocationStatusToggle
                                  type="municipality"
                                  id={mun.id}
                                  name={mun.name}
                                  isActive={mun.is_active}
                                  professionalCount={mun.professional_count}
                                />

                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit("municipality", mun)}
                                  className="px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-200 rounded-md transition-colors border border-slate-300"
                                >
                                  Editar
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenCreateLocality(state.id, mun.id)}
                                  className="px-2 py-0.5 text-[11px] font-semibold text-brand-primary hover:bg-blue-50 rounded-md transition-colors border border-blue-200"
                                >
                                  + Localidad / Zona Rural
                                </button>
                              </div>
                            </div>

                            {/* 3. Nivel Localidades (Hijos del Municipio) */}
                            {isMunExpanded && (
                              <div className="p-3 bg-brand-surface divide-y divide-slate-100">
                                {mun.localities.length === 0 ? (
                                  <p className="text-[11px] text-brand-text-muted italic py-1 pl-2">
                                    No hay localidades creadas en este municipio. Puedes registrar ciudades, pueblos o zonas rurales.
                                  </p>
                                ) : (
                                  mun.localities.map((loc) => (
                                    <div
                                      key={loc.id}
                                      className="py-2 px-2 flex flex-wrap items-center justify-between gap-2 hover:bg-slate-50/80 rounded-lg transition-colors"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="text-slate-400 text-xs">📍</span>
                                        <span className="text-xs font-medium text-brand-text-primary">
                                          {loc.name}
                                        </span>
                                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                          /{loc.slug}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-2.5">
                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">
                                          {loc.professional_count}{" "}
                                          {loc.professional_count === 1
                                            ? "técnico"
                                            : "técnicos"}
                                        </span>

                                        <LocationStatusToggle
                                          type="locality"
                                          id={loc.id}
                                          name={loc.name}
                                          isActive={loc.is_active}
                                          professionalCount={loc.professional_count}
                                        />

                                        <button
                                          type="button"
                                          onClick={() => handleOpenEdit("locality", loc)}
                                          className="px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                                        >
                                          Editar
                                        </button>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Reutilizable para Creación y Edición */}
      <LocationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        states={allStatesList}
        municipalities={allMunicipalitiesList}
        defaultStateId={defaultStateId}
        defaultMunicipalityId={defaultMunicipalityId}
        itemToEdit={itemToEdit}
      />
    </div>
  );
}
