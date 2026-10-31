// src/shared/api/metodos_pago.api.ts
import { MetodosPagos } from "@/shared/types/db/tablas";
import { supabase } from "@/shared/utils/supabase";

const tabla = "metodos_pago";

export async function insertarMetodoPago(p: Omit<Partial<MetodosPagos>, "id">) {
  const { error, data } = await supabase.from(tabla).insert(p);
  if (error) throw new Error(error.message);
  return data;
}

export const mostrarMetodosPago = async (id_empresa: MetodosPagos["id_empresa"]) => {
  const { data, error } = await supabase
    .from(tabla)
    .select("*")
    .eq("id_empresa", id_empresa)
    .order("id", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

export type InsertarMetodosPagoPayload = Omit<Partial<MetodosPagos>, "id">;

export const insertarMetodosPago = async (p: InsertarMetodosPagoPayload) => {
  const { data, error } = await supabase.from(tabla).insert(p);
  if (error) throw new Error(error.message);
  return data;
};

export type EditarMetodosPagoPayload = Pick<MetodosPagos, "id" | "nombre" | "delete_update">;

export const editarMetodosPago = async (p: EditarMetodosPagoPayload) => {
  const { data, error } = await supabase.from(tabla).update(p).eq("id", p.id);
  if (error) throw new Error(error.message);
  return data;
};

export const eliminarMetodoPago = async (id: MetodosPagos["id"]) => {
  const { error } = await supabase.from(tabla).delete().eq("id", id);
  if (error) throw new Error(error.message);
  return true;
};