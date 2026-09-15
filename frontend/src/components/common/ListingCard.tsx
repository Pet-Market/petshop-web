import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ShoppingBag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatPrice } from '@/lib/format'
import { useLang } from '@/lib/i18n/LangProvider'
import { animalIconKey, getPetPhoto } from '@/lib/petPhotos'
import type { AnimalListing } from '@/types'

export function ListingCard({ listing, index = 0 }: { listing: AnimalListing; index?: number }) {
  const { t } = useLang()
  const iconKey = animalIconKey(listing.animal_type_name)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, delay: (index % 4) * 0.06 }}
      className="h-full"
    >
      <Link
        to={`/listings/${listing.id}`}
        className="glass-card group flex h-full flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:border-accent/40"
      >
        <div className="relative mb-4 overflow-hidden rounded-xl">
          <img
            src={getPetPhoto(iconKey)}
            alt={listing.title}
            className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <Badge
            className={`absolute left-2 top-2 border ${
              listing.in_stock
                ? 'border-emerald-400/30 bg-emerald-500/20 text-emerald-300'
                : 'border-rose-400/30 bg-rose-500/20 text-rose-300'
            }`}
          >
            {listing.in_stock ? t('listings.inStock') : t('listings.soldOut')}
          </Badge>
        </div>
        <div className="flex flex-1 flex-col gap-1.5 px-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {listing.animal_type_name} • {formatDate(listing.created_at)}
          </p>
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-100">
            {listing.title}
          </h3>
          <p className="text-xs text-slate-500">
            {listing.stock > 0
              ? `${listing.stock} ${t('listings.left')}`
              : t('listings.unavailable')}
          </p>
          <div className="mt-auto flex items-center justify-between border-t border-white/10 pb-4 pt-3">
            <span className="text-base font-extrabold text-white">{formatPrice(listing.price)}</span>
            {listing.in_stock ? (
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/25">
                <ShoppingBag className="h-4 w-4" />
              </span>
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-700/60 text-slate-400">
                <ShoppingBag className="h-4 w-4" />
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}