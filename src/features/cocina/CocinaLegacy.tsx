import { useMostrarDetalleVentaPorEstadoQuery } from "@/features/detalle_ventas/hooks/detalle_ventas.queries";
import React, { useState } from "react";

/** =========================
 * TIPOS
 * ========================= */
type EstadoKDS = "COLA" | "PROCESO" | "LISTO";

type ItemKDS = {
  id: string;
  pedidoId: number;
  producto: string;
  cant: number;
  estado: EstadoKDS;
  mesa: number | null; 
  cliente: string | null;
  minutos: number;
  nota?: string;
};

/** =========================
 * DATA REAL (MESAS 5, 6, 7, 8, 10...)
 * ========================= */
const MOCK_ITEMS: ItemKDS[] = [
  // MESA 5: 3 items en distintos estados
  { id: "m5-a", pedidoId: 1005, producto: "Caldo de Gallina", cant: 1, estado: "PROCESO", mesa: 5, cliente: null, minutos: 18 },
  { id: "m5-b", pedidoId: 1005, producto: "Presa Especial", cant: 1, estado: "COLA", mesa: 5, cliente: null, minutos: 18 },
  { id: "m5-c", pedidoId: 1005, producto: "Chicha Morada", cant: 1, estado: "LISTO", mesa: 5, cliente: null, minutos: 18 },

  // MESA 6: Pedido nuevo
  { id: "m6-a", pedidoId: 1006, producto: "Lomo Saltado", cant: 2, estado: "COLA", mesa: 6, cliente: null, minutos: 4 },
  { id: "m6-b", pedidoId: 1006, producto: "Papas Extra", cant: 1, estado: "COLA", mesa: 6, cliente: null, minutos: 4 },

  // MESA 7: Para llevar (Nombre)
  { id: "m7-a", pedidoId: 1007, producto: "Ceviche Mixto", cant: 1, estado: "PROCESO", mesa: 7, cliente: "CARLOS R.", minutos: 12, nota: "Para llevar" },

  // MESA 8: Pedido crítico
  { id: "m8-a", pedidoId: 1008, producto: "Sopa Criolla", cant: 3, estado: "COLA", mesa: 8, cliente: null, minutos: 25 },

  // MESA 10: Solo bebidas
  { id: "m10-a", pedidoId: 1010, producto: "Inca Kola 1.5L", cant: 1, estado: "LISTO", mesa: 10, cliente: null, minutos: 2 },
  
  // CLIENTE EXTERNO (Para llevar directo)
  { id: "ext-1", pedidoId: 1011, producto: "Mostrito Power", cant: 1, estado: "COLA", mesa: null, cliente: "VANESSA", minutos: 8 }
];

export function CocinaPage() {
    const {data:dataEnCocina} = useMostrarDetalleVentaPorEstadoQuery({estado:"en_cocina"})
  const [items, setItems] = useState<ItemKDS[]>(MOCK_ITEMS);

  const mover = (id: string, direccion: 1 | -1) => {
    const estados: EstadoKDS[] = ["COLA", "PROCESO", "LISTO"];
    setItems(prev => prev.map(it => {
      if (it.id !== id) return it;
      const actualIdx = estados.indexOf(it.estado);
      const nuevoIdx = Math.max(0, Math.min(2, actualIdx + direccion));
      return { ...it, estado: estados[nuevoIdx] };
    }));
  };

  const eliminar = (id: string) => setItems(prev => prev.filter(it => it.id !== id));

  return (
    <div className="flex h-screen w-full flex-col bg-[#0b0e11] font-sans text-white uppercase overflow-hidden">
      {/* HEADER DUOLINGO STYLE */}
      <header className="flex items-center justify-between border-b-4 border-white/5 bg-[#1a1f26] px-8 py-4">
        <div className="flex items-center gap-4">
          <div className="bg-[#58cc02] p-2 rounded-xl shadow-[0_4px_0_#46a302]">
            <span className="text-2xl font-black text-white">7</span>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter">COCINA <span className="text-[#58cc02]">EN VIVO</span></h1>
            <p className="text-[10px] font-black text-white/30 tracking-widest leading-none">Status: Operativo</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setItems(MOCK_ITEMS)} className="bg-[#1cb0f6] px-6 py-2 rounded-xl font-black text-xs shadow-[0_4px_0_#1899d6] active:translate-y-1 active:shadow-none transition-all">RESETEAR</button>
        </div>
      </header>

      {/* COLUMNAS */}
      <main className="grid flex-1 grid-cols-3 divide-x-4 divide-white/5">
        <ColumnaKDS titulo="Pendiente" color="text-white/40" items={items.filter(i => i.estado === "COLA")} onAction={(id) => mover(id, 1)} />
        <ColumnaKDS titulo="En Fuego" color="text-orange-500" items={items.filter(i => i.estado === "PROCESO")} onAction={(id) => mover(id, 1)} onBack={(id) => mover(id, -1)} />
        <ColumnaKDS titulo="Para Entrega" color="text-[#58cc02]" items={items.filter(i => i.estado === "LISTO")} onAction={eliminar} onBack={(id) => mover(id, -1)} isLast />
      </main>
    </div>
  );
}

