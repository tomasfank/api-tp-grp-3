import { useEffect, useState, type ChangeEvent, type FormEvent } from "react"
import { toast } from "sonner"
import { Field } from "@/components/field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { api, ApiError } from "@/lib/api"
import type { BusinessInfo } from "@/lib/types"
import { isValid, required, validatePhone, type FormErrors } from "@/lib/validation"

const initialValues = {
  name: "",
  description: "",
  address: "",
  phone: "",
  businessHours: "",
  instagram: "",
  facebook: "",
}

export default function NegocioPage() {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<FormErrors<typeof initialValues>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    api
      .get<BusinessInfo>("/api/business-info")
      .then((info) =>
        setValues({
          name: info.name ?? "",
          description: info.description ?? "",
          address: info.address ?? "",
          phone: info.phone ?? "",
          businessHours: info.businessHours ?? "",
          instagram: info.socialMedia?.instagram ?? "",
          facebook: info.socialMedia?.facebook ?? "",
        }),
      )
      .catch(() => null)
  }, [])

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues({ ...values, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: undefined })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const newErrors = {
      name: required(values.name, "El nombre no puede estar vacío"),
      phone: validatePhone(values.phone),
    }
    setErrors(newErrors)
    if (!isValid(newErrors)) return

    const socialMedia: Record<string, string> = {}
    if (values.instagram.trim()) socialMedia.instagram = values.instagram.trim()
    if (values.facebook.trim()) socialMedia.facebook = values.facebook.trim()

    setIsSubmitting(true)
    try {
      await api.put("/api/business-info", {
        name: values.name.trim(),
        description: values.description.trim() || undefined,
        address: values.address.trim() || undefined,
        phone: values.phone || undefined,
        businessHours: values.businessHours.trim() || undefined,
        socialMedia: Object.keys(socialMedia).length > 0 ? socialMedia : undefined,
      })
      toast.success("Información institucional actualizada")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No pudimos guardar los cambios")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <h1 className="font-serif text-3xl tracking-tight mb-8">Información del negocio</h1>

      <form onSubmit={handleSubmit} noValidate className="space-y-5 max-w-xl">
        <Field label="Nombre del comercio" htmlFor="name" error={errors.name}>
          <Input id="name" name="name" maxLength={200} value={values.name} onChange={handleChange} className="rounded-xl h-12" />
        </Field>
        <Field label="Descripción" htmlFor="description">
          <Textarea
            id="description"
            name="description"
            rows={4}
            maxLength={2000}
            value={values.description}
            onChange={handleChange}
            className="rounded-xl"
          />
        </Field>
        <Field label="Dirección" htmlFor="address">
          <Input id="address" name="address" maxLength={300} value={values.address} onChange={handleChange} className="rounded-xl h-12" />
        </Field>
        <Field label="Teléfono" htmlFor="phone" error={errors.phone}>
          <Input id="phone" name="phone" value={values.phone} onChange={handleChange} className="rounded-xl h-12" />
        </Field>
        <Field label="Horarios de atención" htmlFor="businessHours">
          <Input
            id="businessHours"
            name="businessHours"
            maxLength={500}
            value={values.businessHours}
            onChange={handleChange}
            className="rounded-xl h-12"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Instagram" htmlFor="instagram">
            <Input id="instagram" name="instagram" value={values.instagram} onChange={handleChange} className="rounded-xl h-12" />
          </Field>
          <Field label="Facebook" htmlFor="facebook">
            <Input id="facebook" name="facebook" value={values.facebook} onChange={handleChange} className="rounded-xl h-12" />
          </Field>
        </div>
        <Button type="submit" disabled={isSubmitting} className="rounded-full h-12 px-8">
          {isSubmitting ? "Guardando..." : "Guardar cambios"}
        </Button>
      </form>
    </div>
  )
}
