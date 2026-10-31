// src/features/pagos_rapidos/pages/PagosRapidosCrudPage.tsx
import React from "react";
import { BtnVolver } from "@/shared/ui/buttons/BtnVolver";
import { useNavigate } from "react-router-dom";
import { Toaster } from "sonner";
import { TablaPagosRapidos } from "../components/TablaPagosRapidos";

export const PagosRapidosCrudPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#131f24] p-6 font-rounded">
      <Toaster />
      <div className="max-w-5xl mx-auto space-y-6">
        <section className="flex justify-between items-center">
          <section className="relative flex gap-4">
            <BtnVolver onClick={() => navigate(-1)} />
            <h1 className="text-4xl font-black text-[#4B4B4B] dark:text-white tracking-wide">
              Pagos rápidos
            </h1>
          </section>
        </section>

        <p className="text-sm font-bold text-[#7A7A7A] dark:text-white/50 -mt-4">
          Botones de cobro rápido en efectivo (sin registrar cliente). Al presionarlos en el
          punto de venta se cobra al instante con el billete indicado y se calcula el vuelto.
        </p>

        <section>
          <TablaPagosRapidos />
        </section>
      </div>
    </div>
  );
};
