import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { usePermisosEfectivos } from "../hooks/usePermisosEfectivos";

type Props = {
  /** Debe coincidir exactamente con modulos.link en la BD. */
  link: string;
  children: React.ReactNode;
};

export function PermisoRoute({ link, children }: Props) {
  const { tienePermiso, cargando } = usePermisosEfectivos();
  const location = useLocation();

  if (cargando) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50 dark:bg-[#131f24]">
        <div className="text-gray-400 dark:text-white/40 font-bold text-sm uppercase tracking-widest">
          Verificando permisos...
        </div>
      </div>
    );
  }

  if (!tienePermiso(link)) {
    return (
      <Navigate to="/configurar" replace state={{ sinPermisoPara: location.pathname }} />
    );
  }

  return <>{children}</>;
}
