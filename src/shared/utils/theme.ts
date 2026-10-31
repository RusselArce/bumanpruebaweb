export type Tema = "light" | "dark";

export const TEMA_STORAGE_KEY = "buman:tema";

export const normalizarTema = (valor: unknown): Tema =>
  valor === "light" ? "light" : "dark";

/** Aplica el tema al <html> (clase "dark" que activa el @custom-variant de
 * Tailwind) y lo guarda localmente para pintar sin parpadeo antes de que
 * cargue el usuario desde la base de datos. */
export const aplicarTemaAlDocumento = (tema: Tema) => {
  const root = document.documentElement;
  root.classList.toggle("dark", tema === "dark");
  root.style.colorScheme = tema;
  try {
    localStorage.setItem(TEMA_STORAGE_KEY, tema);
  } catch {
    // localStorage puede fallar en modo privado; no es crítico.
  }
};

export const leerTemaLocal = (): Tema => {
  try {
    return normalizarTema(localStorage.getItem(TEMA_STORAGE_KEY));
  } catch {
    return "dark";
  }
};
