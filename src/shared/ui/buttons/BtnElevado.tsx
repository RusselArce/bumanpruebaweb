import React from "react";

type BtnElevadoProps = {
  funcion?: () => void;
  titulo?: string;
  bgcolor?: string;   // ej: "#111827"
  color?: string;     // ej: "#ffffff"
  icono?: React.ReactNode;
  url?: string;
  disabled?: boolean;
  width?: string;     // ej: "200px" | "100%"
  height?: string;    // ej: "48px"
  border?: string;    // ej: "2px"
  decorador?: boolean; // true/false
  imagen?: string;    // url
  type?: "button" | "submit" | "reset";
};

export function BtnElevado({
  funcion,
  titulo,
  bgcolor = "#111827",
  icono,
  url,
  color = "#ffffff",
  disabled,
  width,
  height,
  border = "2px",
  decorador = false,
  imagen,
  type = "button",
}: BtnElevadoProps) {
  const isLink = Boolean(titulo && url);

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={ funcion}
      className={[
        "relative flex items-center justify-center overflow-hidden",
        "rounded-2xl font-bold text-[15px]",
        "px-[25px] py-2.5",
        "transition duration-200 ease-linear",
        "-translate-y-[3px] active:translate-y-0",
        disabled
          ? "cursor-not-allowed bg-[#646464] shadow-none"
          : "cursor-pointer",
      ].join(" ")}
      style={{
        backgroundColor: disabled ? "#646464" : bgcolor,
        color,
        width,
        height,
        borderWidth: border,
        borderStyle: "solid",
        borderColor: "rgba(50,50,50,0.2)",
        // “borde inferior” (efecto levantado)
        boxShadow: disabled ? "none" : "0 5px 0 rgba(50,50,50,0.2)",
      }}
    >
      {/* decorador circular */}
      {decorador && (
        <span
          className="pointer-events-none absolute -bottom-[15px] -right-[15px] h-10 w-10 rounded-full"
          style={{ backgroundColor: "rgba(251,251,251,0.25)" }}
        />
      )}

      <span className="flex items-center gap-3">
        {/* {icono != null && <Icono $color={color}>{icono}</Icono>} */}

        {imagen && (
          <span className="h-10 w-10 overflow-hidden rounded-[10px]">
            <img src={imagen} alt="" className="h-full w-full object-contain" />
          </span>
        )}

        {titulo &&
          (isLink ? (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-inherit no-underline"
              onClick={(e) => disabled && e.preventDefault()}
            >
              <span className="btn">{titulo}</span>
            </a>
          ) : (
            <span className="btn">{titulo}</span>
          ))}
      </span>
    </button>
  );
}
