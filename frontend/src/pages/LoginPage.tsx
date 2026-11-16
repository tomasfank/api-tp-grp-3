import { useState, type ChangeEvent, type FormEvent } from "react"
import { Link, useNavigate } from "react-router"
import { toast } from "sonner"
import { Header } from "@/components/header"
import { Field } from "@/components/field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/use-auth"
import { ApiError } from "@/lib/api"
import { isValid, required, type FormErrors } from "@/lib/validation"

const initialValues = { email: "", password: "" }

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<FormErrors<typeof initialValues>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // un solo handler para todos los inputs: usa el atributo name para saber qué campo actualizar
  // y borra su mensaje de error, que se vuelve a calcular en el próximo envío
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: undefined })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const newErrors = {
      email: required(values.email, "El correo electrónico es requerido"),
      password: required(values.password, "La contraseña es requerida"),
    }
    setErrors(newErrors)
    if (!isValid(newErrors)) return

    setIsSubmitting(true)
    try {
      await login(values)
      toast.success("Bienvenido")
      navigate("/admin")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No pudimos iniciar sesión")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="pt-40 pb-24 px-4 flex justify-center">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8">
          <h1 className="font-serif text-3xl tracking-tight mb-2">Ingresar</h1>
          <p className="text-muted-foreground text-sm mb-8">Acceso para administradores del comercio.</p>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <Field label="Correo electrónico" htmlFor="email" error={errors.email}>
              <Input id="email" name="email" type="email" value={values.email} onChange={handleChange} className="rounded-xl h-12" />
            </Field>
            <Field label="Contraseña" htmlFor="password" error={errors.password}>
              <Input id="password" name="password" type="password" value={values.password} onChange={handleChange} className="rounded-xl h-12" />
            </Field>
            <Button type="submit" disabled={isSubmitting} className="w-full rounded-full h-12">
              {isSubmitting ? "Ingresando..." : "Ingresar"}
            </Button>
          </form>

          <div className="mt-6 flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/recuperar-password" className="hover:text-foreground">
              ¿Olvidaste tu contraseña?
            </Link>
            <Link to="/registro" className="hover:text-foreground">
              ¿No tenés cuenta? Registrate
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
