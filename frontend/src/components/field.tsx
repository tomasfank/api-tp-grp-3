import type { ReactNode } from "react"
import { Label } from "@/components/ui/label"

interface FieldProps {
  label: string
  htmlFor: string
  error?: string
  children: ReactNode
}

// etiqueta + input + mensaje de error, para no repetir el mismo markup en cada formulario
export function Field({ label, htmlFor, error, children }: FieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className={error ? "text-destructive" : undefined}>
        {label}
      </Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
