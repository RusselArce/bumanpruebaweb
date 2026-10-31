import { supabase } from "@/shared/utils/supabase";
import {
  DetallesVentas,
  DetalleVentaRow,
  DetalleVentasRpc,
} from "@/shared/types/db/tablas";
import { cambiarEstadoMesa } from "@/features/mesas/api/mesas.api";

const tabla = "detalle_venta";
export type mostrarDetalleVentaPayload = Pick<DetallesVentas, "id_venta">;
export async function insertarDetalleVentas(p: DetalleVentasRpc) {
  // ✅ Insert directo (NO usa el RPC "insertardetalleventa") para que cada click
  // en un producto cree su propia fila, incluso si es el mismo producto repetido.
  // El RPC agrupaba por id_producto y sumaba la cantidad, lo que impedía poner
  // una nota independiente por unidad.
  const extraModificadores = (p._modificadores ?? []).reduce(
    (acc, m) => acc + Number(m.precio_extra || 0),
    0,
  );

  const { error, data } = await supabase
    .from(tabla)
    .insert({
      id_venta: p._id_venta,
      cantidad: p._cantidad,
      precio_venta: p._precio_venta,
      total: p._cantidad * (p._precio_venta + extraModificadores),
      descripcion: p._descripcion,
      id_producto: p._id_producto,
      precio_compra: p._precio_compra,
      id_sucursal: p._id_sucursal,
      id_almacen: p._id_almacen,
      estado: "nueva",
      modificadores: p._modificadores?.length ? p._modificadores : null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export type enviarDetallesVentaACocinaPayload = Pick<
  DetallesVentas,
  "id_venta"
>;
//export type mostrarDetalleVentaPayload = Pick<DetallesVentas, "id_venta">;
export async function mostrarDetalleVenta(p: Pick<DetallesVentas, "id_venta">) {
  const { data, error } = await supabase
    .from(tabla)
    .select(`*, ventas(*),productos(*)`)
    .eq("id_venta", p.id_venta);
  if (error) {
    throw new Error(error.message);
  }
  return data;
}
export async function enviarDetallesVentaAcocina(
  p: Pick<DetallesVentas, "id_venta">,
) {
  const { error } = await supabase
    .from(tabla)
    .update({ estado: "en_cocina" })
    .eq("id_venta", p.id_venta)
    .eq("estado", "nueva");

  if (error) {
    throw new Error(error.message);
  }
}

export async function eliminarDetalleVenta(p: Pick<DetallesVentas, "id">) {
  const { error } = await supabase.rpc("eliminar_detalle_y_liberar_mesa", {
    p_detalle_id: p.id,
  });

  if (error) throw new Error(error.message);
}

// ✅ "Vaciar carrito": borra solo lo que aún NO se mandó a cocina (estado
// "nueva"). Lo ya enviado no se toca: no se puede "des-cocinar" un plato.
export async function vaciarDetalleVentaNueva(p: Pick<DetallesVentas, "id_venta">) {
  const { error } = await supabase
    .from(tabla)
    .delete()
    .eq("id_venta", p.id_venta)
    .eq("estado", "nueva");

  if (error) throw new Error(error.message);
}
export async function editarEstadoDetallesVenta(
  p: Pick<DetallesVentas, "id" | "estado">,
) {
  const { error } = await supabase
    .from(tabla)
    .update({ estado: p.estado })
    .eq("id", p.id);

  if (error) {
    throw new Error(error.message);
  }
}
export async function editarNotaDetalleVenta(
  p: Pick<DetallesVentas, "id" | "nota">,
) {
  const { error } = await supabase
    .from(tabla)
    .update({ nota: p.nota })
    .eq("id", p.id);

  if (error) {
    throw new Error(error.message);
  }
}
export async function editarPrioridadDetalleVenta(
  p: Pick<DetallesVentas, "id" | "prioridad">,
) {
  const { error } = await supabase
    .from(tabla)
    .update({ prioridad: p.prioridad })
    .eq("id", p.id);

  if (error) {
    throw new Error(error.message);
  }
}
export type estadoDetalleVentaPayload = Pick<DetallesVentas, "estado">;
export const mostrarDetalleventasPorEstado = async (
  p: estadoDetalleVentaPayload,
) => {
  const { data, error } = await supabase
    .from(tabla)
    .select(`*,ventas(*,mesas(*))`)
    .in("estado", ["en_cocina", "en_proceso", "en_despacho"]);
  if (error) {
    throw new Error(error.message);
  }
  return data;
};

