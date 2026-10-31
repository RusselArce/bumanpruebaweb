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

export const ReporteUsuariosPage: React.FC = () => {
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

  const usuarios = useMemo(() => {
    const mapa = new Map<string, { nombre: string; cantidadVentas: number; total: number }>();
    for (const v of dataVentas ?? []) {
      const nombre = v.usuarios?.nombres ?? "Sin usuario";
      const prev = mapa.get(nombre) ?? { nombre, cantidadVentas: 0, total: 0 };
      prev.cantidadVentas += 1;
      prev.total += Number(v.monto_total || 0);
      mapa.set(nombre, prev);
    }
    return Array.from(mapa.values()).sort((a, b) => b.total - a.total);
  }, [dataVentas]);

  const totalGeneral = useMemo(() => usuarios.reduce((a, u) => a + u.total, 0), [usuarios]);

  const filasUsuarios = useMemo(
    () =>
      usuarios.map((u) => ({
        ...u,
        ticketPromedio: u.cantidadVentas ? u.total / u.cantidadVentas : 0,
      })),
    [usuarios],
  );

  const armarReporte = (): ReporteExportable => ({
    titulo: "Reporte de usuarios",
    empresaNombre: itemSelectEmpresa?.nombre ?? "Empresa",
    desde: rangoFechas.desde,
    hasta: rangoFechas.hasta,
    simboloMoneda: simbolo,
    kpis: [
      { label: "Usuarios con ventas", value: usuarios.length, tipo: "entero" },
      { label: "Total vendido", value: totalGeneral, tipo: "moneda" },
    ],
    secciones: [
      {
        titulo: "Ventas por usuario",
        columnas: [
          { header: "Usuario", key: "nombre", tipo: "texto", width: 26 },
          { header: "N° de ventas", key: "cantidadVentas", tipo: "entero", width: 16 },
          { header: "Total vendido", key: "total", tipo: "moneda", width: 18 },
          { header: "Ticket promedio", key: "ticketPromedio", tipo: "moneda", width: 18 },
        ],
        filas: filasUsuarios,
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
        <ReporteHeader titulo="Reporte de usuarios">
          <BotonesExportar exportando={isExportando} onExcel={onExcel} onPdf={onPdf} disabled={cargando} />
        </ReporteHeader>

        <FiltroFechas {...rangoFechas} />

        <KpiGrid
          cargando={cargando}
          items={[
            { label: "Usuarios con ventas", value: String(usuarios.length) },
            { label: "Total vendido", value: money(totalGeneral), color: "text-amber-600 dark:text-[#ffd900]" },
          ]}
        />

        <section className="bg-white dark:bg-[#202f36] border-2 border-[#E5E5E5] dark:border-[#37464f] rounded-3xl p-5">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/60 mb-4">
            Ventas por usuario
          </h2>
          {cargando ? (
            <div className="text-center text-sm font-bold text-gray-400 dark:text-white/40 py-6">Cargando...</div>
          ) : (
            <RankingBarras
              items={usuarios.map((u) => ({ label: `${u.nombre} · ${u.cantidadVentas} ventas`, value: u.total }))}
              formatValue={money}
              colorDefecto="#4a3aa7"
            />
          )}
        </section>

        <section className="bg-white dark:bg-[#202f36] border-2 border-[#E5E5E5] dark:border-[#37464f] rounded-3xl overflow-hidden">
          <div className="p-5 pb-3">
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/60">
              Detalle ({usuarios.length})
            </h2>
          </div>
          <div className="px-5 pb-5">
            <TablaReporte
              cargando={cargando}
              rowKey={(f) => f.nombre}
              columnas={[
                { header: "Usuario", key: "nombre" },
                { header: "N° de ventas", key: "cantidadVentas", align: "right" },
                { header: "Total vendido", key: "total", align: "right", render: (f) => money(f.total) },
                { header: "Ticket promedio", key: "ticketPromedio", align: "right", render: (f) => money(f.ticketPromedio) },
              ]}
              filas={filasUsuarios}
            />
          </div>
        </section>
      </div>
    </div>
  );
};
