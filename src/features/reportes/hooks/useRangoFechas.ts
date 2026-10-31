import { useState } from "react";
import { hoyISO, primerDiaDelMes, sumarDias } from "../utils/fechas";

export type PresetRango = "hoy" | "ayer" | "7dias" | "mes";

export type RangoFechasState = {
  desde: string;
  hasta: string;
  preset: PresetRango | null;
  aplicarPreset: (p: PresetRango) => void;
  setDesde: (v: string) => void;
  setHasta: (v: string) => void;
};

export function useRangoFechas(): RangoFechasState {
  const [desde, setDesdeState] = useState(hoyISO());
  const [hasta, setHastaState] = useState(hoyISO());
  const [preset, setPreset] = useState<PresetRango | null>("hoy");

  const aplicarPreset = (p: PresetRango) => {
    setPreset(p);
    const hoy = hoyISO();
    if (p === "hoy") {
      setDesdeState(hoy);
      setHastaState(hoy);
    } else if (p === "ayer") {
      const ayer = sumarDias(hoy, -1);
      setDesdeState(ayer);
      setHastaState(ayer);
    } else if (p === "7dias") {
      setDesdeState(sumarDias(hoy, -6));
      setHastaState(hoy);
    } else {
      setDesdeState(primerDiaDelMes());
      setHastaState(hoy);
    }
  };

  const setDesde = (v: string) => {
    setPreset(null);
    setDesdeState(v);
  };

  const setHasta = (v: string) => {
    setPreset(null);
    setHastaState(v);
  };

  return { desde, hasta, preset, aplicarPreset, setDesde, setHasta };
}
