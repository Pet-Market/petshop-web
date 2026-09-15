import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { ArrowRight, Grid, PawPrint, PlayCircle, Sparkles } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductCard } from '@/components/common/ProductCard'
import { ListingCard } from '@/components/common/ListingCard'
import { api } from '@/lib/api'
import { Seo } from '@/lib/seo'
import { getPetPhoto } from '@/lib/petPhotos'
import { useLang } from '@/lib/i18n/LangProvider'
import type { AnimalType } from '@/types'

export function HomePage() {
  const { t } = useLang()
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const animalTypes = useQuery({ queryKey: ['animal-types'], queryFn: api.animalTypes.list })
  const listings = useQuery({ queryKey: ['listings'], queryFn: () => api.listings.list() })
  const products = useQuery({ queryKey: ['products', 'featured'], queryFn: () => api.products.list() })

  const filteredProducts = useMemo(() => {
    const list = products.data ?? []
    if (!activeCategory) return list
    return list.filter((p) => p.animal_type === activeCategory)
  }, [products.data, activeCategory])

  return (
    <>
      <Seo
        path="/"
        title="Pet Market – Pet Supplies & Veterinary Services"
        description="Quality pet food, toys, accessories and professional veterinary care. Everything for your pet in one place."
        type="website"
      />

      <main className="mx-auto max-w-7xl space-y-12 px-4 py-8 md:px-6">
        {/* Hero — glass card */}
        <section className="glass-card relative flex flex-col items-center justify-between gap-8 overflow-hidden rounded-3xl p-8 md:flex-row md:p-12">
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-10 -right-10 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />

          <div className="z-10 max-w-xl space-y-6">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {t('home.eyebrow')}
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="font-display text-4xl font-extrabold leading-tight text-white md:text-5xl"
            >
              {t('home.title')}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-base text-slate-300"
            >
              {t('home.subtitle')}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="flex flex-wrap items-center gap-4 pt-2"
            >
              <Link
                to="/products"
                className="rounded-full bg-primary px-6 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary/90"
              >
                {t('home.catalog')}
              </Link>
              <Link
                to="/doctors"
                className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-800/60 px-6 py-3 font-semibold text-slate-200 transition-all hover:bg-slate-700/60"
              >
                <PlayCircle className="h-4 w-4" aria-hidden="true" />
                {t('home.videoReview')}
              </Link>
            </motion.div>
          </div>

          {/* Offer card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass-card z-10 w-full rounded-2xl p-4 md:w-80"
          >
            <img
              src={getPetPhoto('dog')}
              alt=""
              className="mb-4 h-48 w-full rounded-xl object-cover"
              loading="eager"
            />
            <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
              <span>{t('home.weekOffer')}</span>
              <span className="font-bold text-accent">{t('home.discount')}</span>
            </div>
            <h4 className="text-sm font-bold text-white">{t('home.premiumKit')}</h4>
          </motion.div>
        </section>

        {/* Animals for sale — live listings */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="flex items-center gap-2 text-xl font-bold text-white">
                <PawPrint className="h-5 w-5 text-accent" aria-hidden="true" />
                {t('home.animalsForSale.title')}
              </h3>
              <p className="mt-1 text-sm text-slate-400">{t('home.animalsForSale.subtitle')}</p>
            </div>
            <Link to="/animals" className="shrink-0 text-sm font-semibold text-accent hover:underline">
              {t('home.animalsForSale.browse')}
            </Link>
          </div>

          {animalTypes.data?.length ? (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {animalTypes.data.map((animal: AnimalType) => (
                <Link
                  key={animal.id}
                  to={`/animals/${animal.id}`}
                  className="glass-card flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full py-2 pl-2 pr-4 text-sm font-semibold text-slate-200 transition-all hover:border-accent/40"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <img
                      src={getPetPhoto(animal.icon)}
                      alt=""
                      className="h-full w-full rounded-full object-cover"
                      loading="lazy"
                    />
                  </span>
                  {animal.name}
                </Link>
              ))}
            </div>
          ) : null}

          {listings.isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : listings.data?.length ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {listings.data.slice(0, 10).map((listing, i) => (
                <ListingCard key={listing.id} listing={listing} index={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {animalTypes.data?.map((animal: AnimalType, i: number) => (
                <motion.div
                  key={animal.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                >
                  <Link
                    to={`/animals/${animal.id}`}
                    className="glass-card group block overflow-hidden rounded-2xl transition-all duration-300 hover:border-accent/40"
                  >
                    <div className="relative overflow-hidden">
                      <img
                        src={getPetPhoto(animal.icon)}
                        alt={animal.name}
                        className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      <span className="absolute left-2 top-2 rounded-full border border-accent/30 bg-black/50 px-2.5 py-1 text-[11px] font-bold text-accent backdrop-blur-md">
                        {t('home.animalsForSale.available')}
                      </span>
                    </div>
                    <div className="p-3">
                      <h4 className="text-sm font-bold text-slate-100">{animal.name}</h4>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Categories */}
        <section className="space-y-4">
          <h3 className="flex items-center gap-2 text-xl font-bold text-white">
            <Grid className="h-5 w-5 text-accent" aria-hidden="true" />
            {t('home.categoriesTitle')}
          </h3>
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                activeCategory === null
                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                  : 'glass-card text-slate-300 hover:bg-slate-700/60'
              }`}
            >
              {t('common.all')}
            </button>
            {animalTypes.data?.map((animal: AnimalType) => (
              <button
                key={animal.id}
                onClick={() => setActiveCategory(activeCategory === animal.name ? null : animal.name)}
                className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                  activeCategory === animal.name
                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                    : 'glass-card text-slate-300 hover:bg-slate-700/60'
                }`}
              >
                {animal.name}
              </button>
            ))}
          </div>
        </section>

        {/* Product grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-xl font-bold text-white">{t('home.productsSection.title')}</h3>
            <Link to="/products" className="flex shrink-0 items-center gap-1 text-sm font-semibold text-accent hover:underline">
              {t('home.viewAllProducts')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {products.isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-72" />
              ))}
            </div>
          ) : filteredProducts.length ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {filteredProducts.slice(0, 8).map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          ) : (
            <p className="py-10 text-center text-slate-400">{t('products.noProducts')}</p>
          )}
        </section>
      </main>
    </>
  )
}