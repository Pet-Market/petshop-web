import type { ReactNode } from 'react'
import { PawPrint } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  className,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  className?: string
}) {
  return (
    <div className={cn('mb-10 text-center', className)}>
      {eyebrow ? (
        <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
          <PawPrint className="h-3.5 w-3.5" aria-hidden="true" />
          {eyebrow}
        </span>
      ) : null}
      <h2 className="font-display text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-3 text-pretty text-muted-foreground md:text-lg">{subtitle}</p>
      ) : null}
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  children,
  className,
}: {
  title: string
  subtitle?: string
  eyebrow?: string
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-primary/15 via-accent/10 to-secondary/30"
      />
      <div className="relative mx-auto max-w-6xl px-4 py-12 text-center md:py-16">
        {eyebrow ? (
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <PawPrint className="h-3.5 w-3.5" aria-hidden="true" />
            {eyebrow}
          </span>
        ) : null}
        <h1 className="font-display text-balance text-4xl font-bold tracking-tight md:text-5xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mx-auto mt-3 max-w-2xl text-pretty text-muted-foreground md:text-lg">
            {subtitle}
          </p>
        ) : null}
        {children}
      </div>
    </div>
  )
}