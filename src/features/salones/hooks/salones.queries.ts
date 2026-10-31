import { useQuery } from "@tanstack/react-query";
import { mostrarSalonesPorSucursal } from "../api/salones.api";
import { Salones,Sucursales } from "@/shared/types/db/tablas";
import { useEffect } from "react";
import { useSalonesStore } from "../store/salones.store";
import { useEmpresaStore } from "@/features/empresa/store/empresa.store";
import { useAsignacionesSucursalesStore } from "@/features/asignacion_sucursal/store/asignacion_sucursal";

export const useMostrarSalonesPorSucursalQuery = () => {
  const { itemSelect, setItemSelect } = useSalonesStore();
  const {itemSelect:itemSelectAsignacionSucursal} = useAsignacionesSucursalesStore()
  const idSucursal = itemSelectAsignacionSucursal?.id_sucursal;
  const query = useQuery<Salones[]>({
    queryKey: ["mostrar salones", idSucursal],
    queryFn: () => mostrarSalonesPorSucursal(idSucursal as number),
    enabled: !!idSucursal,
  });
  useEffect(() => {
    if (!itemSelect && query.data?.length) {
      setItemSelect(query.data[0]);
    }
  }, [itemSelect, query.data, setItemSelect]);
  return query;
};
