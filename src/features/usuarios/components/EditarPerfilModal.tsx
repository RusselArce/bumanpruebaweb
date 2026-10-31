import React, { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import {
  useUsuarioActualQuery,
  useMostrarModulosQuery,
  usePermisosDefaultPorRolQuery,
  usePermisosPorUsuarioQuery,
} from "@/features/usuarios/hooks/usuarios.queries";
import { useEditarUsuarioMutation } from "@/features/usuarios/hooks/usuarios.mutations";
import type { Usuarios } from "@/shared/types/db/tablas";

type FormValues = {
  nombres: string;
  telefono: string;
  nro_doc: string;
};

type Props = { onClose: () => void };

const ROL_SIN_RESTRICCIONES = "superadmin";

const inputClass =
  "w-full rounded-2xl border-2 border-black/10 dark:border-white/10 bg-transparent px-4 py-2.5 text-gray-900 dark:text-white outline-none focus:border-[#1cb0f6] transition-colors";

const Campo = ({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <label className="text-xs font-black uppercase tracking-wide text-gray-500 dark:text-white/40">
      {label}
    </label>
    {children}
    {error && <p className="text-xs font-bold text-pink-500">{error}</p>}
  </div>
);

/** Autoedición de datos propios + vista de solo lectura de rol/permisos. */
export const EditarPerfilModal = ({ onClose }: Props) => {
  const { data: usuarioActual } = useUsuarioActualQuery() as {
    data: (Usuarios & { roles?: { nombre?: string | null } | null }) | null | undefined;
  };
  const { mutate, isPending } = useEditarUsuarioMutation();

  const nombreRol = usuarioActual?.roles?.nombre?.trim();
  const esSuperadmin = (nombreRol ?? "").toLowerCase() === ROL_SIN_RESTRICCIONES;

  const modulosQ = useMostrarModulosQuery();
  const permisosRolQ = usePermisosDefaultPorRolQuery(usuarioActual?.id_rol);
  const permisosUsuarioQ = usePermisosPorUsuarioQuery(usuarioActual?.id ?? null);

  const modulosPermitidos = useMemo(() => {
    if (esSuperadmin) return null; // null = acceso total
    const idsPermitidos = new Set<number>([
      ...(permisosRolQ.data ?? []).map((p: any) => p.id_modulo),
      ...(permisosUsuarioQ.data ?? []).map((p: any) => p.idmodulo as number),
    ]);
    return (modulosQ.data ?? []).filter((m: any) => idsPermitidos.has(Number(m.id)));
  }, [esSuperadmin, modulosQ.data, permisosRolQ.data, permisosUsuarioQ.data]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      nombres: usuarioActual?.nombres ?? "",
      telefono: usuarioActual?.telefono ?? "",
      nro_doc: usuarioActual?.nro_doc ?? "",
    },
  });

  useEffect(() => {
    if (!usuarioActual) return;
    reset({
      nombres: usuarioActual.nombres ?? "",
      telefono: usuarioActual.telefono ?? "",
      nro_doc: usuarioActual.nro_doc ?? "",
    });
  }, [usuarioActual, reset]);

  const onSubmit = handleSubmit((v) => {
    if (!usuarioActual?.id) return;

    mutate(
      {
        id: usuarioActual.id,
        nombres: v.nombres.trim(),
        // el correo es de solo lectura acá: se reenvía tal cual, sin permitir editarlo.
        correo: usuarioActual.correo ?? "",
        telefono: v.telefono.trim(),
        nro_doc: v.nro_doc.trim(),
        id_tipodocumento: usuarioActual.id_tipodocumento,
        estado: usuarioActual.estado ?? "ACTIVO",
        tema: usuarioActual.tema ?? "dark",
        // autoedición: nunca permitir que el propio usuario cambie su rol,
        // se reenvía el actual sin modificar.
        id_rol: usuarioActual.id_rol,
      },
      { onSuccess: onClose },
    );
  });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[28px] bg-white dark:bg-[#202f36] border-2 border-black/10 dark:border-white/10 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b-2 border-black/5 dark:border-white/10">
          <h2 className="text-xl font-black text-gray-900 dark:text-white">
            Mi perfil
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Rol + permisos (solo lectura) */}
        {nombreRol && (
          <div className="px-6 pt-5 space-y-3">
            <div className="rounded-2xl border-2 border-black/10 dark:border-white/10 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wide text-gray-500 dark:text-white/40">
                  Mi rol
                </span>
                <span className="text-xs font-black uppercase tracking-wide bg-black/5 dark:bg-white/10 rounded-full px-2 py-1 text-gray-700 dark:text-white/80">
                  {nombreRol}
                </span>
              </div>

              {esSuperadmin ? (
                <p className="text-xs font-bold text-gray-500 dark:text-white/50">
                  Acceso total: eres dueño de esta empresa.
                </p>
              ) : (
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-500 dark:text-white/50">
                    Módulos con acceso:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(modulosPermitidos ?? []).length === 0 ? (
                      <span className="text-xs text-gray-400 dark:text-white/40">Ninguno todavía</span>
                    ) : (
                      (modulosPermitidos ?? []).map((m: any) => (
                        <span
                          key={m.id}
                          className="text-[11px] font-bold bg-[#1cb0f6]/10 text-[#1cb0f6] rounded-full px-2 py-1"
                        >
                          {m.nombre}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={onSubmit} className="px-6 py-6 space-y-4">
          <Campo label="Nombres" error={errors.nombres?.message}>
            <input
              className={inputClass}
              placeholder="Ej: Juan Pérez"
              {...register("nombres", {
                required: "Los nombres son obligatorios",
                validate: (x) => x.trim().length > 0 || "No puede ser solo espacios",
              })}
            />
          </Campo>

          <Campo label="Correo">
            <input
              className={`${inputClass} cursor-not-allowed bg-black/5 dark:bg-white/5 text-gray-500 dark:text-white/50`}
              value={usuarioActual?.correo ?? ""}
              disabled
              readOnly
              title="El correo no se puede editar"
            />
          </Campo>

          <Campo label="Teléfono" error={errors.telefono?.message}>
            <input className={inputClass} placeholder="999888777" {...register("telefono")} />
          </Campo>

          <Campo label="Documento" error={errors.nro_doc?.message}>
            <input className={inputClass} placeholder="70445566" {...register("nro_doc")} />
          </Campo>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-2xl px-5 py-2.5 font-black text-gray-600 dark:text-white/70 border-2 border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-2xl px-5 py-2.5 font-black text-white bg-[#58cc02] border-b-4 border-[#46a302] active:border-b-0 active:translate-y-[2px] disabled:opacity-60 transition-all"
            >
              {isPending ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
