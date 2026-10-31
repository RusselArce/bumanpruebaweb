import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { Mesas } from "@/shared/types/db/tablas";
import { useMesasStore } from "@/features/mesas/store/mesas.store";
import {
  buscarMesaParaLlevarPorSucursal,
  insertarMesasBatch,
} from "@/features/mesas/api/mesas.api";
import { mostrarSalonesPorSucursal } from "@/features/salones/api/salones.api";
import { useCierresCajaStore } from "@/features/cierres_caja/store/cierres_caja.store";
import { useMostrarCierresPorCajaQuery } from "@/features/cierres_caja/hooks/cierres_caja.queries";
import { useAsignacionesSucursalesStore } from "@/features/asignacion_sucursal/store/asignacion_sucursal";
import { useVentasStore } from "@/features/ventas/store/ventas.store";
import { useEliminarVentasIncompletasMutate } from "@/features/ventas/hooks/ventas.hooks";

export const NOMBRE_MESA_PARA_LLEVAR = "para_llevar";

// "Para llevar" reutiliza el mismo pipeline de venta que las mesas físicas
// (id_mesa es obligatorio en toda la app). En vez de una mesa por pedido,
// se usa SIEMPRE la misma mesa 'para_llevar' (la crea el trigger de alta de
// empresa dentro del salón "Principal"); los pedidos concurrentes se
// distinguen entre sí por `ventas.nombre_ref`, no por la mesa. Por eso cada
// click en "Para llevar" fuerza una venta nueva (idventa = 0) en vez de
// intentar resumir la última venta activa de esa mesa.
export const useIniciarParaLlevar = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const setItemSelectMesa = useMesasStore((s) => s.setItemSelect);

  const setStateAperturaCaja = useCierresCajaStore((s) => s.setStateAperturaCaja);
  const setItemSelectCierreCaja = useCierresCajaStore((s) => s.setItemSelect);
  const { refetch: refetchCierreCaja } = useMostrarCierresPorCajaQuery();

  const itemSelectAsignacionSucursal = useAsignacionesSucursalesStore((s) => s.itemSelect);
  const idventa = useVentasStore((s) => s.idventa);
  const setIdventa = useVentasStore((s) => s.setIdventa);
  const setNombreRefParaLlevar = useVentasStore((s) => s.setNombreRefParaLlevar);
  const { mutate: mutateEliminarVentasIncompletas } = useEliminarVentasIncompletasMutate();

  const obtenerOCrearMesaParaLlevar = async (id_sucursal: number): Promise<Mesas> => {
    const existente = await buscarMesaParaLlevarPorSucursal(id_sucursal);
    if (existente) return existente;

    // self-heal: cuentas creadas antes de que el trigger insertara esta mesa
    const salones = (await mostrarSalonesPorSucursal(id_sucursal)) ?? [];
    const salonPrincipal =
      salones.find((s) => s.nombre.trim().toLowerCase() === "principal") ?? salones[0];

    if (!salonPrincipal) {
      throw new Error("No hay ningún salón configurado en esta sucursal.");
    }

    const [nuevaMesa] = await insertarMesasBatch([
      {
        nombre: NOMBRE_MESA_PARA_LLEVAR,
        id_salon: salonPrincipal.id,
        posicion: { x: 1, y: 1 },
        estado: "libre",
      },
    ]);
    return nuevaMesa as Mesas;
  };

  const iniciarParaLlevar = async () => {
    const id_sucursal = itemSelectAsignacionSucursal?.id_sucursal;
    if (!id_sucursal) {
      toast.error("No hay sucursal asignada.");
      return;
    }

    setIsLoading(true);
    try {
      const mesa = await obtenerOCrearMesaParaLlevar(id_sucursal);

      queryClient.invalidateQueries({ queryKey: ["mostrar mesas por salon", mesa.id_salon] });

      setItemSelectMesa(mesa);
      setIdventa(0); // fuerza una venta nueva: no resumir la última usada en esta mesa
      setNombreRefParaLlevar(null); // cada pedido nuevo vuelve a pedir su propio nombre

      const result = await refetchCierreCaja();
      const cierre = result.data;

      if (!cierre || cierre.estado === 1) {
        setStateAperturaCaja(true);
        setItemSelectCierreCaja(null);
        return;
      }

      setItemSelectCierreCaja(cierre);
      setStateAperturaCaja(false);

      if (itemSelectAsignacionSucursal?.id_usuario) {
        mutateEliminarVentasIncompletas({
          id_usuario: itemSelectAsignacionSucursal.id_usuario as number,
          id_cierre_caja: cierre.id,
          id: idventa,
        });
      }

      navigate("/punto-venta");
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo iniciar el pedido para llevar.");
    } finally {
      setIsLoading(false);
    }
  };

  return { iniciarParaLlevar, isLoading };
};
