import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { Productos } from "@/shared/types/db/tablas";
import { useEmpresaStore } from "@/features/empresa/store/empresa.store";

import {
  useInsertarProductoMutation,
  useEditarProductoMutation,
} from "@/features/productos/hooks/productos.mutations";

import { useMostrarCategoriasProductosQuery } from "@/features/categorias_productos/hooks/categorias_productos.queries";
import { SelectList } from "@/shared/ui/list/SelectList";
import { FormCategoria } from "@/features/categorias_productos/components/FormCategorias";
import {
  useMostrarModificadoresPorEmpresaQuery,
  useMostrarModificadoresPorProductoQuery,
} from "@/features/modificadores/hooks/modificadores.queries";
import { useSincronizarModificadoresProductoMutation } from "@/features/modificadores/hooks/modificadores.mutations";

type FormMode = "Nuevo" | "Editar";

type FormValues = {
  nombre: string;
  precio_venta: number;
  precio_compra: number;
  id_categoria: number;
};

type Props = {
  open: boolean;
  mode: FormMode;
  initial?: Partial<Productos>;
  onClose: () => void;
};

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

export const FormProducto: React.FC<Props> = ({
  open,
  mode,
  initial,
  onClose,
}) => {
  const empresa = useEmpresaStore((s) => s.itemSelect);

  const insertar = useInsertarProductoMutation();
  const editar = useEditarProductoMutation();

  const { data: categorias, refetch } = useMostrarCategoriasProductosQuery();

  const { data: modificadoresDisponibles } = useMostrarModificadoresPorEmpresaQuery();
  const { data: modificadoresDelProducto } = useMostrarModificadoresPorProductoQuery(initial?.id);
  const sincronizarModificadores = useSincronizarModificadoresProductoMutation();

  const [selectedMods, setSelectedMods] = useState<number[]>([]);

  const isSaving = insertar.isPending || editar.isPending || sincronizarModificadores.isPending;

  const [openCategoriaForm, setOpenCategoriaForm] = useState(false);

  const defaults = useMemo<FormValues>(
    () => ({
      nombre: initial?.nombre ?? "",
      precio_venta: Number(initial?.precio_venta ?? 0),
      precio_compra: Number(initial?.precio_compra ?? 0),
      id_categoria: initial?.id_categoria ?? categorias?.[0]?.id ?? 0,
    }),
    [initial, categorias],
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    defaultValues: defaults,
    mode: "onChange",
  });

  useEffect(() => {
    if (open) reset(defaults);
  }, [open, defaults, reset]);

  useEffect(() => {
    if (!open) return;
    setSelectedMods((modificadoresDelProducto ?? []).map((m) => m.id_modificador));
  }, [open, modificadoresDelProducto]);

  const toggleMod = (id: number) => {
    setSelectedMods((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!empresa?.id) {
      toast.error("No hay empresa seleccionada");
      return;
    }

    let idProducto = initial?.id;

    if (mode === "Nuevo") {
      const nuevo = await insertar.mutateAsync({
        payload: {
          nombre: values.nombre.trim(),
          precio_venta: values.precio_venta,
          precio_compra: values.precio_compra,
          id_categoria: values.id_categoria,
          id_empresa: empresa.id,
        },
      });
      idProducto = (nuevo as any)?.id;
    } else {
      if (!initial?.id) {
        toast.error("Falta id para editar");
        return;
      }

      await editar.mutateAsync({
        id: initial.id,
        nombre: values.nombre.trim(),
        precio_venta: values.precio_venta,
        precio_compra: values.precio_compra,
        id_categoria: values.id_categoria,
      });
    }

    if (idProducto) {
      await sincronizarModificadores.mutateAsync({
        id_producto: idProducto,
        idsModificadores: selectedMods,
      });
    }

    onClose();
  });

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
        <div className="w-full max-w-xl rounded-[28px] bg-white dark:bg-[#202f36] border-2 border-[#E5E5E5] dark:border-[#37464f] shadow-xl overflow-hidden">

          {/* Header */}
          <div className="bg-[#F0F2F5] dark:bg-white/5 border-b-2 border-[#E5E5E5] dark:border-[#37464f] px-6 py-5 flex justify-between">
            <h2 className="text-2xl font-black text-[#4B4B4B] dark:text-white">
              {mode === "Nuevo" ? "Nuevo producto" : "Editar producto"}
            </h2>

            <button onClick={onClose} className="rounded-xl p-2 border border-[#E5E5E5] dark:border-[#37464f] text-[#4B4B4B] dark:text-white">
              <XIcon />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={onSubmit} className="p-6 space-y-5 text-[#4B4B4B] dark:text-white">

            {/* Nombre */}
            <div>
              <label className="font-black">Nombre</label>

              <input
                className="w-full border-2 border-[#E5E5E5] dark:border-[#37464f] bg-white dark:bg-[#131f24] text-[#4B4B4B] dark:text-white rounded-2xl px-4 py-3"
                {...register("nombre", { required: "Nombre requerido" })}
              />

              {errors.nombre && (
                <p className="text-pink-500 text-sm">{errors.nombre.message}</p>
              )}
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-black">Categoría</label>

                <button
                  type="button"
                  onClick={() => setOpenCategoriaForm(true)}
                  className="text-sm font-black text-blue-500"
                >
                  + Nueva
                </button>
              </div>

              <input type="hidden" {...register("id_categoria")} />

              <SelectList
                data={categorias ?? []}
                value={watch("id_categoria")}
                onChange={(v) => setValue("id_categoria", Number(v))}
                getLabel={(c) => c.nombre}
                getValue={(c) => c.id}
              />
            </div>

            {/* Precio venta */}
            <div>
              <label className="font-black">Precio venta</label>

              <input
                type="number"
                step="0.01"
                className="w-full border-2 border-[#E5E5E5] dark:border-[#37464f] bg-white dark:bg-[#131f24] text-[#4B4B4B] dark:text-white rounded-2xl px-4 py-3"
                {...register("precio_venta")}
              />
            </div>

            {/* Precio compra */}
            <div>
              <label className="font-black">Precio compra</label>

              <input
                type="number"
                step="0.01"
                className="w-full border-2 border-[#E5E5E5] dark:border-[#37464f] bg-white dark:bg-[#131f24] text-[#4B4B4B] dark:text-white rounded-2xl px-4 py-3"
                {...register("precio_compra")}
              />
            </div>

            {/* Modificadores */}
            {!!modificadoresDisponibles?.length && (
              <div className="space-y-2">
                <label className="font-black">Modificadores disponibles</label>
                <p className="text-xs font-bold text-gray-500 dark:text-white/50">
                  Opciones que el mesero podrá elegir al agregar este producto.
                </p>
                <div className="border-2 border-[#E5E5E5] dark:border-[#37464f] rounded-2xl divide-y divide-[#E5E5E5] dark:divide-[#37464f] max-h-48 overflow-y-auto">
                  {modificadoresDisponibles.map((mod) => (
                    <label
                      key={mod.id}
                      className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5"
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="h-5 w-5 accent-black"
                          checked={selectedMods.includes(mod.id)}
                          onChange={() => toggleMod(mod.id)}
                        />
                        <span className="font-bold text-[#4B4B4B] dark:text-white">{mod.nombre}</span>
                      </span>
                      <span className="text-sm font-black text-gray-500 dark:text-white/50">
                        {Number(mod.precio_extra ?? 0) > 0
                          ? `+ ${Number(mod.precio_extra).toFixed(2)}`
                          : "Gratis"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="border-2 border-[#E5E5E5] dark:border-[#37464f] px-6 py-3 rounded-2xl font-black"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSaving || (!isDirty && mode === "Editar")}
                className="bg-[#FFC800] text-black px-6 py-3 rounded-2xl font-black border-b-4 border-[#E5A500] disabled:opacity-50"
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

      {/* MODAL CATEGORIA (FUERA DEL FORM) */}
      <FormCategoria
        open={openCategoriaForm}
        mode="Nuevo"
        onClose={async () => {
          setOpenCategoriaForm(false);

          // recargar categorias
          await refetch();
        }}
      />
    </>
  );
};