import { useQuery } from "@tanstack/react-query";
import { Mesas, Salones, Sucursales } from "@/shared/types/db/tablas";
import { buscarMesaParaLlevarPorSucursal, mostrarMesasPorSalon } from "../api/mesas.api";

export const useMostrarMesasPorSalonQuery = (id_salon:Salones["id"]) => {
  return useQuery<Mesas[]> ({
    queryKey: ["mostrar mesas por salon",id_salon],
    queryFn:()=> mostrarMesasPorSalon(id_salon),
    enabled: !!id_salon,
  });
};

export const useMesaParaLlevarQuery = (id_sucursal?: Sucursales["id"]) => {
  return useQuery<Mesas | null>({
    queryKey: ["mesa para llevar", id_sucursal],
    queryFn: () => buscarMesaParaLlevarPorSucursal(id_sucursal as number),
    enabled: !!id_sucursal,
  });
};
