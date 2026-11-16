import { useState, type ChangeEvent, type FormEvent } from "react"
import { toast } from "sonner"
import { Field } from "@/components/field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api, ApiError } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import type { User } from "@/lib/types"
import { isValid, required, validatePhone, type FormErrors } from "@/lib/validation"

export default function PerfilPage() {
  const { user, setUser } = useAuth()
  const [values, setValues] = useState({
    name: user?.name ?? "",
    lastName: user?.lastName ?? "",
    phone: user?.phone ?? "",
  })
  const [errors, setErrors] = useState<FormErrors<typeof values>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const newErrors = {
      name: required(values.name, "El nombre no puede estar vacío"),
      lastName: required(values.lastName, "El apellido no puede estar vacío"),
      phone: validatePhone(values.phone),
    }
    setErrors(newErrors)
    if (!isValid(newErrors)) return

    setIsSubmitting(true)
    try {
      const updated = await api.put<User>("/api/auth/profile", {
        name: values.name.trim(),
        lastName: values.lastName.trim(),
        phone: values.phone || undefined,
      })
      setUser(updated)
      toast.success("Perfil actualizado")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No pudimos actualizar tu perfil")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <h1 className="font-serif text-3xl tracking-tight mb-8">Mi perfil</h1>

      <form onSubmit={handleSubmit} noValidate className="space-y-5 max-w-md">
        <Field label="Nombre" htmlFor="name" error={errors.name}>
          <Input id="name" name="name" maxLength={100} value={values.name} onChange={handleChange} className="rounded-xl h-12" />
        </Field>
        <Field label="Apellido" htmlFor="lastName" error={errors.lastName}>
          <Input id="lastName" name="lastName" maxLength={100} value={values.lastName} onChange={handleChange} className="rounded-xl h-12" />
        </Field>
        <Field label="Teléfono" htmlFor="phone" error={errors.phone}>
          <Input id="phone" name="phone" value={values.phone} onChange={handleChange} className="rounded-xl h-12" />
        </Field>
        <Button type="submit" disabled={isSubmitting} className="rounded-full h-12 px-8">
          {isSubmitting ? "Guardando..." : "Guardar cambios"}
        </Button>
      </form>
    </div>
  )
}
