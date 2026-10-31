import React from "react";
import type { PresetRango, RangoFechasState } from "../hooks/useRangoFechas";
import { hoyISO } from "../utils/fechas";

const PRESETS: { key: PresetRango; label: string }[] = [
  { key: "hoy", label: "Hoy" },
  { key: "ayer", label: "Ayer" },
  { key: "7dias", label: "Últimos 7 días" },
  { key: "mes", label: "Este mes" },
];

export const FiltroFechas: React.FC<RangoFechasState> = ({
  desde,
  hasta,
  preset,
  aplicarPreset,
  setDesde,
  setHasta,
}) => {
  return (
    <section className="bg-white dark:bg-[#202f36] border-2 border-[#E5E5E5] dark:border-[#37464f] rounded-3xl p-5 flex flex-wrap items-center gap-4">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => aplicarPreset(p.key)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide border-2 transition-colors ${
              preset === p.key
                ? "border-[#1cb0f6] text-[#1cb0f6] bg-[#1cb0f6]/10"
                : "border-[#E5E5E5] dark:border-[#37464f] text-gray-400 dark:text-white/50 hover:border-gray-400 dark:hover:border-white/30"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <label className="text-xs font-black uppercase text-gray-400 dark:text-white/40">Desde</label>
        <input
          type="date"
          value={desde}
          max={hasta}
          onChange={(e) => setDesde(e.target.value)}
          className="rounded-xl border-2 border-[#E5E5E5] dark:border-[#37464f] bg-white dark:bg-[#131f24] px-3 py-2 text-sm font-bold text-gray-700 dark:text-white outline-none focus:border-[#1cb0f6]"
        />
        <label className="text-xs font-black uppercase text-gray-400 dark:text-white/40">Hasta</label>
        <input
          type="date"
          value={hasta}
          min={desde}
          max={hoyISO()}
          onChange={(e) => setHasta(e.target.value)}
          className="rounded-xl border-2 border-[#E5E5E5] dark:border-[#37464f] bg-white dark:bg-[#131f24] px-3 py-2 text-sm font-bold text-gray-700 dark:text-white outline-none focus:border-[#1cb0f6]"
        />
      </div>
    </section>
  );
};
