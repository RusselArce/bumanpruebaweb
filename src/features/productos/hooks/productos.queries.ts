import { useQuery } from "@tanstack/react-query";
import { useEmpresaStore } from "@/features/empresa/store/empresa.store";
import { useCategoriasProductosStore } from "@/features/categorias_productos/store/categorias_productos.store";
import { Productos } from "@/shared/types/db/tablas";

import {
  mostrarProductosPorCategoria,
  buscarProductos,
} from "../api/productos.api";

/* =========================
   MOSTRAR PRODUCTOS
========================= */

export const useMostrarProductosPorCategoriaQuery = () => {
  const itemSelectEmpresa = useEmpresaStore((s) => s.itemSelect);
  const itemSelectCategoria = useCategoriasProductosStore((s) => s.itemSelect);

  const idEmpresa = itemSelectEmpresa?.id;
  const idCategoria = itemSelectCategoria?.id;

  return useQuery<Productos[]>({
    queryKey: [
      "mostrar productos por categoria",
      idEmpresa,
      idCategoria,
    ],
    queryFn: () =>
      mostrarProductosPorCategoria(
        idEmpresa as number,
        idCategoria as number,
      ),

    enabled: !!idEmpresa && !!idCategoria,
  });
};

/* =========================
   BUSCAR PRODUCTOS
========================= */

export const useBuscarProductosQuery = (texto: string) => {
  const itemSelectEmpresa = useEmpresaStore((s) => s.itemSelect);
  const itemSelectCategoria = useCategoriasProductosStore((s) => s.itemSelect);

  const idEmpresa = itemSelectEmpresa?.id;
  const idCategoria = itemSelectCategoria?.id;

  const q = texto.trim();

  return useQuery({
    queryKey: [
      "buscar productos",
      idEmpresa,
      idCategoria,
      q,
    ],
    queryFn: () =>
      buscarProductos(
        idEmpresa as number,
        idCategoria as number,
        q,
      ),

    enabled: !!idEmpresa && !!idCategoria && q.length > 0,
    staleTime: 10_000,
  });
};