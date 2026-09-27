import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqs = [
  {
    question: "¿Cómo empieza un proyecto con Vaultra?",
    answer:
      "Con una llamada de diagnóstico sin costo donde entendemos tu contexto técnico y de negocio. En menos de 48 horas te devolvemos un alcance, tiempos estimados y una propuesta concreta.",
  },
  {
    question: "¿Trabajan por proyecto cerrado o por squad dedicado?",
    answer:
      "Ambas modalidades. Para alcances bien definidos armamos un proyecto con entregables fijos; para necesidades continuas, sumamos un squad dedicado que se integra a tu equipo.",
  },
  {
    question: "¿Con qué tecnologías trabajan?",
    answer:
      "Stack moderno en frontend y backend (React, Next.js, Node, Python), infraestructura en AWS, GCP y Azure, y prácticas de DevOps con contenedores y CI/CD. Elegimos la herramienta según el problema, no al revés.",
  },
  {
    question: "¿Qué pasa después del lanzamiento?",
    answer:
      "Ofrecemos monitoreo, mantenimiento evolutivo y soporte con SLA definido. No entregamos y desaparecemos: seguimos siendo responsables del sistema en producción.",
  },
  {
    question: "¿Cuánto tarda un proyecto típico?",
    answer:
      "Depende del alcance, pero trabajamos en ciclos de entrega de dos semanas para que veas avances reales desde el primer mes, en vez de esperar meses para el primer resultado.",
  },
  {
    question: "¿Firman acuerdos de confidencialidad?",
    answer:
      "Sí, firmamos NDA antes de compartir cualquier detalle técnico o de negocio sensible, y podemos adaptarnos a los requisitos de compliance de tu empresa.",
  },
]

export function FAQSection() {
  return (
    <section id="faq" className="py-32 px-6 pb-40">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-normal mb-6 text-balance font-serif">Preguntas frecuentes</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Todo lo que necesitás saber antes de trabajar con nosotros. ¿No está tu pregunta? Escribinos.
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-3 py-0 my-0">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-card border border-border rounded-xl px-6 data-[state=open]:border-foreground/30"
            >
              <AccordionTrigger className="text-left text-base font-medium text-foreground hover:no-underline py-5">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5 leading-relaxed text-sm">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
