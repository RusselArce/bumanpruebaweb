import React, { useState } from "react";
import { SelectList } from "../../../shared/ui/list/SelectList";

import { useMostrarCategoriasProductosQuery } from "@/features/categorias_productos/hooks/categorias_productos.queries";
import { FormCategoria } from "@/features/categorias_productos/components/FormCategorias";

type Props = {
  value?: number;
  onChange: (v: number) => void;
};

export function CategoriaSelect({ value, onChange }: Props) {
  const { data: categorias } = useMostrarCategoriasProductosQuery();

  const [openCategoriaForm, setOpenCategoriaForm] = useState(false);

  return (
    <div className="space-y-2">

      {/* Label + botón */}
      <div className="flex items-center justify-between">

        <label className="text-lg font-black text-[#4B4B4B] dark:text-white">
          Categoría
        </label>

        <button
          type="button"
          onClick={() => setOpenCategoriaForm(true)}
          className="rounded-xl bg-[#FFC800] px-3 py-1 text-sm font-black border-b-2 border-[#E5A500]
                     hover:brightness-110 active:translate-y-[1px]"
        >
          + Nueva
        </button>

      </div>

      {/* Select */}
      <SelectList
        data={categorias ?? []}
        value={value}
        onChange={(v) => onChange(Number(v))}
        getLabel={(c) => c.nombre}
        getValue={(c) => c.id}
        placeholder="Seleccionar categoría"
      />

      {/* Modal crear categoria */}
      <FormCategoria
        open={openCategoriaForm}
        mode="Nuevo"
        onClose={() => setOpenCategoriaForm(false)}
      />

    </div>
  );
}