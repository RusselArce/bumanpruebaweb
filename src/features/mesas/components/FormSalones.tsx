import React, { useMemo } from "react";
import { useForm } from "react-hook-form";
import {
  useInsertarSalonesMutation,
  useEditarSalonesMutation,
} from "@/features/salones/hooks/salones.mutations";
import { useSalonesStore } from "@/features/salones/store/salones.store";
import { useAsignacionesSucursalesStore } from "@/features/asignacion_sucursal/store/asignacion_sucursal";

type FormValues = {
  nombre: string;
};

export const FormSalones = () => {
  const { formMode, formItem, closeForm } = useSalonesStore();
  const insertar = useInsertarSalonesMutation();
  const editar = useEditarSalonesMutation();

  const itemSucursalAsignada = useAsignacionesSucursalesStore(
    (s) => s.itemSelect,
  );

  const defaults = useMemo<FormValues>(
    () => ({
      nombre: formItem?.nombre ?? "",
    }),
    [formItem],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: defaults,
  });

  const onSubmit = handleSubmit(async (v) => {
    const nombre = v.nombre.trim();

    if (formMode === "Nuevo") {
      await insertar.mutateAsync({
        nombre,
        id_sucursal: itemSucursalAsignada?.id_sucursal,
      } as any);
    } else {
      if (!formItem?.id) return;

      await editar.mutateAsync({
        id: formItem.id,
        nombre,
      });
    }

    closeForm();
  });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
  <div className="bg-white dark:bg-[#202f36] text-gray-900 dark:text-white rounded-2xl p-6 w-[500px] shadow-xl border border-[#E5E5E5] dark:border-[#37464f]">

    <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
      {formMode === "Nuevo" ? "Nuevo Salón" : "Editar Salón"}
    </h2>

    <form onSubmit={onSubmit} className="space-y-4">

      <input
        {...register("nombre", { required: "Nombre obligatorio" })}
        placeholder="Nombre del salón"
        className="w-full bg-gray-50 dark:bg-[#131f24] border border-[#E5E5E5] dark:border-[#37464f] rounded-xl p-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:border-[#1cb0f6] transition"
      />

      {errors.nombre && (
        <p className="text-red-500 text-sm">{errors.nombre.message}</p>
      )}

      <div className="flex justify-end gap-3 pt-2">

        <button
          type="button"
          onClick={closeForm}
          className="px-4 py-2 border border-[#E5E5E5] dark:border-[#37464f] rounded-xl text-gray-900 dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition"
        >
          Cancelar
        </button>

        <button
          type="submit"
          className="px-4 py-2 bg-yellow-400 text-black rounded-xl font-bold hover:bg-yellow-300 transition"
        >
          {formMode === "Nuevo" ? "Crear" : "Guardar"}
        </button>

      </div>

    </form>
  </div>
</div>
  );
};