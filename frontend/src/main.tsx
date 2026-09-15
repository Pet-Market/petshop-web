import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from '@/lib/seo'
import { queryClient } from '@/lib/query'
import { LangProvider } from '@/lib/i18n/LangProvider'
import { AuthProvider } from '@/lib/auth'
import { setupTelegramApp } from '@/lib/telegram'
import { useAppStore } from '@/stores/app'

const telegram = setupTelegramApp(import.meta.env.DEV)
if (telegram) {
  useAppStore.getState().setTelegram(telegram)
}

document.documentElement.classList.add('dark')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <LangProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </AuthProvider>
      </LangProvider>
    </HelmetProvider>
  </StrictMode>,
)