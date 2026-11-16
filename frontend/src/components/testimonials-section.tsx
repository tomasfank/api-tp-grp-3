import { cn } from "@/lib/utils"

const testimonials = [
  {
    name: "Lucía Fernández",
    role: "CTO, Nortia Retail",
    content: "Vaultra modernizó nuestro backend en tres meses sin frenar el roadmap. El equipo se integró como si fuera propio.",
    initials: "LF",
  },
  {
    name: "Martín Suárez",
    role: "Head of Engineering, Braga Logística",
    content: "La migración a cloud que veníamos posponiendo hace dos años se resolvió en un trimestre, con cero downtime.",
    initials: "MS",
  },
  {
    name: "Camila Ortiz",
    role: "COO, Fintel",
    content: "Lo que más valoramos es la transparencia: sabíamos exactamente en qué estado estaba cada entrega, siempre.",
    initials: "CO",
  },
]

const testimonials2 = [
  {
    name: "Diego Paredes",
    role: "Founder, Kairos Salud",
    content: "El diagnóstico inicial nos ahorró meses de decisiones equivocadas. Fueron directos sobre qué no hacer.",
    initials: "DP",
  },
  {
    name: "Valentina Rojas",
    role: "VP Producto, Muvo",
    content: "Escalaron nuestra infraestructura para un pico de tráfico 10x sin que lo notáramos. Soporte impecable.",
    initials: "VR",
  },
  {
    name: "Ignacio Bravo",
    role: "CEO, Puente Seguros",
    content: "Un partner tecnológico de verdad, no un proveedor más. Entienden el negocio, no solo el código.",
    initials: "IB",
  },
]

type Testimonial = (typeof testimonials)[number]

function TestimonialRow({ items, reverse = false }: { items: Testimonial[]; reverse?: boolean }) {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      {/* la lista se repite dos veces para que la animación (ver index.css) sea continua */}
      <div
        className={cn("flex w-max animate-marquee hover:paused motion-reduce:animate-none", reverse && "direction-reverse")}
      >
        {[...items, ...items].map((testimonial, index) => (
          <div key={index} className="shrink-0 w-[85vw] sm:w-[400px] pr-6">
            <div className="bg-card rounded-2xl px-8 py-4 h-full">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-medium shrink-0">
                  {testimonial.initials}
                </div>
                <p className="text-foreground leading-relaxed flex-1 text-lg">&ldquo;{testimonial.content}&rdquo;</p>
              </div>
              <p className="text-foreground text-sm font-bold">{testimonial.name}</p>
              <p className="text-muted-foreground text-sm">{testimonial.role}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-normal leading-tight font-serif">Lo que dicen nuestros clientes</h2>
        </div>

        <div className="space-y-6">
          <TestimonialRow items={testimonials} />
          <TestimonialRow items={testimonials2} reverse />
        </div>
      </div>
    </section>
  )
}
