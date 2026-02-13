import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueDevTools from 'vite-plugin-vue-devtools'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const signalServerUrl = env.VITE_SIGNAL_SERVER_URL || 'https://localhost:3000'

  return {
    plugins: [
      vue(),
      VueDevTools(),
      basicSsl()
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      host: true,
      proxy: {
        '/socket.io/': {
          target: signalServerUrl,
          changeOrigin: true,
          secure: false,
          ws: true
        },
      },
    },
    test: {
      environment: 'happy-dom',
      include: ['src/**/*.{test,spec}.{js,ts}'],
      setupFiles: ['src/__tests__/setup.ts'],
    },
  }
})
