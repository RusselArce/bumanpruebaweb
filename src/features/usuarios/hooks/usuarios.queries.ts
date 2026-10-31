// src/shared/hooks/usuarios.queries.ts
import { useQuery } from "@tanstack/react-query";
import type {
  Usuarios,
  Roles,
  Modulos,
  Permisos,
  PermisosDefaults,
} from "@/shared/types/db/tablas";
import {
  buscarUsuarios,
  mostrarUsuariosPorEmpresa,
  mostrarRoles,
  mostrarModulos,
  mostrarPermisosDefaultPorRol,
  mostrarPermisosPorUsuario,
  mostrarUsuariosPorEmail,
  mostrarUsuarioPorAuth,
} from "@/features/usuarios/api/usuarios.api";
import { useEmpresaStore } from "@/features/empresa/store/empresa.store";
import { useSubcription } from "@/shared/store/auth.store";

export const useMostrarUsuariosQuery = () => {
  const itemSelectEmpresa = useEmpresaStore((s) => s.itemSelect);
  const id_empresa = itemSelectEmpresa?.id ;
  return useQuery({
    queryKey: ["mostrar usuarios por empresa", id_empresa],
    queryFn: () => mostrarUsuariosPorEmpresa(id_empresa as number),
    enabled: !!id_empresa,
  });
};
export const useMostrarUsuariosPorEmailQuery = (email: string) => {
  const itemSelectEmpresa = useEmpresaStore((s) => s.itemSelect);
  const id_empresa = itemSelectEmpresa?.id;
  return useQuery({
    queryKey: ["mostrar usuarios por email"],
    queryFn: () => mostrarUsuariosPorEmail(email),
  });
};

// ✅ fila de "usuarios" (nombres, tema, etc.) del usuario logueado en esta
// sesión, resuelta por id_auth (único de verdad) — el correo puede repetirse
// entre varias filas, así que NO sirve para identificar "quién soy yo".
// Usada por el menú de perfil y por el ThemeProvider para saber/guardar el
// tema preferido.
export const useUsuarioActualQuery = () => {
  const { user } = useSubcription();

  return useQuery({
    queryKey: ["usuario actual", user?.id],
    queryFn: () => mostrarUsuarioPorAuth(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60,
  });
};
export const useBuscarUsuariosQuery = (search: string) => {
  const q = (search ?? "").trim();
  return useQuery<Usuarios[]>({
    queryKey: ["buscar usuarios por empresa", q],
    queryFn: () => buscarUsuarios(q),
    enabled: q.length >= 2,
    staleTime: 1000 * 30,
  });
};

export const useMostrarRolesQuery = () => {
  return useQuery<Roles[]>({
    queryKey: ["mostrar roles"],
    queryFn: () => mostrarRoles(),
    staleTime: 1000 * 60 * 10,
  });
};

export const useMostrarModulosQuery = () => {
  return useQuery<Modulos[]>({
    queryKey: ["mostrar modulos"],
    queryFn: () => mostrarModulos(),
    staleTime: 1000 * 60 * 10,
  });
};

export const usePermisosDefaultPorRolQuery = (id_rol?: Roles["id"] | null) => {
  return useQuery<PermisosDefaults[]>({
    queryKey: ["permisos default por rol", id_rol],
    queryFn: () => mostrarPermisosDefaultPorRol(id_rol as any),
    enabled: !!id_rol,
    staleTime: 1000 * 30,
  });
};

export const usePermisosPorUsuarioQuery = (
  id_usuario?: Usuarios["id"] | null,
) => {
  return useQuery<Permisos[]>({
    queryKey: ["permisos por usuario", id_usuario],
    queryFn: () => mostrarPermisosPorUsuario(id_usuario as any),
    enabled: !!id_usuario,
    staleTime: 1000 * 10,
  });
};
