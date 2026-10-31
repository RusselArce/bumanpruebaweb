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
import { TablaReporte } from "../components/TablaReporte";
import { crearFormateadorMoneda } from "../utils/money";
import type { ReporteExportable } from "../utils/reportTypes";

export const ReporteVentasPage: React.FC = () => {
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

  const kpis = useMemo(() => {
    const ventas = dataVentas ?? [];
    const totalVendido = ventas.reduce((a, v) => a + Number(v.monto_total || 0), 0);
    const totalSubtotal = ventas.reduce((a, v) => a + Number(v.sub_total || 0), 0);
    const totalImpuestos = ventas.reduce((a, v) => a + Number(v.total_impuestos || 0), 0);
    const totalPropinas = ventas.reduce((a, v) => a + Number(v.propina || 0), 0);
    const cantidadVentas = ventas.length;
    const ticketPromedio = cantidadVentas ? totalVendido / cantidadVentas : 0;
    return { totalVendido, totalSubtotal, totalImpuestos, totalPropinas, cantidadVentas, ticketPromedio };
  }, [dataVentas]);

  const filas = useMemo(
    () =>
      (dataVentas ?? []).map((v) => ({
        id: v.id,
        fecha: v.fecha.replace("T", " ").slice(0, 16),
        mesa: v.nombre_ref ?? v.mesas?.nombre ?? "-",
        usuario: v.usuarios?.nombres ?? "-",
        subtotal: Number(v.sub_total || 0),
        igv: Number(v.total_impuestos || 0),
        propina: Number(v.propina || 0),
        total: Number(v.monto_total || 0),
      })),
    [dataVentas],
  );

  const armarReporte = (): ReporteExportable => ({
    titulo: "Reporte de ventas",
    empresaNombre: itemSelectEmpresa?.nombre ?? "Empresa",
    desde: rangoFechas.desde,
    hasta: rangoFechas.hasta,
    simboloMoneda: simbolo,
    kpis: [
      { label: "Total vendido", value: kpis.totalVendido, tipo: "moneda" },
      { label: "N° de ventas", value: kpis.cantidadVentas, tipo: "entero" },
      { label: "Ticket promedio", value: kpis.ticketPromedio, tipo: "moneda" },
      { label: "Subtotal", value: kpis.totalSubtotal, tipo: "moneda" },
      { label: "IGV", value: kpis.totalImpuestos, tipo: "moneda" },
      { label: "Propinas", value: kpis.totalPropinas, tipo: "moneda" },
    ],
    secciones: [
      {
        titulo: "Detalle de ventas",
        columnas: [
          { header: "N° Venta", key: "id", tipo: "entero", width: 12 },
          { header: "Fecha", key: "fecha", tipo: "texto", width: 20 },
          { header: "Mesa / Ref", key: "mesa", tipo: "texto", width: 18 },
          { header: "Usuario", key: "usuario", tipo: "texto", width: 22 },
          { header: "Subtotal", key: "subtotal", tipo: "moneda", width: 14 },
          { header: "IGV", key: "igv", tipo: "moneda", width: 12 },
          { header: "Propina", key: "propina", tipo: "moneda", width: 12 },
          { header: "Total", key: "total", tipo: "moneda", width: 14 },
        ],
        filas,
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
        <ReporteHeader titulo="Reporte de ventas">
          <BotonesExportar exportando={isExportando} onExcel={onExcel} onPdf={onPdf} disabled={cargando} />
        </ReporteHeader>

        <FiltroFechas {...rangoFechas} />

        <KpiGrid
          cargando={cargando}
          items={[
            { label: "Total vendido", value: money(kpis.totalVendido), color: "text-amber-600 dark:text-[#ffd900]" },
            { label: "N° de ventas", value: String(kpis.cantidadVentas) },
            { label: "Ticket promedio", value: money(kpis.ticketPromedio) },
            { label: "Propinas", value: money(kpis.totalPropinas), color: "text-[#ff3d91]" },
          ]}
        />

        <section className="bg-white dark:bg-[#202f36] border-2 border-[#E5E5E5] dark:border-[#37464f] rounded-3xl overflow-hidden">
          <div className="p-5 pb-3">
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/60">
              Detalle de ventas ({filas.length})
            </h2>
          </div>
          <div className="px-5 pb-5">
            <TablaReporte
              cargando={cargando}
              rowKey={(f) => f.id}
              columnas={[
                { header: "Fecha", key: "fecha" },
                { header: "Mesa / Ref", key: "mesa" },
                { header: "Usuario", key: "usuario" },
                { header: "Subtotal", key: "subtotal", align: "right", render: (f) => money(f.subtotal) },
                { header: "IGV", key: "igv", align: "right", render: (f) => money(f.igv) },
                { header: "Propina", key: "propina", align: "right", render: (f) => money(f.propina) },
                {
                  header: "Total",
                  key: "total",
                  align: "right",
                  render: (f) => <span className="font-black text-gray-900 dark:text-white">{money(f.total)}</span>,
                },
              ]}
              filas={filas}
            />
          </div>
        </section>
      </div>
    </div>
  );
};
