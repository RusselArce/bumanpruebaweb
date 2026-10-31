import React from "react";
import { Salones } from "@/shared/types/db/tablas";
import { useSalonesStore } from "@/features/salones/store/salones.store";
import { BtnElevado } from "@/shared/ui/buttons/BtnElevado";
import { Pencil, Trash2 } from "lucide-react";
import { useEliminarSalonesMutation } from "@/features/salones/hooks/salones.mutations";
import { PerfilMenu } from "@/features/usuarios/components/PerfilMenu";

type SidebarSalonesProps ={
  salones: Salones[];
  /** Habilita crear/editar/eliminar salones. En la vista operativa (mesas) va oculto. */
  modoAdmin?: boolean;
}

export const SidebarSalones  = ({ salones, modoAdmin = false }:SidebarSalonesProps) => {
  const {
    setItemSelect,
    itemSelect,
    openNuevo,
    openEditar
  } = useSalonesStore();

  const {mutate} = useEliminarSalonesMutation();

  const handleEliminar =  (id:number) => {

    const ok = confirm("¿Eliminar salón?");
    if(!ok) return;
   //const id_salon =itemSelect?.id
     mutate( id as number );

  };

  return (
    <aside className="w-full md:w-64 p-4 flex flex-col shrink-0 relative">

      {/* HEADER */}
      <section className="flex items-center gap-2 mb-4">

        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-300">
          Salones
        </h1>

        {modoAdmin && (
          <BtnElevado
            bgcolor="#58cc02"
            titulo="+"
            color="#ffffff"
            funcion={openNuevo}
          />
        )}

      </section>

      {/* LISTA SALONES */}
      <nav className="grow">
        <ul>

          {salones.map((room) => (

            <li
              key={room.id}
              className={`p-3 my-2 rounded-lg transition-all duration-200 text-lg flex items-center justify-between group
              ${
                itemSelect?.id === room.id
                  ? "bg-[#58cc02]/10 text-[#2b7a02] dark:bg-gray-700 dark:text-white font-semibold"
                  : "text-gray-500 hover:bg-black/5 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              }`}
            >

              {/* nombre */}
              <span
                className="flex-1 cursor-pointer"
                onClick={() => setItemSelect(room)}
              >
                {room.nombre}
              </span>

              {/* botones */}
              {modoAdmin && (
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">

                  {/* editar */}
                  <button
                    onClick={() => openEditar(room)}
                    className="p-1 rounded hover:bg-blue-500/20"
                  >
                    <Pencil size={16}/>
                  </button>

                  {/* eliminar */}
                  <button
                    onClick={() => handleEliminar(room.id)}
                    className="p-1 rounded hover:bg-red-500/20"
                  >
                    <Trash2 size={16}/>
                  </button>

                </div>
              )}

            </li>

          ))}

        </ul>
      </nav>

      <PerfilMenu />

    </aside>
  );
};
