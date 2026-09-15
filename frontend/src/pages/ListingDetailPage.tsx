import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, MapPin, PackageOpen, PawPrint, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
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
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { PageHeader } from '@/components/common/SectionHeading'
import { animalIconKey, getPetPhoto } from '@/lib/petPhotos'
import { api } from '@/lib/api'
import { Seo } from '@/lib/seo'
import { formatDate, formatPrice, todayDateInput } from '@/lib/format'
import { getTelegramUser } from '@/lib/telegram'
import { useLang } from '@/lib/i18n/LangProvider'
import { useAppStore } from '@/stores/app'
import type { OrderPayload } from '@/types'

export function ListingDetailPage() {
  const { t } = useLang()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const telegram = useAppStore((s) => s.telegram)
  const tgUser = telegram?.user ?? getTelegramUser()

  const { id } = useParams<{ id: string }>()
  const listingId = Number(id)
  const listing = useQuery({
    queryKey: ['listing', listingId],
    queryFn: () => api.listings.detail(listingId),
    enabled: Number.isFinite(listingId) && listingId > 0,
  })

  const iconKey = animalIconKey(listing.data?.animal_type_name)

  const schema = z
    .object({
      customer_name: z.string().min(2, t('orderForm.errors.name')),
      customer_phone: z.string().regex(/^\+?\d{9,15}$/, t('orderForm.errors.phone')),
      customer_address: z.string().min(5, t('orderForm.errors.address')),
      quantity: z
        .string()
        .regex(/^\d+$/, t('orderForm.errors.quantity'))
        .refine((v) => Number(v) >= 1 && Number(v) <= (listing.data?.stock ?? 999), t('orderForm.errors.quantity')),
      pickup_date: z.string().min(1, t('listingOrder.errors.date')),
      pickup_time: z.string().min(1, t('listingOrder.errors.time')),
    })
    .superRefine((values, ctx) => {
      if (!values.pickup_date || !values.pickup_time) return
      const pickup = new Date(`${values.pickup_date}T${values.pickup_time}`)
      if (Number.isNaN(pickup.getTime()) || pickup.getTime() < Date.now()) {
        ctx.addIssue({
          code: 'custom',
          path: ['pickup_date'],
          message: t('listingOrder.errors.future'),
        })
      }
    })

  type FormValues = z.infer<typeof schema>

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customer_name: tgUser?.first_name ?? '',
      customer_phone: '',
      customer_address: '',
      quantity: '1',
      pickup_date: '',
      pickup_time: '',
    },
  })

  const quantity = form.watch('quantity')

  useEffect(() => {
    const sub = form.watch((values, { name }) => {
      if (name === 'pickup_date' || name === 'pickup_time' || !name) {
        console.log('PICKUP_DEBUG', name, values.pickup_date, values.pickup_time)
      }
    })
    return () => sub.unsubscribe()
  }, [form])

  const createOrder = useMutation({
    mutationFn: (payload: OrderPayload) => api.orders.create(payload),
    onSuccess: () => {
      toast.success(t('listingOrder.success'))
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      navigate('/orders')
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? t('common.error'))
    },
  })

  function onSubmit(values: FormValues) {
    createOrder.mutate({
      listing: listingId,
      customer_name: values.customer_name,
      customer_phone: values.customer_phone,
      customer_address: values.customer_address,
      quantity: Number(values.quantity),
      pickup_date: values.pickup_date,
      pickup_time: values.pickup_time,
    })
  }

  return (
    <>
      <Seo
        path={`/listings/${listingId}`}
        title={`${listing.data?.title ?? 'Listing'} – Pet Market`}
        description={listing.data?.description ?? 'Animal for sale.'}
      />

      <PageHeader
        title={t('listings.title')}
        subtitle={t('listings.subtitle')}
      />

      {listing.isLoading ? (
        <div className="mx-auto max-w-6xl px-4 py-8">
          <Skeleton className="h-96" />
        </div>
      ) : !listing.data ? (
        <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
          <PackageOpen className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">{t('listings.notFound')}</p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/animals">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('animals.title')}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="mx-auto max-w-6xl gap-8 px-4 py-8 md:py-10 lg:grid lg:grid-cols-5">
          {/* Listing details */}
          <div className="space-y-6 lg:col-span-3">
            <Card className="overflow-hidden p-0">
              <div className="relative">
                <img
                  src={getPetPhoto(iconKey)}
                  alt={listing.data.title}
                  className="h-64 w-full object-cover sm:h-80"
                />
                <Badge
                  className={`absolute left-3 top-3 border ${
                    listing.data.in_stock
                      ? 'border-emerald-400/30 bg-emerald-500/20 text-emerald-300'
                      : 'border-rose-400/30 bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {listing.data.in_stock ? t('listings.inStock') : t('listings.soldOut')}
                </Badge>
              </div>
              <CardContent className="space-y-4 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-bold">{listing.data.title}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <PawPrint className="h-3.5 w-3.5" aria-hidden="true" />
                        {listing.data.animal_type_name}
                      </span>
                      <span className="mx-2">•</span>
                      {formatDate(listing.data.created_at)}
                    </p>
                  </div>
                  <p className="text-2xl font-extrabold text-primary">
                    {formatPrice(listing.data.price)}
                  </p>
                </div>

                {listing.data.description ? (
                  <p className="text-muted-foreground">{listing.data.description}</p>
                ) : null}

                <dl className="grid gap-3 rounded-2xl border border-border/60 bg-card p-4 text-sm sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                    <dt className="text-muted-foreground">{t('listings.left')}:</dt>
                    <dd>{listing.data.stock}</dd>
                  </div>
                  {listing.data.contact_phone ? (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" aria-hidden="true" />
                      <dt className="text-muted-foreground">{t('listings.contact')}:</dt>
                      <dd>{listing.data.contact_phone}</dd>
                    </div>
                  ) : null}
                </dl>
              </CardContent>
            </Card>
          </div>

          {/* Buy form */}
          <div className="mt-8 lg:col-span-2 lg:mt-0">
            <Card className="sticky top-28">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2 text-2xl">
                  <PawPrint className="h-6 w-6 text-primary" aria-hidden="true" />
                  {t('listingOrder.title')}
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
                            <Input type="number" min={1} max={listing.data.stock} {...field} />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            {listing.data.stock} {t('listings.left')}
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DateTimePicker
                      control={form.control}
                      dateName="pickup_date"
                      timeName="pickup_time"
                      minDate={todayDateInput()}
                      disabled={createOrder.isPending}
                    />
                    {form.formState.errors.pickup_date || form.formState.errors.pickup_time ? (
                      <p className="text-sm font-medium text-destructive" role="alert">
                        {form.formState.errors.pickup_date?.message ??
                          form.formState.errors.pickup_time?.message}
                      </p>
                    ) : null}

                    <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-primary/5 p-4">
                      <span className="text-sm font-medium text-muted-foreground">
                        {t('orderForm.total')}
                      </span>
                      <span className="text-xl font-bold text-primary">
                        {formatPrice(Number(listing.data.price) * safeQuantity(quantity, 1))}
                      </span>
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full rounded-full"
                      disabled={createOrder.isPending || !listing.data.in_stock}
                    >
                      {createOrder.isPending ? t('common.loading') : t('listingOrder.submit')}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  )
}

function safeQuantity(value: unknown, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : fallback
}