"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { api, ApiError } from "@/lib/api"
import type { Category, Service } from "@/lib/types"

const schema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido").max(100),
  category: z.string().min(1, "La categoría es requerida"),
  description: z.string().trim().min(1, "La descripción es requerida").max(2000),
  price: z.string().optional(),
  availabilityStatus: z.enum(["active", "inactive"]),
  images: z
    .array(z.object({ url: z.string().url("Debe ser una URL válida") }))
    .min(1, "Debe proporcionar al menos 1 imagen")
    .max(10, "No puede proporcionar más de 10 imágenes"),
})

type FormValues = z.infer<typeof schema>

interface ServiceFormProps {
  service?: Service
}

export function ServiceForm({ service }: ServiceFormProps) {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    api
      .get<Category[]>("/api/categories")
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: service?.name ?? "",
      category: typeof service?.category === "string" ? service.category : service?.category?._id ?? "",
      description: service?.description ?? "",
      price: service?.price !== undefined ? String(service.price) : "",
      availabilityStatus: service?.availabilityStatus ?? "active",
      images: service?.images?.length ? service.images.map((url) => ({ url })) : [{ url: "" }],
    },
  })

  const images = form.watch("images")

  const addImage = () => {
    if (images.length >= 10) return
    form.setValue("images", [...images, { url: "" }])
  }

  const removeImage = (index: number) => {
    form.setValue(
      "images",
      images.filter((_, i) => i !== index),
    )
  }

  const onSubmit = async (values: FormValues) => {
    const payload = {
      name: values.name,
      category: values.category,
      description: values.description,
      images: values.images.map((i) => i.url).filter(Boolean),
      availabilityStatus: values.availabilityStatus,
      price: values.price ? Number(values.price) : undefined,
    }

    try {
      if (service) {
        await api.put(`/api/services/${service._id}`, payload)
        toast.success("Publicación actualizada")
      } else {
        await api.post("/api/services", payload)
        toast.success("Publicación creada")
      }
      router.push("/admin/servicios")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No pudimos guardar la publicación")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 max-w-2xl">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input {...field} className="rounded-xl h-12" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="rounded-xl h-12 w-full">
                    <SelectValue placeholder="Seleccioná una categoría" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea rows={5} {...field} className="rounded-xl" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio (opcional)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" {...field} className="rounded-xl h-12" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="availabilityStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl h-12 w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <FormLabel>Imágenes (URLs)</FormLabel>
          <div className="space-y-3 mt-2">
            {images.map((_, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={images[index]?.url ?? ""}
                  onChange={(e) => {
                    const next = [...images]
                    next[index] = { url: e.target.value }
                    form.setValue("images", next)
                  }}
                  placeholder="https://..."
                  className="rounded-xl h-12"
                />
                {images.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeImage(index)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {form.formState.errors.images && (
            <p className="text-sm text-destructive mt-2">
              {form.formState.errors.images.message ?? "Revisá las URLs ingresadas"}
            </p>
          )}
          <Button type="button" variant="outline" size="sm" onClick={addImage} className="mt-3 rounded-full">
            <Plus className="w-4 h-4 mr-1" />
            Agregar imagen
          </Button>
        </div>

        <Button type="submit" disabled={form.formState.isSubmitting} className="rounded-full h-12 px-8">
          {form.formState.isSubmitting ? "Guardando..." : service ? "Guardar cambios" : "Crear publicación"}
        </Button>
      </form>
    </Form>
  )
}
