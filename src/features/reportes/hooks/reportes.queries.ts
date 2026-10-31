import { useQuery } from "@tanstack/react-query";
import {
  mostrarDetalleVentasReporte,
  mostrarMovimientosVentaReporte,
  mostrarVentasReporte,
  type RangoReportePayload,
} from "../api/reportes.api";

const habilitado = (p: RangoReportePayload) =>
  !!p.id_sucursal && !!p.desde && !!p.hasta;

export const useVentasReporteQuery = (p: RangoReportePayload) =>
  useQuery({
    queryKey: ["reportes", "ventas", p.id_sucursal, p.desde, p.hasta],
    queryFn: () => mostrarVentasReporte(p),
    enabled: habilitado(p),
  });

export const useDetalleVentasReporteQuery = (p: RangoReportePayload) =>
  useQuery({
    queryKey: ["reportes", "detalle-ventas", p.id_sucursal, p.desde, p.hasta],
    queryFn: () => mostrarDetalleVentasReporte(p),
    enabled: habilitado(p),
  });

export const useMovimientosVentaReporteQuery = (p: RangoReportePayload) =>
  useQuery({
    queryKey: ["reportes", "movimientos-venta", p.id_sucursal, p.desde, p.hasta],
    queryFn: () => mostrarMovimientosVentaReporte(p),
    enabled: habilitado(p),
  });
