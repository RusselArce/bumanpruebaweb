import ExcelJS from "exceljs";
import { descargarBlob, slugify } from "./download";
import type { ReporteExportable, TipoValorReporte } from "./reportTypes";

const FILL_ENCABEZADO: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF2A78D6" },
};

function estilizarEncabezado(ws: ExcelJS.Worksheet) {
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = FILL_ENCABEZADO;
  header.alignment = { vertical: "middle" };
}

function numFmtDe(tipo?: TipoValorReporte) {
  if (tipo === "moneda") return "#,##0.00";
  if (tipo === "entero") return "#,##0";
  if (tipo === "porcentaje") return "0.0%";
  return undefined;
}

export async function exportarReporteExcel(reporte: ReporteExportable) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Buman POS";
  wb.created = new Date();

  // ===== Resumen =====
  const resumen = wb.addWorksheet("Resumen");
  resumen.columns = [
    { header: "Campo", key: "c", width: 26 },
    { header: "Valor", key: "v", width: 22 },
  ];
  resumen.addRow({ c: "Reporte", v: reporte.titulo });
  resumen.addRow({ c: "Empresa", v: reporte.empresaNombre });
  if (reporte.sucursalNombre) resumen.addRow({ c: "Sucursal", v: reporte.sucursalNombre });
  resumen.addRow({ c: "Rango de fechas", v: `${reporte.desde} a ${reporte.hasta}` });

  if (reporte.kpis?.length) {
    resumen.addRow({});
    for (const kpi of reporte.kpis) {
      const row = resumen.addRow({ c: kpi.label, v: kpi.value });
      const fmt = numFmtDe(kpi.tipo);
      if (fmt) row.getCell("v").numFmt = fmt;
    }
  }
  estilizarEncabezado(resumen);

  // ===== Una hoja por sección =====
  for (const seccion of reporte.secciones) {
    const nombreHoja = seccion.titulo.slice(0, 31); // límite de Excel para nombres de hoja
    const ws = wb.addWorksheet(nombreHoja);
    ws.columns = seccion.columnas.map((c) => ({
      header: c.header,
      key: c.key,
      width: c.width ?? 20,
    }));
    ws.addRows(seccion.filas);
    estilizarEncabezado(ws);

    for (const c of seccion.columnas) {
      const fmt = numFmtDe(c.tipo);
      if (!fmt) continue;
      ws.getColumn(c.key).numFmt = fmt;
      if (c.tipo === "porcentaje") {
        ws.eachRow((row, i) => {
          if (i === 1) return;
          const cell = row.getCell(c.key);
          if (typeof cell.value === "number") cell.value = cell.value / 100;
        });
      }
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  descargarBlob(
    buffer,
    `${slugify(reporte.titulo)}_${reporte.desde}_a_${reporte.hasta}.xlsx`,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
}
