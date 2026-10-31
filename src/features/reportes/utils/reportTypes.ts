export type TipoValorReporte = "texto" | "moneda" | "entero" | "porcentaje";

export type ColumnaReporte = {
  header: string;
  key: string;
  width?: number;
  tipo?: TipoValorReporte;
};

export type SeccionReporte = {
  titulo: string;
  columnas: ColumnaReporte[];
  filas: Record<string, string | number>[];
};

export type KpiReporte = {
  label: string;
  value: number | string;
  tipo?: TipoValorReporte;
};

// Forma genérica que consumen exportExcel/exportPdf: cualquier reporte
// (ventas, productos, mesas, métodos de pago, usuarios) arma uno de estos
// y los dos exportadores no necesitan saber nada del dominio.
export type ReporteExportable = {
  titulo: string;
  empresaNombre: string;
  sucursalNombre?: string;
  desde: string;
  hasta: string;
  simboloMoneda?: string;
  kpis?: KpiReporte[];
  secciones: SeccionReporte[];
};
