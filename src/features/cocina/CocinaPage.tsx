import React, { useEffect, useMemo, useState } from "react";
import { useMostrarDetalleVentaPorEstadoQuery } from "@/features/detalle_ventas/hooks/detalle_ventas.queries";
import { useSupabaseSubscription } from "@/shared/hooks/useSupabaseSubscription";
import { useEditarEstadoMutate } from "@/features/detalle_ventas/hooks/detalle_ventas.mutations";
import { toast } from "sonner";
import { NOMBRE_MESA_PARA_LLEVAR } from "@/features/visorMesas/hooks/useIniciarParaLlevar";

/** =========================
 * TIPOS
 * ========================= */
type EstadoKDS = "en_cocina" | "en_proceso" | "en_despacho";

type ItemKDS = {
  id: number;
  pedidoId: number;
  producto: string;
  cant: number;
  estado: EstadoKDS;
  mesa: string | null;
  cliente: string | null;
  minutos: number;
  nota?: string;
};

/** Cuánto tiempo se muestra un pedido en la bandeja de "Entregados" antes de
 * desaparecer solo (estilo bump-bar de KFC/McDonald's). */
const TIEMPO_EN_BANDEJA_MS = 90_000;

type EntregaReciente = { item: ItemKDS; entregadoAt: number };

type DetalleVentaRow = {
  id: number;
  id_venta: number;
  cantidad: number;
  descripcion: string | null;
  estado: string;
  nota: string | null;
  ventas?: {
    id_mesa?: number | null;
    nombre_ref?: string | null;
    mesas?: {
      nombre?: string | null;
    } | null;
  } | null;
};

/** =========================
 * HELPERS
 * ========================= */
function cn(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function mapEstadoDBToKDS(estadoDB: string): EstadoKDS {
  const s = (estadoDB || "").toLowerCase();
  if (s.includes("cocina") || s.includes("cola") || s.includes("pend")) return "en_cocina";
  if (s.includes("proceso") || s.includes("prep") || s.includes("fuego")) return "en_proceso";
  if (s.includes("listo") || s.includes("ready") || s.includes("despacho")) return "en_despacho";
  return "en_cocina";
}

function minutosDemoDesdeId(id: number) {
  return Math.max(1, (id % 25) + 1);
}

/** =========================
 * PAGE
 * ========================= */
export function CocinaPage() {
  const { mutate: editarEstado } = useEditarEstadoMutate();
  
  const { data: dataEnCocina, isLoading, isError,error } =
    useMostrarDetalleVentaPorEstadoQuery({ estado: "en_cocina" });

  const [items, setItems] = useState<ItemKDS[]>([]);
  const [entregados, setEntregados] = useState<EntregaReciente[]>([]);

  /** Tick cada segundo: refresca el "hace Xs" de la bandeja y purga vencidos */
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setTick((n) => n + 1);
      setEntregados((prev) =>
        prev.filter((e) => Date.now() - e.entregadoAt < TIEMPO_EN_BANDEJA_MS),
      );
    }, 1000);
    return () => clearInterval(id);
  }, []);

  /** SINCRONIZACIÓN INICIAL Y LIMPIEZA */
  useEffect(() => {
    const rows = (dataEnCocina ?? []) as DetalleVentaRow[];
    
    // Si la query no trae nada, limpiamos el estado para que no queden items pegados
    if (rows.length === 0) {
      setItems([]);
      return;
    }

    const mapped: ItemKDS[] = rows.map((r) => {
      const nombreMesa = r.ventas?.mesas?.nombre ?? null;
      const esParaLlevar = (nombreMesa ?? "").trim().toLowerCase() === NOMBRE_MESA_PARA_LLEVAR;

      return {
        id: r.id,
        pedidoId: r.id_venta,
        producto: r.descripcion ?? `Item #${r.id}`,
        cant: Number(r.cantidad ?? 1),
        estado: mapEstadoDBToKDS(r.estado),
        mesa: esParaLlevar
          ? null
          : nombreMesa ?? (r.ventas?.id_mesa != null ? String(r.ventas.id_mesa) : null),
        cliente: esParaLlevar ? r.ventas?.nombre_ref?.trim() || "Para llevar" : null,
        minutos: minutosDemoDesdeId(r.id),
        nota: r.nota ?? undefined,
      };
    });

    setItems(mapped);
  }, [dataEnCocina]);

  useSupabaseSubscription({
    channelName: "public:detalle-venta",
    options: { event: "*", schema: "public", table: "detalle_venta" },
    queryKey: ["mostrar detalle venta por estado"],
  });

  /** LÓGICA DE MOVIMIENTO CON FILTRADO MANUAL */
  const mover = (item: ItemKDS, direccion: 1 | -1) => {
    const estados: EstadoKDS[] = ["en_cocina", "en_proceso", "en_despacho"];
    const actualIdx = estados.indexOf(item.estado);
    const nuevoIdx = actualIdx + direccion;

    // CASO: ENTREGAR (Sale de las 3 columnas y pasa a la bandeja inferior)
    if (nuevoIdx >= estados.length) {
      editarEstado({ id: item.id, estado: "listo" }, {
        onSuccess: () => {
          setItems((prev) => prev.filter((it) => it.id !== item.id));
          setEntregados((prev) =>
            [{ item, entregadoAt: Date.now() }, ...prev].slice(0, 15),
          );
          toast.success("Pedido finalizado");
        },
      });
      return;
    }

    // CASO: MOVIMIENTO NORMAL
    if (nuevoIdx >= 0) {
      const nuevoEstado = estados[nuevoIdx];
      editarEstado({ id: item.id, estado: nuevoEstado }, {
        onSuccess: () => {
          // Actualizamos el estado local para mover el item de columna
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id ? { ...it, estado: nuevoEstado } : it
            )
          );
        },
      });
    }
  };

  /** Deshace una entrega: la regresa a "Para entrega" y sale de la bandeja */
  const deshacerEntrega = (entrega: EntregaReciente) => {
    editarEstado({ id: entrega.item.id, estado: "en_despacho" }, {
      onSuccess: () => {
        setEntregados((prev) => prev.filter((e) => e.item.id !== entrega.item.id));
        setItems((prev) => [...prev, { ...entrega.item, estado: "en_despacho" }]);
        toast.info("Pedido regresado a Para Entrega");
      },
    });
  };

  const cola = useMemo(() => items.filter((i) => i.estado === "en_cocina"), [items]);
  const proceso = useMemo(() => items.filter((i) => i.estado === "en_proceso"), [items]);
  const despacho = useMemo(() => items.filter((i) => i.estado === "en_despacho"), [items]);

  return (
    <div className="flex h-screen w-full flex-col bg-gray-100 dark:bg-[#0b0e11] font-sans text-gray-900 dark:text-white uppercase overflow-hidden">
      <header className="flex items-center justify-between border-b-4 border-gray-200 dark:border-white/5 bg-white dark:bg-[#1a1f26] px-8 py-4">
        <div className="flex items-center gap-4">

          <div>
            <h1 className="text-xl font-black tracking-tighter">
              COCINA <span className="text-[#fa472c]">EN VIVO</span>
            </h1>
            <p className="text-[10px] font-black text-gray-400 dark:text-white/30 tracking-widest leading-none">
              {isLoading ? "Cargando..." : isError ? `Error ${error.message}` : ""}
            </p>
          </div>
        </div>
      </header>

      <main className="grid flex-1 min-h-0 grid-cols-3 divide-x-4 divide-gray-200 dark:divide-white/5">
        <ColumnaKDS
          titulo="Pendiente"
          color="text-gray-400 dark:text-white/40"
          items={cola}
          onAction={(it) => mover(it, 1)}
        />

        <ColumnaKDS
          titulo="PREPARANDO"
          color="text-orange-500"
          items={proceso}
          onAction={(it) => mover(it, 1)}
          onBack={(it) => mover(it, -1)}
        />

        <ColumnaKDS
          titulo="Para Entrega"
          color="text-[#58cc02]"
          items={despacho}
          onAction={(it) => mover(it, 1)}
          onBack={(it) => mover(it, -1)}
          isLast
        />
      </main>

      <BandejaEntregados entregas={entregados} onDeshacer={deshacerEntrega} />
    </div>
  );
}

