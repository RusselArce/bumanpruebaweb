import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  actualizarMesa,
  eliminarMesa,
  insertarMesasBatch,
} from "../api/mesas.api";
import type { MesasInsert, MesaUpdatePayload } from "../api/mesas.api";
import { Mesas, Salones } from "@/shared/types/db/tablas";

type GuardarDisenoArgs = {
  salonId: number;
  updates: MesaUpdatePayload[];
  inserts: MesasInsert[];
};

export const useGuardarDisenoMesasMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["guardar diseno mesas"],
    mutationFn: async ({ salonId, updates, inserts }: GuardarDisenoArgs) => {
      // 1) updates (existentes)
      await Promise.all(updates.map(actualizarMesa));

      // 2) inserts (nuevas)
      const inserted = inserts.length ? await insertarMesasBatch(inserts) : [];

      return { salonId, inserted };
    },
    onSuccess: ({ salonId }) => {
      qc.invalidateQueries({ queryKey: ["mostrar mesas por salon", salonId] });
      toast.success("Diseño guardado");
    },
    onError: (e: any) => {
      const msg = e?.message ?? "";

      if (msg.includes("mesas_nombre_key") || msg.includes("duplicate key")) {
        toast.error("Ya existe una mesa con ese nombre");
        return;
      }

      toast.error(msg || "Error al guardar el diseño");
    },
  });
};
// mesas.mutations.ts

function friendlyDeleteError(message: string) {
  // FK restrict/no action: "violates foreign key constraint"
  if (message.toLowerCase().includes("foreign key")) {
    return "No se puede eliminar la mesa: tiene ventas registradas.";
  }
  return message;
}
type EliminarMesaArgs = {
  id: Mesas["id"];
  id_salon: Salones["id"];
};
export const useEliminarMesaMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["eliminar mesa"],
    mutationFn: async ({ id, id_salon }: EliminarMesaArgs) => {
      await eliminarMesa(id);
    },
    onSuccess: (_data, vars) => {
      toast.success("Mesa eliminada");
      // ✅ si no tienes salonId, invalida todo lo relacionado a mesas

      qc.invalidateQueries({
        queryKey: ["mostrar mesas por salon", vars.id_salon],
      });
    },
    onError: (e, vars) => {
      qc.invalidateQueries({
        queryKey: ["mostrar mesas por salon", vars.id_salon],
      });

      toast.error(friendlyDeleteError(e?.message ?? "Error al eliminar mesa"));
    },
  });
};

