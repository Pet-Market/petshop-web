import { Link } from 'react-router-dom'
import { PawPrint } from 'lucide-react'
import { useLang } from '@/lib/i18n/LangProvider'

export function Footer() {
  const { t } = useLang()
  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 px-4 py-10 text-sm sm:flex-row">
        <Link to="/" className="font-display flex items-center gap-2 text-lg font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <PawPrint className="h-4 w-4" aria-hidden="true" />
          </span>
          Pet<span className="text-primary">Shop</span>
        </Link>
        <p className="text-background/70">© {new Date().getFullYear()} PetShop. {t('footer.rights')}</p>
      </div>
    </footer>
  )
}