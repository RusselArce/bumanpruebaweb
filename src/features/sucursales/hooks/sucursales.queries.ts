import { useQuery } from "@tanstack/react-query";
import { Empresas, Sucursales } from "@/shared/types/db/tablas";
import { mostrarSucursalesPorEmpresa } from "../api/sucursales";

export const useMostrarSucursalesPorEmpresaQuery = (id_empresa?: Empresas["id"] | null) => {
  return useQuery<Sucursales[]>({
    queryKey: ["mostrar sucursales por empresa", id_empresa],
    queryFn: () => mostrarSucursalesPorEmpresa(id_empresa as number),
    enabled: !!id_empresa,
    staleTime: 1000 * 60,
  });
};
