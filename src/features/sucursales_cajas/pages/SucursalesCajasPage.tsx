import { Toaster } from "sonner";


export const SucursalesCajasPage = () => {

  return (
    <div className="h-screen grid grid-rows-[300px_auto] relative bg-white dark:bg-[#131f24]">

      <Toaster position="top-right" />

      {/* Modal sucursal */}


      {/* Modal caja */}


      {/* HEADER */}
      <section className="flex flex-col items-center justify-center gap-5">

        <h3 className="text-[25px] font-bold text-gray-900 dark:text-white">
          Cajas por sucursal
        </h3>

        <p className="text-[18px] text-gray-500 dark:text-white/50">
          gestiona tus sucursales y cajas
        </p>

        <button

          className="
          border-2
          border-dashed
          border-gray-400 dark:border-[#37464f]
          px-6
          py-3
          rounded-xl
          font-semibold
          text-gray-900 dark:text-white
          hover:border-black dark:hover:border-white
          hover:bg-gray-50 dark:hover:bg-white/10
          transition
          "
        >
          agregar sucursal
        </button>

      </section>

      {/* LISTA */}
      <section className="pb-5 px-6 text-gray-900 dark:text-white">

        <span>ListSucursales component</span>

      </section>

    </div>
  );
};