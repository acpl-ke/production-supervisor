import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

type AppConfig = {
  apiUrl: string
  webUrl: string
}

const configFile = resolve(dirname(fileURLToPath(import.meta.url)), '../config.json')
const appConfig = JSON.parse(readFileSync(configFile, 'utf-8')) as AppConfig
const webUrl = new URL(appConfig.webUrl)

function serveAppConfig(): Plugin {
  return {
    name: 'serve-app-config',
    configureServer(server) {
      server.middlewares.use('/config.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(readFileSync(configFile))
      })
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'config.json',
        source: readFileSync(configFile),
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), serveAppConfig()],
  server: {
    host: webUrl.hostname,
    port: Number(webUrl.port) || 5173,
    proxy: {
      '/api': {
        target: appConfig.apiUrl,
        changeOrigin: true,
      },
    },
  },
})
