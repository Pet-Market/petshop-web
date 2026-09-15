import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogOut,
  MessagesSquare,
  Package,
  Phone,
  Send,
  TriangleAlert,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'
import { useLang } from '@/lib/i18n/LangProvider'
import { getRawInitData, isTMA } from '@/lib/telegram'

const fieldClasses =
  'h-11 rounded-xl border-white/10 bg-slate-800/70 pl-10 text-sm text-slate-100 placeholder-slate-500 transition-colors focus:border-accent focus:bg-slate-800 focus:ring-1 focus:ring-accent'

function AuthForm({ onDone }: { onDone: () => void }) {
  const { t } = useLang()
  const { login, tmaLogin } = useAuth()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [tmaBusy, setTmaBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inTma = isTMA()

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(phone.trim(), password)
      setPassword('')
      onDone()
    } catch (err) {
      setError((err as { message?: string }).message ?? t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  const doTma = async () => {
    setTmaBusy(true)
    setError(null)
    try {
      const session = await tmaLogin(getRawInitData() ?? '', phone.trim() || undefined)
      if (session.is_first_login) toast.success(t('auth.firstLogin'))
      setPassword('')
      onDone()
    } catch {
      setError(t('auth.notFound'))
    } finally {
      setTmaBusy(false)
    }
  }

  return (
    <form onSubmit={doLogin} className="mt-2 space-y-5">
      {error && (
        <p className="flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">
          <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="auth-phone">{t('auth.phone')}</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id="auth-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+998 XX XXX XX XX"
            autoComplete="tel"
            className={fieldClasses}
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="auth-password">{t('auth.password')}</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id="auth-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            className={`${fieldClasses} pr-10`}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? t('auth.password') : t('auth.password')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:text-slate-200"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <Button type="submit" disabled={busy || !phone.trim() || !password} className="h-11 w-full rounded-xl">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
        {busy ? t('auth.loggingIn') : t('auth.loginBtn')}
      </Button>

      {!inTma && (
        <div className="space-y-1.5 border-t border-border/60 pt-4 text-center">
          <p className="text-xs text-muted-foreground">{t('auth.noPassword')}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (!phone.trim()) {
                setError(t('auth.phone'))
                return
              }
              setError(null)
              toast.success(t('auth.resetDone'))
              onDone()
            }}
            className="mx-auto gap-1.5 rounded-full text-accent hover:bg-accent/10"
          >
            <Send className="h-3.5 w-3.5" />
            {t('auth.resetPassword')}
          </Button>
          <div className="flex justify-center gap-1.5 text-xs text-muted-foreground">
            <MessagesSquare className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {t('auth.passwordToTelegram')}
          </div>
        </div>
      )}

      {inTma && (
        <div className="space-y-2 rounded-xl border border-border/60 bg-card/60 p-4">
          <p className="text-sm font-semibold text-foreground">{t('auth.tmaTitle')}</p>
          <p className="text-xs text-muted-foreground">{t('auth.tmaHint')}</p>
          <Button
            type="button"
            variant="outline"
            disabled={tmaBusy}
            onClick={doTma}
            className="h-11 w-full rounded-xl border-accent/40 text-accent hover:bg-accent/10"
          >
            {tmaBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <User className="h-4 w-4" />}
            {t('auth.tmaBtn')}
          </Button>
        </div>
      )}
    </form>
  )
}

export function AccountButton() {
  const { t } = useLang()
  const { client, loading, logout, attachPhone } = useAuth()
  const [open, setOpen] = useState(false)
  const inTma = isTMA()

  const initial = (client?.first_name || client?.username || client?.phone || '?').slice(0, 1).toUpperCase()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('common.account')}
        className="flex h-9 w-9 items-center justify-center rounded-full p-0 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
      >
        {loading ? (
          <span className="h-4 w-4 animate-pulse rounded-full bg-slate-600" />
        ) : client ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-md shadow-primary/25">
            {initial}
          </span>
        ) : (
          <User className="h-5 w-5" />
        )}
      </button>

      <SheetContent
        side="bottom"
        className="rounded-t-3xl sm:bottom-4 sm:left-1/2 sm:right-auto sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:rounded-2xl"
      >
        <SheetHeader className="pb-2 text-left">
          <SheetTitle>{client ? t('auth.welcome') : t('auth.title')}</SheetTitle>
          <SheetDescription>{client ? (client.first_name || client.phone) : t('auth.subtitle')}</SheetDescription>
        </SheetHeader>

        <div className="px-1 pb-2 pt-3">
          {client ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-card p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {initial}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{client.first_name || client.username || client.phone}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {client.phone ?? (inTma ? `Telegram #${client.telegram_id ?? ''}` : '')}
                  </p>
                </div>
              </div>

              {inTma && !client.phone && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-xl border-accent/40 text-accent hover:bg-accent/10"
                  onClick={async () => {
                    try {
                      await attachPhone()
                    } catch {
                      /* user denied */
                    }
                  }}
                >
                  <Phone className="h-4 w-4" />
                  {t('auth.sharePhone')}
                </Button>
              )}

              <Button asChild variant="outline" className="w-full rounded-xl">
                <Link to="/orders">
                  <Package className="h-4 w-4" />
                  {t('nav.orders')}
                </Link>
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-400"
                onClick={async () => {
                  await logout()
                  setOpen(false)
                }}
              >
                <LogOut className="h-4 w-4" />
                {t('auth.logout')}
              </Button>
            </div>
          ) : (
            <AuthForm onDone={() => setOpen(false)} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}