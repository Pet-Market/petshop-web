import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { ArrowRight, PawPrint } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/common/SectionHeading'
import { AnimalIcon } from '@/components/common/AnimalIcon'
import { ListingCard } from '@/components/common/ListingCard'
import { api } from '@/lib/api'
import { Seo } from '@/lib/seo'
import { useLang } from '@/lib/i18n/LangProvider'
import type { AnimalType } from '@/types'

export function AnimalsPage() {
  const { t } = useLang()
  const animalTypes = useQuery({ queryKey: ['animal-types'], queryFn: api.animalTypes.list })
  const listings = useQuery({ queryKey: ['listings'], queryFn: () => api.listings.list() })

  return (
    <>
      <Seo
        path="/animals"
        title="Animal Types"
        description="Explore pet types we care for — dogs, cats, birds, fish and rabbits. Find the right products for your pet."
      />
      <PageHeader title={t('animals.title')} subtitle={t('animals.subtitle')} />

      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        {animalTypes.isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : animalTypes.data?.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {animalTypes.data.map((animal: AnimalType, i: number) => (
              <motion.div
                key={animal.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: (i % 3) * 0.06 }}
              >
                <Link
                  to={`/animals/${animal.id}`}
                  className="group relative block h-full overflow-hidden rounded-3xl border bg-card p-8 text-center shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-glass"
                >
                  <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <AnimalIcon iconName={animal.icon} className="h-9 w-9" />
                  </div>
                  <h2 className="text-xl font-bold">{animal.name}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{animal.description}</p>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    {t('animals.viewProducts')}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="py-20 text-center text-muted-foreground">{t('animals.noAnimals')}</p>
        )}

        <section className="mt-16 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <PawPrint className="h-5 w-5 text-primary" aria-hidden="true" />
              {t('listings.sectionTitle')}
            </h2>
            <p className="text-sm text-muted-foreground">{t('listings.sectionSubtitle')}</p>
          </div>
          {listings.isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-72" />
              ))}
            </div>
          ) : listings.data?.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {listings.data.map((listing, i) => (
                <ListingCard key={listing.id} listing={listing} index={i} />
              ))}
            </div>
          ) : (
            <p className="py-10 text-center text-muted-foreground">{t('listings.empty')}</p>
          )}
        </section>
      </div>
    </>
  )
}