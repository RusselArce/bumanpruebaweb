import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useVentasStore } from "../store/ventas.store";
import {
  insertarVentas,
  eliminarVentasIncompletas,
  type VentasInsert,
  EliminarVentasIncompletasPayload,
  EnviarVentaACocinaPayload,
  enviarVentaAcocina,
  mostrarVentaActivaPorMesa,
  mostrarVentasActivasPorSucursal,
  finalizarVenta,
  dividirVenta,
} from "../api/ventas.api";
import { useFormattedDate } from "@/shared/hooks/fecha_actual.hook";
import { insertarDetalleVentas } from "@/features/detalle_ventas/api/detalle_ventas.api";
import type { DetalleVentasRpc, Ventas } from "@/shared/types/db/tablas";
import { toast } from "sonner";
import { useMesasStore } from "@/features/mesas/store/mesas.store";
import { useAsignacionesSucursalesStore } from "@/features/asignacion_sucursal/store/asignacion_sucursal";
import { useNavigate } from "react-router-dom";

type InsertarVentaArgs = {
  venta: Omit<VentasInsert, "fecha">;
  detalle: Omit<DetalleVentasRpc, "_id_venta">;
};

export const useInsertarVentasMutation = () => {
  const queryClient = useQueryClient();

  const idventa = useVentasStore((s) => s.idventa);
  const setIdventa = useVentasStore((s) => s.setIdventa);

  const fechaactual = useFormattedDate();

  return useMutation({
    mutationKey: ["insertar venta"],
    mutationFn: async ({ venta, detalle }: InsertarVentaArgs) => {
      let ventaId = idventa;

      // 1) si no hay venta abierta, la creamos UNA vez y guardamos idventa en zustand
      if (ventaId === 0 || undefined) {
        const pVentas: VentasInsert = { fecha: fechaactual, ...venta };
        const result = await insertarVentas(pVentas);

        if (!result?.id) throw new Error("No se pudo crear la venta");

        ventaId = result.id;
        setIdventa(ventaId); // ✅ CLAVE para no repetir creación
        const pDetalle: DetalleVentasRpc = {
          _id_venta: ventaId,
          ...detalle,
        };

        await insertarDetalleVentas(pDetalle);
      } else {
        // 2) insert del detalle con el id correcto
        const pDetalle: DetalleVentasRpc = {
          _id_venta: ventaId,
          ...detalle,
        };

        await insertarDetalleVentas(pDetalle);
      }

      return { ventaId };
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mostrar detalle venta"] });
    },
  });
};
export const useEliminarVentasIncompletasMutate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["eliminar ventas incompletas"],
    mutationFn: async (payload: EliminarVentasIncompletasPayload) => {
      await eliminarVentasIncompletas(payload);
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mostrar detalle venta"] });
    },
  });
};
export const useEnviarVentaACocinaMutate = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationKey: ["enviar venta a cocina"],
    mutationFn: async (payload: EnviarVentaACocinaPayload) => {
      await enviarVentaAcocina(payload);
    },
    onError: (error: any) => toast.error(error?.message ?? "Error"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mostrar detalle venta"] });
      queryClient.invalidateQueries({ queryKey: ["mostrar ventas"] });
      queryClient.invalidateQueries({ queryKey: ["mostrar mesas"] });
      navigate("/");
    },
  });
};
export const useFinalizarVentaMutate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["finalizar venta"],
    mutationFn: async (
      payload: Pick<
        Ventas,
        | "id"
        | "id_mesa"
        | "monto_total"
        | "sub_total"
        | "total_impuestos"
        | "valor_impuesto"
        | "propina"
        | "id_cliente"
        | "saldo"
      > & { liberarMesa?: boolean },
    ) => {
      await finalizarVenta(payload);
    },
    onError: (error: any) => toast.error(error?.message ?? "Error"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mostrar detalle venta"] });
      queryClient.invalidateQueries({ queryKey: ["mostrar ventas"] });
      queryClient.invalidateQueries({ queryKey: ["mostrar mesas"] });
    },
  });
};
export type DividirVentaArgs = {
  ventaBase: Pick<
    Ventas,
    "id_usuario" | "id_sucursal" | "id_empresa" | "id_cierre_caja" | "id_mesa"
  > &
    Partial<Pick<Ventas, "nombre_ref" | "estado">>;
  idsDetalle: number[];
};

export const useDividirVentaMutation = () => {
  const queryClient = useQueryClient();
  const fechaactual = useFormattedDate();

  return useMutation({
    mutationKey: ["dividir venta"],
    mutationFn: async ({ ventaBase, idsDetalle }: DividirVentaArgs) => {
      if (!idsDetalle.length) throw new Error("Selecciona al menos un producto para dividir.");

      return dividirVenta({
        venta: { ...ventaBase, fecha: fechaactual },
        idsDetalle,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mostrar detalle venta"] });
    },
  });
};

export const ventasKeys = {
  all: ["ventas"] as const,
  porMesa: (id_mesa: number | null | undefined) =>
    [...ventasKeys.all, "por-mesa", id_mesa] as const,
};
export type mostrarVentaPorMesaPayload = Pick<Ventas, "id_mesa">;
export function useMostrarVentaActivaPorMesaQuery() {
  const setIdventa = useVentasStore((s) => s.setIdventa);
  const { itemSelect } = useMesasStore();

  return useQuery({
    queryKey: ["mostrar ventas por mesa", itemSelect?.id],

    queryFn: async () => {
      // enabled ya garantiza que id_mesa existe
      const venta = await mostrarVentaActivaPorMesa({
        id_mesa: itemSelect?.id as number,
      });
      // ✅ aquí seteas el idventa para que el resto del sistema sea homogéneo
      venta?.id === undefined ? setIdventa(0) : setIdventa(venta?.id);

      // if (venta?.id!=undefined) {
      //     setIdventa(venta?.id as number);
      // }

      return venta;
    },
    // la mesa "para_llevar" puede tener varias ventas no confirmadas a la vez
    // (una por pedido), así que no tiene sentido "resumir" una sola por mesa
    enabled: !!itemSelect && (itemSelect.nombre ?? "").trim().toLowerCase() !== "para_llevar",
  });
}

// ✅ conteo de pedidos activos (sin cobrar) por sucursal, usado para el
// resumen "X para llevar / Y en mesas" del sidebar de salones
export function useMostrarVentasActivasPorSucursalQuery() {
  const itemSelect = useAsignacionesSucursalesStore((s) => s.itemSelect);
  const id_sucursal = itemSelect?.id_sucursal;

  return useQuery({
    queryKey: ["mostrar ventas activas por sucursal", id_sucursal],
    queryFn: () => mostrarVentasActivasPorSucursal(id_sucursal as number),
    enabled: !!id_sucursal,
  });
}

