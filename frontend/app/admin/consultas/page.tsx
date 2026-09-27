"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { api, ApiError } from "@/lib/api"
import type { Contact, ContactStatus, PaginatedResult } from "@/lib/types"

const statusLabels: Record<ContactStatus, string> = {
  pending: "Pendiente",
  read: "Leída",
  answered: "Respondida",
}

const statusVariant: Record<ContactStatus, "default" | "secondary" | "outline"> = {
  pending: "default",
  read: "secondary",
  answered: "outline",
}

export default function ConsultasPage() {
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<PaginatedResult<Contact> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const load = () => {
    setIsLoading(true)
    api
      .get<PaginatedResult<Contact>>(`/api/admin/contacts?page=${page}&pageSize=20`)
      .then(setResult)
      .finally(() => setIsLoading(false))
  }

  useEffect(load, [page])

  const updateStatus = async (contact: Contact, status: ContactStatus) => {
    try {
      await api.patch(`/api/admin/contacts/${contact._id}/status`, { status })
      toast.success("Estado actualizado")
      load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No pudimos actualizar el estado")
    }
  }

  const remove = async (contact: Contact) => {
    if (!confirm("¿Eliminar esta consulta?")) return
    try {
      await api.delete(`/api/admin/contacts/${contact._id}`)
      toast.success("Consulta eliminada")
      load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No pudimos eliminar la consulta")
    }
  }

  const totalPages = result?.totalPages ?? 1

  return (
    <div>
      <h1 className="font-serif text-3xl tracking-tight mb-8">Consultas</h1>

      {isLoading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : !result || result.data.length === 0 ? (
        <p className="text-muted-foreground">No hay consultas recibidas.</p>
      ) : (
        <>
          <div className="space-y-4">
            {result.data.map((contact) => (
              <div key={contact._id} className="rounded-3xl border border-border bg-card p-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium">{contact.name}</h3>
                      <Badge variant={statusVariant[contact.status]} className="rounded-full">
                        {statusLabels[contact.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {contact.email}
                      {contact.phone ? ` · ${contact.phone}` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(contact.createdAt).toLocaleString("es-AR")}
                  </span>
                </div>
                <p className="font-medium text-sm mb-1">{contact.subject}</p>
                <p className="text-sm text-muted-foreground mb-4 whitespace-pre-line">{contact.message}</p>
                <div className="flex items-center gap-3">
                  <Select value={contact.status} onValueChange={(v) => updateStatus(contact, v as ContactStatus)}>
                    <SelectTrigger className="w-40 rounded-full h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="read">Leída</SelectItem>
                      <SelectItem value="answered">Respondida</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" onClick={() => remove(contact)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination className="mt-8">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink isActive={page === i + 1} onClick={() => setPage(i + 1)} className="cursor-pointer">
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  )
}
