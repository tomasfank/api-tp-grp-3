"use client"

import { useState, useEffect, useRef } from "react"

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

const duplicatedTestimonials = [...testimonials, ...testimonials, ...testimonials]
const duplicatedTestimonials2 = [...testimonials2, ...testimonials2, ...testimonials2]

export function TestimonialsSection() {
  const [isPaused, setIsPaused] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollRef2 = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollRef2.current) {
        scrollRef2.current.scrollLeft = scrollRef2.current.scrollWidth / 3
      }
      setIsInitialized(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isPaused || !isInitialized || !scrollRef.current) return

    const scrollContainer = scrollRef.current
    let animationFrameId: number
    let isActive = true

    const scroll = () => {
      if (!isActive || !scrollContainer) return

      scrollContainer.scrollLeft += 1
      const maxScroll = scrollContainer.scrollWidth / 3

      if (scrollContainer.scrollLeft >= maxScroll) {
        scrollContainer.scrollLeft = 0
      }

      animationFrameId = requestAnimationFrame(scroll)
    }

    animationFrameId = requestAnimationFrame(scroll)

    return () => {
      isActive = false
      cancelAnimationFrame(animationFrameId)
    }
  }, [isPaused, isInitialized])

  useEffect(() => {
    if (isPaused || !isInitialized || !scrollRef2.current) return

    const scrollContainer = scrollRef2.current
    let animationFrameId: number
    let isActive = true

    const scroll = () => {
      if (!isActive || !scrollContainer) return

      scrollContainer.scrollLeft -= 1

      if (scrollContainer.scrollLeft <= 0) {
        scrollContainer.scrollLeft = scrollContainer.scrollWidth / 3
      }

      animationFrameId = requestAnimationFrame(scroll)
    }

    animationFrameId = requestAnimationFrame(scroll)

    return () => {
      isActive = false
      cancelAnimationFrame(animationFrameId)
    }
  }, [isPaused, isInitialized])

  return (
    <section id="testimonials" className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-normal leading-tight font-serif">Lo que dicen nuestros clientes</h2>
        </div>

        <div className="space-y-6">
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

            <div
              ref={scrollRef}
              className="flex gap-6 overflow-x-hidden"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onTouchStart={() => setIsPaused(true)}
              onTouchEnd={() => setIsPaused(false)}
              style={{ scrollBehavior: "auto" }}
            >
              {duplicatedTestimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-full sm:w-[400px] bg-card border border-border rounded-2xl p-8 border-none py-4"
                >
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {testimonial.initials}
                    </div>
                    <p className="text-foreground leading-relaxed flex-1 text-lg">
                      &ldquo;{testimonial.content}&rdquo;
                    </p>
                  </div>
                  <div className="mt-auto">
                    <p className="text-foreground text-sm font-bold">{testimonial.name}</p>
                    <p className="text-muted-foreground text-xs">{testimonial.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

            <div
              ref={scrollRef2}
              className="flex gap-6 overflow-x-hidden"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onTouchStart={() => setIsPaused(true)}
              onTouchEnd={() => setIsPaused(false)}
              style={{ scrollBehavior: "auto" }}
            >
              {duplicatedTestimonials2.map((testimonial, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-full sm:w-[400px] bg-card border border-border rounded-2xl p-8 border-none py-4"
                >
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {testimonial.initials}
                    </div>
                    <p className="text-lg text-foreground leading-relaxed flex-1">
                      &ldquo;{testimonial.content}&rdquo;
                    </p>
                  </div>
                  <div className="mt-auto">
                    <p className="text-foreground text-sm font-bold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
