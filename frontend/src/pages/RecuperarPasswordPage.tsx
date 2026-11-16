import { useState, type FormEvent } from "react"
import { Link } from "react-router"
import { Header } from "@/components/header"
import { Field } from "@/components/field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api, ApiError } from "@/lib/api"
import { required } from "@/lib/validation"

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resetToken, setResetToken] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const emailError = required(email, "El correo electrónico es requerido")
    setError(emailError)
    if (emailError) return

    setIsSubmitting(true)
    try {
      const res = await api.post<{ resetToken: string }>("/api/auth/forgot-password", { email }, { auth: false })
      setResetToken(res.resetToken)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Ocurrió un error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="pt-40 pb-24 px-4 flex justify-center">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8">
          <h1 className="font-serif text-3xl tracking-tight mb-2">Recuperar contraseña</h1>
          <p className="text-muted-foreground text-sm mb-8">
            Ingresá tu correo electrónico para generar un token de restablecimiento.
          </p>

          {resetToken ? (
            <div className="space-y-4">
              <p className="text-sm">
                Token generado. Usalo en la pantalla de restablecimiento junto con tu nueva contraseña:
              </p>
              <code className="block break-all rounded-xl bg-muted p-4 text-xs">{resetToken}</code>
              <Link
                to="/restablecer-password"
                className="inline-flex rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm"
              >
                Ir a restablecer contraseña
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <Field label="Correo electrónico" htmlFor="email" error={error}>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError(undefined)
                  }}
                  className="rounded-xl h-12"
                />
              </Field>
              <Button type="submit" disabled={isSubmitting} className="w-full rounded-full h-12">
                {isSubmitting ? "Enviando..." : "Generar token"}
              </Button>
            </form>
          )}

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
