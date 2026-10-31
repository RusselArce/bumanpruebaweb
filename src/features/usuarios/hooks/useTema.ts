import { useUsuarioActualQuery } from "@/features/usuarios/hooks/usuarios.queries";
import { useEditarTemaUsuarioMutation } from "@/features/usuarios/hooks/usuarios.mutations";
import {
  aplicarTemaAlDocumento,
  leerTemaLocal,
  normalizarTema,
  type Tema,
} from "@/shared/utils/theme";

/** Tema actual + forma de cambiarlo. La UI se actualiza al instante
 * (localStorage + clase en <html>) y en paralelo se guarda en
 * usuarios.tema vía TanStack Query, para que quede como preferencia del
 * usuario entre sesiones/dispositivos. */
export const useTema = () => {
  const { data: usuarioActual, isLoading } = useUsuarioActualQuery();
  const { mutate: guardarTema, isPending: isGuardando } =
    useEditarTemaUsuarioMutation();

  const tema: Tema = usuarioActual
    ? normalizarTema(usuarioActual.tema)
    : leerTemaLocal();

  const setTema = (nuevo: Tema) => {
    aplicarTemaAlDocumento(nuevo);
    if (usuarioActual?.id) {
      guardarTema({ id: usuarioActual.id, tema: nuevo });
    }
  };

  const toggleTema = () => setTema(tema === "dark" ? "light" : "dark");

  return { tema, setTema, toggleTema, isLoading, isGuardando };
};
