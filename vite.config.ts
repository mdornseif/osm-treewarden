import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Set base path for deployment
  // Deployed at root of domain, so use '/'
  base: '/',
  server: {
    port: 3000,
    open: true,
    host: true,
    cors: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Ensure assets are properly referenced with the base path
    assetsDir: 'assets'
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  },
  json: {
    stringify: true
  }
}) 