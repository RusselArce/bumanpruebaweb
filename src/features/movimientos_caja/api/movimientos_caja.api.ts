import { supabase } from "@/shared/utils/supabase";
import { MovimientosCajas } from "@/shared/types/db/tablas";

const tabla = "movimientos_caja";

export const mostrarVentasMovimientosCaja = async (
  id_cierre_caja: MovimientosCajas["id_cierre_caja"]
) => {
 
  const { data, error } = await supabase
    .rpc("ventas_por_metodo_por_cierre", {
      p_id_cierre_caja: id_cierre_caja,
    });

  if (error) throw new Error(error.message);

  return data;
};

export const mostrarMovimientosCajaPorTipo = async (
  id_cierre_caja: MovimientosCajas["id_cierre_caja"],
  tipo_movimiento: string
) => {
  const { data, error } = await supabase
    .from(tabla)
    .select("*")
    .eq("id_cierre_caja", id_cierre_caja)
    .eq("tipo_movimiento", tipo_movimiento)
    .order("fecha_movimiento", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

export const insertarMovimientoCaja = async (
  p: Omit<Partial<MovimientosCajas>, "id">
) => {
  const { data, error } = await supabase
    .from(tabla)
    .insert(p)
    .select();

  if (error) throw new Error(error.message);
  return data;
};

export const editarMovimientoCaja = async (
  p: Pick<
    MovimientosCajas,
    "id" | "descripcion" | "monto" | "id_metodo_pago" | "tipo_movimiento"
  >
) => {
  const { data, error } = await supabase
    .from(tabla)
    .update(p)
    .eq("id", p.id)
    .select();

  if (error) throw new Error(error.message);
  return data;
};

export const eliminarMovimientoCaja = async (
  id: MovimientosCajas["id"]
) => {
  const { error } = await supabase
    .from(tabla)
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  return true;
};