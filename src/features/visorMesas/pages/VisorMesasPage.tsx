import React, { useEffect, useMemo, useState } from "react";
import { Menu, ChevronLeft } from "lucide-react";
import { useMostrarSalonesPorSucursalQuery } from "@/features/salones/hooks/salones.queries";
import { useSalonesStore } from "@/features/salones/store/salones.store";
import { useMesaParaLlevarQuery, useMostrarMesasPorSalonQuery } from "@/features/mesas/hooks/mesas.queries";
import { SidebarSalones } from "../components/SidebarSalones";
import { MesasContent } from "../components/Mesas";
import { ActionButton } from "../components/ActionButton";
import { useAuthStore } from "@/shared/store/auth.store";
import { MenuHerramientas } from "@/features/herramientas/components/MenuHerramientas";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSupabaseSubscription } from "@/shared/hooks/useSupabaseSubscription";
import { useCierresCajaStore } from "@/features/cierres_caja/store/cierres_caja.store";
import { CierreCajaModal } from "@/features/sucursales_cajas/components/CierreCajaModal";
import { useMostrarCierresPorCajaQuery } from "@/features/cierres_caja/hooks/cierres_caja.queries";
import { useMostrarVentasActivasPorSucursalQuery } from "@/features/ventas/hooks/ventas.hooks";
import { useAsignacionesSucursalesStore } from "@/features/asignacion_sucursal/store/asignacion_sucursal";
import { toast, Toaster } from "sonner";
import { useIniciarParaLlevar } from "../hooks/useIniciarParaLlevar";
import { usePermisosEfectivos } from "@/features/permisos/hooks/usePermisosEfectivos";

