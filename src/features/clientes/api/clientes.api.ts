import { ClientesProveedores } from "@/shared/types/db/tablas";
import { supabase } from "@/shared/utils/supabase";
const tabla = "clientes_proveedores";
export async function insertarClientes(
  p: Omit<Partial<ClientesProveedores>, "id">,
) {
  const { error, data } = await supabase
    .from(tabla)
    .insert(p)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data as ClientesProveedores;
}

export const buscarCliente = async (
  search: string,
  id_empresa: ClientesProveedores["id_empresa"]
) => {
  const { data, error } = await supabase
    .from(tabla)
    .select("*")
    .eq("id_empresa", id_empresa) // 🔥 importante si es multiempresa
    .or(
      `nombres.ilike.%${search}%,identificador_nacional.ilike.%${search}%,identificador_fiscal.ilike.%${search}%`
    )
    .limit(10);

  if (error) throw new Error(error.message);

  return data;
};


//
export const mostrarClientesProveedores = async (
  id_empresa: ClientesProveedores["id_empresa"],
) => {
  const { data, error } = await supabase
    .from(tabla)
    .select()
    .eq("id_empresa", id_empresa).order("id",{ascending:false});
  if (error) throw new Error(error.message);
  return data;
};

export type InsertarClientesPayload = Omit<Partial<ClientesProveedores>, "id">
export const insertarClientesProveedores = async (
  p: InsertarClientesPayload,
) => {
  const { data, error } = await supabase.from(tabla).insert(p);
  if (error) throw new Error(error.message);
  return data;
};

export type EditarClientesPayload = Pick<ClientesProveedores, "id"| "direccion"|"telefono"|"email"|"identificador_nacional"|"nombres" |"identificador_fiscal" >
export const editarClientesProveedores = async (
  p: EditarClientesPayload,
) => {
  const { data, error } = await supabase.from(tabla).update(p).eq("id", p.id);
  if (error) throw new Error(error.message);
  return data;
};

export const eliminarClientes = async (id: ClientesProveedores["id"]) => {
  const { error } = await supabase.from(tabla).delete().eq("id", id);
  if (error) throw new Error(error.message);
  return true;
};
export const buscarClientesProveedores = async (
  id_empresa: ClientesProveedores["id_empresa"],
  texto: string,
) => {
  const q = texto.trim();

  // si viene vacío, retorna todas (UX típica)
  if (!q) return mostrarClientesProveedores(id_empresa);

  const { data, error } = await supabase
    .from(tabla)
    .select("*")
    .eq("id_empresa", id_empresa)
    .ilike("nombre", `%${q}%`)
    .order("id", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
};