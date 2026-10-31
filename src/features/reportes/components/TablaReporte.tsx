import React from "react";

export type ColumnaTabla<T> = {
  header: string;
  key: keyof T & string;
  align?: "left" | "right";
  render?: (fila: T) => React.ReactNode;
};

type Props<T> = {
  columnas: ColumnaTabla<T>[];
  filas: T[];
  rowKey: (fila: T) => string | number;
  cargando?: boolean;
  vacio?: string;
  maxHeight?: string;
};

export function TablaReporte<T>({
  columnas,
  filas,
  rowKey,
  cargando,
  vacio = "Sin datos en este rango.",
  maxHeight = "480px",
}: Props<T>) {
  return (
    <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight }}>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-white/40 border-b-2 border-[#E5E5E5] dark:border-[#37464f] sticky top-0 bg-white dark:bg-[#202f36]">
            {columnas.map((c) => (
              <th key={c.key} className={`py-2 pr-3 ${c.align === "right" ? "text-right" : ""}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cargando && (
            <tr>
              <td colSpan={columnas.length} className="py-6 text-center text-gray-400 dark:text-white/40 font-bold">
                Cargando...
              </td>
            </tr>
          )}
          {!cargando && filas.length === 0 && (
            <tr>
              <td colSpan={columnas.length} className="py-6 text-center text-gray-400 dark:text-white/40 font-bold">
                {vacio}
              </td>
            </tr>
          )}
          {!cargando &&
            filas.map((fila) => (
              <tr
                key={rowKey(fila)}
                className="border-b border-[#E5E5E5] dark:border-[#37464f] text-gray-700 dark:text-white/80"
              >
                {columnas.map((c) => (
                  <td
                    key={c.key}
                    className={`py-2 pr-3 ${c.align === "right" ? "text-right" : ""}`}
                    style={c.align === "right" ? { fontVariantNumeric: "tabular-nums" } : undefined}
                  >
                    {c.render ? c.render(fila) : String(fila[c.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
