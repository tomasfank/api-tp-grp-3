"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Pencil, Plus, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api, ApiError } from "@/lib/api"
import type { Category } from "@/lib/types"

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [name, setName] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const load = () => {
    setIsLoading(true)
    api
      .get<Category[]>("/api/categories")
      .then(setCategories)
      .finally(() => setIsLoading(false))
  }

  useEffect(load, [])

  const openCreate = () => {
    setEditing(null)
    setName("")
    setDialogOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditing(cat)
    setName(cat.name)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setIsSaving(true)
    try {
      if (editing) {
        await api.put(`/api/categories/${editing._id}`, { name: name.trim() })
        toast.success("Categoría actualizada")
      } else {
        await api.post("/api/categories", { name: name.trim() })
        toast.success("Categoría creada")
      }
      setDialogOpen(false)
      load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No pudimos guardar la categoría")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (cat: Category) => {
    if (!confirm(`¿Eliminar la categoría "${cat.name}"?`)) return
    try {
      await api.delete(`/api/categories/${cat._id}`)
      toast.success("Categoría eliminada")
      load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No pudimos eliminar la categoría")
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl tracking-tight">Categorías</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="rounded-full">
              <Plus className="w-4 h-4 mr-2" />
              Nueva categoría
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar categoría" : "Nueva categoría"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label htmlFor="cat-name">Nombre</Label>
              <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" />
            </div>
            <DialogFooter>
              <Button onClick={handleSave} disabled={isSaving} className="rounded-full">
                {isSaving ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : categories.length === 0 ? (
        <p className="text-muted-foreground">No hay categorías creadas.</p>
      ) : (
        <div className="rounded-3xl border border-border bg-card divide-y divide-border">
          {categories.map((cat) => (
            <div key={cat._id} className="flex items-center justify-between px-6 py-4">
              <span>{cat.name}</span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(cat)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