function ColumnaKDS({ titulo, items, onAction, onBack, isLast, color }: any) {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-black/20">
      <div className="p-4 bg-black/40 border-b-2 border-white/5">
        <h2 className={`text-center font-black text-xs tracking-[0.3em] ${color}`}>{titulo}</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {items.map((it: ItemKDS) => {
          const esUrgente = it.minutos >= 15;
          const esLlevar = it.cliente !== null;

          return (
            <div key={it.id} className={`relative rounded-[2rem] border-b-8 p-5 transition-all active:scale-95 ${
              esUrgente ? 'bg-[#ff4b4b] border-[#d33131] animate-pulse' : 
              esLlevar ? 'bg-[#2b1f11] border-[#1f160c]' : 'bg-[#1a1f26] border-[#13171d]'
            }`}>
              
              {/* HEADER CARD: MESA O NOMBRE */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center font-black text-xl shadow-inner ${
                    esUrgente ? 'bg-white text-[#ff4b4b]' : 'bg-[#58cc02] text-white'
                  }`}>
                    {it.mesa || "?"}
                  </div>
                  <div>
                    <h3 className="text-lg font-black leading-none">
                      {it.cliente ? it.cliente : `Mesa ${it.mesa}`}
                    </h3>
                    <p className="text-[9px] font-black opacity-40 uppercase mt-1 tracking-widest">
                      {it.cliente ? "🥡 Llevar" : "🪑 Local"} • #{it.pedidoId}
                    </p>
                  </div>
                </div>
                <div className={`text-xl font-black ${esUrgente ? 'text-white' : 'text-white/20'}`}>
                  {it.minutos}'
                </div>
              </div>

              {/* PRODUCTO */}
              <div className="bg-black/20 rounded-2xl p-4 mb-4 flex items-center gap-4">
                <span className="text-4xl font-black text-white">{it.cant}</span>
                <div className="flex-1">
                  <p className="text-lg font-black leading-tight tracking-tight">{it.producto}</p>
                  {it.nota && <p className="text-[10px] font-black text-orange-400 mt-1">¡ {it.nota} !</p>}
                </div>
              </div>

              {/* BOTONES DUOLINGO STYLE */}
              <div className="flex gap-2">
                {onBack && (
                  <button onClick={() => onBack(it.id)} className="bg-[#3c444d] hover:bg-[#4b5563] px-5 py-3 rounded-2xl font-black shadow-[0_4px_0_#2a2f36] active:shadow-none active:translate-y-1 transition-all text-xs">
                    ←
                  </button>
                )}
                <button 
                  onClick={() => onAction(it.id)} 
                  className={`flex-1 py-4 rounded-2xl font-black text-xs tracking-widest transition-all active:shadow-none active:translate-y-1 ${
                    isLast 
                    ? "bg-[#58cc02] hover:bg-[#61e002] shadow-[0_4px_0_#46a302] text-white" 
                    : "bg-white/5 hover:bg-white/10 shadow-[0_4px_0_#000] text-white"
                  }`}
                >
                  {isLast ? "DESPACHAR" : "SIGUIENTE"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}