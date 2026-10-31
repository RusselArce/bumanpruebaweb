import { useEffect } from "react";
import { useSubcription } from "@/shared/store/auth.store";
import { ensureEmpresaForUserCached } from "@/features/empresa/hooks/empresa.queries";

export function useEnsureEmpresa() {
  const user = useSubcription((s) => s.user);

  useEffect(() => {
    if (!user) return;

    ensureEmpresaForUserCached(user).catch(console.error);
  }, [user]);
}