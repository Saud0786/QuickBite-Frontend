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
      }
    }
  }
})
