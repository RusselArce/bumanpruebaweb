import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Modificadores, Productos } from "@/shared/types/db/tablas";
import { useEmpresaStore } from "@/features/empresa/store/empresa.store";
import {
  insertarModificador,
  editarModificador,
  eliminarModificador,
  sincronizarModificadoresProducto,
  EditarModificadorPayload,
  InsertarModificadorPayload,
} from "../api/modificadores.api";

export const useInsertarModificadorMutation = () => {
  const qc = useQueryClient();
  const itemSelectEmpresa = useEmpresaStore((s) => s.itemSelect);

  return useMutation({
    mutationKey: ["insertar modificador"],
    mutationFn: async (p: InsertarModificadorPayload) => {
      const id_empresa = itemSelectEmpresa?.id;
      if (!id_empresa) throw new Error("No hay empresa seleccionada");
      return await insertarModificador({ ...p, id_empresa });
    },
    onSuccess: () => {
      toast.success("Modificador creado");
      qc.invalidateQueries({ queryKey: ["mostrar modificadores"] });
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Error al crear modificador");
    },
  });
};

export const useEditarModificadorMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["editar modificador"],
    mutationFn: async (p: EditarModificadorPayload) => {
      return await editarModificador(p);
    },
    onSuccess: () => {
      toast.success("Modificador actualizado");
      qc.invalidateQueries({ queryKey: ["mostrar modificadores"] });
    },
    onError: (e: any) => {
      qc.invalidateQueries({ queryKey: ["mostrar modificadores"] });
      toast.error(e?.message ?? "Error al editar modificador");
    },
  });
};

export const useEliminarModificadorMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["eliminar modificador"],
    mutationFn: async (id: Modificadores["id"]) => {
      await eliminarModificador(id);
    },
    onSuccess: () => {
      toast.success("Modificador eliminado");
      qc.invalidateQueries({ queryKey: ["mostrar modificadores"] });
    },
    onError: (e: any) => {
      qc.invalidateQueries({ queryKey: ["mostrar modificadores"] });
      toast.error(
        (e?.message ?? "").toLowerCase().includes("foreign key")
          ? "No se puede eliminar: está en uso por algún producto."
          : e?.message ?? "Error al eliminar modificador",
      );
    },
  });
};

type SincronizarModificadoresProductoArgs = {
  id_producto: Productos["id"];
  idsModificadores: number[];
};

export const useSincronizarModificadoresProductoMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["sincronizar modificadores producto"],
    mutationFn: async ({ id_producto, idsModificadores }: SincronizarModificadoresProductoArgs) => {
      await sincronizarModificadoresProducto(id_producto, idsModificadores);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: ["mostrar modificadores por producto", vars.id_producto],
      });
      qc.invalidateQueries({ queryKey: ["mostrar productos por categoria"] });
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Error al asignar modificadores al producto");
    },
  });
};
