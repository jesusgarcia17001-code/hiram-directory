import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface LocalityNode {
  id: string;
  municipality_id: string;
  name: string;
  slug: string;
  is_active: boolean;
  professional_count: number;
}

export interface MunicipalityNode {
  id: string;
  state_id: string;
  name: string;
  slug: string;
  is_active: boolean;
  professional_count: number;
  localities: LocalityNode[];
}

export interface StateNode {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  professional_count: number;
  municipalities: MunicipalityNode[];
}

export interface GroupedLocalities {
  municipalityName: string;
  stateName: string;
  localities: {
    id: string;
    name: string;
    slug: string;
  }[];
}

/**
 * Consulta el árbol completo de ubicaciones con conteo de profesionales aprobados
 * a nivel de estado, municipio y localidad.
 * Utiliza la sesión del admin (RLS).
 */
export async function getLocationsTree(): Promise<StateNode[]> {
  const supabase = await createClient();

  const [statesRes, munRes, locRes, profRes] = await Promise.all([
    supabase.from("states").select("id, name, slug, is_active").order("name", { ascending: true }),
    supabase.from("municipalities").select("id, state_id, name, slug, is_active").order("name", { ascending: true }),
    supabase.from("localities").select("id, municipality_id, name, slug, is_active").order("name", { ascending: true }),
    supabase.from("professionals").select("locality_id").eq("status", "approved"),
  ]);

  if (statesRes.error) {
    console.error("Error al obtener estados:", statesRes.error.message);
    return [];
  }

  // Mapear conteo de profesionales por localidad
  const locCountMap = new Map<string, number>();
  (profRes.data || []).forEach((p) => {
    if (p.locality_id) {
      locCountMap.set(p.locality_id, (locCountMap.get(p.locality_id) || 0) + 1);
    }
  });

  const localities = (locRes.data || []).map((l) => ({
    ...l,
    professional_count: locCountMap.get(l.id) || 0,
  }));

  // Construir mapa de municipios con sus localidades y acumular conteo
  const munMap = new Map<string, MunicipalityNode>();
  (munRes.data || []).forEach((m) => {
    munMap.set(m.id, {
      ...m,
      professional_count: 0,
      localities: [],
    });
  });

  localities.forEach((l) => {
    const m = munMap.get(l.municipality_id);
    if (m) {
      m.localities.push(l);
      m.professional_count += l.professional_count;
    }
  });

  // Construir estados con sus municipios y acumular conteo
  const stateNodes: StateNode[] = (statesRes.data || []).map((s) => {
    const stateMuns = Array.from(munMap.values()).filter((m) => m.state_id === s.id);
    const totalProf = stateMuns.reduce((acc, curr) => acc + curr.professional_count, 0);

    return {
      ...s,
      professional_count: totalProf,
      municipalities: stateMuns,
    };
  });

  return stateNodes;
}

/**
 * Consulta solo las localidades activas agrupadas por municipio para los
 * formularios de perfil y registro.
 */
export async function getActiveLocalitiesGrouped(): Promise<GroupedLocalities[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("localities")
    .select(
      `
      id,
      name,
      slug,
      is_active,
      municipalities (
        id,
        name,
        is_active,
        states (
          id,
          name,
          is_active
        )
      )
    `
    )
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error || !data) {
    console.error("Error al obtener localidades agrupadas:", error?.message);
    return [];
  }

  // Filtrar que municipio y estado también estén activos
  const activeLocs = data.filter((l: any) => {
    const mun = l.municipalities;
    const state = mun?.states;
    return mun && mun.is_active && state && state.is_active;
  });

  // Agrupar por municipio
  const groupMap = new Map<string, GroupedLocalities>();

  activeLocs.forEach((l: any) => {
    const munName = l.municipalities.name;
    const stateName = l.municipalities.states.name;
    const groupKey = `${stateName} - ${munName}`;

    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, {
        municipalityName: munName,
        stateName,
        localities: [],
      });
    }

    groupMap.get(groupKey)!.localities.push({
      id: l.id,
      name: l.name,
      slug: l.slug,
    });
  });

  return Array.from(groupMap.values());
}
