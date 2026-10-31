import { useQuery } from "@tanstack/react-query";

import { MovimientosCajas } from "@/shared/types/db/tablas";
import {
  mostrarVentasMovimientosCaja,
  mostrarMovimientosCajaPorTipo,
} from "../api/movimientos_caja.api";
import { useMovimientosCajaStore } from "../store/movimientos_caja.store";
import { useEffect } from "react";
import { useCierresCajaStore } from "@/features/cierres_caja/store/cierres_caja.store";

export const useMostrarVentasMovimientosCajaQuery = (

) => {

const itemSelect= useCierresCajaStore((s)=>s.itemSelect)
  return useQuery<MovimientosCajas[]>({
    queryKey: ["mostrar movimientos caja", itemSelect?.id],
    queryFn: () => mostrarVentasMovimientosCaja(itemSelect?.id as number),
    enabled: !!itemSelect,
  });


};

export const useMostrarMovimientosCajaPorTipoQuery = (tipo_movimiento: string) => {
  const itemSelect = useCierresCajaStore((s) => s.itemSelect);

  return useQuery<MovimientosCajas[]>({
    queryKey: ["mostrar movimientos caja por tipo", tipo_movimiento, itemSelect?.id],
    queryFn: () =>
      mostrarMovimientosCajaPorTipo(itemSelect?.id as number, tipo_movimiento),
    enabled: !!itemSelect,
  });
};