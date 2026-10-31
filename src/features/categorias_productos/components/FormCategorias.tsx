import React, { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { HexColorPicker } from "react-colorful";
import { toast } from "sonner";

import type { Categorias } from "@/shared/types/db/tablas";
import { useEmpresaStore } from "@/features/empresa/store/empresa.store";
import {
  useInsertarCategoriaMutation,
  useEditarCategoriaMutation,
} from "@/features/categorias_productos/hooks/categorias_productos.mutations";

type FormMode = "Nuevo" | "Editar";

type FormValues = {
  nombre: string;
  color: string;
};

type Props = {
  open: boolean;
  mode: FormMode;
  initial?: { id?: Categorias["id"]; nombre?: string; color?: string };
  onClose: () => void;
};

const DEFAULT_COLOR = "#22C55E";

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

function clampHex(v: string) {
  const x = v.trim();
  if (!x) return "";
  return x.startsWith("#") ? x : `#${x}`;
}

export const FormCategoria: React.FC<Props> = ({
  open,
  mode,
  initial,
  onClose,
}) => {
  useEmpresaStore((s) => s.itemSelect); // lo dejas por si luego lo necesitas (y no rompe)
  const insertar = useInsertarCategoriaMutation();
  const editar = useEditarCategoriaMutation();

  const isSaving = insertar.isPending || editar.isPending;

  const defaults = useMemo<FormValues>(
    () => ({
      nombre: initial?.nombre ?? "",
      color: initial?.color ?? DEFAULT_COLOR,
    }),
    [initial],
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    defaultValues: defaults,
    mode: "onChange",
  });

  useEffect(() => {
    if (open) reset(defaults);
  }, [open, reset, defaults]);

  const color = watch("color");
  const nombre = watch("nombre");

  const onSubmit = handleSubmit(async (values) => {
    const cleanNombre = values.nombre.trim();
    const cleanColor = values.color;

    if (mode === "Nuevo") {
      await insertar.mutateAsync({
        payload: {
          nombre: cleanNombre,
          color: cleanColor,
          icono: "-", // sin imagen
        } as any,
      });
    } else {
      if (!initial?.id) {
        toast.error("Falta id para editar");
        return;
      }

      // ⚠️ tu mutation actual solo edita nombre
      await editar.mutateAsync({
        id: initial.id,
        nombre: cleanNombre,
         color: cleanColor, // <- cuando actualices tu mutation, lo activas
      } as any);
    }

    onClose();
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-[28px] bg-white dark:bg-[#202f36] border-2 border-[#E5E5E5] dark:border-[#37464f] shadow-[0_18px_60px_rgba(0,0,0,0.18)] overflow-hidden">
        {/* Header */}
        <div className="bg-[#F0F2F5] dark:bg-white/5 border-b-2 border-[#E5E5E5] dark:border-[#37464f] px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-[#4B4B4B] dark:text-white tracking-wide">
              {mode === "Nuevo" ? "Nueva categoría" : "Editar categoría"}
            </h2>
            <p className="text-sm font-bold text-[#6B6B6B] dark:text-white/50">
              Elige color y mira el resultado directamente.
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
          {/* Nombre con feedback de color */}
          <div className="space-y-2">
            <label className="text-lg font-black text-[#4B4B4B] dark:text-white">Nombre</label>

            <div className="relative">
              {/* bolita de color */}
             

              {/* pill HEX */}

              <input
                placeholder="Ej: Bebidas"
                className={[
                  "w-full rounded-2xl border-2  pl-4 pr-28 py-3 text-lg font-black text-[#4B4B4B] dark:text-white outline-none transition-all",
                  errors.nombre ? "border-pink-400" : "border-[#E5E5E5] dark:border-[#37464f]",
                ].join(" ")}
                style={{
                  // borde/sombra suave con el color elegido

                  borderColor: errors.nombre ? undefined : `${color}55`,
                  backgroundColor: errors.nombre ? undefined : `${color}22`,
                }}
                {...register("nombre", {
                  required: "Nombre es obligatorio",
                  minLength: { value: 2, message: "Mínimo 2 caracteres" },
                  maxLength: { value: 40, message: "Máximo 40 caracteres" },
                  validate: (v) =>
                    v.trim().length > 0 || "No puede ser solo espacios",
                })}
              />
            </div>

            {errors.nombre && (
              <p className="text-sm font-black text-pink-500">
                {errors.nombre.message}
              </p>
            )}
          </div>

          {/* Color */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr] gap-6 items-start">
            <div className="space-y-3">
              <label className="text-lg font-black text-[#4B4B4B] dark:text-white">Color</label>

              <div className="rounded-2xl border-2 border-[#E5E5E5] dark:border-[#37464f] bg-white dark:bg-[#202f36] p-4 flex gap-4">
                <HexColorPicker
                  color={color}
                  onChange={(val) =>
                    setValue("color", val, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                />

                <div className="flex items-center gap-3">
                  <span
                    className="h-10 w-10 rounded-full border-2 border-[#E5E5E5] dark:border-[#37464f]"
                    style={{ backgroundColor: color }}
                    title={color}
                  />

                  <input
                    className={[
                      "flex rounded-2xl border-2 bg-white dark:bg-[#202f36] px-4 py-2 text-base font-black text-[#4B4B4B] dark:text-white outline-none transition-colors",
                      errors.color
                        ? "border-pink-400"
                        : "border-[#E5E5E5] dark:border-[#37464f] focus:border-[#84D8FF]",
                    ].join(" ")}
                    {...register("color", {
                      required: "Color es obligatorio",
                      setValueAs: (v) => clampHex(String(v)).toUpperCase(),
                      pattern: {
                        value: /^#([0-9a-fA-F]{6})$/,
                        message: "Color inválido (usa formato #RRGGBB)",
                      },
                    })}
                  />
                </div>
              </div>

              {errors.color && (
                <p className="text-sm font-black text-pink-500">
                  {errors.color.message}
                </p>
              )}
            </div>
          </div>

          {/* Footer buttons */}
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
