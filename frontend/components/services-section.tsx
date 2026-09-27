"use client"

import { Code2, Cloud, Sparkles, Server, ShieldCheck, ArrowRight, type LucideIcon } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { api } from "@/lib/api"
import type { Category } from "@/lib/types"

const CATEGORY_META: Record<string, { icon: LucideIcon; description: string }> = {
  Cloud: {
    icon: Cloud,
    description: "Migración, arquitectura y gestión de costos en la nube con AWS, GCP y Azure.",
  },
  Seguridad: {
    icon: ShieldCheck,
    description: "Auditorías, pentesting y cumplimiento normativo para proteger tu operación.",
  },
  Desarrollo: {
    icon: Code2,
    description: "Aplicaciones web y APIs a medida, modernización de sistemas legacy.",
  },
  Infraestructura: {
    icon: Server,
    description: "Automatización, CI/CD, Kubernetes y observabilidad para tus entornos.",
  },
}

const DEFAULT_CATEGORY_META = {
  icon: Sparkles,
  description: "Soluciones tecnológicas a medida para impulsar tu negocio.",
}

function AnimatedIcon({ Icon, delay = 0 }: { Icon: any; delay?: number }) {
  const [isVisible, setIsVisible] = useState(false)
  const iconRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.3 },
    )

    if (iconRef.current) {
      observer.observe(iconRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={iconRef} className="relative">
      <Icon
        className={`text-foreground h-16 w-16 ${isVisible ? "animate-draw-icon" : ""}`}
        strokeWidth={1}
        style={{
          strokeDasharray: isVisible ? undefined : 1000,
          strokeDashoffset: isVisible ? undefined : 1000,
        }}
      />
    </div>
  )
}

export function ServicesSection() {
  const [isVisible, setIsVisible] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api
      .get<Category[]>("/api/categories", { auth: false })
      .then(setCategories)
      .catch(() => setError("No pudimos cargar las categorías."))
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.2 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section id="services" className="py-32 px-6 pb-24 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none z-0">
        <span className="font-bold text-center text-[18vw] sm:text-[16vw] md:text-[14vw] lg:text-[12vw] leading-none tracking-tighter text-zinc-100 whitespace-nowrap">
          SERVICIOS
        </span>
      </div>

      <style jsx>{`
        @keyframes drawPath {
          from {
            stroke-dasharray: 1000;
            stroke-dashoffset: 1000;
          }
          to {
            stroke-dasharray: 1000;
            stroke-dashoffset: 0;
          }
        }
        :global(.animate-draw-icon) :global(path),
        :global(.animate-draw-icon) :global(line),
        :global(.animate-draw-icon) :global(polyline),
        :global(.animate-draw-icon) :global(circle),
        :global(.animate-draw-icon) :global(rect) {
          animation: drawPath 2s ease-out forwards;
        }
      `}</style>

      <div className="max-w-7xl mx-auto relative z-10">
        <div
          ref={sectionRef}
          className="relative px-6 lg:px-8 py-16 lg:py-20 mb-32 overflow-hidden rounded-3xl bg-[oklch(0.1_0_0)]"
        >
          <div className="absolute inset-0 w-full h-full">
            <svg className="w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid-services" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-services)" />
            </svg>
          </div>

          <div className="relative z-10 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="order-1 lg:order-2">
              <p className="text-sm uppercase tracking-[0.2em] text-white/80 font-medium mb-4">Nuestra misión</p>
              <h2 className="font-sans md:text-4xl lg:text-5xl font-medium text-white text-balance mb-8 text-5xl">
                Simplificar la tecnología para que crezcas más rápido
              </h2>
              <div className="space-y-6 text-white/90 leading-relaxed">
                <p>
                  En Vaultra creemos que la tecnología debería ser una ventaja, no un cuello de botella. Trabajamos
                  codo a codo con equipos internos, sin capas innecesarias.
                </p>
                <p>
                  Cada proyecto empieza con un diagnóstico claro y termina con software en producción, medible y
                  mantenible.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-normal mb-6 text-balance font-serif">Lo que hacemos</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Distintos frentes de trabajo, un mismo objetivo: que tu tecnología deje de frenarte.
          </p>
        </div>

        {error && <p className="text-center text-destructive py-8">{error}</p>}

        {!error && (
          <motion.div layout className="grid md:grid-cols-4 gap-8">
            <AnimatePresence mode="popLayout">
              {(isLoading ? Array.from({ length: 3 }) : categories).map((category, index) => {
                if (isLoading) {
                  return (
                    <div key={index} className="p-8 rounded-3xl text-center animate-pulse">
                      <div className="mb-6 flex justify-center">
                        <div className="h-16 w-16 rounded-full bg-zinc-100" />
                      </div>
                      <div className="h-6 w-32 mx-auto bg-zinc-100 rounded mb-3" />
                      <div className="h-4 w-full bg-zinc-100 rounded" />
                    </div>
                  )
                }

                const cat = category as Category
                const meta = CATEGORY_META[cat.name] ?? DEFAULT_CATEGORY_META

                return (
                  <motion.div
                    layout
                    key={cat._id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                  >
                    <Link
                      href={`/catalogo?category=${cat._id}`}
                      className="group p-8 rounded-3xl hover:bg-zinc-50 transition-colors duration-300 text-center flex flex-col items-center"
                    >
                      <div className="mb-6 flex justify-center">
                        <AnimatedIcon Icon={meta.icon} delay={0} />
                      </div>
                      <h3 className="text-xl font-medium mb-3 text-foreground">{cat.name}</h3>
                      <p className="text-muted-foreground leading-relaxed text-sm">{meta.description}</p>
                    </Link>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {!isLoading && !error && categories.length === 0 && (
          <p className="text-center text-muted-foreground py-16">Todavía no hay categorías de servicios cargadas.</p>
        )}

        <div className="flex justify-center mt-16">
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Ver todos los servicios
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
