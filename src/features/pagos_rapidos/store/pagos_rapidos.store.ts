import { PagosRapidos } from "@/shared/types/db/tablas";
import { create } from "zustand";

type TipoPagosRapidosStore = {
  itemSelect: PagosRapidos | null;
  setItemSelect: (p: PagosRapidos | null) => void;
  reset: () => void;
};

export const usePagosRapidosStore = create<TipoPagosRapidosStore>((set) => ({
  itemSelect: null,
  setItemSelect: (p) => set({ itemSelect: p }),
  reset: () => set({ itemSelect: null }),
}));
