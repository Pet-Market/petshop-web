import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  PackageOpen,
  PawPrint,
  ShoppingBag,
  Stethoscope,
  Truck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { SectionHeading } from '@/components/common/SectionHeading'
import { ProductCard } from '@/components/common/ProductCard'
import { AnimalIcon } from '@/components/common/AnimalIcon'
import { api } from '@/lib/api'
import { Seo } from '@/lib/seo'
import { useLang } from '@/lib/i18n/LangProvider'
import { formatPrice } from '@/lib/format'
import type { AnimalType, Doctor, Product } from '@/types'

export function HomePage() {
  const { t } = useLang()
  const animalTypes = useQuery({ queryKey: ['animal-types'], queryFn: api.animalTypes.list })
  const products = useQuery({ queryKey: ['products', 'featured'], queryFn: () => api.products.list() })
  const doctors = useQuery({ queryKey: ['doctors'], queryFn: api.doctors.list })

  return (
    <>
      <Seo
        path="/"
        title="Pet Shop – Pet Supplies & Veterinary Services"
        description="Quality pet food, toys, accessories and professional veterinary care. Everything for your pet in one place."
        type="website"
      />

      {/* Hero — clay island */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-amber-100 via-background to-orange-100"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:py-24 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-clay"
            >
              <PawPrint className="h-4 w-4" aria-hidden="true" />
              {t('home.eyebrow')}
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="font-display text-balance bg-gradient-to-br from-foreground via-foreground to-primary bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-6xl"
            >
              {t('home.title')}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mt-4 text-pretty text-lg text-muted-foreground"
            >
              {t('home.subtitle')}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start"
            >
              <Button asChild size="lg">
                <Link to="/products">
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  {t('home.browseProducts')}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-accent/30 bg-accent/5 text-accent hover:bg-accent/10">
                <Link to="/appointments/new">
                  <CalendarCheck className="mr-2 h-5 w-5" />
                  {t('home.bookVet')}
                </Link>
              </Button>
            </motion.div>
          </div>

          {/* Floating clay tiles */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative mx-auto hidden h-80 w-80 lg:block"
            aria-hidden="true"
          >
            <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-primary via-orange-400 to-amber-300 shadow-blob" />
            <div className="absolute inset-4 rounded-[2.5rem] bg-white/20 backdrop-blur-[2px]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-32 w-32 items-center justify-center rounded-full bg-background text-primary shadow-blob">
                <PawPrint className="h-16 w-16" />
              </span>
            </div>

            {products.data?.slice(0, 3).map((product: Product, i) => (
              <motion.div
                key={product.id}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute flex items-center gap-2.5 rounded-2xl bg-card p-3 pr-4 shadow-blob"
                style={{ top: `${12 + i * 24}%`, right: i % 2 ? '2rem' : 'auto', left: i % 2 ? 'auto' : '2rem' }}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <PackageOpen className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold">{formatPrice(product.price)}</span>
              </motion.div>
            ))}

            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-2xl bg-card p-3 pr-4 shadow-blob"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <Stethoscope className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold">{t('home.bookVet')}</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="mx-auto max-w-6xl px-4 pb-4">
        <div className="grid gap-3 rounded-3xl border border-border/70 bg-card px-6 py-6 shadow-sm sm:grid-cols-3">
          {[
            { icon: Truck, label: t('home.trust.delivery') },
            { icon: BadgeCheck, label: t('home.trust.vets') },
            { icon: PawPrint, label: t('home.trust.guarantee') },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-center gap-3 text-center">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <item.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-sm font-semibold">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Animal types */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeading
          eyebrow={t('home.eyebrow')}
          title={t('home.animalsSection.title')}
          subtitle={t('home.animalsSection.subtitle')}
        />
        {animalTypes.isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
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
                  className="group flex h-full flex-col items-center gap-3 rounded-3xl border border-border/70 bg-card p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-clay"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all duration-300 group-hover:rounded-full group-hover:bg-primary group-hover:text-primary-foreground">
                    <AnimalIcon iconName={animal.icon} className="h-8 w-8" />
                  </div>
                  <h3 className="font-semibold">{animal.name}</h3>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Featured products */}
      <section className="bg-gradient-to-b from-background to-orange-50/60 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading
            eyebrow={t('products.featured')}
            title={t('home.productsSection.title')}
            subtitle={t('home.productsSection.subtitle')}
          />
          {products.isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-72" />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {products.data?.slice(0, 8).map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}
          <div className="mt-10 text-center">
            <Button asChild variant="outline">
              <Link to="/products">
                {t('home.viewAllProducts')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Vets */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeading
          eyebrow={t('home.bookVet')}
          title={t('home.vetsSection.title')}
          subtitle={t('home.vetsSection.subtitle')}
        />
        {doctors.isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-52" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.data?.slice(0, 3).map((doc: Doctor, i: number) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
              >
                <Card className="flex h-full flex-col items-center p-8 text-center">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-secondary/25 text-secondary-foreground">
                    <Stethoscope className="h-10 w-10" />
                  </div>
                  <h3 className="font-semibold">{doc.name}</h3>
                  <p className="mt-1 text-sm font-medium text-primary">{doc.specialization}</p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {doc.experience} {t('home.experience')}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
        <div className="mt-10 text-center">
          <Button asChild variant="outline">
            <Link to="/doctors">
              {t('home.meetAllVets')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  )
}