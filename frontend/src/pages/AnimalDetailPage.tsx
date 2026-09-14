import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductCard } from '@/components/common/ProductCard'
import { AnimalIcon } from '@/components/common/AnimalIcon'
import { api } from '@/lib/api'
import { Seo } from '@/lib/seo'
import { useLang } from '@/lib/i18n/LangProvider'

export function AnimalDetailPage() {
  const { t } = useLang()
  const { id } = useParams<{ id: string }>()
  const animalId = Number(id)

  const animal = useQuery({
    queryKey: ['animal', animalId],
    queryFn: () => api.animalTypes.detail(animalId),
    enabled: Number.isFinite(animalId),
  })
  const categories = useQuery({
    queryKey: ['categories', animalId],
    queryFn: () => api.categories.list(animalId),
    enabled: Number.isFinite(animalId),
  })
  const products = useQuery({
    queryKey: ['products', animalId],
    queryFn: () => api.products.list({ animal_type: animalId }),
    enabled: Number.isFinite(animalId),
  })

  const isLoading = animal.isLoading || categories.isLoading || products.isLoading

  return (
    <>
      <Seo
        path={`/animals/${animalId}`}
        title={`${animal.data?.name ?? 'Animal'} – PetShop`}
        description={animal.data?.description ?? `Products and categories for ${animal.data?.name ?? 'animals'}`}
      />

      {isLoading ? (
        <div className="mx-auto max-w-6xl px-4 py-16">
          <Skeleton className="h-40" />
          <Skeleton className="mt-8 h-64" />
        </div>
      ) : (
        <>
          <section className="from-primary/15 via-accent/30 to-secondary/15 bg-gradient-to-br">
            <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-16 text-center">
              <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary">
                <AnimalIcon iconName={animal.data?.icon ?? 'paw'} className="h-12 w-12" />
              </div>
              <h1 className="font-display text-4xl font-bold tracking-tight">
                {animal.data?.name}
              </h1>
              <p className="mt-3 max-w-xl text-muted-foreground md:text-lg">
                {animal.data?.description}
              </p>
              <div className="mt-8">
                <Button asChild variant="outline" className="rounded-full">
                  <Link to="/animals">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('animalDetail.backToAnimals')}
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          <div className="mx-auto max-w-6xl px-4 py-14">
            <h2 className="font-display mb-8 text-center text-3xl font-bold tracking-tight">
              {t('animalDetail.categoriesAndProducts')}
            </h2>

            {categories.data?.length ? (
              <div className="space-y-12">
                {categories.data.map((category) => {
                  const catProducts = products.data?.filter(
                    (p) => p.category === category.id
                  )
                  return (
                    <section key={category.id}>
                      <div className="mb-5 flex items-end justify-between">
                        <div>
                          <h3 className="text-xl font-bold">{category.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {category.product_count} {t('product.count')}
                          </p>
                        </div>
                      </div>
                      {catProducts?.length ? (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {catProducts.map((product, i) => (
                            <ProductCard key={product.id} product={product} index={i} />
                          ))}
                        </div>
                      ) : (
                        <Card className="p-10 text-center text-muted-foreground">
                          {t('animalDetail.noProductsInCategory')}
                        </Card>
                      )}
                    </section>
                  )
                })}
              </div>
            ) : (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-16 text-center text-muted-foreground"
              >
                {t('animalDetail.noCategories')}
              </motion.p>
            )}
          </div>
        </>
      )}
    </>
  )
}