import React from 'react';
import { ArrowLeft } from 'lucide-react'; // O cualquier librería de iconos que uses

interface BtnVolverProps {
  onClick: () => void;
}

export const BtnVolver: React.FC<BtnVolverProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="
      top-3 left-3
        group
        
        flex
        items-center
        justify-center
        w-12
        h-12
        rounded-full
        bg-[#2c2c2c]        /* Color verde principal */
        border-b-4          /* El 'grosor' inferior de Duolingo */
        border-[#474747]    /* Verde más oscuro para la sombra */
        active:border-b-0   /* Efecto de presionar */
        active:translate-y-[2px] 
        transition-all
        duration-100
        hover:brightness-110
      "
    >
      <ArrowLeft 
        size={24} 
        strokeWidth={3} 
        className="text-white" 
      />
    </button>
  );
};