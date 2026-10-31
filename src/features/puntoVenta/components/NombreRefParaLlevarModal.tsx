import { useState } from "react";
import { useForm } from "react-hook-form";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { existeNombreRefEnCocina } from "@/features/ventas/api/ventas.api";

type FormValues = { nombre_ref: string };

type Props = {
  idMesa: number;
  onConfirm: (nombreRef: string) => void;
  onClose: () => void;
  isSending?: boolean;
};

export const NombreRefParaLlevarModal = ({ idMesa, onConfirm, onClose, isSending }: Props) => {
  const [isChecking, setIsChecking] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { nombre_ref: "" } });

  const onSubmit = handleSubmit(async ({ nombre_ref }) => {
    const nombre = nombre_ref.trim();
    if (!nombre) return;

    setIsChecking(true);
    try {
      const yaExiste = await existeNombreRefEnCocina({ id_mesa: idMesa, nombre_ref: nombre });
      if (yaExiste) {
        toast.error(`Ya hay un pedido para llevar en cocina a nombre de "${nombre}"`, {
          description: "Usa otro nombre o referencia para distinguirlo.",
        });
        return;
      }
      onConfirm(nombre);
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo validar el nombre del pedido.");
    } finally {
      setIsChecking(false);
    }
  });

  const disabled = isChecking || !!isSending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-sm">
        <div className="absolute inset-0 bg-gray-300 dark:bg-[#37464f] rounded-3xl translate-y-1.5" />
        <div className="relative bg-white dark:bg-[#202f36] border-2 border-[#E5E5E5] dark:border-[#37464f] rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Icon icon="mdi:bag-personal-outline" width="22" className="text-[#58cc02]" />
              <h2 className="text-gray-900 dark:text-white font-black uppercase tracking-wide text-sm">
                Pedido para llevar
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={disabled}
              className="h-8 w-8 rounded-lg grid place-items-center text-gray-400 dark:text-white/50 hover:text-gray-700 dark:hover:text-white disabled:opacity-50"
            >
              <Icon icon="mdi:close" width="18" />
            </button>
          </div>

          <p className="text-gray-500 dark:text-[#afbbc9] text-sm mb-3">
            Escribe un nombre o referencia para identificar este pedido (ej. nombre del cliente).
          </p>

          <form onSubmit={onSubmit}>
            <input
              autoFocus
              placeholder="Ej: Juan / Mostrador 3"
              className={`w-full bg-gray-50 dark:bg-[#2d3e47] border rounded-xl p-3 text-gray-900 dark:text-white outline-none focus:border-[#17a4e1] ${
                errors.nombre_ref ? "border-[#ee4c4c]" : "border-gray-300 dark:border-[#3e525d]"
              }`}
              disabled={disabled}
              {...register("nombre_ref", {
                required: "Escribe un nombre para el pedido",
                maxLength: { value: 60, message: "Máximo 60 caracteres" },
              })}
            />
            {errors.nombre_ref && (
              <p className="text-[#ee4c4c] text-xs mt-1">{errors.nombre_ref.message}</p>
            )}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={disabled}
                className="flex-1 py-3 rounded-xl font-black text-sm text-gray-500 dark:text-white/70 border border-gray-300 dark:border-[#3e525d] disabled:opacity-50"
              >
                CANCELAR
              </button>
              <button
                type="submit"
                disabled={disabled}
                className="flex-1 py-3 rounded-xl font-black text-sm bg-[#58cc02] text-[#131f24] hover:brightness-110 disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                <Icon
                  icon={disabled ? "mdi:loading" : "mdi:send"}
                  width="18"
                  className={disabled ? "animate-spin" : ""}
                />
                ENVIAR
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
