import axios from 'axios'
import type {
  AnimalType,
  Appointment,
  AppointmentPayload,
  Category,
  Doctor,
  Order,
  OrderPayload,
  Product,
} from '@/types'

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
}