import { supabase } from "@/shared/utils/supabase";
const tabla = "tipo_comprobantes";
export const mostrarTipoComprobantePorSucursal = async (
  
) => {
  const { data, error } = await supabase
    .from(tabla)
    .select()
    .eq("destino", "ventas");
  if (error) throw new Error(error.message);
  return data;
};
