// src/shared/hooks/usuarios.mutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Usuarios } from "@/shared/types/db/tablas";
import {
  insertarUsuario,
  editarUsuario,
  editarTemaUsuario,
  eliminarUsuario,
  guardarRolYPermisosUsuario,
  InsertarUsuarioPayload,
  EditarUsuarioPayload,
  EditarTemaUsuarioPayload,
  GuardarPermisosUsuarioPayload,
} from "@/features/usuarios/api/usuarios.api";

export const useInsertarUsuarioMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["insertar usuario"],
    mutationFn: async (p: InsertarUsuarioPayload) => insertarUsuario(p),
    onSuccess: () => {
      toast.success("Usuario creado");
      qc.invalidateQueries({ queryKey: ["mostrar usuarios por empresa"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Error al crear usuario"),
  });
};

export const useEditarUsuarioMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["editar usuario"],
    mutationFn: async (p: EditarUsuarioPayload) => editarUsuario(p),
    onSuccess: () => {
      toast.success("Usuario actualizado");
      qc.invalidateQueries({ queryKey: ["mostrar usuarios por empresa"] });
    },
    onError: (e: any) => {
      qc.invalidateQueries({ queryKey: ["mostrar usuarios por empresa"] });
      toast.error(e?.message ?? "Error al editar usuario");
    },
  });
};

// ✅ mutation liviana solo para el toggle de tema (no exige el resto de
// campos del usuario, a diferencia de useEditarUsuarioMutation).
export const useEditarTemaUsuarioMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["editar tema usuario"],
    mutationFn: async (p: EditarTemaUsuarioPayload) => editarTemaUsuario(p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["usuario actual"] });
      qc.invalidateQueries({ queryKey: ["mostrar usuarios por empresa"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "No se pudo actualizar el tema"),
  });
};

export const useEliminarUsuarioMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["eliminar usuario"],
    mutationFn: async (id: Usuarios["id"]) => eliminarUsuario(id),
    onSuccess: () => {
      toast.success("Usuario eliminado");
      qc.invalidateQueries({ queryKey: ["mostrar usuarios por empresa"] });
    },
    onError: () => {
      qc.invalidateQueries({ queryKey: ["mostrar usuarios por empresa"] });
      toast.error("Error al eliminar usuario");
    },
  });
};

export const useGuardarRolYPermisosUsuarioMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["guardar rol y permisos usuario"],
    mutationFn: async (p: GuardarPermisosUsuarioPayload) => guardarRolYPermisosUsuario(p),
    onSuccess: (_d, vars) => {
      toast.success("Permisos guardados");
      qc.invalidateQueries({ queryKey: ["mostrar usuarios por empresa"] });
      qc.invalidateQueries({ queryKey: ["permisos por usuario", vars.id_usuario] });
      qc.invalidateQueries({ queryKey: ["permisos default por rol", vars.id_rol] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Error al guardar permisos"),
  });
};