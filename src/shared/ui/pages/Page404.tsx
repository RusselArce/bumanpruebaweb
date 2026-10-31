import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { BtnElevado } from "../buttons/BtnElevado";

export function Page404() {
  const navigate = useNavigate();
  return (
    <div className="relative min-h-screen bg-white dark:bg-[#131f24] text-neutral-900 dark:text-white">
      {/* 404 gigante al fondo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center select-none"
      >
        <div className="text-[180px] font-extrabold tracking-tight text-neutral-100 dark:text-white/5 sm:text-[240px] md:text-[320px]">
          404
        </div>
      </div>

      {/* Contenido centrado */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
        <BoxIcon className="h-24 w-24 text-neutral-900 dark:text-white sm:h-28 sm:w-28" />

        <h1 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">
          Oops… caja equivocada.
        </h1>

        <p className="mt-3 max-w-md text-sm leading-6 text-neutral-600 dark:text-white/50 sm:text-base mb-8">
          La página que buscas no existe o cambió de lugar. Nada grave: vuelve
          al inicio.
        </p>
        <BtnElevado titulo="IR A HOME" funcion={() => navigate("/")} />
      </div>
    </div>
  );
}

function BoxIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Caja"
    >
      {/* Sparkles */}
      <path
        d="M63 18l6 3-6 3"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
      <path
        d="M72 12l4 4-4 4"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
      <path
        d="M62 10l3-5 3 5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />

      {/* Floating papers */}
      <rect
        x="18"
        y="12"
        width="16"
        height="16"
        rx="3"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.9"
      />
      <path
        d="M22 20c3-3 7-3 10 0"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.9"
      />

      <rect
        x="42"
        y="10"
        width="16"
        height="16"
        rx="3"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.9"
      />
      <path
        d="M45 14h10M45 18h10M45 22h10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.9"
      />

      {/* Box */}
      <path
        d="M48 30 22 42v28l26 12 26-12V42L48 30Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M48 30v52"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M22 42 48 54l26-12"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M48 54 74 42"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
        opacity="0.6"
      />

      {/* Box top fill (simple) */}
      <path
        d="M48 30 22 42l26 12 26-12L48 30Z"
        fill="currentColor"
        opacity="0.08"
      />
    </svg>
  );
}
