import { DetallesVentas } from "@/shared/types/db/tablas";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  editarEstadoDetallesVenta,
  editarNotaDetalleVenta,
  editarPrioridadDetalleVenta,
  eliminarDetalleVenta,
  vaciarDetalleVentaNueva,
} from "../api/detalle_ventas.api";

export const useEditarEstadoMutate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["editar estado de detalle venta"],
    mutationFn: async (p: Pick<DetallesVentas, "id" | "estado">) => {
      await editarEstadoDetallesVenta(p);
    },
    onError: (error: any) => toast.error(error?.message ?? "Error"),
  });
};
export const useEditarNotaDetalleVentaMutate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["editar nota de detalle venta"],
    mutationFn: async (p: Pick<DetallesVentas, "id" | "nota">) => {
      await editarNotaDetalleVenta(p);
    },
    onSuccess: (_data, vars) => {
      toast.success("Nota editada");
      // ✅ si no tienes salonId, invalida todo lo relacionado a mesas

      queryClient.invalidateQueries({
        queryKey: ["mostrar detalle venta"],
      });
    },
    onError: (error: any) => toast.error(error?.message ?? "Error"),
  });
};
export const useEditarPrioridadDetalleVentaMutate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["editar prioridad de detalle venta"],
    mutationFn: async (p: Pick<DetallesVentas, "id" | "prioridad">) => {
      await editarPrioridadDetalleVenta(p);
    },
    onSuccess: (_data, vars) => {
      toast.success(vars.prioridad ? "Pedido marcado con prioridad" : "Prioridad quitada");
      queryClient.invalidateQueries({
        queryKey: ["mostrar detalle venta"],
      });
    },
    onError: (error: any) => toast.error(error?.message ?? "Error"),
  });
};
export const useVaciarDetalleVentaNuevaMutate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["vaciar detalle venta nueva"],
    mutationFn: async (p: { id_venta: number }) => {
      await vaciarDetalleVentaNueva(p);
    },
    onSuccess: () => {
      toast.success("Pedido vaciado");
      queryClient.invalidateQueries({ queryKey: ["mostrar detalle venta"] });
    },
    onError: (error: any) => toast.error(error?.message ?? "Error"),
  });
};
export const useEliminarDetalleVentaMutate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["eliminar detalle venta"],
    mutationFn: async (p: { id: number }) => {
      await eliminarDetalleVenta(p);
    },
    onSuccess: () => {
      toast.success("Item eliminado");
      queryClient.invalidateQueries({ queryKey: ["mostrar detalle venta"] });
      // queryClient.invalidateQueries({
      //   queryKey: ["mostrar venta activa por mesa"],
      // });
      // queryClient.invalidateQueries({ queryKey: ["mostrar mesas"] }); // si renderizas mesas por estado
    },
    onError: (error: any) => toast.error(error?.message ?? "Error"),
  });
};
