import { useEffect, useState, type ChangeEvent, type FormEvent } from "react"
import { useSearchParams } from "react-router"
import { toast } from "sonner"
import { Mail, MapPin, Phone, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field } from "@/components/field"
import { api } from "@/lib/api"
import type { BusinessInfo } from "@/lib/types"
import { isValid, required, validateEmail, validatePhone, type FormErrors } from "@/lib/validation"

const initialValues = { name: "", email: "", phone: "", subject: "", message: "" }

export function ContactSection() {
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null)

  useEffect(() => {
    api
      .get<BusinessInfo>("/api/business-info", { auth: false })
      .catch(() => null)
      .then((res) => res && setBusinessInfo(res))
  }, [])

  const [searchParams] = useSearchParams()
  const asunto = searchParams.get("asunto")
  const [values, setValues] = useState({ ...initialValues, subject: asunto?.slice(0, 200) ?? "" })

  useEffect(() => {
    if (asunto) setValues((v) => ({ ...v, subject: asunto.slice(0, 200) }))
  }, [asunto])

  const [errors, setErrors] = useState<FormErrors<typeof initialValues>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues({ ...values, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: undefined })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const newErrors = {
      name: required(values.name, "El nombre es requerido"),
      email: validateEmail(values.email),
      phone: validatePhone(values.phone),
      subject: required(values.subject, "El asunto es requerido"),
      message: required(values.message, "El mensaje es requerido"),
    }
    setErrors(newErrors)
    if (!isValid(newErrors)) return

    setIsSubmitting(true)
    try {
      await api.post(
        "/api/contacts",
        {
          name: values.name.trim(),
          email: values.email,
          phone: values.phone || undefined,
          subject: values.subject.trim(),
          message: values.message.trim(),
        },
        { auth: false },
      )
      toast.success("Tu consulta fue enviada. Te vamos a responder a la brevedad.")
      setValues(initialValues)
    } catch {
      toast.error("No pudimos enviar tu consulta. Intentá nuevamente.")
    } finally {
      setIsSubmitting(false)
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
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <Field label="Nombre" htmlFor="contact-name" error={errors.name}>
                  <Input id="contact-name" name="name" maxLength={100} value={values.name} onChange={handleChange} className="rounded-xl h-12" />
                </Field>
                <Field label="Correo electrónico" htmlFor="contact-email" error={errors.email}>
                  <Input
                    id="contact-email"
                    name="email"
                    type="email"
                    value={values.email}
                    onChange={handleChange}
                    className="rounded-xl h-12"
                  />
                </Field>
              </div>
              <Field label="Teléfono (opcional)" htmlFor="contact-phone" error={errors.phone}>
                <Input id="contact-phone" name="phone" value={values.phone} onChange={handleChange} className="rounded-xl h-12" />
              </Field>
              <Field label="Asunto" htmlFor="contact-subject" error={errors.subject}>
                <Input
                  id="contact-subject"
                  name="subject"
                  maxLength={200}
                  value={values.subject}
                  onChange={handleChange}
                  className="rounded-xl h-12"
                />
              </Field>
              <Field label="Mensaje" htmlFor="contact-message" error={errors.message}>
                <Textarea
                  id="contact-message"
                  name="message"
                  rows={6}
                  maxLength={5000}
                  value={values.message}
                  onChange={handleChange}
                  className="rounded-xl"
                />
              </Field>
              <Button type="submit" disabled={isSubmitting} className="rounded-full h-12 px-8">
                {isSubmitting ? "Enviando..." : "Enviar consulta"}
              </Button>
            </form>
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
