import { BmMesa } from "@/shared/types/db/tablas";

export enum TableStatus {
  Libre = "libre",
  Ocupada = "ocupada",
  Bloqueada = "bloqueada",
 
}

export const STATUS_COLORS: Record<TableStatus, string> = {
  [TableStatus.Libre]: "from-lime-400 to-green-600",
  [TableStatus.Ocupada]: "from-pink-500 to-fuchsia-600",
  [TableStatus.Bloqueada]: "from-yellow-400 to-amber-600",
  
};

export function mesaToStatus(mesa: BmMesa): TableStatus {
  const nombre = (mesa.estado);
  return (Object.values(TableStatus) as string[]).includes(nombre)
    ? (nombre as TableStatus)
    : TableStatus.Libre;
}
