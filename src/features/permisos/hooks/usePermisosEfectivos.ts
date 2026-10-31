import { useMemo } from "react";
import {
  useUsuarioActualQuery,
  useMostrarModulosQuery,
  usePermisosDefaultPorRolQuery,
  usePermisosPorUsuarioQuery,
} from "@/features/usuarios/hooks/usuarios.queries";

// El rol "superadmin" no tiene (ni necesita) filas en permisos_dafault: se
// interpreta como acceso total, igual que el resto del sistema ya asume
// implícitamente (no hay ninguna fila restrictiva para ese rol).
const ROL_SIN_RESTRICCIONES = "superadmin";

export function usePermisosEfectivos() {
  // El rol vive directo en usuarios.id_rol — una identidad pertenece a una
  // sola empresa, así que no hace falta resolverlo por membresía.
  const usuarioActualQ = useUsuarioActualQuery() as {
    data: { id: number; id_rol: number | null; roles?: { nombre?: string | null } | null } | null | undefined;
    isLoading: boolean;
  };
  const usuarioActual = usuarioActualQ.data;

  const idUsuario = usuarioActual?.id ?? null;
  const idRol = usuarioActual?.id_rol ?? null;
  const esSuperadmin = (usuarioActual?.roles?.nombre ?? "").toLowerCase() === ROL_SIN_RESTRICCIONES;

  const modulosQ = useMostrarModulosQuery();
  const permisosRolQ = usePermisosDefaultPorRolQuery(idRol);
  const permisosUsuarioQ = usePermisosPorUsuarioQuery(idUsuario);

  // mientras no sepamos quién es (o sus permisos) no podemos afirmar "sí
  // tiene acceso" — pero tampoco negarlo de forma definitiva, así que el
  // guard de rutas debe esperar a `cargando` antes de decidir.
  const cargando =
    !esSuperadmin &&
    (usuarioActualQ.isLoading ||
      !idUsuario ||
      modulosQ.isLoading ||
      permisosRolQ.isLoading ||
      permisosUsuarioQ.isLoading);

  const idsPermitidos = useMemo(() => {
    if (esSuperadmin) return null; // null = sin restricciones

    return new Set<number>([
      ...(permisosRolQ.data ?? []).map((p) => p.id_modulo),
      ...(permisosUsuarioQ.data ?? []).map((p) => p.idmodulo as number),
    ]);
  }, [esSuperadmin, permisosRolQ.data, permisosUsuarioQ.data]);

  const linksPermitidos = useMemo(() => {
    if (esSuperadmin) return null; // null = sin restricciones

    return new Set(
      (modulosQ.data ?? [])
        .filter((m) => idsPermitidos?.has(Number(m.id)))
        .map((m) => m.link)
        .filter((link): link is string => !!link && link !== "-"),
    );
  }, [esSuperadmin, modulosQ.data, idsPermitidos]);

  const tienePermiso = (link: string) => {
    if (esSuperadmin) return true;
    if (!linksPermitidos) return false;
    return linksPermitidos.has(link);
  };

  // Para módulos que no son una ruta propia (ej. "Cobrar venta" es un botón
  // dentro de /punto-venta, no un link navegable), el chequeo por `link` no
  // sirve — se resuelve el id del módulo por nombre contra el catálogo y se
  // consulta directo contra `idsPermitidos`.
  const tienePermisoPorNombreModulo = (nombreModulo: string) => {
    if (esSuperadmin) return true;
    if (!idsPermitidos) return false;
    const modulo = (modulosQ.data ?? []).find(
      (m) => m.nombre.trim().toLowerCase() === nombreModulo.trim().toLowerCase(),
    );
    if (!modulo) return false;
    return idsPermitidos.has(Number(modulo.id));
  };

  return {
    esSuperadmin,
    linksPermitidos,
    tienePermiso,
    tienePermisoPorNombreModulo,
    cargando,
    idRol,
    idUsuario,
  };
}
