export function formatPrice(value: string | number): string {
  const num = Number(value)
  if (Number.isNaN(num)) return `${value}`
  const rounded = Number(num.toFixed(0))
  return `${rounded.toLocaleString('en-US')} so'm`
}

export function formatDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatTime(value: string | null | undefined): string {
  if (!value) return ''
  const [hour, minute] = value.split(':')
  if (!hour || !minute) return value
  return `${hour}:${minute}`
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return ''
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function todayDateInput(date = new Date()): string {
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${m}-${d}`
}