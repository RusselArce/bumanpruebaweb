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

export const ReporteRentabilidadPage: React.FC = () => {
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
    const mapa = new Map<
      string,
      { nombre: string; cantidad: number; ingresos: number; costo: number }
    >();
    for (const d of dataDetalle ?? []) {
      const key = d.descripcion ?? `Producto ${d.id_producto ?? ""}`;
      const prev = mapa.get(key) ?? { nombre: key, cantidad: 0, ingresos: 0, costo: 0 };
      const cantidad = Number(d.cantidad || 0);
      prev.cantidad += cantidad;
      prev.ingresos += Number(d.total || 0);
      prev.costo += Number(d.precio_compra || 0) * cantidad;
      mapa.set(key, prev);
    }
    return Array.from(mapa.values())
      .map((p) => ({ ...p, margen: p.ingresos - p.costo, margenPct: p.ingresos ? ((p.ingresos - p.costo) / p.ingresos) * 100 : 0 }))
      .sort((a, b) => b.margen - a.margen);
  }, [dataDetalle]);

  const ingresosTotal = useMemo(() => productos.reduce((a, p) => a + p.ingresos, 0), [productos]);
  const costoTotal = useMemo(() => productos.reduce((a, p) => a + p.costo, 0), [productos]);
  const margenTotal = ingresosTotal - costoTotal;
  const margenPctTotal = ingresosTotal ? (margenTotal / ingresosTotal) * 100 : 0;
  const topProductos = productos.slice(0, 10);

  const armarReporte = (): ReporteExportable => ({
    titulo: "Reporte de rentabilidad de productos",
    empresaNombre: itemSelectEmpresa?.nombre ?? "Empresa",
    desde: rangoFechas.desde,
    hasta: rangoFechas.hasta,
    simboloMoneda: simbolo,
    kpis: [
      { label: "Ingresos", value: ingresosTotal, tipo: "moneda" },
      { label: "Costo", value: costoTotal, tipo: "moneda" },
      { label: "Margen", value: margenTotal, tipo: "moneda" },
      { label: "Margen %", value: margenPctTotal, tipo: "porcentaje" },
    ],
    secciones: [
      {
        titulo: "Rentabilidad por producto",
        columnas: [
          { header: "Producto", key: "nombre", tipo: "texto", width: 32 },
          { header: "Cantidad", key: "cantidad", tipo: "entero", width: 14 },
          { header: "Ingresos", key: "ingresos", tipo: "moneda", width: 16 },
          { header: "Costo", key: "costo", tipo: "moneda", width: 16 },
          { header: "Margen", key: "margen", tipo: "moneda", width: 16 },
          { header: "Margen %", key: "margenPct", tipo: "porcentaje", width: 14 },
        ],
        filas: productos,
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
        <ReporteHeader titulo="Rentabilidad de productos">
          <BotonesExportar exportando={isExportando} onExcel={onExcel} onPdf={onPdf} disabled={cargando} />
        </ReporteHeader>

        <FiltroFechas {...rangoFechas} />

        <KpiGrid
          cargando={cargando}
          items={[
            { label: "Ingresos", value: money(ingresosTotal) },
            { label: "Costo", value: money(costoTotal) },
            { label: "Margen", value: money(margenTotal), color: "text-amber-600 dark:text-[#ffd900]" },
            { label: "Margen %", value: `${margenPctTotal.toFixed(1)}%`, color: "text-emerald-600 dark:text-emerald-400" },
          ]}
        />

        <section className="bg-white dark:bg-[#202f36] border-2 border-[#E5E5E5] dark:border-[#37464f] rounded-3xl p-5">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/60 mb-4">
            Top 10 productos más rentables
          </h2>
          {cargando ? (
            <div className="text-center text-sm font-bold text-gray-400 dark:text-white/40 py-6">Cargando...</div>
          ) : (
            <RankingBarras
              items={topProductos.map((p) => ({ label: p.nombre, value: p.margen }))}
              formatValue={money}
              colorDefecto="#2fbf71"
            />
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
                { header: "Ingresos", key: "ingresos", align: "right", render: (f) => money(f.ingresos) },
                { header: "Costo", key: "costo", align: "right", render: (f) => money(f.costo) },
                {
                  header: "Margen",
                  key: "margen",
                  align: "right",
                  render: (f) => (
                    <span className={f.margen >= 0 ? "text-emerald-600 dark:text-emerald-400 font-black" : "text-red-500 font-black"}>
                      {money(f.margen)}
                    </span>
                  ),
                },
                { header: "Margen %", key: "margenPct", align: "right", render: (f) => `${f.margenPct.toFixed(1)}%` },
              ]}
              filas={productos}
            />
          </div>
        </section>
      </div>
    </div>
  );
};
