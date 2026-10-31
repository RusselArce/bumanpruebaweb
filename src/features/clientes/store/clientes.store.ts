import { ClientesProveedores } from "@/shared/types/db/tablas";
import { create } from "zustand";

type ClientesStore = {
  // seleccionado
  itemSelect: ClientesProveedores | null;

  // modal
  isBuscadorOpen: boolean;

  // actions
  setItemSelect: (p: ClientesProveedores | null) => void;
  openBuscador: () => void;
  closeBuscador: () => void;
  toggleBuscador: () => void;
  reset: () => void;
};

export const useClientesStore = create<ClientesStore>((set) => ({
  itemSelect: null,
  isBuscadorOpen: false,

  setItemSelect: (p) => set({ itemSelect: p }),

  openBuscador: () => set({ isBuscadorOpen: true }),
  closeBuscador: () => set({ isBuscadorOpen: false }),
  toggleBuscador: () =>
    set((s) => ({ isBuscadorOpen: !s.isBuscadorOpen })),

  reset: () =>
    set({
      itemSelect: null,
      isBuscadorOpen: false,
    }),
}));