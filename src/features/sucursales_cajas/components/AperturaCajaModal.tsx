import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useInsertarCierreCajaMutation } from "@/features/cierres_caja/hooks/cierres_caja.mutations";
import { useAsignacionesSucursalesStore } from "@/features/asignacion_sucursal/store/asignacion_sucursal";
import { useCierresCajaStore } from "@/features/cierres_caja/store/cierres_caja.store";
import { useNavigate } from "react-router-dom";
type FormValues = { monto: number };
export const AperturaCajaModal = () => {
  const navigate = useNavigate();
  const { mutateAsync, isPending } = useInsertarCierreCajaMutation();
  const itemSelect = useAsignacionesSucursalesStore((s) => s.itemSelect);
  const setStateAperturaCaja = useCierresCajaStore(
    (s) => s.setStateAperturaCaja,
  );
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { monto: 0 } });
  const abrirCaja = handleSubmit(async (values) => {
    if (!itemSelect?.id_caja) {
      toast.error("No hay caja asignada");
      return;
    }
    const p = {
      fechainicio: new Date().toISOString(),
      id_caja: itemSelect.id_caja,
      total_efectivo_real: values.monto,
      total_efectivo_calculado: values.monto,
      estado: 0,
      id_usuario:itemSelect?.id_usuario
    };
    await mutateAsync({ p });
    setStateAperturaCaja(false);
    navigate("/punto-venta");
  });
  const omitir = async () => {
    if (!itemSelect?.id_caja) {
      toast.error("No hay caja asignada");
      return;
    }
    const p = {
      fechainicio: new Date().toISOString(),
      id_caja: itemSelect.id_caja,
      total_efectivo_real: 0,
      total_efectivo_calculado: 0,
      estado: 0,
       id_usuario:itemSelect?.id_usuario
    };
    await mutateAsync({ p });
    setStateAperturaCaja(false);
    navigate("/punto-venta");
  };
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-white dark:bg-[#131f24] pt-20 text-black dark:text-white">
      {" "}
      <div className="w-full max-w-md px-6">
        {" "}
        <h2 className="mb-4 text-xl font-bold text-green-500">
          {" "}
          APERTURA DE CAJA{" "}
        </h2>{" "}
        <p className="mb-6 text-lg font-semibold">
          {" "}
          Sucursal: {itemSelect?.sucursales?.nombre ?? "-"}{" "}
        </p>{" "}
        <form onSubmit={abrirCaja}>
          {" "}
          <p className="mb-2 text-lg font-semibold">
            {" "}
            Aperturar caja con:{" "}
          </p>{" "}
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            className="mb-2 w-full rounded-2xl border-2 border-gray-300 dark:border-[#37464f] bg-white dark:bg-[#202f36] text-black dark:text-white px-4 py-3 text-lg outline-none focus:border-black dark:focus:border-white"
            {...register("monto", {
              required: "Monto requerido",
              min: { value: 0, message: "Monto inválido" },
            })}
          />{" "}
          {errors.monto && (
            <p className="mb-4 text-sm text-red-500">
              {" "}
              {errors.monto.message}{" "}
            </p>
          )}{" "}
          <div className="flex gap-4">
            {" "}
            <button
              type="button"
              onClick={omitir}
              className="flex-1 rounded-xl border-2 border-gray-300 dark:border-[#37464f] py-3 font-semibold hover:bg-gray-100 dark:hover:bg-white/10"
            >
              {" "}
              OMITIR{" "}
            </button>{" "}
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-xl bg-black dark:bg-white py-3 font-semibold text-white dark:text-black hover:bg-gray-900 dark:hover:bg-white/80"
            >
              {" "}
              {isPending ? "ABRIENDO..." : "APERTURAR"}{" "}
            </button>{" "}
          </div>{" "}
        </form>{" "}
      </div>{" "}
    </div>
  );
};
