import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import {
  translations,
  resolveKey,
  type Lang,
  type TranslationKey,
} from '@/lib/i18n/translations'

const STORAGE_KEY = 'petshop-lang'
const SUPPORTED: Lang[] = ['en', 'ru', 'uz']

function detectLang(): Lang {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && (SUPPORTED as string[]).includes(saved)) return saved as Lang

  try {
    // @ts-expect-error Telegram SDK may be available
    const userLang: string | undefined = window?.Telegram?.WebApp?.initDataUnsafe?.user?.language_code
    if (userLang) {
      if (userLang.startsWith('ru')) return 'ru'
      if (userLang.startsWith('uz')) return 'uz'
    }
  } catch { /* not in TMA */ }

  return 'uz'
}

interface LangContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
}

const LangContext = createContext<LangContextValue | null>(null)

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang)

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang)
    localStorage.setItem(STORAGE_KEY, newLang)
    document.documentElement.lang = newLang
  }, [])

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) =>
      resolveKey(translations[lang], key, vars),
    [lang]
  )

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used inside <LangProvider>')
  return ctx
}