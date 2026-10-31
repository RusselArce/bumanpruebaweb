import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Categorias } from "@/shared/types/db/tablas";
import { useEmpresaStore } from "@/features/empresa/store/empresa.store";

import {
  insertarCategorias,
  editarCategorias,
  eliminarCategoria,
  buscarCategorias,
  mostrarCategoriasProductos,
} from "../api/categorias_productos.api";

/** helpers */
function friendlyDeleteError(message: string) {
  if (message.toLowerCase().includes("foreign key")) {
    return "No se puede eliminar la categoría: tiene productos asociados.";
  }
  return message;
}

/** INSERTAR */
type InsertarCategoriaArgs = {
  // lo que mandas desde el form (sin id). id_empresa lo forzamos desde store.
  payload: Omit<Partial<Categorias>, "id" | "id_empresa">;
};

export const useInsertarCategoriaMutation = () => {
  const qc = useQueryClient();
  const itemSelectEmpresa = useEmpresaStore((s) => s.itemSelect);


  return useMutation({
    mutationKey: ["insertar categoria"],
    mutationFn: async ({ payload }: InsertarCategoriaArgs) => {
      const id_empresa = itemSelectEmpresa?.id;
      if (!id_empresa) throw new Error("No hay empresa seleccionada");
      const p: Omit<Partial<Categorias>, "id"> = {
        ...payload,
        id_empresa,
      };

      // tip: puedes normalizar aquí defaults si quieres
      if (!p.icono) p.icono = "-";
      if (!p.color) p.color = "#9CA3AF";

      return await insertarCategorias(p);
    },
    onSuccess: () => {
      toast.success("Categoría creada");
      qc.invalidateQueries({
        queryKey: ["mostrar categorias por empresa"],
      });
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Error al crear categoría");
    },
  });
};

/** EDITAR (1 campo: nombre) */
type EditarCategoriaArgs = Pick<Categorias, "id" | "nombre"|"color"> & {
  id_empresa: Categorias["id_empresa"];
};

export const useEditarCategoriaMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["editar categoria"],
    mutationFn: async (p: EditarCategoriaArgs) => {
      return await editarCategorias(p);
    },
    onSuccess: (_data) => {
      toast.success("Categoría actualizada");
      qc.invalidateQueries({
        queryKey: ["mostrar categorias por empresa"],
      });
    },
    onError: (e: any) => {
      qc.invalidateQueries({
        queryKey: ["mostrar categorias por empresa"],
      });
      toast.error(e?.message ?? "Error al editar categoría");
    },
  });
};

/** ELIMINAR */
type EliminarCategoriaArgs = {
  id: Categorias["id"];
  id_empresa: Categorias["id_empresa"];
};

export const useEliminarCategoriaMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["eliminar categoria"],
    mutationFn: async ({ id }: EliminarCategoriaArgs) => {
      await eliminarCategoria(id);
    },
    onSuccess: () => {
      toast.success("Categoría eliminada");
      qc.invalidateQueries({
        queryKey: ["mostrar categorias por empresa"],
      });
      qc.invalidateQueries({
        queryKey: ["buscar categorias por empresa"],
      });
    },
    onError: (e: any) => {
      qc.invalidateQueries({
        queryKey: ["mostrar categorias por empresa"],
      });
      qc.invalidateQueries({
        queryKey: ["buscar categorias por empresa"],
      });
      toast.error(friendlyDeleteError(e?.message ?? "Error al eliminar categoría"));
    },
  });
};

/** BUSCAR (lo dejé como MUTATION porque tú lo estás trabajando así) */
type BuscarCategoriasArgs = {
  q: string;
  id_empresa: Categorias["id_empresa"];
};

export const useBuscarCategoriasMutation = () => {
  return useMutation({
    mutationKey: ["buscar categorias"],
    mutationFn: async ({ q, id_empresa }: BuscarCategoriasArgs) => {
      const texto = q.trim();

      // UX típica: si está vacío -> vuelve a listar todo
      if (!texto) return await mostrarCategoriasProductos(id_empresa);

      return await buscarCategorias(id_empresa, texto);
    },
    onError: (e: any) => toast.error(e?.message ?? "Error al buscar"),
  });
};

/** TIP OPCIONAL: versión buscar que no pida id_empresa, lo saca del store */
export const useBuscarCategoriasConEmpresaMutation = () => {
  const itemSelectEmpresa = useEmpresaStore((s) => s.itemSelect);

  return useMutation({
    mutationKey: ["buscar categorias con empresa"],
    mutationFn: async ({ q }: { q: string }) => {
      const id_empresa = itemSelectEmpresa?.id;
      if (!id_empresa) throw new Error("No hay empresa seleccionada");

      const texto = q.trim();
      if (!texto) return await mostrarCategoriasProductos(id_empresa);

      return await buscarCategorias(id_empresa, texto);
    },
    onError: (e: any) => toast.error(e?.message ?? "Error al buscar"),
  });
};
