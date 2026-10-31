import { useQuery } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { EnsureEmpresaForUser } from "@/features/empresa/api/empresa.api";
import { queryClient } from "@/lib/queryClient";
import { useAsignacionesSucursalesStore } from "@/features/asignacion_sucursal/store/asignacion_sucursal";

// ✅ `EnsureEmpresaForUser` ahora devuelve TODAS las asignaciones de la
// identidad (puede pertenecer a varias empresas) — se cargan todas en el
// store, que internamente resuelve cuál queda activa (única opción, última
// elegida, o ninguna si hay que preguntarle al usuario vía el selector).
export const useEnsureEmpresaForUserQuery = (user?: User | null) => {
  const setTodasLasAsignaciones = useAsignacionesSucursalesStore((s) => s.setTodasLasAsignaciones);

  return useQuery({
    queryKey: ["ensure empresa for user", user?.id],
    queryFn: async () => {
      const asignaciones = await EnsureEmpresaForUser({
        id: user!.id,
        email: user?.email ?? null,
      });

      setTodasLasAsignaciones(asignaciones);

      return asignaciones;
    },
    enabled: !!user?.id,
    staleTime: Infinity,
  });
};

export async function ensureEmpresaForUserCached(user: User) {
  const data = await queryClient.fetchQuery({
    queryKey: ["ensure empresa for user", user.id],
    queryFn: async () => {
      return await EnsureEmpresaForUser({
        id: user.id,
        email: user.email ?? null,
      });
    },
    staleTime: Infinity,
  });

  useAsignacionesSucursalesStore.getState().setTodasLasAsignaciones(data);

  return data;
}
