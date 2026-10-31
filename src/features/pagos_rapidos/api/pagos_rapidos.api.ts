// src/features/pagos_rapidos/api/pagos_rapidos.api.ts
import { PagosRapidos } from "@/shared/types/db/tablas";
import { supabase } from "@/shared/utils/supabase";

const tabla = "pagos_rapidos";

const MENSAJE_MONTO_DUPLICADO =
  "Ya existe un pago rápido con ese monto para esta empresa.";

// Postgres 23505 = unique_violation. La tabla tiene un UNIQUE(id_empresa, monto).
const lanzarErrorLegible = (error: { code?: string; message: string }): never => {
  if (error.code === "23505") throw new Error(MENSAJE_MONTO_DUPLICADO);
  throw new Error(error.message);
};

export const mostrarPagosRapidos = async (id_empresa: PagosRapidos["id_empresa"]) => {
  const { data, error } = await supabase
    .from(tabla)
    .select("*")
    .eq("id_empresa", id_empresa)
    .order("orden", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
};

export type InsertarPagosRapidosPayload = Omit<Partial<PagosRapidos>, "id">;

export const insertarPagoRapido = async (p: InsertarPagosRapidosPayload) => {
  const { data, error } = await supabase.from(tabla).insert(p);
  if (error) lanzarErrorLegible(error);
  return data;
};

export type EditarPagosRapidosPayload = Pick<
  PagosRapidos,
  "id" | "monto" | "es_exacto" | "orden"
>;

export const editarPagoRapido = async (p: EditarPagosRapidosPayload) => {
  const { data, error } = await supabase.from(tabla).update(p).eq("id", p.id);
  if (error) lanzarErrorLegible(error);
  return data;
};

export const eliminarPagoRapido = async (id: PagosRapidos["id"]) => {
  const { error } = await supabase.from(tabla).delete().eq("id", id);
  if (error) throw new Error(error.message);
  return true;
};
