import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { PackageOpen, ShoppingCart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/format'
import { useLang } from '@/lib/i18n/LangProvider'
import type { Product } from '@/types'

const STATUS = {
  available: 'bg-emerald-100/90 text-emerald-700',
  low: 'bg-amber-200/80 text-amber-800',
  out: 'bg-rose-100/90 text-rose-700',
} as const

const ART = [
  'from-amber-200 via-orange-100 to-rose-100',
  'from-sky-100 via-indigo-100 to-violet-100',
  'from-lime-100 via-emerald-100 to-teal-100',
  'from-fuchsia-100 via-pink-100 to-rose-100',
] as const

function stockState(stock: number): keyof typeof STATUS {
  if (stock > 10) return 'available'
  if (stock > 0) return 'low'
  return 'out'
}

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { t } = useLang()
  const state = stockState(product.stock)
  const statusLabel = t(`product.${state === 'available' ? 'inStock' : state === 'low' ? 'lowStock' : 'soldOut'}`)
  const art = ART[index % ART.length]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, delay: (index % 4) * 0.06 }}
      className="h-full"
    >
      <div className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-clay-lg">
        <div
          className={`relative flex h-40 items-center justify-center bg-gradient-to-br ${art} transition-transform duration-300 group-hover:scale-[1.03]`}
        >
          <PackageOpen className="h-16 w-16 text-foreground/50 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110" aria-hidden="true" />
          <Badge className={`absolute right-3 top-3 ${STATUS[state]}`}>{statusLabel}</Badge>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {product.category_name}
          </p>
          <h3 className="font-semibold leading-snug">{product.name}</h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {product.description}
          </p>
          <div className="mt-auto flex items-center justify-between pt-3">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-lg font-bold text-primary">
              {formatPrice(product.price)}
            </span>
            <span className="text-xs text-muted-foreground">
              {product.stock > 0 ? `${product.stock} ${t('product.left')}` : t('product.unavailable')}
            </span>
          </div>
        </div>
        <div className="p-5 pt-0">
          {product.in_stock ? (
            <Button asChild className="w-full">
              <Link to={`/order/${product.id}`}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                {t('product.orderNow')}
              </Link>
            </Button>
          ) : (
            <Button disabled className="w-full" variant="outline">
              {t('product.soldOut')}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}