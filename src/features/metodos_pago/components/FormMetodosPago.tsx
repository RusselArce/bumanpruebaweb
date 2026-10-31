// src/features/metodos_pago/components/FormMetodosPago.tsx
import React, { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { MetodosPagos } from "@/shared/types/db/tablas";
import {
  useInsertarMetodosPagoMutation,
  useEditarMetodosPagoMutation,
} from "@/features/metodos_pago/hooks/metodos_pago.mutations";
import { useEmpresaStore } from "@/features/empresa/store/empresa.store";

type FormMode = "Nuevo" | "Editar";

type FormValues = {
  nombre: string;
  delete_update: boolean;
};

type Props = {
  open: boolean;
  mode: FormMode;
  initial?: Partial<FormValues> & { id?: MetodosPagos["id"] };
  onClose: () => void;
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

export const FormMetodosPago: React.FC<Props> = ({ open, mode, initial, onClose }) => {
  const insertar = useInsertarMetodosPagoMutation();
  const editar = useEditarMetodosPagoMutation();
  const itemSelectEmpresa = useEmpresaStore((s)=>s.itemSelect)

  const isSaving = insertar.isPending || editar.isPending;

  const defaults = useMemo<FormValues>(
    () => ({
      nombre: initial?.nombre ?? "",
      delete_update: initial?.delete_update ?? false,
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
      nombre: v.nombre.trim(),
      delete_update: !!v.delete_update,
      id_empresa: itemSelectEmpresa?.id,
    };

    if (mode === "Nuevo") {
      await insertar.mutateAsync({ ...payloadBase, default: false } as any);
      onClose();
      return;
    }

    if (!initial?.id) {
      toast.error("Falta id para editar");
      return;
    }

    await editar.mutateAsync({
      id: initial.id,
      nombre: payloadBase.nombre,
      delete_update: payloadBase.delete_update,
    });

    onClose();
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-[28px] bg-white dark:bg-[#202f36] border-2 border-[#E5E5E5] dark:border-[#37464f] shadow-[0_18px_60px_rgba(0,0,0,0.18)] overflow-hidden">
        <div className="bg-[#F0F2F5] dark:bg-white/5 border-b-2 border-[#E5E5E5] dark:border-[#37464f] px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-[#4B4B4B] dark:text-white tracking-wide">
              {mode === "Nuevo" ? "Nuevo método de pago" : "Editar método de pago"}
            </h2>
            <p className="text-sm font-bold text-[#6B6B6B] dark:text-white/50">Inserta y edita lo esencial.</p>
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

        <form onSubmit={onSubmit} className="px-6 py-6 space-y-6">
          <div className="space-y-2">
            <label className="text-lg font-black text-[#4B4B4B] dark:text-white">Nombre</label>
            <input
              placeholder="Ej: Efectivo"
              className={inputClass(!!errors.nombre)}
              {...register("nombre", {
                required: "Nombre es obligatorio",
                minLength: { value: 2, message: "Mínimo 2 caracteres" },
                maxLength: { value: 60, message: "Máximo 60 caracteres" },
                validate: (x) => x.trim().length > 0 || "No puede ser solo espacios",
              })}
            />
            {errors.nombre && (
              <p className="text-sm font-black text-pink-500">{errors.nombre.message}</p>
            )}
          </div>

          <div className="rounded-2xl border-2 border-[#E5E5E5] dark:border-[#37464f] bg-white dark:bg-[#202f36] p-4">
            <label className="flex items-center gap-3">
              <input type="checkbox" className="h-5 w-5 accent-black" {...register("delete_update")} />
              <span className="text-base font-black text-[#4B4B4B] dark:text-white">Permitir editar/eliminar</span>
            </label>
          </div>

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