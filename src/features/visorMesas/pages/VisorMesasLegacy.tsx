import React, { useEffect, useState } from "react";
import { MenuHerramientas } from "../../herramientas/components/MenuHerramientas";
import { useAuthStore, useSubcription } from "@/shared/store/auth.store";
import { useMostrarSalonesPorSucursalQuery } from "@/features/salones/hooks/salones.queries";
import { BmMesa, BmSalones } from "@/shared/types/db/tablas";
import { useSalonesStore } from "@/features/salones/store/salones.store";
import { useMostrarMesasPorSalonQuery } from "@/features/mesas/hooks/mesas.queries";

enum TableStatus {
  Libre = "libre",
  Ocupada = "ocupada",
  PorCobrar = "por_cobrar",
  Reservada = "reservada",
  FueraDeServicio = "fuera_de_servicio",
}
const STATUS_COLORS: Record<TableStatus, string> = {
  [TableStatus.Libre]: "from-lime-400 to-green-600",
  [TableStatus.Ocupada]: "from-pink-500 to-fuchsia-600",
  [TableStatus.PorCobrar]: "from-yellow-400 to-amber-600",
  [TableStatus.Reservada]: "from-sky-400 to-indigo-700",
  [TableStatus.FueraDeServicio]: "from-zinc-500 to-zinc-800",
};

interface TableData {
  id: number;
  status: TableStatus;
  position: {
    top: string;
    left: string;
  };
  user?: string;
}

interface RoomData {
  name: string;
  tables: BmMesa[];
}

// ActionButton Component
interface ActionButtonProps {
  text: string;
  color: "green" | "orange" | "red";
  onClick?: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  text,
  color,
  onClick,
}) => {
  const colorClasses = {
    green: "from-lime-400 to-green-600 hover:from-lime-300 hover:to-green-500",
    orange:
      "from-orange-400 to-amber-600 hover:from-orange-300 hover:to-amber-500",
    red: "from-red-500 to-rose-700 hover:from-red-400 hover:to-rose-600",
  };

  const baseClasses =
    "p-3 h-16 rounded-2xl text-white font-semibold flex items-center justify-center text-center shadow-md transition-all duration-200 transform hover:scale-105";

  const gradientClasses = `bg-gradient-to-br ${colorClasses[color]}`;

  const glossyEffect =
    "shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_5px_10px_rgba(0,0,0,0.3)]";

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${gradientClasses} ${glossyEffect}`}
    >
      {text}
    </button>
  );
};
type MesaConEstado = BmMesa & {
  bm_estados_mesa?: { nombre: string | null } | null;
};

// Table Component
interface TableProps {
  tableData: MesaConEstado;
}

const Table: React.FC<TableProps> = ({ tableData }) => {
  const top = tableData.top ?? "50%";
  const left = tableData.left ?? "50%";

  // nombre desde la relación (ej: "libre", "ocupada", ...)
  const nombreEstado = (tableData.bm_estados_mesa?.nombre ?? "libre").toLowerCase();

  // convertir a TableStatus con fallback
  const status: TableStatus = (
    Object.values(TableStatus) as string[]
  ).includes(nombreEstado)
    ? (nombreEstado as TableStatus)
    : TableStatus.Libre;

  const gradientClasses = `bg-gradient-to-br ${STATUS_COLORS[status]}`;

  return (
    <div
      className={`absolute w-28 h-28 md:w-32 md:h-32 flex flex-col items-center justify-center rounded-3xl shadow-lg cursor-pointer transition-all duration-300 transform hover:scale-110 hover:shadow-2xl text-white font-bold ${gradientClasses} shadow-[inset_0_4px_8px_rgba(255,255,255,0.4),0_10px_20px_rgba(0,0,0,0.4)]`}
      style={{ top, left, transform: "translate(-50%, -50%)" }}
    >
      <span className="text-3xl">{tableData.numero}</span>
      <span className="text-xs opacity-80 mt-1">{nombreEstado}</span>
    </div>
  );
};

// Sidebar Component
interface SidebarProps {
  rooms: BmSalones[];
  selectedRoom: BmSalones["id"] | null;
  onSelectRoom: (room: BmSalones) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  rooms,
  selectedRoom,
  onSelectRoom,
}) => {
  const { cerrarSesion } = useAuthStore();
  const { user } = useSubcription();
  const [stateMenuHerramientas, setStateMenuHerramientas] = useState<boolean>();
  const { setItemSelect, itemSelect } = useSalonesStore();
  return (
    <aside className="bg-[#1C1C1C] w-full md:w-64 p-4 flex flex-col flex-shrink-0 relative">
      <h1 className="text-3xl font-bold mb-8 text-gray-300">Salones</h1>

      <nav className="flex-grow">
        <ul>
          {rooms.map((room) => (
            <li
              key={room.id}
              className={`p-3 my-2 rounded-lg cursor-pointer transition-all duration-200 text-lg ${
                itemSelect?.id === room.id
                  ? "bg-gray-700 text-white font-semibold"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
              onClick={() => setItemSelect(room)}
            >
              {room.nombre}
            </li>
          ))}
        </ul>
      </nav>

      <span>
        salon seleccionado: {itemSelect?.nombre} + id_salon: {itemSelect?.id}
      </span>
      {user?.email}
      <div className="grid grid-cols-2 gap-3">
        <ActionButton color="green" text="Para llevar" />
        <ActionButton color="green" text="Cambio de mesa" />
        <ActionButton color="green" text="Ver cuentas" />
        <ActionButton color="orange" text="Salir" onClick={cerrarSesion} />
        <div className="col-span-2">
          <ActionButton
            color="red"
            text="Herramientas"
            onClick={() => setStateMenuHerramientas(!stateMenuHerramientas)}
          />
        </div>
      </div>
      {stateMenuHerramientas && <MenuHerramientas />}
    </aside>
  );
};

