import React, { useMemo, useState } from "react";
import { Toaster, toast } from "sonner";
import { useAsignacionesSucursalesStore } from "@/features/asignacion_sucursal/store/asignacion_sucursal";
import { useEmpresaStore } from "@/features/empresa/store/empresa.store";
import { useVentasReporteQuery } from "../hooks/reportes.queries";
import { useRangoFechas } from "../hooks/useRangoFechas";
import { FiltroFechas } from "../components/FiltroFechas";
import { ReporteHeader } from "../components/ReporteHeader";
import { BotonesExportar } from "../components/BotonesExportar";
import { KpiGrid } from "../components/KpiGrid";
import { RankingBarras } from "../components/RankingBarras";
import { TablaReporte } from "../components/TablaReporte";
import { crearFormateadorMoneda } from "../utils/money";
import type { ReporteExportable } from "../utils/reportTypes";

export const ReporteMesasPage: React.FC = () => {
  const itemSelectAsignacionSucursal = useAsignacionesSucursalesStore((s) => s.itemSelect);
  const itemSelectEmpresa = useEmpresaStore((s) => s.itemSelect);
  const rangoFechas = useRangoFechas();
  const [isExportando, setIsExportando] = useState<"excel" | "pdf" | null>(null);

  const id_sucursal = itemSelectAsignacionSucursal?.id_sucursal as number;
  const { data: dataVentas, isLoading: cargando } = useVentasReporteQuery({
    id_sucursal,
    desde: rangoFechas.desde,
    hasta: rangoFechas.hasta,
  });

  const simbolo = itemSelectEmpresa?.simbolo_moneda ?? "S/";
  const money = crearFormateadorMoneda(simbolo);

  const mesas = useMemo(() => {
    const mapa = new Map<string, { nombre: string; cantidadVentas: number; total: number }>();
    for (const v of dataVentas ?? []) {
      const nombre = v.nombre_ref ? `Para llevar · ${v.nombre_ref}` : `Mesa ${v.mesas?.nombre ?? "-"}`;
      const prev = mapa.get(nombre) ?? { nombre, cantidadVentas: 0, total: 0 };
      prev.cantidadVentas += 1;
      prev.total += Number(v.monto_total || 0);
      mapa.set(nombre, prev);
    }
    return Array.from(mapa.values()).sort((a, b) => b.total - a.total);
  }, [dataVentas]);

  const totalGeneral = useMemo(() => mesas.reduce((a, m) => a + m.total, 0), [mesas]);
  const topMesas = mesas.slice(0, 10);

  const filasMesas = useMemo(
    () =>
      mesas.map((m) => ({
        ...m,
        ticketPromedio: m.cantidadVentas ? m.total / m.cantidadVentas : 0,
      })),
    [mesas],
  );

  const armarReporte = (): ReporteExportable => ({
    titulo: "Reporte de mesas",
    empresaNombre: itemSelectEmpresa?.nombre ?? "Empresa",
    desde: rangoFechas.desde,
    hasta: rangoFechas.hasta,
    simboloMoneda: simbolo,
    kpis: [
      { label: "Mesas / referencias con ventas", value: mesas.length, tipo: "entero" },
      { label: "Total vendido", value: totalGeneral, tipo: "moneda" },
    ],
    secciones: [
      {
        titulo: "Ventas por mesa",
        columnas: [
          { header: "Mesa / Ref", key: "nombre", tipo: "texto", width: 26 },
          { header: "N° de ventas", key: "cantidadVentas", tipo: "entero", width: 16 },
          { header: "Total vendido", key: "total", tipo: "moneda", width: 18 },
          { header: "Ticket promedio", key: "ticketPromedio", tipo: "moneda", width: 18 },
        ],
        filas: filasMesas,
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
        <ReporteHeader titulo="Reporte de mesas">
          <BotonesExportar exportando={isExportando} onExcel={onExcel} onPdf={onPdf} disabled={cargando} />
        </ReporteHeader>

        <FiltroFechas {...rangoFechas} />

        <KpiGrid
          cargando={cargando}
          items={[
            { label: "Mesas / referencias con ventas", value: String(mesas.length) },
            { label: "Total vendido", value: money(totalGeneral), color: "text-amber-600 dark:text-[#ffd900]" },
          ]}
        />

        <section className="bg-white dark:bg-[#202f36] border-2 border-[#E5E5E5] dark:border-[#37464f] rounded-3xl p-5">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/60 mb-4">
            Top 10 mesas / referencias
          </h2>
          {cargando ? (
            <div className="text-center text-sm font-bold text-gray-400 dark:text-white/40 py-6">Cargando...</div>
          ) : (
            <RankingBarras
              items={topMesas.map((m) => ({ label: `${m.nombre} · ${m.cantidadVentas} ventas`, value: m.total }))}
              formatValue={money}
              colorDefecto="#1baf7a"
            />
          )}
        </section>

        <section className="bg-white dark:bg-[#202f36] border-2 border-[#E5E5E5] dark:border-[#37464f] rounded-3xl overflow-hidden">
          <div className="p-5 pb-3">
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/60">
              Todas las mesas ({mesas.length})
            </h2>
          </div>
          <div className="px-5 pb-5">
            <TablaReporte
              cargando={cargando}
              rowKey={(f) => f.nombre}
              columnas={[
                { header: "Mesa / Ref", key: "nombre" },
                { header: "N° de ventas", key: "cantidadVentas", align: "right" },
                { header: "Total vendido", key: "total", align: "right", render: (f) => money(f.total) },
                { header: "Ticket promedio", key: "ticketPromedio", align: "right", render: (f) => money(f.ticketPromedio) },
              ]}
              filas={filasMesas}
            />
          </div>
        </section>
      </div>
    </div>
  );
};
