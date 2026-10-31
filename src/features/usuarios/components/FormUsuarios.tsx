// src/features/usuarios/components/FormUsuarios.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Usuarios, Roles, Modulos } from "@/shared/types/db/tablas";
import {
  useInsertarUsuarioMutation,
  useEditarUsuarioMutation,
  useGuardarRolYPermisosUsuarioMutation,
} from "@/features/usuarios/hooks/usuarios.mutations";
import {
  useMostrarRolesQuery,
  useMostrarModulosQuery,
  usePermisosDefaultPorRolQuery,
  usePermisosPorUsuarioQuery,
} from "@/features/usuarios/hooks/usuarios.queries";
import { mostrarUsuariosPorEmail } from "@/features/usuarios/api/usuarios.api";
import { useEmpresaStore } from "@/features/empresa/store/empresa.store";
import { SelectDropdown } from "@/shared/ui/list/SelectDropdown";
import { useMostrarSucursalesPorEmpresaQuery } from "@/features/sucursales/hooks/sucursales.queries";
import { useInsertarAsignacionSucursalMutation } from "@/features/asignacion_sucursal/hooks/asignacion_sucursal.mutations";
import { mostrarPrimeraCajaPorSucursal } from "@/features/sucursales_cajas/api/cajas.api";
import type { Sucursales } from "@/shared/types/db/tablas";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormMode = "Nuevo" | "Editar";

type FormValues = {
  nombres: string;
  correo: string;
  telefono: string;
  nro_doc: string;
  id_tipodocumento: any;
  estado: string;
  tema: string;
  id_rol: Roles["id"] | null;
  id_sucursal: Sucursales["id"] | null;
};

type Props = {
  open: boolean;
  mode: FormMode;
  initial?: Partial<Usuarios> & { id?: Usuarios["id"] };
  onClose: () => void;
};

const XIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-6 w-6"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const inputClass = (hasError: boolean) =>
  [
    "w-full rounded-2xl border-2 px-4 py-3 text-lg font-black text-[#4B4B4B] dark:text-white bg-white dark:bg-[#131f24] outline-none transition-all",
    hasError ? "border-pink-400" : "border-[#E5E5E5] dark:border-[#37464f] focus:border-[#84D8FF]",
  ].join(" ");

/**
 * Permisos SIN columnas extra:
 * - base por rol: permisos_default
 * - extras por usuario: permisos
 * - no existe "deny", solo puedes agregar extras.
 */
