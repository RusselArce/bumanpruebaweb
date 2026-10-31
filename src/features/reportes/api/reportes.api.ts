import { supabase } from "@/shared/utils/supabase";

export type RangoReportePayload = {
  id_sucursal: number;
  desde: string; // "YYYY-MM-DD"
  hasta: string; // "YYYY-MM-DD"
};

const finDeDia = (hasta: string) => `${hasta}T23:59:59.999`;

export type VentaReporteRow = {
  id: number;
  fecha: string;
  monto_total: number | null;
  sub_total: number | null;
  total_impuestos: number | null;
  propina: number | null;
  id_mesa: number | null;
  id_usuario: number | null;
  nombre_ref: string | null;
  mesas: { nombre: string | null } | null;
  usuarios: { nombres: string | null } | null;
};

// ✅ ventas confirmadas (ya cobradas) en el rango de fechas, para KPIs,
// listado detallado y agrupación por usuario.
export async function mostrarVentasReporte(
  p: RangoReportePayload,
): Promise<VentaReporteRow[]> {
  const { data, error } = await supabase
    .from("ventas")
    .select(
      "id, fecha, monto_total, sub_total, total_impuestos, propina, id_mesa, id_usuario, nombre_ref, mesas(nombre), usuarios(nombres)",
    )
    .eq("id_sucursal", p.id_sucursal)
    .eq("estado", "confirmada")
    .gte("fecha", p.desde)
    .lte("fecha", finDeDia(p.hasta))
    .order("fecha", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as VentaReporteRow[];
}

export type DetalleReporteRow = {
  id_producto: number | null;
  descripcion: string | null;
  cantidad: number | null;
  total: number | null;
  precio_compra: number | null;
};

// ✅ líneas de detalle de ventas confirmadas en el rango, para el ranking
// de productos más vendidos. Se filtra a través de la relación "ventas"
// (fecha/estado/sucursal viven ahí, no en detalle_venta).
export async function mostrarDetalleVentasReporte(
  p: RangoReportePayload,
): Promise<DetalleReporteRow[]> {
  const { data, error } = await supabase
    .from("detalle_venta")
    .select(
      "id_producto, descripcion, cantidad, total, precio_compra, ventas!inner(id_sucursal, estado, fecha)",
    )
    .eq("ventas.id_sucursal", p.id_sucursal)
    .eq("ventas.estado", "confirmada")
    .gte("ventas.fecha", p.desde)
    .lte("ventas.fecha", finDeDia(p.hasta));

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as DetalleReporteRow[];
}

export type MovimientoReporteRow = {
  monto: number | null;
  id_metodo_pago: number | null;
  metodos_pago: { nombre: string | null } | null;
};

// ✅ cobros reales (tipo_movimiento = "venta") en el rango, para el
// desglose por método de pago. Se apoya en movimientos_caja porque una
// sola venta puede pagarse con métodos mixtos (varias filas).
export async function mostrarMovimientosVentaReporte(
  p: RangoReportePayload,
): Promise<MovimientoReporteRow[]> {
  const { data, error } = await supabase
    .from("movimientos_caja")
    .select("monto, id_metodo_pago, metodos_pago(nombre), ventas!inner(id_sucursal, fecha)")
    .eq("tipo_movimiento", "venta")
    .eq("ventas.id_sucursal", p.id_sucursal)
    .gte("ventas.fecha", p.desde)
    .lte("ventas.fecha", finDeDia(p.hasta));

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as MovimientoReporteRow[];
}
