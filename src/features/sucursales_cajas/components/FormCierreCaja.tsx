import { useEditarCierreCajaMutation } from "@/features/cierres_caja/hooks/cierres_caja.mutations";
import { useCierresCajaStore } from "@/features/cierres_caja/store/cierres_caja.store";
import { BtnVolver } from "@/shared/ui/buttons/BtnVolver";
import { CierresCajas, ID } from "@/shared/types/db/tablas";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

type Props = {
  dataCierreCaja?: CierresCajas;
  totalCalculado: number;
  setStateFormCierre: () => void;
};

type FormValues = {
  totalReal: number;
};

export const FormCierreCaja = ({
  dataCierreCaja,
  totalCalculado,
  setStateFormCierre,
}: Props) => {
  const { mutate: cerrarCaja, isPending } = useEditarCierreCajaMutation();
  const setStateCierreCaja = useCierresCajaStore((s) => s.setStateCierreCaja);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      totalReal: 0,
    },
  });
  const navigate = useNavigate();
  // 👇 valor en tiempo real
  const totalReal = Number(watch("totalReal") || 0);

  // 👇 cálculo diferencia
  const diferencia = totalReal - totalCalculado;

  const onSubmit = () => {
    if (!dataCierreCaja?.id) return;

    cerrarCaja({
      id: dataCierreCaja.id as ID,
      total_efectivo_calculado: totalCalculado,
      total_efectivo_real: totalReal,
      diferencia_efectivo: diferencia,
      estado: 1,
      fechacierre: new Date().toISOString(),
    });
    if (!isPending) {
      navigate("/");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full fixed h-full min-h-screen bg-gray-200 dark:bg-[#131f24] flex flex-col items-center justify-center px-4"
    >
      <div className="w-full max-w-md text-center">
        {/* Volver */}
        <BtnVolver onClick={setStateFormCierre} />

        {/* Título */}
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Efectivo esperado en caja:
        </h2>

        {/* Monto calculado */}
        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          S/ {totalCalculado.toFixed(2)}
        </p>

        {/* Pregunta */}
        <p className="text-gray-700 dark:text-white/70 mb-3">
          ¿Cuánto de <span className="font-bold">EFECTIVO</span> hay en caja
          física?
        </p>

        {/* Input */}
        <input
          type="number"
          step="0.01"
          {...register("totalReal", {
            required: "Ingrese el monto",
            min: {
              value: 0,
              message: "No puede ser negativo",
            },
          })}
          className="w-full text-center py-3 rounded-xl border border-gray-300 dark:border-[#37464f] bg-gray-100 dark:bg-[#202f36] text-gray-700 dark:text-white text-lg outline-none mb-2"
        />

        {/* Error */}
        {errors.totalReal && (
          <p className="text-red-500 text-sm mb-2">
            {errors.totalReal.message}
          </p>
        )}

        {/* Línea */}
        <div className="border-t border-gray-300 dark:border-[#37464f] mb-3"></div>

        {/* Diferencia dinámica */}
        <p className="text-gray-700 dark:text-white/70 mb-6">
          diferencia:{" "}
          <span
            className={`font-bold ${
              diferencia < 0 ? "text-red-600" : "text-green-600"
            }`}
          >
            {diferencia >= 0 ? "S/" : "-S/"} {Math.abs(diferencia).toFixed(2)}
          </span>
        </p>

        {/* Botón */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-md transition disabled:opacity-50"
        >
          {isPending ? "Cerrando..." : "CERRAR TURNO"}
        </button>

        {/* Texto alerta */}
        <p className="text-red-500 text-sm mt-4">
          La diferencia será registrada en su turno y se enviará a gerencia
        </p>
      </div>
    </form>
  );
};
