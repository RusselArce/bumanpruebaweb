// src/features/metodos_pago/pages/MetodosPagoCrudPage.tsx
import React, { useEffect, useState } from "react";
import { BtnVolver } from "@/shared/ui/buttons/BtnVolver";
import { useNavigate } from "react-router-dom";
import { Toaster } from "sonner";
import { TablaMetodosPago } from "../components/TablaMetodosPago";
import { FormMetodosPago } from "../components/FormMetodosPago";

function useDebounce<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export const MetodosPagoCrudPage: React.FC = () => {
  const navigate = useNavigate();
  const [openForm, setOpenForm] = useState(false);

  // (si luego haces buscar, ya tienes debounce listo)
  const [q, setQ] = useState("");
  const qDebounced = useDebounce(q, 350);
  const usingSearch = qDebounced.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#131f24] p-6 font-rounded">
      <Toaster />
      <div className="max-w-5xl mx-auto space-y-6">
        <section className="flex justify-between items-center">
          <section className="relative flex gap-4">
            <BtnVolver onClick={() => navigate(-1)} />
            <h1 className="text-4xl font-black text-[#4B4B4B] dark:text-white tracking-wide">
              Métodos de pago
            </h1>
          </section>

          <button
            type="button"
            onClick={() => setOpenForm(true)}
            className="relative inline-flex items-center gap-2 rounded-2xl bg-[#FFC800] px-6 py-3 text-lg font-black text-black
                       border-b-4 border-[#E5A500] hover:brightness-110 active:border-b-0 active:translate-y-[2px] transition-all"
          >
            <span>+</span>
            <span>NUEVO</span>
          </button>
        </section>

       

        <section>
          <TablaMetodosPago />
        </section>
      </div>

      <FormMetodosPago open={openForm} mode="Nuevo" onClose={() => setOpenForm(false)} />
    </div>
  );
};