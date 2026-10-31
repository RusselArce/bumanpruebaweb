import { supabase } from "@/shared/utils/supabase";
import  { Salones, Sucursales } from "@/shared/types/db/tablas";
const tabla = "salones";
export const mostrarSalonesPorSucursal = async (
  id_sucursal: Sucursales["id"]
) => {
  const { data, error } = await supabase
    .from(tabla)
    .select()
    .eq("id_sucursal", id_sucursal);
  if (error) throw new Error(error.message);
  return data;
};


export type InsertarSalonesPayload = Omit<Partial<Salones>, "id">;

export const insertarSalones = async (p: InsertarSalonesPayload) => {
  const { data, error } = await supabase.from(tabla).insert(p);
  if (error) throw new Error(error.message);
  return data;
};

export const insertarSalonConId = async (p: InsertarSalonesPayload) => {
  const { data, error } = await supabase
    .from(tabla)
    .insert(p)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Salones;
};

export type EditarSalonesPayload = Pick<Salones, "id" | "nombre">;

export const editarSalones = async (p: EditarSalonesPayload) => {
  const { data, error } = await supabase
    .from(tabla)
    .update({ nombre: p.nombre })
    .eq("id", p.id);

  if (error) throw new Error(error.message);
  return data;
};

export const eliminarSalon = async (id: Salones["id"]) => {
  const { error } = await supabase.from(tabla).delete().eq("id", id);
  if (error) throw new Error(error.message);
  return true;
};