import { CierresCajas } from "@/shared/types/db/tablas";
import { create } from "zustand";

type CierresCajasStore = {
  itemSelect: CierresCajas | null;
  setItemSelect: (cierres_cajas: CierresCajas | null) => void;
  stateAperturaCaja:boolean;
  setStateAperturaCaja:(p:boolean)=>void;
  stateCierreCaja:boolean;
   setStateCierreCaja:(p:boolean)=>void;
};
export const useCierresCajaStore = create<CierresCajasStore>((set) => ({
  itemSelect: null,
  setItemSelect: (p) => set({ itemSelect: p }),
  stateAperturaCaja:false,
  setStateAperturaCaja:(p)=>set({stateAperturaCaja:p}),
   stateCierreCaja:false,
  setStateCierreCaja:(p)=>set({stateCierreCaja:p}),
}));
