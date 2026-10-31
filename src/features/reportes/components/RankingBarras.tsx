import React from "react";

type Item = {
  label: string;
  value: number;
  color?: string;
};

type Props = {
  items: Item[];
  formatValue?: (n: number) => string;
  colorDefecto?: string;
  vacio?: string;
};

// Ranking de barras horizontales simple (una sola magnitud), con la barra
// como único elemento "de datos": etiqueta y valor van en tinta de texto,
// nunca en el color de la serie.
export const RankingBarras: React.FC<Props> = ({
  items,
  formatValue = (n) => n.toFixed(2),
  colorDefecto = "#2a78d6",
  vacio = "Sin datos en este rango.",
}) => {
  const max = Math.max(1, ...items.map((i) => i.value));

  if (!items.length) {
    return (
      <div className="p-4 text-center text-sm font-bold text-gray-400 dark:text-white/40">
        {vacio}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((it) => {
        const pct = Math.max(2, (it.value / max) * 100);
        return (
          <div key={it.label}>
            <div className="flex items-baseline justify-between gap-3 mb-1">
              <span className="text-sm font-bold text-gray-700 dark:text-white/80 truncate">
                {it.label}
              </span>
              <span
                className="text-sm font-black text-gray-900 dark:text-white shrink-0"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {formatValue(it.value)}
              </span>
            </div>
            <div className="h-3 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  backgroundColor: it.color ?? colorDefecto,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
