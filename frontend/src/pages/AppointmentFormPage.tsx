import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CalendarCheck } from 'lucide-react'
import { toast } from 'sonner'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/common/SectionHeading'
import { api } from '@/lib/api'
import { Seo } from '@/lib/seo'
import { getTelegramUser } from '@/lib/telegram'
import { useLang } from '@/lib/i18n/LangProvider'
import { useAppStore } from '@/stores/app'
import type { AppointmentPayload } from '@/types'

export function AppointmentFormPage() {
  const { t } = useLang()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const telegram = useAppStore((s) => s.telegram)
  const tgUser = telegram?.user ?? getTelegramUser()

  const animalTypes = useQuery({ queryKey: ['animal-types'], queryFn: api.animalTypes.list })
  const doctors = useQuery({ queryKey: ['doctors'], queryFn: api.doctors.list })

  const schema = z.object({
    client_name: z.string().min(2, t('appointmentForm.errors.name')),
    client_phone: z.string().regex(/^\+?\d{9,15}$/, t('appointmentForm.errors.phone')),
    animal_type: z.string().regex(/^\d+$/, t('appointmentForm.errors.animalType')),
    animal_name: z.string().min(1, t('appointmentForm.errors.animalName')),
    doctor: z.string().regex(/^\d+$/, t('appointmentForm.errors.doctor')),
    date: z.string().min(1, t('appointmentForm.errors.date')),
    time: z.string().min(1, t('appointmentForm.errors.time')),
    problem_description: z.string().min(5, t('appointmentForm.errors.problem')),
  })

  type FormValues = z.infer<typeof schema>

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      client_name: tgUser?.first_name ?? '',
      client_phone: '',
      animal_type: '',
      animal_name: '',
      doctor: '',
      date: '',
      time: '',
      problem_description: '',
    },
  })

  const createAppointment = useMutation({
    mutationFn: (payload: AppointmentPayload) => api.appointments.create(payload),
    onSuccess: () => {
      toast.success(t('appointmentForm.success'))
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      navigate('/appointments')
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? t('common.error'))
    },
  })

  function onSubmit(values: FormValues) {
    createAppointment.mutate({
      ...values,
      animal_type: Number(values.animal_type),
      doctor: Number(values.doctor),
    })
  }

  return (
    <>
      <Seo
        path="/appointments/new"
        title="Book a Visit"
        description="Schedule an appointment with our veterinary doctors."
      />
      <PageHeader title={t('appointmentForm.title')} subtitle={t('appointmentForm.subtitle')} />

      <div className="mx-auto max-w-xl px-4 py-8 md:py-10">
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2 text-2xl">
              <CalendarCheck className="h-6 w-6 text-primary" />
              {t('appointmentForm.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="client_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('appointmentForm.clientName')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('appointmentForm.placeholders.name')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="client_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('appointmentForm.clientPhone')}</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder={t('appointmentForm.placeholders.phone')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="animal_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appointmentForm.animalType')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="—" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {animalTypes.data?.map((at) => (
                              <SelectItem key={at.id} value={String(at.id)}>
                                {at.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="animal_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appointmentForm.animalName')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('appointmentForm.placeholders.animalName')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="doctor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('appointmentForm.doctor')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="—" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {doctors.data?.map((d) => (
                            <SelectItem key={d.id} value={String(d.id)}>
                              {d.name} — {d.specialization}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appointmentForm.date')}</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appointmentForm.time')}</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="problem_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('appointmentForm.problemDescription')}</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={4}
                          placeholder={t('appointmentForm.placeholders.problem')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  size="lg"
                  className="w-full rounded-full"
                  disabled={createAppointment.isPending}
                >
                  {createAppointment.isPending ? t('common.loading') : t('appointmentForm.submit')}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}