"use client"

import { Check } from "lucide-react"
import { motion } from "framer-motion"

const reasons = [
  "Diagnóstico técnico en la primera semana",
  "Equipo senior dedicado, sin rotación constante",
  "Entregas incrementales cada 2 semanas",
  "Soporte y monitoreo post-lanzamiento",
  "Comunicación directa, sin intermediarios",
  "Contratos flexibles por proyecto o squad",
]

const sprintColumns = [
  { title: "Por hacer", items: ["Auth con SSO", "Dashboard de métricas"] },
  { title: "En curso", items: ["Migración a Kubernetes"] },
  { title: "Listo", items: ["API de pagos", "Pipeline CI/CD"] },
]

function SprintBoardCard() {
  return (
    <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Sprint actual</p>
          <p className="text-sm font-medium text-foreground">Semana 6 de 12</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-medium">
          V
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {sprintColumns.map((col, i) => (
          <motion.div
            key={col.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
            viewport={{ once: true }}
            className="space-y-2"
          >
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">{col.title}</p>
            {col.items.map((item) => (
              <div key={item} className="rounded-lg bg-muted px-2.5 py-2 text-[11px] leading-tight text-foreground">
                {item}
              </div>
            ))}
          </motion.div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-border flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Progreso general</p>
        <p className="text-xs font-medium text-foreground">68%</p>
      </div>
      <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full bg-foreground rounded-full"
          initial={{ width: 0 }}
          whileInView={{ width: "68%" }}
          transition={{ duration: 1, ease: "easeOut" }}
          viewport={{ once: true }}
        />
      </div>
    </div>
  )
}

export function WhyUsSection() {
  return (
    <section id="why-us" className="py-32 px-6 relative overflow-hidden">
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-center pointer-events-none z-0">
        <span className="font-bold text-center text-[20vw] sm:text-[18vw] md:text-[16vw] lg:text-[14vw] leading-none tracking-tighter text-zinc-100 whitespace-nowrap">
          PROCESO
        </span>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 flex justify-center">
            <SprintBoardCard />
          </div>

          <div className="order-1 lg:order-2 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-normal mb-6 text-balance font-serif">
                Trabajamos como una extensión de tu equipo
              </h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                Sin informes eternos ni reuniones que no llevan a nada. Visibilidad real del avance, sprint a sprint.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-4">
              {reasons.map((reason, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center p-3 rounded-xl hover:bg-zinc-50 transition-colors duration-300 gap-2 py-1"
                >
                  <div className="w-6 h-6 bg-foreground rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5 text-background" strokeWidth={2.5} />
                  </div>
                  <span className="text-sm text-foreground">{reason}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
