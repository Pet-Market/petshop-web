import { Link, useNavigate } from 'react-router-dom'
import { Minus, PackageOpen, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/common/SectionHeading'
import { Seo } from '@/lib/seo'
import { formatPrice } from '@/lib/format'
import { useLang } from '@/lib/i18n/LangProvider'
import { useCartStore } from '@/stores/cart'

export function CartPage() {
  const { t } = useLang()
  const navigate = useNavigate()
  const items = useCartStore((s) => s.items)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const qtyCount = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <>
      <Seo
        path="/cart"
        title={t('cart.title')}
        description={t('cart.subtitle')}
      />
      <PageHeader title={t('cart.title')} subtitle={t('cart.subtitle')} />

      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        {items.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="glass-card flex h-24 w-24 items-center justify-center rounded-3xl">
              <ShoppingBag className="h-10 w-10 text-primary" aria-hidden="true" />
            </div>
            <h2 className="mt-6 text-xl font-bold text-foreground">{t('cart.empty')}</h2>
            <p className="mt-2 max-w-sm text-muted-foreground">{t('cart.emptyHint')}</p>
            <Button asChild size="lg" className="mt-8 rounded-full">
              <Link to="/products">
                <PackageOpen className="mr-2 h-4 w-4" />
                {t('cart.continueShopping')}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
            {/* Items */}
            <div className="space-y-4">
              <p className="text-sm font-semibold text-muted-foreground">{t('cart.items', { count: qtyCount })}</p>
              {items.map((item) => (
                <div key={item.productId} className="glass-card flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center">
                  <div
                    aria-hidden="true"
                    className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/25 via-primary/10 to-indigo-500/25"
                  >
                    <PackageOpen className="h-8 w-8 text-white/40" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-100">{item.name}</h3>
                    <p className="mt-1 text-xs text-slate-400">
                      {item.stock} {t('product.left')} · {formatPrice(item.price)}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-rose-400 transition-colors hover:text-rose-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      {t('cart.remove')}
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <div className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-slate-800/70 p-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        aria-label="−"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-white">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        aria-label="+"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="w-24 text-right text-base font-extrabold text-white">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="glass-card sticky top-24 rounded-2xl p-6 lg:top-28">
              <h3 className="font-display text-lg font-bold text-white">{t('checkout.summary')}</h3>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between text-slate-300">
                  <span>{t('cart.items', { count: qtyCount })}</span>
                  <span className="font-semibold text-white">{formatPrice(total)}</span>
                </div>
                <div className="border-t border-white/10 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{t('cart.total')}</span>
                    <span className="text-xl font-extrabold text-primary">{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              <Button size="lg" className="mt-6 w-full rounded-xl" onClick={() => navigate('/checkout')}>
                {t('cart.checkout')}
              </Button>
              <Button asChild variant="ghost" className="mt-2 w-full rounded-xl text-slate-300 hover:bg-white/10">
                <Link to="/products">{t('cart.continueShopping')}</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}