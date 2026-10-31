import React, { useEffect, useMemo, useRef } from "react";
import { Icon } from "@iconify/react";

type Props<T> = {
  isOpen: boolean;
  onClose: () => void;

  title?: string;
  placeholder?: string;

  query: string;
  setQuery: (v: string) => void;

  items: T[] | undefined;
  isLoading?: boolean;

  getKey: (item: T) => string | number;
  renderItem: (item: T) => React.ReactNode;

  onSelect: (item: T) => void;

  minChars?: number;
  emptyText?: string;

  /** Acción extra opcional en el footer, ej. "+ Nuevo" */
  extraAction?: {
    label: string;
    onClick: () => void;
  };
};

export function BuscadorModal<T>({
  isOpen,
  onClose,
  title = "Buscar",
  placeholder = "Escribe para buscar...",
  query,
  setQuery,
  items,
  isLoading = false,
  getKey,
  renderItem,
  onSelect,
  minChars = 2,
  emptyText = "Sin resultados",
  extraAction,
}: Props<T>) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  // autofocus al abrir
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [isOpen]);

  // cerrar con ESC
  useEffect(() => {
    if (!isOpen) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [isOpen, onClose]);

  const qTrim = query.trim();
  const canSearch = qTrim.length >= minChars;

  const list = useMemo(() => items ?? [], [items]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999]">
      {/* overlay */}
      <button
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-label="Cerrar"
      />

      {/* modal */}
      <div className="absolute left-1/2 top-10 w-[92vw] max-w-xl -translate-x-1/2">
        <div className="bg-[#202f36] border-2 border-[#37464f] rounded-3xl overflow-hidden shadow-2xl">
          {/* header */}
          <div className="px-4 py-3 bg-[#24343c] border-b-2 border-[#37464f] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon icon="mdi:magnify" className="text-[#58cc02]" width="22" />
              <h3 className="text-white font-black uppercase tracking-widest text-[11px]">
                {title}
              </h3>
            </div>

            <button
              onClick={onClose}
              className="h-9 w-9 rounded-xl grid place-items-center text-white/60 hover:text-white hover:bg-white/10 transition"
              aria-label="Cerrar"
            >
              <Icon icon="mdi:close" width="20" />
            </button>
          </div>

          {/* input */}
          <div className="p-4">
            <div className="relative">
              <Icon
                icon="mdi:magnify"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35"
                width="20"
              />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-[#131f24] border-2 border-[#37464f] rounded-2xl pl-10 pr-10 py-3 text-white font-bold outline-none focus:border-[#1cb0f6]"
              />
              {query.length > 0 && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-xl grid place-items-center text-white/50 hover:text-white hover:bg-white/10 transition"
                  aria-label="Limpiar"
                >
                  <Icon icon="mdi:close-circle" width="18" />
                </button>
              )}
            </div>

            <div className="mt-3 text-[11px] font-bold text-white/45">
              {canSearch
                ? "Resultados"
                : `Escribe al menos ${minChars} caracteres`}
            </div>
          </div>

          {/* list */}
          <div className="max-h-[55vh] overflow-y-auto custom-scrollbar px-4 pb-4">
            {!canSearch ? (
              <div className="py-8 text-center text-white/40 text-sm font-bold">
                <Icon icon="mdi:keyboard-outline" width="26" className="mx-auto mb-2 opacity-60" />
                Empieza a escribir para buscar.
              </div>
            ) : isLoading ? (
              <div className="py-8 text-center text-white/40 text-sm font-bold">
                <Icon icon="mdi:loading" width="22" className="mx-auto mb-2 animate-spin" />
                Buscando...
              </div>
            ) : list.length === 0 ? (
              <div className="py-8 text-center text-white/40 text-sm font-bold">
                <Icon icon="mdi:database-search" width="26" className="mx-auto mb-2 opacity-60" />
                {emptyText}
                {extraAction && (
                  <div className="mt-4">
                    <button
                      onClick={extraAction.onClick}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#58cc02] text-[#131f24] font-black text-xs uppercase tracking-wider hover:brightness-110 transition active:translate-y-px"
                    >
                      <Icon icon="mdi:plus" width="16" />
                      {extraAction.label}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {list.map((item) => (
                  <button
                    key={getKey(item)}
                    onClick={() => {
                      onSelect(item);
                      onClose();
                    }}
                    className="w-full text-left bg-[#131f24] hover:bg-[#1a262e] border-2 border-[#37464f] rounded-2xl p-3 transition active:translate-y-[1px]"
                  >
                    {renderItem(item)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* footer */}
          <div className="px-4 py-3 bg-[#24343c] border-t-2 border-[#37464f] flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
              Enter para seleccionar • Esc para cerrar
            </span>

            <div className="flex items-center gap-2">
              {extraAction && (
                <button
                  onClick={extraAction.onClick}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#58cc02] text-[#131f24] font-black text-[11px] uppercase tracking-wider hover:brightness-110 transition"
                >
                  <Icon icon="mdi:plus" width="14" />
                  {extraAction.label}
                </button>
              )}

              <button
                onClick={onClose}
                className="px-3 py-2 rounded-2xl bg-[#37464f] text-white font-black text-[11px] uppercase tracking-wider hover:brightness-110 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}