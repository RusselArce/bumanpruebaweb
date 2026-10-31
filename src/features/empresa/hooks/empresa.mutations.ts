import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Empresas } from "@/shared/types/db/tablas";
import { useEmpresaStore } from "../store/empresa.store";
import { ActualizarEmpresa, ActualizarEmpresaPayload, subirLogoEmpresa } from "../api/empresa.api";

export const useActualizarEmpresaMutation = () => {
  const qc = useQueryClient();
  const setEmpresa = useEmpresaStore((s) => s.setItemSelect);

  return useMutation({
    mutationKey: ["actualizar empresa"],
    mutationFn: async (p: ActualizarEmpresaPayload) => {
      return await ActualizarEmpresa(p);
    },
    onSuccess: (data) => {
      if (data) setEmpresa(data as Empresas);
      toast.success("Empresa actualizada");
      qc.invalidateQueries({ queryKey: ["ensure empresa for user"] });
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "No se pudo actualizar la empresa");
    },
  });
};

export const useSubirLogoEmpresaMutation = () => {
  const qc = useQueryClient();
  const setEmpresa = useEmpresaStore((s) => s.setItemSelect);

  return useMutation({
    mutationKey: ["subir logo empresa"],
    mutationFn: async ({ id, file }: { id: Empresas["id"]; file: File }) => {
      const logo = await subirLogoEmpresa(id, file);
      return await ActualizarEmpresa({ id, logo });
    },
    onSuccess: (data) => {
      if (data) setEmpresa(data as Empresas);
      toast.success("Logo actualizado");
      qc.invalidateQueries({ queryKey: ["ensure empresa for user"] });
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "No se pudo subir el logo");
    },
  });
};
