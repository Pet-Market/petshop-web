import { Languages } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLang } from '@/lib/i18n/LangProvider'
import type { Lang } from '@/lib/i18n/translations'

const LANGS: { value: Lang; label: string }[] = [
  { value: 'uz', label: "O'zbek" },
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
]

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useLang()

  return (
    <div className="flex items-center gap-1" aria-label="Language">
      {!compact && <Languages className="h-4 w-4 text-muted-foreground" />}
      <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
        <SelectTrigger className="h-9 w-[110px] gap-2" aria-label="Select language">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LANGS.map((l) => (
            <SelectItem key={l.value} value={l.value}>
              {l.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}