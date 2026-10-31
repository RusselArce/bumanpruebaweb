import { Modificadores } from "@/shared/types/db/tablas";
import { create } from "zustand";

type TipoModificadoresStore = {
  itemSelect: Modificadores | null;
  setItemSelect: (p: Modificadores | null) => void;
  reset: () => void;
};

export const useModificadoresStore = create<TipoModificadoresStore>((set) => ({
  itemSelect: null,
  setItemSelect: (p) => set({ itemSelect: p }),
  reset: () => set({ itemSelect: null }),
}));
