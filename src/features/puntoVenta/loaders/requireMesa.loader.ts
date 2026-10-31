// src/features/puntoVenta/loaders/requireMesa.loader.ts
import { redirect } from "react-router-dom";
import { useMesasStore } from "@/features/mesas/store/mesas.store";
import { useVentasStore } from "@/features/ventas/store/ventas.store";
import { useMostrarDetalleVentaQuery } from "@/features/detalle_ventas/hooks/detalle_ventas.queries";

export function requireMesaLoader() {

  const { itemSelect } = useMesasStore.getState(); // ✅ lee estado sin hook
  if (!itemSelect) throw redirect("/"); // ✅ vuelve a Home

  // La mesa "para_llevar" es compartida por todos los pedidos para llevar
  // (no hay una mesa por pedido), así que cada entrada a /punto-venta con
  // esa mesa debe empezar una venta nueva en vez de resumir la última.
  if ((itemSelect.nombre ?? "").trim().toLowerCase() === "para_llevar") {
    useVentasStore.getState().setIdventa(0);
    useVentasStore.getState().setNombreRefParaLlevar(null);
  }

  return null;
}
