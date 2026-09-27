"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
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
import { api } from "@/lib/api"
import type { Category, PaginatedResult, Service } from "@/lib/types"

const PAGE_SIZE = 9

export default function CatalogoPage() {
  return (
    <Suspense fallback={null}>
      <CatalogoContent />
    </Suspense>
  )
}

function CatalogoContent() {
  const searchParams = useSearchParams()
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [categoryId, setCategoryId] = useState<string>(() => searchParams.get("category") ?? "all")
  const [page, setPage] = useState(1)
  const [categories, setCategories] = useState<Category[]>([])
  const [result, setResult] = useState<PaginatedResult<Service> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(timeout)
  }, [search])

  useEffect(() => {
    api
      .get<Category[]>("/api/categories", { auth: false })
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, categoryId])

  useEffect(() => {
    setIsLoading(true)
    setError(null)
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("limit", String(PAGE_SIZE))
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim())
    if (categoryId !== "all") params.set("category", categoryId)

    api
      .get<PaginatedResult<Service>>(`/api/services?${params.toString()}`, { auth: false })
      .then(setResult)
      .catch(() => setError("No pudimos cargar las publicaciones. Intentá nuevamente."))
      .finally(() => setIsLoading(false))
  }, [page, debouncedSearch, categoryId])

  const categoryName = (cat: Service["category"]) => (typeof cat === "string" ? "" : cat.name)

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="pt-40 pb-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-12">
            <h1 className="font-serif text-4xl md:text-5xl tracking-tight mb-4">Catálogo de servicios</h1>
            <p className="text-muted-foreground text-lg">
              Explorá nuestros servicios, buscá por nombre o filtrá por categoría.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-10">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar servicios..."
                className="pl-11 h-12 rounded-full bg-card"
              />
            </div>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="h-12 rounded-full w-full sm:w-56 bg-card">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-destructive">{error}</p>}

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-3xl" />
              ))}
            </div>
          ) : result && result.data.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {result.data.map((service) => (
                  <Link
                    key={service._id}
                    href={`/catalogo/${service._id}`}
                    className="group rounded-3xl border border-border bg-card overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    <div className="aspect-[4/3] bg-muted overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={service.images[0] || "/placeholder-service.svg"}
                        alt={service.name}
                        onError={(e) => {
                          e.currentTarget.onerror = null
                          e.currentTarget.src = "/placeholder-service.svg"
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-6">
                      <Badge variant="secondary" className="mb-3 rounded-full">
                        {categoryName(service.category)}
                      </Badge>
                      <h3 className="font-serif text-xl mb-2">{service.name}</h3>
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{service.description}</p>
                      {service.price !== undefined && (
                        <p className="font-medium">${service.price.toLocaleString("es-AR")}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              {result.totalPages > 1 && (
                <Pagination className="mt-12">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {Array.from({ length: result.totalPages }).map((_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink isActive={page === i + 1} onClick={() => setPage(i + 1)} className="cursor-pointer">
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setPage((p) => Math.min(result.totalPages, p + 1))}
                        className={page === result.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          ) : (
            <p className="text-muted-foreground py-20 text-center">No se encontraron publicaciones.</p>
          )}
        </div>
      </section>
      <Footer />
    </main>
  )
}
