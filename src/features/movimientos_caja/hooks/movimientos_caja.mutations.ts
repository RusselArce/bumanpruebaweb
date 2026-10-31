import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MovimientosCajas } from "@/shared/types/db/tablas";

import {
  insertarMovimientoCaja,
  editarMovimientoCaja,
  eliminarMovimientoCaja,
} from "../api/movimientos_caja.api";

/** INSERTAR */
type InsertarMovimientoArgs = 
   Omit<Partial<MovimientosCajas>, "id">;
;

export const useInsertarMovimientoCajaMutation = () => {

  const qc = useQueryClient();

  return useMutation({

    mutationKey: ["insertar movimiento caja"],

    mutationFn: async (p: InsertarMovimientoArgs) =>  {

      return await insertarMovimientoCaja(p);

    },

    onSuccess: (_data, vars) => {

      toast.success("Movimiento registrado");

      qc.invalidateQueries({
        queryKey: ["mostrar movimientos caja", vars.id_cierre_caja],
      });

      qc.invalidateQueries({
        queryKey: ["mostrar movimientos caja por tipo"],
      });

    },

    onError: (e: any) => {

      toast.error(e?.message ?? "Error al registrar movimiento");

    },

  });

};


/** EDITAR */
type EditarMovimientoArgs = Pick<
  MovimientosCajas,
  "id" | "descripcion" | "monto" | "id_metodo_pago" | "tipo_movimiento"
> & {
  id_cierre_caja: MovimientosCajas["id_cierre_caja"];
};

export const useEditarMovimientoCajaMutation = () => {

  const qc = useQueryClient();

  return useMutation({

    mutationKey: ["editar movimiento caja"],

    mutationFn: async (p: EditarMovimientoArgs) => {

      return await editarMovimientoCaja(p);

    },

    onSuccess: (_data, vars) => {

      toast.success("Movimiento actualizado");

      qc.invalidateQueries({
        queryKey: ["mostrar movimientos caja", vars.id_cierre_caja],
      });

      qc.invalidateQueries({
        queryKey: ["mostrar movimientos caja por tipo"],
      });

    },

    onError: (e: any, vars) => {

      qc.invalidateQueries({
        queryKey: ["mostrar movimientos caja", vars.id_cierre_caja],
      });

      qc.invalidateQueries({
        queryKey: ["mostrar movimientos caja por tipo"],
      });

      toast.error(e?.message ?? "Error al editar movimiento");

    },

  });

};


/** ELIMINAR */
type EliminarMovimientoArgs = {
  id: MovimientosCajas["id"];
  id_cierre_caja: MovimientosCajas["id_cierre_caja"];
};

export const useEliminarMovimientoCajaMutation = () => {

  const qc = useQueryClient();

  return useMutation({

    mutationKey: ["eliminar movimiento caja"],

    mutationFn: async ({ id }: EliminarMovimientoArgs) => {

      await eliminarMovimientoCaja(id);

    },

    onSuccess: (_data, vars) => {

      toast.success("Movimiento eliminado");

      qc.invalidateQueries({
        queryKey: ["mostrar movimientos caja", vars.id_cierre_caja],
      });

      qc.invalidateQueries({
        queryKey: ["mostrar movimientos caja por tipo"],
      });

    },

    onError: (e: any, vars) => {

      qc.invalidateQueries({
        queryKey: ["mostrar movimientos caja", vars.id_cierre_caja],
      });

      qc.invalidateQueries({
        queryKey: ["mostrar movimientos caja por tipo"],
      });

      toast.error(e?.message ?? "Error al eliminar movimiento");

    },

  });

};
