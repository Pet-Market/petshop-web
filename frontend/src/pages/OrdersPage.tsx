import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CalendarClock, PackageX, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/common/StatusBadge'
import { PageHeader } from '@/components/common/SectionHeading'
import { api } from '@/lib/api'
import { Seo } from '@/lib/seo'
import { formatDate, formatDateTime, formatPrice, formatTime } from '@/lib/format'
import { useLang } from '@/lib/i18n/LangProvider'
import type { Order } from '@/types'

export function OrdersPage() {
  const { t } = useLang()
  const orders = useQuery({ queryKey: ['orders'], queryFn: api.orders.list })

  return (
    <>
      <Seo
        path="/orders"
        title="Orders"
        description="All customer orders."
      />
      <PageHeader title={t('orders.title')} subtitle={t('orders.subtitle')} />

      <div className="mx-auto max-w-4xl px-4 py-8 md:py-10">
        {orders.isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-36" />
            ))}
          </div>
        ) : orders.data?.length ? (
          <div className="space-y-4">
            {orders.data.map((order: Order) => (
              <Card key={order.id} className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold">
                        {order.product_name || order.listing_name}
                      </h2>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {order.customer_name} • {formatDateTime(order.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">
                      {formatPrice(order.total_price)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.quantity} × {formatPrice(order.product_price ?? order.listing_price ?? 0)}
                    </p>
                  </div>
                </div>

                <dl className="mt-4 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                  <div className="flex gap-2">
                    <dt className="text-muted-foreground">{t('orders.address')}:</dt>
                    <dd>{order.customer_address}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-muted-foreground">{t('orders.phone')}:</dt>
                    <dd>{order.customer_phone}</dd>
                  </div>
                  {order.pickup_date ? (
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <CalendarClock className="h-4 w-4 text-primary" aria-hidden="true" />
                      <dt className="text-muted-foreground">{t('orders.pickup')}:</dt>
                      <dd>
                        {formatDate(order.pickup_date)} • {formatTime(order.pickup_time)}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-20 text-center">
            <PackageX className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">{t('orders.noOrders')}</p>
            <Button asChild className="mt-6 rounded-full">
              <Link to="/products">
                <ShoppingBag className="mr-2 h-4 w-4" />
                {t('products.title')}
              </Link>
            </Button>
          </div>
        )}
      </div>
    </>
  )
}