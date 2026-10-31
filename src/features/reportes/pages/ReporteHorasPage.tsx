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

const etiquetaHora = (h: number) => `${String(h).padStart(2, "0")}:00 - ${String((h + 1) % 24).padStart(2, "0")}:00`;

export const ReporteHorasPage: React.FC = () => {
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

  const horas = useMemo(() => {
    const porHora = new Array(24).fill(0).map((_, hora) => ({ hora, cantidadVentas: 0, total: 0 }));
    for (const v of dataVentas ?? []) {
      const hora = Number(v.fecha.slice(11, 13));
      if (Number.isNaN(hora) || hora < 0 || hora > 23) continue;
      porHora[hora].cantidadVentas += 1;
      porHora[hora].total += Number(v.monto_total || 0);
    }
    return porHora
      .filter((h) => h.cantidadVentas > 0)
      .map((h) => ({
        ...h,
        etiqueta: etiquetaHora(h.hora),
        ticketPromedio: h.cantidadVentas ? h.total / h.cantidadVentas : 0,
      }));
  }, [dataVentas]);

  const totalVentas = useMemo(() => horas.reduce((a, h) => a + h.cantidadVentas, 0), [horas]);
  const totalVendido = useMemo(() => horas.reduce((a, h) => a + h.total, 0), [horas]);
  const horaPico = useMemo(
    () => horas.reduce((max, h) => (h.total > (max?.total ?? -1) ? h : max), horas[0] as (typeof horas)[number] | undefined),
    [horas],
  );
  const horaValle = useMemo(
    () => horas.reduce((min, h) => (h.total < (min?.total ?? Infinity) ? h : min), horas[0] as (typeof horas)[number] | undefined),
    [horas],
  );
  const rankingPorVentas = useMemo(() => [...horas].sort((a, b) => b.total - a.total), [horas]);

  const armarReporte = (): ReporteExportable => ({
    titulo: "Reporte de horas pico y valle",
    empresaNombre: itemSelectEmpresa?.nombre ?? "Empresa",
    desde: rangoFechas.desde,
    hasta: rangoFechas.hasta,
    simboloMoneda: simbolo,
    kpis: [
      { label: "N° de ventas", value: totalVentas, tipo: "entero" },
      { label: "Total vendido", value: totalVendido, tipo: "moneda" },
      { label: "Hora pico", value: horaPico?.etiqueta ?? "-", tipo: "texto" },
      { label: "Hora valle", value: horaValle?.etiqueta ?? "-", tipo: "texto" },
    ],
    secciones: [
      {
        titulo: "Ventas por hora",
        columnas: [
          { header: "Hora", key: "etiqueta", tipo: "texto", width: 18 },
          { header: "N° de ventas", key: "cantidadVentas", tipo: "entero", width: 16 },
          { header: "Total vendido", key: "total", tipo: "moneda", width: 18 },
          { header: "Ticket promedio", key: "ticketPromedio", tipo: "moneda", width: 18 },
        ],
        filas: horas,
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
        <ReporteHeader titulo="Horas pico y valle">
          <BotonesExportar exportando={isExportando} onExcel={onExcel} onPdf={onPdf} disabled={cargando} />
        </ReporteHeader>

        <FiltroFechas {...rangoFechas} />

        <KpiGrid
          cargando={cargando}
          items={[
            { label: "N° de ventas", value: String(totalVentas) },
            { label: "Total vendido", value: money(totalVendido), color: "text-amber-600 dark:text-[#ffd900]" },
            { label: "Hora pico", value: horaPico?.etiqueta ?? "-", color: "text-emerald-600 dark:text-emerald-400" },
            { label: "Hora valle", value: horaValle?.etiqueta ?? "-", color: "text-red-500" },
          ]}
        />

        <section className="bg-white dark:bg-[#202f36] border-2 border-[#E5E5E5] dark:border-[#37464f] rounded-3xl p-5">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/60 mb-4">
            Ranking de horas por venta
          </h2>
          {cargando ? (
            <div className="text-center text-sm font-bold text-gray-400 dark:text-white/40 py-6">Cargando...</div>
          ) : (
            <RankingBarras
              items={rankingPorVentas.map((h) => ({ label: `${h.etiqueta} · ${h.cantidadVentas} ventas`, value: h.total }))}
              formatValue={money}
              colorDefecto="#ff9600"
            />
          )}
        </section>

        <section className="bg-white dark:bg-[#202f36] border-2 border-[#E5E5E5] dark:border-[#37464f] rounded-3xl overflow-hidden">
          <div className="p-5 pb-3">
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/60">
              Detalle por hora ({horas.length})
            </h2>
          </div>
          <div className="px-5 pb-5">
            <TablaReporte
              cargando={cargando}
              rowKey={(f) => f.hora}
              columnas={[
                { header: "Hora", key: "etiqueta" },
                { header: "N° de ventas", key: "cantidadVentas", align: "right" },
                { header: "Total vendido", key: "total", align: "right", render: (f) => money(f.total) },
                { header: "Ticket promedio", key: "ticketPromedio", align: "right", render: (f) => money(f.ticketPromedio) },
              ]}
              filas={horas}
            />
          </div>
        </section>
      </div>
    </div>
  );
};
