"use client"
import type React from "react"
import { useEffect, useState } from "react"
import { ArrowUpRight } from "lucide-react"
import { AnimatedText } from "./animated-text"

function handleSmoothScroll(e: React.MouseEvent<HTMLAnchorElement>, targetId: string) {
  e.preventDefault()
  const element = document.getElementById(targetId)
  if (!element) return

  const headerOffset = 100
  const elementPosition = element.getBoundingClientRect().top + window.scrollY
  const offsetPosition = elementPosition - headerOffset

  window.scrollTo({ top: offsetPosition, behavior: "smooth" })
}

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    let rafId: number
    let currentProgress = 0

    const handleScroll = () => {
      const scrollY = window.scrollY
      const maxScroll = 400
      const targetProgress = Math.min(scrollY / maxScroll, 1)

      const smoothUpdate = () => {
        currentProgress += (targetProgress - currentProgress) * 0.1

        if (Math.abs(targetProgress - currentProgress) > 0.001) {
          setScrollProgress(currentProgress)
          rafId = requestAnimationFrame(smoothUpdate)
        } else {
          setScrollProgress(targetProgress)
        }
      }

      cancelAnimationFrame(rafId)
      smoothUpdate()
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScroll)
      cancelAnimationFrame(rafId)
    }
  }, [])

  const easeOutQuad = (t: number) => t * (2 - t)
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

  const scale = 1 - easeOutQuad(scrollProgress) * 0.15
  const borderRadius = easeOutCubic(scrollProgress) * 48
  const heightVh = 100 - easeOutQuad(scrollProgress) * 37.5

  return (
    <section className="pt-32 pb-12 px-6 min-h-screen flex items-center relative overflow-hidden">
      <div className="absolute inset-0 top-0">
        <div
          className="w-full will-change-transform overflow-hidden bg-[radial-gradient(circle_at_20%_20%,oklch(0.2_0_0)_0%,oklch(0.05_0_0)_45%,oklch(0_0_0)_100%)]"
          style={{
            transform: `scale(${scale})`,
            borderRadius: `${borderRadius}px`,
            height: `${heightVh}vh`,
          }}
        >
          <svg className="w-full h-full opacity-[0.15]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full relative z-10">
        <div className="text-center mb-12">
          <div
            className={`transition-all duration-1000 delay-[800ms] ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}
          >
            <p className="text-sm uppercase tracking-[0.2em] text-white/70 font-medium mb-6">
              Consultoría IT
            </p>
            <h1 className="font-serif text-[3rem] sm:text-[4rem] md:text-[5rem] lg:text-[6rem] xl:text-[6.5rem] font-normal leading-tight mb-6 w-full px-4 max-w-6xl mx-auto text-balance">
              <AnimatedText
                text="Tecnología que mueve tu negocio hacia adelante"
                delay={0.3}
                className="text-white"
              />
            </h1>
            <p
              className={`text-white/80 text-lg max-w-2xl mx-auto leading-relaxed transition-all duration-1000 delay-[1400ms] ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              Diseñamos, construimos y escalamos software, infraestructura cloud y procesos digitales para empresas
              que necesitan resultados, no solo diapositivas.
            </p>
          </div>
        </div>

        <div
          className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-1000 delay-[1700ms] ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
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
            className="relative flex items-center justify-center gap-0 border border-white/30 rounded-full pl-6 pr-6 py-1.5 transition-all duration-300 group overflow-hidden"
          >
            <span className="absolute inset-0 bg-white rounded-full scale-x-0 origin-right group-hover:scale-x-100 transition-transform duration-300" />
            <span className="text-sm text-white group-hover:text-black relative z-10 transition-colors duration-300">
              Ver servicios
            </span>
          </a>
        </div>
      </div>
    </section>
  )
}
