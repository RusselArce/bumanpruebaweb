import { MetodosPagos } from "@/shared/types/db/tablas";
import { create } from "zustand";
type TipoMetodosPagoStore = {
  itemSelect: MetodosPagos | null;
  setItemSelect: (p: MetodosPagos | null) => void;
  reset: () => void;
};
export const useMetodosPagoStore = create<TipoMetodosPagoStore>((set) => ({
  itemSelect: null,
  setItemSelect: (p) => set({ itemSelect: p }),
  reset: () => set({ itemSelect: null }),
}));
