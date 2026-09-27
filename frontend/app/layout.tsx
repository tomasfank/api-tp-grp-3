import type React from "react"
import type { Metadata } from "next"
import { Inter, Geist_Mono, Playfair_Display } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/hooks/use-auth"
import "./globals.css"

const _inter = Inter({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })
const _playfair = Playfair_Display({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Vaultra Consulting — Consultoría IT",
  description:
    "Software a medida, cloud e infraestructura, y transformación digital para empresas que necesitan moverse rápido.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`font-sans antialiased`}>
        <AuthProvider>
          {children}
          <Toaster position="top-center" />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
