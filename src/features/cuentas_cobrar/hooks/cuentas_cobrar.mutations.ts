import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { registrarAbono, type RegistrarAbonoPayload } from "../api/cuentas_cobrar.api";
import { cuentasCobrarKeys } from "./cuentas_cobrar.queries";

export const useRegistrarAbonoMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["registrar abono"],
    mutationFn: (p: RegistrarAbonoPayload) => registrarAbono(p),
    onSuccess: () => {
      toast.success("Abono registrado");
      qc.invalidateQueries({ queryKey: cuentasCobrarKeys.all });
    },
    onError: (e: any) => toast.error(e?.message ?? "No se pudo registrar el abono"),
  });
};
