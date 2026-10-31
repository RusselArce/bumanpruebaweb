import React, { useMemo, useState } from "react";
import { Toaster, toast } from "sonner";
import { useAsignacionesSucursalesStore } from "@/features/asignacion_sucursal/store/asignacion_sucursal";
import { useEmpresaStore } from "@/features/empresa/store/empresa.store";
import { useMovimientosVentaReporteQuery } from "../hooks/reportes.queries";
import { useRangoFechas } from "../hooks/useRangoFechas";
import { FiltroFechas } from "../components/FiltroFechas";
import { ReporteHeader } from "../components/ReporteHeader";
import { BotonesExportar } from "../components/BotonesExportar";
import { KpiGrid } from "../components/KpiGrid";
import { RankingBarras } from "../components/RankingBarras";
import { TablaReporte } from "../components/TablaReporte";
import { crearFormateadorMoneda } from "../utils/money";
import type { ReporteExportable } from "../utils/reportTypes";

const COLORES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#4a3aa7", "#e34948"];

export const ReporteMetodosPagoPage: React.FC = () => {
  const itemSelectAsignacionSucursal = useAsignacionesSucursalesStore((s) => s.itemSelect);
  const itemSelectEmpresa = useEmpresaStore((s) => s.itemSelect);
  const rangoFechas = useRangoFechas();
  const [isExportando, setIsExportando] = useState<"excel" | "pdf" | null>(null);

  const id_sucursal = itemSelectAsignacionSucursal?.id_sucursal as number;
  const { data: dataMovimientos, isLoading: cargando } = useMovimientosVentaReporteQuery({
    id_sucursal,
    desde: rangoFechas.desde,
    hasta: rangoFechas.hasta,
  });

  const simbolo = itemSelectEmpresa?.simbolo_moneda ?? "S/";
  const money = crearFormateadorMoneda(simbolo);

  const metodosPago = useMemo(() => {
    const mapa = new Map<string, number>();
    let total = 0;
    for (const m of dataMovimientos ?? []) {
      const nombre = m.metodos_pago?.nombre ?? "Otro";
      const monto = Number(m.monto || 0);
      mapa.set(nombre, (mapa.get(nombre) ?? 0) + monto);
      total += monto;
    }
    return {
      total,
      items: Array.from(mapa.entries())
        .map(([nombre, monto]) => ({ nombre, monto, porcentaje: total ? (monto / total) * 100 : 0 }))
        .sort((a, b) => b.monto - a.monto),
    };
  }, [dataMovimientos]);

  const armarReporte = (): ReporteExportable => ({
    titulo: "Reporte de métodos de pago",
    empresaNombre: itemSelectEmpresa?.nombre ?? "Empresa",
    desde: rangoFechas.desde,
    hasta: rangoFechas.hasta,
    simboloMoneda: simbolo,
    kpis: [
      { label: "Métodos usados", value: metodosPago.items.length, tipo: "entero" },
      { label: "Total cobrado", value: metodosPago.total, tipo: "moneda" },
    ],
    secciones: [
      {
        titulo: "Métodos de pago",
        columnas: [
          { header: "Método de pago", key: "nombre", tipo: "texto", width: 24 },
          { header: "Monto", key: "monto", tipo: "moneda", width: 16 },
          { header: "% del total", key: "porcentaje", tipo: "porcentaje", width: 14 },
        ],
        filas: metodosPago.items,
      },
    ],
  });

  const onExcel = async () => {
    setIsExportando("excel");
    try {
      const { exportarReporteExcel } = await import("../utils/exportExcel");
      await exportarReporteExcel(armarReporte());
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo generar el Excel.");
    } finally {
      setIsExportando(null);
    }
  };

  const onPdf = async () => {
    setIsExportando("pdf");
    try {
      const { exportarReportePdf } = await import("../utils/exportPdf");
      exportarReportePdf(armarReporte());
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo generar el PDF.");
    } finally {
      setIsExportando(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#131f24] p-6 font-sans">
      <Toaster position="top-center" closeButton />
      <div className="mx-auto max-w-6xl space-y-6">
        <ReporteHeader titulo="Reporte de métodos de pago">
          <BotonesExportar exportando={isExportando} onExcel={onExcel} onPdf={onPdf} disabled={cargando} />
        </ReporteHeader>

        <FiltroFechas {...rangoFechas} />

        <KpiGrid
          cargando={cargando}
          items={[
            { label: "Métodos usados", value: String(metodosPago.items.length) },
            { label: "Total cobrado", value: money(metodosPago.total), color: "text-amber-600 dark:text-[#ffd900]" },
          ]}
        />

        <section className="bg-white dark:bg-[#202f36] border-2 border-[#E5E5E5] dark:border-[#37464f] rounded-3xl p-5">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/60 mb-4">
            Distribución por método de pago
          </h2>
          {cargando ? (
            <div className="text-center text-sm font-bold text-gray-400 dark:text-white/40 py-6">Cargando...</div>
          ) : (
            <RankingBarras
              items={metodosPago.items.map((m, i) => ({
                label: `${m.nombre} · ${m.porcentaje.toFixed(1)}%`,
                value: m.monto,
                color: COLORES[i % COLORES.length],
              }))}
              formatValue={money}
            />
          )}
        </section>

        <section className="bg-white dark:bg-[#202f36] border-2 border-[#E5E5E5] dark:border-[#37464f] rounded-3xl overflow-hidden">
          <div className="p-5 pb-3">
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/60">
              Detalle ({metodosPago.items.length})
            </h2>
          </div>
          <div className="px-5 pb-5">
            <TablaReporte
              cargando={cargando}
              rowKey={(f) => f.nombre}
              columnas={[
                { header: "Método de pago", key: "nombre" },
                { header: "Monto", key: "monto", align: "right", render: (f) => money(f.monto) },
                { header: "% del total", key: "porcentaje", align: "right", render: (f) => `${f.porcentaje.toFixed(1)}%` },
              ]}
              filas={metodosPago.items}
            />
          </div>
        </section>
      </div>
    </div>
  );
};
