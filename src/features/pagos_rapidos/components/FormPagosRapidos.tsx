// src/features/pagos_rapidos/components/FormPagosRapidos.tsx
import React, { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { PagosRapidos } from "@/shared/types/db/tablas";
import {
  useInsertarPagosRapidosMutation,
  useEditarPagosRapidosMutation,
} from "@/features/pagos_rapidos/hooks/pagos_rapidos.mutations";

type FormMode = "Nuevo" | "Editar";

type FormValues = {
  monto: number;
  es_exacto: boolean;
  orden: number;
};

type Props = {
  open: boolean;
  mode: FormMode;
  initial?: Partial<FormValues> & { id?: PagosRapidos["id"] };
  onClose: () => void;
};

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const inputClass = (hasError: boolean, disabled?: boolean) =>
  [
    "w-full rounded-2xl border-2 px-4 py-3 text-lg font-black text-[#4B4B4B] dark:text-white bg-white dark:bg-[#131f24] outline-none transition-all",
    disabled ? "bg-[#F0F2F5] dark:bg-white/5 text-[#AFAFAF] dark:text-white/40 cursor-not-allowed" : "",
    hasError ? "border-pink-400" : "border-[#E5E5E5] dark:border-[#37464f] focus:border-[#84D8FF]",
  ].join(" ");

export const FormPagosRapidos: React.FC<Props> = ({ open, mode, initial, onClose }) => {
  const insertar = useInsertarPagosRapidosMutation();
  const editar = useEditarPagosRapidosMutation();

  const isSaving = insertar.isPending || editar.isPending;

  const defaults = useMemo<FormValues>(
    () => ({
      monto: initial?.monto ?? 0,
      es_exacto: initial?.es_exacto ?? false,
      orden: initial?.orden ?? 0,
    }),
    [initial],
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    defaultValues: defaults,
    mode: "onChange",
  });

  const esExacto = watch("es_exacto");

  useEffect(() => {
    if (open) reset(defaults);
  }, [open, reset, defaults]);

  const onSubmit = handleSubmit(async (v) => {
    const payloadBase = {
      monto: v.es_exacto ? 0 : Number(v.monto),
      es_exacto: !!v.es_exacto,
      orden: Number(v.orden) || 0,
    };

    if (mode === "Nuevo") {
      await insertar.mutateAsync(payloadBase);
      onClose();
      return;
    }

    if (!initial?.id) {
      toast.error("Falta id para editar");
      return;
    }

    await editar.mutateAsync({
      id: initial.id,
      ...payloadBase,
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
              {mode === "Nuevo" ? "Nuevo pago rápido" : "Editar pago rápido"}
            </h2>
            <p className="text-sm font-bold text-[#6B6B6B] dark:text-white/50">
              Botones de cobro en efectivo con vuelto automático.
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

        <form onSubmit={onSubmit} className="px-6 py-6 space-y-6">
          <div className="rounded-2xl border-2 border-[#E5E5E5] dark:border-[#37464f] bg-white dark:bg-[#202f36] p-4">
            <label className="flex items-center gap-3">
              <input type="checkbox" className="h-5 w-5 accent-black" {...register("es_exacto")} />
              <span className="text-base font-black text-[#4B4B4B] dark:text-white">
                Pago exacto (botón "EXACTO": cobra el total de la venta, sin vuelto)
              </span>
            </label>
          </div>

          {!esExacto && (
            <div className="space-y-2">
              <label className="text-lg font-black text-[#4B4B4B] dark:text-white">
                Monto del billete recibido
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="Ej: 10"
                className={inputClass(!!errors.monto)}
                {...register("monto", {
                  required: !esExacto ? "Monto es obligatorio" : false,
                  min: { value: 0.01, message: "Debe ser mayor a 0" },
                  valueAsNumber: true,
                })}
              />
              {errors.monto && (
                <p className="text-sm font-black text-pink-500">{errors.monto.message}</p>
              )}
              <p className="text-xs font-bold text-[#7A7A7A] dark:text-white/50">
                En el punto de venta se mostrará con el símbolo de moneda de tu empresa (Ej: "S/
                10").
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-lg font-black text-[#4B4B4B] dark:text-white">Orden</label>
            <input
              type="number"
              className={inputClass(!!errors.orden)}
              {...register("orden", { valueAsNumber: true })}
            />
            <p className="text-xs font-bold text-[#7A7A7A] dark:text-white/50">
              Los botones se muestran de menor a mayor orden.
            </p>
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
