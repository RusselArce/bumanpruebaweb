import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Icon } from "@iconify/react";
import { useMesasStore } from "@/features/mesas/store/mesas.store";
import { useMostrarCategoriasProductosQuery } from "@/features/categorias_productos/hooks/categorias_productos.queries";
import { useMostrarProductosPorCategoriaQuery } from "@/features/productos/hooks/productos.queries";
import { useCategoriasProductosStore } from "@/features/categorias_productos/store/categorias_productos.store";
import {
  useEnviarVentaACocinaMutate,
  useInsertarVentasMutation,
  useMostrarVentaActivaPorMesaQuery,
} from "@/features/ventas/hooks/ventas.hooks";
import { enviarVentaAcocina } from "@/features/ventas/api/ventas.api";
import { useMostrarDetalleVentaQuery } from "@/features/detalle_ventas/hooks/detalle_ventas.queries";
import { useVaciarDetalleVentaNuevaMutate } from "@/features/detalle_ventas/hooks/detalle_ventas.mutations";
import { useVentasStore } from "@/features/ventas/store/ventas.store";
import { CardDetalleVenta } from "../components/CardDetalleVenta";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { CobrarModal } from "../components/CobrarModal";
import { DividirCuentaModal } from "../components/DividirCuentaModal";
import { NombreRefParaLlevarModal } from "../components/NombreRefParaLlevarModal";
import { NOMBRE_MESA_PARA_LLEVAR } from "@/features/visorMesas/hooks/useIniciarParaLlevar";
import { useAsignacionesSucursalesStore } from "@/features/asignacion_sucursal/store/asignacion_sucursal";
import { useEmpresaStore } from "@/features/empresa/store/empresa.store";
import { useCierresCajaStore } from "@/features/cierres_caja/store/cierres_caja.store";
import { calcularDesgloseIgv } from "@/shared/utils/igv";
import { useMostrarPagosRapidosPorEmpresaQuery } from "@/features/pagos_rapidos/hooks/pagos_rapidos.queries";
import { useMostrarMetodosPagoPorEmpresaQuery } from "@/features/metodos_pago/hooks/metodos_pago.queries";
import { useMetodosPagoStore } from "@/features/metodos_pago/store/metodos_pago.store";
import { useDividirVentaMutation } from "@/features/ventas/hooks/ventas.hooks";
import type { ModificadorSeleccionado, PagosRapidos } from "@/shared/types/db/tablas";
import { SeleccionarModificadoresModal } from "../components/SeleccionarModificadoresModal";
import { NotasPedidoModal } from "../components/NotasPedidoModal";
import { usePermisosEfectivos } from "@/features/permisos/hooks/usePermisosEfectivos";

const normalizarNombre = (s: string) => (s || "").toLowerCase().trim();

