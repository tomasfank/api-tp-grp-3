import type { ApiErrorShape } from "@/lib/types"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

export class ApiError extends Error {
  status: number
  errors?: ApiErrorShape["errors"]

  constructor(shape: ApiErrorShape) {
    super(shape.message)
    this.status = shape.status
    this.errors = shape.errors
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("auth_token")
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown
  auth?: boolean
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, auth = true, headers, ...rest } = options

  const finalHeaders: Record<string, string> = {
    ...(headers as Record<string, string>),
  }

  if (body !== undefined) {
    finalHeaders["Content-Type"] = "application/json"
  }

  if (auth) {
    const token = getToken()
    if (token) {
      finalHeaders["Authorization"] = `Bearer ${token}`
    }
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 204) {
    return undefined as T
  }

  const isJson = res.headers.get("content-type")?.includes("application/json")
  const data = isJson ? await res.json() : undefined

  if (!res.ok) {
    throw new ApiError({
      status: res.status,
      message: data?.message || "Ha ocurrido un error inesperado",
      errors: data?.errors,
    })
  }

  return data as T
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "DELETE" }),
}
