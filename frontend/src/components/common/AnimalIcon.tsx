import { Bird, Cat, Dog, Fish, Mouse, PawPrint } from 'lucide-react'

const ICONS: Record<string, typeof PawPrint> = {
  dog: Dog,
  cat: Cat,
  dove: Bird,
  fish: Fish,
  rabbit: Mouse,
}

export function AnimalIcon({
  iconName,
  className,
}: {
  iconName?: string | null
  className?: string
}) {
  const Icon = (iconName && ICONS[iconName]) || PawPrint
  return <Icon className={className} aria-hidden="true" />
}