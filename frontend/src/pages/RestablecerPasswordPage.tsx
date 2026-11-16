import { useState, type ChangeEvent, type FormEvent } from "react"
import { Link, useNavigate } from "react-router"
import { toast } from "sonner"
import { Header } from "@/components/header"
import { Field } from "@/components/field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { api, ApiError } from "@/lib/api"
import { isValid, required, validatePassword, type FormErrors } from "@/lib/validation"

const initialValues = { resetToken: "", newPassword: "" }

export default function RestablecerPasswordPage() {
  const navigate = useNavigate()
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<FormErrors<typeof initialValues>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues({ ...values, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: undefined })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const newErrors = {
      resetToken: required(values.resetToken, "El token de restablecimiento es requerido"),
      newPassword: validatePassword(values.newPassword),
    }
    setErrors(newErrors)
    if (!isValid(newErrors)) return

    setIsSubmitting(true)
    try {
      await api.post("/api/auth/reset-password", values, { auth: false })
      toast.success("Contraseña actualizada. Ahora podés iniciar sesión.")
      navigate("/login")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No pudimos restablecer la contraseña")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="pt-40 pb-24 px-4 flex justify-center">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8">
          <h1 className="font-serif text-3xl tracking-tight mb-2">Restablecer contraseña</h1>
          <p className="text-muted-foreground text-sm mb-8">
            Pegá el token que generaste y elegí una nueva contraseña.
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <Field label="Token" htmlFor="resetToken" error={errors.resetToken}>
              <Textarea id="resetToken" name="resetToken" rows={3} value={values.resetToken} onChange={handleChange} className="rounded-xl" />
            </Field>
            <Field label="Nueva contraseña" htmlFor="newPassword" error={errors.newPassword}>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                value={values.newPassword}
                onChange={handleChange}
                className="rounded-xl h-12"
              />
            </Field>
            <Button type="submit" disabled={isSubmitting} className="w-full rounded-full h-12">
              {isSubmitting ? "Guardando..." : "Restablecer contraseña"}
            </Button>
          </form>

          <div className="mt-6 text-sm text-muted-foreground">
            <Link to="/login" className="hover:text-foreground">
              Volver a ingresar
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
