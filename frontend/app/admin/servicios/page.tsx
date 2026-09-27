"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api, ApiError } from "@/lib/api"
import type { PaginatedResult, Service } from "@/lib/types"

export default function ServiciosPage() {
  const [services, setServices] = useState<Service[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const load = () => {
    setIsLoading(true)
    const params = new URLSearchParams({ limit: "100" })
    if (search.trim()) params.set("search", search.trim())
    api
      .get<PaginatedResult<Service>>(`/api/services/admin/all?${params.toString()}`)
      .then((res) => setServices(res.data))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    const timeout = setTimeout(load, 300)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const toggleStatus = async (service: Service) => {
    const next = service.availabilityStatus === "active" ? "inactive" : "active"
    try {
      await api.patch(`/api/services/${service._id}/status`, { availabilityStatus: next })
      toast.success(next === "inactive" ? "Publicación desactivada" : "Publicación activada")
      load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No pudimos actualizar el estado")
    }
  }

  const remove = async (service: Service) => {
    if (!confirm(`¿Eliminar "${service.name}"?`)) return
    try {
      await api.delete(`/api/services/${service._id}`)
      toast.success("Publicación eliminada")
      load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No pudimos eliminar la publicación")
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 gap-4">
        <h1 className="font-serif text-3xl tracking-tight">Publicaciones</h1>
        <Link href="/admin/servicios/nuevo">
          <Button className="rounded-full">
            <Plus className="w-4 h-4 mr-2" />
            Nueva publicación
          </Button>
        </Link>
      </div>

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nombre o descripción..."
        className="rounded-full h-11 mb-6 max-w-sm"
      />

      {isLoading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : services.length === 0 ? (
        <p className="text-muted-foreground">No se encontraron publicaciones.</p>
      ) : (
        <div className="rounded-3xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Activo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service._id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="rounded-full">
                      {typeof service.category === "string" ? "" : service.category.name}
                    </Badge>
                  </TableCell>
                  <TableCell>{service.price !== undefined ? `$${service.price.toLocaleString("es-AR")}` : "—"}</TableCell>
                  <TableCell>
                    <Switch
                      checked={service.availabilityStatus === "active"}
                      onCheckedChange={() => toggleStatus(service)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/servicios/${service._id}/editar`}>
                      <Button variant="ghost" size="icon">
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => remove(service)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
