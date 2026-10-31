import { supabase } from "@/shared/utils/supabase";
import { Modificadores, ProductoModificadorRow, Productos } from "@/shared/types/db/tablas";

const tabla = "modificadores";
const tablaProductoModificadores = "producto_modificadores";

export const mostrarModificadores = async (
  id_empresa: Modificadores["id_empresa"],
) => {
  const { data, error } = await supabase
    .from(tabla)
    .select("*")
    .eq("id_empresa", id_empresa)
    .order("id", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

export type InsertarModificadorPayload = Omit<Partial<Modificadores>, "id">;

export const insertarModificador = async (p: InsertarModificadorPayload) => {
  const { data, error } = await supabase.from(tabla).insert(p);
  if (error) throw new Error(error.message);
  return data;
};

export type EditarModificadorPayload = Pick<Modificadores, "id" | "nombre" | "precio_extra">;

export const editarModificador = async (p: EditarModificadorPayload) => {
  const { data, error } = await supabase.from(tabla).update(p).eq("id", p.id);
  if (error) throw new Error(error.message);
  return data;
};

export const eliminarModificador = async (id: Modificadores["id"]) => {
  const { error } = await supabase.from(tabla).delete().eq("id", id);
  if (error) throw new Error(error.message);
  return true;
};

/* =========================
   RELACIÓN CON PRODUCTOS
========================= */

export const mostrarModificadoresPorProducto = async (
  id_producto: Productos["id"],
) => {
  const { data, error } = await supabase
    .from(tablaProductoModificadores)
    .select("id, id_producto, id_modificador, modificadores(*)")
    .eq("id_producto", id_producto);

  if (error) throw new Error(error.message);
  return data as unknown as ProductoModificadorRow[];
};

// Reemplaza todos los modificadores asignados a un producto por la lista
// nueva (borrar + insertar es más simple que hacer un diff, y aquí nunca
// son más de un puñado de filas por producto).
export const sincronizarModificadoresProducto = async (
  id_producto: Productos["id"],
  idsModificadores: number[],
) => {
  const { error: errorDelete } = await supabase
    .from(tablaProductoModificadores)
    .delete()
    .eq("id_producto", id_producto);

  if (errorDelete) throw new Error(errorDelete.message);

  if (idsModificadores.length === 0) return;

  const { error: errorInsert } = await supabase
    .from(tablaProductoModificadores)
    .insert(idsModificadores.map((id_modificador) => ({ id_producto, id_modificador })));

  if (errorInsert) throw new Error(errorInsert.message);
};
