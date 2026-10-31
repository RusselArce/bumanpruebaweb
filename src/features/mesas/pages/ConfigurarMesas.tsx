import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Save, X, Settings2, Menu, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BtnVolver } from "@/shared/ui/buttons/BtnVolver";
import { SidebarSalones } from "../../visorMesas/components/SidebarSalones";
import { useMostrarSalonesPorSucursalQuery } from "@/features/salones/hooks/salones.queries";
import { useSalonesStore } from "@/features/salones/store/salones.store";
import { useMostrarMesasPorSalonQuery } from "@/features/mesas/hooks/mesas.queries";
import {
  useEliminarMesaMutation,
  useGuardarDisenoMesasMutation,
} from "@/features/mesas/hooks/mesas.mutations";
import { useMesasStore } from "@/features/mesas/store/mesas.store";
import { Toaster } from "sonner";
import { FormSalones } from "../components/FormSalones";

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

const Button3D = ({
  onClick,
  children,
  color = "blue",
  className = "",
  disabled = false,
}: any) => {
  const colors = {
    blue: "bg-[#1cb0f6] border-[#1899d6] hover:bg-[#1fbaff]",
    green: "bg-[#78c800] border-[#58a700] hover:bg-[#84db00]",
    red: "bg-[#ff4b4b] border-[#d33131] hover:bg-[#ff5b5b]",
    gray: "bg-[#e5e5e5] border-[#afafaf] text-[#afafaf]",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative inline-block px-6 py-2 rounded-2xl border-b-4 active:border-b-0 active:translate-y-1 transition-all font-bold text-white uppercase tracking-wider ${
        colors[color as keyof typeof colors]
      } ${disabled ? "opacity-50 pointer-events-none" : ""} ${className}`}
    >
      {children}
    </button>
  );
};

export const ConfigurarMesas = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { itemSelect } = useSalonesStore();
 const { formOpen } = useSalonesStore();

  const { data: salones = [] } = useMostrarSalonesPorSucursalQuery();
  const salonId = itemSelect?.id as number | undefined;

  const { data: dataMesasDB = [] } = useMostrarMesasPorSalonQuery(
    salonId as number,
  );

  const [mesas, setMesas] = useState<any[]>([]);
  const [mesaEditando, setMesaEditando] = useState<any>(null);

  // Drawer mobile
  const [openSalones, setOpenSalones] = useState(false);

  // ✅ tamaño de mesa responsive (evita montajes en móvil)
  const [mesaSize, setMesaSize] = useState(90);

  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      if (w < 420) return 60; // phones chicos
      if (w < 640) return 66; // phones normales
      if (w < 768) return 72; // tablets chicas
      if (w < 1024) return 80; // tablet/desktop chico
      return 90; // desktop
    };
    const apply = () => setMesaSize(calc());
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  const HALF = useMemo(() => mesaSize / 2, [mesaSize]);

  // --- SINCRONIZACIÓN Y CONVERSIÓN (DB % -> px) ---
  useEffect(() => {
    if (dataMesasDB && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();

      const mesasConvertidas = dataMesasDB
        .filter((m: any) => m.nombre !== "para_llevar")
        .map((m: any) => {
        const x = ((m.posicion?.x ?? 0) * rect.width) / 100;
        const y = ((m.posicion?.y ?? 0) * rect.height) / 100;

        return {
          ...m,
          numero: String(m.nombre ?? "").padStart(2, "0"),
          x: clamp(x, 0, rect.width - mesaSize),
          y: clamp(y, 0, rect.height - mesaSize),
        };
      });

      setMesas(mesasConvertidas);
    }
  }, [dataMesasDB, salonId, mesaSize]);

  // Recalcular si cambia tamaño (rotación / resize)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      setMesas((prev) =>
        prev.map((m) => {
          // Si viene posicion en DB (mejor), úsala
          const xFromDb =
            typeof m.posicion?.x === "number"
              ? ((m.posicion.x ?? 0) * rect.width) / 100
              : m.x;

          const yFromDb =
            typeof m.posicion?.y === "number"
              ? ((m.posicion.y ?? 0) * rect.height) / 100
              : m.y;

          return {
            ...m,
            x: clamp(xFromDb, 0, rect.width - mesaSize),
            y: clamp(yFromDb, 0, rect.height - mesaSize),
          };
        }),
      );
    };

    const ro = new ResizeObserver(() => update());
    ro.observe(el);

    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [mesaSize]);

  const actualizarPosicion = (id: number | string, info: any) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    let newX = info.point.x - rect.left - HALF;
    let newY = info.point.y - rect.top - HALF;

    newX = clamp(newX, 0, rect.width - mesaSize);
    newY = clamp(newY, 0, rect.height - mesaSize);

    setMesas((prev) =>
      prev.map((m) => (m.id === id ? { ...m, x: newX, y: newY } : m)),
    );
  };

  const agregarMesa = () => {
    const rect = containerRef.current?.getBoundingClientRect();
    const maxX = rect ? rect.width - mesaSize : 9999;
    const maxY = rect ? rect.height - mesaSize : 9999;

    const nueva = {
      id: `temp-${Date.now()}`,
      numero: (mesas.length + 1).toString().padStart(2, "0"),
      x: clamp(50, 0, maxX),
      y: clamp(50, 0, maxY),
    };
    setMesas([...mesas, nueva]);
  };

  const { mutate: guardarDiseno } = useGuardarDisenoMesasMutation();

  const handleGuardar = () => {
    if (!salonId) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const toPos = (m: any) => ({
      x: (m.x * 100) / rect.width,
      y: (m.y * 100) / rect.height,
    });

    const updates = mesas
      .filter((m) => typeof m.id === "number")
      .map((m) => ({
        id: m.id,
        nombre: m.numero,
        posicion: toPos(m),
      }));

    const inserts = mesas
      .filter(
        (m) => typeof m.id === "string" && String(m.id).startsWith("temp-"),
      )
      .map((m) => ({
        nombre: m.numero,
        id_salon: salonId,
        posicion: toPos(m),
      }));

    guardarDiseno({ salonId, updates, inserts });
  };

  const { mutate: eliminarMesa } = useEliminarMesaMutation();
  const { setItemSelect: setItemSelectMesa } = useMesasStore();

  // tamaños de texto según mesaSize
  const fontNum =
    mesaSize >= 86 ? 30 : mesaSize >= 76 ? 26 : mesaSize >= 66 ? 22 : 20;

  return (
    <div className="flex h-screen w-screen bg-gray-100 dark:bg-[#131f24] text-gray-900 dark:text-white font-sans overflow-hidden">
      <Toaster />
 {formOpen && <FormSalones />}

      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-white dark:bg-[#1C1C1C] border-r border-gray-200 dark:border-transparent shrink-0">
        <div className="px-4 pt-4">
          <BtnVolver onClick={() => navigate("/configurar")} />
        </div>
        <SidebarSalones salones={salones} modoAdmin />
      </aside>

      {/* HEADER MOBILE */}
      <div className="md:hidden absolute top-0 left-0 right-0 z-20 p-3 flex items-center gap-2">
        <button
          onClick={() => setOpenSalones(true)}
          className="px-4 py-2 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10"
        >
          <Menu className="inline mr-2" size={18} />
          Salones
        </button>

        <div className="flex-1 px-4 py-2 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[11px] font-black uppercase text-gray-600 dark:text-white/70 truncate">
          {itemSelect
            ? `Editando: ${itemSelect.nombre}`
            : "Selecciona un salón"}
        </div>

        <button
          onClick={handleGuardar}
          disabled={!itemSelect}
          className={`px-4 py-2 rounded-2xl border border-black/10 dark:border-white/10 ${
            itemSelect ? "bg-[#1cb0f6]" : "bg-black/10 dark:bg-white/10 opacity-50"
          }`}
        >
          <Save size={18} />
        </button>
      </div>

      {/* DRAWER MOBILE: SALONES */}
      <AnimatePresence>
        {openSalones && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-30 bg-black/60"
            onClick={() => setOpenSalones(false)}
          >
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              className="absolute left-0 top-0 bottom-0 w-[320px] max-w-[85vw] bg-white dark:bg-[#0f171b] border-r border-black/10 dark:border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-3 flex items-center justify-between border-b border-black/10 dark:border-white/10">
                <div className="font-black uppercase text-gray-600 dark:text-white/70 text-sm">
                  Salones
                </div>
                <button
                  onClick={() => setOpenSalones(false)}
                  className="p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10"
                >
                  <ChevronLeft size={18} />
                </button>
              </div>

              <div className="px-4 pt-4">
                <BtnVolver onClick={() => navigate("/configurar")} />
              </div>

              <SidebarSalones salones={salones} modoAdmin />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN */}
      <main className="relative flex-1 p-3 md:p-6 flex gap-6 pt-16 md:pt-6">
        {/* TABLERO */}
       
        <div
          ref={containerRef}
          className="relative flex-1 bg-gray-50 dark:bg-[#1a2c33] rounded-[2rem] border-2 border-[#E5E5E5] dark:border-[#37464f] overflow-hidden shadow-inner"
          style={{
            backgroundImage: "radial-gradient(var(--mesa-canvas-dot) 1.5px, transparent 0)",
            backgroundSize: "30px 30px",
          }}
        >
          {/* CONTROLES DESKTOP */}
          <div className="hidden md:flex absolute bottom-6 left-6 z-10 items-center gap-4">
          

            {itemSelect && (
              <Button3D color="blue" onClick={handleGuardar}>
                <Save size={18} className="inline mr-2" /> Guardar Diseño
              </Button3D>
            )}
          </div>

          <AnimatePresence>
            {itemSelect &&
              mesas.map((mesa) => (
                <motion.div
                  key={mesa.id}
                  drag
                  dragMomentum={false}
                  onDragEnd={(_, info) => actualizarPosicion(mesa.id, info)}
                  animate={{ x: mesa.x, y: mesa.y }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setItemSelectMesa(mesa);
                    setMesaEditando(mesa);
                  }}
                  className={`absolute cursor-grab active:cursor-grabbing group ${
                    mesaEditando?.id === mesa.id ? "z-20" : "z-10"
                  }`}
                  style={{ top: 0, left: 0 }}
                >
                  <div
                    className={`rounded-[1.5rem] border-b-[6px] flex flex-col items-center justify-center transition-colors ${
                      mesaEditando?.id === mesa.id
                        ? "bg-[#1cb0f6] border-[#1899d6]"
                        : "bg-[#78c800] border-[#58a700]"
                    }`}
                    style={{
                      width: mesaSize,
                      height: mesaSize,
                    }}
                  >
                    <span
                      className="font-black text-white"
                      style={{ fontSize: fontNum, lineHeight: 1 }}
                    >
                      {mesa.numero}
                    </span>

                    {/* tooltip solo sirve desktop (hover) */}
                    <div className="absolute -bottom-10 bg-[#2b4550] text-[10px] px-2 py-1 rounded-lg border-b-2 border-[#1e323b] font-mono text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {Math.round(
                        (mesa.x * 100) /
                          (containerRef.current?.offsetWidth || 1),
                      )}
                      % ,{" "}
                      {Math.round(
                        (mesa.y * 100) /
                          (containerRef.current?.offsetHeight || 1),
                      )}
                      %
                    </div>
                  </div>
                </motion.div>
              ))}
          </AnimatePresence>

          {/* FAB + */}
          {itemSelect && (
            <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8 z-10">
              <Button3D
                color="green"
                onClick={agregarMesa}
                className="w-16 h-16 !p-0 flex items-center justify-center rounded-full"
              >
                <Plus size={32} strokeWidth={3} />
              </Button3D>
            </div>
          )}
        </div>
        {/* PANEL EDICIÓN DESKTOP */}
        <AnimatePresence>
          {mesaEditando && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="hidden md:flex w-80 bg-white dark:bg-[#1a2c33] rounded-[2rem] border-2 border-[#E5E5E5] dark:border-[#37464f] p-6 flex-col gap-6 shadow-2xl"
            >
              <div className="flex justify-between items-center text-[#1cb0f6]">
                <h3 className="text-xl font-black uppercase">Editar Mesa</h3>
                <button onClick={() => setMesaEditando(null)}>
                  <X />
                </button>
              </div>

              <div className="space-y-4 text-gray-500 dark:text-[#afafaf] font-bold text-xs uppercase px-2">
                Nombre / Número
                <input
                  type="text"
                  value={mesaEditando.numero}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMesaEditando({ ...mesaEditando, numero: val });
                    setMesas(
                      mesas.map((m) =>
                        m.id === mesaEditando.id ? { ...m, numero: val } : m,
                      ),
                    );
                  }}
                  className="w-full bg-gray-50 dark:bg-[#131f24] border-2 border-[#E5E5E5] dark:border-[#37464f] rounded-2xl px-4 py-3 text-gray-900 dark:text-white focus:border-[#1cb0f6] outline-none transition-all mt-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-[#131f24] p-3 rounded-2xl border-b-2 border-[#E5E5E5] dark:border-[#37464f]">
                  <span className="block text-[10px] font-black text-gray-400 dark:text-white/40 uppercase text-center">
                    X (%)
                  </span>
                  <span className="block text-lg font-mono font-bold text-cyan-600 dark:text-cyan-400 text-center">
                    {Math.round(
                      (mesaEditando.x * 100) /
                        (containerRef.current?.offsetWidth || 1),
                    )}
                    %
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-[#131f24] p-3 rounded-2xl border-b-2 border-[#E5E5E5] dark:border-[#37464f]">
                  <span className="block text-[10px] font-black text-gray-400 dark:text-white/40 uppercase text-center">
                    Y (%)
                  </span>
                  <span className="block text-lg font-mono font-bold text-cyan-600 dark:text-cyan-400 text-center">
                    {Math.round(
                      (mesaEditando.y * 100) /
                        (containerRef.current?.offsetHeight || 1),
                    )}
                    %
                  </span>
                </div>
              </div>

              <div className="mt-auto space-y-3">
                <Button3D
                  color="red"
                  className="w-full"
                  onClick={() => {
                    const id = mesaEditando?.id;

                    if (typeof id !== "number") {
                      setMesas((prev) => prev.filter((m) => m.id !== id));
                      setMesaEditando(null);
                      return;
                    }

                    eliminarMesa({ id, id_salon: salonId as number });
                    setMesaEditando(null);
                  }}
                >
                  Eliminar
                </Button3D>

                <Button3D
                  color="blue"
                  className="w-full"
                  onClick={() => {
                    setMesaEditando(null);
                    handleGuardar();
                  }}
                >
                  Finalizar
                </Button3D>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* PANEL EDICIÓN MOBILE (BOTTOM SHEET) */}
        <AnimatePresence>
          {mesaEditando && (
            <motion.div
              className="md:hidden fixed inset-0 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className="absolute inset-0 bg-black/60"
                onClick={() => setMesaEditando(null)}
              />

              <motion.div
                initial={{ y: 500 }}
                animate={{ y: 0 }}
                exit={{ y: 500 }}
                transition={{ type: "spring", stiffness: 260, damping: 26 }}
                className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#1a2c33] rounded-t-[2rem] border-t border-black/10 dark:border-white/10 p-5 shadow-2xl"
              >
                <div className="flex justify-between items-center text-[#1cb0f6]">
                  <h3 className="text-lg font-black uppercase">
                    Editar Mesa {mesaEditando.numero}
                  </h3>
                  <button
                    onClick={() => setMesaEditando(null)}
                    className="p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10"
                  >
                    <X />
                  </button>
                </div>

                <div className="mt-4 space-y-2 text-gray-500 dark:text-[#afafaf] font-bold text-xs uppercase">
                  Nombre / Número
                  <input
                    type="text"
                    value={mesaEditando.numero}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMesaEditando({ ...mesaEditando, numero: val });
                      setMesas(
                        mesas.map((m) =>
                          m.id === mesaEditando.id ? { ...m, numero: val } : m,
                        ),
                      );
                    }}
                    className="w-full bg-gray-50 dark:bg-[#131f24] border-2 border-[#E5E5E5] dark:border-[#37464f] rounded-2xl px-4 py-3 text-gray-900 dark:text-white focus:border-[#1cb0f6] outline-none transition-all"
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-[#131f24] p-3 rounded-2xl border border-black/10 dark:border-white/10">
                    <span className="block text-[10px] font-black text-gray-400 dark:text-white/40 uppercase text-center">
                      X (%)
                    </span>
                    <span className="block text-lg font-mono font-bold text-cyan-600 dark:text-cyan-400 text-center">
                      {Math.round(
                        (mesaEditando.x * 100) /
                          (containerRef.current?.offsetWidth || 1),
                      )}
                      %
                    </span>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#131f24] p-3 rounded-2xl border border-black/10 dark:border-white/10">
                    <span className="block text-[10px] font-black text-gray-400 dark:text-white/40 uppercase text-center">
                      Y (%)
                    </span>
                    <span className="block text-lg font-mono font-bold text-cyan-600 dark:text-cyan-400 text-center">
                      {Math.round(
                        (mesaEditando.y * 100) /
                          (containerRef.current?.offsetHeight || 1),
                      )}
                      %
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex gap-3">
                  <Button3D
                    color="red"
                    className="flex-1"
                    onClick={() => {
                      const id = mesaEditando?.id;

                      if (typeof id !== "number") {
                        setMesas((prev) => prev.filter((m) => m.id !== id));
                        setMesaEditando(null);
                        return;
                      }

                      eliminarMesa({ id, id_salon: salonId as number });
                      setMesaEditando(null);
                    }}
                  >
                    Eliminar
                  </Button3D>

                  <Button3D
                    color="blue"
                    className="flex-1"
                    onClick={() => setMesaEditando(null)}
                  >
                    Listo
                  </Button3D>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
