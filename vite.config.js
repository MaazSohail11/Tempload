import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const workerUrl = env.VITE_API_BASE_URL || 'https://vault.maazsohail731.workers.dev'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: workerUrl,
          changeOrigin: true,
          secure: true,
        }
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'animation-vendor': ['motion', '@tsparticles/engine', '@tsparticles/react', '@tsparticles/slim'],
            'crypto-vendor': ['fflate']
          }
        }
      }
    }
  }
})
