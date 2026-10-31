import React, { useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { Toaster, toast } from "sonner";
import { useAsignacionesSucursalesStore } from "@/features/asignacion_sucursal/store/asignacion_sucursal";
import { useCierresCajaStore } from "@/features/cierres_caja/store/cierres_caja.store";
import { useEmpresaStore } from "@/features/empresa/store/empresa.store";
import { useMostrarMetodosPagoPorEmpresaQuery } from "@/features/metodos_pago/hooks/metodos_pago.queries";
import { MetodosPagos } from "@/shared/types/db/tablas";
import { useAbonosPorVentasQuery, useCuentasPorCobrarQuery } from "../hooks/cuentas_cobrar.queries";
import { useRegistrarAbonoMutation } from "../hooks/cuentas_cobrar.mutations";
import type { VentaPendienteRow } from "../api/cuentas_cobrar.api";
import { ReporteHeader } from "@/features/reportes/components/ReporteHeader";
import { BotonesExportar } from "@/features/reportes/components/BotonesExportar";
import { KpiGrid } from "@/features/reportes/components/KpiGrid";
import { crearFormateadorMoneda } from "@/features/reportes/utils/money";
import type { ReporteExportable } from "@/features/reportes/utils/reportTypes";

// Un abono es plata real entrando a caja ahora mismo: "Crédito/Fiado" (volver
// a fiar) no es un destino válido para ese dinero, igual que ya se filtra en
// CobrarModal. "Mixto" sí es válido: reparte el abono entre varios métodos,
// mismo mecanismo que un cobro mixto en el punto de venta.
const nm = (s: string) => (s || "").toLowerCase().trim();
const esMetodoValidoParaAbono = (nombre: string | null) => {
  const n = nm(nombre || "");
  return n !== "credito" && n !== "fiado";
};
const isMixtoMetodo = (nombre: string | null) => nm(nombre || "") === "mixto";

type ClienteDeuda = {
  id_cliente: number;
  nombre: string;
  telefono: string;
  saldoTotal: number;
  ventas: VentaPendienteRow[];
};

type LineaAbonoUI = { id: string; idMetodoPago: number; nombre: string; monto: number };

export const CuentasPorCobrarPage: React.FC = () => {
  const itemSelectAsignacionSucursal = useAsignacionesSucursalesStore((s) => s.itemSelect);
  const itemSelectCierreCaja = useCierresCajaStore((s) => s.itemSelect);
  const itemSelectEmpresa = useEmpresaStore((s) => s.itemSelect);
  const { data: dataMetodosPago } = useMostrarMetodosPagoPorEmpresaQuery();
  const { data: dataVentas, isLoading: cargando } = useCuentasPorCobrarQuery();
  const { mutateAsync: mutateAbono, isPending: isAbonando } = useRegistrarAbonoMutation();

  const [isExportando, setIsExportando] = useState<"excel" | "pdf" | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [expandido, setExpandido] = useState<number | null>(null);
  const [ventaAbono, setVentaAbono] = useState<VentaPendienteRow | null>(null);
  const [montoAbono, setMontoAbono] = useState<number>(0);
  const [idMetodoAbono, setIdMetodoAbono] = useState<number | null>(null);
  const [lineasMixto, setLineasMixto] = useState<LineaAbonoUI[]>([]);

  const simbolo = itemSelectEmpresa?.simbolo_moneda ?? "S/";
  const money = crearFormateadorMoneda(simbolo);
  const metodos = ((dataMetodosPago as MetodosPagos[] | undefined) ?? []).filter(
    (m) => !!m.state && esMetodoValidoParaAbono(m.nombre),
  );
  const subMetodosMixto = metodos.filter((m) => !isMixtoMetodo(m.nombre));
  const cierreAbierto = !!itemSelectCierreCaja?.id;

  const metodoAbonoSeleccionado = metodos.find((m) => m.id === idMetodoAbono) || null;
  const modoMixtoAbono = isMixtoMetodo(metodoAbonoSeleccionado?.nombre ?? null);
  const totalMixto = useMemo(
    () => Number(lineasMixto.reduce((acc, l) => acc + l.monto, 0).toFixed(2)),
    [lineasMixto],
  );
  const totalAbono = modoMixtoAbono ? totalMixto : montoAbono;

  const clientes = useMemo(() => {
    const mapa = new Map<number, ClienteDeuda>();
    for (const v of dataVentas ?? []) {
      const idCliente = v.id_cliente ?? 0;
      const prev = mapa.get(idCliente) ?? {
        id_cliente: idCliente,
        nombre: v.clientes_proveedores?.nombres ?? "Cliente sin nombre",
        telefono: v.clientes_proveedores?.telefono ?? "-",
        saldoTotal: 0,
        ventas: [],
      };
      prev.saldoTotal += Number(v.saldo || 0);
      prev.ventas.push(v);
      mapa.set(idCliente, prev);
    }
    return Array.from(mapa.values()).sort((a, b) => b.saldoTotal - a.saldoTotal);
  }, [dataVentas]);

  const saldoTotal = useMemo(() => clientes.reduce((a, c) => a + c.saldoTotal, 0), [clientes]);
  const cantidadVentasPendientes = dataVentas?.length ?? 0;

  const clientesFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter(
      (c) => c.nombre.toLowerCase().includes(q) || c.telefono.toLowerCase().includes(q),
    );
  }, [clientes, busqueda]);

  const abrirAbono = (venta: VentaPendienteRow) => {
    setVentaAbono(venta);
    setMontoAbono(Number(venta.saldo || 0));
    setIdMetodoAbono(metodos[0]?.id ?? null);
    setLineasMixto([]);
  };

  const cerrarAbono = () => {
    setVentaAbono(null);
    setMontoAbono(0);
    setIdMetodoAbono(null);
    setLineasMixto([]);
  };

  const restanteMixto = (excluirId?: string) => {
    const saldo = Number(ventaAbono?.saldo || 0);
    const puesto = lineasMixto
      .filter((l) => l.id !== excluirId)
      .reduce((acc, l) => acc + l.monto, 0);
    return Math.max(0, Number((saldo - puesto).toFixed(2)));
  };

  const agregarLineaMixto = (m: MetodosPagos) => {
    setLineasMixto((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, idMetodoPago: m.id, nombre: m.nombre, monto: restanteMixto() },
    ]);
  };

  const editarLineaMixto = (id: string, monto: number) => {
    setLineasMixto((prev) => prev.map((l) => (l.id === id ? { ...l, monto: Math.max(0, monto) } : l)));
  };

  const quitarLineaMixto = (id: string) => {
    setLineasMixto((prev) => prev.filter((l) => l.id !== id));
  };

  const confirmarAbono = async () => {
    if (!ventaAbono || !idMetodoAbono) return;

    const lineas = modoMixtoAbono
      ? lineasMixto.map((l) => ({ id_metodo_pago: l.idMetodoPago, monto: l.monto }))
      : [{ id_metodo_pago: idMetodoAbono, monto: montoAbono }];

    if (modoMixtoAbono && lineasMixto.length === 0) {
      toast.error("Agrega los métodos con los que se está abonando.");
      return;
    }
    if (totalAbono <= 0) {
      toast.error("El monto del abono debe ser mayor a 0.");
      return;
    }

    try {
      await mutateAbono({
        id_venta: ventaAbono.id,
        saldo_actual: Number(ventaAbono.saldo || 0),
        lineas,
        id_usuario: itemSelectAsignacionSucursal?.id_usuario,
        id_cierre_caja: itemSelectCierreCaja?.id,
      });
      cerrarAbono();
    } catch {
      // el toast de error ya lo maneja la mutación
    }
  };

  const armarReporte = (): ReporteExportable => ({
    titulo: "Deudores",
    empresaNombre: itemSelectEmpresa?.nombre ?? "Empresa",
    desde: "-",
    hasta: "-",
    simboloMoneda: simbolo,
    kpis: [
      { label: "Total por cobrar", value: saldoTotal, tipo: "moneda" },
      { label: "Clientes con deuda", value: clientes.length, tipo: "entero" },
      { label: "Ventas pendientes", value: cantidadVentasPendientes, tipo: "entero" },
    ],
    secciones: [
      {
        titulo: "Clientes con saldo pendiente",
        columnas: [
          { header: "Cliente", key: "nombre", tipo: "texto", width: 28 },
          { header: "Teléfono", key: "telefono", tipo: "texto", width: 16 },
          { header: "N° de ventas", key: "cantidadVentas", tipo: "entero", width: 14 },
          { header: "Saldo pendiente", key: "saldoTotal", tipo: "moneda", width: 18 },
        ],
        filas: clientes.map((c) => ({
          nombre: c.nombre,
          telefono: c.telefono,
          cantidadVentas: c.ventas.length,
          saldoTotal: c.saldoTotal,
        })),
      },
    ],
  });

  const onExcel = async () => {
    setIsExportando("excel");
    try {
      const { exportarReporteExcel } = await import("@/features/reportes/utils/exportExcel");
      await exportarReporteExcel(armarReporte());
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo generar el Excel.");
    } finally {
      setIsExportando(null);
    }
  };

  const onPdf = async () => {
    setIsExportando("pdf");
    try {
      const { exportarReportePdf } = await import("@/features/reportes/utils/exportPdf");
      exportarReportePdf(armarReporte());
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo generar el PDF.");
    } finally {
      setIsExportando(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#131f24] p-6 font-sans">
      <Toaster position="top-center" closeButton />
      <div className="mx-auto max-w-6xl space-y-6">
        <ReporteHeader titulo="Deudores" backTo="/configurar">
          <BotonesExportar exportando={isExportando} onExcel={onExcel} onPdf={onPdf} disabled={cargando} />
        </ReporteHeader>

        {!cierreAbierto && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-sm font-bold text-amber-700 dark:text-amber-400">
            No hay un cierre de caja abierto: abre uno para poder registrar abonos.
          </div>
        )}

        <KpiGrid
          cargando={cargando}
          items={[
            { label: "Total por cobrar", value: money(saldoTotal), color: "text-amber-600 dark:text-amber-400" },
            { label: "Clientes con deuda", value: String(clientes.length) },
            { label: "Ventas pendientes", value: String(cantidadVentasPendientes) },
          ]}
        />

        <section className="flex justify-end">
          <div className="w-full max-w-sm relative">
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar deudor..."
              className="w-full rounded-2xl border border-[#E5E5E5] dark:border-[#37464f] bg-white dark:bg-[#202f36] px-5 py-3 pr-12 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-sky-400 transition-colors"
            />
            {busqueda.length > 0 && (
              <button
                type="button"
                onClick={() => setBusqueda("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl border border-[#E5E5E5] dark:border-[#37464f] bg-white dark:bg-[#202f36] px-2 py-1 text-xs font-black text-gray-500 dark:text-white/60 active:translate-y-[calc(-50%+1px)] transition"
                title="Limpiar"
              >
                X
              </button>
            )}
          </div>
        </section>

        <section className="bg-white dark:bg-[#202f36] border border-[#E5E5E5] dark:border-[#37464f] rounded-3xl overflow-hidden">
          <div className="p-5 pb-3">
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/60">
              Clientes con saldo pendiente ({clientesFiltrados.length})
            </h2>
          </div>

          <div className="px-5 pb-5 space-y-3">
            {cargando && (
              <div className="text-center text-sm font-bold text-gray-400 dark:text-white/40 py-6">Cargando...</div>
            )}

            {!cargando && clientesFiltrados.length === 0 && (
              <div className="text-center text-sm font-bold text-gray-400 dark:text-white/40 py-6">
                {clientes.length === 0
                  ? "No hay cuentas pendientes por cobrar."
                  : "Ningún deudor coincide con la búsqueda."}
              </div>
            )}

            {!cargando &&
              clientesFiltrados.map((c) => {
                const abierto = expandido === c.id_cliente;
                return (
                  <div
                    key={c.id_cliente}
                    className="border border-[#E5E5E5] dark:border-[#37464f] rounded-2xl overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandido(abierto ? null : c.id_cliente)}
                      className="w-full flex items-center justify-between gap-3 p-4 bg-gray-50 dark:bg-[#131f24] text-left"
                    >
                      <div className="min-w-0">
                        <div className="font-black text-gray-900 dark:text-white truncate">{c.nombre}</div>
                        <div className="text-xs font-bold text-gray-400 dark:text-white/40">
                          {c.telefono} · {c.ventas.length} venta{c.ventas.length === 1 ? "" : "s"} pendiente
                          {c.ventas.length === 1 ? "" : "s"}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                          {money(c.saldoTotal)}
                        </span>
                        <Icon
                          icon={abierto ? "mdi:chevron-up" : "mdi:chevron-down"}
                          width="22"
                          className="text-gray-400 dark:text-white/40"
                        />
                      </div>
                    </button>

                    {abierto && (
                      <div className="divide-y divide-[#E5E5E5]/70 dark:divide-[#37464f]">
                        {c.ventas.map((v) => (
                          <div key={v.id} className="flex items-center justify-between gap-3 p-4">
                            <div className="min-w-0">
                              <div className="text-sm font-black text-gray-900 dark:text-white">
                                {v.nro_comprobante ?? `Venta #${v.id}`}
                              </div>
                              <div className="text-xs font-bold text-gray-400 dark:text-white/40">
                                {v.fecha.replace("T", " ").slice(0, 16)} · Total {money(Number(v.monto_total || 0))}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                                {money(Number(v.saldo || 0))}
                              </span>
                              <button
                                type="button"
                                disabled={!cierreAbierto}
                                onClick={() => abrirAbono(v)}
                                className="px-3 py-2 rounded-xl text-xs font-bold uppercase border border-emerald-500/70 text-emerald-600 dark:text-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-transform"
                              >
                                Abonar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {abierto && <HistorialAbonos idsVenta={c.ventas.map((v) => v.id)} money={money} />}
                  </div>
                );
              })}
          </div>
        </section>
      </div>

      {ventaAbono && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 font-sans backdrop-blur-sm">
          <div className="relative bg-white dark:bg-[#202f36] border border-[#E5E5E5] dark:border-[#37464f] w-full max-w-sm rounded-4xl p-6 space-y-4 shadow-xl">
            <h3 className="text-xl font-black text-gray-900 dark:text-white">
              Abonar {ventaAbono.nro_comprobante ?? `venta #${ventaAbono.id}`}
            </h3>
            <p className="text-xs font-bold text-gray-400 dark:text-white/40">
              Saldo pendiente: {money(Number(ventaAbono.saldo || 0))}
            </p>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-white/40">
                Método de pago
              </label>
              <div className="mt-1 grid grid-cols-2 gap-2">
                {metodos.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setIdMetodoAbono(m.id)}
                    className={`py-2 px-3 rounded-xl font-bold uppercase text-xs border transition-colors ${
                      idMetodoAbono === m.id
                        ? "border-sky-400 text-sky-600 dark:text-sky-300 bg-sky-400/10"
                        : "border-[#E5E5E5] dark:border-[#37464f] text-gray-400 dark:text-white/50"
                    }`}
                  >
                    {m.nombre}
                  </button>
                ))}
              </div>
            </div>

            {!modoMixtoAbono ? (
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-white/40">
                  Monto del abono
                </label>
                <input
                  type="number"
                  min={0}
                  max={Number(ventaAbono.saldo || 0)}
                  step="0.01"
                  value={montoAbono}
                  onChange={(e) => setMontoAbono(Math.max(0, Number(e.target.value)))}
                  className="mt-1 w-full bg-gray-50 dark:bg-[#131f24] border border-[#E5E5E5] dark:border-[#37464f] rounded-2xl px-4 py-3 text-lg font-black text-gray-900 dark:text-white outline-none focus:border-sky-400 transition-colors"
                />
              </div>
            ) : (
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-white/40">
                  Repartir el abono
                </label>

                <div className="mt-1 flex flex-wrap gap-2">
                  {subMetodosMixto.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => agregarLineaMixto(m)}
                      className="flex items-center gap-1 py-1.5 px-3 rounded-full text-xs font-bold uppercase border border-sky-400/60 text-sky-600 dark:text-sky-300 active:scale-95 transition-transform"
                    >
                      <Icon icon="mdi:plus" width="14" />
                      {m.nombre}
                    </button>
                  ))}
                </div>

                {lineasMixto.length === 0 ? (
                  <p className="mt-3 text-xs font-bold text-gray-400 dark:text-white/40 text-center py-3 border border-dashed border-[#E5E5E5] dark:border-[#37464f] rounded-2xl">
                    Agrega los métodos con los que se está abonando.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {lineasMixto.map((linea) => (
                      <div
                        key={linea.id}
                        className="bg-gray-50 dark:bg-[#131f24] border border-[#E5E5E5] dark:border-[#37464f] rounded-2xl p-3 flex items-center justify-between gap-2"
                      >
                        <span className="text-sm font-black text-gray-900 dark:text-white truncate">
                          {linea.nombre}
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={linea.monto}
                            onChange={(e) => editarLineaMixto(linea.id, Number(e.target.value))}
                            className="bg-transparent text-right text-lg font-black text-gray-900 dark:text-white outline-none w-20"
                          />
                          <button
                            type="button"
                            onClick={() => quitarLineaMixto(linea.id)}
                            className="text-gray-400 dark:text-white/30 hover:text-rose-400 transition-colors"
                          >
                            <Icon icon="mdi:close-circle" width="20" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between px-1 text-xs font-bold text-gray-400 dark:text-white/40">
                      <span>Total repartido</span>
                      <span className="text-amber-600 dark:text-amber-400">{money(totalMixto)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={cerrarAbono}
                className="flex-1 py-3 rounded-2xl font-bold uppercase text-xs text-gray-400 dark:text-white/50 border border-[#E5E5E5] dark:border-[#37464f]"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isAbonando || totalAbono <= 0 || !idMetodoAbono}
                onClick={confirmarAbono}
                className="flex-1 py-3 rounded-2xl font-bold uppercase text-xs text-white bg-emerald-500 border-b-2 border-emerald-600 active:border-b-0 active:translate-y-0.5 disabled:opacity-40 transition-all"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const HistorialAbonos: React.FC<{ idsVenta: number[]; money: (n: number) => string }> = ({
  idsVenta,
  money,
}) => {
  const { data, isLoading } = useAbonosPorVentasQuery(idsVenta);

  return (
    <div className="bg-gray-50 dark:bg-[#131f24] border-t border-[#E5E5E5] dark:border-[#37464f] p-4">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-white/40 mb-2">
        Historial de pagos
      </h3>

      {isLoading && (
        <div className="text-xs font-bold text-gray-400 dark:text-white/40 py-2">Cargando...</div>
      )}

      {!isLoading && (data ?? []).length === 0 && (
        <div className="text-xs font-bold text-gray-400 dark:text-white/40 py-2">
          Todavía no se registraron abonos.
        </div>
      )}

      {!isLoading && (data ?? []).length > 0 && (
        <div className="space-y-2">
          {(data ?? []).map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-3 text-xs">
              <span className="font-bold text-gray-500 dark:text-white/50">
                {a.fecha_movimiento.replace("T", " ").slice(0, 16)} · {a.metodos_pago?.nombre ?? "-"}
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {money(Number(a.monto || 0))}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
