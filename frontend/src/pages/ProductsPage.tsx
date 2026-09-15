import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, PackageOpen, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ProductCard } from '@/components/common/ProductCard'
import { PageHeader } from '@/components/common/SectionHeading'
import { AnimalIcon } from '@/components/common/AnimalIcon'
import { api } from '@/lib/api'
import { Seo } from '@/lib/seo'
import { useLang } from '@/lib/i18n/LangProvider'
import { cn } from '@/lib/utils'
import type { AnimalType } from '@/types'

export function ProductsPage() {
  const { t } = useLang()
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [animalFilter, setAnimalFilter] = useState<number | null>(null)

  const animalTypes = useQuery({ queryKey: ['animal-types'], queryFn: api.animalTypes.list })
  const products = useQuery({ queryKey: ['products', animalFilter], queryFn: () => api.products.list(animalFilter ? { animal_type: animalFilter } : undefined) })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products.data ?? []
    return (products.data ?? []).filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q) ||
        p.category_name.toLowerCase().includes(q)
    )
  }, [products.data, search])

  return (
    <>
      <Seo
        path="/products"
        title="Products"
        description="Browse pet food, toys and accessories for dogs, cats, birds, fish and rabbits."
      />
      <PageHeader title={t('products.title')} subtitle={t('products.subtitle')}>
        <div className="relative mx-auto mt-6 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('products.searchPlaceholder')}
            className="rounded-full bg-background pl-9 shadow-sm"
            aria-label={t('products.searchPlaceholder')}
          />
        </div>
      </PageHeader>

      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        {animalTypes.data?.length ? (
          <div className="mb-10 flex flex-wrap items-center justify-center gap-2" role="group" aria-label={t('products.filterByType')}>
            <button
              onClick={() => setAnimalFilter(null)}
              className={cn(
                'flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all',
                animalFilter === null
                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                  : 'glass-card text-slate-300 hover:bg-slate-700/60'
              )}
            >
              {t('common.all')}
            </button>
            {animalTypes.data.map((animal: AnimalType) => (
              <button
                key={animal.id}
                onClick={() => setAnimalFilter(animalFilter === animal.id ? null : animal.id)}
                className={cn(
                  'flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all',
                  animalFilter === animal.id
                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                    : 'glass-card text-slate-300 hover:bg-slate-700/60'
                )}
              >
                <AnimalIcon iconName={animal.icon} className="h-4 w-4" />
                {animal.name}
              </button>
            ))}
          </div>
        ) : null}

        {products.isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-72" />
            ))}
          </div>
        ) : filtered.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-20 text-center">
            <PackageOpen className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">{t('products.noProducts')}</p>
            <Button asChild variant="outline" className="mt-6 rounded-full">
              <Link to="/products">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('common.back')}
              </Link>
            </Button>
          </div>
        )}
      </div>
    </>
  )
}