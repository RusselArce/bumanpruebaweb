import { useMemo } from "react";
import { BtnElevado } from "@/shared/ui/buttons/BtnElevado";
import { Link, useNavigate } from "react-router-dom";
import { usePermisosEfectivos } from "@/features/permisos/hooks/usePermisosEfectivos";

type ConfigOption = {
  title: string;
  desc: string;
  /**
   * URL directa de la imagen (https://i.ibb.co/...) -> se ve en blanco y negro
   * y pasa a color al pasar el mouse. Si pones texto (ej: "PRN") se muestra tal cual.
   */
  icon: string;
  path: string;
};

const esUrl = (valor: string) => /^https?:\/\//i.test(valor.trim());

const configOptions: ConfigOption[] = [
  {
    title: "Impresoras",
    desc: "Gestiona tus comprobantes de pago",
    icon: "https://i.ibb.co/DMNwDgG/imagen-1.png",
    path: "/configurar",
  },
  {
    title: "Empresa",
    desc: "Configura tu empresa",
    icon: "EMP",
    path: "/configurar/empresa",
  },
  {
    title: "Categorias de productos",
    desc: "Asigna categorias a tus productos",
    icon: "CAT",
    path: "/configurar/categorias",
  },
  {
    title: "Productos",
    desc: "Registra tus productos",
    icon: "PRO",
    path: "/configurar/productos",
  },
  {
    title: "Clientes",
    desc: "Gestiona tus clientes",
    icon: "CLI",
    path: "/configurar/clientes",
  },
  {
    title: "Metodos de pago",
    desc: "Gestiona tus metodos de pago",
    icon: "PAY",
    path: "/configurar/metodos_pago",
  },
  {
    title: "Deudores",
    desc: "Seguimiento a clientes con deuda (fiado) y registro de pagos",
    icon: "DEU",
    path: "/configurar/deudores",
  },
  {
    title: "Pagos rápidos",
    desc: "Configura tus botones de cobro rápido en efectivo",
    icon: "S/.",
    path: "/configurar/pagos_rapidos",
  },
  {
    title: "Modificadores",
    desc: "Opciones extra para tus productos (ej: sin cebolla, extra queso)",
    icon: "MOD",
    path: "/configurar/modificadores",
  },
  {
    title: "Sucursales y cajas",
    desc: "Gestiona tus sucursales y cajas",
    icon: "CAJ",
    path: "/configurar/sucursales_cajas",
  },
  {
    title: "Usuarios",
    desc: "Gestiona tus usuarios",
    icon: "USR",
    path: "/configurar/usuarios",
  },
   {
    title: "Salones y mesas",
    desc: "Gestiona tus salones y mesas",
    icon: "MES",
    path: "/configurar/mesas",
  },
  {
    title: "Reportes",
    desc: "Exporta a Excel y PDF",
    icon: "REP",
    path: "/configurar/reportes",
  },
];

export const ConfigPage = () => {
  const navigate = useNavigate();
  const { tienePermiso, cargando, esSuperadmin } = usePermisosEfectivos();

  const opcionesVisibles = useMemo(() => {
    if (esSuperadmin) return configOptions;
    if (cargando) return [];
    return configOptions.filter((item) => tienePermiso(item.path));
  }, [cargando, esSuperadmin, tienePermiso]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#131f24] p-8 font-sans">
      <div className="mx-auto max-w-5xl">
        <section className="flex items-center gap-4 p-6">
          <span className="text-4xl font-black uppercase tracking-wide text-gray-700 dark:text-white">
            Configuraciones
          </span>
          <BtnElevado titulo="Volver" funcion={() => navigate("/")} />
        </section>

        {cargando && (
          <div className="px-6 pb-6 text-sm font-bold text-gray-400 dark:text-white/40">
            Cargando permisos...
          </div>
        )}

        {!cargando && opcionesVisibles.length === 0 && (
          <div className="px-6 pb-6 text-sm font-bold text-gray-400 dark:text-white/40">
            No tienes acceso a ninguna sección de configuración. Pide a un administrador que te asigne permisos.
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {opcionesVisibles.map((item) => (
            <div
              key={item.title}
              className="group relative cursor-pointer rounded-2xl border-2 border-b-8 border-gray-200 dark:border-[#37464f] bg-white dark:bg-[#202f36] p-6 transition-all duration-200 active:translate-y-1 active:border-b-2 hover:border-blue-400"
            >
              <Link to={item.path} className="flex flex-col items-center space-y-4 text-center">
                {esUrl(item.icon) ? (
                  <img
                    src={item.icon}
                    alt={item.title}
                    loading="lazy"
                    className="h-20 w-20 object-contain grayscale opacity-80 transition-all duration-300 group-hover:scale-110 group-hover:opacity-100 group-hover:grayscale-0"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-gray-100 dark:bg-white/5 text-xl font-black text-gray-600 dark:text-white/70 transition-all duration-300 group-hover:scale-110 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 group-hover:text-blue-600">
                    <span>{item.icon}</span>
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white group-hover:text-blue-500">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-gray-500 dark:text-white/50">{item.desc}</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