/** =========================
 * BANDEJA DE ENTREGADOS (estilo bump-bar KFC/McDonald's)
 * No es una 4ª columna: es una franja angosta que solo aparece cuando hay
 * pedidos recién entregados y se autolimpia sola, para no competir por
 * espacio con Pendiente / Preparando / Para entrega.
 * ========================= */
function BandejaEntregados({
  entregas,
  onDeshacer,
}: {
  entregas: EntregaReciente[];
  onDeshacer: (e: EntregaReciente) => void;
}) {
  if (entregas.length === 0) return null;

  return (
    <div className="flex items-center gap-4 border-t-4 border-gray-200 dark:border-white/5 bg-gray-100 dark:bg-black/60 px-6 py-3 shrink-0">
      <span className="shrink-0 text-[10px] font-black tracking-[0.3em] text-[#58cc02]">
        ENTREGADOS <span className="text-gray-400 dark:text-white/20">({entregas.length})</span>
      </span>

      <div className="flex flex-1 gap-3 overflow-x-auto">
        {entregas.map((e) => {
          const segundos = Math.max(0, Math.floor((Date.now() - e.entregadoAt) / 1000));
          const restante = Math.max(0, Math.round(TIEMPO_EN_BANDEJA_MS / 1000) - segundos);
          const expirando = restante <= 15;

          return (
            <div
              key={e.item.id}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl border-l-4 border-[#58cc02] bg-white dark:bg-[#1a1f26] px-3 py-2 transition-opacity duration-700",
                expirando && "opacity-40",
              )}
            >
              <span className="text-base text-[#58cc02]">✓</span>
              <div className="leading-tight">
                <p className="text-[11px] font-black text-gray-900 dark:text-white">
                  {e.item.cliente ? e.item.cliente : `Mesa ${e.item.mesa ?? "?"}`}
                </p>
                <p className="text-[9px] font-bold text-gray-400 dark:text-white/30">
                  {e.item.cant}x {e.item.producto} · hace {segundos}s
                </p>
              </div>
              <button
                onClick={() => onDeshacer(e)}
                title="Deshacer entrega"
                className="ml-1 rounded-lg px-2 py-1 text-xs font-black text-gray-400 dark:text-white/30 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-white"
              >
                ↺
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** =========================
 * COLUMNA (DISEÑO INTACTO)
 * ========================= */
type ColumnaProps = {
  titulo: string;
  color: string;
  items: ItemKDS[];
  onAction: (item: ItemKDS) => void;
  onBack?: (item: ItemKDS) => void;
  isLast?: boolean;
};

function ColumnaKDS({ titulo, items, onAction, onBack, isLast, color }: ColumnaProps) {
  const safeItems = items ?? [];

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-gray-50 dark:bg-black/20">
      <div className="p-4 bg-gray-100 dark:bg-black/40 border-b-2 border-gray-200 dark:border-white/5">
        <h2 className={cn("text-center font-black text-2xs tracking-[0.3em]", color)}>
          {titulo} <span className="text-gray-400 dark:text-white/20"  >({safeItems.length})</span>
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {safeItems.map((it) => {
          const esUrgente = it.minutos >= 15;
          const esLlevar = it.cliente !== null;
          const enProceso = it.estado === "en_proceso";

          return (
            <div
              key={it.id}
              className={cn(
                "relative rounded-[2rem] border-b-8 p-5 transition-all active:scale-95 shadow-xl",
                esUrgente
                  ? "bg-[#ff4b4b] border-[#d33131]"
                  : enProceso
                  ? "bg-orange-50 dark:bg-[#2b1f11] border-orange-200 dark:border-[#1f160c]"
                  : esLlevar
                  ? "bg-white dark:bg-[#1a1f26] border-gray-200 dark:border-[#13171d] ring-2 ring-orange-500/20"
                  : "bg-white dark:bg-[#1a1f26] border-gray-200 dark:border-[#13171d]"
              )}
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "h-12 w-12 rounded-full flex items-center justify-center font-black text-xl shadow-inner",
                      esUrgente ? "bg-white text-[#ff4b4b]" : "bg-[#58cc02] text-white"
                    )}
                  >
                    {it.cliente ? "🥡" : it.mesa ?? "?"}
                  </div>
                  <div>
                    <h3 className="text-lg font-black leading-none">
                      {it.cliente ? it.cliente : `Mesa ${it.mesa ?? "?"}`}
                    </h3>
                    <p className="text-[9px] font-black opacity-40 uppercase mt-1 tracking-widest">
                      {it.cliente ? "🥡 Llevar" : "🪑 Local"} • #{it.pedidoId}
                    </p>
                  </div>
                </div>
                <div className={cn("text-xl font-black", esUrgente ? "text-white" : "text-gray-300 dark:text-white/20")}>
                  {it.minutos}'
                </div>
              </div>

              <div className="bg-gray-100 dark:bg-black/20 rounded-2xl p-4 mb-4 flex items-center gap-4">
                <span className="text-4xl font-black text-gray-900 dark:text-white">{it.cant}</span>
                <div className="flex-1">
                  <p className="text-lg font-black leading-tight tracking-tight">{it.producto}</p>
                  {it.nota && (
                    <p className="text-[10px] font-black text-orange-400 mt-1 italic">
                      ¡ {it.nota} !
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {onBack && (
                  <button
                    onClick={() => onBack(it)}
                    className="bg-gray-200 hover:bg-gray-300 dark:bg-[#3c444d] dark:hover:bg-[#4b5563] text-gray-900 dark:text-white px-5 py-3 rounded-2xl font-black shadow-[0_4px_0_#ccc] dark:shadow-[0_4px_0_#2a2f36] active:shadow-none active:translate-y-1 transition-all text-xs"
                  >
                    ←
                  </button>
                )}

                <button
                  onClick={() => onAction(it)}
                  className={cn(
                    "flex-1 py-4 rounded-2xl font-black text-xs tracking-widest transition-all active:shadow-none active:translate-y-1",
                    isLast
                      ? "bg-[#58cc02] hover:bg-[#61e002] shadow-[0_4px_0_#46a302] text-white"
                      : "bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 shadow-[0_4px_0_#ccc] dark:shadow-[0_4px_0_#000] text-gray-900 dark:text-white"
                  )}
                >
                  {isLast ? "ENTREGAR" : "SIGUIENTE →"}
                </button>
              </div>
            </div>
          );
        })}

        {safeItems.length === 0 && (
          <div className="rounded-3xl border border-dashed border-gray-300 dark:border-white/10 p-8 text-center text-sm text-gray-400 dark:text-white/50 italic">
            Sin pedidos en esta fase
          </div>
        )}
      </div>
    </div>
  );
}