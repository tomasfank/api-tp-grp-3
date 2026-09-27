"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ServiceForm } from "@/components/admin/service-form"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import type { Service } from "@/lib/types"

export default function EditarServicioPage() {
  const params = useParams<{ id: string }>()
  const [service, setService] = useState<Service | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api
      .get<Service>(`/api/services/admin/${params.id}`)
      .then(setService)
      .finally(() => setIsLoading(false))
  }, [params.id])

  return (
    <div>
      <h1 className="font-serif text-3xl tracking-tight mb-8">Editar publicación</h1>
      {isLoading ? (
        <Skeleton className="h-96 w-full max-w-2xl rounded-3xl" />
      ) : service ? (
        <ServiceForm service={service} />
      ) : (
        <p className="text-muted-foreground">No pudimos cargar la publicación.</p>
      )}
    </div>
  )
}
