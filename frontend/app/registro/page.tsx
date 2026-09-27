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
import { api, ApiError } from "@/lib/api"

const registerSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido").max(100),
  lastName: z.string().trim().min(1, "El apellido es requerido").max(100),
  email: z.string().email("El formato del correo electrónico no es válido"),
  password: z
    .string()
    .min(8, "Debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una letra mayúscula")
    .regex(/[0-9!@#$%^&*()_\-+=[\]{};':"\\|,.<>/?`~]/, "Debe contener al menos un dígito o símbolo"),
  phone: z
    .string()
    .regex(/^\d{7,15}$/, "El teléfono debe contener entre 7 y 15 dígitos numéricos")
    .optional()
    .or(z.literal("")),
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegistroPage() {
  const router = useRouter()

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", lastName: "", email: "", password: "", phone: "" },
  })

  const onSubmit = async (values: RegisterForm) => {
    try {
      await api.post(
        "/api/auth/register",
        { ...values, phone: values.phone || undefined },
        { auth: false },
      )
      toast.success("Cuenta creada. Ahora podés iniciar sesión.")
      router.push("/login")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No pudimos crear la cuenta")
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="pt-40 pb-24 px-4 flex justify-center">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8">
          <h1 className="font-serif text-3xl tracking-tight mb-2">Crear cuenta</h1>
          <p className="text-muted-foreground text-sm mb-8">Registrate como administrador del comercio.</p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input {...field} className="rounded-xl h-12" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido</FormLabel>
                      <FormControl>
                        <Input {...field} className="rounded-xl h-12" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono (opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} className="rounded-xl h-12" />
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
                {form.formState.isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-sm text-muted-foreground">
            <Link href="/login" className="hover:text-foreground">
              ¿Ya tenés cuenta? Ingresá
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
