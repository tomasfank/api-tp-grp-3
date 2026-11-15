import { useEffect } from "react"
import { useLocation } from "react-router"
import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { ServicesSection } from "@/components/services-section"
import { WhyUsSection } from "@/components/why-us-section"
import { CTASection } from "@/components/cta-section"
import { TestimonialsSection } from "@/components/testimonials-section"
import { FAQSection } from "@/components/faq-section"
import { ContactSection } from "@/components/contact-section"
import { Footer } from "@/components/footer"

export default function Home() {
  const { hash } = useLocation()

  // al llegar desde otra ruta con /#seccion, desplazarse a la sección
  useEffect(() => {
    if (!hash) return
    const element = document.getElementById(hash.slice(1))
    if (element) {
      const top = element.getBoundingClientRect().top + window.scrollY - 100
      window.scrollTo({ top, behavior: "smooth" })
    }
  }, [hash])

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <ServicesSection />
      <WhyUsSection />
      <CTASection />
      <TestimonialsSection />
      <FAQSection />
      <ContactSection />
      <Footer />
    </main>
  )
}
