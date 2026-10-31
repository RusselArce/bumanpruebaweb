import React, { useMemo, useState } from "react";
import { Toaster, toast } from "sonner";
import { useAsignacionesSucursalesStore } from "@/features/asignacion_sucursal/store/asignacion_sucursal";
import { useEmpresaStore } from "@/features/empresa/store/empresa.store";
import { useDetalleVentasReporteQuery } from "../hooks/reportes.queries";
import { useRangoFechas } from "../hooks/useRangoFechas";
import { FiltroFechas } from "../components/FiltroFechas";
import { ReporteHeader } from "../components/ReporteHeader";
import { BotonesExportar } from "../components/BotonesExportar";
import { KpiGrid } from "../components/KpiGrid";
import { RankingBarras } from "../components/RankingBarras";
import { TablaReporte } from "../components/TablaReporte";
import { crearFormateadorMoneda } from "../utils/money";
import type { ReporteExportable } from "../utils/reportTypes";

export const ReporteProductosPage: React.FC = () => {
  const itemSelectAsignacionSucursal = useAsignacionesSucursalesStore((s) => s.itemSelect);
  const itemSelectEmpresa = useEmpresaStore((s) => s.itemSelect);
  const rangoFechas = useRangoFechas();
  const [isExportando, setIsExportando] = useState<"excel" | "pdf" | null>(null);

  const id_sucursal = itemSelectAsignacionSucursal?.id_sucursal as number;
  const { data: dataDetalle, isLoading: cargando } = useDetalleVentasReporteQuery({
    id_sucursal,
    desde: rangoFechas.desde,
    hasta: rangoFechas.hasta,
  });

  const simbolo = itemSelectEmpresa?.simbolo_moneda ?? "S/";
  const money = crearFormateadorMoneda(simbolo);

  const productos = useMemo(() => {
    const mapa = new Map<string, { nombre: string; cantidad: number; total: number }>();
    for (const d of dataDetalle ?? []) {
      const key = d.descripcion ?? `Producto ${d.id_producto ?? ""}`;
      const prev = mapa.get(key) ?? { nombre: key, cantidad: 0, total: 0 };
      prev.cantidad += Number(d.cantidad || 0);
      prev.total += Number(d.total || 0);
      mapa.set(key, prev);
    }
    return Array.from(mapa.values()).sort((a, b) => b.total - a.total);
  }, [dataDetalle]);

  const totalGeneral = useMemo(() => productos.reduce((a, p) => a + p.total, 0), [productos]);
  const cantidadTotal = useMemo(() => productos.reduce((a, p) => a + p.cantidad, 0), [productos]);
  const topProductos = productos.slice(0, 10);

  const filasProductos = useMemo(
    () =>
      productos.map((p) => ({
        ...p,
        porcentaje: totalGeneral ? (p.total / totalGeneral) * 100 : 0,
      })),
    [productos, totalGeneral],
  );

  const armarReporte = (): ReporteExportable => ({
    titulo: "Reporte de productos",
    empresaNombre: itemSelectEmpresa?.nombre ?? "Empresa",
    desde: rangoFechas.desde,
    hasta: rangoFechas.hasta,
    simboloMoneda: simbolo,
    kpis: [
      { label: "Productos distintos", value: productos.length, tipo: "entero" },
      { label: "Unidades vendidas", value: cantidadTotal, tipo: "entero" },
      { label: "Total vendido", value: totalGeneral, tipo: "moneda" },
    ],
    secciones: [
      {
        titulo: "Productos",
        columnas: [
          { header: "Producto", key: "nombre", tipo: "texto", width: 32 },
          { header: "Cantidad", key: "cantidad", tipo: "entero", width: 14 },
          { header: "Total vendido", key: "total", tipo: "moneda", width: 18 },
          { header: "% del total", key: "porcentaje", tipo: "porcentaje", width: 14 },
        ],
        filas: filasProductos,
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
        <ReporteHeader titulo="Reporte de productos">
          <BotonesExportar exportando={isExportando} onExcel={onExcel} onPdf={onPdf} disabled={cargando} />
        </ReporteHeader>

        <FiltroFechas {...rangoFechas} />

        <KpiGrid
          cargando={cargando}
          items={[
            { label: "Productos distintos", value: String(productos.length) },
            { label: "Unidades vendidas", value: String(cantidadTotal) },
            { label: "Total vendido", value: money(totalGeneral), color: "text-amber-600 dark:text-[#ffd900]" },
          ]}
        />

        <section className="bg-white dark:bg-[#202f36] border-2 border-[#E5E5E5] dark:border-[#37464f] rounded-3xl p-5">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/60 mb-4">
            Top 10 productos más vendidos
          </h2>
          {cargando ? (
            <div className="text-center text-sm font-bold text-gray-400 dark:text-white/40 py-6">Cargando...</div>
          ) : (
            <RankingBarras items={topProductos.map((p) => ({ label: p.nombre, value: p.total }))} formatValue={money} />
          )}
        </section>

        <section className="bg-white dark:bg-[#202f36] border-2 border-[#E5E5E5] dark:border-[#37464f] rounded-3xl overflow-hidden">
          <div className="p-5 pb-3">
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/60">
              Todos los productos ({productos.length})
            </h2>
          </div>
          <div className="px-5 pb-5">
            <TablaReporte
              cargando={cargando}
              rowKey={(f) => f.nombre}
              columnas={[
                { header: "Producto", key: "nombre" },
                { header: "Cantidad", key: "cantidad", align: "right" },
                { header: "Total vendido", key: "total", align: "right", render: (f) => money(f.total) },
                {
                  header: "% del total",
                  key: "porcentaje",
                  align: "right",
                  render: (f) => `${f.porcentaje.toFixed(1)}%`,
                },
              ]}
              filas={filasProductos}
            />
          </div>
        </section>
      </div>
    </div>
  );
};
