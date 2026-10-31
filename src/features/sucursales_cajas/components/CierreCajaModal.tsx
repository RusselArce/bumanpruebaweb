import {
  useMostrarCierresPorCajaQuery,
  useMostrarVentasEfectivoPorCierreCajaQuery,
} from "@/features/cierres_caja/hooks/cierres_caja.queries";
import {
  useMostrarVentasMovimientosCajaQuery,
  useMostrarMovimientosCajaPorTipoQuery,
} from "@/features/movimientos_caja/hooks/movimientos_caja.queries";
import { useAsignacionesSucursalesStore } from "@/features/asignacion_sucursal/store/asignacion_sucursal";
import { useCierresCajaStore } from "@/features/cierres_caja/store/cierres_caja.store";
import React, { useEffect, useState } from "react";
import { FormCierreCaja } from "./FormCierreCaja";
import { BtnVolver } from "@/shared/ui/buttons/BtnVolver";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";

export const CierreCajaModal = () => {
 const navigate = useNavigate()
  const [stateFormCierre,setStateFormCierre] = useState(false)
  const setStateCierreCaja = useCierresCajaStore((s)=>s.setStateCierreCaja)
  const {
    data: dataCierreCaja,
    isLoading,
    refetch,
  } = useMostrarCierresPorCajaQuery();
  const { data: dataVentasEfectivoPorCierreCaja } =
    useMostrarVentasEfectivoPorCierreCajaQuery();
  const { data: dataVentasPorCierreCaja } =
    useMostrarVentasMovimientosCajaQuery();
  const { data: dataIngresosVarios } =
    useMostrarMovimientosCajaPorTipoQuery("ingreso");
  const { data: dataGastosVarios } =
    useMostrarMovimientosCajaPorTipoQuery("gasto");
  const totalVentas =
    dataVentasPorCierreCaja?.reduce((acc, item) => {
      return acc + Number(item.monto || 0);
    }, 0) ?? 0;

  const totalIngresosVarios =
    dataIngresosVarios?.reduce((acc, item) => acc + Number(item.monto || 0), 0) ??
    0;

  const totalGastosVarios =
    dataGastosVarios?.reduce((acc, item) => acc + Number(item.monto || 0), 0) ??
    0;

  const fondoCaja = Number(dataCierreCaja?.total_efectivo_real ?? 0);

  const ventasEfectivo = Number(dataVentasEfectivoPorCierreCaja ?? 0);

  const totalCalculado =
    fondoCaja + ventasEfectivo + totalIngresosVarios - totalGastosVarios;

  const fechaApertura = dataCierreCaja?.fechainicio
    ? new Date(dataCierreCaja.fechainicio).toLocaleString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    // Contenedor principal: Fijo, cubre toda la pantalla y se superpone a todo (z-50)
    <div className="fixed inset-0 z-50 bg-white dark:bg-[#131f24] flex flex-col font-sans text-slate-700 dark:text-white/80 h-screen w-screen overflow-hidden">
      {/* 1. Barra Superior (Navegación y Metadatos) */}
      <header className="flex flex-col md:flex-row items-center justify-between p-4 md:px-8 md:py-6 border-b-2 border-gray-200 dark:border-[#37464f] gap-4">
       <BtnVolver onClick={()=>navigate("/")}/>

        <div className="text-center flex-1">
          <h2 className="text-gray-400 dark:text-white/40 font-bold text-xs md:text-sm tracking-widest uppercase">
            {fechaApertura ? `Turno abierto: ${fechaApertura}` : "Corte de caja"}
          </h2>
        </div>

        {/* Espaciador invisible para mantener el texto centrado en pantallas grandes */}
        <div className="hidden md:block w-24"></div>
      </header>

      {/* 2. Área Central (Contenido Principal) */}
      <main className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-4 md:p-8 bg-[#F7F9FA] dark:bg-[#131f24]">
        {/* Resumen Superior */}
        <div className="w-full max-w-4xl flex flex-col sm:flex-row justify-between items-center mb-8 px-4 gap-4">
          <div className="text-xl font-extrabold text-gray-500 dark:text-white/50">
            Ventas Totales: <span className="text-gray-800 dark:text-white ml-1">S/ {totalVentas.toFixed(2)}</span>
          </div>

        </div>

        {/* Tarjeta de Detalles */}
        <div className="bg-white dark:bg-[#202f36] border-2 border-gray-200 dark:border-[#37464f] border-b-[6px] rounded-3xl p-6 md:p-10 w-full max-w-4xl flex flex-col md:flex-row gap-8 shadow-sm">
          {/* Columna Izquierda */}
          <div className="flex-1 md:border-r-2 border-dashed border-gray-200 dark:border-[#37464f] md:pr-10">
            <h3 className="text-2xl font-extrabold text-gray-800 dark:text-white mb-6">
              Dinero en CAJA
            </h3>

            <div className="space-y-5 text-lg font-bold text-gray-500 dark:text-white/50">
              <div className="flex justify-between items-center">
                <span>Fondo de caja:</span>
                <span className="text-gray-800 dark:text-white">
                  {dataCierreCaja?.total_efectivo_real} *{" "}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Ventas en efectivo:</span>
                <span className="text-gray-800 dark:text-white">
                  {dataVentasEfectivoPorCierreCaja} *{" "}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  Ingresos varios:
                  <button
                    type="button"
                    onClick={() => navigate("/ingresos-varios")}
                    className="text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white transition-colors"
                    title="Ver ingresos varios"
                  >
                    <Icon icon="mdi:eye" width="20" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/ingresos-varios?new=1")}
                    className="text-gray-400 dark:text-white/40 hover:text-green-500 transition-colors"
                    title="Agregar ingreso vario"
                  >
                    <Icon icon="mdi:plus-circle" width="20" />
                  </button>
                </span>
                <span className="text-gray-800 dark:text-white">
                  S/ {totalIngresosVarios.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-red-500 bg-red-50 dark:bg-red-500/10 p-3 rounded-2xl">
                <span className="flex items-center gap-2">
                  Gastos varios:
                  <button
                    type="button"
                    onClick={() => navigate("/gastos-varios")}
                    className="text-red-300 hover:text-red-500 transition-colors"
                    title="Ver gastos varios"
                  >
                    <Icon icon="mdi:eye" width="20" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/gastos-varios?new=1")}
                    className="text-red-300 hover:text-red-500 transition-colors"
                    title="Agregar gasto vario"
                  >
                    <Icon icon="mdi:plus-circle" width="20" />
                  </button>
                </span>
                <span>-S/ {totalGastosVarios.toFixed(2)}</span>
              </div>

              <div className="pt-6 border-t-2 border-gray-100 dark:border-[#37464f] flex justify-end text-2xl text-gray-800 dark:text-white font-extrabold">
                <span>S/ {totalCalculado.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Columna Derecha */}
          <div className="flex-1 md:pl-4 flex flex-col">
            <h3 className="text-2xl font-extrabold text-gray-800 dark:text-white mb-6">
              Ventas Totales
            </h3>
            <div className="space-y-4 text-lg font-bold text-gray-500 dark:text-white/50">
              {dataVentasPorCierreCaja && dataVentasPorCierreCaja.length > 0 ? (
                dataVentasPorCierreCaja.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>{(item as any).nombre ?? item.descripcion ?? item.tipo_movimiento ?? "Movimiento"}</span>

                    <span className="text-gray-800 dark:text-white">
                      S/ {Number(item.monto).toFixed(2)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 dark:text-white/40 py-6">
                  🧾 No hay ventas registradas en este cierre
                </div>
              )}
            </div>

            {/* Usamos mt-auto para empujar el total siempre al fondo de la tarjeta */}
            <div className="mt-auto pt-6 border-t-2 border-gray-100 dark:border-[#37464f] flex justify-end text-2xl font-extrabold text-gray-800 dark:text-white">
              <span>S/ {totalVentas.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Barra Inferior (Llamado a la acción) */}
      <footer className="bg-white dark:bg-[#202f36] border-t-2 border-gray-200 dark:border-[#37464f] p-6 md:p-8 flex justify-center">
        <button
          className="w-full max-w-md bg-orange-500 hover:bg-orange-400 text-white font-extrabold text-xl tracking-widest uppercase py-5 px-8 rounded-2xl border-b-[6px] border-orange-600 active:border-b-0 active:translate-y-[6px] transition-all"
          onClick={()=>setStateFormCierre(!stateFormCierre)}
        >
          Cerrar Caja
        </button>
      </footer>
      {
        stateFormCierre &&  <FormCierreCaja setStateFormCierre={()=>setStateFormCierre(!stateFormCierre)} dataCierreCaja={dataCierreCaja} totalCalculado={totalCalculado}/>
      }
     
    </div>
  );
};
