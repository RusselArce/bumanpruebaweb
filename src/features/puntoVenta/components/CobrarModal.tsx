import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Icon } from "@iconify/react";
import { MetodosPagos } from "@/shared/types/db/tablas";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useMostrarTipoComprobantesPorSucursalQuery } from "@/features/tipo_comprobantes/hooks/tipo_comprobantes.queries";
import { useMostrarMetodosPagoPorEmpresaQuery } from "@/features/metodos_pago/hooks/metodos_pago.queries";
import {
  useMostrarDetalleVentaQuery,
  useMostrarDetalleVentaPorIdQuery,
} from "@/features/detalle_ventas/hooks/detalle_ventas.queries";
import { BuscadorClientesModal } from "./BuscadorClientesModal";
import { useClientesStore } from "@/features/clientes/store/clientes.store";
import { useMetodosPagoStore } from "@/features/metodos_pago/store/metodos_pago.store";
import { useTipoComprobanteStore } from "@/features/tipo_comprobantes/store/tipo_comprobantes.store";
import { BtnVolver } from "@/shared/ui/buttons/BtnVolver";
import { useVentasStore } from "@/features/ventas/store/ventas.store";
import { useFinalizarVentaMutate } from "@/features/ventas/hooks/ventas.hooks";
import { useMesasStore } from "@/features/mesas/store/mesas.store";
import { useEmpresaStore } from "@/features/empresa/store/empresa.store";
import { useInsertarMovimientoCajaMutation } from "@/features/movimientos_caja/hooks/movimientos_caja.mutations";
import { useAsignacionesSucursalesStore } from "@/features/asignacion_sucursal/store/asignacion_sucursal";
import { useCierresCajaStore } from "@/features/cierres_caja/store/cierres_caja.store";
import { useSubcription } from "@/shared/store/auth.store";
import { calcularDesgloseIgv } from "@/shared/utils/igv";

interface Props {
  total: number;
  onClose: () => void;
  /** Precarga "Monto recibido" cuando se abre desde un botón de pago rápido. */
  montoInicial?: number;
  /**
   * Cobra una venta distinta a la activa en el store global (usado por
   * "Dividir cuenta"): la pantalla de punto de venta de atrás sigue
   * mostrando la venta original sin tocarla.
   */
  idVentaOverride?: number;
  /** Se llama al terminar de cobrar una venta dividida, en vez del flujo normal (reset + volver a mesas). */
  onPagoDivisionCompletado?: () => void;
}

type MetodoPago = {
  id: MetodosPagos["id"];
  nombre: MetodosPagos["nombre"];
};

const nm = (s: string) => (s || "").toLowerCase().trim();
const isEfectivo = (m?: MetodoPago | null) =>
  nm(m?.nombre || "") === "efectivo";
const isMixtoMetodo = (m?: MetodoPago | null) => nm(m?.nombre || "") === "mixto";
const isCredito = (m?: MetodoPago | null) => {
  const n = nm(m?.nombre || "");
  return n === "credito" || n === "fiado";
};

type LineaPago = {
  id: string;
  idMetodoPago: MetodosPagos["id"];
  nombre: string;
  monto: number;
};

/** Reparte cada línea contra el total, en orden: lo que sobra de una línea
 *  (porque el total ya quedó cubierto) se registra como vuelto de esa línea. */
const distribuirPagos = (lineas: LineaPago[], total: number) => {
  let acumulado = 0;
  return lineas
    .map((l) => {
      const disponible = Math.max(0, total - acumulado);
      const aplicado = Math.min(l.monto, disponible);
      const vueltoLinea = Math.max(0, l.monto - disponible);
      acumulado += aplicado;
      return { ...l, monto: aplicado, vuelto: vueltoLinea };
    })
    .filter((l) => l.monto > 0 || l.vuelto > 0);
};

