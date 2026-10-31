import { create } from "zustand";
import type { ID, Ventas } from "@/shared/types/db/tablas";

type VentasStoreState = {
  total: number;
  idventa: ID;
  stateCobrarModal: boolean;

  tipocobro: string;
  stateMetodosPago: boolean;
  porcentajeCambio: number;
  dataventas: Ventas[];

  // ✅ nombre/referencia del pedido "para llevar", pedido ANTES de agregar el
  // primer producto (así cocina lo puede identificar de inmediato).
  nombreRefParaLlevar: string | null;

  setIdventa: (id: ID) => void;
  setTotal: (total: number) => void;
  setStateCobrarModal: () => void;
  setNombreRefParaLlevar: (nombre: string | null) => void;
  resetState: () => void;
};

const initialState = {
  total: 0,
  idventa: 0 as ID,
  stateCobrarModal: false,

  tipocobro: "",
  stateMetodosPago: false,
  porcentajeCambio: 0,
  dataventas: [] as Ventas[],
  nombreRefParaLlevar: null as string | null,
};

export const useVentasStore = create<VentasStoreState>((set) => ({
  ...initialState,

  setIdventa: (id) => set({ idventa: id }),
  setTotal: (total) => set({ total }),

  setStateCobrarModal: () =>
    set((s) => ({ stateCobrarModal: !s.stateCobrarModal })),

  setNombreRefParaLlevar: (nombre) => set({ nombreRefParaLlevar: nombre }),

  resetState: () => set(initialState),
}));