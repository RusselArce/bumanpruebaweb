// src/features/movimientos_caja/pages/MovimientosVariosPage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { BtnVolver } from "@/shared/ui/buttons/BtnVolver";
import { useCierresCajaStore } from "@/features/cierres_caja/store/cierres_caja.store";
import { useAsignacionesSucursalesStore } from "@/features/asignacion_sucursal/store/asignacion_sucursal";
import {
  useInsertarMovimientoCajaMutation,
  useEliminarMovimientoCajaMutation,
} from "@/features/movimientos_caja/hooks/movimientos_caja.mutations";
import { useMostrarMovimientosCajaPorTipoQuery } from "@/features/movimientos_caja/hooks/movimientos_caja.queries";

type Props = {
  tipo: "ingreso" | "gasto";
  titulo: string;
};

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

export const MovimientosVariosPage: React.FC<Props> = ({ tipo, titulo }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const itemSelectCierreCaja = useCierresCajaStore((s) => s.itemSelect);
  const itemSelectAsignacionSucursal = useAsignacionesSucursalesStore(
    (s) => s.itemSelect,
  );

  const { data, isLoading, error, refetch } =
    useMostrarMovimientosCajaPorTipoQuery(tipo);
  const insertar = useInsertarMovimientoCajaMutation();
  const eliminar = useEliminarMovimientoCajaMutation();

  const [openForm, setOpenForm] = useState(searchParams.get("new") === "1");
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setOpenForm(true);
      searchParams.delete("new");
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeForm = () => {
    setOpenForm(false);
    setMonto("");
    setDescripcion("");
  };

  const onGuardar = async () => {
    const montoNum = Number(monto);

    if (!montoNum || montoNum <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }

    if (!descripcion.trim()) {
      toast.error("Ingresa una descripción");
      return;
    }

    if (!itemSelectCierreCaja?.id) {
      toast.error("No hay una caja abierta");
      return;
    }

    await insertar.mutateAsync({
      monto: montoNum,
      descripcion: descripcion.trim(),
      tipo_movimiento: tipo,
      id_cierre_caja: itemSelectCierreCaja.id,
      id_usuario: itemSelectAsignacionSucursal?.id_usuario,
    } as any);

    closeForm();
  };

  const onEliminar = (id: number) => {
    const ok = confirm("¿Eliminar este movimiento?");
    if (!ok) return;
    eliminar.mutate({ id, id_cierre_caja: itemSelectCierreCaja?.id } as any);
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#131f24] p-6 font-rounded">
      <div className="max-w-4xl mx-auto space-y-6">
        <section className="flex justify-between items-center">
          <section className="relative flex gap-4">
            <BtnVolver onClick={() => navigate(-1)} />
            <h1 className="text-4xl font-black text-[#4B4B4B] dark:text-white tracking-wide">
              {titulo}
            </h1>
          </section>

          <button
            type="button"
            onClick={() => setOpenForm(true)}
            className="relative inline-flex items-center gap-2 rounded-2xl bg-[#FFC800] px-6 py-3 text-lg font-black text-black
                       border-b-4 border-[#E5A500] hover:brightness-110 active:border-b-0 active:translate-y-[2px] transition-all"
          >
            <span>+</span>
            <span>NUEVO</span>
          </button>
        </section>

        <section className="w-full">
          <div className="max-w-4xl mx-auto rounded-xl overflow-hidden bg-white dark:bg-[#202f36]">
            {error ? (
              <div className="rounded-3xl border-2 border-[#E5E5E5] dark:border-[#37464f] bg-white dark:bg-[#202f36] p-8 text-center">
                <p className="text-xl font-black text-[#4B4B4B] dark:text-white">
                  Ocurrió un error
                </p>
                <p className="mt-2 text-sm font-bold text-[#7A7A7A] dark:text-white/50 break-words">
                  {(error as any)?.message ?? "Error inesperado"}
                </p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-6 inline-flex items-center justify-center rounded-2xl bg-[#FFC800] px-6 py-3 text-base font-black text-black
                             border-b-4 border-[#E5A500] hover:brightness-110 active:border-b-0 active:translate-y-[2px] transition-all"
                >
                  Reintentar
                </button>
              </div>
            ) : isLoading ? (
              <div className="p-8 text-center text-[#7A7A7A] dark:text-white/50 font-bold">
                Cargando...
              </div>
            ) : !data || data.length === 0 ? (
              <div className="p-10 text-center rounded-3xl bg-[#F0F2F5] dark:bg-white/5 border-2 border-[#E5E5E5] dark:border-[#37464f] m-6">
                <p className="text-2xl font-black text-[#4B4B4B] dark:text-white">
                  Aún no hay {titulo.toLowerCase()}
                </p>
                <p className="mt-2 text-sm font-bold text-[#7A7A7A] dark:text-white/50">
                  Crea el primero con el botón <span className="text-black dark:text-white">NUEVO</span>
                </p>
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-[#151515] dark:text-white font-black text-2xs uppercase border-b-2 border-dashed border-[#E5E5E5] dark:border-[#37464f]">
                    <th className="px-6 py-4 text-left">Fecha</th>
                    <th className="px-6 py-4 text-left">Descripción</th>
                    <th className="px-6 py-4 text-right">Monto</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((m) => (
                    <tr key={m.id} className="even:bg-[#F7F7F7] dark:even:bg-white/5">
                      <td className="px-6 py-4 text-sm font-bold text-[#7A7A7A] dark:text-white/50">
                        {m.fecha_movimiento
                          ? new Date(m.fecha_movimiento).toLocaleString()
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-xl font-bold text-[#4B4B4B] dark:text-white">
                        {m.descripcion ?? "-"}
                      </td>
                      <td className="px-6 py-4 text-right text-xl font-black text-[#4B4B4B] dark:text-white">
                        S/ {Number(m.monto ?? 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => onEliminar(m.id as number)}
                          disabled={eliminar.isPending}
                          className="text-[#AFAFAF] dark:text-white/40 hover:text-[#FF4B4B] transition-colors disabled:opacity-40"
                          title="Eliminar"
                        >
                          <TrashIcon />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      {openForm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-[28px] bg-white dark:bg-[#202f36] border-2 border-[#E5E5E5] dark:border-[#37464f] shadow-[0_18px_60px_rgba(0,0,0,0.18)] overflow-hidden">
            <div className="bg-[#F0F2F5] dark:bg-white/5 border-b-2 border-[#E5E5E5] dark:border-[#37464f] px-6 py-5">
              <h2 className="text-2xl font-black text-[#4B4B4B] dark:text-white tracking-wide">
                Nuevo {titulo.toLowerCase().slice(0, -1)}
              </h2>
            </div>

            <div className="px-6 py-6 space-y-6">
              <div className="space-y-2">
                <label className="text-lg font-black text-[#4B4B4B] dark:text-white">Monto</label>
                <input
                  type="number"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-2xl border-2 border-[#E5E5E5] dark:border-[#37464f] px-4 py-3 text-lg font-black text-[#4B4B4B] dark:text-white outline-none focus:border-[#84D8FF] transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-lg font-black text-[#4B4B4B] dark:text-white">
                  Descripción
                </label>
                <input
                  type="text"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Pago de proveedor"
                  className="w-full rounded-2xl border-2 border-[#E5E5E5] dark:border-[#37464f] px-4 py-3 text-lg font-black text-[#4B4B4B] dark:text-white outline-none focus:border-[#84D8FF] transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={insertar.isPending}
                  className="rounded-2xl bg-white dark:bg-[#202f36] px-6 py-3 text-lg font-black text-[#4B4B4B] dark:text-white border-2 border-[#E5E5E5] dark:border-[#37464f] hover:bg-black/5 dark:hover:bg-white/10 active:translate-y-[1px] transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={onGuardar}
                  disabled={insertar.isPending}
                  className="relative inline-flex items-center gap-2 rounded-2xl bg-[#FFC800] px-6 py-3 text-lg font-black text-black
                             border-b-4 border-[#E5A500] hover:brightness-110
                             active:border-b-0 active:translate-y-[2px]
                             disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                >
                  {insertar.isPending ? "Guardando..." : "CREAR"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
