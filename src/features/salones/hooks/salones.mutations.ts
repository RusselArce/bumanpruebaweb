import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Salones } from "@/shared/types/db/tablas";

import {
  insertarSalones,
  editarSalones,
  eliminarSalon,
  EditarSalonesPayload,
  InsertarSalonesPayload,
} from "../api/salones.api";

export const useInsertarSalonesMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["insertar salon"],

    mutationFn: async (p: InsertarSalonesPayload) => {
      if (!p.id_sucursal) throw new Error("No hay sucursal seleccionada");
      return await insertarSalones(p);
    },

    onSuccess: () => {
      toast.success("Salón creado");

      qc.invalidateQueries({
        queryKey: ["mostrar salones"],
      });
    },

    onError: (e: any) => {
      const msg = e?.message ?? "";

      if (msg.includes("duplicate key")) {
        toast.error("Ya existe un salón con ese nombre");
        return;
      }

      toast.error(msg || "Error al crear salón");
    },
  });
};

export const useEditarSalonesMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["editar salon"],

    mutationFn: async (p: EditarSalonesPayload) => {
      return await editarSalones(p);
    },

    onSuccess: () => {
      toast.success("Salón actualizado");

      qc.invalidateQueries({
        queryKey: ["mostrar salones"],
      });
    },

    onError: (e: any) => {
      qc.invalidateQueries({
        queryKey: ["mostrar salones"],
      });

      const msg = e?.message ?? "";

      if (msg.includes("duplicate key")) {
        toast.error("Ya existe un salón con ese nombre");
        return;
      }

      toast.error(msg || "Error al editar salón");
    },
  });
};

export const useEliminarSalonesMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["eliminar salon"],

    mutationFn: async (id: Salones["id"]) => {
      await eliminarSalon(id);
    },

    onSuccess: () => {
      toast.success("Salón eliminado");

      qc.invalidateQueries({
        queryKey: ["mostrar salones"],
      });
    },

    onError: () => {
      qc.invalidateQueries({
        queryKey: ["mostrar salones"],
      });

      toast.error("Error al eliminar salón");
    },
  });
};