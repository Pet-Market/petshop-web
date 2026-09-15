import { useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { CalendarCheck, Search, ShoppingBag } from 'lucide-react'
import { motion } from 'motion/react'
import { useCartStore } from '@/stores/cart'
import { LanguageSelector } from '@/components/common/LanguageSelector'
import { AccountButton } from '@/components/auth/AccountButton'
import { useLang } from '@/lib/i18n/LangProvider'
import { cn } from '@/lib/utils'
import type { TranslationKey } from '@/lib/i18n/translations'

const NAV_KEYS: { to: string; key: TranslationKey }[] = [
  { to: '/', key: 'nav.home' },
  { to: '/animals', key: 'nav.animals' },
  { to: '/products', key: 'nav.products' },
  { to: '/doctors', key: 'nav.doctors' },
]

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/10 hover:text-white',
    isActive && 'bg-primary/80 text-white hover:bg-primary/80'
  )

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'whitespace-nowrap rounded-full border border-white/10 bg-slate-800/60 px-4 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:text-white',
    isActive && 'border-primary/50 bg-primary/20 text-white'
  )

export function Header() {
  const count = useCartStore((s) => s.count())
  const { t } = useLang()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/products?search=${encodeURIComponent(q)}` : '/products')
  }

  const searchInputClass =
    'h-9.5 w-full rounded-full border border-white/10 bg-slate-800/80 py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-400 transition-colors focus:border-accent focus:bg-slate-800 focus:outline-none'

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="glass-nav sticky top-0 z-40"
    >
      <nav className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Row 1: logo · desktop actions */}
        <div className="flex h-16 items-center justify-between gap-3">
          <Link
            to="/"
            className="font-display flex shrink-0 items-center gap-2.5 text-xl font-extrabold tracking-tight text-white"
          >
            <span className="relative h-9 w-9 overflow-hidden rounded-xl shadow-glass ring-1 ring-black/20">
              <img
                src="/assets/img/logo-black.jpeg"
                alt=""
                aria-hidden="true"
                className="size-full object-cover"
              />
            </span>
            <span>
              PET<span className="text-accent">MARKET</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <ul className="hidden items-center gap-1 lg:flex">
            {NAV_KEYS.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to} end={link.to === '/'} className={navLinkClass}>
                  {t(link.key)}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Desktop search */}
          <form
            onSubmit={submitSearch}
            role="search"
            className="relative hidden flex-1 justify-end lg:flex"
          >
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('products.searchPlaceholder')}
                aria-label={t('products.searchPlaceholder')}
                className={searchInputClass}
              />
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-1 md:gap-2">
            <LanguageSelector compact />
            <AccountButton />
            <Link
              to="/cart"
              className="relative flex h-9 w-9 items-center justify-center rounded-full p-0 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
              aria-label={t('nav.cart')}
            >
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white ring-2 ring-slate-900">
                  {count}
                </span>
              )}
            </Link>
            <Link
              to="/appointments/new"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary/90"
            >
              <CalendarCheck className="h-4 w-4" />
              <span className="hidden sm:inline">{t('nav.book')}</span>
            </Link>
          </div>
        </div>

        {/* Mobile / tablet: search + nav */}
        <div className="gap-3 pb-3 lg:hidden">
          <form onSubmit={submitSearch} role="search" className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('products.searchPlaceholder')}
              aria-label={t('products.searchPlaceholder')}
              className={searchInputClass}
            />
          </form>
          <ul className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {NAV_KEYS.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to} end={link.to === '/'} className={mobileLinkClass}>
                  {t(link.key)}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </motion.header>
  )
}