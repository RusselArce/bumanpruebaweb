import { Categorias, MovimientosCajas } from "@/shared/types/db/tablas";
import { create } from "zustand";

type MovimientosCajaStore = {
    itemSelect:MovimientosCajas|null;
    setItemSelect:(p:MovimientosCajas|null)=>void;
}

export const useMovimientosCajaStore = create<MovimientosCajaStore>((set)=>({
   itemSelect:null,
   setItemSelect: (p)=>set({itemSelect:p})
}))