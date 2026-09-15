import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CalendarPlus, CalendarX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/common/StatusBadge'
import { PageHeader } from '@/components/common/SectionHeading'
import { api } from '@/lib/api'
import { Seo } from '@/lib/seo'
import { useLang } from '@/lib/i18n/LangProvider'
import type { Appointment } from '@/types'

export function AppointmentsPage() {
  const { t } = useLang()
  const appointments = useQuery({ queryKey: ['appointments'], queryFn: api.appointments.list })

  return (
    <>
      <Seo
        path="/appointments"
        title="Appointments"
        description="All veterinary bookings."
      />
      <PageHeader title={t('appointments.title')} subtitle={t('appointments.subtitle')}>
        <Button asChild size="lg" className="mt-6 rounded-full">
          <Link to="/appointments/new">
            <CalendarPlus className="mr-2 h-5 w-5" />
            {t('appointments.new')}
          </Link>
        </Button>
      </PageHeader>

      <div className="mx-auto max-w-4xl px-4 py-8 md:py-10">
        {appointments.isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-36" />
            ))}
          </div>
        ) : appointments.data?.length ? (
          <div className="space-y-4">
            {appointments.data.map((appointment: Appointment) => (
              <Card key={appointment.id} className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold">{appointment.animal_name}</h2>
                      <StatusBadge status={appointment.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {appointment.client_name} • {appointment.animal_type_name}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-primary">
                      {appointment.date} • {appointment.time}
                    </p>
                </div>

                <dl className="mt-4 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                  <div className="flex gap-2">
                    <dt className="text-muted-foreground">{t('appointments.doctor')}:</dt>
                    <dd>{appointment.doctor_name}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-muted-foreground">{t('appointments.phone')}:</dt>
                    <dd>{appointment.client_phone}</dd>
                  </div>
                  {appointment.problem_description ? (
                    <div className="flex gap-2 sm:col-span-2">
                      <dt className="text-muted-foreground">{t('appointments.problem')}:</dt>
                      <dd>{appointment.problem_description}</dd>
                    </div>
                  ) : null}
                </dl>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-20 text-center">
            <CalendarX className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">{t('appointments.noAppointments')}</p>
            <Button asChild className="mt-6 rounded-full">
              <Link to="/appointments/new">
                <CalendarPlus className="mr-2 h-4 w-4" />
                {t('appointments.new')}
              </Link>
            </Button>
          </div>
        )}
      </div>
    </>
  )
}