export const PuntoVenta = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const itemSelectCierreCaja = useCierresCajaStore((s)=>s.itemSelect)

  // ✅ "Cobrar venta" es un botón dentro de esta pantalla, no una ruta —
  // por eso se chequea por nombre de módulo y no por `link` como el resto.
  const { tienePermisoPorNombreModulo, cargando: cargandoPermisos } = usePermisosEfectivos();
  const puedeCobrar = !cargandoPermisos && tienePermisoPorNombreModulo("Cobrar venta");

  // ✅ mejor: selector granular
  const itemSelect = useMesasStore((s) => s.itemSelect);

  // ✅ mejor: selector granular
  const setItemSelectCategoria = useCategoriasProductosStore((s) => s.setItemSelect);
  const itemSelectCategoria = useCategoriasProductosStore((s) => s.itemSelect);
  const itemSelectEmpresa = useEmpresaStore((s)=>s.itemSelect)

  // ✅ mejor: selector granular
  const idventa = useVentasStore((s) => s.idventa);
  const stateCobrarModal = useVentasStore((s) => s.stateCobrarModal);
  const setStateCobrarModal = useVentasStore((s) => s.setStateCobrarModal);
  const nombreRefParaLlevar = useVentasStore((s) => s.nombreRefParaLlevar);
  const setNombreRefParaLlevar = useVentasStore((s) => s.setNombreRefParaLlevar);

  const [showProducts, setShowProducts] = useState<boolean>(false);
  const [showActions, setShowActions] = useState<boolean>(false);

  const { data: dataCategoriasProductos } = useMostrarCategoriasProductosQuery();
  const { data: dataProductosPorCategoria } = useMostrarProductosPorCategoriaQuery();

  const { mutate, isPending } = useInsertarVentasMutation();

  const { isFetching: isFetchingVentaPorMesa } = useMostrarVentaActivaPorMesaQuery();
  const {
    data: dataDetalleVenta,
    isLoading: isLoadingDetalleVenta,
    refetch: refetchDetalleVenta,
  } = useMostrarDetalleVentaQuery();
  const itemSelectAsignacionSucursal = useAsignacionesSucursalesStore((s)=>s.itemSelect)

  const { data: dataPagosRapidos } = useMostrarPagosRapidosPorEmpresaQuery();
  const { data: dataMetodosPago } = useMostrarMetodosPagoPorEmpresaQuery();
  const setItemSelectMetodoPago = useMetodosPagoStore((s) => s.setItemSelect);
  const [montoRapidoInicial, setMontoRapidoInicial] = useState<number | null>(null);
  const [productoParaModificar, setProductoParaModificar] = useState<any | null>(null);
  const [showDividirModal, setShowDividirModal] = useState(false);
  const [ventaDividida, setVentaDividida] = useState<{ id: number } | null>(null);
  const [showNotasModal, setShowNotasModal] = useState(false);

  const { mutate: mutateVaciarCarrito, isPending: isVaciandoCarrito } =
    useVaciarDetalleVentaNuevaMutate();
  const { mutateAsync: mutateDividirVenta, isPending: isDividiendo } =
    useDividirVentaMutation();

  const agregarProductoAlCarrito = (prod: any, modificadores: ModificadorSeleccionado[]) => {
    mutate({
      venta: {
        id_usuario: itemSelectAsignacionSucursal?.id_usuario,
        id_sucursal: itemSelectAsignacionSucursal?.id_sucursal,
        id_empresa: itemSelectEmpresa?.id,
        id_cierre_caja: itemSelectCierreCaja?.id,
        id_mesa: itemSelect?.id,
        nombre_ref: esParaLlevar ? nombreRefParaLlevar : undefined,
      },
      detalle: {
        _cantidad: 1,
        _precio_venta: prod.precio_venta,
        _descripcion: prod.nombre,
        _id_producto: prod.id,
        _precio_compra: prod.precio_compra,
        _id_sucursal: itemSelectAsignacionSucursal?.id_sucursal as number,
        _id_almacen: 2,
        _modificadores: modificadores.length ? modificadores : undefined,
      },
    });
  };

  const onClickProducto = (prod: any) => {
    if (isPending) return;

    if (prod.producto_modificadores?.length) {
      setProductoParaModificar(prod);
      return;
    }

    agregarProductoAlCarrito(prod, []);
  };

  const onConfirmarModificadores = (modificadores: ModificadorSeleccionado[]) => {
    if (!productoParaModificar) return;
    agregarProductoAlCarrito(productoParaModificar, modificadores);
    setProductoParaModificar(null);
  };

  // ✅ "Vaciar carrito": solo quita lo que aún no se mandó a cocina.
  const onBorrar = () => {
    if (!idventa) return;

    const hayNuevos = (dataDetalleVenta ?? []).some(
      (d: any) => String(d?.estado || "").toLowerCase() === "nueva",
    );

    if (!hayNuevos) {
      toast.error("No hay productos por quitar (ya se enviaron a cocina).");
      return;
    }

    toast.warning("¿Vaciar el pedido?", {
      description: "Se quitan los productos que aún no se enviaron a cocina.",
      action: {
        label: "Vaciar",
        onClick: () => mutateVaciarCarrito({ id_venta: idventa }),
      },
    });
  };

  const onAbrirDividir = () => {
    // Dividir cuenta desemboca directo en cobrar la parte dividida
    // (bypasea el guard de onOpenCobrar), así que se valida también aquí.
    if (!puedeCobrar) {
      toast.error("No tienes permisos para cobrar.", {
        description: "Pide a un cajero o administrador que registre el cobro.",
      });
      return;
    }
    if (!dataDetalleVenta || dataDetalleVenta.length < 2) {
      toast.error("Necesitas al menos 2 productos para dividir la cuenta.");
      return;
    }
    setShowDividirModal(true);
  };

  const onConfirmarDividir = async (idsDetalle: number[]) => {
    try {
      const nuevaVenta = await mutateDividirVenta({
        ventaBase: {
          id_usuario: itemSelectAsignacionSucursal?.id_usuario as number,
          id_sucursal: itemSelectAsignacionSucursal?.id_sucursal as number,
          id_empresa: itemSelectEmpresa?.id as number,
          id_cierre_caja: itemSelectCierreCaja?.id ?? null,
          id_mesa: itemSelect?.id as number,
          nombre_ref: esParaLlevar ? nombreRefParaLlevar : undefined,
        },
        idsDetalle,
      });
      setShowDividirModal(false);
      setVentaDividida({ id: nuevaVenta.id });
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo dividir la cuenta.");
    }
  };

  /**
   * BOTÓN base del punto de venta: color sólido plano (paleta de marca ya
   * usada en el resto de la app: verde/azul/rojo/naranja/gris), sin
   * degradados. `important` reserva el relieve (sombra real, no gradiente)
   * para las 1-2 acciones que de verdad importan (cobrar/enviar) — el
   * resto queda plano para no competir visualmente. Pensado para dedos,
   * no mouse: áreas grandes, buen contraste, feedback claro al tocar.
   */
  const DuoButton = ({
    children,
    color = "blue",
    onClick,
    className = "",
    icon = "",
    active = false,
    disabled = false,
    isLoading = false,
    important = false,
  }: any) => {
    const colorClasses: Record<string, string> = {
      green: "bg-[#58cc02]",
      blue: "bg-[#1cb0f6]",
      red: "bg-[#ff4b4b]",
      orange: "bg-[#ff9600]",
      dark: "bg-gray-500 dark:bg-[#37464f]",
    };

    const isEffectivelyDisabled = disabled || isLoading;

    return (
      <button
        onClick={onClick}
        disabled={isEffectivelyDisabled}
        className={`
          ${className} min-h-[48px] flex-shrink-0
          flex items-center justify-center gap-2
          rounded-xl px-4 py-2.5
          text-white font-black uppercase text-[11px] tracking-wider
          ${colorClasses[color] ?? colorClasses.dark}
          transition-all duration-150
          ${
            isEffectivelyDisabled
              ? "opacity-45 cursor-not-allowed grayscale"
              : "hover:brightness-110 active:brightness-95 active:scale-[0.97] cursor-pointer"
          }
          ${important && !isEffectivelyDisabled ? "shadow-lg shadow-black/25" : ""}
          ${active ? "ring-2 ring-white/80" : ""}
        `}
        type="button"
      >
        {isLoading ? (
          <Icon icon="mdi:loading" className="animate-spin" width="18" />
        ) : (
          icon && <Icon icon={icon} width="18" />
        )}
        <span className={isLoading ? "opacity-50" : ""}>{children}</span>
      </button>
    );
  };

  const { mutate: mutateEnviarAcocina, isPending: isEnviandoACocina } = useEnviarVentaACocinaMutate();

  const esParaLlevar =
    (itemSelect?.nombre ?? "").trim().toLowerCase() === NOMBRE_MESA_PARA_LLEVAR;
  const [showNombreRefModal, setShowNombreRefModal] = useState(false);

  const onEnviar = () => {
    if (!idventa) return;
    if (!itemSelect?.id) return;

    // El nombre de referencia ya se pidió antes de agregar el primer
    // producto; este modal solo queda como respaldo si por algún motivo
    // no se llegó a capturar.
    if (esParaLlevar && !nombreRefParaLlevar) {
      setShowNombreRefModal(true);
      return;
    }

    mutateEnviarAcocina({
      id: idventa,
      id_mesa: itemSelect.id,
      nombre_ref: esParaLlevar ? nombreRefParaLlevar ?? undefined : undefined,
    });
  };

  const onConfirmarNombreRefParaLlevar = (nombreRef: string) => {
    if (!idventa || !itemSelect?.id) return;

    mutateEnviarAcocina(
      { id: idventa, id_mesa: itemSelect.id, nombre_ref: nombreRef },
      {
        onSuccess: () => {
          setNombreRefParaLlevar(nombreRef);
          setShowNombreRefModal(false);
        },
      },
    );
  };

  // =========================
  // ✅ VALIDACIÓN DE COBRO
  // Se re-verifica en vivo (refetch) al presionar COBRAR: la data en caché
  // puede estar desactualizada si cocina cambió el estado de un pedido y
  // esta pantalla no lo escuchó por realtime, así que consultamos la DB
  // de nuevo justo antes de decidir si se puede cobrar.
  // =========================
  const [isVerificandoCobro, setIsVerificandoCobro] = useState(false);

  const onOpenCobrar = useCallback(
    async (pagoRapido?: PagosRapidos) => {
      if (!idventa) {
        toast.error("No hay venta activa para cobrar.");
        return;
      }

      if (!puedeCobrar) {
        toast.error("No tienes permisos para cobrar.", {
          description: "Pide a un administrador o cajero que registre el cobro.",
        });
        return;
      }

      setIsVerificandoCobro(true);
      toast.loading("Verificando pedidos...", { id: "check-cobro" });

      const { data: detallesFrescos, error } = await refetchDetalleVenta();

      toast.dismiss("check-cobro");
      setIsVerificandoCobro(false);

      if (error) {
        toast.error("No se pudo verificar el estado de los pedidos.");
        return;
      }

      const detalles = Array.isArray(detallesFrescos) ? detallesFrescos : [];

      if (detalles.length === 0) {
        toast.error("No hay productos en la venta.");
        return;
      }

      // ✅ "Para llevar" se cobra al momento, sin exigir que los productos
      // ya estén "listo". Pero si nunca se presionó ENVIAR, cocina nunca se
      // entera del pedido: lo mandamos a cocina automáticamente aquí mismo,
      // sin pedir nombre de referencia (para no volver a interrumpir el cobro).
      if (esParaLlevar) {
        const tieneItemsSinEnviar = detalles.some(
          (d: any) => String(d?.estado || "").toLowerCase() === "nueva",
        );

        if (tieneItemsSinEnviar) {
          if (!itemSelect?.id) {
            toast.error("No se encontró el pedido para llevar.");
            return;
          }

          try {
            await enviarVentaAcocina({
              id: idventa,
              id_mesa: itemSelect.id,
              nombre_ref: nombreRefParaLlevar ?? undefined,
            });
            queryClient.invalidateQueries({ queryKey: ["mostrar detalle venta"] });
            queryClient.invalidateQueries({ queryKey: ["mostrar ventas"] });
            queryClient.invalidateQueries({ queryKey: ["mostrar mesas"] });
          } catch (e: any) {
            toast.error(e?.message ?? "No se pudo enviar el pedido a cocina.");
            return;
          }
        }
      } else {
        const pendientes = detalles.filter(
          (d: any) => String(d?.estado || "").toLowerCase() !== "listo",
        );

        if (pendientes.length > 0) {
          toast.error("Aún hay pedidos en preparación.", {
            description: `Pendientes: ${pendientes.length}`,
          });
          return;
        }
      }

      if (pagoRapido) {
        const efectivo = (dataMetodosPago ?? []).find(
          (m) => normalizarNombre(m.nombre) === "efectivo",
        );

        if (!efectivo) {
          toast.error('No hay un método de pago "Efectivo" configurado.');
          return;
        }

        const totalFresco = detalles.reduce(
          (a: number, b: any) => a + (Number(b.total) || 0),
          0,
        );

        setItemSelectMetodoPago(efectivo);
        setMontoRapidoInicial(pagoRapido.es_exacto ? totalFresco : Number(pagoRapido.monto));
      } else {
        setMontoRapidoInicial(null);
      }

      // ✅ recién abre el modal
      setStateCobrarModal();
    },
    [
      idventa,
      puedeCobrar,
      refetchDetalleVenta,
      setStateCobrarModal,
      dataMetodosPago,
      setItemSelectMetodoPago,
      esParaLlevar,
      itemSelect?.id,
      queryClient,
      nombreRefParaLlevar,
    ],
  );

  const totalCalc = useMemo(() => {
    const detalles = Array.isArray(dataDetalleVenta) ? dataDetalleVenta : [];
    return detalles.reduce((a: number, b: any) => a + (Number(b.total) || 0), 0);
  }, [dataDetalleVenta]);

  const { subtotal: subtotalCalc, igv: igvCalc, porcentaje: porcentajeIgv } = useMemo(
    () => calcularDesgloseIgv(totalCalc, itemSelectEmpresa?.valor_impuesto),
    [totalCalc, itemSelectEmpresa?.valor_impuesto],
  );

  const [isImprimiendoPrecuenta, setIsImprimiendoPrecuenta] = useState(false);

  const onImprimirPrecuenta = useCallback(async () => {
    if (!dataDetalleVenta?.length) {
      toast.error("No hay productos en la venta.");
      return;
    }

    setIsImprimiendoPrecuenta(true);
    try {
      const { default: precuenta } = await import("../components/PrecuentaTicket");
      await precuenta("print", {
        dataempresa: itemSelectEmpresa,
        dataMesa: itemSelect,
        productos: dataDetalleVenta,
        subtotal: subtotalCalc,
        igv: igvCalc,
        total: totalCalc,
        porcentajeIgv,
      });
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo imprimir la pre-cuenta.");
    } finally {
      setIsImprimiendoPrecuenta(false);
    }
  }, [dataDetalleVenta, itemSelectEmpresa, itemSelect, subtotalCalc, igvCalc, totalCalc, porcentajeIgv]);

  return (
    <div className="w-full h-screen bg-gray-100 dark:bg-[#131f24] text-gray-700 dark:text-[#cccccc] font-sans flex flex-col overflow-hidden select-none">
      <Toaster position="top-center" closeButton expand offset={16} />

      <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden items-start">
        {/* CARRITO */}
        <aside className="lg:col-span-3 flex flex-col gap-3 h-full overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2 min-w-0">
              <Icon icon="mdi:table-chair" className="text-[#58cc02] shrink-0" width="14" />
              <span className="font-black text-gray-900 dark:text-white text-xs truncate">
                {esParaLlevar ? "PARA LLEVAR" : `MESA ${itemSelect?.nombre || "0"}`}
              </span>
              {esParaLlevar && nombreRefParaLlevar && (
                <span className="text-[#58cc02] dark:text-[#58cc02] text-[10px] font-bold truncate">
                  Ref: {nombreRefParaLlevar}
                </span>
              )}
            </div>

            <div className="flex gap-2 sm:hidden shrink-0">
              <DuoButton
                color="blue"
                className="w-9 h-9"
                onClick={() => setShowProducts(!showProducts)}
                icon="mdi:apps"
              />
              <DuoButton
                color="green"
                className="w-9 h-9"
                onClick={() => setShowActions(!showActions)}
                icon="mdi:menu"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar bg-white dark:bg-[#131f24] rounded-xl border border-[#E5E5E5] dark:border-[#37464f]">
            <CardDetalleVenta
              isLoadingDetalleVenta={isLoadingDetalleVenta || isFetchingVentaPorMesa}
              dataDetalleVenta={dataDetalleVenta}
              simbolo={itemSelectEmpresa?.simbolo_moneda ?? "S/"}
            />
          </div>

          <div className="bg-white dark:bg-[#202f36] border border-[#E5E5E5] dark:border-[#37464f] rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-end mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-50">
                Total
              </span>
              <span className="text-4xl font-black text-amber-600 dark:text-[#ffd900]">
                <span className="text-lg mr-1 opacity-70">{itemSelectEmpresa?.simbolo_moneda ?? "S/"}</span>
                {totalCalc.toFixed(2)}
              </span>
            </div>

            <div className="space-y-1 border-t border-[#E5E5E5] dark:border-[#37464f] pt-4 opacity-60 text-xs font-bold">
              <div className="flex justify-between">
                <span>SUBTOTAL</span>
                <span>{itemSelectEmpresa?.simbolo_moneda ?? "S/"} {subtotalCalc.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#58cc02] dark:text-[#58cc02]">
                <span>{itemSelectEmpresa?.impuesto ?? "IGV"} ({porcentajeIgv}%)</span>
                <span>{itemSelectEmpresa?.simbolo_moneda ?? "S/"} {igvCalc.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* ACCIONES */}
        <section
          className={`lg:col-span-2 ${showActions ? "flex" : "hidden"} lg:flex flex-col gap-3 items-start`}
        >
          <DuoButton color="green" icon="mdi:view-grid" className="w-full" onClick={() => navigate("/")}>
            MESAS
          </DuoButton>

          {puedeCobrar && (
            <DuoButton
              color="dark"
              icon="mdi:call-split"
              className="w-full"
              onClick={onAbrirDividir}
              disabled={!dataDetalleVenta?.length}
            >
              DIVIDIR
            </DuoButton>
          )}

          <DuoButton
            color="dark"
            className="w-full"
            onClick={onImprimirPrecuenta}
            isLoading={isImprimiendoPrecuenta}
          >
            PRE-CUENTA
          </DuoButton>

          <DuoButton
            color="red"
            icon="mdi:trash-can"
            className="w-full"
            onClick={onBorrar}
            isLoading={isVaciandoCarrito}
            disabled={!dataDetalleVenta?.length}
          >
            BORRAR
          </DuoButton>

          {!esParaLlevar && (
            <DuoButton color="blue" important icon="mdi:send" className="w-full" onClick={onEnviar}>
              ENVIAR
            </DuoButton>
          )}

          <DuoButton
            color="orange"
            icon="mdi:note-plus"
            className="w-full"
            onClick={() => setShowNotasModal(true)}
            disabled={!dataDetalleVenta?.length}
          >
            NOTAS
          </DuoButton>
        </section>

        {/* PRODUCTOS Y CATEGORÍAS */}
        <section
          className={`lg:col-span-7 ${showProducts ? "flex" : "hidden"} lg:flex flex-col gap-4 h-full overflow-hidden`}
        >
          <div className="flex-1 bg-white dark:bg-[#202f36] rounded-xl border border-[#E5E5E5] dark:border-[#37464f] flex flex-col overflow-hidden">
            <div className="bg-[#ffc800] border-b border-[#E5E5E5] dark:border-[#37464f] p-4 flex justify-between items-center px-6">
              <Icon icon="mdi:chevron-left" width="28" className="text-black/60 cursor-pointer hover:text-black transition-colors" />
              <span className="font-black text-black tracking-widest uppercase text-xl sm:text-2xl">
                Productos
              </span>
              <Icon icon="mdi:chevron-right" width="28" className="text-black/60 cursor-pointer hover:text-black transition-colors" />
            </div>

            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 overflow-y-auto custom-scrollbar content-start">
              {dataProductosPorCategoria?.map((item: any) => (
                <DuoButton
                  key={item.id}
                  color="blue"
                  onClick={() => onClickProducto(item)}
                  className="h-20"
                  isLoading={isPending}
                >
                  {item.nombre}
                </DuoButton>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-[#202f36] rounded-xl border border-[#E5E5E5] dark:border-[#37464f] overflow-hidden">
            <div className="bg-[#37464f] dark:bg-[#37464f] p-3 flex justify-center items-center relative">
              <span className="font-black text-white uppercase tracking-widest text-lg sm:text-xl text-center">
                Menú
              </span>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar items-start p-4">
              {dataCategoriasProductos?.map((item: any) => (
                <DuoButton
                  key={item.id}
                  color={itemSelectCategoria?.id === item.id ? "green" : "dark"}
                  active={itemSelectCategoria?.id === item.id}
                  onClick={() => setItemSelectCategoria(item)}
                  className="min-w-[130px]"
                >
                  {item.nombre}
                </DuoButton>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-white dark:bg-[#202f36] border-t border-[#E5E5E5] dark:border-[#37464f] p-4 px-6 z-10">
        <div className="flex flex-wrap items-center gap-4">
          {puedeCobrar ? (
            <>
              <div className="flex-1 min-w-[280px] grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {(dataPagosRapidos ?? []).filter((item) => !!item.state).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onOpenCobrar(item)}
                    disabled={isLoadingDetalleVenta || isVerificandoCobro}
                    className={`h-16 rounded-xl text-base font-black uppercase tracking-wide text-white transition-all hover:brightness-110 active:brightness-95 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale ${
                      item.es_exacto ? "bg-[#58cc02]" : "bg-gray-500 dark:bg-[#37464f]"
                    }`}
                  >
                    {item.es_exacto
                      ? "EXACTO"
                      : `${itemSelectEmpresa?.simbolo_moneda ?? "S/"} ${Number(item.monto)}`}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 items-start">
                <DuoButton
                  color="red"
                  important
                  className="h-16 px-10 text-sm"
                  icon="mdi:cash-register"
                  onClick={() => onOpenCobrar()} // ✅ AQUI LA VALIDACIÓN (re-verifica en vivo)
                  disabled={isLoadingDetalleVenta || isVerificandoCobro}
                  isLoading={isVerificandoCobro}
                >
                  COBRAR
                </DuoButton>

                <DuoButton color="dark" icon="mdi:logout" className="h-16 w-16" />
              </div>
            </>
          ) : (
            <div className="flex w-full items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-400 dark:text-white/40">
                <Icon icon="mdi:lock-outline" className="text-lg" />
                {cargandoPermisos
                  ? "Cargando permisos..."
                  : "No tienes permisos para cobrar. Pide a un cajero o administrador que registre el cobro."}
              </div>

              <DuoButton color="dark" icon="mdi:logout" className="h-16 w-16" />
            </div>
          )}
        </div>
      </footer>

      {/* Modal */}
      {stateCobrarModal && (
        <CobrarModal
          total={totalCalc}
          montoInicial={montoRapidoInicial ?? undefined}
          onClose={() => {
            setMontoRapidoInicial(null);
            setStateCobrarModal();
          }}
        />
      )}

      {showNombreRefModal && itemSelect?.id && (
        <NombreRefParaLlevarModal
          idMesa={itemSelect.id}
          isSending={isEnviandoACocina}
          onConfirm={onConfirmarNombreRefParaLlevar}
          onClose={() => setShowNombreRefModal(false)}
        />
      )}

      {/* Pedido "para llevar" recién iniciado (aún sin venta creada): pide el
          nombre de referencia ANTES de dejar agregar productos, para que
          cocina lo pueda identificar de inmediato. */}
      {esParaLlevar && idventa === 0 && !nombreRefParaLlevar && itemSelect?.id && (
        <NombreRefParaLlevarModal
          idMesa={itemSelect.id}
          onConfirm={(nombreRef) => setNombreRefParaLlevar(nombreRef)}
          onClose={() => navigate("/")}
        />
      )}

      {productoParaModificar && (
        <SeleccionarModificadoresModal
          producto={productoParaModificar}
          isLoading={isPending}
          onConfirm={onConfirmarModificadores}
          onClose={() => setProductoParaModificar(null)}
        />
      )}

      {showDividirModal && dataDetalleVenta && (
        <DividirCuentaModal
          dataDetalleVenta={dataDetalleVenta}
          simbolo={itemSelectEmpresa?.simbolo_moneda ?? "S/"}
          isLoading={isDividiendo}
          onConfirmar={onConfirmarDividir}
          onClose={() => setShowDividirModal(false)}
        />
      )}

      {/* Cobro de la parte dividida: la pantalla de atrás sigue mostrando la
          venta original (idventa global no se toca). */}
      {ventaDividida && (
        <CobrarModal
          total={0}
          idVentaOverride={ventaDividida.id}
          onPagoDivisionCompletado={() => setVentaDividida(null)}
          onClose={() => setVentaDividida(null)}
        />
      )}

      {showNotasModal && dataDetalleVenta && (
        <NotasPedidoModal
          dataDetalleVenta={dataDetalleVenta}
          onClose={() => setShowNotasModal(false)}
        />
      )}
    </div>
  );
};
