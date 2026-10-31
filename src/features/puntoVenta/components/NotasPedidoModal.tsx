import { useState } from "react";
import { Icon } from "@iconify/react";
import type { DetalleVentaRow } from "@/shared/types/db/tablas";
import { useEditarNotaDetalleVentaMutate } from "@/features/detalle_ventas/hooks/detalle_ventas.mutations";

type Props = {
  dataDetalleVenta: DetalleVentaRow[];
  onClose: () => void;
};

const normalizeNota = (nota?: string | null) => (nota ?? "").trim();
const isEmptyNota = (nota?: string | null) => {
  const n = normalizeNota(nota);
  return n === "" || n === "-" || n === "–";
};

export const NotasPedidoModal = ({ dataDetalleVenta, onClose }: Props) => {
  const editarNotaMutate = useEditarNotaDetalleVentaMutate();
  const [editId, setEditId] = useState<number | null>(null);
  const [texto, setTexto] = useState("");

  const abrirEdicion = (it: DetalleVentaRow) => {
    setEditId(it.id);
    setTexto(isEmptyNota(it.nota) ? "" : normalizeNota(it.nota));
  };

  const guardar = () => {
    if (!editId) return;
    editarNotaMutate.mutate(
      { id: editId, nota: texto.trim() || "-" },
      { onSuccess: () => setEditId(null) },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-md max-h-[85vh] flex flex-col">
        <div className="absolute inset-0 bg-gray-300 dark:bg-[#37464f] rounded-3xl translate-y-1.5" />
        <div className="relative bg-white dark:bg-[#202f36] border-2 border-[#E5E5E5] dark:border-[#37464f] rounded-3xl p-6 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Icon icon="mdi:note-edit-outline" width="22" className="text-[#ff9600]" />
              <h2 className="text-gray-900 dark:text-white font-black uppercase tracking-wide text-sm">
                Notas del pedido
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-lg grid place-items-center text-gray-400 dark:text-white/50 hover:text-gray-700 dark:hover:text-white"
            >
              <Icon icon="mdi:close" width="18" />
            </button>
          </div>

          {!dataDetalleVenta.length ? (
            <p className="text-gray-500 dark:text-[#afbbc9] text-sm text-center py-6">
              No hay productos en esta orden.
            </p>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
              {dataDetalleVenta.map((it) => {
                const hasNota = !isEmptyNota(it.nota);
                const isEditing = editId === it.id;

                return (
                  <div
                    key={it.id}
                    className="rounded-2xl border-2 border-gray-200 dark:border-[#37464f] bg-gray-50 dark:bg-[#131f24] p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {it.descripcion}
                      </span>
                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => abrirEdicion(it)}
                          className="text-xs font-black uppercase text-[#1cb0f6] hover:underline flex-shrink-0"
                        >
                          {hasNota ? "Editar" : "Agregar nota"}
                        </button>
                      )}
                    </div>

                    {!isEditing && hasNota && (
                      <p className="text-xs text-gray-500 dark:text-[#afbbc9] italic mt-1">
                        {normalizeNota(it.nota)}
                      </p>
                    )}

                    {isEditing && (
                      <div className="mt-2">
                        <textarea
                          autoFocus
                          value={texto}
                          onChange={(e) => setTexto(e.target.value)}
                          placeholder="Ej: Sin cebolla..."
                          rows={2}
                          maxLength={160}
                          className="w-full resize-none bg-white dark:bg-[#202f36] border border-gray-300 dark:border-[#3e525d] rounded-xl p-2 text-sm text-gray-900 dark:text-white outline-none focus:border-[#17a4e1]"
                        />
                        <div className="mt-2 flex items-center gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => setEditId(null)}
                            disabled={editarNotaMutate.isPending}
                            className="px-3 py-1.5 rounded-lg text-xs font-black text-gray-500 dark:text-white/70"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={guardar}
                            disabled={editarNotaMutate.isPending || !texto.trim()}
                            className="px-3 py-1.5 rounded-lg text-xs font-black bg-[#58cc02] text-[#131f24] hover:brightness-110 disabled:opacity-60 inline-flex items-center gap-1"
                          >
                            <Icon
                              icon={editarNotaMutate.isPending ? "mdi:loading" : "mdi:content-save-outline"}
                              width="14"
                              className={editarNotaMutate.isPending ? "animate-spin" : ""}
                            />
                            Guardar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
