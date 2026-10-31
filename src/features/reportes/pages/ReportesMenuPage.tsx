import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { BtnVolver } from "@/shared/ui/buttons/BtnVolver";

type ReporteOption = {
  title: string;
  desc: string;
  icon: string;
  path: string;
};

const opciones: ReporteOption[] = [
  {
    title: "Ventas",
    desc: "Resumen de ventas confirmadas, IGV, propinas y el detalle completo.",
    icon: "mdi:cash-register",
    path: "/configurar/reportes/ventas",
  },
  {
    title: "Productos",
    desc: "Ranking de productos más vendidos por cantidad y monto.",
    icon: "mdi:food-drumstick",
    path: "/configurar/reportes/productos",
  },
  {
    title: "Mesas",
    desc: "Qué mesas (y pedidos para llevar) generan más ventas.",
    icon: "mdi:table-chair",
    path: "/configurar/reportes/mesas",
  },
  {
    title: "Métodos de pago",
    desc: "Cuánto se cobró en efectivo, tarjeta y otros medios.",
    icon: "mdi:credit-card-outline",
    path: "/configurar/reportes/metodos-pago",
  },
  {
    title: "Usuarios",
    desc: "Ventas atendidas por cada mesero o cajero.",
    icon: "mdi:account-group",
    path: "/configurar/reportes/usuarios",
  },
  {
    title: "Rentabilidad",
    desc: "Margen de ganancia por producto: ingresos vs. costo.",
    icon: "mdi:chart-line",
    path: "/configurar/reportes/rentabilidad",
  },
  {
    title: "Horas pico y valle",
    desc: "En qué horas del día se vende más y menos.",
    icon: "mdi:clock-time-four-outline",
    path: "/configurar/reportes/horas",
  },
];

export const ReportesMenuPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#131f24] p-8 font-sans">
      <div className="mx-auto max-w-5xl">
        <section className="flex items-center gap-4 p-6">
          <BtnVolver onClick={() => navigate("/configurar")} />
          <span className="text-4xl font-black uppercase tracking-wide text-gray-700 dark:text-white">
            Reportes
          </span>
        </section>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {opciones.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="group relative cursor-pointer rounded-2xl border-2 border-b-8 border-gray-200 dark:border-[#37464f] bg-white dark:bg-[#202f36] p-6 transition-all duration-200 active:translate-y-1 active:border-b-2 hover:border-blue-400 flex flex-col items-center space-y-4 text-center"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100 dark:bg-white/5 text-3xl text-gray-600 dark:text-white/70 transition-all duration-300 group-hover:scale-110 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 group-hover:text-blue-600">
                <Icon icon={item.icon} />
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white group-hover:text-blue-500">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm font-medium text-gray-500 dark:text-white/50">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