export const CobrarModal = ({
  total = 0,
  onClose,
  montoInicial,
  idVentaOverride,
  onPagoDivisionCompletado,
}: Props) => {
  const navigate = useNavigate();
  const { data: dataTipoComprobantes } =
    useMostrarTipoComprobantesPorSucursalQuery();
  const itemSelectAsignacionSucursal = useAsignacionesSucursalesStore(
    (s) => s.itemSelect,
  );
  const itemSelectCierreCaja = useCierresCajaStore((s) => s.itemSelect);

  const { data: dataMetodosPago } = useMostrarMetodosPagoPorEmpresaQuery();

  const itemSelectEmpresa = useEmpresaStore((s) => s.itemSelect);

  const esDivision = idVentaOverride != null;
  const idventaGlobal = useVentasStore((s) => s.idventa);
  const idventa = idVentaOverride ?? idventaGlobal;
  const totalVentaGlobal = useVentasStore((s) => s.total);
  const setStateCobrarModal = useVentasStore((s) => s.setStateCobrarModal);
  const resetStateVenta = useVentasStore((s) => s.resetState);
  const { user } = useSubcription();
  const { data: dataDetalleVentaGlobal } = useMostrarDetalleVentaQuery();
  const { data: dataDetalleVentaPorId } = useMostrarDetalleVentaPorIdQuery(idVentaOverride);

  const dataDetalleVenta = esDivision ? dataDetalleVentaPorId : dataDetalleVentaGlobal;
  const totalVenta = esDivision
    ? (dataDetalleVentaPorId ?? []).reduce((a, b) => a + Number(b.total || 0), 0)
    : totalVentaGlobal;

  const itemSelectMesa = useMesasStore((s) => s.itemSelect);

  const { mutateAsync: mutateFinalizarVenta, isPending: isCobrando } =
    useFinalizarVentaMutate();
  const {
    mutateAsync: mutateInsertarMovimientoCaja,
    isPending: isInsertandoMovimientoCaja,
  } = useInsertarMovimientoCajaMutation();

  const setItemSelectMetodoPago = useMetodosPagoStore((s) => s.setItemSelect);

  const itemSelectMetodoPago = useMetodosPagoStore(
    (s) => s.itemSelect,
  ) as MetodoPago | null;

  const setItemSelectTipoComprobante = useTipoComprobanteStore(
    (s) => s.setItemSelect,
  );

  const itemSelectTipoComprobante = useTipoComprobanteStore(
    (s) => s.itemSelect,
  );

  const isBuscadorOpen = useClientesStore((s) => s.isBuscadorOpen);
  const closeBuscador = useClientesStore((s) => s.closeBuscador);
  const openBuscador = useClientesStore((s) => s.openBuscador);
  const itemSelectCliente = useClientesStore((s) => s.itemSelect);

  const metodos = ((dataMetodosPago as MetodosPagos[] | undefined) ?? []).filter(
    (m) => !!m.state,
  );

  const metodoSeleccionado = useMemo(() => {
    return metodos.find((m) => m.id === itemSelectMetodoPago?.id) || null;
  }, [metodos, itemSelectMetodoPago?.id]);

  const modoEfectivo = isEfectivo(metodoSeleccionado);
  const modoMixto = isMixtoMetodo(metodoSeleccionado);
  const modoCredito = isCredito(metodoSeleccionado);

  const subMetodosMixto = useMemo(
    () => metodos.filter((m) => !isMixtoMetodo(m)),
    [metodos],
  );

  // Vender a crédito standalone asume que lo "pagado ahora" entra en
  // Efectivo; si la empresa no tiene ese método configurado, no se puede
  // partir el pago y la venta se fía completa.
  const metodoEfectivoDisponible = useMemo(
    () => metodos.find((m) => isEfectivo(m)) || null,
    [metodos],
  );

  const { subtotal: subtotalVenta, igv: igvVenta, porcentaje: porcentajeIgv } = useMemo(
    () => calcularDesgloseIgv(totalVenta, itemSelectEmpresa?.valor_impuesto),
    [totalVenta, itemSelectEmpresa?.valor_impuesto],
  );

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);

  const [montoRecibido, setMontoRecibido] = useState<number>(montoInicial ?? totalVenta);
  const [pagosMixto, setPagosMixto] = useState<LineaPago[]>([]);

  // ===== Propina =====
  const PORCENTAJES_PROPINA = [0, 5, 10, 15];
  const [propinaPct, setPropinaPct] = useState<number>(0);
  const [propinaManual, setPropinaManual] = useState<number | null>(null);

  const propinaMonto = useMemo(() => {
    if (propinaManual != null) return Math.max(0, propinaManual);
    return Number(((subtotalVenta * propinaPct) / 100).toFixed(2));
  }, [propinaManual, propinaPct, subtotalVenta]);

  const totalAPagar = useMemo(
    () => Number((totalVenta + propinaMonto).toFixed(2)),
    [totalVenta, propinaMonto],
  );

  const elegirPropinaPct = (pct: number) => {
    setPropinaManual(null);
    setPropinaPct(pct);
  };

  useEffect(() => {
    setPropinaPct(0);
    setPropinaManual(null);
  }, [idventa]);

  useEffect(() => {
    if (!modoEfectivo && !modoCredito) {
      setMontoRecibido(totalAPagar);
    }
  }, [modoEfectivo, modoCredito, totalAPagar]);

  // Al entrar en modo Crédito se asume "fiar todo" por defecto (0 pagado
  // ahora); el cajero baja ese monto si el cliente adelanta algo en efectivo.
  useEffect(() => {
    if (modoCredito) {
      setMontoRecibido(0);
    }
  }, [modoCredito]);

  // Al abrir desde un botón de "pago rápido", el método de pago (Efectivo)
  // llega vía store y puede resolverse un render después de este montaje
  // (mientras carga metodos_pago). Ese primer render con "sin método aún"
  // dispara el efecto de arriba y pisa el monto precargado con el total.
  // Este efecto reaplica montoInicial en cuanto Efectivo quede resuelto.
  // Se guarda el último valor aplicado (no solo un flag) para poder
  // reaplicar cuando el usuario cambia de botón de pago rápido con el
  // modal ya abierto, sin volver a pisar ediciones manuales posteriores.
  const montoInicialAplicadoRef = useRef<number | null>(null);
  useEffect(() => {
    if (montoInicial == null) return;
    if (!modoEfectivo) return;
    if (montoInicialAplicadoRef.current === montoInicial) return;
    setMontoRecibido(montoInicial);
    montoInicialAplicadoRef.current = montoInicial;
  }, [montoInicial, modoEfectivo]);

  useEffect(() => {
    if (!modoMixto) {
      setPagosMixto([]);
    }
  }, [modoMixto]);

  useEffect(() => {
    setPagosMixto([]);
  }, [idventa]);

  const restanteActual = useCallback(
    (excluirId?: string) => {
      const pagado = pagosMixto
        .filter((l) => l.id !== excluirId)
        .reduce((acc, l) => acc + l.monto, 0);
      return Math.max(0, totalAPagar - pagado);
    },
    [pagosMixto, totalAPagar],
  );

  const agregarLineaMixto = (m: MetodosPagos) => {
    setPagosMixto((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        idMetodoPago: m.id,
        nombre: m.nombre,
        monto: restanteActual(),
      },
    ]);
  };

  const editarLineaMixto = (id: string, monto: number) => {
    setPagosMixto((prev) =>
      prev.map((l) => (l.id === id ? { ...l, monto: Math.max(0, monto) } : l)),
    );
  };

  const quitarLineaMixto = (id: string) => {
    setPagosMixto((prev) => prev.filter((l) => l.id !== id));
  };

  const pagos: LineaPago[] = useMemo(() => {
    if (modoMixto) return pagosMixto;
    if (!metodoSeleccionado) return [];

    if (modoCredito) {
      // Reparte la venta en dos líneas implícitas: lo pagado ahora (en
      // Efectivo, si existe ese método) y lo que se fía por el resto.
      // Siempre suman exactamente totalAPagar, así que restante/vuelto
      // no necesitan tratamiento especial más abajo.
      const pagadoAhora = metodoEfectivoDisponible
        ? Math.min(Math.max(0, montoRecibido || 0), totalAPagar)
        : 0;
      const fiado = Number((totalAPagar - pagadoAhora).toFixed(2));
      const lineas: LineaPago[] = [];
      if (pagadoAhora > 0 && metodoEfectivoDisponible) {
        lineas.push({
          id: "credito-ahora",
          idMetodoPago: metodoEfectivoDisponible.id,
          nombre: metodoEfectivoDisponible.nombre,
          monto: pagadoAhora,
        });
      }
      if (fiado > 0) {
        lineas.push({
          id: "credito-fiado",
          idMetodoPago: metodoSeleccionado.id,
          nombre: metodoSeleccionado.nombre,
          monto: fiado,
        });
      }
      return lineas;
    }

    return [
      {
        id: "single",
        idMetodoPago: metodoSeleccionado.id,
        nombre: metodoSeleccionado.nombre,
        monto: modoEfectivo ? montoRecibido : totalAPagar,
      },
    ];
  }, [
    modoMixto,
    pagosMixto,
    metodoSeleccionado,
    modoEfectivo,
    modoCredito,
    metodoEfectivoDisponible,
    montoRecibido,
    totalAPagar,
  ]);

  const sumaPagos = useMemo(
    () => pagos.reduce((acc, p) => acc + (p.monto || 0), 0),
    [pagos],
  );

  // Monto total fiado en esta venta (línea de Crédito standalone o agregada
  // dentro de Mixto): determina si hace falta cliente y qué se guarda como
  // `ventas.saldo`.
  const montoFiado = useMemo(
    () =>
      pagos
        .filter((l) => isCredito({ id: l.idMetodoPago, nombre: l.nombre }))
        .reduce((acc, l) => acc + (l.monto || 0), 0),
    [pagos],
  );

  const { vuelto, restante } = useMemo(() => {
    if (!metodoSeleccionado) {
      return { vuelto: 0, restante: totalAPagar };
    }

    const v = sumaPagos > totalAPagar ? sumaPagos - totalAPagar : 0;
    const r = totalAPagar > sumaPagos ? totalAPagar - sumaPagos : 0;
    return { vuelto: v, restante: r };
  }, [sumaPagos, totalAPagar, metodoSeleccionado]);

  const requiereClienteParaFiar = montoFiado > 0 && !itemSelectCliente;

  const puedeCobrar =
    !!metodoSeleccionado &&
    restante === 0 &&
    !(modoMixto && pagosMixto.length === 0) &&
    !requiereClienteParaFiar &&
    !!idventa &&
    !!itemSelectMesa?.id &&
    !isCobrando &&
    !isInsertandoMovimientoCaja;

  const imprimirConVentanaEmergente = useCallback(async (p: unknown) => {
    const { default: ticket } = await import("./TicketVenta");
    await ticket("print", p);
  }, []);

  const onCobrar = useCallback(async () => {
    if (!puedeCobrar) return;
    if (!dataDetalleVenta?.length) {
      toast.error("No hay detalles para imprimir el ticket");
      return;
    }

    const payload = {
      id: idventa,
      id_mesa: itemSelectMesa!.id,
      monto_total: totalVenta,
      sub_total: Number(subtotalVenta.toFixed(2)),
      total_impuestos: Number(igvVenta.toFixed(2)),
      valor_impuesto: porcentajeIgv,
      propina: propinaMonto,
      id_cliente: itemSelectCliente?.id ?? null,
      saldo: montoFiado,
      // al cobrar solo una parte dividida, la venta original sigue abierta
      // en la misma mesa: no toca liberarla todavía.
      liberarMesa: !esDivision,
    };

    // Reparte cada tender (efectivo, tarjeta, credito, etc.) contra el total
    // (incluye la propina: es plata que también recibe el cajero/mesero).
    // En pago simple es una sola línea; en Mixto, una por cada método agregado.
    const lineasPago = distribuirPagos(pagos, totalAPagar);

    try {
      await mutateFinalizarVenta(payload);
      await Promise.all(
        lineasPago.map((linea) =>
          mutateInsertarMovimientoCaja({
            id_metodo_pago: linea.idMetodoPago as number,
            id_ventas: idventa,
            vuelto: linea.vuelto,
            monto: linea.monto,
            tipo_movimiento: "venta",
            descripcion: "Ingreso de dinero por venta",
            id_usuario: itemSelectAsignacionSucursal?.id_usuario,
            id_cierre_caja: itemSelectCierreCaja?.id,
          }),
        ),
      );

      const ventaBase = dataDetalleVenta[0]?.ventas;
      const dataVentaConfirmada = {
        ...ventaBase,
        id: idventa,
        fecha: ventaBase?.fecha ?? new Date().toISOString(),
        monto_total: totalVenta,
        sub_total: Number(subtotalVenta.toFixed(2)),
        total_impuestos: Number(igvVenta.toFixed(2)),
        valor_impuesto: porcentajeIgv,
        propina: propinaMonto,
      };

      const pPrint = {
        dataempresa: itemSelectEmpresa,
        productos: dataDetalleVenta,
        dataventas: { ...dataVentaConfirmada, saldo: montoFiado },
        nombreComprobante: itemSelectTipoComprobante?.nombre ?? "TICKET",
        nombrecajero: user?.email ?? "Cajero",
        dataCliente: itemSelectCliente,
        metodosPago: lineasPago.map((linea) => ({
          tipo: linea.nombre,
          monto: linea.monto,
          vuelto: linea.vuelto,
        })),
      };
      try {
        await imprimirConVentanaEmergente(pPrint);
      } catch {
        toast.warning("Venta cobrada, pero no se pudo imprimir el ticket.");
      }
      if (esDivision) {
        toast.success("Cuenta dividida cobrada.");
        onPagoDivisionCompletado?.();
      } else {
        resetStateVenta();
        navigate("/");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo finalizar e imprimir la venta");
    }
  }, [
    puedeCobrar,
    idventa,
    esDivision,
    onPagoDivisionCompletado,
    itemSelectMesa,
    totalVenta,
    totalAPagar,
    propinaMonto,
    subtotalVenta,
    igvVenta,
    porcentajeIgv,
    pagos,
    montoFiado,
    itemSelectAsignacionSucursal?.id_usuario,
    itemSelectCierreCaja?.id,
    mutateFinalizarVenta,
    mutateInsertarMovimientoCaja,
    dataDetalleVenta,
    itemSelectEmpresa,
    itemSelectTipoComprobante?.nombre,
    user?.email,
    itemSelectCliente,
    imprimirConVentanaEmergente,
    resetStateVenta,
    navigate,
  ]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isBuscadorOpen) return;

      if (e.key === "Enter") {
        e.preventDefault();
        onCobrar();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCobrar, isBuscadorOpen]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 font-sans">
      <div className="relative bg-white dark:bg-[#202f36] border-2 border-[#E5E5E5] dark:border-[#37464f] w-full max-w-md lg:max-w-4xl max-h-[92vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 pt-5 sm:px-8 sm:pt-8 flex-shrink-0">
          <BtnVolver onClick={setStateCobrarModal} />

          {metodoSeleccionado && (
            <span className="bg-[#ff3d91] text-white text-[11px] font-black uppercase px-3 py-1 rounded-md tracking-wider">
              {metodoSeleccionado.nombre}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-5 pb-6 pt-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-10">
            {/* ===== IZQUIERDA: comprobante / cliente / resumen ===== */}
            <div className="flex flex-col">
              <div className="flex justify-start gap-2 mb-4 overflow-x-auto no-scrollbar">
                {dataTipoComprobantes?.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setItemSelectTipoComprobante(item)}
                    className={`text-sm font-black uppercase tracking-wide transition-colors ${
                      itemSelectTipoComprobante?.id === item.id
                        ? "text-gray-900 dark:text-white"
                        : "text-gray-400 dark:text-white/35 hover:text-gray-600 dark:hover:text-white/60"
                    }`}
                  >
                    {item.nombre}
                  </button>
                ))}
              </div>

              <div className="bg-gray-50 dark:bg-[#131f24] border-2 border-[#E5E5E5] dark:border-[#37464f] rounded-3xl p-5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-white/40 mb-1">
                    Cliente
                  </div>
                  <div className="text-gray-900 dark:text-white font-black text-lg truncate">
                    {itemSelectCliente ? itemSelectCliente.nombres : "Sin cliente"}
                  </div>
                </div>

                <button
                  className="flex-shrink-0 bg-[#1cb0f6] border-b-4 border-[#1899d6] p-3 rounded-2xl text-white active:border-b-0 active:translate-y-[4px] transition-all"
                  onClick={openBuscador}
                >
                  <Icon icon="mdi:pencil" width="20" />
                </button>
              </div>

              <div className="bg-gray-50 dark:bg-[#131f24] border-2 border-[#E5E5E5] dark:border-[#37464f] rounded-3xl p-5 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-white/40">
                    Propina
                  </span>
                  {propinaManual != null && (
                    <button
                      type="button"
                      onClick={() => setPropinaManual(null)}
                      className="text-[10px] font-black uppercase text-[#ff3d91]"
                    >
                      Quitar monto manual
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2 mb-3">
                  {PORCENTAJES_PROPINA.map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => elegirPropinaPct(pct)}
                      className={`py-2 rounded-xl font-black text-sm transition-all border-2 ${
                        propinaManual == null && propinaPct === pct
                          ? "border-[#ff3d91] text-[#ff3d91] bg-[#ff3d91]/10"
                          : "border-[#E5E5E5] dark:border-[#37464f] text-gray-400 dark:text-white/50 hover:border-gray-400 dark:hover:border-white/30 hover:text-gray-600 dark:hover:text-white/70"
                      }`}
                    >
                      {pct === 0 ? "SIN" : `${pct}%`}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 bg-white dark:bg-[#202f36] border-2 border-[#E5E5E5] dark:border-[#37464f] rounded-2xl px-4 py-2">
                  <span className="text-gray-400 dark:text-white/40 font-black uppercase text-xs tracking-wide">
                    Monto
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={propinaManual ?? propinaMonto}
                    onChange={(e) => setPropinaManual(Math.max(0, Number(e.target.value)))}
                    className="flex-1 bg-transparent text-right text-lg font-black text-gray-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-[#131f24] border-2 border-[#E5E5E5] dark:border-[#37464f] rounded-3xl p-5 mt-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-black uppercase tracking-wide text-gray-400 dark:text-white/40">
                    <span>Subtotal</span>
                    <span>${formatMoney(subtotalVenta)}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs font-black uppercase tracking-wide text-[#58cc02]">
                    <span>{itemSelectEmpresa?.impuesto ?? "IGV"} ({porcentajeIgv}%)</span>
                    <span>${formatMoney(igvVenta)}</span>
                  </div>

                  {propinaMonto > 0 && (
                    <div className="flex justify-between items-center text-xs font-black uppercase tracking-wide text-[#ff3d91]">
                      <span>Propina</span>
                      <span>${formatMoney(propinaMonto)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-end border-t-2 border-[#E5E5E5] dark:border-[#37464f] pt-3">
                    <span className="text-xl font-black text-gray-900 dark:text-white">Total</span>
                    <span className="text-3xl font-black text-amber-600 dark:text-[#ffd900]">
                      ${formatMoney(totalAPagar)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-base font-bold text-gray-600 dark:text-white/80">
                    <span>Vuelto</span>
                    <span>${formatMoney(vuelto)}</span>
                  </div>

                  <div className="flex justify-between items-center text-base font-bold">
                    <span className={restante > 0 ? "text-[#ff9600]" : "text-gray-600 dark:text-white/80"}>
                      Restante
                    </span>
                    <span className={restante > 0 ? "text-[#ff9600]" : "text-gray-600 dark:text-white/80"}>
                      ${formatMoney(restante)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ===== DERECHA: métodos de pago y cobro ===== */}
            <div className="flex flex-col mt-6 lg:mt-0">
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-white/40 mb-3">
                Método de pago
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {metodos.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setItemSelectMetodoPago(item)}
                    className={`py-3 px-4 rounded-2xl font-black uppercase text-sm transition-all border-2 ${
                      itemSelectMetodoPago?.id === item.id
                        ? "border-[#1cb0f6] text-[#1cb0f6] bg-[#1cb0f6]/10"
                        : "border-[#E5E5E5] dark:border-[#37464f] text-gray-400 dark:text-white/50 hover:border-gray-400 dark:hover:border-white/30 hover:text-gray-600 dark:hover:text-white/70"
                    }`}
                  >
                    {item.nombre}
                  </button>
                ))}
              </div>

              {(modoEfectivo || (modoCredito && metodoEfectivoDisponible)) && (
                <div className="bg-gray-50 dark:bg-[#131f24] border-2 border-[#E5E5E5] dark:border-[#37464f] rounded-2xl p-4 mb-4 flex items-center justify-between">
                  <span className="text-gray-400 dark:text-white/40 font-black uppercase text-xs tracking-wide">
                    {modoCredito ? "Pagado ahora (efectivo)" : "Monto recibido"}
                  </span>

                  <input
                    type="number"
                    value={montoRecibido}
                    onChange={(e) => setMontoRecibido(Number(e.target.value))}
                    className="bg-transparent text-right text-xl font-black text-gray-900 dark:text-white outline-none w-1/2"
                  />
                </div>
              )}

              {modoCredito && !metodoEfectivoDisponible && (
                <div className="bg-gray-50 dark:bg-[#131f24] border-2 border-[#E5E5E5] dark:border-[#37464f] rounded-2xl p-4 mb-4 text-xs font-bold text-gray-500 dark:text-white/50">
                  No hay un método "Efectivo" configurado: esta venta se fiará completa.
                </div>
              )}

              {modoCredito && montoFiado > 0 && (
                <div className="bg-[#ff9600]/10 border-2 border-[#ff9600]/40 rounded-2xl p-4 mb-4 flex items-center justify-between">
                  <span className="text-[#ff9600] font-black uppercase text-xs tracking-wide">Se fía</span>
                  <span className="text-[#ff9600] font-black text-lg">${formatMoney(montoFiado)}</span>
                </div>
              )}

              {modoMixto && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {subMetodosMixto.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => agregarLineaMixto(m)}
                        className="flex items-center gap-1 py-2 px-3 rounded-full text-xs font-black uppercase border-2 border-[#1cb0f6] text-[#1cb0f6] active:scale-95 transition-transform"
                      >
                        <Icon icon="mdi:plus" width="14" />
                        {m.nombre}
                      </button>
                    ))}
                  </div>

                  {pagosMixto.length === 0 ? (
                    <p className="text-xs font-bold text-gray-400 dark:text-white/40 text-center py-3 border-2 border-dashed border-[#E5E5E5] dark:border-[#37464f] rounded-2xl">
                      Agrega los métodos con los que se está pagando.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {pagosMixto.map((linea) => (
                        <div
                          key={linea.id}
                          className="bg-gray-50 dark:bg-[#131f24] border-2 border-[#E5E5E5] dark:border-[#37464f] rounded-2xl p-3 flex items-center justify-between gap-2"
                        >
                          <span className="text-sm font-black text-gray-900 dark:text-white truncate">
                            {linea.nombre}
                          </span>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={linea.monto}
                              onChange={(e) =>
                                editarLineaMixto(linea.id, Number(e.target.value))
                              }
                              className="bg-transparent text-right text-lg font-black text-gray-900 dark:text-white outline-none w-20"
                            />
                            <button
                              onClick={() => quitarLineaMixto(linea.id)}
                              className="text-gray-400 dark:text-white/30 hover:text-[#ff3d91] transition-colors"
                            >
                              <Icon icon="mdi:close-circle" width="20" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex-1" />

              {requiereClienteParaFiar && (
                <p className="text-center text-xs font-black uppercase tracking-wide text-[#ff3d91] mb-2">
                  Selecciona un cliente para fiar ${formatMoney(montoFiado)}
                </p>
              )}

              <button
                onClick={onCobrar}
                disabled={!puedeCobrar}
                className="w-full mt-2 py-5 rounded-[1.75rem] font-black text-xl text-white bg-[#58cc02] border-b-4 border-[#46a302] active:border-b-0 active:translate-y-[4px] disabled:opacity-40 disabled:active:translate-y-0 disabled:active:border-b-4 transition-all"
              >
                <span className="inline-flex items-center gap-2">
                  <Icon
                    icon={isCobrando ? "mdi:loading" : "mdi:cash-register"}
                    width="24"
                    className={isCobrando ? "animate-spin" : ""}
                  />
                  COBRAR
                </span>
              </button>

              <button
                onClick={onClose}
                className="w-full mt-4 text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/70 font-black uppercase text-xs tracking-widest transition-colors"
              >
                Volver atrás
              </button>
            </div>
          </div>
        </div>
      </div>

      <BuscadorClientesModal
        isOpen={isBuscadorOpen}
        onClose={closeBuscador}
        idEmpresa={itemSelectEmpresa?.id as number}
      />
    </div>
  );
};
