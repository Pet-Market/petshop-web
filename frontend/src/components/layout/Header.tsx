import { NavLink, Link } from 'react-router-dom'
import { CalendarCheck, PawPrint, ShoppingBag } from 'lucide-react'
import { motion } from 'motion/react'
import { useCartStore } from '@/stores/cart'
import { LanguageSelector } from '@/components/common/LanguageSelector'
import { useLang } from '@/lib/i18n/LangProvider'
import { cn } from '@/lib/utils'
import type { TranslationKey } from '@/lib/i18n/translations'

const NAV_KEYS: { to: string; key: TranslationKey }[] = [
  { to: '/', key: 'nav.home' },
  { to: '/animals', key: 'nav.animals' },
  { to: '/products', key: 'nav.products' },
  { to: '/doctors', key: 'nav.doctors' },
]

export function Header() {
  const count = useCartStore((s) => s.count())
  const { t } = useLang()

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md"
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          to="/"
          className="font-display flex items-center gap-2 text-xl font-bold tracking-tight"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-clay">
            <PawPrint className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>
            Pet<span className="text-primary">Shop</span>
          </span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {NAV_KEYS.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground',
                    isActive && 'bg-primary/10 text-primary hover:text-primary'
                  )
                }
              >
                {t(link.key)}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <LanguageSelector compact />
          <Link
            to="/orders"
            className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
            aria-label={t('nav.orders')}
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
          <Link
            to="/appointments/new"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-[0_3px_0_oklch(0.45_0.16_259)] transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]"
          >
            <CalendarCheck className="h-4 w-4" />
            <span className="hidden sm:inline">{t('nav.book')}</span>
          </Link>
        </div>
      </nav>
    </motion.header>
  )
}