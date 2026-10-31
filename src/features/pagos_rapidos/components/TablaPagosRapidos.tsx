// src/features/pagos_rapidos/components/TablaPagosRapidos.tsx
import React, { useMemo, useState } from "react";
import type { PagosRapidos } from "@/shared/types/db/tablas";
import { useMostrarPagosRapidosPorEmpresaQuery } from "@/features/pagos_rapidos/hooks/pagos_rapidos.queries";
import { useEliminarPagosRapidosMutation } from "@/features/pagos_rapidos/hooks/pagos_rapidos.mutations";
import { FormPagosRapidos } from "./FormPagosRapidos";
import { useEmpresaStore } from "@/features/empresa/store/empresa.store";

function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="even:bg-[#F7F7F7] dark:even:bg-white/5">
          <td className="px-6 py-4">
            <div className="h-6 w-56 rounded-xl bg-black/10 dark:bg-white/10 animate-pulse" />
          </td>
          <td className="px-6 py-4">
            <div className="h-6 w-24 rounded-xl bg-black/10 dark:bg-white/10 animate-pulse" />
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

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-3xl border-2 border-[#E5E5E5] dark:border-[#37464f] bg-white dark:bg-[#202f36] p-8 text-center">
      <p className="text-xl font-black text-[#4B4B4B] dark:text-white">Ocurrió un error</p>
      <p className="mt-2 text-sm font-bold text-[#7A7A7A] dark:text-white/50 break-words">{message}</p>

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

export function TablaPagosRapidos() {
  const { data, isLoading, error, refetch } = useMostrarPagosRapidosPorEmpresaQuery();
  const eliminarMutation = useEliminarPagosRapidosMutation();
  const simboloMoneda = useEmpresaStore((s) => s.itemSelect)?.simbolo_moneda ?? "S/";

  const rows = useMemo(() => (data ?? []) as PagosRapidos[], [data]);

  const [openForm, setOpenForm] = useState(false);
  const [mode, setMode] = useState<"Nuevo" | "Editar">("Nuevo");
  const [initial, setInitial] = useState<
    Partial<Omit<Pick<PagosRapidos, "id" | "monto" | "es_exacto" | "orden">, "monto">> & {
      monto?: number;
    }
  >({});

  const onNew = () => {
    setMode("Nuevo");
    setInitial({});
    setOpenForm(true);
  };

  const onEdit = (p: PagosRapidos) => {
    setMode("Editar");
    setInitial({
      id: p.id,
      monto: Number(p.monto),
      es_exacto: !!p.es_exacto,
      orden: p.orden,
    });
    setOpenForm(true);
  };

  const onDelete = (p: PagosRapidos) => {
    const etiqueta = p.es_exacto ? "EXACTO" : `${simboloMoneda} ${Number(p.monto)}`;
    const ok = confirm(`¿Eliminar "${etiqueta}"?`);
    if (!ok) return;
    eliminarMutation.mutate(p.id);
  };

  if (error) {
    const msg = (error as any)?.message ?? "Error inesperado";
    return <ErrorState message={msg} onRetry={() => refetch()} />;
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={onNew}
          className="relative inline-flex items-center gap-2 rounded-2xl bg-[#FFC800] px-6 py-3 text-lg font-black text-black
                     border-b-4 border-[#E5A500] hover:brightness-110 active:border-b-0 active:translate-y-[2px] transition-all"
        >
          <span>+</span>
          <span>NUEVO</span>
        </button>
      </div>

      <div className="w-full">
        <div className="max-w-6xl mx-auto rounded-xl overflow-hidden">
          <table className="w-full border-collapse bg-white dark:bg-[#202f36]">
            <thead>
              <tr className="text-[#151515] dark:text-white font-black text-2xs uppercase border-b-2 border-dashed border-[#E5E5E5] dark:border-[#37464f]">
                <th className="px-6 py-4 text-left">Botón en el POS</th>
                <th className="px-6 py-4 text-left">Tipo</th>
                <th className="px-6 py-4 text-left">Orden</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>

            {isLoading ? (
              <SkeletonRows rows={5} />
            ) : rows.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={4} className="px-6 py-12">
                    <div className="rounded-3xl bg-[#F0F2F5] dark:bg-white/5 border-2 border-[#E5E5E5] dark:border-[#37464f] p-10 text-center">
                      <p className="text-2xl font-black text-[#4B4B4B] dark:text-white">
                        Aún no hay pagos rápidos
                      </p>
                      <p className="mt-2 text-sm font-bold text-[#7A7A7A] dark:text-white/50">
                        Crea el primero con el botón <span className="text-black dark:text-white">NUEVO</span>
                      </p>
                    </div>
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="group even:bg-[#F7F7F7] dark:even:bg-white/5 hover:bg-[#E1F5FE] dark:hover:bg-white/10 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-xl font-bold text-[#4B4B4B] dark:text-white tracking-tight">
                        {p.es_exacto ? "EXACTO" : `${simboloMoneda} ${Number(p.monto)}`}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-[#4B4B4B] dark:text-white">
                        {p.es_exacto
                          ? "Monto exacto de la venta"
                          : `Billete de ${simboloMoneda} ${Number(p.monto)}`}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-[#4B4B4B] dark:text-white">{p.orden}</span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-4">
                        <button
                          type="button"
                          onClick={() => onEdit(p)}
                          className="text-[#AFAFAF] dark:text-white/40 hover:text-[#1CB0F6] transition-colors"
                          title="Editar"
                        >
                          <PencilIcon />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDelete(p)}
                          disabled={eliminarMutation.isPending}
                          className={[
                            "text-[#AFAFAF] dark:text-white/40 hover:text-[#FF4B4B] transition-colors",
                            eliminarMutation.isPending ? "opacity-40" : "",
                          ].join(" ")}
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
        </div>
      </div>

      <FormPagosRapidos
        open={openForm}
        mode={mode}
        initial={initial}
        onClose={() => setOpenForm(false)}
      />
    </>
  );
}
