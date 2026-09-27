"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { api, ApiError } from "@/lib/api"
import type { Service } from "@/lib/types"

export default function ServiceDetailPage() {
  const params = useParams<{ id: string }>()
  const [service, setService] = useState<Service | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    api
      .get<Service>(`/api/services/${params.id}`, { auth: false })
      .then(setService)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true)
      })
      .finally(() => setIsLoading(false))
  }, [params.id])

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="pt-40 pb-24 px-4">
        <div className="max-w-5xl mx-auto">
          <Link href="/catalogo" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="w-4 h-4" />
            Volver al catálogo
          </Link>

          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-10">
              <Skeleton className="aspect-square rounded-3xl" />
              <div className="space-y-4">
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          ) : notFound || !service ? (
            <p className="text-muted-foreground py-20 text-center">No encontramos esta publicación.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-10">
              <div className="rounded-3xl overflow-hidden bg-muted aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={service.images[0] || "/placeholder-service.svg"}
                  alt={service.name}
                  onError={(e) => {
                    e.currentTarget.onerror = null
                    e.currentTarget.src = "/placeholder-service.svg"
                  }}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <Badge variant="secondary" className="mb-4 rounded-full">
                  {typeof service.category === "string" ? "" : service.category.name}
                </Badge>
                <h1 className="font-serif text-3xl md:text-4xl tracking-tight mb-4">{service.name}</h1>
                <p className="text-muted-foreground text-lg leading-relaxed mb-6 whitespace-pre-line">
                  {service.description}
                </p>
                {service.price !== undefined && (
                  <p className="text-2xl font-medium mb-6">${service.price.toLocaleString("es-AR")}</p>
                )}
                {service.images.length > 1 && (
                  <div className="flex gap-3 mb-8 flex-wrap">
                    {service.images.slice(1).map((img, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={img || "/placeholder-service.svg"}
                        alt=""
                        onError={(e) => {
                          e.currentTarget.onerror = null
                          e.currentTarget.src = "/placeholder-service.svg"
                        }}
                        className="w-20 h-20 object-cover rounded-xl border border-border"
                      />
                    ))}
                  </div>
                )}
                <Link
                  href="/#contacto"
                  className="inline-flex items-center rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm hover:opacity-90 transition-opacity"
                >
                  Consultar por este servicio
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  )
}
