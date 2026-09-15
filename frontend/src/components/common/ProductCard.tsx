import { motion } from 'motion/react'
import { PackageOpen, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/format'
import { useLang } from '@/lib/i18n/LangProvider'
import { useCartStore } from '@/stores/cart'
import type { Product } from '@/types'

const STATUS = {
  available: 'border-emerald-400/30 bg-emerald-500/20 text-emerald-300',
  low: 'border-amber-400/30 bg-amber-500/20 text-amber-300',
  out: 'border-rose-400/30 bg-rose-500/20 text-rose-300',
} as const

function stockState(stock: number): keyof typeof STATUS {
  if (stock > 10) return 'available'
  if (stock > 0) return 'low'
  return 'out'
}

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { t } = useLang()
  const addItem = useCartStore((s) => s.addItem)
  const state = stockState(product.stock)
  const statusLabel = t(`product.${state === 'available' ? 'inStock' : state === 'low' ? 'lowStock' : 'soldOut'}`)

  const handleAdd = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      stock: product.stock,
    })
    toast.success(t('cart.added'), { description: product.name })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, delay: (index % 4) * 0.06 }}
      className="h-full"
    >
      <div className="glass-card group flex h-full flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:border-accent/40">
        <div className="relative mb-4 overflow-hidden rounded-xl">
          <div className="relative flex h-44 items-center justify-center bg-gradient-to-br from-sky-500/25 via-primary/10 to-indigo-500/25 transition-transform duration-300 group-hover:scale-105">
            <PackageOpen
              className="h-14 w-14 text-white/40 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110"
              aria-hidden="true"
            />
          </div>
          <Badge className={`absolute left-2 top-2 border ${STATUS[state]}`}>{statusLabel}</Badge>
        </div>
        <div className="flex flex-1 flex-col gap-1.5 px-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{product.category_name}</p>
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-100">{product.name}</h3>
          <p className="text-xs text-slate-500">
            {product.stock > 0 ? `${product.stock} ${t('product.left')}` : t('product.unavailable')}
          </p>
          <div className="mt-auto flex items-center justify-between border-t border-white/10 pb-4 pt-3">
            <span className="text-base font-extrabold text-white">{formatPrice(product.price)}</span>
            {product.in_stock ? (
              <button
                type="button"
                onClick={handleAdd}
                aria-label={t('cart.add')}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/25 transition-all hover:bg-primary/90 active:scale-95"
              >
                <Plus className="h-4 w-4" />
              </button>
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-700/60 text-slate-400">
                <Plus className="h-4 w-4" />
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}