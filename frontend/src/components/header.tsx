import type React from "react"
import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router"
import { Menu, X, ArrowUpRight, ArrowRight } from "lucide-react"

const navItems = [
  { label: "Servicios", href: "/catalogo" },
  { label: "Nosotros", id: "why-us" },
  { label: "Clientes", id: "testimonials" },
  { label: "FAQ", id: "faq" },
]

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault()
    if (pathname !== "/") {
      navigate(`/#${targetId}`)
      setIsOpen(false)
      return
    }
    const element = document.getElementById(targetId)

    if (element) {
      const headerOffset = 100
      const elementPosition = element.getBoundingClientRect().top + window.scrollY
      const offsetPosition = elementPosition - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      })
      setIsOpen(false)
    }
  }

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname !== "/") return
    e.preventDefault()
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
      <div className="max-w-7xl mx-auto rounded-2xl bg-white/70 backdrop-blur-xl border border-zinc-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" onClick={handleLogoClick} className="flex items-center gap-2 cursor-pointer">
            <svg
              className="w-6 h-6 transition-colors duration-300 text-black"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2 2 7l10 5 10-5-10-5Z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            <span
              className="text-lg font-medium tracking-tight transition-colors duration-300 text-black"
            >
              Vaultra
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) =>
              item.href ? (
                <Link
                  key={item.label}
                  to={item.href}
                  className="text-sm transition-colors cursor-pointer text-zinc-600 hover:text-black"
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={`#${item.id}`}
                  onClick={(e) => handleSmoothScroll(e, item.id as string)}
                  className="text-sm transition-colors cursor-pointer text-zinc-600 hover:text-black"
                >
                  {item.label}
                </a>
              ),
            )}
          </nav>

          <div className="hidden md:flex items-center gap-1">
            <a
              href="#contacto"
              onClick={(e) => handleSmoothScroll(e, "contacto")}
              className="relative flex items-center gap-0 border rounded-full pl-5 pr-1 py-1 transition-all duration-300 group overflow-hidden cursor-pointer border-zinc-300"
            >
              <span
                className="absolute inset-0 rounded-full scale-x-0 origin-right group-hover:scale-x-100 transition-transform duration-300 bg-black"
              />
              <span
                className="text-sm pr-3 relative z-10 transition-colors duration-300 text-black group-hover:text-white"
              >
                Hacer una consulta
              </span>
              <span className="w-8 h-8 rounded-full flex items-center justify-center relative z-10">
                <ArrowRight
                  className="w-4 h-4 group-hover:opacity-0 absolute transition-opacity duration-300 text-black"
                />
                <ArrowUpRight
                  className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all duration-300 text-black group-hover:text-white"
                />
              </span>
            </a>
            <Link
              to="/login"
              className="text-sm ml-3 transition-colors cursor-pointer text-zinc-600 hover:text-black"
            >
              Ingresar
            </Link>
          </div>

          <button
            className="md:hidden transition-colors duration-300 text-black"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isOpen && (
          <nav
            className="md:hidden mt-6 pb-6 flex flex-col gap-4 border-t pt-6 border-zinc-200"
          >
            {navItems.map((item) =>
              item.href ? (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className="transition-colors cursor-pointer text-zinc-600 hover:text-black"
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={`#${item.id}`}
                  onClick={(e) => handleSmoothScroll(e, item.id as string)}
                  className="transition-colors cursor-pointer text-zinc-600 hover:text-black"
                >
                  {item.label}
                </a>
              ),
            )}
            <div
              className="flex flex-col gap-3 mt-4 pt-4 border-t border-zinc-200"
            >
              <a
                href="#contacto"
                onClick={(e) => handleSmoothScroll(e, "contacto")}
                className="relative flex items-center gap-0 border rounded-full pl-5 pr-1 py-1 w-fit transition-all duration-300 group overflow-hidden cursor-pointer border-zinc-300"
              >
                <span
                  className="absolute inset-0 rounded-full scale-x-0 origin-right group-hover:scale-x-100 transition-transform duration-300 bg-black"
                />
                <span
                  className="text-sm pr-3 relative z-10 transition-colors duration-300 text-black group-hover:text-white"
                >
                  Hacer una consulta
                </span>
                <span className="w-8 h-8 rounded-full flex items-center justify-center relative z-10">
                  <ArrowRight
                    className="w-4 h-4 group-hover:opacity-0 absolute transition-opacity duration-300 text-black"
                  />
                  <ArrowUpRight
                    className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all duration-300 text-black group-hover:text-white"
                  />
                </span>
              </a>
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="text-sm text-zinc-600 hover:text-black"
              >
                Ingresar
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
