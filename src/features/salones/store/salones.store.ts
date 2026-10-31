import { Salones } from "@/shared/types/db/tablas";
import { create } from "zustand";

type FormMode = "Nuevo" | "Editar";

type SalonesStore = {
  itemSelect: Salones | null;
  setItemSelect: (p: Salones | null) => void;

  formOpen: boolean;
  formMode: FormMode;
  formItem: Salones | null;

  openNuevo: () => void;
  openEditar: (item: Salones) => void;
  closeForm: () => void;
};

export const useSalonesStore = create<SalonesStore>((set) => ({
  itemSelect: null,
  setItemSelect: (p) => set({ itemSelect: p }),

  formOpen: false,
  formMode: "Nuevo",
  formItem: null,

  openNuevo: () =>
    set({
      formOpen: true,
      formMode: "Nuevo",
      formItem: null,
    }),

  openEditar: (item) =>
    set({
      formOpen: true,
      formMode: "Editar",
      formItem: item,
    }),

  closeForm: () =>
    set({
      formOpen: false,
      formItem: null,
    }),
}));