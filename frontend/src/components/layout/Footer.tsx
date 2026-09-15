import { Link } from 'react-router-dom'
import { useLang } from '@/lib/i18n/LangProvider'

export function Footer() {
  const { t } = useLang()
  return (
    <footer className="mt-16 border-t border-slate-800 bg-slate-900/70 px-4 py-8 text-sm text-slate-400 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
        <Link to="/" className="font-display flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-white">
          <span className="relative h-8 w-8 overflow-hidden rounded-lg shadow-glass ring-1 ring-black/20">
            <img src="/assets/img/logo-white.jpeg" alt="" aria-hidden="true" className="size-full object-cover" />
          </span>
          PET<span className="text-accent">MARKET</span>
        </Link>
        <p>© {new Date().getFullYear()} Pet Market. {t('footer.rights')}</p>
        <div className="flex items-center gap-4">
          <Link to="/products" className="transition-colors hover:text-white">
            {t('nav.products')}
          </Link>
          <Link to="/doctors" className="transition-colors hover:text-white">
            {t('nav.doctors')}
          </Link>
        </div>
      </div>
    </footer>
  )
}