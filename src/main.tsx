import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { refreshRemoteArchive } from '@/data/archiveRemote'
import App from './App'
import './index.css'

void refreshRemoteArchive()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
