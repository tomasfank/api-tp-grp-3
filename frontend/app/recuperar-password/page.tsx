"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { api, ApiError } from "@/lib/api"

const schema = z.object({
  email: z.string().min(1, "El correo electrónico es requerido"),
})

type FormValues = z.infer<typeof schema>

export default function RecuperarPasswordPage() {
  const [resetToken, setResetToken] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      const res = await api.post<{ resetToken: string }>("/api/auth/forgot-password", values, { auth: false })
      setResetToken(res.resetToken)
    } catch (err) {
      form.setError("email", { message: err instanceof ApiError ? err.message : "Ocurrió un error" })
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
                href="/restablecer-password"
                className="inline-flex rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm"
              >
                Ir a restablecer contraseña
              </Link>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo electrónico</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} className="rounded-xl h-12" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={form.formState.isSubmitting} className="w-full rounded-full h-12">
                  {form.formState.isSubmitting ? "Enviando..." : "Generar token"}
                </Button>
              </form>
            </Form>
          )}

          <div className="mt-6 text-sm text-muted-foreground">
            <Link href="/login" className="hover:text-foreground">
              Volver a ingresar
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
