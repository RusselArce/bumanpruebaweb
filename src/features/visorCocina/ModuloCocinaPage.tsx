import React, { useState } from "react";

type TicketType = "mesa" | "takeaway";

interface KitchenItem {
  id: number;
  product: string;
  quantity: number;
  consumption: "EN LOCAL" | "PARA LLEVAR";
}

interface KitchenTicket {
  id: number;
  type: TicketType;
  tableLabel: string;
  waiter: string;
  time: string;
  minutes: number;
  hasNote: boolean;
  items: KitchenItem[];
}

// --------- DATA: 20 tickets emulados (6 por página) ----------
const ticketsData: KitchenTicket[] = Array.from({ length: 20 }, (_, i) => {
  const index = i + 1;
  const isTakeAway = index % 5 === 0 || index % 6 === 0;

  return {
    id: index,
    type: isTakeAway ? "takeaway" : "mesa",
    tableLabel: isTakeAway ? `T-${index}` : `${index}`,
    waiter: "F001-852",
    time: "11:2" + (index % 10) + " PM",
    minutes: 2 * index,
    hasNote: index % 2 === 0,
    items: [
      {
        id: 1,
        product: "DSFDF",
        quantity: 1,
        consumption: isTakeAway
          ? ("PARA LLEVAR" as const)
          : ("EN LOCAL" as const),
      },
      ...(index % 3 === 0
        ? [
            {
              id: 2,
              product: "DSFDF",
              quantity: 1,
              consumption: isTakeAway
                ? ("PARA LLEVAR" as const)
                : ("EN LOCAL" as const),
            },
          ]
        : []),
    ],
  };
});

// --------- COMPONENTES PEQUEÑOS ----------
interface BubbleBadgeProps {
  type: TicketType;
  tableLabel: string;
}

const BubbleBadge: React.FC<BubbleBadgeProps> = ({ type, tableLabel }) => {
  if (type === "takeaway") {
    return (
      <div
        className="
        min-w-[80px] h-16 rounded-[1.8rem]
        bg-gradient-to-br from-orange-400 to-amber-600
        flex items-center justify-center text-center px-3
        text-[11px] md:text-sm font-bold text-white
        shadow-[inset_0_4px_8px_rgba(255,255,255,0.5),0_10px_20px_rgba(0,0,0,0.6)]
      "
      >
        Para llevar
      </div>
    );
  }

  return (
    <div
      className="
      min-w-[64px] h-16 rounded-[1.8rem]
      bg-gradient-to-br from-lime-400 to-green-500
      flex items-center justify-center
      text-2xl md:text-3xl font-bold text-white
      shadow-[inset_0_4px_8px_rgba(255,255,255,0.5),0_10px_20px_rgba(0,0,0,0.6)]
    "
    >
      {tableLabel}
    </div>
  );
};

interface KitchenCardProps {
  ticket: KitchenTicket;
}

