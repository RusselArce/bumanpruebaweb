import React, { useState } from "react";
import { BtnVolver } from "@/shared/ui/buttons/BtnVolver";
import { useNavigate } from "react-router-dom";
import { Toaster } from "sonner";
import { TablaModificadores } from "../components/TablaModificadores";
import { FormModificadores } from "../components/FormModificadores";

export const ModificadoresCrudPage: React.FC = () => {
  const navigate = useNavigate();
  const [openForm, setOpenForm] = useState(false);

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#131f24] p-6 font-rounded">
      <Toaster />
      <div className="max-w-5xl mx-auto space-y-6">
        <section className="flex justify-between items-center">
          <section className="relative flex gap-4">
            <BtnVolver onClick={() => navigate(-1)} />
            <h1 className="text-4xl font-black text-[#4B4B4B] dark:text-white tracking-wide">
              Modificadores
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
          <TablaModificadores />
        </section>
      </div>

      <FormModificadores open={openForm} mode="Nuevo" onClose={() => setOpenForm(false)} />
    </div>
  );
};
