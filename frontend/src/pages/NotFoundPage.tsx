import { Link } from 'react-router-dom'
import { PawPrint } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLang } from '@/lib/i18n/LangProvider'

export function NotFoundPage() {
  const { t } = useLang()
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-clay">
        <PawPrint className="h-9 w-9" />
      </div>
      <p className="font-display text-7xl font-bold text-primary">404</p>
      <p className="mt-4 text-lg text-muted-foreground">{t('products.noProducts')}</p>
      <Button asChild className="mt-8 rounded-full">
        <Link to="/">{t('nav.home')}</Link>
      </Button>
    </div>
  )
}