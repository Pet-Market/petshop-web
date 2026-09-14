import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { HomePage } from '@/pages/HomePage'
import { AnimalsPage } from '@/pages/AnimalsPage'
import { AnimalDetailPage } from '@/pages/AnimalDetailPage'
import { ProductsPage } from '@/pages/ProductsPage'
import { DoctorsPage } from '@/pages/DoctorsPage'
import { AppointmentFormPage } from '@/pages/AppointmentFormPage'
import { AppointmentsPage } from '@/pages/AppointmentsPage'
import { OrderFormPage } from '@/pages/OrderFormPage'
import { OrdersPage } from '@/pages/OrdersPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'animals', element: <AnimalsPage /> },
      { path: 'animals/:id', element: <AnimalDetailPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'doctors', element: <DoctorsPage /> },
      { path: 'appointments/new', element: <AppointmentFormPage /> },
      { path: 'appointments', element: <AppointmentsPage /> },
      { path: 'order/:id', element: <OrderFormPage /> },
      { path: 'orders', element: <OrdersPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}