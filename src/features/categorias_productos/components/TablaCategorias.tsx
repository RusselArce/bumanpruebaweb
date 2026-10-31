import { useMostrarCategoriasProductosQuery } from "@/features/categorias_productos/hooks/categorias_productos.queries";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useCategoriasProductosStore } from "@/features/categorias_productos/store/categorias_productos.store";
import { useEliminarCategoriaMutation } from "@/features/categorias_productos/hooks/categorias_productos.mutations";
import { FormCategoria } from "./FormCategorias";

type CategoriaDb = {
  id: number;
  nombre: string | null;
  color: string | null;
  id_empresa: number;
};

type TablaCategoriasProps = {
  // ✅ override desde buscador (query buscar)
  dataOverride?: CategoriaDb[];
  overrideLoading?: boolean;
  overrideError?: any;
  onRetryOverride?: () => void;
  // opcional: para mostrar "sin resultados" vs "aún no hay categorías"
  emptyLabel?: { title: string; subtitle?: string };
};

function ColorDot({ color }: { color: string }) {
  return (
    <span
      className="h-6 w-6 rounded-full shadow-inner ring-2 ring-white border border-black/5"
      style={{ backgroundColor: color }}
      title={color}
    />
  );
}

function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="even:bg-[#F7F7F7] dark:even:bg-white/5">
          <td className="px-6 py-4">
            <div className="h-6 w-56 rounded-xl bg-black/10 dark:bg-white/10 animate-pulse" />
          </td>
          <td className="px-6 py-4">
            <div className="flex justify-center">
              <div className="h-6 w-6 rounded-full bg-black/10 dark:bg-white/10 animate-pulse" />
            </div>
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

export function TablaCategorias({
  dataOverride,
  overrideLoading,
  overrideError,
  onRetryOverride,
  emptyLabel,
}: TablaCategoriasProps) {
  const { data, isLoading, error, refetch } = useMostrarCategoriasProductosQuery();

  const setItemSelect = useCategoriasProductosStore((s) => s.setItemSelect);
  const eliminarMutation = useEliminarCategoriaMutation();

  // ✅ si viene override, usamos eso en vez del query normal
  const usingOverride = dataOverride !== undefined;

  const effectiveData = usingOverride ? dataOverride : ((data ?? []) as any);
  const effectiveLoading = usingOverride ? !!overrideLoading : isLoading;
  const effectiveError = usingOverride ? overrideError : error;
  const effectiveRetry = usingOverride ? (onRetryOverride ?? (() => {})) : () => refetch();

  const rows: CategoriaDb[] = useMemo(() => {
    return (effectiveData ?? []) as CategoriaDb[];
  }, [effectiveData]);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

  // ✅ cuando cambia dataset (por buscar/limpiar), te manda a página 1
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

  // Modal editar
  const [openForm, setOpenForm] = useState(false);
  const [mode, setMode] = useState<"Nuevo" | "Editar">("Editar");
  const [initial, setInitial] = useState<{ id?: number; nombre?: string; color?: string }>({});

  const onEdit = (c: CategoriaDb) => {
    setItemSelect(c as any);

    setMode("Editar");
    setInitial({
      id: c.id,
      nombre: c.nombre ?? "",
      color: c.color ?? "#9CA3AF",
    });
    setOpenForm(true);
  };

  const onDelete = (c: CategoriaDb) => {
    if ((c.nombre ?? "").toLowerCase() === "general") {
      toast.error("No se puede eliminar la categoría por defecto (General).");
      return;
    }

    const ok = confirm(`¿Eliminar la categoría "${c.nombre ?? ""}"?`);
    if (!ok) return;

    eliminarMutation.mutate({
      id: c.id,
      id_empresa: c.id_empresa,
    });
  };

  if (effectiveError) {
    const msg = (effectiveError as any)?.message ?? "Error inesperado";
    return <ErrorState message={msg} onRetry={effectiveRetry} />;
  }

  const emptyTitle =
    emptyLabel?.title ??
    (usingOverride ? "Sin resultados" : "Aún no hay categorías");

  const emptySubtitle =
    emptyLabel?.subtitle ??
    (usingOverride
      ? "Prueba con otro texto de búsqueda."
      : 'Crea tu primera categoría con el botón "NUEVO".');

  return (
    <>
      <div className="w-full">
        <div className="max-w-6xl mx-auto rounded-xl overflow-hidden">
          <table className="w-full border-collapse bg-white dark:bg-[#202f36]">
            <thead>
              <tr className="text-[#151515] dark:text-white font-black text-2xs uppercase border-b-2 border-dashed border-[#E5E5E5] dark:border-[#37464f]">
                <th className="px-6 py-4 text-left">Descripción</th>
                <th className="px-6 py-4 text-center">Color</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>

            {effectiveLoading ? (
              <SkeletonRows rows={pageSize} />
            ) : rows.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={3} className="px-6 py-12">
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
                {pageRows.map((c) => (
                  <tr
                    key={c.id}
                    className="group even:bg-[#F7F7F7] dark:even:bg-white/5 transition-colors hover:bg-[#E1F5FE] dark:hover:bg-white/10"
                  >
                    {/* Nombre */}
                    <td className="px-6 py-4">
                      <span className="text-xl font-bold text-[#4B4B4B] dark:text-white tracking-tight">
                        {c.nombre ?? "(Sin nombre)"}
                      </span>
                    </td>

                    {/* Color */}
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <ColorDot color={c.color ?? "#9CA3AF"} />
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-4">
                        <button
                          type="button"
                          onClick={() => onEdit(c)}
                          className="text-[#AFAFAF] dark:text-white/40 hover:text-[#1CB0F6] transition-colors"
                          title="Editar"
                        >
                          <PencilIcon />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDelete(c)}
                          disabled={eliminarMutation.isPending}
                          className="text-[#AFAFAF] dark:text-white/40 hover:text-[#FF4B4B] transition-colors disabled:opacity-40"
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

          {/* Paginación Duolingo */}
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

      {/* Modal Form Editar */}
      <FormCategoria
        open={openForm}
        mode={mode}
        initial={initial}
        onClose={() => {
          setOpenForm(false);
          setItemSelect(null);
        }}
      />
    </>
  );
}