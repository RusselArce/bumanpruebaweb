
import { Outlet } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { useEnsureEmpresa } from "@/features/empresa/hooks/empresa.security";
import { useAsignacionesSucursalesStore } from "@/features/asignacion_sucursal/store/asignacion_sucursal";
import { SelectorEmpresaModal } from "@/features/asignacion_sucursal/components/SelectorEmpresaModal";

export function ProtectedLayout() {
  useEnsureEmpresa()

  const todasLasAsignaciones = useAsignacionesSucursalesStore((s) => s.todasLasAsignaciones);
  const itemSelect = useAsignacionesSucursalesStore((s) => s.itemSelect);

  // Identidad con acceso a más de una empresa y todavía sin elegir cuál
  // queda activa: hay que preguntar antes de dejar entrar a cualquier ruta
  // protegida (todo lo de abajo asume una única empresa activa).
  const debeElegirEmpresa = todasLasAsignaciones.length > 1 && !itemSelect;

  return (
    <ProtectedRoute>
      {debeElegirEmpresa ? <SelectorEmpresaModal /> : <Outlet />}
    </ProtectedRoute>
  );
}
