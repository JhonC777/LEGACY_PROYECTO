import * as Sentry from '@sentry/react'
import type { BrowserOptions } from '@sentry/react'
import { withStaticSpan } from '@sentry/core'
import { scrubBreadcrumb, scrubErrorEvent, scrubSpan, scrubUrl } from '@/lib/sentryScrub'

const dsn = import.meta.env.VITE_SENTRY_DSN?.trim() ?? ''

function sentryEnvironment(): string {
  const vercelEnv = import.meta.env.VITE_VERCEL_ENV
  if (vercelEnv === 'production' || vercelEnv === 'preview' || vercelEnv === 'development') {
    return vercelEnv
  }
  return import.meta.env.MODE
}

if (dsn) {
  // SDK 11 sustituyó sendDefaultPii por dataCollection. El flag se conserva
  // para dejar explícito que no se envía PII; userInfo: false es lo que el SDK aplica.
  const options: BrowserOptions & { sendDefaultPii: false } = {
    dsn,
    environment: sentryEnvironment(),
    sendDefaultPii: false,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      stackFrameVariables: false,
      databaseQueryData: false,
      queues: false,
      graphQL: { document: false, variables: false },
      genAI: { inputs: false, outputs: false },
    },
    integrations: [
      Sentry.browserTracingIntegration({
        beforeStartSpan(context) {
          if (typeof context.name !== 'string') return context
          return { ...context, name: scrubUrl(context.name) }
        },
      }),
    ],
    tracesSampleRate: 0.1,
    // SDK 11 ignora beforeSendTransaction salvo con el ciclo estático.
    traceLifecycle: 'static',
    // Solo mismo origen. No añadir supabase.co: sentry-trace rompería el CORS.
    tracePropagationTargets: [/^\//],
    enhanceFetchErrorMessages: 'report-only',
    beforeSend(event) {
      return scrubErrorEvent(event)
    },
    beforeSendTransaction(event) {
      return scrubErrorEvent(event)
    },
    beforeSendSpan: withStaticSpan((span) => scrubSpan(span)),
    beforeBreadcrumb(breadcrumb, hint) {
      return scrubBreadcrumb(breadcrumb, hint)
    },
  }
  Sentry.init(options)
}
