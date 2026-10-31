import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ClientesProveedores } from "@/shared/types/db/tablas";
import { useEmpresaStore } from "@/features/empresa/store/empresa.store";

import {
  insertarClientes,
  editarClientesProveedores,
  eliminarClientes,
  EditarClientesPayload,
  InsertarClientesPayload,
} from "../api/clientes.api";

/** helpers */



export const useInsertarClientesMutation = () => {
  const qc = useQueryClient();
  const itemSelectEmpresa = useEmpresaStore((s) => s.itemSelect);

  return useMutation({
    mutationKey: ["insertar cliente"],
    mutationFn: async (p: InsertarClientesPayload) => {
      const id_empresa = itemSelectEmpresa?.id;
      if (!id_empresa) throw new Error("No hay empresa seleccionada");
      return await insertarClientes(p);
    },
    onSuccess: () => {
      toast.success("Cliente creado");
      qc.invalidateQueries({
        queryKey: ["mostrar clientes"],
      });
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Error al crear cliente");
    },
  });
};

/** EDITAR (1 campo: nombre) */

export const useEditarClientesMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["editar clientes"],
    mutationFn: async (p: EditarClientesPayload) => {
      return await editarClientesProveedores(p);
    },
    onSuccess: (_data) => {
      toast.success("Cliente actualizada");
      qc.invalidateQueries({
        queryKey: ["mostrar clientes"],
      });
    },
    onError: (e: any) => {
      qc.invalidateQueries({
        queryKey: ["mostrar clientes"],
      });
      toast.error(e?.message ?? "Error al editar cliente");
    },
  });
};

/** ELIMINAR */

export const useEliminarClientesMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["eliminar clientes"],
    mutationFn: async (id: ClientesProveedores["id"]) => {
      await eliminarClientes(id);
    },
    onSuccess: (_data) => {
      toast.success("Cliente eliminado");
      qc.invalidateQueries({
        queryKey: ["mostrar clientes"],
      });
    },
    onError: (e: any) => {
      qc.invalidateQueries({
        queryKey: ["mostrar clientes"],
      });
      toast.error( "Error al eliminar cliente");
    },
  });
};
