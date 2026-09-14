import { Badge } from '@/components/ui/badge'
import { useLang } from '@/lib/i18n/LangProvider'

const STATUS_CLASSES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-sky-100 text-sky-700',
  completed: 'bg-emerald-100 text-emerald-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-700',
}

export function StatusBadge({ status }: { status: string }) {
  const { t } = useLang()
  const key = ['pending', 'confirmed', 'completed', 'delivered', 'cancelled'].includes(status)
    ? (status as 'pending' | 'confirmed' | 'completed' | 'delivered' | 'cancelled')
    : 'pending'

  return <Badge className={STATUS_CLASSES[key] ?? STATUS_CLASSES.pending}>{t(`status.${key}`)}</Badge>
}