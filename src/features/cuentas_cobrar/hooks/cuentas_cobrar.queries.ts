import { useQuery } from "@tanstack/react-query";
import { useAsignacionesSucursalesStore } from "@/features/asignacion_sucursal/store/asignacion_sucursal";
import { mostrarAbonosPorVentas, mostrarCuentasPorCobrar } from "../api/cuentas_cobrar.api";

export const cuentasCobrarKeys = {
  all: ["cuentas-por-cobrar"] as const,
};

export const useCuentasPorCobrarQuery = () => {
  const itemSelect = useAsignacionesSucursalesStore((s) => s.itemSelect);
  const id_sucursal = itemSelect?.id_sucursal;

  return useQuery({
    queryKey: [...cuentasCobrarKeys.all, id_sucursal],
    queryFn: () => mostrarCuentasPorCobrar(id_sucursal as number),
    enabled: !!id_sucursal,
  });
};

export const useAbonosPorVentasQuery = (idsVenta: number[]) => {
  return useQuery({
    queryKey: [...cuentasCobrarKeys.all, "abonos", idsVenta],
    queryFn: () => mostrarAbonosPorVentas(idsVenta),
    enabled: idsVenta.length > 0,
  });
};
