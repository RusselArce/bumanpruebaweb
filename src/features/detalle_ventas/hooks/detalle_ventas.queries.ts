import { useQuery } from "@tanstack/react-query";

import { mostrarProductosPorCategoria } from "@/features/productos/api/productos.api";
import { useCategoriasProductosStore } from "@/features/categorias_productos/store/categorias_productos.store";
import {
  estadoDetalleVentaPayload,
  mostrarDetalleVenta,
  mostrarDetalleVentaPayload,
  mostrarDetalleventasPorEstado,
} from "../api/detalle_ventas.api";
import { useVentasStore } from "@/features/ventas/store/ventas.store";
import { DetalleVentaRow } from "@/shared/types/db/tablas";
import { useEffect, useMemo } from "react";

export const useMostrarDetalleVentaQuery = () => {
  const idventa = useVentasStore((s) => s.idventa);
  const setTotal = useVentasStore((s) => s.setTotal);

  const query = useQuery<DetalleVentaRow[]>({
    queryKey: ["mostrar detalle venta", idventa],
    queryFn: () => mostrarDetalleVenta({ id_venta: idventa }),
    enabled: !!idventa,
  });

  // ✅ total calculado desde data (si no hay data => 0)
  const total = useMemo(() => {
    const arr = query.data ?? [];
    return arr.reduce((acc, it) => acc + Number(it.total ?? 0), 0);
  }, [query.data]);

  // ✅ lo empuja al store cada vez que cambie
  useEffect(() => {
    setTotal(Number(total.toFixed(2)));
  }, [total, setTotal]);

  return query;
};
// ✅ variante "por id explícito", sin efecto sobre el store global (usada por
// el cobro de una venta dividida: no debe pisar el total de la venta
// original que sigue viéndose de fondo en la pantalla de punto de venta).
// Comparte el mismo queryKey que useMostrarDetalleVentaQuery, así que cachean
// juntas y una invalidación por prefijo ["mostrar detalle venta"] cubre ambas.
export const useMostrarDetalleVentaPorIdQuery = (idVenta?: number | null) => {
  return useQuery<DetalleVentaRow[]>({
    queryKey: ["mostrar detalle venta", idVenta],
    queryFn: () => mostrarDetalleVenta({ id_venta: idVenta as number }),
    enabled: !!idVenta,
  });
};

export const useMostrarDetalleVentaPorEstadoQuery = (
  p: estadoDetalleVentaPayload,
) => {
  return useQuery({
    queryKey: ["mostrar detalle venta por estado", p],
    queryFn: () => mostrarDetalleventasPorEstado(p),
    enabled: !!p.estado,
  });
};
