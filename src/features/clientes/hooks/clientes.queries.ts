import { useQuery } from "@tanstack/react-query";
import type { ClientesProveedores } from "@/shared/types/db/tablas";
import {
  buscarCliente,
  mostrarClientesProveedores,
} from "@/features/clientes/api/clientes.api"; // tu api
import { useClientesStore } from "../store/clientes.store";
import { useEmpresaStore } from "@/features/empresa/store/empresa.store";

export const useMostrarClientesQuery = () => {
  const itemSelectEmpresa = useEmpresaStore((s)=>s.itemSelect)
  const query = useQuery({
    queryKey: ["mostrar clientes", itemSelectEmpresa?.id],
    queryFn: () => mostrarClientesProveedores(itemSelectEmpresa?.id as number),
    enabled: !!itemSelectEmpresa?.id,
  });
  return query;
};

export const useBuscarClientesQuery = (search: string) => {
  const itemSelectEmpresa = useEmpresaStore((s) => s.itemSelect);
  const id_empresa = itemSelectEmpresa?.id ;
  const q = (search ?? "").trim();

  return useQuery<ClientesProveedores[]>({
    queryKey: ["buscar clientes", id_empresa, q],
    queryFn: () => buscarCliente(q, id_empresa as number),
    enabled: q.length >= 2 && !!id_empresa, // 👈 solo busca si hay texto
    staleTime: 1000 * 30,
  });
};
