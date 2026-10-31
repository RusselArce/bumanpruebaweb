import React, { useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import type { ModificadorSeleccionado } from "@/shared/types/db/tablas";

type ModificadorDisponible = {
  id_modificador: number;
  modificadores: { id: number; nombre: string; precio_extra: number } | null;
};

type Props = {
  producto: {
    id: number;
    nombre: string;
    precio_venta: number;
    producto_modificadores?: ModificadorDisponible[];
  };
  isLoading?: boolean;
  onConfirm: (modificadores: ModificadorSeleccionado[]) => void;
  onClose: () => void;
};

export const SeleccionarModificadoresModal = ({ producto, isLoading, onConfirm, onClose }: Props) => {
  const opciones = useMemo(
    () =>
      (producto.producto_modificadores ?? [])
        .map((pm) => pm.modificadores)
        .filter((m): m is { id: number; nombre: string; precio_extra: number } => !!m),
    [producto.producto_modificadores],
  );

  const [seleccionados, setSeleccionados] = useState<number[]>([]);

  const toggle = (id: number) => {
    setSeleccionados((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const extra = opciones
    .filter((o) => seleccionados.includes(o.id))
    .reduce((acc, o) => acc + Number(o.precio_extra || 0), 0);

  const totalPreview = Number(producto.precio_venta || 0) + extra;

  const confirmar = () => {
    const modificadores: ModificadorSeleccionado[] = opciones
      .filter((o) => seleccionados.includes(o.id))
      .map((o) => ({ id_modificador: o.id, nombre: o.nombre, precio_extra: o.precio_extra }));

    onConfirm(modificadores);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 font-sans">
      <div className="relative bg-white dark:bg-[#202f36] border-2 border-[#E5E5E5] dark:border-[#37464f] w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-6 py-5 border-b-2 border-[#E5E5E5] dark:border-[#37464f] flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-white/40">
              Personalizar
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white">{producto.nombre}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 dark:text-white/50 hover:text-gray-700 dark:hover:text-white">
            <Icon icon="mdi:close" width="24" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {opciones.map((op) => (
            <label
              key={op.id}
              className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-[#131f24] border-2 border-[#E5E5E5] dark:border-[#37464f] rounded-2xl px-4 py-3 cursor-pointer hover:border-gray-400 dark:hover:border-white/30"
            >
              <span className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-[#58cc02]"
                  checked={seleccionados.includes(op.id)}
                  onChange={() => toggle(op.id)}
                />
                <span className="font-bold text-gray-900 dark:text-white">{op.nombre}</span>
              </span>
              <span className="text-sm font-black text-[#58cc02]">
                {Number(op.precio_extra || 0) > 0 ? `+ ${Number(op.precio_extra).toFixed(2)}` : "Gratis"}
              </span>
            </label>
          ))}
        </div>

        <div className="px-6 py-5 border-t-2 border-[#E5E5E5] dark:border-[#37464f]">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-white/40">Total</span>
            <span className="text-2xl font-black text-amber-600 dark:text-[#ffd900]">S/ {totalPreview.toFixed(2)}</span>
          </div>

          <button
            onClick={confirmar}
            disabled={isLoading}
            className="w-full py-4 rounded-2xl font-black text-lg text-white bg-[#58cc02] border-b-4 border-[#46a302] active:border-b-0 active:translate-y-[4px] disabled:opacity-50 transition-all"
          >
            <span className="inline-flex items-center gap-2">
              <Icon icon={isLoading ? "mdi:loading" : "mdi:cart-plus"} className={isLoading ? "animate-spin" : ""} width="22" />
              AGREGAR
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
