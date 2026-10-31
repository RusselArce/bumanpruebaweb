import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PagosRapidos } from "@/shared/types/db/tablas";
import { useEmpresaStore } from "@/features/empresa/store/empresa.store";

import {
  insertarPagoRapido,
  editarPagoRapido,
  eliminarPagoRapido,
  EditarPagosRapidosPayload,
  InsertarPagosRapidosPayload,
} from "../api/pagos_rapidos.api";

export const useInsertarPagosRapidosMutation = () => {
  const qc = useQueryClient();
  const itemSelectEmpresa = useEmpresaStore((s) => s.itemSelect);

  return useMutation({
    mutationKey: ["insertar pago rapido"],
    mutationFn: async (p: InsertarPagosRapidosPayload) => {
      const id_empresa = itemSelectEmpresa?.id;
      if (!id_empresa) throw new Error("No hay empresa seleccionada");
      return await insertarPagoRapido({ ...p, id_empresa });
    },
    onSuccess: () => {
      toast.success("Pago rápido creado");
      qc.invalidateQueries({ queryKey: ["mostrar pagos rapidos"] });
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Error al crear pago rápido");
    },
  });
};

export const useEditarPagosRapidosMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["editar pago rapido"],
    mutationFn: async (p: EditarPagosRapidosPayload) => {
      return await editarPagoRapido(p);
    },
    onSuccess: () => {
      toast.success("Pago rápido actualizado");
      qc.invalidateQueries({ queryKey: ["mostrar pagos rapidos"] });
    },
    onError: (e: any) => {
      qc.invalidateQueries({ queryKey: ["mostrar pagos rapidos"] });
      toast.error(e?.message ?? "Error al editar pago rápido");
    },
  });
};

export const useEliminarPagosRapidosMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["eliminar pago rapido"],
    mutationFn: async (id: PagosRapidos["id"]) => {
      await eliminarPagoRapido(id);
    },
    onSuccess: () => {
      toast.success("Pago rápido eliminado");
      qc.invalidateQueries({ queryKey: ["mostrar pagos rapidos"] });
    },
    onError: () => {
      qc.invalidateQueries({ queryKey: ["mostrar pagos rapidos"] });
      toast.error("Error al eliminar pago rápido");
    },
  });
};
