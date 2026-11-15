import { Link } from "react-router"
import { Header } from "@/components/header"

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="pt-40 pb-24 px-4 flex flex-col items-center text-center">
        <h1 className="font-serif text-4xl tracking-tight mb-4">Página no encontrada</h1>
        <p className="text-muted-foreground mb-8">La página que buscás no existe o fue movida.</p>
        <Link to="/" className="inline-flex rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm">
          Volver al inicio
        </Link>
      </section>
    </main>
  )
}
