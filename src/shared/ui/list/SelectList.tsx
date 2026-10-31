import React from "react";

type SelectListProps<T> = {
  data: T[];
  value?: string | number;
  onChange: (value: string | number) => void;

  getLabel: (item: T) => string;
  getValue: (item: T) => string | number;

  placeholder?: string;
  className?: string;
};

export function SelectList<T>({
  data,
  value,
  onChange,
  getLabel,
  getValue,
  placeholder = "Seleccionar...",
  className = "",
}: SelectListProps<T>) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded-2xl border-2 border-[#E5E5E5] dark:border-[#37464f] bg-white dark:bg-[#131f24] px-5 py-3 text-lg font-bold text-[#4B4B4B] dark:text-white outline-none focus:border-[#84D8FF] transition-colors ${className}`}
    >
      <option value="">{placeholder}</option>

      {data.map((item) => {
        const val = getValue(item);
        return (
          <option key={val} value={val}>
            {getLabel(item)}
          </option>
        );
      })}
    </select>
  );
}