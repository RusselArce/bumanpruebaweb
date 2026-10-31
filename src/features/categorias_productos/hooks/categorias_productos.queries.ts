import { useQuery } from "@tanstack/react-query";

import { Categorias } from "@/shared/types/db/tablas";
import {
  buscarCategorias,
  mostrarCategoriasProductos,
} from "../api/categorias_productos.api";
import { useCategoriasProductosStore } from "../store/categorias_productos.store";
import { useEffect } from "react";
import { useEmpresaStore } from "@/features/empresa/store/empresa.store";

export const useMostrarCategoriasProductosQuery = () => {
  const { itemSelect, setItemSelect } = useCategoriasProductosStore();

  const itemSelectEmpresas = useEmpresaStore((s) => s.itemSelect);

  const idEmpresa = itemSelectEmpresas?.id;
  const query = useQuery<Categorias[]>({
    queryKey: ["mostrar categorias por empresa", idEmpresa],
    queryFn: () => mostrarCategoriasProductos(idEmpresa as number),
    enabled: !!idEmpresa,
  });
  useEffect(() => {
    if (!itemSelect && query.data?.length) {
      setItemSelect(query.data[0]);
    }
  }, [query.data, itemSelect, setItemSelect]);
  return query;
};
export const useBuscarCategoriasProductosQuery = (texto: string) => {
  const itemSelectEmpresa = useEmpresaStore((s) => s.itemSelect);
  const idEmpresa = itemSelectEmpresa?.id;

  const q = texto.trim();

  return useQuery({
    queryKey: ["buscar categorias por empresa", idEmpresa, q],
    queryFn: () => buscarCategorias(idEmpresa as number, q),
    enabled: !!idEmpresa && q.length > 0, // ✅ solo busca si hay texto
    staleTime: 10_000,
  });
};

