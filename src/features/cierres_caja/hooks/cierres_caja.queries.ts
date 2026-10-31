import { useQuery } from "@tanstack/react-query";

import { CierresCajas } from "@/shared/types/db/tablas";
import {
  mostrarCierreAbiertoPorCaja,
  buscarCierresCaja,
  mostrarVentasEfectivoPorCierreCaja,
} from "../api/cierres_caja.api";

import { useEffect } from "react";
import { useCierresCajaStore } from "../store/cierres_caja.store";
import { useAsignacionesSucursalesStore } from "@/features/asignacion_sucursal/store/asignacion_sucursal";

/**
 * Mostrar cierres por caja
 */
export const useMostrarCierresPorCajaQuery = () => {
  const setItemSelect = useCierresCajaStore((s) => s.setItemSelect);
  const { itemSelect } = useAsignacionesSucursalesStore();

  const idCaja = itemSelect?.id_caja;

  const query = useQuery({
    queryKey: ["mostrar cierre abierto por caja", idCaja],
    queryFn: () => mostrarCierreAbiertoPorCaja(idCaja as number),
    enabled: !!idCaja,
  });

  useEffect(() => {
    if (query.data) {
      setItemSelect(query.data);
    } 
  }, [query.data]);

  return query;
};
export const useMostrarVentasEfectivoPorCierreCajaQuery = () => {
  
  const  itemSelect  = useCierresCajaStore((s)=>s.itemSelect);
  const query = useQuery({
    queryKey: ["mostrar ventas efectivo por cierre caja", itemSelect?.id],
    queryFn: () => mostrarVentasEfectivoPorCierreCaja(itemSelect?.id as number),
    enabled: !!itemSelect?.id,
  });
  return query;
};
/**
 * Buscar cierres de caja
 */
export const useBuscarCierresCajaQuery = (texto: string) => {
  const q = texto.trim();

  return useQuery({
    queryKey: ["buscar cierres caja", q],
    queryFn: () => buscarCierresCaja(q),
    enabled: q.length > 0,
    staleTime: 10_000,
  });
};
