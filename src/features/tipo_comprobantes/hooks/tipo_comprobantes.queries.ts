import { useQuery } from "@tanstack/react-query";
import { Sucursales, TiposComprobantes } from "@/shared/types/db/tablas";
import { useEffect } from "react";
import { mostrarTipoComprobantePorSucursal } from "../api/tipo_comprobantes.api";
import { useTipoComprobanteStore } from "../store/tipo_comprobantes.store";

export const useMostrarTipoComprobantesPorSucursalQuery = (
 
) => {
  const { itemSelect, setItemSelect } = useTipoComprobanteStore();

  const query = useQuery<TiposComprobantes[]>({
    queryKey: ["mostrar tipo comprobantes"],
    queryFn: () => mostrarTipoComprobantePorSucursal(),
  });
  useEffect(() => {
    if (!itemSelect && query.data?.length) {
      setItemSelect(query.data[0]);
    }
  }, [itemSelect, query.data, setItemSelect]);
  return query;
};
