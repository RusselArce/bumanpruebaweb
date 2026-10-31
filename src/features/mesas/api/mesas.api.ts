import { supabase } from "@/shared/utils/supabase";
import { Mesas, Salones, Sucursales } from "@/shared/types/db/tablas";
const tabla = "mesas";
export const mostrarMesasPorSalon = async (id_salon: Salones["id"]) => {
  const { data, error } = await supabase
    .from(tabla)
    .select()
    .eq("id_salon", id_salon);
  if (error) throw new Error(error.message);
  return data;
};

// Mesa fija reutilizada por todos los pedidos "para llevar" (la crea el
// trigger de alta de empresa como 'para_llevar' dentro del salón "Principal").
export const buscarMesaParaLlevarPorSucursal = async (
  id_sucursal: Sucursales["id"],
) => {
  const { data, error } = await supabase
    .from(tabla)
    .select("*, salones!inner(id_sucursal)")
    .eq("nombre", "para_llevar")
    .eq("salones.id_sucursal", id_sucursal)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Mesas | null;
};
export type MesasInsert = Omit<Partial<Mesas>, "id">;
// export async function insertarMesas(p: MesasInsert[]) {
//   const { error } = await supabase.from(tabla).insert(p);
//   if (error) {
//     throw new Error(error.message);
//   }
// }
export type MesaUpdatePayload = Pick<Mesas, "id" | "nombre" | "posicion">;

export async function actualizarMesa(p: MesaUpdatePayload) {
  const { error } = await supabase
    .from(tabla)
    .update({ nombre: p.nombre, posicion: p.posicion })
    .eq("id", p.id);

  if (error) throw new Error(error.message);
}

export async function insertarMesasBatch(payload: MesasInsert[]) {
  const { data, error } = await supabase
    .from(tabla)
    .insert(payload)
    .select("id, nombre, posicion, id_salon");

  if (error) throw new Error(error.message);
  return data; // ✅ para reemplazar temp-ids en el state
}

export async function eliminarMesa(id: Mesas["id"]) {
  const { error } = await supabase.from(tabla).delete().eq("id", id);

  if (error) throw new Error(error.message);
}
export async function cambiarEstadoMesa(p: Pick<Mesas, "id" | "estado">) {
  const { error } = await supabase
    .from(tabla)
    .update({ estado: p.estado })
    .eq("id", p.id);

  if (error) {
    throw new Error(error.message);
  }
}
