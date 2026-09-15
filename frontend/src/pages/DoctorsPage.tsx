import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { CalendarCheck, Mail, Phone, Stethoscope } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/common/SectionHeading'
import { api } from '@/lib/api'
import { Seo } from '@/lib/seo'
import { useLang } from '@/lib/i18n/LangProvider'
import type { Doctor } from '@/types'

export function DoctorsPage() {
  const { t } = useLang()
  const doctors = useQuery({ queryKey: ['doctors'], queryFn: api.doctors.list })

  return (
    <>
      <Seo
        path="/doctors"
        title="Our Vets"
        description="Meet our experienced veterinary doctors and book an appointment online."
      />
      <PageHeader title={t('doctors.title')} subtitle={t('doctors.subtitle')} />

      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        {doctors.isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : doctors.data?.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.data.map((doc: Doctor, i: number) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: (i % 3) * 0.06 }}
              >
                <Card className="flex h-full flex-col p-8">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/15 text-secondary">
                    <Stethoscope className="h-8 w-8" />
                  </div>
                  <h2 className="text-xl font-bold">{doc.name}</h2>
                  <p className="mt-1 text-sm font-semibold text-primary">{doc.specialization}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {doc.experience} {t('doctors.experience')}
                  </p>

                  <div className="mt-5 space-y-2 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" />
                      {doc.phone}
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      {doc.email}
                    </p>
                  </div>

                  <Button asChild className="mt-6 w-full rounded-full">
                    <Link to="/appointments/new">
                      <CalendarCheck className="mr-2 h-4 w-4" />
                      {t('doctors.bookVisit')}
                    </Link>
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="py-20 text-center text-muted-foreground">{t('doctors.noDoctors')}</p>
        )}
      </div>
    </>
  )
}