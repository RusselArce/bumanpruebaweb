import { useQuery } from "@tanstack/react-query";
import { mostrarSalonesPorSucursal } from "@/features/salones/api/salones.api";
import { Empresas, MetodosPagos, Salones, Sucursales } from "@/shared/types/db/tablas";
import { useEffect } from "react";
import { useSalonesStore } from "@/features/salones/store/salones.store";
import { useMetodosPagoStore } from "../store/metodos_pago.store";
import { mostrarMetodosPago } from "../api/metodos_pago.api";
import { useEmpresaStore } from "@/features/empresa/store/empresa.store";

export const useMostrarMetodosPagoPorEmpresaQuery = () => {
  const { itemSelect, setItemSelect } = useMetodosPagoStore();
  const itemSelectEmpresa = useEmpresaStore((s)=>s.itemSelect)

  const query = useQuery<MetodosPagos[]>({
    queryKey: ["mostrar metodos pago", itemSelectEmpresa?.id],
    queryFn: () => mostrarMetodosPago(itemSelectEmpresa?.id as number),
    enabled: !!itemSelectEmpresa?.id,
  });
  useEffect(() => {
    if (!itemSelect && query.data?.length) {
      setItemSelect(query.data[0]);
    }
  }, [itemSelect, query.data, setItemSelect]);
  return query;
};
