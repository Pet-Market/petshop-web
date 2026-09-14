import { create } from 'zustand'
import type { TelegramLaunchInfo } from '@/lib/telegram'

interface AppState {
  telegram: TelegramLaunchInfo | null
  setTelegram: (info: TelegramLaunchInfo | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  telegram: null,
  setTelegram: (telegram) => set({ telegram }),
}))