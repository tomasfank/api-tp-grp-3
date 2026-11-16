import { useState, type ChangeEvent, type FormEvent } from "react"
import { Link, useNavigate } from "react-router"
import { toast } from "sonner"
import { Header } from "@/components/header"
import { Field } from "@/components/field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api, ApiError } from "@/lib/api"
import { isValid, required, validateEmail, validatePassword, validatePhone, type FormErrors } from "@/lib/validation"

const initialValues = { name: "", lastName: "", email: "", password: "", phone: "" }

export default function RegistroPage() {
  const navigate = useNavigate()
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<FormErrors<typeof initialValues>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: undefined })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const newErrors = {
      name: required(values.name, "El nombre es requerido"),
      lastName: required(values.lastName, "El apellido es requerido"),
      email: validateEmail(values.email),
      password: validatePassword(values.password),
      phone: validatePhone(values.phone),
    }
    setErrors(newErrors)
    if (!isValid(newErrors)) return

    setIsSubmitting(true)
    try {
      await api.post(
        "/api/auth/register",
        {
          name: values.name.trim(),
          lastName: values.lastName.trim(),
          email: values.email,
          password: values.password,
          phone: values.phone || undefined,
        },
        { auth: false },
      )
      toast.success("Cuenta creada. Ahora podés iniciar sesión.")
      navigate("/login")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No pudimos crear la cuenta")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="pt-40 pb-24 px-4 flex justify-center">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8">
          <h1 className="font-serif text-3xl tracking-tight mb-2">Crear cuenta</h1>
          <p className="text-muted-foreground text-sm mb-8">Registrate como administrador del comercio.</p>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nombre" htmlFor="name" error={errors.name}>
                <Input id="name" name="name" maxLength={100} value={values.name} onChange={handleChange} className="rounded-xl h-12" />
              </Field>
              <Field label="Apellido" htmlFor="lastName" error={errors.lastName}>
                <Input id="lastName" name="lastName" maxLength={100} value={values.lastName} onChange={handleChange} className="rounded-xl h-12" />
              </Field>
            </div>
            <Field label="Correo electrónico" htmlFor="email" error={errors.email}>
              <Input id="email" name="email" type="email" value={values.email} onChange={handleChange} className="rounded-xl h-12" />
            </Field>
            <Field label="Teléfono (opcional)" htmlFor="phone" error={errors.phone}>
              <Input id="phone" name="phone" value={values.phone} onChange={handleChange} className="rounded-xl h-12" />
            </Field>
            <Field label="Contraseña" htmlFor="password" error={errors.password}>
              <Input id="password" name="password" type="password" value={values.password} onChange={handleChange} className="rounded-xl h-12" />
            </Field>
            <Button type="submit" disabled={isSubmitting} className="w-full rounded-full h-12">
              {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
            </Button>
          </form>

          <div className="mt-6 text-sm text-muted-foreground">
            <Link to="/login" className="hover:text-foreground">
              ¿Ya tenés cuenta? Ingresá
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
