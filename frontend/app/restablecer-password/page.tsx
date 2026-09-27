"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { api, ApiError } from "@/lib/api"

const schema = z.object({
  resetToken: z.string().min(1, "El token de restablecimiento es requerido"),
  newPassword: z
    .string()
    .min(8, "Debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una letra mayúscula")
    .regex(/[0-9!@#$%^&*()_\-+=[\]{};':"\\|,.<>/?`~]/, "Debe contener al menos un dígito o símbolo"),
})

type FormValues = z.infer<typeof schema>

export default function RestablecerPasswordPage() {
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { resetToken: "", newPassword: "" },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      await api.post("/api/auth/reset-password", values, { auth: false })
      toast.success("Contraseña actualizada. Ahora podés iniciar sesión.")
      router.push("/login")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No pudimos restablecer la contraseña")
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

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="resetToken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} className="rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nueva contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} className="rounded-xl h-12" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={form.formState.isSubmitting} className="w-full rounded-full h-12">
                {form.formState.isSubmitting ? "Guardando..." : "Restablecer contraseña"}
              </Button>
            </form>
          </Form>

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
