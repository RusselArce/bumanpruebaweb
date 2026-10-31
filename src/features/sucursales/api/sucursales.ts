import { ID, Sucursales } from "@/shared/types/db/tablas";
import { supabase } from "@/shared/utils/supabase";
const tabla = "sucursales";
export async function mostrarSucursalPorIdUsuario(id_sucursal: ID) {
  const { data, error } = await supabase
    .from(tabla)
    .select()
    .eq("id", id_sucursal)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data;
}

export async function mostrarSucursalesPorEmpresa(id_empresa: ID) {
  const { data, error } = await supabase
    .from(tabla)
    .select()
    .eq("id_empresa", id_empresa)
    .eq("delete", false)
    .order("id", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Sucursales[];
}
