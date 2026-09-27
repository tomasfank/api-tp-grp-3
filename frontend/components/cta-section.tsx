"use client"

import type React from "react"
import { ArrowUpRight, ArrowRight } from "lucide-react"

function handleSmoothScroll(e: React.MouseEvent<HTMLAnchorElement>, targetId: string) {
  e.preventDefault()
  const element = document.getElementById(targetId)
  if (!element) return

  const headerOffset = 100
  const elementPosition = element.getBoundingClientRect().top + window.scrollY
  const offsetPosition = elementPosition - headerOffset

  window.scrollTo({ top: offsetPosition, behavior: "smooth" })
}

export function CTASection() {
  return (
    <section className="py-32 px-6 relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span className="text-[20vw] font-bold font-sans tracking-tighter leading-none text-zinc-100 whitespace-nowrap">
          BUILD
        </span>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-normal leading-tight max-w-4xl mx-auto mb-6 font-serif">
            ¿Listo para acelerar tu próximo proyecto?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-10">
            Contanos qué estás construyendo y te devolvemos un diagnóstico y propuesta en menos de 48 horas.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#contacto"
              onClick={(e) => handleSmoothScroll(e, "contacto")}
              className="relative flex items-center justify-center gap-0 bg-foreground text-background rounded-full pl-6 pr-1.5 py-1.5 transition-all duration-300 group overflow-hidden"
            >
              <span className="text-sm pr-4">Hacer una consulta</span>
              <span className="w-10 h-10 bg-background rounded-full flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-foreground" />
              </span>
            </a>

            <a
              href="/catalogo"
              className="relative flex items-center justify-center gap-0 border border-border rounded-full pl-6 pr-1.5 py-1.5 transition-all duration-300 group overflow-hidden"
            >
              <span className="absolute inset-0 bg-foreground rounded-full scale-x-0 origin-right group-hover:scale-x-100 transition-transform duration-300" />
              <span className="text-sm text-foreground group-hover:text-background pr-4 relative z-10 transition-colors duration-300">
                Ver servicios
              </span>
              <span className="w-10 h-10 rounded-full flex items-center justify-center relative z-10">
                <ArrowRight className="w-4 h-4 text-foreground group-hover:opacity-0 absolute transition-opacity duration-300" />
                <ArrowUpRight className="w-4 h-4 text-foreground group-hover:text-background opacity-0 group-hover:opacity-100 transition-all duration-300" />
              </span>
            </a>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-16">
          <div className="text-center">
            <p className="text-7xl font-light text-foreground">40+</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Clientes activos</p>
          </div>
          <div className="text-center">
            <p className="text-7xl font-light text-foreground">120+</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Proyectos entregados</p>
          </div>
          <div className="text-center">
            <p className="text-7xl font-light text-foreground">98%</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Retención de clientes</p>
          </div>
        </div>
      </div>
    </section>
  )
}
