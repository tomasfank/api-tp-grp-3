import { useEffect, useState, type ChangeEvent, type FormEvent } from "react"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"
import { Field } from "@/components/field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { api, ApiError } from "@/lib/api"
import type { AvailabilityStatus, Category, Service } from "@/lib/types"
import { isValid, required, validateUrl, type FormErrors } from "@/lib/validation"

const MAX_IMAGES = 10

interface ServiceFormProps {
  service?: Service
}

export function ServiceForm({ service }: ServiceFormProps) {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [values, setValues] = useState({
    name: service?.name ?? "",
    category: typeof service?.category === "string" ? service.category : (service?.category?._id ?? ""),
    description: service?.description ?? "",
    price: service?.price !== undefined ? String(service.price) : "",
    availabilityStatus: service?.availabilityStatus ?? ("active" as AvailabilityStatus),
  })
  const [images, setImages] = useState<string[]>(service?.images.length ? service.images : [""])
  const [errors, setErrors] = useState<FormErrors<typeof values & { images: string }>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    api
      .get<Category[]>("/api/categories")
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues({ ...values, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: undefined })
  }

  // las imágenes son una lista: se actualizan creando un array nuevo (nunca modificando el actual)
  const updateImage = (index: number, url: string) => {
    setImages(images.map((current, i) => (i === index ? url : current)))
    setErrors({ ...errors, images: undefined })
  }
  const addImage = () => setImages([...images, ""])
  const removeImage = (index: number) => setImages(images.filter((_, i) => i !== index))

  const validateImages = () => {
    const invalidIndex = images.findIndex((url) => validateUrl(url))
    if (invalidIndex !== -1) return `La imagen ${invalidIndex + 1} no es una URL válida`
    return undefined
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const newErrors = {
      name: required(values.name, "El nombre es requerido"),
      category: required(values.category, "La categoría es requerida"),
      description: required(values.description, "La descripción es requerida"),
      images: validateImages(),
    }
    setErrors(newErrors)
    if (!isValid(newErrors)) return

    const payload = {
      name: values.name.trim(),
      category: values.category,
      description: values.description.trim(),
      images,
      availabilityStatus: values.availabilityStatus,
      price: values.price ? Number(values.price) : undefined,
    }

    setIsSubmitting(true)
    try {
      if (service) {
        await api.put(`/api/services/${service._id}`, payload)
        toast.success("Publicación actualizada")
      } else {
        await api.post("/api/services", payload)
        toast.success("Publicación creada")
      }
      navigate("/admin/servicios")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No pudimos guardar la publicación")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5 max-w-2xl">
      <Field label="Nombre" htmlFor="name" error={errors.name}>
        <Input id="name" name="name" maxLength={100} value={values.name} onChange={handleChange} className="rounded-xl h-12" />
      </Field>

      <Field label="Categoría" htmlFor="category" error={errors.category}>
        <Select value={values.category} onValueChange={(category) => {
            setValues({ ...values, category })
            setErrors({ ...errors, category: undefined })
          }}>
          <SelectTrigger id="category" className="rounded-xl h-12 w-full">
            <SelectValue placeholder="Seleccioná una categoría" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c._id} value={c._id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Descripción" htmlFor="description" error={errors.description}>
        <Textarea
          id="description"
          name="description"
          rows={5}
          maxLength={2000}
          value={values.description}
          onChange={handleChange}
          className="rounded-xl"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Precio (opcional)" htmlFor="price">
          <Input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={values.price}
            onChange={handleChange}
            className="rounded-xl h-12"
          />
        </Field>
        <Field label="Estado" htmlFor="availabilityStatus">
          <Select
            value={values.availabilityStatus}
            onValueChange={(status) => setValues({ ...values, availabilityStatus: status as AvailabilityStatus })}
          >
            <SelectTrigger id="availabilityStatus" className="rounded-xl h-12 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="inactive">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div>
        <Label className={errors.images ? "text-destructive" : undefined}>Imágenes (URLs)</Label>
        <div className="space-y-3 mt-2">
          {images.map((url, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={url}
                onChange={(e) => updateImage(index, e.target.value)}
                placeholder="https://..."
                aria-label={`Imagen ${index + 1}`}
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
        {errors.images && <p className="text-sm text-destructive mt-2">{errors.images}</p>}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addImage}
          disabled={images.length >= MAX_IMAGES}
          className="mt-3 rounded-full"
        >
          <Plus className="w-4 h-4 mr-1" />
          Agregar imagen
        </Button>
      </div>

      <Button type="submit" disabled={isSubmitting} className="rounded-full h-12 px-8">
        {isSubmitting ? "Guardando..." : service ? "Guardar cambios" : "Crear publicación"}
      </Button>
    </form>
  )
}
