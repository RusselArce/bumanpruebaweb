import { supabase } from "@/shared/utils/supabase";
import { Productos, Categorias } from "@/shared/types/db/tablas";

const tabla = "productos";

/* =========================
   MOSTRAR
========================= */

export const mostrarProductosPorCategoria = async (
  id_empresa: Productos["id_empresa"],
  id_categoria: Categorias["id"],
) => {
  const { data, error } = await supabase
    .from(tabla)
    .select("*, producto_modificadores(id_modificador, modificadores(*))")
    .eq("id_empresa", id_empresa)
    .eq("id_categoria", id_categoria)
    .order("id", { ascending: false });

  if (error) {
    // ✅ Fallback: si la tabla producto_modificadores todavía no existe en
    // esta base (falta correr supabase/migration_propina_modificadores.sql),
    // no rompemos el punto de venta: pedimos los productos sin modificadores.
    const { data: dataSinModificadores, error: errorFallback } = await supabase
      .from(tabla)
      .select("*")
      .eq("id_empresa", id_empresa)
      .eq("id_categoria", id_categoria)
      .order("id", { ascending: false });

    if (errorFallback) throw new Error(errorFallback.message);
    return dataSinModificadores;
  }
  return data;
};

/* =========================
   INSERTAR
========================= */

export const insertarProducto = async (
  p: Omit<Partial<Productos>, "id">,
) => {
  const { data, error } = await supabase
    .from(tabla)
    .insert(p)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

/* =========================
   EDITAR
========================= */

export const editarProducto = async (
  p: Partial<Productos> & { id: Productos["id"] },
) => {
  const { data, error } = await supabase
    .from(tabla)
    .update(p)
    .eq("id", p.id);

  if (error) throw new Error(error.message);
  return data;
};

/* =========================
   ELIMINAR
========================= */

export const eliminarProducto = async (
  id: Productos["id"],
) => {
  const { error } = await supabase
    .from(tabla)
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  return true;
};

/* =========================
   BUSCAR
========================= */

export const buscarProductos = async (
  id_empresa: Productos["id_empresa"],
  id_categoria: Categorias["id"],
  texto: string,
) => {
  const q = texto.trim();

  if (!q) return mostrarProductosPorCategoria(id_empresa, id_categoria);

  const { data, error } = await supabase
    .from(tabla)
    .select("*")
    .eq("id_empresa", id_empresa)
    .eq("id_categoria", id_categoria)
    .ilike("nombre", `%${q}%`)
    .order("id", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};