const KitchenCard: React.FC<KitchenCardProps> = ({ ticket }) => {
  const handlePrepareAll = () => {};
  const handleDispatchAll = () => {};
  const handleView = () => {};

  return (
    <article
      className="
        bg-gradient-to-b from-[#2b2b2b] to-[#1b1b1b]
        rounded-2xl p-3 md:p-4 text-xs md:text-sm
        shadow-[0_15px_30px_rgba(0,0,0,0.8)]
        border border-neutral-700
        flex flex-col
      "
    >
      {/* HEADER */}
      <div className="flex justify-between items-start gap-3 mb-2">
        <div className="space-y-1">
          <p className="font-semibold text-gray-100 uppercase tracking-wide">
            {ticket.type === "mesa"
              ? `MESA:  ${ticket.tableLabel}`
              : "PEDIDO PARA LLEVAR"}
          </p>
          <p className="text-[11px] text-gray-300">
            <span className="font-semibold">Mozo: </span>
            {ticket.waiter}
          </p>
          <p className="text-[11px] text-gray-400">
            ({ticket.time}){" "}
            <span className="font-semibold text-gray-100">
              {ticket.minutes} min
            </span>
          </p>
        </div>

        <BubbleBadge
          type={ticket.type}
          tableLabel={ticket.type === "mesa" ? ticket.tableLabel : ""}
        />
      </div>

      {/* BOTONES SUPERIORES */}
      <div className="flex gap-2 mb-2">
        <button
          onClick={handlePrepareAll}
          className="
            flex-1 rounded-lg bg-gradient-to-b from-gray-200/90 to-gray-500/90
            text-[11px] font-semibold text-black py-1.5
            shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),0_3px_6px_rgba(0,0,0,0.5)]
            hover:brightness-110 active:scale-95 transition-all
          "
        >
          Preparar Todos
        </button>
        <button
          onClick={handleDispatchAll}
          className="
            flex-1 rounded-lg bg-gradient-to-b from-gray-200/90 to-gray-500/90
            text-[11px] font-semibold text-black py-1.5
            shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),0_3px_6px_rgba(0,0,0,0.5)]
            hover:brightness-110 active:scale-95 transition-all
          "
        >
          Despachar Todos
        </button>
      </div>

      {/* TABLA DE ITEMS */}
      <div className="bg-black/40 rounded-lg border border-white/10 overflow-hidden flex-1">
        <div className="grid grid-cols-[80px,1fr,40px,90px] gap-1 px-2 py-1 border-b border-white/10 text-[10px] text-gray-300">
          <span></span>
          <span>Producto</span>
          <span className="text-center">Cant</span>
          <span className="text-center">Consumo</span>
        </div>

        {ticket.items.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-[80px,1fr,40px,90px] gap-1 px-2 py-1 items-center text-[11px] text-gray-100"
          >
            <button
              className="
                text-[11px] px-2 py-1 rounded-md
                bg-gradient-to-b from-gray-200 to-gray-500
                text-black font-semibold
                shadow-[inset_0_1px_3px_rgba(255,255,255,0.9),0_2px_4px_rgba(0,0,0,0.6)]
                hover:brightness-110 active:scale-95 transition-all
              "
            >
              Preparar
            </button>
            <span>{item.product}</span>
            <span className="text-center">{item.quantity.toFixed(2)}</span>
            <span className="text-center">{item.consumption}</span>
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <div className="flex items-center justify-end gap-2 mt-2">
        {ticket.hasNote && (
          <span className="text-[11px] text-red-400 font-semibold mr-auto">
            ¡Hay nota!
          </span>
        )}
        <button
          onClick={handleView}
          className="
            px-3 py-1.5 rounded-lg text-xs font-bold
            bg-gradient-to-br from-red-500 to-orange-500
            shadow-[inset_0_2px_4px_rgba(255,255,255,0.5),0_4px_8px_rgba(0,0,0,0.7)]
            text-white hover:scale-105 active:scale-95 transition-transform
          "
        >
          Ver
        </button>
      </div>
    </article>
  );
};

// --------- PAGINA PRINCIPAL: GRID + PAGINADOR ----------
export const ModuloCocinaPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<number>(1);

  const pageSize = 6;
  const totalPages = Math.ceil(ticketsData.length / pageSize);

  const startIndex = (currentPage - 1) * pageSize;
  const currentTickets = ticketsData.slice(startIndex, startIndex + pageSize);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen w-screen bg-black flex items-center justify-center px-2 py-4 text-white">
      <section
        className="
          bg-[#202020]
          rounded-[24px]
          border border-neutral-700
          shadow-[0_20px_40px_rgba(0,0,0,0.9)]
          w-full max-w-6xl
          h-[90vh]
          flex flex-col
        "
      >
        {/* GRID */}
        <div className="flex-1 overflow-auto px-3 py-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
            {currentTickets.map((ticket) => (
              <KitchenCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        </div>

        {/* PAGINADOR */}
        <div className="border-t border-neutral-700 px-3 py-2">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-semibold
                bg-gradient-to-b from-gray-300 to-gray-500
                text-black shadow-md
                disabled:opacity-40 disabled:cursor-not-allowed
              `}
            >
              Anterior
            </button>

            {pages.map((page) => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`
                  w-8 h-8 rounded-full text-xs font-bold
                  flex items-center justify-center
                  ${
                    page === currentPage
                      ? "bg-gradient-to-br from-lime-400 to-green-600 text-black shadow-[0_0_10px_rgba(132,204,22,0.8)]"
                      : "bg-gradient-to-b from-gray-300 to-gray-500 text-black hover:brightness-110"
                  }
                `}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-semibold
                bg-gradient-to-b from-gray-300 to-gray-500
                text-black shadow-md
                disabled:opacity-40 disabled:cursor-not-allowed
              `}
            >
              Siguiente
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
