import Link from "next/link"
import { Linkedin, Github, Twitter, ArrowUpRight } from "lucide-react"

const footerLinks = {
  servicios: [
    { label: "Desarrollo de software", href: "#services" },
    { label: "Cloud & infraestructura", href: "#services" },
    { label: "Transformación digital", href: "#services" },
  ],
  empresa: [
    { label: "Nosotros", href: "#why-us" },
    { label: "Clientes", href: "#testimonials" },
    { label: "FAQ", href: "#faq" },
  ],
  legal: [
    { label: "Términos", href: "#" },
    { label: "Privacidad", href: "#" },
    { label: "Cookies", href: "#" },
  ],
}

export function Footer() {
  return (
    <footer id="contact" className="relative z-20 border-t border-border pt-16 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-16 border-b border-border mb-12">
          <div>
            <h3 className="text-3xl md:text-4xl font-normal font-serif mb-3 text-balance">
              Hablemos de tu próximo proyecto
            </h3>
            <p className="text-muted-foreground max-w-md">
              Escribinos a{" "}
              <a href="mailto:hola@vaultra.io" className="text-foreground underline underline-offset-4">
                hola@vaultra.io
              </a>{" "}
              o agendá una llamada directamente.
            </p>
          </div>
          <a
            href="mailto:hola@vaultra.io"
            className="relative flex items-center justify-center gap-0 bg-foreground text-background rounded-full pl-6 pr-1.5 py-1.5 transition-all duration-300 group overflow-hidden flex-shrink-0"
          >
            <span className="text-sm pr-4">Escribinos</span>
            <span className="w-10 h-10 bg-background rounded-full flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-foreground" />
            </span>
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <svg
                className="w-5 h-5 text-foreground"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2 2 7l10 5 10-5-10-5Z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              <span className="text-base font-medium text-foreground">Vaultra</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Consultoría IT para empresas que necesitan software, cloud y decisiones tecnológicas rápidas.
            </p>
            <div className="flex gap-4">
              <Link
                href="#"
                className="w-9 h-9 border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                <Linkedin className="w-4 h-4" />
              </Link>
              <Link
                href="#"
                className="w-9 h-9 border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                <Github className="w-4 h-4" />
              </Link>
              <Link
                href="#"
                className="w-9 h-9 border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-foreground mb-4 uppercase tracking-wider">Servicios</h4>
            <ul className="space-y-3">
              {footerLinks.servicios.map((link, i) => (
                <li key={i}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-foreground mb-4 uppercase tracking-wider">Empresa</h4>
            <ul className="space-y-3">
              {footerLinks.empresa.map((link, i) => (
                <li key={i}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-foreground mb-4 uppercase tracking-wider">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link, i) => (
                <li key={i}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 pb-16">
          <p className="text-xs text-muted-foreground">© 2026 Vaultra Consulting. Todos los derechos reservados.</p>
          <p className="text-xs text-muted-foreground">Consultoría en tecnología e infraestructura.</p>
        </div>
      </div>
    </footer>
  )
}
