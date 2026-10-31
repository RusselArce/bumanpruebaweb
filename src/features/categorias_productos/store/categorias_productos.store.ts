import { Categorias } from "@/shared/types/db/tablas";
import { create } from "zustand";

type CategoriasProductosStore = {
    itemSelect:Categorias|null;
    setItemSelect:(p:Categorias|null)=>void;
}

export const useCategoriasProductosStore = create<CategoriasProductosStore>((set)=>({
   itemSelect:null,
   setItemSelect: (p)=>set({itemSelect:p})
}))