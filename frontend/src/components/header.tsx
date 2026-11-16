import { useState } from "react"
import { Link } from "react-router"
import { Menu, X, ArrowUpRight, ArrowRight } from "lucide-react"

// "/#seccion" funciona desde cualquier ruta: ScrollRestoration se encarga de desplazarse
const navItems = [
  { label: "Servicios", to: "/catalogo" },
  { label: "Nosotros", to: "/#why-us" },
  { label: "Clientes", to: "/#testimonials" },
  { label: "FAQ", to: "/#faq" },
]

function ContactButton({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      to="/#contacto"
      onClick={onClick}
      className="relative flex items-center gap-0 border rounded-full pl-5 pr-1 py-1 w-fit transition-all duration-300 group overflow-hidden border-zinc-300"
    >
      <span className="absolute inset-0 rounded-full scale-x-0 origin-right group-hover:scale-x-100 transition-transform duration-300 bg-black" />
      <span className="text-sm pr-3 relative z-10 transition-colors duration-300 text-black group-hover:text-white">
        Hacer una consulta
      </span>
      <span className="w-8 h-8 rounded-full flex items-center justify-center relative z-10">
        <ArrowRight className="w-4 h-4 group-hover:opacity-0 absolute transition-opacity duration-300 text-black" />
        <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all duration-300 text-black group-hover:text-white" />
      </span>
    </Link>
  )
}

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const close = () => setIsOpen(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
      <div className="max-w-7xl mx-auto rounded-2xl bg-white/70 backdrop-blur-xl border border-zinc-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2 2 7l10 5 10-5-10-5Z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            <span className="text-lg font-medium tracking-tight text-black">Vaultra</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link key={item.label} to={item.to} className="text-sm transition-colors text-zinc-600 hover:text-black">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-1">
            <ContactButton />
            <Link to="/login" className="text-sm ml-3 transition-colors text-zinc-600 hover:text-black">
              Ingresar
            </Link>
          </div>

          <button className="md:hidden text-black" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isOpen && (
          <nav className="md:hidden mt-6 pb-6 flex flex-col gap-4 border-t pt-6 border-zinc-200">
            {navItems.map((item) => (
              <Link key={item.label} to={item.to} onClick={close} className="transition-colors text-zinc-600 hover:text-black">
                {item.label}
              </Link>
            ))}
            <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-zinc-200">
              <ContactButton onClick={close} />
              <Link to="/login" onClick={close} className="text-sm text-zinc-600 hover:text-black">
                Ingresar
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
