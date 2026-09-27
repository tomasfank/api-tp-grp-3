"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Mail, MapPin, Phone, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { api } from "@/lib/api"
import type { BusinessInfo } from "@/lib/types"

const contactSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido").max(100),
  email: z.string().email("El formato del correo electrónico no es válido"),
  phone: z
    .string()
    .regex(/^\d{7,15}$/, "El teléfono debe contener entre 7 y 15 dígitos numéricos")
    .optional()
    .or(z.literal("")),
  subject: z.string().trim().min(1, "El asunto es requerido").max(200),
  message: z.string().trim().min(1, "El mensaje es requerido").max(5000),
})

type ContactForm = z.infer<typeof contactSchema>

export function ContactSection() {
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null)

  useEffect(() => {
    api
      .get<BusinessInfo>("/api/business-info", { auth: false })
      .catch(() => null)
      .then((res) => res && setBusinessInfo(res))
  }, [])

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", phone: "", subject: "", message: "" },
  })

  const onSubmit = async (values: ContactForm) => {
    try {
      await api.post(
        "/api/contacts",
        { ...values, phone: values.phone || undefined },
        { auth: false },
      )
      toast.success("Tu consulta fue enviada. Te vamos a responder a la brevedad.")
      form.reset()
    } catch {
      toast.error("No pudimos enviar tu consulta. Intentá nuevamente.")
    }
  }

  return (
    <section id="contacto" className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-normal leading-tight max-w-4xl mx-auto mb-6 font-serif">
            Contactanos
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Contanos qué necesitás y te respondemos a la brevedad.
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid md:grid-cols-5 gap-12">
          <div className="md:col-span-3">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
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
                </div>
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
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asunto</FormLabel>
                      <FormControl>
                        <Input {...field} className="rounded-xl h-12" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mensaje</FormLabel>
                      <FormControl>
                        <Textarea rows={6} {...field} className="rounded-xl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="rounded-full h-12 px-8"
                >
                  {form.formState.isSubmitting ? "Enviando..." : "Enviar consulta"}
                </Button>
              </form>
            </Form>
          </div>

          <div className="md:col-span-2">
            <div className="rounded-3xl border border-border bg-card p-8 space-y-5">
              <h3 className="font-serif text-2xl mb-2">{businessInfo?.name ?? "Vaultra Consulting"}</h3>
              {businessInfo?.description && (
                <p className="text-muted-foreground text-sm">{businessInfo.description}</p>
              )}
              {businessInfo?.address && (
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                  <span>{businessInfo.address}</span>
                </div>
              )}
              {businessInfo?.phone && (
                <div className="flex items-start gap-3 text-sm">
                  <Phone className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                  <span>{businessInfo.phone}</span>
                </div>
              )}
              {businessInfo?.businessHours && (
                <div className="flex items-start gap-3 text-sm">
                  <Clock className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                  <span>{businessInfo.businessHours}</span>
                </div>
              )}
              {businessInfo?.socialMedia && Object.keys(businessInfo.socialMedia).length > 0 && (
                <div className="flex items-start gap-3 text-sm">
                  <Mail className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="flex flex-col gap-1">
                    {Object.entries(businessInfo.socialMedia).map(([k, v]) => (
                      <span key={k}>
                        {k}: {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
