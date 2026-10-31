import React from "react";

interface ActionButtonProps {
  text: string;
  color: "green" | "orange" | "red" | "locked";
  onClick?: () => void;
  disabled?: boolean;
  extra?: React.ReactNode;
}

export const ActionButton: React.FC<ActionButtonProps> = ({ text, color, onClick, disabled, extra }) => {
  const colorClasses = {
    green: "from-lime-400 to-green-600 hover:from-lime-300 hover:to-green-500",
    orange: "from-orange-400 to-amber-600 hover:from-orange-300 hover:to-amber-500",
    red: "from-red-500 to-rose-700 hover:from-red-400 hover:to-rose-600",
    // sin permiso: gris apagado y sin brillo, para que se note a simple
    // vista que NO es una acción disponible (a diferencia de red, que sí lo es)
    locked: "from-gray-400 to-gray-600 dark:from-gray-600 dark:to-gray-800 grayscale",
  };

  const base =
    "p-3 h-16 rounded-2xl text-white font-semibold flex flex-col items-center justify-center text-center shadow-md transition-all duration-200 transform hover:scale-105 gap-1";

  const isLocked = color === "locked";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${base} bg-gradient-to-br ${colorClasses[color]} ${
        isLocked
          ? "opacity-70 cursor-not-allowed hover:scale-100 shadow-none saturate-50"
          : "shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_5px_10px_rgba(0,0,0,0.3)]"
      } ${disabled && !isLocked ? "opacity-60 cursor-not-allowed hover:scale-100" : ""} ${
        disabled ? "" : "cursor-pointer"
      }`}
    >
      <span>{text}</span>
      {extra}
    </button>
  );
};
