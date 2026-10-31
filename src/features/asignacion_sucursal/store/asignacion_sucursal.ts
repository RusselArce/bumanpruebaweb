import { AsignacionesSucursales, Empresas, Sucursales } from "@/shared/types/db/tablas";
import { create } from "zustand";
import { useEmpresaStore } from "@/features/empresa/store/empresa.store";

export const ASIGNACION_ACTIVA_STORAGE_KEY = "buman_id_asignacion_activa";

type AsignacionConEmpresa = AsignacionesSucursales & {
  sucursales?: (Sucursales & { empresa?: Empresas | null }) | null;
};

type AsignacionesSucursalesStore = {
  itemSelect: AsignacionConEmpresa | null;
  /** Todas las sucursales/empresas a las que la identidad logueada tiene acceso. */
  todasLasAsignaciones: AsignacionConEmpresa[];
  setItemSelect: (a: AsignacionConEmpresa | null) => void;
  /** Reemplaza la lista completa y, si hace falta, resuelve cuál queda activa. */
  setTodasLasAsignaciones: (lista: AsignacionConEmpresa[]) => void;
  /** Elección explícita del usuario (selector de empresa) — se recuerda para la próxima sesión. */
  elegirAsignacion: (a: AsignacionConEmpresa) => void;
};

function aplicarEmpresaDesdeAsignacion(a: AsignacionConEmpresa | null) {
  useEmpresaStore.getState().setItemSelect(a?.sucursales?.empresa ?? null);
}

function elegirActivaInicial(
  lista: AsignacionConEmpresa[],
  actual: AsignacionConEmpresa | null,
): AsignacionConEmpresa | null {
  if (actual && lista.some((a) => a.id === actual.id)) return actual;
  if (lista.length === 0) return null;

  let guardada: string | null = null;
  try {
    guardada = localStorage.getItem(ASIGNACION_ACTIVA_STORAGE_KEY);
  } catch {
    // localStorage no disponible (SSR/incógnito estricto): seguimos sin recordar elección.
  }
  const porGuardada = guardada ? lista.find((a) => String(a.id) === guardada) : undefined;
  if (porGuardada) return porGuardada;

  // Caso más común: una sola opción → se autoselecciona, cero fricción nueva.
  return lista.length === 1 ? lista[0] : null;
}

export const useAsignacionesSucursalesStore = create<AsignacionesSucursalesStore>((set, get) => ({
  itemSelect: null,
  todasLasAsignaciones: [],

  setItemSelect: (p) => {
    set({ itemSelect: p });
    aplicarEmpresaDesdeAsignacion(p);
  },

  setTodasLasAsignaciones: (lista) => {
    const activa = elegirActivaInicial(lista, get().itemSelect);
    set({ todasLasAsignaciones: lista, itemSelect: activa });
    aplicarEmpresaDesdeAsignacion(activa);
  },

  elegirAsignacion: (a) => {
    try {
      localStorage.setItem(ASIGNACION_ACTIVA_STORAGE_KEY, String(a.id));
    } catch {
      // idem: si no hay localStorage, la elección solo dura la sesión actual.
    }
    set({ itemSelect: a });
    aplicarEmpresaDesdeAsignacion(a);
  },
}));