// MainContent Component
interface MainContentProps {
  tables?: BmMesa[]; // puede ser undefined al inicio
}

const MainContent: React.FC<MainContentProps> = ({ tables }) => {
  return (
    <main className="flex-1 p-4 md:p-8 relative overflow-auto">
      <div className="relative w-full h-full">
        {tables?.map((table) => (
          <Table key={table.id} tableData={table} />
        ))}
      </div>
    </main>
  );
};

// Data
const initialRooms: RoomData[] = [
  {
    name: "Principal",
    tables: [
      {
        id: 1,
        status: TableStatus.Available,
        position: { top: "10%", left: "25%" },
      },
      {
        id: 2,
        status: TableStatus.Occupied,
        user: "admin",
        position: { top: "20%", left: "50%" },
      },
      {
        id: 3,
        status: TableStatus.Available,
        position: { top: "55%", left: "35%" },
      },
      {
        id: 4,
        status: TableStatus.Available,
        position: { top: "40%", left: "70%" },
      },
      {
        id: 5,
        status: TableStatus.Available,
        position: { top: "65%", left: "80%" },
      },
    ],
  },
  {
    name: "BAR",
    tables: [
      {
        id: 6,
        status: TableStatus.Available,
        position: { top: "15%", left: "15%" },
      },
      {
        id: 7,
        status: TableStatus.Occupied,
        user: "staff",
        position: { top: "45%", left: "45%" },
      },
      {
        id: 8,
        status: TableStatus.Available,
        position: { top: "75%", left: "75%" },
      },
    ],
  },
  {
    name: "Terraza",
    tables: [
      {
        id: 9,
        status: TableStatus.Available,
        position: { top: "20%", left: "20%" },
      },
      {
        id: 10,
        status: TableStatus.Available,
        position: { top: "20%", left: "70%" },
      },
      {
        id: 11,
        status: TableStatus.Occupied,
        user: "vip",
        position: { top: "60%", left: "50%" },
      },
    ],
  },
];

// Main App Component
export const VisorMesasPage: React.FC = () => {
  //const [rooms] = useState<RoomData[]>(initialRooms);
  const [selectedRoomName, setSelectedRoomName] = useState<string>(
    initialRooms[0].name
  );
  const [selectedSalonId, setSelectedSalonId] = useState<number | null>(null);
  const { itemSelect, setItemSelect } = useSalonesStore();
  // const selectedRoom = rooms.find((room) => room.name === selectedRoomName);
  const {
    data: salones = [],
    isLoading,
    error,
  } = useMostrarSalonesPorSucursalQuery(1);
  // ✅ auto-selección segura (NO en render)
  useEffect(() => {
    if (!itemSelect && salones.length > 0) {
      setItemSelect(salones[0]);
      setSelectedSalonId(salones[0].id);
    }
  }, [itemSelect, salones, setItemSelect]);
  const { data: dataMesas=[] } = useMostrarMesasPorSalonQuery(
    itemSelect?.id as number
  );
  return (
    <div className="flex flex-col md:flex-row h-screen w-screen bg-black text-white overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-white">
            Cargando salones...
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
          <div className="max-w-md rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-red-200">
            <div className="font-semibold">Error cargando salones</div>
            <div className="text-sm opacity-90 mt-1">
              {(error as Error).message}
            </div>
          </div>
        </div>
      )}

      <Sidebar
        rooms={salones}
        selectedRoom={selectedSalonId}
        onSelectRoom={(room) => setSelectedSalonId(room.id)}
      />
      {itemSelect?.id && <MainContent tables={dataMesas} />}
    </div>
  );
};
