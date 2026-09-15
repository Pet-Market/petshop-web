import { useController } from 'react-hook-form'
import type { Control, FieldPath, FieldValues } from 'react-hook-form'
import { CalendarDays, Clock3 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { formatDate, formatTime, todayDateInput } from '@/lib/format'
import { useLang } from '@/lib/i18n/LangProvider'

interface DateTimePickerProps<T extends FieldValues> {
  control: Control<T>
  dateName: FieldPath<T>
  timeName: FieldPath<T>
  minDate?: string
  disabled?: boolean
}

export function DateTimePicker<T extends FieldValues>({
  control,
  dateName,
  timeName,
  minDate,
  disabled,
}: DateTimePickerProps<T>) {
  const { t } = useLang()
  const dateField = useController({ control, name: dateName })
  const timeField = useController({ control, name: timeName })
  const error =
    dateField.fieldState.error?.message ?? timeField.fieldState.error?.message
  const min = minDate ?? todayDateInput()
  const selected =
    dateField.field.value && timeField.field.value
      ? `${formatDate(dateField.field.value)} • ${formatTime(timeField.field.value)}`
      : ''

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
        {t('listingOrder.pickupTitle')}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            {t('listingOrder.pickupDate')}
          </span>
          <Input
            type="date"
            min={min}
            disabled={disabled || dateField.field.disabled}
            value={dateField.field.value ?? ''}
            onChange={dateField.field.onChange}
            ref={dateField.field.ref}
            className="[color-scheme:dark]"
            aria-invalid={dateField.fieldState.invalid}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            {t('listingOrder.pickupTime')}
          </span>
          <Input
            type="time"
            disabled={disabled || timeField.field.disabled}
            value={timeField.field.value ?? ''}
            onChange={timeField.field.onChange}
            ref={timeField.field.ref}
            className="[color-scheme:dark]"
            aria-invalid={timeField.fieldState.invalid}
          />
        </label>
      </div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
        {selected ? selected : t('listingOrder.pickupHint')}
      </p>
      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
