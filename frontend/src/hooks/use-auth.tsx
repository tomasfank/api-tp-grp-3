import { createContext, useContext, useState, type ReactNode } from "react"
import { api } from "@/lib/api"
import type { User } from "@/lib/types"

interface LoginPayload {
  email: string
  password: string
}

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  login: (payload: LoginPayload) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function readStoredUser(): User | null {
  try {
    return JSON.parse(localStorage.getItem("auth_user") ?? "null")
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // localStorage es síncrono: se lee una sola vez al crear el estado, sin useEffect ni estado de "cargando"
  const [token, setToken] = useState(() => localStorage.getItem("auth_token"))
  const [user, setUser] = useState(readStoredUser)

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
    localStorage.removeItem("auth_user")
    setToken(null)
    setUser(null)
  }

  const persistUser = (u: User) => {
    localStorage.setItem("auth_user", JSON.stringify(u))
    setUser(u)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!token,
        login,
        logout,
        setUser: persistUser,
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
