import React from "react";
import {
  Link,
  isRouteErrorResponse,
  useNavigate,
  useRouteError,
} from "react-router-dom";

export function ErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  const info = React.useMemo(() => {
    if (isRouteErrorResponse(error)) {
      return {
        titulo: `Ocurrió un error (${error.status})`,
        descripcion: error.statusText || "No se pudo completar la operación.",
        detalle:
          typeof error.data === "string"
            ? error.data
            : "Intenta nuevamente o vuelve al inicio.",
      };
    }

    if (error instanceof Error) {
      return {
        titulo: "Ocurrió un error inesperado",
        descripcion: error.message || "Algo falló al cargar esta pantalla.",
        detalle: "Si el problema persiste, revisa consola o intenta recargar.",
      };
    }

    return {
      titulo: "Ocurrió un error",
      descripcion: "Algo falló al cargar esta pantalla.",
      detalle: "Intenta recargar o vuelve al inicio.",
    };
  }, [error]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#131f24] text-neutral-900 dark:text-white">
      <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-4 py-10">
        <div className="w-full rounded-2xl border border-neutral-200 dark:border-[#37464f] bg-white dark:bg-[#202f36] p-6 shadow-sm sm:p-10">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-neutral-200 dark:border-[#37464f] bg-neutral-50 dark:bg-white/5">
              {/* icon */}
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6 text-neutral-700 dark:text-white/70"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v4m0 4h.01M10.29 3.86l-8.1 14.04A2 2 0 0 0 3.93 21h16.14a2 2 0 0 0 1.74-3.1l-8.1-14.04a2 2 0 0 0-3.46 0Z"
                />
              </svg>
            </div>

            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {info.titulo}
              </h1>
              <p className="mt-1 text-sm text-neutral-600 dark:text-white/50 sm:text-base">
                {info.descripcion}
              </p>

              <div className="mt-4 rounded-xl border border-neutral-200 dark:border-[#37464f] bg-neutral-50 dark:bg-white/5 p-4">
                <p className="text-sm text-neutral-700 dark:text-white/70">{info.detalle}</p>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  onClick={() => navigate(0)}
                  className="inline-flex items-center justify-center rounded-xl border border-neutral-300 dark:border-[#37464f] bg-white dark:bg-[#131f24] px-4 py-2 text-sm font-medium text-neutral-900 dark:text-white shadow-sm hover:bg-neutral-50 dark:hover:bg-white/10 active:scale-[0.99]"
                >
                  Recargar
                </button>

                <Link
                  to="/"
                  className="inline-flex items-center justify-center rounded-xl bg-neutral-900 dark:bg-white px-4 py-2 text-sm font-medium text-white dark:text-black shadow-sm hover:bg-neutral-800 dark:hover:bg-white/80 active:scale-[0.99]"
                >
                  Volver al inicio
                </Link>

                <button
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-neutral-700 dark:text-white/70 hover:bg-neutral-100 dark:hover:bg-white/10 active:scale-[0.99]"
                >
                  Volver atrás
                </button>
              </div>

              <p className="mt-6 text-xs text-neutral-500 dark:text-white/40">
                Consejo: si esto ocurre en producción, revisa tus <span className="font-medium">loaders/actions</span> o
                el estado de red.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
