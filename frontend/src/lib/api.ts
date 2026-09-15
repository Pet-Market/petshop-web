import axios from 'axios'
import type {
  AnimalListing,
  AnimalType,
  Appointment,
  AppointmentPayload,
  Category,
  Doctor,
  Order,
  OrderPayload,
  Product,
} from '@/types'

export interface AuthClient {
  id: number
  telegram_id: number | null
  phone: string | null
  first_name: string
  username: string
  has_password: boolean
  last_login: string | null
  created_at: string
}

export interface AuthSession {
  token: string
  client: AuthClient
  is_first_login: boolean
  password_sent: boolean
}

export const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api') as string

export interface EnvelopeMeta {
  request_id: string
  timestamp: string
  pagination?: {
    page: number
    page_size: number
    total: number
    total_pages: number
    has_next: boolean
    has_previous: boolean
  }
}

interface Envelope<T> {
  success: boolean
  data: T
  message: string | null
  meta: EnvelopeMeta
  errors: { field: string | null; code: string; message: string }[] | null
}

/** Unwrap the standardized envelope, falling back to raw payloads (opt-out mode). */
function data<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    return (payload as Envelope<T>).data
  }
  return payload as T
}

function errorMessage(data: unknown): string {
  if (data && typeof data === 'object') {
    const env = data as Record<string, unknown>
    if (Array.isArray(env.errors) && env.errors.length > 0) {
      const first = env.errors[0] as { message?: string }
      if (first?.message) return first.message
    }
    if (typeof env.message === 'string' && env.message) return env.message
    if (typeof env.detail === 'string') return env.detail
    if (typeof env.error === 'string') return env.error
  }
  return 'Something went wrong. Please try again.'
}

const http = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

const TOKEN_KEY = 'petshop_token'

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function storeToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* storage unavailable */
  }
}

http.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = errorMessage(error?.response?.data)
    return Promise.reject({ message, status: error?.response?.status, cause: error })
  }
)

export const api = {
  animalTypes: {
    list: (): Promise<AnimalType[]> => http.get('/animal-types/').then((r) => data<AnimalType[]>(r.data)),
    detail: (id: number): Promise<AnimalType> => http.get(`/animal-types/${id}/`).then((r) => data<AnimalType>(r.data)),
  },
  listings: {
    list: (animalTypeId?: number): Promise<AnimalListing[]> =>
      http
        .get('/listings/', {
          params: animalTypeId ? { animal_type: animalTypeId } : undefined,
        })
        .then((r) => data<AnimalListing[]>(r.data)),
    detail: (id: number): Promise<AnimalListing> => http.get(`/listings/${id}/`).then((r) => data<AnimalListing>(r.data)),
  },
  categories: {
    list: (animalTypeId?: number): Promise<Category[]> =>
      http
        .get('/categories/', {
          params: animalTypeId ? { animal_type: animalTypeId } : undefined,
        })
        .then((r) => data<Category[]>(r.data)),
  },
  products: {
    list: (params?: {
      category?: number
      animal_type?: number
      search?: string
    }): Promise<Product[]> => http.get('/products/', { params }).then((r) => data<Product[]>(r.data)),
    detail: (id: number): Promise<Product> => http.get(`/products/${id}/`).then((r) => data<Product>(r.data)),
  },
  doctors: {
    list: (): Promise<Doctor[]> => http.get('/doctors/').then((r) => data<Doctor[]>(r.data)),
  },
  appointments: {
    list: (): Promise<Appointment[]> => http.get('/appointments/').then((r) => data<Appointment[]>(r.data)),
    create: (payload: AppointmentPayload): Promise<Appointment> =>
      http.post('/appointments/', payload).then((r) => data<Appointment>(r.data)),
    updateStatus: (id: number, status: string): Promise<Appointment> =>
      http.post(`/appointments/${id}/status/`, { status }).then((r) => data<Appointment>(r.data)),
  },
  orders: {
    list: (): Promise<Order[]> => http.get('/orders/').then((r) => data<Order[]>(r.data)),
    create: (payload: OrderPayload): Promise<Order> =>
      http.post('/orders/', payload).then((r) => data<Order>(r.data)),
    updateStatus: (id: number, status: string): Promise<Order> =>
      http.post(`/orders/${id}/status/`, { status }).then((r) => data<Order>(r.data)),
  },
  auth: {
    tma: (initData: string, phone?: string): Promise<AuthSession> =>
      http.post('/auth/tma/', { init_data: initData, phone }).then((r) => data<AuthSession>(r.data)),
    login: (phone: string, password: string): Promise<AuthSession> =>
      http.post('/auth/login/', { phone, password }).then((r) => data<AuthSession>(r.data)),
    resetPassword: (phone: string): Promise<{ phone: string }> =>
      http.post('/auth/reset-password/', { phone }).then((r) => data<{ phone: string }>(r.data)),
    me: (): Promise<AuthSession> => http.get('/auth/me/').then((r) => data<AuthSession>(r.data)),
    logout: (): Promise<{ ok: boolean }> => http.post('/auth/logout/').then((r) => data<{ ok: boolean }>(r.data)),
  },
}