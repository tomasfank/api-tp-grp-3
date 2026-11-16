// Reglas de validación compartidas por los formularios (las mismas que valida el backend).
// Cada función devuelve el mensaje de error, o undefined si el valor es válido.

export type FormErrors<T> = Partial<Record<keyof T, string>>

export function required(value: string, message: string) {
  return value.trim() === "" ? message : undefined
}

export function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? undefined : "El formato del correo electrónico no es válido"
}

// el teléfono es opcional: solo se valida si se completó
export function validatePhone(value: string) {
  if (value === "") return undefined
  return /^\d{7,15}$/.test(value) ? undefined : "El teléfono debe contener entre 7 y 15 dígitos numéricos"
}

export function validatePassword(value: string) {
  if (value.length < 8) return "Debe tener al menos 8 caracteres"
  if (!/[A-Z]/.test(value)) return "Debe contener al menos una letra mayúscula"
  if (!/[0-9!@#$%^&*()_\-+=[\]{};':"\\|,.<>/?`~]/.test(value)) return "Debe contener al menos un dígito o símbolo"
  return undefined
}

export function validateUrl(value: string) {
  try {
    new URL(value)
    return undefined
  } catch {
    return "Debe ser una URL válida"
  }
}

// true si ningún campo tiene error
export function isValid<T>(errors: FormErrors<T>) {
  return Object.values(errors).every((error) => !error)
}
