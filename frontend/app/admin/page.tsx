"use client"

import { useEffect, useState } from "react"
import { Package, Mail, Tags } from "lucide-react"
import { api } from "@/lib/api"
import type { Category, Contact, PaginatedResult, Service } from "@/lib/types"

export default function AdminDashboardPage() {
  const [totalServices, setTotalServices] = useState<number | null>(null)
  const [categories, setCategories] = useState<number | null>(null)
  const [pendingContacts, setPendingContacts] = useState<number | null>(null)

  useEffect(() => {
    api
      .get<PaginatedResult<Service>>("/api/services/admin/all?limit=1")
      .then((res) => setTotalServices(res.total))
      .catch(() => setTotalServices(0))

    api
      .get<Category[]>("/api/categories")
      .then((res) => setCategories(res.length))
      .catch(() => setCategories(0))

    api
      .get<PaginatedResult<Contact>>("/api/admin/contacts?pageSize=100")
      .then((res) => setPendingContacts(res.data.filter((c) => c.status === "pending").length))
      .catch(() => setPendingContacts(0))
  }, [])

  const cards = [
    { label: "Publicaciones totales", value: totalServices, icon: Package },
    { label: "Categorías", value: categories, icon: Tags },
    { label: "Consultas pendientes", value: pendingContacts, icon: Mail },
  ]

  return (
    <div>
      <h1 className="font-serif text-3xl tracking-tight mb-8">Dashboard</h1>
      <div className="grid sm:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div key={card.label} className="rounded-3xl border border-border bg-card p-6">
            <card.icon className="w-5 h-5 text-muted-foreground mb-4" />
            <p className="text-3xl font-medium mb-1">{card.value ?? "…"}</p>
            <p className="text-sm text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
