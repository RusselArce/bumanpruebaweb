import React, { useEffect, useState } from "react";
import { TablaProductos } from "../components/TablaProductos";
import { BtnVolver } from "@/shared/ui/buttons/BtnVolver";
import { useNavigate } from "react-router-dom";
import { FormProducto } from "../components/FormProductos";
import { Toaster } from "sonner";
import { useBuscarProductosQuery } from "@/features/productos/hooks/productos.queries";

function useDebounce<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}

export const ProductosCrudPage: React.FC = () => {
  const navigate = useNavigate();
  const [openForm, setOpenForm] = useState(false);

  const [q, setQ] = useState("");
  const qDebounced = useDebounce(q, 350);

  const buscar = useBuscarProductosQuery(qDebounced);

  const usingSearch = qDebounced.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#131f24] p-6 font-rounded">
      <Toaster />

      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <section className="flex justify-between items-center">
          <section className="relative flex gap-4">
            <BtnVolver onClick={() => navigate(-1)} />

            <h1 className="text-4xl font-black text-[#4B4B4B] dark:text-white tracking-wide">
              Productos
            </h1>
          </section>

          <button
            type="button"
            onClick={() => setOpenForm(true)}
            className="relative inline-flex items-center gap-2 rounded-2xl bg-[#FFC800] px-6 py-3 text-lg font-black text-black
                       border-b-4 border-[#E5A500]
                       hover:brightness-110
                       active:border-b-0 active:translate-y-[2px]
                       transition-all"
          >
            <span>+</span>
            <span>NUEVO</span>
          </button>
        </section>

        {/* Buscador */}
        <section className="flex justify-end">
          <div className="w-full max-w-sm relative">

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar producto..."
              className="w-full rounded-2xl border-2 border-[#E5E5E5] dark:border-[#37464f] bg-white dark:bg-[#202f36] px-5 py-3 pr-24 text-lg font-bold text-[#4B4B4B] dark:text-white outline-none focus:border-[#84D8FF] transition-colors"
            />

            {/* clear + spinner */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">

              {q.length > 0 && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="rounded-xl border-2 border-[#E5E5E5] dark:border-[#37464f] bg-white dark:bg-[#202f36] px-3 py-1 text-xs font-black text-[#4B4B4B] dark:text-white
                             hover:bg-black/5 dark:hover:bg-white/10 active:translate-y-[1px] transition"
                >
                  X
                </button>
              )}

              {usingSearch && buscar.isFetching && (
                <div
                  className="h-5 w-5 rounded-full border-2 border-[#84D8FF] border-t-transparent animate-spin"
                />
              )}

            </div>
          </div>
        </section>

        {/* Tabla */}
        <section>

          <TablaProductos
            dataOverride={usingSearch ? ((buscar.data ?? []) as any) : undefined}
            overrideLoading={usingSearch ? buscar.isLoading || buscar.isFetching : undefined}
            overrideError={usingSearch ? (buscar.error as any) : undefined}
            onRetryOverride={usingSearch ? () => buscar.refetch() : undefined}
          />

        </section>

      </div>

      {/* Modal */}
      <FormProducto
        open={openForm}
        mode="Nuevo"
        onClose={() => setOpenForm(false)}
      />

    </div>
  );
};