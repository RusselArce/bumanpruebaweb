import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CierresCajas } from "@/shared/types/db/tablas";

import {
  insertarCierreCaja,
  editarCierreCaja,
  eliminarCierreCaja,
  buscarCierresCaja,
  mostrarCierreAbiertoPorCaja,
} from "../api/cierres_caja.api";


/** INSERTAR (abrir caja) */
type InsertarCierreArgs = {
  p: Omit<Partial<CierresCajas>, "id">;
};

export const useInsertarCierreCajaMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["insertar cierre caja"],

    mutationFn: async ({ p }: InsertarCierreArgs) => {
      return await insertarCierreCaja(p);
    },

    onSuccess: (data) => {
      toast.success("Caja abierta correctamente");

      qc.invalidateQueries({
        queryKey: ["mostrar cierres por caja", data?.id_caja],
      });
    },

    onError: (e: any) => {
      toast.error(e?.message ?? "Error al abrir caja");
    },
  });
};



/** EDITAR (cerrar caja) */
type EditarCierreArgs = Pick<
  CierresCajas,
  | "id"
  | "total_efectivo_calculado"
  | "total_efectivo_real"
  | "diferencia_efectivo"
  | "estado"
  | "fechacierre"
>;

export const useEditarCierreCajaMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["editar cierre caja"],

    mutationFn: async (p: EditarCierreArgs) => {
      return await editarCierreCaja(p);
    },

    onSuccess: (_data) => {
      toast.success("Caja cerrada correctamente");

      qc.invalidateQueries({
        queryKey: ["mostrar cierre abierto por caja"],
      });
    },

    onError: (e: any) => {
      toast.error(e?.message ?? "Error al cerrar caja");
    },
  });
};



/** ELIMINAR (solo admin normalmente) */
type EliminarCierreArgs = {
  id: CierresCajas["id"];
};

export const useEliminarCierreCajaMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["eliminar cierre caja"],

    mutationFn: async ({ id }: EliminarCierreArgs) => {
      await eliminarCierreCaja(id);
    },

    onSuccess: () => {
      toast.success("Cierre eliminado");

      qc.invalidateQueries({
        queryKey: ["mostrar cierres por caja"],
      });
    },

    onError: (e: any) => {
      toast.error(e?.message ?? "Error al eliminar cierre");
    },
  });
};



/** BUSCAR CIERRES */
type BuscarCierresArgs = {
  q: string;
};

export const useBuscarCierresCajaMutation = () => {
  return useMutation({
    mutationKey: ["buscar cierres caja"],

    mutationFn: async ({ q }: BuscarCierresArgs) => {
      const texto = q.trim();

      if (!texto) {
        return await buscarCierresCaja("");
      }

      return await buscarCierresCaja(texto);
    },

    onError: (e: any) => toast.error(e?.message ?? "Error al buscar"),
  });
};