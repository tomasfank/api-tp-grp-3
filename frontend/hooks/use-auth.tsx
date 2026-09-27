"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { api, ApiError } from "@/lib/api"
import type { User } from "@/lib/types"

interface LoginPayload {
  email: string
  password: string
}

interface AuthContextValue {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (payload: LoginPayload) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token")
    const storedUser = localStorage.getItem("auth_user")
    if (storedToken) setToken(storedToken)
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem("auth_user")
      }
    }
    setIsLoading(false)
  }, [])

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
        token,
        isLoading,
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

export function useRequireAdmin() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login")
    }
  }, [isLoading, isAuthenticated, router])

  return { isReady: !isLoading && isAuthenticated, isLoading }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError
}
