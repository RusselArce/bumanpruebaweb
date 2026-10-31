import React, { useEffect, useMemo, useState } from "react";

import { useMostrarProductosPorCategoriaQuery } from "@/features/productos/hooks/productos.queries";
import { useEliminarProductoMutation } from "@/features/productos/hooks/productos.mutations";

import { FormProducto } from "./FormProductos";

type ProductoDb = {
  id: number;
  nombre: string | null;
  precio_venta: number;
  codigo_barras: string | null;
};

type TablaProductosProps = {
  dataOverride?: ProductoDb[];
  overrideLoading?: boolean;
  overrideError?: any;
  onRetryOverride?: () => void;
  emptyLabel?: { title: string; subtitle?: string };
};

function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="even:bg-[#F7F7F7] dark:even:bg-white/5">
          <td className="px-6 py-4">
            <div className="h-6 w-56 rounded-xl bg-black/10 dark:bg-white/10 animate-pulse" />
          </td>
          <td className="px-6 py-4">
            <div className="h-6 w-20 rounded-xl bg-black/10 dark:bg-white/10 animate-pulse" />
          </td>
          <td className="px-6 py-4">
            <div className="h-6 w-32 rounded-xl bg-black/10 dark:bg-white/10 animate-pulse" />
          </td>
          <td className="px-6 py-4">
            <div className="flex justify-end gap-4">
              <div className="h-8 w-8 rounded-xl bg-black/10 dark:bg-white/10 animate-pulse" />
              <div className="h-8 w-8 rounded-xl bg-black/10 dark:bg-white/10 animate-pulse" />
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-3xl border-2 border-[#E5E5E5] dark:border-[#37464f] bg-white dark:bg-[#202f36] p-8 text-center">
      <p className="text-xl font-black text-[#4B4B4B] dark:text-white">Ocurrió un error</p>
      <p className="mt-2 text-sm font-bold text-[#7A7A7A] dark:text-white/50 break-words">
        {message}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex items-center justify-center rounded-2xl bg-[#FFC800] px-6 py-3 text-base font-black text-black
                   border-b-4 border-[#E5A500] hover:brightness-110 active:border-b-0 active:translate-y-[2px] transition-all"
      >
        Reintentar
      </button>
    </div>
  );
}

const PencilIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.5"
      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
    />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.5"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

export function TablaProductos({
  dataOverride,
  overrideLoading,
  overrideError,
  onRetryOverride,
  emptyLabel,
}: TablaProductosProps) {
  const { data, isLoading, error, refetch } = useMostrarProductosPorCategoriaQuery();

  const eliminarMutation = useEliminarProductoMutation();

  const usingOverride = dataOverride !== undefined;

  const effectiveData = usingOverride ? dataOverride : ((data ?? []) as any);
  const effectiveLoading = usingOverride ? !!overrideLoading : isLoading;
  const effectiveError = usingOverride ? overrideError : error;
  const effectiveRetry = usingOverride ? (onRetryOverride ?? (() => {})) : () => refetch();

  const rows: ProductoDb[] = useMemo(() => {
    return (effectiveData ?? []) as ProductoDb[];
  }, [effectiveData]);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [usingOverride, rows.length]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
    if (page < 1) setPage(1);
  }, [page, totalPages]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page]);

  const [openForm, setOpenForm] = useState(false);
  const [mode, setMode] = useState<"Nuevo" | "Editar">("Editar");
  const [initial, setInitial] = useState<any>({});

  const onEdit = (p: ProductoDb) => {
    setMode("Editar");
    setInitial(p);
    setOpenForm(true);
  };

  const onDelete = (p: ProductoDb) => {
    const ok = confirm(`¿Eliminar "${p.nombre ?? ""}"?`);
    if (!ok) return;

    eliminarMutation.mutate({ id: p.id });
  };

  if (effectiveError) {
    const msg = (effectiveError as any)?.message ?? "Error inesperado";
    return <ErrorState message={msg} onRetry={effectiveRetry} />;
  }

  const emptyTitle =
    emptyLabel?.title ?? (usingOverride ? "Sin resultados" : "Aún no hay productos");

  const emptySubtitle =
    emptyLabel?.subtitle ??
    (usingOverride
      ? "Prueba con otro texto de búsqueda."
      : 'Crea tu primer producto con el botón "NUEVO".');

  return (
    <>
      <div className="w-full">
        <div className="max-w-6xl mx-auto rounded-xl overflow-hidden">
          <table className="w-full border-collapse bg-white dark:bg-[#202f36]">
            <thead>
              <tr className="text-[#151515] dark:text-white font-black text-2xs uppercase border-b-2 border-dashed border-[#E5E5E5] dark:border-[#37464f]">
                <th className="px-6 py-4 text-left">Producto</th>
                <th className="px-6 py-4 text-left">Precio</th>
                <th className="px-6 py-4 text-left">Código</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>

            {effectiveLoading ? (
              <SkeletonRows rows={pageSize} />
            ) : rows.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={4} className="px-6 py-12">
                    <div className="rounded-3xl bg-[#F0F2F5] dark:bg-white/5 border-2 border-[#E5E5E5] dark:border-[#37464f] p-10 text-center">
                      <p className="text-2xl font-black text-[#4B4B4B] dark:text-white">
                        {emptyTitle}
                      </p>
                      <p className="mt-2 text-sm font-bold text-[#7A7A7A] dark:text-white/50">
                        {emptySubtitle}{" "}
                        {!usingOverride && <span className="text-black dark:text-white">NUEVO</span>}
                      </p>
                    </div>
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {pageRows.map((p) => (
                  <tr
                    key={p.id}
                    className="group even:bg-[#F7F7F7] dark:even:bg-white/5 transition-colors hover:bg-[#E1F5FE] dark:hover:bg-white/10"
                  >
                    <td className="px-6 py-4">
                      <span className="text-xl font-bold text-[#4B4B4B] dark:text-white tracking-tight">
                        {p.nombre ?? "(Sin nombre)"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-lg font-bold text-[#4B4B4B] dark:text-white">
                        S/ {p.precio_venta}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-[#7A7A7A] dark:text-white/50">
                        {p.codigo_barras ?? "-"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-4">
                        <button
                          type="button"
                          onClick={() => onEdit(p)}
                          className="text-[#AFAFAF] hover:text-[#1CB0F6] transition-colors"
                          title="Editar"
                        >
                          <PencilIcon />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDelete(p)}
                          disabled={eliminarMutation.isPending}
                          className="text-[#AFAFAF] hover:text-[#FF4B4B] transition-colors disabled:opacity-40"
                          title="Eliminar"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>

          {!effectiveLoading && rows.length > 0 && (
            <div className="flex items-center justify-center gap-8 mt-8">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[#E5E5E5] dark:bg-white/10 border-b-4 border-[#AFAFAF] dark:border-white/20
                           active:border-b-0 active:translate-y-[4px]
                           disabled:opacity-30 disabled:pointer-events-none transition-all"
                title="Anterior"
              >
                <svg className="w-6 h-6 text-[#4B4B4B] dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="flex items-center gap-3 font-black text-[#AFAFAF] dark:text-white/40 uppercase tracking-tighter">
                <span className="text-[#4B4B4B] dark:text-white text-2xl">{page}</span>
                <span className="text-sm">de</span>
                <span className="text-xl">{totalPages}</span>
              </div>

              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[#E5E5E5] dark:bg-white/10 border-b-4 border-[#AFAFAF] dark:border-white/20
                           active:border-b-0 active:translate-y-[4px]
                           disabled:opacity-30 disabled:pointer-events-none transition-all"
                title="Siguiente"
              >
                <svg className="w-6 h-6 text-[#4B4B4B] dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      <FormProducto
        open={openForm}
        mode={mode}
        initial={initial}
        onClose={() => setOpenForm(false)}
      />
    </>
  );
}
