export type AvailabilityStatus = "active" | "inactive"

export interface Category {
  _id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface Service {
  _id: string
  name: string
  category: string | Category
  description: string
  images: string[]
  price?: number
  availabilityStatus: AvailabilityStatus
  createdAt: string
  updatedAt: string
}

export interface BusinessInfo {
  _id: string
  name: string
  description?: string
  address?: string
  phone?: string
  socialMedia?: Record<string, string>
  businessHours?: string
  createdAt: string
  updatedAt: string
}

export type ContactStatus = "pending" | "read" | "answered"

export interface Contact {
  _id: string
  name: string
  email: string
  phone: string | null
  subject: string
  message: string
  status: ContactStatus
  createdAt: string
  updatedAt: string
}

export interface User {
  _id: string
  name: string
  lastName: string
  email: string
  phone?: string
  role: "admin"
  createdAt: string
  updatedAt: string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  totalPages: number
  limit?: number
  pageSize?: number
}

export interface ApiFieldError {
  field: string
  reason: string
}

export interface ApiErrorShape {
  status: number
  message: string
  errors?: ApiFieldError[]
}
