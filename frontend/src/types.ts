export interface AnimalType {
  id: number
  name: string
  description: string | null
  icon: string
}

export interface Category {
  id: number
  name: string
  animal_type: AnimalType
  product_count: number
}

export interface Product {
  id: number
  name: string
  description: string | null
  price: string
  stock: number
  category: number
  category_name: string
  animal_type: string
  in_stock: boolean
  created_at: string
}

export interface Doctor {
  id: number
  name: string
  specialization: string
  experience: number
  phone: string
  email: string
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export interface Appointment {
  id: number
  client_name: string
  client_phone: string
  animal_type: number
  animal_type_name: string
  animal_name: string
  doctor: number
  doctor_name: string
  date: string
  time: string
  problem_description: string
  status: AppointmentStatus
  created_at: string
}

export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled'

export interface Order {
  id: number
  product: number
  product_name: string
  product_price: string
  customer_name: string
  customer_phone: string
  customer_address: string
  quantity: number
  total_price: string
  status: OrderStatus
  created_at: string
}

export interface AppointmentPayload {
  client_name: string
  client_phone: string
  animal_type: number
  animal_name: string
  doctor: number
  date: string
  time: string
  problem_description: string
}

export interface OrderPayload {
  product: number
  customer_name: string
  customer_phone: string
  customer_address: string
  quantity: number
}