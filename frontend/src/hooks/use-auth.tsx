import { createContext, useContext, useState, type ReactNode } from "react"
import { api } from "@/lib/api"

interface LoginPayload {
  email: string
  password: string
}

interface AuthContextValue {
  isAuthenticated: boolean
  login: (payload: LoginPayload) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  // localStorage es síncrono: se lee una sola vez al crear el estado, sin useEffect ni estado de "cargando"
  const [token, setToken] = useState(() => localStorage.getItem("auth_token"))

  const login = async (payload: LoginPayload) => {
    const res = await api.post<{ token: string }>("/api/auth/login", payload, { auth: false })
    localStorage.setItem("auth_token", res.token)
    setToken(res.token)
  }

  const logout = async () => {
    try {
      await api.post("/api/auth/logout")
    } catch {
      // ignore network/logout errors, clear local session regardless
    }
    localStorage.removeItem("auth_token")
    setToken(null)
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
