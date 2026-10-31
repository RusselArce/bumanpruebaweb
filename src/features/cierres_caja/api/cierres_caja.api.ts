import { supabase } from "@/shared/utils/supabase";
import { CierresCajas } from "@/shared/types/db/tablas";

const tabla = "cierrecaja";

/**
 * Mostrar cierres por caja
 */
export const mostrarCierreAbiertoPorCaja = async (id_caja: number) => {
  const { data, error } = await supabase
    .from(tabla)
    .select("*")
    .eq("id_caja", id_caja)
    .eq("estado", 0)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
};
export const mostrarVentasEfectivoPorCierreCaja = async (
  id_cierre_caja: number,
) => {
  const { data, error } = await supabase.rpc(
    "total_ventas_efectivo_por_cierre",
    { p_id_cierre_caja: id_cierre_caja },
  );

  if (error) throw new Error(error.message);

  return data;
};

/**
 * Insertar cierre de caja
 */
export const insertarCierreCaja = async (
  p: Omit<Partial<CierresCajas>, "id">,
) => {
  const { data, error } = await supabase
    .from(tabla)
    .insert(p)
    .select()
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data;
};

/**
 * Editar cierre (por ejemplo actualizar totales o estado)
 */
export const editarCierreCaja = async (
  p: Pick<
    CierresCajas,
    | "id"
    | "total_efectivo_calculado"
    | "total_efectivo_real"
    | "diferencia_efectivo"
    | "estado"
    | "fechacierre"
  >,
) => {
  const { data, error } = await supabase
    .from(tabla)
    .update(p)
    .eq("id", p.id)
    .select()
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data;
};

/**
 * Eliminar cierre (poco común pero útil para admin)
 */
export const eliminarCierreCaja = async (id: CierresCajas["id"]) => {
  const { error } = await supabase.from(tabla).delete().eq("id", id);

  if (error) throw new Error(error.message);

  return true;
};

/**
 * Buscar cierres por usuario o caja
 */
export const buscarCierresCaja = async (texto: string) => {
  const q = texto.trim();

  if (!q) {
    const { data, error } = await supabase
      .from(tabla)
      .select("*")
      .order("id", { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }

  const { data, error } = await supabase
    .from(tabla)
    .select("*")
    .ilike("id_usuario::text", `%${q}%`)
    .order("id", { ascending: false });

  if (error) throw new Error(error.message);

  return data;
};
