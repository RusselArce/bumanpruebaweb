import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  insertarAsignacionSucursal,
  type InsertarAsignacionSucursalPayload,
} from "../api/asignacion_sucursal";

export const useInsertarAsignacionSucursalMutation = () => {
  return useMutation({
    mutationKey: ["insertar asignacion sucursal"],
    mutationFn: (p: InsertarAsignacionSucursalPayload) => insertarAsignacionSucursal(p),
    onError: (e: any) => toast.error(e?.message ?? "No se pudo asignar la sucursal"),
  });
};
