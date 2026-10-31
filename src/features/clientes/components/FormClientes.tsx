import React, { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { ClientesProveedores } from "@/shared/types/db/tablas";
import {
  useInsertarClientesMutation,
  useEditarClientesMutation,
} from "@/features/clientes/hooks/clientes.mutations";
import { useEmpresaStore } from "@/features/empresa/store/empresa.store";

type FormMode = "Nuevo" | "Editar";

type FormValues = {
  nombres: string;
  direccion: string;
  telefono: string;
  email: string;
  identificador_nacional: string;
  identificador_fiscal: string;
};

type Props = {
  open: boolean;
  mode: FormMode;
  initial?: Partial<FormValues> & { id?: ClientesProveedores["id"] };
  onClose: () => void;
  onCreated?: (cliente: ClientesProveedores) => void;
};

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const inputClass = (hasError: boolean) =>
  [
    "w-full rounded-2xl border-2 px-4 py-3 text-lg font-black text-[#4B4B4B] dark:text-white bg-white dark:bg-[#131f24] outline-none transition-all",
    hasError ? "border-pink-400" : "border-[#E5E5E5] dark:border-[#37464f] focus:border-[#84D8FF]",
  ].join(" ");

export const FormClientes: React.FC<Props> = ({ open, mode, initial, onClose, onCreated }) => {
  const insertar = useInsertarClientesMutation();
  const editar = useEditarClientesMutation();
  const itemSelectEmpresa = useEmpresaStore((s)=>s.itemSelect)

  const isSaving = insertar.isPending || editar.isPending;

  const defaults = useMemo<FormValues>(
    () => ({
      nombres: initial?.nombres ?? "",
      direccion: initial?.direccion ?? "",
      telefono: initial?.telefono ?? "",
      email: initial?.email ?? "",
      identificador_nacional: initial?.identificador_nacional ?? "",
      identificador_fiscal: initial?.identificador_fiscal ?? "",
    }),
    [initial],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    defaultValues: defaults,
    mode: "onChange",
  });

  useEffect(() => {
    if (open) reset(defaults);
  }, [open, reset, defaults]);

  const onSubmit = handleSubmit(async (v) => {
    const payloadBase = {
      nombres: v.nombres.trim(),
      direccion: v.direccion.trim(),
      telefono: v.telefono.trim(),
      email: v.email.trim(),
      identificador_nacional: v.identificador_nacional.trim(),
      identificador_fiscal: v.identificador_fiscal.trim(),
      id_empresa:itemSelectEmpresa?.id
    };

    if (mode === "Nuevo") {
      // InsertarClientesPayload = Omit<Partial<ClientesProveedores>, "id">
      const creado = await insertar.mutateAsync(payloadBase);
      onCreated?.(creado);
      onClose();
      return;
    }

    if (!initial?.id) {
      toast.error("Falta id para editar");
      return;
    }

    // EditarClientesPayload exacto (Pick con id + campos)
    await editar.mutateAsync({
      id: initial.id,
      ...payloadBase,
    });

    onClose();
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-1000 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-[28px] bg-white dark:bg-[#202f36] border-2 border-[#E5E5E5] dark:border-[#37464f] shadow-[0_18px_60px_rgba(0,0,0,0.18)] overflow-hidden">
        {/* Header */}
        <div className="bg-[#F0F2F5] dark:bg-white/5 border-b-2 border-[#E5E5E5] dark:border-[#37464f] px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-[#4B4B4B] dark:text-white tracking-wide">
              {mode === "Nuevo" ? "Nuevo cliente/proveedor" : "Editar cliente/proveedor"}
            </h2>
            <p className="text-sm font-bold text-[#6B6B6B] dark:text-white/50">
              Inserta y edita solo lo esencial.
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
        <form onSubmit={onSubmit} className="px-6 py-6 space-y-6">
          <div className="space-y-2">
            <label className="text-lg font-black text-[#4B4B4B] dark:text-white">Nombres / Razón social</label>
            <input
              placeholder="Ej: Juan Pérez / Mi Empresa SAC"
              className={inputClass(!!errors.nombres)}
              {...register("nombres", {
                required: "Nombres es obligatorio",
                minLength: { value: 2, message: "Mínimo 2 caracteres" },
                maxLength: { value: 120, message: "Máximo 120 caracteres" },
                validate: (x) => x.trim().length > 0 || "No puede ser solo espacios",
              })}
            />
            {errors.nombres && (
              <p className="text-sm font-black text-pink-500">{errors.nombres.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-lg font-black text-[#4B4B4B] dark:text-white">Dirección</label>
            <input
              placeholder="Ej: Jr. X #123 - Jaén"
              className={inputClass(!!errors.direccion)}
              {...register("direccion", {
                maxLength: { value: 180, message: "Máximo 180 caracteres" },
              })}
            />
            {errors.direccion && (
              <p className="text-sm font-black text-pink-500">{errors.direccion.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-lg font-black text-[#4B4B4B] dark:text-white">Teléfono</label>
              <input
                placeholder="Ej: 999888777"
                className={inputClass(!!errors.telefono)}
                {...register("telefono", {
                  maxLength: { value: 30, message: "Máximo 30 caracteres" },
                })}
              />
              {errors.telefono && (
                <p className="text-sm font-black text-pink-500">{errors.telefono.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-lg font-black text-[#4B4B4B] dark:text-white">Email</label>
              <input
                placeholder="Ej: correo@dominio.com"
                className={inputClass(!!errors.email)}
                {...register("email", {
                  maxLength: { value: 120, message: "Máximo 120 caracteres" },
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Email inválido",
                  },
                })}
              />
              {errors.email && (
                <p className="text-sm font-black text-pink-500">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-lg font-black text-[#4B4B4B] dark:text-white">
                Identificador nacional (DNI/RUC/etc.)
              </label>
              <input
                placeholder="Ej: 70445566"
                className={inputClass(!!errors.identificador_nacional)}
                {...register("identificador_nacional", {
                  maxLength: { value: 50, message: "Máximo 50 caracteres" },
                })}
              />
              {errors.identificador_nacional && (
                <p className="text-sm font-black text-pink-500">
                  {errors.identificador_nacional.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-lg font-black text-[#4B4B4B] dark:text-white">Identificador fiscal</label>
              <input
                placeholder="Ej: RUC / VAT / RFC"
                className={inputClass(!!errors.identificador_fiscal)}
                {...register("identificador_fiscal", {
                  maxLength: { value: 50, message: "Máximo 50 caracteres" },
                })}
              />
              {errors.identificador_fiscal && (
                <p className="text-sm font-black text-pink-500">
                  {errors.identificador_fiscal.message}
                </p>
              )}
            </div>
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
              disabled={isSaving || !isDirty}
              className="relative inline-flex items-center gap-2 rounded-2xl bg-[#FFC800] px-6 py-3 text-lg font-black text-black
                         border-b-4 border-[#E5A500]
                         hover:brightness-110
                         active:border-b-0 active:translate-y-[2px]
                         disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {isSaving ? "Guardando..." : mode === "Nuevo" ? "CREAR" : "GUARDAR"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};