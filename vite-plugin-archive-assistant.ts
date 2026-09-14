import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { loadEnv } from 'vite'
import { handleArchiveAssistantRequest } from './server/archiveAssistant'

export function archiveAssistantPlugin(mode: string): Plugin {
  const env = loadEnv(mode, process.cwd(), '')
  const config = {
    geminiKey: env.GEMINI_API_KEY ?? process.env.GEMINI_API_KEY ?? '',
    geminiModel: env.GEMINI_MODEL ?? process.env.GEMINI_MODEL,
    anthropicKey: env.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY ?? '',
    anthropicModel: env.ANTHROPIC_MODEL ?? process.env.ANTHROPIC_MODEL,
  }

  const handler = (
    req: IncomingMessage,
    res: ServerResponse,
    next: (error?: unknown) => void,
  ) => {
    void handleArchiveAssistantRequest(req, res, config).catch(next)
  }

  return {
    name: 'legacy-archive-assistant',
    configureServer(server) {
      server.middlewares.use('/api/assistant', handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/assistant', handler)
    },
  }
}
