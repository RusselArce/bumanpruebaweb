import React from "react";
import { useNavigate } from "react-router-dom";
import { BtnVolver } from "@/shared/ui/buttons/BtnVolver";

type Props = {
  titulo: string;
  backTo?: string;
  children?: React.ReactNode;
};

export const ReporteHeader: React.FC<Props> = ({ titulo, backTo = "/configurar/reportes", children }) => {
  const navigate = useNavigate();

  return (
    <section className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <BtnVolver onClick={() => navigate(backTo)} />
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-wide">
          {titulo}
        </h1>
      </div>

      <div className="flex gap-2">{children}</div>
    </section>
  );
};
