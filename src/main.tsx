import './instrument'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import { refreshRemoteArchive } from '@/data/archiveRemote'
import { SentryFallback } from '@/components/sentry/SentryFallback'
import { SentryTestGate } from '@/sentry/sentryTest'
import App from './App'
import './index.css'

const startArchive = () => {
  void refreshRemoteArchive()
}
if (typeof requestIdleCallback === 'function') {
  requestIdleCallback(startArchive, { timeout: 1200 })
} else {
  window.setTimeout(startArchive, 300)
}

createRoot(document.getElementById('root')!, {
  onUncaughtError: Sentry.reactErrorHandler(),
  onRecoverableError: Sentry.reactErrorHandler(),
}).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<SentryFallback />}>
      {__LEGACY_SENTRY_TEST__ ? <SentryTestGate /> : null}
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
