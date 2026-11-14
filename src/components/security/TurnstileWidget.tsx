import { useEffect, useRef } from 'react'

type TurnstileApi = {
  render: (container: HTMLElement, options: {
    sitekey: string
    callback: (token: string) => void
    'expired-callback'?: () => void
    'error-callback'?: () => void
    theme?: 'dark' | 'light' | 'auto'
  }) => string
  remove: (widgetId: string) => void
}
declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

type Props = { onToken: (token: string) => void }

export function TurnstileWidget({ onToken }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() ?? ''

  useEffect(() => {
    if (!siteKey || !container.current) return
    let widgetId: string | undefined
    let active = true
    const render = () => {
      if (!active || !container.current || !window.turnstile || widgetId) return
      widgetId = window.turnstile.render(container.current, {
        sitekey: siteKey,
        theme: 'dark',
        callback: onToken,
        'expired-callback': () => onToken(''),
        'error-callback': () => onToken(''),
      })
    }
    let script = document.querySelector<HTMLScriptElement>('script[data-legacy-turnstile]')
    if (!script) {
      script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.dataset.legacyTurnstile = 'true'
      document.head.appendChild(script)
    }
    script.addEventListener('load', render)
    render()
    return () => {
      active = false
      script?.removeEventListener('load', render)
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId)
      onToken('')
    }
  }, [siteKey, onToken])

  if (!siteKey) return null
  return <div ref={container} className="flex justify-center" aria-label="Verificación anti-bots" />
}
