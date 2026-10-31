import { TiposComprobantes } from "@/shared/types/db/tablas";
import { create } from "zustand";
type TipoComprobantesStore = {
  itemSelect: TiposComprobantes | null;
  setItemSelect: (p: TiposComprobantes | null) => void;
};
export const useTipoComprobanteStore = create<TipoComprobantesStore>((set) => ({
  itemSelect: null,
  setItemSelect: (p) => set({ itemSelect: p }),
}));
