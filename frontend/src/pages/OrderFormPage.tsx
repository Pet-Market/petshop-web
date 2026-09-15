import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, PackageOpen, ShoppingBag } from 'lucide-react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/common/SectionHeading'
import { api } from '@/lib/api'
import { Seo } from '@/lib/seo'
import { formatPrice } from '@/lib/format'
import { getTelegramUser } from '@/lib/telegram'
import { useLang } from '@/lib/i18n/LangProvider'
import { useAppStore } from '@/stores/app'
import { useCartStore } from '@/stores/cart'
import type { OrderPayload } from '@/types'

export function OrderFormPage() {
  const { t } = useLang()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const telegram = useAppStore((s) => s.telegram)
  const addItem = useCartStore((s) => s.addItem)
  const tgUser = telegram?.user ?? getTelegramUser()

  const { id } = useParams<{ id: string }>()
  const productId = Number(id)
  const product = useQuery({
    queryKey: ['product', productId],
    queryFn: () => api.products.detail(productId),
    enabled: Number.isFinite(productId) && productId > 0,
  })

  const schema = z.object({
    customer_name: z.string().min(2, t('orderForm.errors.name')),
    customer_phone: z.string().regex(/^\+?\d{9,15}$/, t('orderForm.errors.phone')),
    customer_address: z.string().min(5, t('orderForm.errors.address')),
    quantity: z
      .string()
      .regex(/^\d+$/, t('orderForm.errors.quantity'))
      .refine((v) => Number(v) >= 1 && Number(v) <= (product.data?.stock ?? 999), t('orderForm.errors.quantity')),
  })

  type FormValues = z.infer<typeof schema>

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customer_name: tgUser?.first_name ?? '',
      customer_phone: '',
      customer_address: '',
      quantity: '1',
    },
  })

  const quantity = form.watch('quantity')

  const createOrder = useMutation({
    mutationFn: (payload: OrderPayload) => api.orders.create(payload),
    onSuccess: (order) => {
      toast.success(t('orderForm.success'))
      addItem({
        productId: order.product ?? productId,
        name: order.product_name,
        price: Number(order.product_price),
        stock: order.quantity,
      })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      navigate('/orders')
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? t('common.error'))
    },
  })

  function onSubmit(values: FormValues) {
    createOrder.mutate({
      ...values,
      product: productId,
      quantity: Number(values.quantity),
    })
  }

  return (
    <>
      <Seo
        path={`/order/${productId}`}
        title={`Order – ${product.data?.name ?? 'Product'}`}
        description="Place an order for this product."
      />

      {product.isLoading ? (
        <div className="mx-auto max-w-xl px-4 py-16">
          <Skeleton className="h-64" />
        </div>
      ) : !product.data ? (
        <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
          <PackageOpen className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">{t('products.noProducts')}</p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('orderForm.backToProducts')}
            </Link>
          </Button>
        </div>
      ) : !product.data.in_stock ? (
        <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
          <PackageOpen className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">{t('product.soldOut')}</p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('orderForm.backToProducts')}
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <PageHeader
            title={`${t('orderForm.title')} — ${product.data.name}`}
            subtitle={t('orderForm.subtitle')}
          />
          <div className="mx-auto max-w-xl px-4 py-8 md:py-10">
            <Card>
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2 text-2xl">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                  {product.data.category_name} • {formatPrice(product.data.price)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                      control={form.control}
                      name="customer_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('orderForm.customerName')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('orderForm.placeholders.name')} {...field} />
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
                            <Input type="tel" placeholder={t('orderForm.placeholders.phone')} {...field} />
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
                            <Input placeholder={t('orderForm.placeholders.address')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('orderForm.quantity')}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={product.data.stock}
                              {...field}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            {product.data.stock} {t('product.left')}
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-primary/5 p-4">
                      <span className="text-sm font-medium text-muted-foreground">
                        {t('orderForm.total')}
                      </span>
                      <span className="text-xl font-bold text-primary">
                        {formatPrice(Number(product.data.price) * safeQuantity(quantity, 1))}
                      </span>
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full rounded-full"
                      disabled={createOrder.isPending}
                    >
                      {createOrder.isPending ? t('common.loading') : t('orderForm.submit')}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </>
  )
}

function safeQuantity(value: unknown, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : fallback
}