export const VisorMesasPage = () => {
  const { itemSelect } = useSalonesStore();
  const [openTools, setOpenTools] = useState(false);
  const [openSalones, setOpenSalones] = useState(false); // ✅ drawer mobile
  const { cerrarSesion } = useAuthStore();
  const navigate = useNavigate();
  const stateCierreCaja = useCierresCajaStore((s)=>s.stateCierreCaja)
    const setStateCierreCaja = useCierresCajaStore((s)=>s.setStateCierreCaja)
  

  const {
    data: dataCierreCaja,
    refetch,
    isLoading: isLoadingCierreCaja,
  } = useMostrarCierresPorCajaQuery();

  const { iniciarParaLlevar, isLoading: isIniciandoParaLlevar } = useIniciarParaLlevar();

  // "Para llevar" no tiene mesa física: el mozo que la crea no puede
  // cobrarla después (no ve caja/permisos de cobro), así que queda huérfana.
  // Se restringe a quien sí puede cobrar (cajero/admin) para que la misma
  // persona que abre el pedido pueda cerrarlo.
  const { tienePermisoPorNombreModulo, cargando: cargandoPermisos } = usePermisosEfectivos();
  const puedeCobrar = !cargandoPermisos && tienePermisoPorNombreModulo("Cobrar venta");

  const onClickParaLlevar = () => {
    if (!puedeCobrar) {
      toast.error("Sin permiso.", {
        description: "Un mozo no puede cobrar pedidos para llevar; pide a un cajero que lo cree.",
      });
      return;
    }
    iniciarParaLlevar();
  };

  const itemSucursalAsignada = useAsignacionesSucursalesStore((s) => s.itemSelect);
  const { data: mesaParaLlevar } = useMesaParaLlevarQuery(itemSucursalAsignada?.id_sucursal);
  const { data: ventasActivas } = useMostrarVentasActivasPorSucursalQuery();

  useSupabaseSubscription({
    channelName: "public:ventas:resumen-cocina",
    options: { event: "*", schema: "public", table: "ventas" },
    queryKey: ["mostrar ventas activas por sucursal"],
  });

  const { cantidadParaLlevar, cantidadEnMesas } = useMemo(() => {
    if (!ventasActivas) return { cantidadParaLlevar: 0, cantidadEnMesas: 0 };

    let paraLlevar = 0;
    let enMesas = 0;
    for (const v of ventasActivas) {
      if (mesaParaLlevar && v.id_mesa === mesaParaLlevar.id) paraLlevar++;
      else enMesas++;
    }
    return { cantidadParaLlevar: paraLlevar, cantidadEnMesas: enMesas };
  }, [ventasActivas, mesaParaLlevar]);

  const {
    data: salones = [],
    isLoading,
    error,
  } = useMostrarSalonesPorSucursalQuery();

  const salonId = itemSelect?.id as number | undefined;

  const { data: dataMesas = [], isLoading: loadingMesas } =
    useMostrarMesasPorSalonQuery(salonId as number);
  useSupabaseSubscription({
    channelName: "public:mesas",
    options: { event: "*", schema: "public", table: "mesas" },
    queryKey: ["mostrar mesas por salon"],
  });
  // useEffect(() => {
  //   refetch();
  // }, []);
  return (
    <div className="flex h-screen w-screen bg-gray-100 dark:bg-[#14161a] text-gray-900 dark:text-white overflow-hidden relative">
      <Toaster />
      {/* overlays */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-white">
            Cargando salones...
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
          <div className="max-w-md rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-red-200">
            <div className="font-semibold">Error cargando salones</div>
            <div className="text-sm opacity-90 mt-1">
              {(error as Error).message}
            </div>
          </div>
        </div>
      )}
      {stateCierreCaja && <CierreCajaModal/>}
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
          {itemSelect ? `Salón: ${itemSelect.nombre}` : "Selecciona un salón"}
        </div>
      </div>

      {/* DRAWER MOBILE: SALONES + BOTONES */}
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
              className="absolute left-0 top-0 bottom-0 w-[320px] max-w-[85vw] bg-white dark:bg-[#0f171b] border-r border-black/10 dark:border-white/10 flex flex-col"
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

              <div className="flex-1 overflow-auto">
                <SidebarSalones salones={salones} />
              </div>

              <div className="p-4 border-t border-black/10 dark:border-white/10">
                <div className="grid grid-cols-2 gap-3">
                  <ActionButton
                    color={puedeCobrar ? "green" : "locked"}
                    text={isIniciandoParaLlevar ? "Creando..." : "Para llevar"}
                    onClick={onClickParaLlevar}
                    disabled={isIniciandoParaLlevar || !puedeCobrar}
                    extra={
                      !puedeCobrar && (
                        <span className="text-[10px] font-black uppercase tracking-wide opacity-90">
                          🔒 Sin permiso
                        </span>
                      )
                    }
                  />
                  <ActionButton color="green" text="Cerrar caja" />
                  <ActionButton
                    color="orange"
                    text="Salir"
                    onClick={cerrarSesion}
                  />

                  <div className="col-span-2">
                    <ActionButton
                      color="green"
                      text="Herramientas"
                      onClick={() => setOpenTools((v) => !v)}
                    />
                  </div>

                  <div className="col-span-2">
                    <ActionButton
                      color="red"
                      text="Configurar mesas"
                      onClick={() => navigate("/config-mesas")}
                    />
                  </div>
                </div>

                {openTools && (
                  <div className="mt-3">
                    <MenuHerramientas />
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SIDEBAR DESKTOP */}
      <section className="hidden md:flex w-[360px] max-w-[85vw] shrink-0 border-r border-black/10 dark:border-white/10 flex-col justify-between p-4">
        <SidebarSalones salones={salones} />

        <article className="mt-4">
          <div className="grid grid-cols-2 gap-3">
            <ActionButton
              color={puedeCobrar ? "green" : "locked"}
              text={isIniciandoParaLlevar ? "Creando..." : "Para llevar"}
              onClick={onClickParaLlevar}
              disabled={isIniciandoParaLlevar || !puedeCobrar}
              extra={
                !puedeCobrar && (
                  <span className="text-[10px] font-black uppercase tracking-wide opacity-90">
                    🔒 Sin permiso
                  </span>
                )
              }
            />
            <ActionButton
              color="red"
              text="Configurar"
              onClick={() => navigate("/configurar")}
            />

           
              <ActionButton
                color="green"
                text="Cerrar caja"
                onClick={()=> {
                 
                  if (!dataCierreCaja) return toast("Caja sin aperturar")

                   navigate("/cierre-caja")
                }

                  
                //   () => {
                //   refetch();
                //   if (!dataCierreCaja) return toast("Caja sin aperturar");
                //   setStateCierreCaja(true);
                // }
              }
              />
            

            <ActionButton color="orange" text="Salir" onClick={cerrarSesion} />

            <div className="col-span-2">
              <ActionButton
                color="red"
                text="Cocina"
                onClick={() => navigate("/cocina")}
                extra={
                  (cantidadParaLlevar > 0 || cantidadEnMesas > 0) && (
                    <div className="flex gap-1.5">
                      <span className="flex items-center gap-1 bg-black/25 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                        🛍️ {cantidadParaLlevar}
                      </span>
                      <span className="flex items-center gap-1 bg-black/25 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                        🍽️ {cantidadEnMesas}
                      </span>
                    </div>
                  )
                }
              />
            </div>
          </div>

          {openTools && <MenuHerramientas />}
        </article>
      </section>

      {/* tablero mesas */}
      <section className="flex-1 min-w-0 pt-16 md:pt-0">
        {itemSelect?.id ? (
          <MesasContent
            mesas={dataMesas.filter((m) => m.nombre !== "para_llevar")}
            loading={loadingMesas}
            salonNombre={itemSelect?.nombre}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center p-8">
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-6 py-4 text-gray-700 dark:text-white/80">
              Selecciona un salón para ver sus mesas.
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
