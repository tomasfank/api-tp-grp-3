"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { api, ApiError } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"

const schema = z.object({
  name: z.string().trim().min(1, "El nombre no puede estar vacío").max(100),
  lastName: z.string().trim().min(1, "El apellido no puede estar vacío").max(100),
  phone: z
    .string()
    .regex(/^\d{7,15}$/, "El teléfono debe contener entre 7 y 15 dígitos numéricos")
    .optional()
    .or(z.literal("")),
})

type FormValues = z.infer<typeof schema>

export default function PerfilPage() {
  const { user, setUser } = useAuth()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name ?? "",
      lastName: user?.lastName ?? "",
      phone: user?.phone ?? "",
    },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      const updated = await api.put<typeof user>("/api/auth/profile", {
        name: values.name,
        lastName: values.lastName,
        phone: values.phone || undefined,
      })
      if (updated) setUser(updated)
      toast.success("Perfil actualizado")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No pudimos actualizar tu perfil")
    }
  }

  return (
    <div>
      <h1 className="font-serif text-3xl tracking-tight mb-8">Mi perfil</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 max-w-md">
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
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input {...field} className="rounded-xl h-12" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={form.formState.isSubmitting} className="rounded-full h-12 px-8">
            {form.formState.isSubmitting ? "Guardando..." : "Guardar cambios"}
          </Button>
        </form>
      </Form>
    </div>
  )
}
