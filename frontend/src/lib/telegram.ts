/**
 * Telegram Mini App (TWA) integration helpers.
 * Safe to import in a normal browser: init() is a no-op when the app
 * is not running inside a Telegram WebApp context.
 */
import {
  bindThemeParamsCssVars,
  init,
  initData,
  isMiniAppDark,
  isMiniAppMounted,
  isTMA,
  retrieveLaunchParams,
  setDebug,
  themeParams,
  type User,
} from '@telegram-apps/sdk'

export interface TelegramLaunchInfo {
  isTMA: boolean
  user: User | null
  platform: string
  theme: string
  queryId: string | null
}

export function setupTelegramApp(debug = false): TelegramLaunchInfo | null {
  setDebug(debug)

  if (!isTMA()) {
    return null
  }

  try {
    init()
  } catch {
    // Not launched inside Telegram — keep app running in browser.
    return null
  }

  bindThemeParamsCssVars()

  const lp = retrieveLaunchParams()
  const platform: string = typeof lp.platform === 'string' ? lp.platform : ''
  const user = initData.user() ?? null
  const queryId = initData.queryId() ?? null

  return {
    isTMA: isMiniAppMounted(),
    user,
    platform,
    theme: isMiniAppDark() ? 'dark' : 'light',
    queryId,
  }
}

export { isTMA }

export function getTelegramUser(): User | null {
  if (!isTMA()) return null
  return initData.user() ?? null
}

export { themeParams, bindThemeParamsCssVars }