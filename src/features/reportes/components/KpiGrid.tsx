import React from "react";

type Kpi = {
  label: string;
  value: string;
  color?: string;
};

type Props = {
  items: Kpi[];
  cargando?: boolean;
};

export const KpiGrid: React.FC<Props> = ({ items, cargando }) => (
  <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {items.map((kpi) => (
      <div
        key={kpi.label}
        className="bg-white dark:bg-[#202f36] border-2 border-[#E5E5E5] dark:border-[#37464f] rounded-3xl p-5"
      >
        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-white/40 mb-2">
          {kpi.label}
        </div>
        <div
          className={`text-2xl font-black ${kpi.color ?? "text-gray-900 dark:text-white"}`}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {cargando ? "…" : kpi.value}
        </div>
      </div>
    ))}
  </section>
);
