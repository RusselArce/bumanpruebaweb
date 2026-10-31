import { supabase } from "@/shared/utils/supabase";
import { insertarMovimientoCaja } from "@/features/movimientos_caja/api/movimientos_caja.api";

export type VentaPendienteRow = {
  id: number;
  fecha: string;
  monto_total: number | null;
  saldo: number | null;
  nro_comprobante: string | null;
  id_cliente: number | null;
  clientes_proveedores: { nombres: string | null; telefono: string | null } | null;
};

// ✅ ventas confirmadas con saldo pendiente (vendidas a crédito/fiado, total
// o parcialmente), de cualquier fecha: una deuda vieja debe seguir apareciendo.
export async function mostrarCuentasPorCobrar(
  id_sucursal: number,
): Promise<VentaPendienteRow[]> {
  const { data, error } = await supabase
    .from("ventas")
    .select(
      "id, fecha, monto_total, saldo, nro_comprobante, id_cliente, clientes_proveedores(nombres, telefono)",
    )
    .eq("id_sucursal", id_sucursal)
    .eq("estado", "confirmada")
    .gt("saldo", 0)
    .order("fecha", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as VentaPendienteRow[];
}

export type AbonoRow = {
  id: number;
  fecha_movimiento: string;
  monto: number | null;
  id_ventas: number | null;
  metodos_pago: { nombre: string | null } | null;
};

// ✅ historial de abonos ya registrados (mismos movimientos_caja que arma
// registrarAbono) para las ventas fiadas de un cliente puntual.
export async function mostrarAbonosPorVentas(idsVenta: number[]): Promise<AbonoRow[]> {
  if (idsVenta.length === 0) return [];

  const { data, error } = await supabase
    .from("movimientos_caja")
    .select("id, fecha_movimiento, monto, id_ventas, metodos_pago(nombre)")
    .eq("tipo_movimiento", "abono")
    .in("id_ventas", idsVenta)
    .order("fecha_movimiento", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as AbonoRow[];
}

export type LineaAbono = { id_metodo_pago: number; monto: number };

export type RegistrarAbonoPayload = {
  id_venta: number;
  saldo_actual: number;
  /** Una línea por método: pago simple = 1 línea, pago mixto = varias que suman el abono. */
  lineas: LineaAbono[];
  id_usuario: number | null | undefined;
  id_cierre_caja: number | null | undefined;
};

// ✅ baja el saldo pendiente de la venta (por la suma de todas las líneas) y
// deja un movimiento de caja por cada método usado (mismo movimientos_caja
// que usa cualquier cobro, incluido el pago mixto), para que el cierre del
// turno en que se cobra el abono lo cuente completo.
export async function registrarAbono(p: RegistrarAbonoPayload) {
  const monto = Number(p.lineas.reduce((acc, l) => acc + l.monto, 0).toFixed(2));
  const nuevoSaldo = Math.max(0, Number((p.saldo_actual - monto).toFixed(2)));

  const { error } = await supabase
    .from("ventas")
    .update({ saldo: nuevoSaldo })
    .eq("id", p.id_venta);
  if (error) throw new Error(error.message);

  await Promise.all(
    p.lineas.map((linea) =>
      insertarMovimientoCaja({
        id_ventas: p.id_venta,
        monto: linea.monto,
        id_metodo_pago: linea.id_metodo_pago,
        tipo_movimiento: "abono",
        descripcion: "Abono a cuenta por cobrar",
        id_usuario: p.id_usuario ?? null,
        id_cierre_caja: p.id_cierre_caja ?? null,
      }),
    ),
  );

  return nuevoSaldo;
}
