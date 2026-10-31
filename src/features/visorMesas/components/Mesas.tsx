import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEliminarVentasIncompletasMutate } from "@/features/ventas/hooks/ventas.hooks";
import { useNavigate } from "react-router-dom";
import { useMesasStore } from "@/features/mesas/store/mesas.store";
import type { Mesas } from "@/shared/types/db/tablas";
import { useVentasStore } from "@/features/ventas/store/ventas.store";
import { useMostrarCierresPorCajaQuery } from "@/features/cierres_caja/hooks/cierres_caja.queries";
import { useCierresCajaStore } from "@/features/cierres_caja/store/cierres_caja.store";
import { useAsignacionesSucursalesStore } from "@/features/asignacion_sucursal/store/asignacion_sucursal";
import { AperturaCajaModal } from "@/features/sucursales_cajas/components/AperturaCajaModal";

type Props = {
  mesas: Mesas[];
  loading?: boolean;
  salonNombre?: string;
};

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

type MesaUI = Mesas & {
  numero: string;
  xPx: number;
  yPx: number;
};

const getMesaStyleByEstado = (estado?: string | null) => {
  const e = (estado ?? "libre").toLowerCase();

  // base: libre
  let bg = "bg-[#78c800]";
  let border = "border-[#58a700]";
  const ring = "";
  let opacity = "";
  let cursor = "cursor-pointer";

  if (e === "ocupada") {
    bg = "bg-[#ff4b4b]";
    border = "border-[#d33131]";
  }

  if (e === "reservada") {
    bg = "bg-[#ffd900]";
    border = "border-[#d4b100]";
  }

  if (e === "eliminada") {
    bg = "bg-[#37464f]";
    border = "border-[#202f36]";
    opacity = "opacity-40";
    cursor = "cursor-not-allowed";
  }

  return { bg, border, ring, opacity, cursor, estado: e };
};

export const MesasContent = ({ mesas, loading, salonNombre }: Props) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState({ width: 1, height: 1 });
  const setStateAperturaCaja = useCierresCajaStore(
    (s) => s.setStateAperturaCaja,
  );
  const setItemSelectCierreCaja = useCierresCajaStore((s) => s.setItemSelect);
  const itemSelectCierreCaja = useCierresCajaStore((s) => s.itemSelect);
  const { data, refetch } = useMostrarCierresPorCajaQuery();
  const stateAperturaCaja = useCierresCajaStore((s) => s.stateAperturaCaja);
  const itemSelect = useAsignacionesSucursalesStore((s) => s.itemSelect);

  // ✅ tamaño de mesa responsive
  const [mesaSize, setMesaSize] = useState(90);

  const { mutate: mutateEliminarVentasIncompletas } =
    useEliminarVentasIncompletasMutate();

  // ✅ Zustand
  const { setItemSelect } = useMesasStore();

  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      if (w < 420) return 60;
      if (w < 640) return 66;
      if (w < 768) return 72;
      if (w < 1024) return 80;
      return 90;
    };
    const apply = () => setMesaSize(calc());
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  // Observa tamaño del tablero
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const r = el.getBoundingClientRect();
      setRect({ width: r.width || 1, height: r.height || 1 });
    };

    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(el);

    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  const fontNum = useMemo(() => {
    if (mesaSize >= 86) return 30;
    if (mesaSize >= 76) return 26;
    if (mesaSize >= 66) return 22;
    return 20;
  }, [mesaSize]);

  const mesasUI: MesaUI[] = useMemo(() => {
    const w = rect.width || 1;
    const h = rect.height || 1;

    return (mesas ?? []).map((m) => {
      const pxX = ((m.posicion?.x ?? 0) * w) / 100;
      const pxY = ((m.posicion?.y ?? 0) * h) / 100;

      return {
        ...m,
        numero: String(m.nombre ?? "").padStart(2, "0"),
        xPx: clamp(pxX, 0, w - mesaSize),
        yPx: clamp(pxY, 0, h - mesaSize),
      };
    });
  }, [mesas, rect.width, rect.height, mesaSize]);

  const [mesaSelected, setMesaSelected] = useState<number | null>(null);
  const { idventa } = useVentasStore();
  const clickMesa = async (mesa: Mesas) => {
    // si está eliminada, no hace nada
    const est = (mesa.estado ?? "libre").toLowerCase();
    if (est === "eliminada") return;

    setItemSelect(mesa);

    //evaluamos la apertura y cierre de caja primero (antes de limpiar ventas)
    const result = await refetch(); // 👈 ejecuta la query aquí

    const cierre = result.data;

    if (!cierre || cierre.estado === 1) {
      setStateAperturaCaja(true);
      setItemSelectCierreCaja(null);
      return;
    }

    if (cierre && cierre.estado === 0) {
      setItemSelectCierreCaja(cierre);
      setStateAperturaCaja(false);

      if (itemSelect?.id_usuario) {
        mutateEliminarVentasIncompletas({
          id_usuario: itemSelect.id_usuario as number,
          id_cierre_caja: cierre.id,
          id: idventa,
        });
      }

      navigate(`/punto-venta`);
    }

  };

  return (
    <div className="h-full w-full p-3 md:p-6">
      <div
        ref={containerRef}
        className="relative h-full w-full bg-gray-100 dark:bg-[#14161a] rounded-[2rem] border-2 border-black/10 dark:border-[#37464f] overflow-hidden shadow-inner"
        style={{
          backgroundImage: "radial-gradient(var(--mesa-canvas-dot) 1.5px, transparent 0)",
          backgroundSize: "30px 30px",
        }}
      >
        {stateAperturaCaja && <AperturaCajaModal />}
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-white">
              Cargando mesas...
            </div>
          </div>
        )}
        <AnimatePresence>
          {mesasUI.map((mesa) => {
            const selected = mesaSelected === mesa.id;
            const st = getMesaStyleByEstado(mesa.estado);

            // prioridad visual: seleccionada (azul) encima de estado
            const bg = selected ? "bg-[#1cb0f6]" : st.bg;
            const border = selected ? "border-[#1899d6]" : st.border;

            // bloquea click si eliminada
            const disabled = st.estado === "eliminada";

            return (
              <motion.div
                key={mesa.id}
                className={`absolute ${selected ? "z-20" : "z-10"} ${st.opacity}`}
                style={{ top: 0, left: 0 }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: mesa.xPx,
                  y: mesa.yPx,
                }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
              >
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    if (disabled) return;
                    setMesaSelected(mesa.id);
                    clickMesa(mesa);
                  }}
                  className={`group relative select-none ${st.cursor}`}
                >
                  <div
                    className={`rounded-[1.5rem] border-b-[6px] flex flex-col items-center justify-center transition-transform group-active:translate-y-[2px] ${bg} ${border}`}
                    style={{ width: mesaSize, height: mesaSize }}
                  >
                    <span
                      className={`font-black ${
                        st.estado === "reservada" && !selected
                          ? "text-[#131f24]"
                          : "text-white"
                      }`}
                      style={{ fontSize: fontNum, lineHeight: 1 }}
                    >
                      {mesa.numero}
                    </span>

                    {/* badge mini del estado */}
                    <span
                      className={`mt-1 text-[9px] font-black uppercase tracking-widest px-2 py-[2px] rounded-full border border-white/10 ${
                        st.estado === "reservada" && !selected
                          ? "bg-black/20 text-[#131f24]"
                          : "bg-black/20 text-white/80"
                      }`}
                    >
                      {st.estado}
                    </span>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {!loading && mesasUI.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-6 py-4 text-gray-700 dark:text-white/80">
              No hay mesas para este salón.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