export const FormUsuarios: React.FC<Props> = ({
  open,
  mode,
  initial,
  onClose,
}) => {
  const insertar = useInsertarUsuarioMutation();
  const editar = useEditarUsuarioMutation();
  const guardarPermisos = useGuardarRolYPermisosUsuarioMutation();
  const asignarSucursal = useInsertarAsignacionSucursalMutation();

  const isSaving =
    insertar.isPending || editar.isPending || guardarPermisos.isPending || asignarSucursal.isPending;

  const defaults = useMemo<FormValues>(
    () => ({
      nombres: initial?.nombres ?? "",
      correo: (initial as any)?.correo ?? "",
      telefono: (initial as any)?.telefono ?? "",
      nro_doc: (initial as any)?.nro_doc ?? "",
      id_tipodocumento: (initial as any)?.id_tipodocumento ?? null,
      estado: (initial as any)?.estado ?? "ACTIVO",
      tema: (initial as any)?.tema ?? "light",
      id_rol: (initial as any)?.id_rol ?? null,
      id_sucursal: null,
    }),
    [initial],
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
    setValue,
  } = useForm<FormValues>({
    defaultValues: defaults,
    mode: "onChange",
  });

  useEffect(() => {
    if (open) reset(defaults);
  }, [open, reset, defaults]);

  const idRol = watch("id_rol");

  const rolesQ = useMostrarRolesQuery();
  const modulosQ = useMostrarModulosQuery();

  const esSuperAdmin = useMemo(() => {
    const r = (rolesQ.data ?? []).find((x: any) => x.id === idRol);
    return (r?.nombre ?? "").trim().toLowerCase() === "superadmin";
  }, [rolesQ.data, idRol]);

  const bloquearRolYPermisos = mode === "Editar" && esSuperAdmin;

  // al crear un usuario nuevo no se ofrece superadmin: es un rol que no se asigna por este formulario.
  const rolesDisponibles = useMemo(() => {
    const roles = rolesQ.data ?? [];
    if (mode !== "Nuevo") return roles;
    return roles.filter(
      (r: any) => (r?.nombre ?? "").trim().toLowerCase() !== "superadmin",
    );
  }, [rolesQ.data, mode]);

  const permisosRolQ = usePermisosDefaultPorRolQuery(idRol);
  const permisosUsuarioQ = usePermisosPorUsuarioQuery(initial?.id ?? null);
  const itemSelectEmpresa = useEmpresaStore((s) => s.itemSelect);

  // ✅ al dar de alta hay que asignarlo a una sucursal de la empresa (si no,
  // no puede operar: Salones/Mesas/Caja dependen de asignacion_sucursal).
  // Si la empresa tiene una sola sucursal se asigna sola, sin pedir nada.
  const sucursalesQ = useMostrarSucursalesPorEmpresaQuery(
    mode === "Nuevo" ? itemSelectEmpresa?.id : null,
  );
  const sucursalesDisponibles = sucursalesQ.data ?? [];
  const idSucursal = watch("id_sucursal");

  useEffect(() => {
    if (mode !== "Nuevo") return;
    if (idSucursal) return;
    if (sucursalesDisponibles.length === 1) {
      setValue("id_sucursal", sucursalesDisponibles[0].id, { shouldDirty: true });
    }
  }, [mode, idSucursal, sucursalesDisponibles, setValue]);

  // ✅ una misma persona pertenece a una sola empresa (usuarios.id_empresa):
  // si el correo ya existe, no se puede reutilizar acá — hay que avisar y
  // bloquear el alta en vez de crear una fila duplicada.
  const correoValue = watch("correo");
  const [correoDebounced, setCorreoDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setCorreoDebounced(correoValue.trim().toLowerCase()), 400);
    return () => clearTimeout(t);
  }, [correoValue]);

  const usuarioExistenteQ = useQuery({
    queryKey: ["usuario existente por correo", correoDebounced],
    queryFn: () => mostrarUsuariosPorEmail(correoDebounced),
    enabled: mode === "Nuevo" && EMAIL_RE.test(correoDebounced),
  });
  const usuarioExistente = mode === "Nuevo" ? (usuarioExistenteQ.data ?? null) : null;

  // ids base por rol
  const baseRolIds = useMemo(() => {
    return new Set((permisosRolQ.data ?? []).map((x: any) => x.id_modulo));
  }, [permisosRolQ.data]);

  // extras ya guardados para este usuario (solo en modo Editar)
  const extrasGuardadosIds = useMemo(() => {
    return new Set((permisosUsuarioQ.data ?? []).map((x: any) => x.idmodulo));
  }, [permisosUsuarioQ.data]);

  // estado local del checklist (solo EXTRAS)
  const [extrasIds, setExtrasIds] = useState<Set<number>>(new Set());

  // cuando abre el modal en editar: cargar extras desde DB
  useEffect(() => {
    if (!open) return;
    if (mode === "Editar") {
      setExtrasIds(new Set(Array.from(extrasGuardadosIds)));
    } else {
      setExtrasIds(new Set());
    }
  }, [open, mode, extrasGuardadosIds]);

  const toggleExtra = (id_modulo: number) => {
    setExtrasIds((prev) => {
      const next = new Set(prev);
      if (next.has(id_modulo)) next.delete(id_modulo);
      else next.add(id_modulo);
      return next;
    });
  };

  const onSubmit = handleSubmit(async (v) => {
    if (!v.id_rol) {
      toast.error("Selecciona un rol");
      return;
    }
    if (!itemSelectEmpresa?.id) {
      toast.error("No hay una empresa activa");
      return;
    }

    if (mode === "Nuevo") {
      // El correo ya pertenece a otra identidad (de esta empresa u otra):
      // no se puede reutilizar ni "prestar" — se bloquea el alta.
      if (usuarioExistente) {
        toast.error("Ese correo ya pertenece a un usuario existente. No se puede volver a registrar.");
        return;
      }
      if (sucursalesDisponibles.length > 1 && !v.id_sucursal) {
        toast.error("Selecciona a qué sucursal pertenece");
        return;
      }
      if (sucursalesDisponibles.length === 0) {
        toast.error("Esta empresa no tiene ninguna sucursal creada todavía");
        return;
      }

      const created = await insertar.mutateAsync({
        nombres: v.nombres.trim(),
        correo: v.correo.trim().toLowerCase(),
        telefono: v.telefono.trim(),
        nro_doc: v.nro_doc.trim(),
        id_tipodocumento: v.id_tipodocumento,
        estado: v.estado,
        tema: v.tema,
        id_rol: v.id_rol,
        id_empresa: itemSelectEmpresa.id,
      });
      if (!created?.id) {
        toast.error("No se pudo obtener el id del usuario creado");
        return;
      }

      const idSucursalFinal = (v.id_sucursal ??
        sucursalesDisponibles[0].id) as number;
      // ✅ autoasigna la caja de la sucursal (hoy solo hay una por
      // sucursal) — si no se hace esto, el usuario queda con id_caja NULL
      // y nunca puede aperturar caja (AperturaCajaModal exige id_caja).
      const caja = await mostrarPrimeraCajaPorSucursal(idSucursalFinal);

      await asignarSucursal.mutateAsync({
        id_sucursal: idSucursalFinal,
        id_usuario: created.id,
        id_caja: caja?.id ?? null,
      });

      await guardarPermisos.mutateAsync({
        id_usuario: created.id,
        id_rol: v.id_rol,
        extras_modulos_ids: Array.from(extrasIds),
      });

      onClose();
      return;
    }

    if (!initial?.id) {
      toast.error("Falta id para editar");
      return;
    }

    await editar.mutateAsync({
      id: initial.id,
      nombres: v.nombres.trim(),
      correo: v.correo.trim().toLowerCase(),
      telefono: v.telefono.trim(),
      nro_doc: v.nro_doc.trim(),
      id_tipodocumento: v.id_tipodocumento,
      estado: v.estado,
      tema: v.tema,
      id_rol: v.id_rol,
    });

    await guardarPermisos.mutateAsync({
      id_usuario: initial.id,
      id_rol: v.id_rol,
      extras_modulos_ids: Array.from(extrasIds),
    });

    onClose();
  });

  if (!open) return null;

  const modulos = (modulosQ.data ?? []) as Modulos[];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div
        className=" w-full max-w-4xl
      max-h-[92vh]
      rounded-[28px]
      bg-white dark:bg-[#202f36] border-2 border-[#E5E5E5] dark:border-[#37464f]
      shadow-[0_18px_60px_rgba(0,0,0,0.18)]
      overflow-hidden
      flex flex-col"
      >
        {/* Header */}
        <div className="bg-[#F0F2F5] dark:bg-white/5 border-b-2 border-[#E5E5E5] dark:border-[#37464f] px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-[#4B4B4B] dark:text-white tracking-wide">
              {mode === "Nuevo" ? "Nuevo usuario" : "Editar usuario"}
            </h2>
            <p className="text-sm font-bold text-[#6B6B6B] dark:text-white/50">
              Rol + permisos (base por rol y extras por usuario).
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-white dark:bg-[#202f36] border-2 border-[#E5E5E5] dark:border-[#37464f] px-3 py-2 text-[#4B4B4B] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 active:translate-y-[1px] transition"
            disabled={isSaving}
            title="Cerrar"
          >
            <XIcon />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={onSubmit}
          className="px-6 py-6 space-y-6 overflow-y-auto flex-1"
        >
          {/* Datos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-lg font-black text-[#4B4B4B] dark:text-white">
                Nombres
              </label>
              <input
                placeholder="Ej: Juan Pérez"
                className={inputClass(!!errors.nombres)}
                {...register("nombres", {
                  required: "Nombres es obligatorio",
                  minLength: { value: 2, message: "Mínimo 2 caracteres" },
                  maxLength: { value: 120, message: "Máximo 120 caracteres" },
                  validate: (x) =>
                    x.trim().length > 0 || "No puede ser solo espacios",
                })}
              />
              {errors.nombres && (
                <p className="text-sm font-black text-pink-500">
                  {errors.nombres.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-lg font-black text-[#4B4B4B] dark:text-white">
                Correo
              </label>
              <input
                placeholder="correo@dominio.com"
                disabled={bloquearRolYPermisos}
                className={[
                  inputClass(!!errors.correo),
                  bloquearRolYPermisos
                    ? "opacity-60 cursor-not-allowed bg-[#F0F2F5] dark:bg-white/5"
                    : "",
                ].join(" ")}
                {...register("correo", {
                  maxLength: { value: 120, message: "Máximo 120 caracteres" },
                  pattern: {
                    value: EMAIL_RE,
                    message: "Email inválido",
                  },
                })}
              />
              {errors.correo && (
                <p className="text-sm font-black text-pink-500">
                  {errors.correo.message}
                </p>
              )}
              {mode === "Nuevo" && usuarioExistente && (
                <p className="text-xs font-bold text-pink-500 bg-pink-500/10 rounded-xl px-3 py-2">
                  Ya existe un usuario con este correo ({usuarioExistente.nombres}). No se puede
                  volver a registrar — usa otro correo o edita ese usuario.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-lg font-black text-[#4B4B4B] dark:text-white">
                Teléfono
              </label>
              <input
                placeholder="999888777"
                disabled={!!usuarioExistente}
                className={[
                  inputClass(!!errors.telefono),
                  usuarioExistente ? "opacity-60 cursor-not-allowed bg-[#F0F2F5] dark:bg-white/5" : "",
                ].join(" ")}
                {...register("telefono", {
                  maxLength: { value: 30, message: "Máximo 30 caracteres" },
                })}
              />
              {errors.telefono && (
                <p className="text-sm font-black text-pink-500">
                  {errors.telefono.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-lg font-black text-[#4B4B4B] dark:text-white">
                Documento
              </label>
              <input
                placeholder="70445566"
                disabled={!!usuarioExistente}
                className={[
                  inputClass(!!errors.nro_doc),
                  usuarioExistente ? "opacity-60 cursor-not-allowed bg-[#F0F2F5] dark:bg-white/5" : "",
                ].join(" ")}
                {...register("nro_doc", {
                  maxLength: { value: 30, message: "Máximo 30 caracteres" },
                })}
              />
              {errors.nro_doc && (
                <p className="text-sm font-black text-pink-500">
                  {errors.nro_doc.message}
                </p>
              )}
            </div>
          </div>

          {/* Sucursal (solo al crear, y solo si hay que elegir entre varias) */}
          {mode === "Nuevo" && sucursalesDisponibles.length > 1 && (
            <div className="space-y-2">
              <label className="text-lg font-black text-[#4B4B4B] dark:text-white">Sucursal</label>
              <SelectDropdown
                placeholder="Selecciona sucursal..."
                value={(watch("id_sucursal") as any) ?? ""}
                options={sucursalesDisponibles.map((s) => ({
                  value: s.id,
                  label: s.nombre ?? `Sucursal ${s.id}`,
                }))}
                onChange={(v) =>
                  setValue("id_sucursal", v ? Number(v) : null, { shouldDirty: true })
                }
              />
            </div>
          )}

          {/* Rol */}
          {!bloquearRolYPermisos && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2 md:col-span-1">
                <label className="text-lg font-black text-[#4B4B4B] dark:text-white">Rol</label>
                <SelectDropdown
                  placeholder="Selecciona rol..."
                  hasError={!!errors.id_rol}
                  value={(watch("id_rol") as any) ?? ""}
                  options={rolesDisponibles.map((r: any) => ({
                    value: r.id,
                    label: r.nombre,
                  }))}
                  onChange={(v) =>
                    setValue("id_rol", v ? Number(v) : null, {
                      shouldDirty: true,
                    })
                  }
                />
                {errors.id_rol && (
                  <p className="text-sm font-black text-pink-500">
                    {(errors.id_rol as any)?.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-1">
                <label className="text-lg font-black text-[#4B4B4B] dark:text-white">
                  Estado
                </label>
                <SelectDropdown
                  value={watch("estado")}
                  options={[
                    { value: "ACTIVO", label: "ACTIVO" },
                    { value: "INACTIVO", label: "INACTIVO" },
                  ]}
                  onChange={(v) =>
                    setValue("estado", String(v), { shouldDirty: true })
                  }
                />
              </div>

              <div className="space-y-2 md:col-span-1">
                <label className="text-lg font-black text-[#4B4B4B] dark:text-white">Tema</label>
                <SelectDropdown
                  value={watch("tema")}
                  options={[
                    { value: "light", label: "light" },
                    { value: "dark", label: "dark" },
                  ]}
                  onChange={(v) =>
                    setValue("tema", String(v), { shouldDirty: true })
                  }
                />
              </div>
            </div>
          )}

          {/* Permisos */}
          <div className="rounded-3xl border-2 border-[#E5E5E5] dark:border-[#37464f] bg-white dark:bg-[#202f36] p-5">
            {bloquearRolYPermisos ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <span className="text-4xl">🔓</span>
                <p className="text-2xl font-black text-[#4B4B4B] dark:text-white">
                  Acceso Total
                </p>
                <p className="text-xs font-bold text-[#6B6B6B] dark:text-white/50">
                  Superadmin tiene acceso a todos los módulos del sistema.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xl font-black text-[#4B4B4B] dark:text-white">
                      Permisos por módulos
                    </p>
                    <p className="text-xs font-bold text-[#6B6B6B] dark:text-white/50 mt-1">
                      Lo del rol se marca fijo (no editable). Abajo solo activas
                      extras por usuario.
                    </p>
                  </div>

                  {(permisosRolQ.isFetching ||
                    modulosQ.isFetching ||
                    permisosUsuarioQ.isFetching) && (
                    <div className="h-5 w-5 rounded-full border-2 border-[#84D8FF] border-t-transparent animate-spin" />
                  )}
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {modulos.map((m: any) => {
                const idm = Number(m.id);
                const isBase = baseRolIds.has(idm);
                const isExtra = extrasIds.has(idm);

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => (!isBase ? toggleExtra(idm) : null)}
                    className={[
                      "flex items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3 text-left transition",
                      isBase
                        ? "bg-[#F0F2F5] dark:bg-white/5 border-[#E5E5E5] dark:border-[#37464f] cursor-not-allowed"
                        : isExtra
                          ? "bg-[#E1F5FE] dark:bg-[#1cb0f6]/10 border-[#84D8FF]"
                          : "bg-white dark:bg-[#202f36] border-[#E5E5E5] dark:border-[#37464f] hover:bg-black/5 dark:hover:bg-white/10",
                    ].join(" ")}
                    title={
                      isBase
                        ? "Permiso por rol (no editable)"
                        : "Click para activar/desactivar extra"
                    }
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-[#4B4B4B] dark:text-white">
                        {m.nombre}
                      </span>
                      {!!m.descripcion && (
                        <span className="text-xs font-bold text-[#7A7A7A] dark:text-white/50">
                          {m.descripcion}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isBase && (
                        <span className="text-[10px] font-black px-2 py-1 rounded-xl bg-white dark:bg-[#202f36] border-2 border-[#E5E5E5] dark:border-[#37464f]">
                          ROL
                        </span>
                      )}
                      {!isBase && isExtra && (
                        <span className="text-[10px] font-black px-2 py-1 rounded-xl bg-white dark:bg-[#202f36] border-2 border-[#84D8FF]">
                          EXTRA
                        </span>
                      )}

                      <div
                        className={[
                          "h-6 w-6 rounded-xl border-2 grid place-items-center",
                          isBase || isExtra
                            ? "border-[#1CB0F6]"
                            : "border-[#E5E5E5] dark:border-[#37464f]",
                        ].join(" ")}
                      >
                        {(isBase || isExtra) && (
                          <svg
                            viewBox="0 0 24 24"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          >
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </button>
                );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-2xl bg-white dark:bg-[#202f36] px-6 py-3 text-lg font-black text-[#4B4B4B] dark:text-white border-2 border-[#E5E5E5] dark:border-[#37464f] hover:bg-black/5 dark:hover:bg-white/10 active:translate-y-[1px] transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                isSaving || (!isDirty && mode === "Nuevo" ? false : false)
              }
              className="relative inline-flex items-center gap-2 rounded-2xl bg-[#FFC800] px-6 py-3 text-lg font-black text-black
                         border-b-4 border-[#E5A500]
                         hover:brightness-110
                         active:border-b-0 active:translate-y-[2px]
                         disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {isSaving
                ? "Guardando..."
                : mode === "Nuevo"
                  ? "CREAR"
                  : "GUARDAR"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
