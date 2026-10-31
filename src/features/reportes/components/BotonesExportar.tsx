import React from "react";
import { Icon } from "@iconify/react";

type Props = {
  exportando: "excel" | "pdf" | null;
  onExcel: () => void;
  onPdf: () => void;
  disabled?: boolean;
};

export const BotonesExportar: React.FC<Props> = ({ exportando, onExcel, onPdf, disabled }) => (
  <>
    <button
      type="button"
      onClick={onExcel}
      disabled={disabled || exportando !== null}
      className="inline-flex items-center gap-2 rounded-2xl bg-[#1baf7a] px-5 py-3 text-sm font-black text-white border-b-4 border-[#128a5e] hover:brightness-110 active:border-b-0 active:translate-y-[2px] transition-all disabled:opacity-50 disabled:active:translate-y-0 disabled:active:border-b-4"
    >
      <Icon
        icon={exportando === "excel" ? "mdi:loading" : "mdi:file-excel"}
        width="20"
        className={exportando === "excel" ? "animate-spin" : ""}
      />
      EXCEL
    </button>
    <button
      type="button"
      onClick={onPdf}
      disabled={disabled || exportando !== null}
      className="inline-flex items-center gap-2 rounded-2xl bg-[#e34948] px-5 py-3 text-sm font-black text-white border-b-4 border-[#b93a39] hover:brightness-110 active:border-b-0 active:translate-y-[2px] transition-all disabled:opacity-50 disabled:active:translate-y-0 disabled:active:border-b-4"
    >
      <Icon
        icon={exportando === "pdf" ? "mdi:loading" : "mdi:file-pdf-box"}
        width="20"
        className={exportando === "pdf" ? "animate-spin" : ""}
      />
      PDF
    </button>
  </>
);
