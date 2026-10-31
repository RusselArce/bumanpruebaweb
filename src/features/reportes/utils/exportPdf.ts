import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { slugify } from "./download";
import type { ReporteExportable, TipoValorReporte } from "./reportTypes";

const AZUL: [number, number, number] = [42, 120, 214];

function finalYDe(doc: jsPDF) {
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

function formatearValor(valor: number | string, tipo: TipoValorReporte | undefined, simbolo: string) {
  if (typeof valor === "string") return valor;
  if (tipo === "moneda") {
    return `${simbolo} ${new Intl.NumberFormat("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor || 0)}`;
  }
  if (tipo === "porcentaje") return `${valor.toFixed(1)}%`;
  if (tipo === "entero") return String(Math.round(valor));
  return String(valor);
}

export function exportarReportePdf(reporte: ReporteExportable) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margenX = 40;
  const simbolo = reporte.simboloMoneda ?? "S/";
  const alturaPagina = doc.internal.pageSize.getHeight();

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(reporte.titulo, margenX, 44);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const subtitulo = [reporte.empresaNombre, reporte.sucursalNombre].filter(Boolean).join(" · ");
  doc.text(subtitulo, margenX, 60);
  doc.text(`Del ${reporte.desde} al ${reporte.hasta}`, margenX, 74);

  let cursorY = 90;

  if (reporte.kpis?.length) {
    autoTable(doc, {
      startY: cursorY,
      head: [["Métrica", "Valor"]],
      body: reporte.kpis.map((k) => [k.label, formatearValor(k.value, k.tipo, simbolo)]),
      theme: "grid",
      headStyles: { fillColor: AZUL },
      margin: { left: margenX, right: margenX },
    });
    cursorY = finalYDe(doc) + 28;
  }

  reporte.secciones.forEach((seccion, idx) => {
    if (cursorY > alturaPagina - 120) {
      doc.addPage();
      cursorY = 44;
    }

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(seccion.titulo, margenX, cursorY);

    autoTable(doc, {
      startY: cursorY + 10,
      head: [seccion.columnas.map((c) => c.header)],
      body: seccion.filas.map((fila) =>
        seccion.columnas.map((c) => formatearValor(fila[c.key], c.tipo, simbolo)),
      ),
      theme: idx % 2 === 0 ? "striped" : "grid",
      headStyles: { fillColor: AZUL, fontSize: 9 },
      styles: { fontSize: 8 },
      margin: { left: margenX, right: margenX },
    });

    cursorY = finalYDe(doc) + 28;
  });

  doc.save(`${slugify(reporte.titulo)}_${reporte.desde}_a_${reporte.hasta}.pdf`);
}
