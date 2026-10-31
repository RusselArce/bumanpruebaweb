import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Categorias, Productos } from "@/shared/types/db/tablas";
import { useEmpresaStore } from "@/features/empresa/store/empresa.store";
import { useCategoriasProductosStore } from "@/features/categorias_productos/store/categorias_productos.store";

import {
  insertarProducto,
  editarProducto,
  eliminarProducto,
  buscarProductos,
  mostrarProductosPorCategoria,
} from "../api/productos.api";

/* helper */
function friendlyDeleteError(message: string) {
  if (message.toLowerCase().includes("foreign key")) {
    return "No se puede eliminar el producto: tiene movimientos asociados.";
  }
  return message;
}

/* =========================
   INSERTAR
========================= */

type InsertarProductoArgs = {
  payload: Omit<Partial<Productos>, "id" >;
};

export const useInsertarProductoMutation = () => {
  const qc = useQueryClient();

  const itemSelectEmpresa = useEmpresaStore((s) => s.itemSelect);
  const itemSelectCategoria = useCategoriasProductosStore((s) => s.itemSelect);

  return useMutation({
    mutationKey: ["insertar producto"],
    mutationFn: async ({ payload }: InsertarProductoArgs) => {
      const id_empresa = itemSelectEmpresa?.id;
      const id_categoria = itemSelectCategoria?.id;

      if (!id_empresa) throw new Error("No hay empresa seleccionada");
      if (!id_categoria) throw new Error("No hay categoría seleccionada");

      const p: Omit<Partial<Productos>, "id"> = {
        ...payload,
        id_empresa,
        id_categoria,
      };

      return await insertarProducto(p);
    },

    onSuccess: () => {
      toast.success("Producto creado");

      qc.invalidateQueries({
        queryKey: ["mostrar productos por categoria"],
      });
    },

    onError: (e: any) => {
      toast.error(e?.message ?? "Error al crear producto");
    },
  });
};

/* =========================
   EDITAR
========================= */

type EditarProductoArgs = Partial<Productos> & {
  id: Productos["id"];
};

export const useEditarProductoMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["editar producto"],

    mutationFn: async (p: EditarProductoArgs) => {
      return await editarProducto(p);
    },

    onSuccess: () => {
      toast.success("Producto actualizado");

      qc.invalidateQueries({
        queryKey: ["mostrar productos por categoria"],
      });
    },

    onError: (e: any) => {
      qc.invalidateQueries({
        queryKey: ["mostrar productos por categoria"],
      });

      toast.error(e?.message ?? "Error al editar producto");
    },
  });
};

/* =========================
   ELIMINAR
========================= */

type EliminarProductoArgs = {
  id: Productos["id"];
};

export const useEliminarProductoMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["eliminar producto"],

    mutationFn: async ({ id }: EliminarProductoArgs) => {
      await eliminarProducto(id);
    },

    onSuccess: () => {
      toast.success("Producto eliminado");

      qc.invalidateQueries({
        queryKey: ["mostrar productos por categoria"],
      });
    },

    onError: (e: any) => {
      qc.invalidateQueries({
        queryKey: ["mostrar productos por categoria"],
      });

      toast.error(
        friendlyDeleteError(e?.message ?? "Error al eliminar producto"),
      );
    },
  });
};

/* =========================
   BUSCAR
========================= */

type BuscarProductosArgs = {
  q: string;
  id_empresa: Productos["id_empresa"];
  id_categoria: Categorias["id"];
};

export const useBuscarProductosMutation = () => {
  return useMutation({
    mutationKey: ["buscar productos"],

    mutationFn: async ({
      q,
      id_empresa,
      id_categoria,
    }: BuscarProductosArgs) => {
      const texto = q.trim();

      if (!texto)
        return await mostrarProductosPorCategoria(
          id_empresa,
          id_categoria,
        );

      return await buscarProductos(id_empresa, id_categoria, texto);
    },

    onError: (e: any) => {
      toast.error(e?.message ?? "Error al buscar productos");
    },
  });
};

/* =========================
   BUSCAR (AUTO EMPRESA + CATEGORIA)
========================= */

export const useBuscarProductosAutoMutation = () => {
  const itemSelectEmpresa = useEmpresaStore((s) => s.itemSelect);
  const itemSelectCategoria = useCategoriasProductosStore((s) => s.itemSelect);

  return useMutation({
    mutationKey: ["buscar productos auto"],

    mutationFn: async ({ q }: { q: string }) => {
      const id_empresa = itemSelectEmpresa?.id;
      const id_categoria = itemSelectCategoria?.id;

      if (!id_empresa) throw new Error("No hay empresa seleccionada");
      if (!id_categoria) throw new Error("No hay categoría seleccionada");

      const texto = q.trim();

      if (!texto)
        return await mostrarProductosPorCategoria(
          id_empresa,
          id_categoria,
        );

      return await buscarProductos(id_empresa, id_categoria, texto);
    },

    onError: (e: any) =>
      toast.error(e?.message ?? "Error al buscar productos"),
  });
};