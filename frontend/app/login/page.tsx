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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useAuth, isApiError } from "@/hooks/use-auth"

const loginSchema = z.object({
  email: z.string().min(1, "El correo electrónico es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = async (values: LoginForm) => {
    try {
      await login(values)
      toast.success("Bienvenido")
      router.push("/admin")
    } catch (err) {
      toast.error(isApiError(err) ? err.message : "No pudimos iniciar sesión")
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="pt-40 pb-24 px-4 flex justify-center">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8">
          <h1 className="font-serif text-3xl tracking-tight mb-2">Ingresar</h1>
          <p className="text-muted-foreground text-sm mb-8">Acceso para administradores del comercio.</p>

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
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} className="rounded-xl h-12" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={form.formState.isSubmitting} className="w-full rounded-full h-12">
                {form.formState.isSubmitting ? "Ingresando..." : "Ingresar"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 flex flex-col gap-2 text-sm text-muted-foreground">
            <Link href="/recuperar-password" className="hover:text-foreground">
              ¿Olvidaste tu contraseña?
            </Link>
            <Link href="/registro" className="hover:text-foreground">
              ¿No tenés cuenta? Registrate
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
