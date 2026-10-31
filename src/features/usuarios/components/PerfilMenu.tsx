import React, { useEffect, useRef, useState } from "react";
import { Building2, ChevronDown, LogOut, Moon, PencilLine, Sun } from "lucide-react";
import { useAuthStore, useSubcription } from "@/shared/store/auth.store";
import { useUsuarioActualQuery } from "@/features/usuarios/hooks/usuarios.queries";
import { useTema } from "@/features/usuarios/hooks/useTema";
import { EditarPerfilModal } from "./EditarPerfilModal";
import type { Usuarios } from "@/shared/types/db/tablas";
import { useAsignacionesSucursalesStore } from "@/features/asignacion_sucursal/store/asignacion_sucursal";
import { SelectorEmpresaModal } from "@/features/asignacion_sucursal/components/SelectorEmpresaModal";

type UsuarioConRol = Usuarios & { roles?: { nombre?: string | null } | null };

/** Menú de perfil "estratégico": vive al pie del menú principal (donde antes
 * solo se mostraba el correo), se abre hacia arriba y trae a mano lo que se
 * usa seguido — cambiar tema, editar datos propios, cerrar sesión — sin
 * mandar a otra pantalla. */
export const PerfilMenu = () => {
  const { user } = useSubcription();
  const { cerrarSesion } = useAuthStore();
  const { data: usuarioActual } = useUsuarioActualQuery() as {
    data: UsuarioConRol | null | undefined;
  };
  const { tema, toggleTema, isGuardando } = useTema();

  const todasLasAsignaciones = useAsignacionesSucursalesStore((s) => s.todasLasAsignaciones);
  const tieneVariasEmpresas = todasLasAsignaciones.length > 1;

  const [open, setOpen] = useState(false);
  const [openEditar, setOpenEditar] = useState(false);
  const [openSelectorEmpresa, setOpenSelectorEmpresa] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickFuera = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickFuera);
    return () => document.removeEventListener("mousedown", onClickFuera);
  }, [open]);

  const nombre =
    usuarioActual?.nombres?.trim() || user?.email?.split("@")[0] || "Usuario";
  const inicial = nombre.charAt(0).toUpperCase();
  const rol = usuarioActual?.roles?.nombre?.trim();

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 rounded-2xl border border-black/10 dark:border-white/10 bg-gray-100 dark:bg-[#14161a] px-3 py-2.5 hover:brightness-95 dark:hover:brightness-125 transition-all"
      >
        <span className="h-9 w-9 shrink-0 rounded-full bg-[#58cc02] text-white font-black grid place-items-center text-sm">
          {inicial}
        </span>
        <span className="flex-1 min-w-0 text-left">
          <span className="block text-sm font-bold text-gray-900 dark:text-white truncate">
            {nombre}
          </span>
          {rol && (
            <span className="block w-fit mt-0.5 text-[9px] font-black uppercase tracking-wide text-gray-500 dark:text-white/50 bg-black/5 dark:bg-white/10 rounded-full px-1.5 py-px">
              {rol}
            </span>
          )}
          <span className="block text-[11px] text-gray-500 dark:text-white/50 truncate mt-0.5">
            {user?.email}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-400 dark:text-white/40 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0f171b] shadow-xl overflow-hidden z-30">
          <button
            type="button"
            onClick={toggleTema}
            disabled={isGuardando}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            {tema === "dark" ? <Moon size={16} /> : <Sun size={16} />}
            <span className="flex-1 text-left">Tema</span>
            <span className="text-[10px] font-black uppercase tracking-wide text-gray-400 dark:text-white/40">
              {tema === "dark" ? "Oscuro" : "Claro"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setOpenEditar(true);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-t border-black/5 dark:border-white/5"
          >
            <PencilLine size={16} />
            Editar mi perfil
          </button>

          {tieneVariasEmpresas && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setOpenSelectorEmpresa(true);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-t border-black/5 dark:border-white/5"
            >
              <Building2 size={16} />
              Cambiar de empresa
            </button>
          )}

          <button
            type="button"
            onClick={cerrarSesion}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-500/10 transition-colors border-t border-black/5 dark:border-white/5"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      )}

      {openEditar && <EditarPerfilModal onClose={() => setOpenEditar(false)} />}
      {openSelectorEmpresa && <SelectorEmpresaModal onClose={() => setOpenSelectorEmpresa(false)} />}
    </div>
  );
};
