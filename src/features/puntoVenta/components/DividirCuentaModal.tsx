import { useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import type { DetalleVentaRow } from "@/shared/types/db/tablas";

type Props = {
  dataDetalleVenta: DetalleVentaRow[];
  simbolo: string;
  isLoading?: boolean;
  onConfirmar: (idsDetalle: number[]) => void;
  onClose: () => void;
};

export const DividirCuentaModal = ({
  dataDetalleVenta,
  simbolo,
  isLoading,
  onConfirmar,
  onClose,
}: Props) => {
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());

  const money = (n: number) => `${simbolo} ${(n || 0).toFixed(2)}`;

  const toggle = (id: number) => {
    if (isLoading) return;
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const { totalNueva, totalActual } = useMemo(() => {
    let nueva = 0;
    let actual = 0;
    for (const it of dataDetalleVenta) {
      if (seleccionados.has(it.id)) nueva += Number(it.total || 0);
      else actual += Number(it.total || 0);
    }
    return { totalNueva: nueva, totalActual: actual };
  }, [dataDetalleVenta, seleccionados]);

  const puedeDividir =
    seleccionados.size > 0 && seleccionados.size < dataDetalleVenta.length && !isLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-lg max-h-[88vh] flex flex-col">
        <div className="absolute inset-0 bg-gray-300 dark:bg-[#37464f] rounded-3xl translate-y-1.5" />
        <div className="relative bg-white dark:bg-[#202f36] border-2 border-[#E5E5E5] dark:border-[#37464f] rounded-3xl p-6 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Icon icon="mdi:call-split" width="22" className="text-[#1cb0f6]" />
              <h2 className="text-gray-900 dark:text-white font-black uppercase tracking-wide text-sm">
                Dividir cuenta
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="h-8 w-8 rounded-lg grid place-items-center text-gray-400 dark:text-white/50 hover:text-gray-700 dark:hover:text-white disabled:opacity-50"
            >
              <Icon icon="mdi:close" width="18" />
            </button>
          </div>

          <p className="text-gray-500 dark:text-[#afbbc9] text-sm mb-4 flex-shrink-0">
            Marca los productos que se van a una cuenta aparte. Esa parte se cobra de una vez;
            el resto se queda en esta mesa.
          </p>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
            {dataDetalleVenta.map((it) => {
              const checked = seleccionados.has(it.id);
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => toggle(it.id)}
                  disabled={isLoading}
                  className={`w-full flex items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3 text-left transition disabled:opacity-60 ${
                    checked
                      ? "bg-[#1cb0f6]/10 border-[#1cb0f6]"
                      : "bg-gray-50 dark:bg-[#131f24] border-gray-200 dark:border-[#37464f] hover:border-gray-300 dark:hover:border-white/30"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`h-5 w-5 rounded-md border-2 grid place-items-center flex-shrink-0 ${
                        checked ? "border-[#1cb0f6] bg-[#1cb0f6]" : "border-gray-300 dark:border-[#3e525d]"
                      }`}
                    >
                      {checked && <Icon icon="mdi:check" width="14" className="text-white" />}
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {it.descripcion}
                    </span>
                  </div>
                  <span className="text-sm font-black text-gray-700 dark:text-white/80 flex-shrink-0">
                    {money(Number(it.total))}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex-shrink-0 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-[#131f24] rounded-2xl p-3 text-center">
                <div className="text-[10px] font-black uppercase text-gray-400 dark:text-white/40">
                  Se queda en la mesa
                </div>
                <div className="text-lg font-black text-gray-900 dark:text-white">
                  {money(totalActual)}
                </div>
              </div>
              <div className="bg-[#1cb0f6]/10 rounded-2xl p-3 text-center">
                <div className="text-[10px] font-black uppercase text-[#1cb0f6]">Cuenta nueva</div>
                <div className="text-lg font-black text-[#1cb0f6]">{money(totalNueva)}</div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 py-3 rounded-xl font-black text-sm text-gray-500 dark:text-white/70 border border-gray-300 dark:border-[#3e525d] disabled:opacity-50"
              >
                CANCELAR
              </button>
              <button
                type="button"
                onClick={() => onConfirmar(Array.from(seleccionados))}
                disabled={!puedeDividir}
                className="flex-1 py-3 rounded-xl font-black text-sm bg-[#1cb0f6] text-white hover:brightness-110 disabled:opacity-40 inline-flex items-center justify-center gap-2"
              >
                <Icon
                  icon={isLoading ? "mdi:loading" : "mdi:cash-register"}
                  width="18"
                  className={isLoading ? "animate-spin" : ""}
                />
                DIVIDIR Y COBRAR
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
