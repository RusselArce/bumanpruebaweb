import React from "react";
import { Icon } from "@iconify/react";
import { useAsignacionesSucursalesStore } from "../store/asignacion_sucursal";

type Props = {
  /** Si se pasa, el modal se puede cerrar (uso: "Cambiar de empresa" desde el menú de perfil).
   *  Si se omite, es obligatorio elegir (uso: primer login con varias empresas). */
  onClose?: () => void;
};

export const SelectorEmpresaModal: React.FC<Props> = ({ onClose }) => {
  const todasLasAsignaciones = useAsignacionesSucursalesStore((s) => s.todasLasAsignaciones);
  const itemSelect = useAsignacionesSucursalesStore((s) => s.itemSelect);
  const elegirAsignacion = useAsignacionesSucursalesStore((s) => s.elegirAsignacion);

  const elegir = (a: (typeof todasLasAsignaciones)[number]) => {
    elegirAsignacion(a);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 font-sans backdrop-blur-sm">
      <div className="relative bg-white dark:bg-[#202f36] border border-[#E5E5E5] dark:border-[#37464f] w-full max-w-md rounded-4xl p-6 space-y-4 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white">Elige una empresa</h3>
            <p className="text-xs font-bold text-gray-400 dark:text-white/40 mt-1">
              Perteneces a más de una — selecciona con cuál quieres trabajar ahora.
            </p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-xl border border-[#E5E5E5] dark:border-[#37464f] p-2 text-gray-400 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title="Cerrar"
            >
              <Icon icon="mdi:close" width="18" />
            </button>
          )}
        </div>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {todasLasAsignaciones.map((a) => {
            const empresa = a.sucursales?.empresa;
            const activa = itemSelect?.id === a.id;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => elegir(a)}
                className={`w-full flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${
                  activa
                    ? "border-sky-400 bg-sky-400/10"
                    : "border-[#E5E5E5] dark:border-[#37464f] hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gray-100 dark:bg-white/5 text-sm font-black text-gray-500 dark:text-white/60">
                  {(empresa?.nombre ?? "?").charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-black text-gray-900 dark:text-white truncate">
                    {empresa?.nombre ?? "Empresa"}
                  </span>
                  <span className="block text-xs font-bold text-gray-400 dark:text-white/40 truncate">
                    {(a as any).sucursales?.nombre ?? "Sucursal"}
                  </span>
                </span>
                {activa && <Icon icon="mdi:check-circle" width="20" className="text-sky-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
