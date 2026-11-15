import type React from "react"
import { useRef } from "react"
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion"
import { ArrowUpRight } from "lucide-react"

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
  const sectionRef = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion()

  // el contenido se desvanece suavemente a medida que el hero sale de pantalla
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] })
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])
  const contentY = useTransform(scrollYProgress, [0, 0.6], [0, -40])

  const fadeUp = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay, ease: "easeOut" as const },
        }

  return (
    <section
      ref={sectionRef}
      className="pt-32 pb-12 px-6 min-h-screen flex items-center relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,oklch(0.2_0_0)_0%,oklch(0.05_0_0)_45%,oklch(0_0_0)_100%)]">
        <svg className="w-full h-full opacity-[0.15]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background" />
      </div>

      <motion.div
        className="max-w-7xl mx-auto w-full relative z-10"
        style={reduceMotion ? undefined : { opacity: contentOpacity, y: contentY }}
      >
        <div className="text-center mb-12">
          <motion.div {...fadeUp(0)}>
            <p className="text-sm uppercase tracking-[0.2em] text-white/70 font-medium mb-6">
              Consultoría IT
            </p>
            <h1 className="font-serif text-[3rem] sm:text-[4rem] md:text-[5rem] lg:text-[6rem] xl:text-[6.5rem] font-normal leading-tight mb-6 w-full px-4 max-w-6xl mx-auto text-balance">
              <span className="font-bold text-center text-6xl leading-[0.75] tracking-tighter font-serif lg:text-9xl text-white">
                Tecnología que mueve tu negocio hacia adelante
              </span>
            </h1>
          </motion.div>
          <motion.p {...fadeUp(0.15)} className="text-white/80 text-lg max-w-2xl mx-auto leading-relaxed">
            Diseñamos, construimos y escalamos software, infraestructura cloud y procesos digitales para empresas
            que necesitan resultados, no solo diapositivas.
          </motion.p>
        </div>

        <motion.div
          {...fadeUp(0.3)}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
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
        </motion.div>
      </motion.div>
    </section>
  )
}
