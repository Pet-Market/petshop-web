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