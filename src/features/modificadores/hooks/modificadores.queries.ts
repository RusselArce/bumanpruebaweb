import { useQuery } from "@tanstack/react-query";
import { useEmpresaStore } from "@/features/empresa/store/empresa.store";
import { Modificadores, ProductoModificadorRow, Productos } from "@/shared/types/db/tablas";
import { mostrarModificadores, mostrarModificadoresPorProducto } from "../api/modificadores.api";

export const useMostrarModificadoresPorEmpresaQuery = () => {
  const itemSelectEmpresa = useEmpresaStore((s) => s.itemSelect);
  const id_empresa = itemSelectEmpresa?.id;

  return useQuery<Modificadores[]>({
    queryKey: ["mostrar modificadores", id_empresa],
    queryFn: () => mostrarModificadores(id_empresa as number),
    enabled: !!id_empresa,
  });
};

export const useMostrarModificadoresPorProductoQuery = (id_producto?: Productos["id"]) => {
  return useQuery<ProductoModificadorRow[]>({
    queryKey: ["mostrar modificadores por producto", id_producto],
    queryFn: () => mostrarModificadoresPorProducto(id_producto as number),
    enabled: !!id_producto,
  });
};
