import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { refreshRemoteArchive } from '@/data/archiveRemote'
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
