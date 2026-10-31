import { Empresas } from "@/shared/types/db/tablas";
import { create } from "zustand";

type EmpresaStore = {
  itemSelect: Empresas | null;
  setItemSelect: (empresa: Empresas | null) => void;
};
export const useEmpresaStore = create<EmpresaStore>((set) => ({
  itemSelect: null,
  setItemSelect: (p) => set({ itemSelect: p }),
}));
