"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  LayoutDashboard,
  Package,
  Tags,
  Mail,
  Building2,
  UserCog,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth, useRequireAdmin } from "@/hooks/use-auth"
import { Skeleton } from "@/components/ui/skeleton"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/servicios", label: "Publicaciones", icon: Package },
  { href: "/admin/categorias", label: "Categorías", icon: Tags },
  { href: "/admin/consultas", label: "Consultas", icon: Mail },
  { href: "/admin/negocio", label: "Negocio", icon: Building2 },
  { href: "/admin/perfil", label: "Perfil", icon: UserCog },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { isReady, isLoading } = useRequireAdmin()
  const { logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    toast.success("Sesión cerrada")
    router.push("/login")
  }

  if (isLoading || !isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Skeleton className="h-10 w-40" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 shrink-0 border-r border-border p-6 hidden md:flex flex-col justify-between">
        <div>
          <Link href="/" className="text-lg font-medium tracking-tight mb-10 block">
            Vaultra <span className="text-muted-foreground text-sm">/ admin</span>
          </Link>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </aside>
      <main className="flex-1 p-6 md:p-10 max-w-6xl">{children}</main>
    </div>
  )
}
