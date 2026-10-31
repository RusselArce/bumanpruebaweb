import { supabase } from "@/shared/utils/supabase";
import { Ventas } from "@/shared/types/db/tablas";
import { enviarDetallesVentaAcocina } from "@/features/detalle_ventas/api/detalle_ventas.api";
import { cambiarEstadoMesa } from "@/features/mesas/api/mesas.api";
const tabla = "ventas";

export type VentasInsert = Omit<Partial<Ventas>, "id">;

export async function insertarVentas(p: VentasInsert) {
  const { error, data } = await supabase
    .from(tabla)
    .insert(p)
    .select()
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}
// ✅ payload mínimo (estándar)
// export type EliminarVentasIncompletasPayload = Pick<
//   Ventas,
//   "id_usuario" | "id_cierre_caja"
// >;
export type EliminarVentasIncompletasPayload = Pick<
  Ventas,
  "id_usuario" | "id_cierre_caja" | "id"
>;
export async function eliminarVentasIncompletas(
  p: EliminarVentasIncompletasPayload,
) {
  const { error } = await supabase
    .from(tabla)
    .delete()

    .eq("estado", "pendiente")
    .eq("id", p.id)
    .eq("id_usuario", p.id_usuario)
    .eq("id_cierre_caja", p.id_cierre_caja);
  if (error) {
    throw new Error(error.message);
  }
}
export type EnviarVentaACocinaPayload = Pick<Ventas, "id" | "id_mesa"> & {
  nombre_ref?: string | null;
};

export async function enviarVentaAcocina(p: EnviarVentaACocinaPayload) {
  const updatePayload: { estado: string; nombre_ref?: string | null } = {
    estado: "en_cocina",
  };
  if (p.nombre_ref !== undefined) {
    updatePayload.nombre_ref = p.nombre_ref;
  }

  const { error } = await supabase
    .from(tabla)
    .update(updatePayload)
    .eq("id", p.id)


  if (error) {
    throw new Error(error.message);
  }
  await enviarDetallesVentaAcocina({ id_venta: p.id });
  await cambiarEstadoMesa({ id: p.id_mesa, estado: "ocupada" });
}

// evita que dos pedidos "para llevar" activos en cocina compartan la misma
// referencia (ej. dos pedidos a nombre de "Juan" al mismo tiempo).
// ⚠️ Se valida contra detalle_venta (lo mismo que pinta el tablero de
// /cocina), no contra ventas.estado: ese campo se queda en "en_cocina" hasta
// que se cobra, aunque todos los productos ya estén "listo" y hayan salido
// del tablero, lo que bloqueaba el nombre para siempre con una venta vieja.
export async function existeNombreRefEnCocina(p: {
  id_mesa: number;
  nombre_ref: string;
}) {
  const { data, error } = await supabase
    .from("detalle_venta")
    .select("id, ventas!inner(id_mesa, nombre_ref)")
    .eq("ventas.id_mesa", p.id_mesa)
    .ilike("ventas.nombre_ref", p.nombre_ref.trim())
    .in("estado", ["en_cocina", "en_proceso", "en_despacho"])
    .limit(1);

  if (error) throw new Error(error.message);
  return (data?.length ?? 0) > 0;
}
export async function finalizarVenta(
  p: Pick<
    Ventas,
    | "id"
    | "id_mesa"
    | "monto_total"
    | "sub_total"
    | "total_impuestos"
    | "valor_impuesto"
    | "propina"
    | "id_cliente"
    | "saldo"
  > & {
    // false cuando se cobra solo una parte de una cuenta dividida: la venta
    // original sigue abierta en la misma mesa, así que todavía no toca liberarla.
    liberarMesa?: boolean;
  }
) {
  const { error } = await supabase
    .from(tabla)
    .update({
      estado: "confirmada",
      fecha: new Date(),
      monto_total: p.monto_total,
      sub_total: p.sub_total,
      total_impuestos: p.total_impuestos,
      valor_impuesto: p.valor_impuesto,
      propina: p.propina ?? 0,
      id_cliente: p.id_cliente ?? null,
      saldo: p.saldo ?? 0,
    })
    .eq("id", p.id);

  if (error) throw new Error(error.message);

  if (p.liberarMesa === false) return;

  await cambiarEstadoMesa({
    id: p.id_mesa,
    estado: "libre",
  });
}
export type VentaActivaResumen = Pick<Ventas, "id" | "id_mesa">;

// ✅ todas las ventas sin cobrar (cualquier estado != confirmada) de la
// sucursal, para contar cuántas están en mesas físicas vs. para llevar
export async function mostrarVentasActivasPorSucursal(id_sucursal: number) {
  const { data, error } = await supabase
    .from(tabla)
    .select("id, id_mesa")
    .eq("id_sucursal", id_sucursal)
    .neq("estado", "confirmada");
  if (error) throw new Error(error.message);
  return data as VentaActivaResumen[];
}

// ✅ "Dividir cuenta": crea una venta nueva (misma mesa) y le pasa los items
// elegidos. La venta original se queda con el resto. Cada mitad se cobra
// por separado reutilizando el mismo flujo de cobro.
export type DividirVentaPayload = {
  venta: Omit<Partial<Ventas>, "id">;
  idsDetalle: number[];
};

export async function dividirVenta(p: DividirVentaPayload) {
  const { data: nuevaVenta, error: e1 } = await supabase
    .from(tabla)
    .insert(p.venta)
    .select()
    .single();

  if (e1) throw new Error(e1.message);
  if (!nuevaVenta) throw new Error("No se pudo crear la venta dividida");

  const { error: e2 } = await supabase
    .from("detalle_venta")
    .update({ id_venta: nuevaVenta.id })
    .in("id", p.idsDetalle);

  if (e2) throw new Error(e2.message);

  return nuevaVenta as Ventas;
}

export type MostrarVentaActivaPorMesaPayload = Pick<Ventas, "id_mesa">;

// ✅ Devuelve UNA venta activa (la más reciente) o null
export async function mostrarVentaActivaPorMesa(
  p: MostrarVentaActivaPorMesaPayload,
) {
  const { data, error } = await supabase
    .from(tabla)
    .select("*")
    .eq("id_mesa", p.id_mesa)
    .neq("estado","confirmada")
    .maybeSingle();
  // // ajusta estados a tu negocio:

  if (error) throw new Error(error.message);
  return data;
}
