import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { archiveAssistantPlugin } from './vite-plugin-archive-assistant'

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), archiveAssistantPlugin(mode)],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}))
