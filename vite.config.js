import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api/auth': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      '/api/public': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      '/api/restaurants': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      '/api/menu': {
        target: 'http://localhost:8083',
        changeOrigin: true,
      },
      '/api/cart': {
        target: 'http://localhost:8084',
        changeOrigin: true,
      },
      '/api/orders': {
        target: 'http://localhost:8085',
        changeOrigin: true,
      },
      '/api/payments': {
        target: 'http://localhost:8086',
        changeOrigin: true,
      },
      '/api/wallet': {
        target: 'http://localhost:8086',
        changeOrigin: true,
      },
      '/api/agents': {
        target: 'http://localhost:8087',
        changeOrigin: true,
      }
    }
  }
})
