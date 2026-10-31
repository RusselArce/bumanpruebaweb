import { supabase } from "@/shared/utils/supabase";
import { Categorias } from "@/shared/types/db/tablas";

const tabla = "categorias";
export const mostrarCategoriasProductos = async (
  id_empresa: Categorias["id_empresa"],
) => {
  const { data, error } = await supabase
    .from(tabla)
    .select()
    .eq("id_empresa", id_empresa).order("id",{ascending:false});
  if (error) throw new Error(error.message);
  return data;
};

export const insertarCategorias = async (
  p: Omit<Partial<Categorias>, "id">,
) => {
  const { data, error } = await supabase.from(tabla).insert(p);
  if (error) throw new Error(error.message);
  return data;
};

export const editarCategorias = async (
  p: Pick<Categorias, "id" | "nombre"|"color">,
) => {
  const { data, error } = await supabase.from(tabla).update(p).eq("id", p.id);
  if (error) throw new Error(error.message);
  return data;
};

export const eliminarCategoria = async (id: Categorias["id"]) => {
  const { error } = await supabase.from(tabla).delete().eq("id", id);
  if (error) throw new Error(error.message);
  return true;
};
export const buscarCategorias = async (
  id_empresa: Categorias["id_empresa"],
  texto: string,
) => {
  const q = texto.trim();

  // si viene vacío, retorna todas (UX típica)
  if (!q) return mostrarCategoriasProductos(id_empresa);

  const { data, error } = await supabase
    .from(tabla)
    .select("*")
    .eq("id_empresa", id_empresa)
    .ilike("nombre", `%${q}%`)
    .order("id", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
};