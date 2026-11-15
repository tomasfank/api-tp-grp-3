import { Outlet, ScrollRestoration } from "react-router"
import { Analytics } from "@vercel/analytics/react"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/hooks/use-auth"

export default function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
      <ScrollRestoration />
      <Toaster position="top-center" />
      <Analytics />
    </AuthProvider>
  )
}
