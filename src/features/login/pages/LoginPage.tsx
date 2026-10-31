import { useAuthStore } from "@/shared/store/auth.store";
import React from "react";

export const LoginPage: React.FC = () => {
  const { loginGoogle } = useAuthStore();

  return (
    <div className="min-h-screen w-full bg-[#f7f7f7] flex font-sans relative overflow-hidden">

      {/* puntitos de fondo, estilo tablero de juego */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#9CA3AF 1.5px, transparent 1.5px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="hidden lg:block w-1/2 relative p-4">
        <div
          className="relative w-full h-full rounded-[2.5rem] border-2 border-black/10 shadow-inner overflow-hidden bg-gray-50"
          style={{
            backgroundImage: "radial-gradient(#d1d5db 1.5px, transparent 0)",
            backgroundSize: "30px 30px",
          }}
        >
          <div className="absolute top-8 left-8 right-8">
            <p className="text-xs font-black uppercase tracking-widest text-[#58cc02]">Buman en acción</p>
            <h2 className="text-2xl font-black text-gray-900 leading-snug mt-1 max-w-[280px]">
              Tu restaurante, así de simple. 🎮
            </h2>
          </div>

          {/* "mesas" de beneficios, esparcidas como en el mapa de mesas */}
          <BeneficioMesa
            emoji="⚡"
            titulo="Pedidos rápidos"
            etiqueta="En segundos"
            bg="#58cc02"
            border="#46a302"
            style={{ top: "34%", left: "8%", transform: "rotate(-6deg)" }}
          />
          <BeneficioMesa
            emoji="🧾"
            titulo="Cuentas claras"
            etiqueta="Se dividen fácil"
            bg="#1cb0f6"
            border="#1899d6"
            style={{ top: "24%", right: "10%", transform: "rotate(5deg)" }}
          />
          <BeneficioMesa
            emoji="📊"
            titulo="Reportes al día"
            etiqueta="Tiempo real"
            bg="#ffd900"
            border="#d4b100"
            textDark
            style={{ top: "58%", left: "20%", transform: "rotate(4deg)" }}
          />
          <BeneficioMesa
            emoji="🍽"
            titulo="Todas tus mesas"
            etiqueta="En un solo mapa"
            bg="#ff9600"
            border="#cc7a00"
            style={{ bottom: "10%", right: "14%", transform: "rotate(-4deg)" }}
          />
          <BeneficioMesa
            emoji="📺"
            titulo="Visor de cocina"
            etiqueta="Adiós a las impresoras"
            bg="#ff4b4b"
            border="#d33131"
            style={{ bottom: "24%", left: "42%", transform: "rotate(3deg)" }}
          />

        
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between p-10 lg:p-16 relative z-10">

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-lime-400 to-green-500 flex items-center justify-center text-white text-xl shadow-lg shadow-lime-500/40 border-b-4 border-green-600">
            🍽
          </div>
          <span className="text-xl font-black tracking-tight text-gray-900">buman</span>
        </div>

        <div className="max-w-xs w-full mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-gray-900 leading-tight">
              ¡Bienvenido<br />de vuelta! <span className="inline-block animate-[wiggle_1.8s_ease-in-out_infinite]">👋</span>
            </h1>
            <p className="text-gray-500 text-sm font-semibold">
              Ingresa para gestionar tu restaurante.
            </p>
          </div>

          <button
            onClick={loginGoogle}
            className="w-full group flex items-center justify-center gap-3 border-2 border-gray-200 border-b-4 bg-white text-gray-700 font-black uppercase tracking-wide text-sm py-3.5 px-5 rounded-2xl transition-all duration-100 active:border-b-2 active:translate-y-0.5 hover:brightness-105 cursor-pointer"
          >
            <GoogleIcon />
            Ingresar con Google
          </button>

          <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
            Al ingresar aceptas los{" "}
            <span className="text-[#58cc02] font-bold underline cursor-pointer">términos de uso</span> y la{" "}
            <span className="text-[#58cc02] font-bold underline cursor-pointer">política de privacidad</span>.
          </p>
        </div>

        <p className="text-[11px] text-gray-300 text-center lg:text-left font-semibold">
          © {new Date().getFullYear()} Buman S.A · Todos los derechos reservados
        </p>
      </div>
    </div>
  );
};

type BeneficioMesaProps = {
  emoji: string;
  titulo: string;
  etiqueta: string;
  bg: string;
  border: string;
  textDark?: boolean;
  style?: React.CSSProperties;
};

function BeneficioMesa({ emoji, titulo, etiqueta, bg, border, textDark, style }: BeneficioMesaProps) {
  const textColor = textDark ? "text-[#131f24]" : "text-white";

  return (
    <div className="absolute" style={style}>
      <div
        className="w-[152px] rounded-[1.5rem] border-b-[6px] px-4 py-4 shadow-lg flex flex-col items-center text-center gap-1.5 transition-transform hover:-translate-y-1"
        style={{ backgroundColor: bg, borderColor: border }}
      >
        <span className="text-3xl leading-none">{emoji}</span>
        <span className={`font-black text-sm leading-tight ${textColor}`}>{titulo}</span>
        <span
          className={`text-[9px] font-black uppercase tracking-widest px-2 py-[3px] rounded-full ${
            textDark ? "bg-black/10 text-[#131f24]/80" : "bg-black/15 text-white/90"
          }`}
        >
          {etiqueta}
        </span>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" className="shrink-0">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
