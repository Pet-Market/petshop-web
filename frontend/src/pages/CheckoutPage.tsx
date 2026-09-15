import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Loader2, PackageOpen, Phone, User } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/common/SectionHeading'
import { api } from '@/lib/api'
import { Seo } from '@/lib/seo'
import { formatPrice } from '@/lib/format'
import { getTelegramUser } from '@/lib/telegram'
import { useLang } from '@/lib/i18n/LangProvider'
import { useAppStore } from '@/stores/app'
import { useCartStore } from '@/stores/cart'
import type { OrderPayload } from '@/types'

const fieldClasses =
  'h-11 rounded-xl border-white/10 bg-slate-800/70 pl-10 text-sm text-slate-100 placeholder-slate-500 transition-colors focus:border-accent focus:bg-slate-800 focus:ring-1 focus:ring-accent'

export function CheckoutPage() {
  const { t } = useLang()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const telegram = useAppStore((s) => s.telegram)
  const items = useCartStore((s) => s.items)
  const clear = useCartStore((s) => s.clear)
  const tgUser = telegram?.user ?? getTelegramUser()

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  const schema = z.object({
    customer_name: z.string().min(2, t('orderForm.errors.name')),
    customer_phone: z.string().regex(/^\+?\d{9,15}$/, t('orderForm.errors.phone')),
    customer_address: z.string().min(5, t('orderForm.errors.address')),
  })

  type FormValues = z.infer<typeof schema>

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customer_name: tgUser?.first_name ?? '',
      customer_phone: '',
      customer_address: '',
    },
  })

  const submit = useMutation({
    mutationFn: (values: FormValues) =>
      Promise.all(
        items.map((item) =>
          api.orders.create({
            ...values,
            product: item.productId,
            quantity: item.quantity,
          } satisfies OrderPayload)
        )
      ),
    onSuccess: () => {
      clear()
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success(t('orderForm.success'))
      navigate('/orders')
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? t('common.error'))
    },
  })

  if (items.length === 0) {
    return (
      <>
        <Seo path="/checkout" title={t('checkout.title')} description={t('checkout.subtitle')} />
        <PageHeader title={t('checkout.title')} subtitle={t('checkout.subtitle')} />
        <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
          <PackageOpen className="mb-4 h-12 w-12 text-muted-foreground/50" aria-hidden="true" />
          <p className="text-muted-foreground">{t('checkout.noItems')}</p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('checkout.toProducts')}
            </Link>
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <Seo path="/checkout" title={t('checkout.title')} description={t('checkout.subtitle')} />
      <PageHeader title={t('checkout.title')} subtitle={t('checkout.subtitle')} />

      <div className="mx-auto max-w-5xl px-4 py-8 md:py-10">
        <div className="grid items-start gap-6 md:grid-cols-[1fr_360px]">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-xl">{t('orderForm.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((v) => submit.mutate(v))} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="customer_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('orderForm.customerName')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User
                              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                              aria-hidden="true"
                            />
                            <Input placeholder={t('orderForm.placeholders.name')} className={fieldClasses} {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customer_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('orderForm.customerPhone')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone
                              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                              aria-hidden="true"
                            />
                            <Input
                              type="tel"
                              placeholder={t('orderForm.placeholders.phone')}
                              className={fieldClasses}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customer_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('orderForm.address')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <PackageOpen
                              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                              aria-hidden="true"
                            />
                            <Input placeholder={t('orderForm.placeholders.address')} className={fieldClasses} {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full rounded-xl"
                    disabled={submit.isPending}
                  >
                    {submit.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <PackageOpen className="mr-2 h-4 w-4" />
                    )}
                    {t('checkout.title')}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Order summary */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-display text-lg font-bold text-white">{t('checkout.summary')}</h3>

            <div className="mt-5 space-y-3">
              {items.map((item) => (
                <div key={item.productId} className="flex items-start justify-between gap-3 text-sm">
                  <span className="line-clamp-2 text-slate-300">
                    {item.quantity} × {item.name}
                  </span>
                  <span className="shrink-0 font-semibold text-white">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-3 border-t border-white/10 pt-4 text-sm">
              <div className="flex items-center justify-between text-slate-300">
                <span>{t('cart.subtotal')}</span>
                <span className="font-semibold text-white">{formatPrice(total)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">{t('cart.total')}</span>
                <span className="text-xl font-extrabold text-primary">{formatPrice(total)}</span>
              </div>
            </div>

            <Button asChild variant="ghost" className="mt-5 w-full rounded-xl text-slate-300 hover:bg-white/10">
              <Link to="/cart">{t('checkout.backToCart')}</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}