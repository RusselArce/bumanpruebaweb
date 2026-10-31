// src/shared/hooks/metodos_pago.mutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MetodosPagos } from "@/shared/types/db/tablas";
import { useEmpresaStore } from "@/features/empresa/store/empresa.store";

import {
  insertarMetodoPago,
  editarMetodosPago,
  eliminarMetodoPago,
  EditarMetodosPagoPayload,
  InsertarMetodosPagoPayload,
} from "../api/metodos_pago.api";

export const useInsertarMetodosPagoMutation = () => {
  const qc = useQueryClient();
  const itemSelectEmpresa = useEmpresaStore((s) => s.itemSelect);

  return useMutation({
    
    mutationKey: ["insertar metodo pago"],
    mutationFn: async (p: InsertarMetodosPagoPayload) => {
      const id_empresa =   itemSelectEmpresa?.id
      if (!id_empresa) throw new Error("No hay empresa seleccionada");
      return await insertarMetodoPago({ ...p, id_empresa });
    },
    onSuccess: () => {
      toast.success("Método de pago creado");
      qc.invalidateQueries({
        queryKey: ["mostrar metodos pago"],
      });
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Error al crear método de pago");
    },
  });
};

export const useEditarMetodosPagoMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["editar metodo pago"],
    mutationFn: async (p: EditarMetodosPagoPayload) => {
      return await editarMetodosPago(p);
    },
    onSuccess: () => {
      toast.success("Método de pago actualizado");
      qc.invalidateQueries({
        queryKey: ["mostrar metodos pago"],
      });
    },
    onError: (e: any) => {
      qc.invalidateQueries({
        queryKey: ["mostrar metodos pago"],
      });
      toast.error(e?.message ?? "Error al editar método de pago");
    },
  });
};

export const useEliminarMetodosPagoMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["eliminar metodo pago"],
    mutationFn: async (id: MetodosPagos["id"]) => {
      await eliminarMetodoPago(id);
    },
    onSuccess: () => {
      toast.success("Método de pago eliminado");
      qc.invalidateQueries({
        queryKey: ["mostrar metodos pago"],
      });
    },
    onError: () => {
      qc.invalidateQueries({
        queryKey: ["mostrar metodos pago"],
      });
      toast.error("Error al eliminar método de pago");
    },
  });
};