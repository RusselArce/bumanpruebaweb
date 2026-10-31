import { ID } from "@/shared/types/db/tablas";
import { supabase } from "@/shared/utils/supabase";
const tabla = "asignacion_sucursal";

// ✅ TODAS las sucursales a las que esta identidad (id_auth) tiene acceso.
export async function mostrarAsignacionesPorAuth(id_auth: string) {
  const { data, error } = await supabase
    .from("asignacion_sucursal")
    .select(
      `
      *,
      usuarios!inner(id,id_auth,nombres),sucursales(*,empresa(*))
    `,
    )
    .eq("usuarios.id_auth", id_auth);

  if (error) throw new Error(error.message);

  return data ?? [];
}
export async function mostrarAsignacionPorIdUsuario(id_usuario: ID) {
  const { data, error } = await supabase
    .from(tabla)
    .select()
    .eq("id_usuario", id_usuario)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data; // null si no existe
}

export type InsertarAsignacionSucursalPayload = {
  id_sucursal: ID;
  id_usuario: ID;
  id_caja?: ID | null;
};

export async function insertarAsignacionSucursal(p: InsertarAsignacionSucursalPayload) {
  const { data, error } = await supabase
    .from(tabla)
    .insert(p)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
