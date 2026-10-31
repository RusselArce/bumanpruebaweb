import { useQuery } from "@tanstack/react-query";
import { PagosRapidos } from "@/shared/types/db/tablas";
import { mostrarPagosRapidos } from "../api/pagos_rapidos.api";
import { useEmpresaStore } from "@/features/empresa/store/empresa.store";

export const useMostrarPagosRapidosPorEmpresaQuery = () => {
  const itemSelectEmpresa = useEmpresaStore((s) => s.itemSelect);

  return useQuery<PagosRapidos[]>({
    queryKey: ["mostrar pagos rapidos", itemSelectEmpresa?.id],
    queryFn: () => mostrarPagosRapidos(itemSelectEmpresa?.id as number),
    enabled: !!itemSelectEmpresa?.id,
  });
};
