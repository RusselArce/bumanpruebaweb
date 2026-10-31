import { createBrowserRouter, Outlet } from "react-router-dom";
import { VisorMesasPage } from "../../features/visorMesas/pages/VisorMesasPage";
import { PuntoVenta } from "../../features/puntoVenta/pages/PuntoVenta";
import { ModuloCocinaPage } from "../../features/visorCocina/ModuloCocinaPage";
import { LoginPage } from "../../features/login/pages/LoginPage";
import { PublicRoute } from "./PublicRoute";
import { ProtectedLayout } from "./ProtectedLayout";
import { ErrorPage } from "@/shared/ui/pages/ErrorPage";
import { Page404 } from "@/shared/ui/pages/Page404";
import { requireMesaLoader } from "@/features/puntoVenta/loaders/requireMesa.loader";
import { ConfigurarMesas } from "@/features/mesas/pages/ConfigurarMesas";
import { CocinaPage } from "@/features/cocina/CocinaPage";
import { ConfigPage } from "@/features/config/pages/ConfigPage";
import { CategoriasCrudPage } from "@/features/categorias_productos/pages/CategoriasCrudPage";
import { ClientesCrudPage } from "@/features/clientes/pages/ClientesCrudPage";
import { MetodosPagoCrudPage } from "@/features/metodos_pago/pages/MetodosPagoCrudPage";
import { UsuariosCrudPage } from "@/features/usuarios/pages/UsuariosCrudPage";
import { ProductosCrudPage } from "@/features/productos/pages/ProductosCrudPage";
import { SucursalesCajasPage } from "@/features/sucursales_cajas/pages/SucursalesCajasPage";
import { CierreCajaModal } from "@/features/sucursales_cajas/components/CierreCajaModal";
import { EmpresaPage } from "@/features/empresa/pages/EmpresaPage";
import { MovimientosVariosPage } from "@/features/movimientos_caja/pages/MovimientosVariosPage";
import { PagosRapidosCrudPage } from "@/features/pagos_rapidos/pages/PagosRapidosCrudPage";
import { ModificadoresCrudPage } from "@/features/modificadores/pages/ModificadoresCrudPage";
import { ReportesMenuPage } from "@/features/reportes/pages/ReportesMenuPage";
import { ReporteVentasPage } from "@/features/reportes/pages/ReporteVentasPage";
import { ReporteProductosPage } from "@/features/reportes/pages/ReporteProductosPage";
import { ReporteMesasPage } from "@/features/reportes/pages/ReporteMesasPage";
import { ReporteMetodosPagoPage } from "@/features/reportes/pages/ReporteMetodosPagoPage";
import { ReporteUsuariosPage } from "@/features/reportes/pages/ReporteUsuariosPage";
import { ReporteRentabilidadPage } from "@/features/reportes/pages/ReporteRentabilidadPage";
import { ReporteHorasPage } from "@/features/reportes/pages/ReporteHorasPage";
import { CuentasPorCobrarPage } from "@/features/cuentas_cobrar/pages/CuentasPorCobrarPage";
import { PermisoRoute } from "@/features/permisos/components/PermisoRoute";

export const router = createBrowserRouter([
  //publico
  {
    path: "/login",
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
    errorElement: <ErrorPage />, // errores del login
  },
  // ✅ Zona protegida
  // resto protegido
  {
    path: "/",
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <VisorMesasPage /> },
      {
        path: "punto-venta",
        element: <PuntoVenta />,
        loader: requireMesaLoader,
      },
      { path: "visor-cocina", element: <ModuloCocinaPage /> },
       { path: "cierre-caja", element: <CierreCajaModal /> },
       {
         path: "ingresos-varios",
         element: <MovimientosVariosPage tipo="ingreso" titulo="Ingresos varios" />,
       },
       {
         path: "gastos-varios",
         element: <MovimientosVariosPage tipo="gasto" titulo="Gastos varios" />,
       },
      
      { path: "cocina", element: <CocinaPage /> },
      {
        path: "configurar",

        children: [
          { index: true, element: <ConfigPage /> },
          {
            path: "categorias",
            element: (
              <PermisoRoute link="/configurar/categorias">
                <CategoriasCrudPage />
              </PermisoRoute>
            ),
          },
          {
            path: "empresa",
            element: (
              <PermisoRoute link="/configurar/empresa">
                <EmpresaPage />
              </PermisoRoute>
            ),
          },
          {
            path: "clientes",
            element: (
              <PermisoRoute link="/configurar/clientes">
                <ClientesCrudPage />
              </PermisoRoute>
            ),
          },
          {
            path: "metodos_pago",
            element: (
              <PermisoRoute link="/configurar/metodos_pago">
                <MetodosPagoCrudPage />
              </PermisoRoute>
            ),
          },
          {
            path: "deudores",
            element: (
              <PermisoRoute link="/configurar/deudores">
                <CuentasPorCobrarPage />
              </PermisoRoute>
            ),
          },
          {
            path: "pagos_rapidos",
            element: (
              <PermisoRoute link="/configurar/pagos_rapidos">
                <PagosRapidosCrudPage />
              </PermisoRoute>
            ),
          },
          {
            path: "modificadores",
            element: (
              <PermisoRoute link="/configurar/modificadores">
                <ModificadoresCrudPage />
              </PermisoRoute>
            ),
          },
          {
            path: "usuarios",
            element: (
              <PermisoRoute link="/configurar/usuarios">
                <UsuariosCrudPage />
              </PermisoRoute>
            ),
          },
          {
            path: "productos",
            element: (
              <PermisoRoute link="/configurar/productos">
                <ProductosCrudPage />
              </PermisoRoute>
            ),
          },
          {
            path: "sucursales_cajas",
            element: (
              <PermisoRoute link="/configurar/sucursales_cajas">
                <SucursalesCajasPage />
              </PermisoRoute>
            ),
          },
          {
            path: "mesas",
            element: (
              <PermisoRoute link="/configurar/mesas">
                <ConfigurarMesas />
              </PermisoRoute>
            ),
          },
          {
            path: "reportes",
            element: (
              <PermisoRoute link="/configurar/reportes">
                <Outlet />
              </PermisoRoute>
            ),
            children: [
              { index: true, element: <ReportesMenuPage /> },
              { path: "ventas", element: <ReporteVentasPage /> },
              { path: "productos", element: <ReporteProductosPage /> },
              { path: "mesas", element: <ReporteMesasPage /> },
              { path: "metodos-pago", element: <ReporteMetodosPagoPage /> },
              { path: "usuarios", element: <ReporteUsuariosPage /> },
              { path: "rentabilidad", element: <ReporteRentabilidadPage /> },
              { path: "horas", element: <ReporteHorasPage /> },
            ],
          },
        ],
      },
      // ✅ 404 "local" (se ve dentro del layout protegido)
      { path: "*", element: <Page404 /> },
    ],
  },
]);
