"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { api, ApiError } from "@/lib/api"
import type { BusinessInfo } from "@/lib/types"

const schema = z.object({
  name: z.string().trim().min(1, "El nombre no puede estar vacío").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  phone: z
    .string()
    .regex(/^\d{7,15}$/, "El teléfono debe contener entre 7 y 15 dígitos numéricos")
    .optional()
    .or(z.literal("")),
  businessHours: z.string().trim().max(500).optional().or(z.literal("")),
  instagram: z.string().trim().optional().or(z.literal("")),
  facebook: z.string().trim().optional().or(z.literal("")),
})

type FormValues = z.infer<typeof schema>

export default function NegocioPage() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      phone: "",
      businessHours: "",
      instagram: "",
      facebook: "",
    },
  })

  useEffect(() => {
    api
      .get<BusinessInfo>("/api/business-info")
      .then((info) => {
        form.reset({
          name: info.name ?? "",
          description: info.description ?? "",
          address: info.address ?? "",
          phone: info.phone ?? "",
          businessHours: info.businessHours ?? "",
          instagram: info.socialMedia?.instagram ?? "",
          facebook: info.socialMedia?.facebook ?? "",
        })
      })
      .catch(() => null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSubmit = async (values: FormValues) => {
    const socialMedia: Record<string, string> = {}
    if (values.instagram) socialMedia.instagram = values.instagram
    if (values.facebook) socialMedia.facebook = values.facebook

    try {
      await api.put("/api/business-info", {
        name: values.name,
        description: values.description || undefined,
        address: values.address || undefined,
        phone: values.phone || undefined,
        businessHours: values.businessHours || undefined,
        socialMedia: Object.keys(socialMedia).length > 0 ? socialMedia : undefined,
      })
      toast.success("Información institucional actualizada")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No pudimos guardar los cambios")
    }
  }

  return (
    <div>
      <h1 className="font-serif text-3xl tracking-tight mb-8">Información del negocio</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 max-w-xl">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del comercio</FormLabel>
                <FormControl>
                  <Input {...field} className="rounded-xl h-12" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea rows={4} {...field} className="rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección</FormLabel>
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
          <FormField
            control={form.control}
            name="businessHours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horarios de atención</FormLabel>
                <FormControl>
                  <Input {...field} className="rounded-xl h-12" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="instagram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instagram</FormLabel>
                  <FormControl>
                    <Input {...field} className="rounded-xl h-12" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="facebook"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facebook</FormLabel>
                  <FormControl>
                    <Input {...field} className="rounded-xl h-12" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button type="submit" disabled={form.formState.isSubmitting} className="rounded-full h-12 px-8">
            {form.formState.isSubmitting ? "Guardando..." : "Guardar cambios"}
          </Button>
        </form>
      </Form>
    </div>
  )
}
