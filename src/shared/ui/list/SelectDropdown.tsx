import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

type Option = {
  value: string | number;
  label: string;
};

type SelectDropdownProps = {
  options: Option[];
  value?: string | number | null;
  onChange: (value: string | number) => void;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  className?: string;
};

export function SelectDropdown({
  options,
  value,
  onChange,
  placeholder = "Selecciona...",
  disabled = false,
  hasError = false,
  className = "",
}: SelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickFuera = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickFuera);
    return () => document.removeEventListener("mousedown", onClickFuera);
  }, [open]);

  const seleccionado = options.find((o) => o.value === value);

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={[
          "w-full flex items-center justify-between gap-2 rounded-2xl border-2 px-4 py-3 text-lg font-black text-left transition-all",
          "bg-white dark:bg-[#131f24] text-[#4B4B4B] dark:text-white",
          disabled
            ? "opacity-60 cursor-not-allowed bg-[#F0F2F5] dark:bg-white/5"
            : "cursor-pointer hover:border-[#84D8FF]",
          hasError ? "border-pink-400" : "border-[#E5E5E5] dark:border-[#37464f]",
          open ? "border-[#84D8FF]" : "",
        ].join(" ")}
      >
        <span className={seleccionado ? "" : "text-[#9AA0A6] dark:text-white/40 font-bold"}>
          {seleccionado ? seleccionado.label : placeholder}
        </span>
        <ChevronDown
          size={20}
          className={`shrink-0 text-[#9AA0A6] dark:text-white/40 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full max-h-64 overflow-auto rounded-2xl border-2 border-[#E5E5E5] dark:border-[#37464f] bg-white dark:bg-[#202f36] shadow-[0_12px_30px_rgba(0,0,0,0.18)] p-1.5">
          {options.map((o) => {
            const isSelected = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={[
                  "w-full flex items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-left text-base font-bold transition-colors",
                  isSelected
                    ? "bg-[#58cc02]/10 text-[#46a302] dark:text-[#58cc02]"
                    : "text-[#4B4B4B] dark:text-white hover:bg-black/5 dark:hover:bg-white/10",
                ].join(" ")}
              >
                {o.label}
                {isSelected && <Check size={16} className="shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
