import { ID, Cajas } from "@/shared/types/db/tablas";
import { supabase } from "@/shared/utils/supabase";

const tabla = "caja";

// La primera caja no borrada de la sucursal. Hoy cada sucursal solo tiene
// UNA caja (la que crea insertpordefecto al armar la empresa) — no hay
// todavía un módulo para crear cajas extra — así que "la primera" es "la
// única". Se usa para autoasignarla al invitar un usuario, igual que ya se
// autoasigna la sucursal cuando la empresa tiene una sola.
export async function mostrarPrimeraCajaPorSucursal(id_sucursal: ID) {
  const { data, error } = await supabase
    .from(tabla)
    .select("*")
    .eq("id_sucursal", id_sucursal)
    .eq("delete", false)
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as Cajas | null;
}
