import React from "react";
import { Navigate } from "react-router-dom";
import { useSubcription } from "@/shared/store/auth.store"; // ajusta la ruta si es distinta

type Props = { children: React.ReactNode };

export function PublicRoute({ children }: Props) {
  
  const user = useSubcription((s) => s.user);

  // Si ya está logueado y entra a /login -> lo mandas al home
  if (user) return <Navigate to="/" replace />;

  return <>{children}</>;
}
