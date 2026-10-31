import React, { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { Modificadores } from "@/shared/types/db/tablas";
import {
  useInsertarModificadorMutation,
  useEditarModificadorMutation,
} from "@/features/modificadores/hooks/modificadores.mutations";

type FormMode = "Nuevo" | "Editar";

type FormValues = {
  nombre: string;
  precio_extra: number;
};

type Props = {
  open: boolean;
  mode: FormMode;
  initial?: Partial<FormValues> & { id?: Modificadores["id"] };
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

export const FormModificadores: React.FC<Props> = ({ open, mode, initial, onClose }) => {
  const insertar = useInsertarModificadorMutation();
  const editar = useEditarModificadorMutation();

  const isSaving = insertar.isPending || editar.isPending;

  const defaults = useMemo<FormValues>(
    () => ({
      nombre: initial?.nombre ?? "",
      precio_extra: Number(initial?.precio_extra ?? 0),
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
    if (mode === "Nuevo") {
      await insertar.mutateAsync({
        nombre: v.nombre.trim(),
        precio_extra: v.precio_extra,
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
      nombre: v.nombre.trim(),
      precio_extra: v.precio_extra,
    });

    onClose();
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-[28px] bg-white dark:bg-[#202f36] border-2 border-[#E5E5E5] dark:border-[#37464f] shadow-[0_18px_60px_rgba(0,0,0,0.18)] overflow-hidden">
        <div className="bg-[#F0F2F5] dark:bg-white/5 border-b-2 border-[#E5E5E5] dark:border-[#37464f] px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-[#4B4B4B] dark:text-white tracking-wide">
              {mode === "Nuevo" ? "Nuevo modificador" : "Editar modificador"}
            </h2>
            <p className="text-sm font-bold text-[#6B6B6B] dark:text-white/50">
              Ej: "Sin cebolla", "Extra queso"
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-white dark:bg-[#131f24] border-2 border-[#E5E5E5] dark:border-[#37464f] px-3 py-2 text-[#4B4B4B] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 active:translate-y-[1px] transition"
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
              placeholder="Ej: Extra queso"
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

          <div className="space-y-2">
            <label className="text-lg font-black text-[#4B4B4B] dark:text-white">Precio extra</label>
            <input
              type="number"
              step="0.01"
              min={0}
              placeholder="0.00"
              className={inputClass(!!errors.precio_extra)}
              {...register("precio_extra", {
                required: true,
                min: { value: 0, message: "No puede ser negativo" },
                valueAsNumber: true,
              })}
            />
            <p className="text-xs font-bold text-[#7A7A7A] dark:text-white/50">
              Se suma al precio del producto cuando se elige. Deja 0 si es gratis.
            </p>
            {errors.precio_extra && (
              <p className="text-sm font-black text-pink-500">{errors.precio_extra.message}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-2xl bg-white dark:bg-[#131f24] px-6 py-3 text-lg font-black text-[#4B4B4B] dark:text-white border-2 border-[#E5E5E5] dark:border-[#37464f] hover:bg-black/5 dark:hover:bg-white/10 active:translate-y-[1px] transition"
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
