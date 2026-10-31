import { Mesas } from "@/shared/types/db/tablas";
import { create } from "zustand";

type MesasStore = {
  itemSelect: Mesas | null;
  setItemSelect: (p: Mesas) => void;
};

export const useMesasStore = create<MesasStore>((set) => ({
  itemSelect: null,
  setItemSelect: (p) => set({ itemSelect: p }),
}));
