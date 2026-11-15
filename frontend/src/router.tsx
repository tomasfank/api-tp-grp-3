import { createBrowserRouter } from "react-router"
import RootLayout from "@/layouts/RootLayout"
import AdminLayout from "@/layouts/AdminLayout"
import HomePage from "@/pages/HomePage"
import CatalogoPage from "@/pages/CatalogoPage"
import ServicioDetallePage from "@/pages/ServicioDetallePage"
import LoginPage from "@/pages/LoginPage"
import RegistroPage from "@/pages/RegistroPage"
import RecuperarPasswordPage from "@/pages/RecuperarPasswordPage"
import RestablecerPasswordPage from "@/pages/RestablecerPasswordPage"
import NotFoundPage from "@/pages/NotFoundPage"
import DashboardPage from "@/pages/admin/DashboardPage"
import ServiciosPage from "@/pages/admin/ServiciosPage"
import NuevoServicioPage from "@/pages/admin/NuevoServicioPage"
import EditarServicioPage from "@/pages/admin/EditarServicioPage"
import CategoriasPage from "@/pages/admin/CategoriasPage"
import ConsultasPage from "@/pages/admin/ConsultasPage"
import NegocioPage from "@/pages/admin/NegocioPage"
import PerfilPage from "@/pages/admin/PerfilPage"

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/catalogo", element: <CatalogoPage /> },
      { path: "/catalogo/:id", element: <ServicioDetallePage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/registro", element: <RegistroPage /> },
      { path: "/recuperar-password", element: <RecuperarPasswordPage /> },
      { path: "/restablecer-password", element: <RestablecerPasswordPage /> },
      {
        path: "/admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "servicios", element: <ServiciosPage /> },
          { path: "servicios/nuevo", element: <NuevoServicioPage /> },
          { path: "servicios/:id/editar", element: <EditarServicioPage /> },
          { path: "categorias", element: <CategoriasPage /> },
          { path: "consultas", element: <ConsultasPage /> },
          { path: "negocio", element: <NegocioPage /> },
          { path: "perfil", element: <PerfilPage /> },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
])
