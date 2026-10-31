import { useEffect, type ReactNode } from "react";
import { useUsuarioActualQuery } from "@/features/usuarios/hooks/usuarios.queries";
import { aplicarTemaAlDocumento, leerTemaLocal, normalizarTema } from "@/shared/utils/theme";

type Props = { children: ReactNode };

/** Aplica el tema al <html> en cuanto arranca la app (usando lo último
 * guardado en este navegador, para no parpadear) y otra vez cuando llega
 * el usuario logueado desde la BD, por si prefiere otro. */
export const ThemeProvider = ({ children }: Props) => {
  const { data: usuarioActual } = useUsuarioActualQuery();

  useEffect(() => {
    aplicarTemaAlDocumento(leerTemaLocal());
  }, []);

  useEffect(() => {
    if (usuarioActual?.tema) {
      aplicarTemaAlDocumento(normalizarTema(usuarioActual.tema));
    }
  }, [usuarioActual?.tema]);

  return <>{children}</>;
};
