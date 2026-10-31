import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSubcription } from "@/shared/store/auth.store"; // ajusta la ruta si es distinta

type Props = { children: React.ReactNode };

export function ProtectedRoute({ children }: Props) {
  const user = useSubcription((s) => s.user);

  const location = useLocation();

  // Si no hay usuario -> manda a login
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
