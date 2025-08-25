import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Set base path for GitHub Pages deployment
  // For user/organization pages (username.github.io), use '/'
  // For project pages (username.github.io/repository-name), use '/repository-name/'
  base: process.env.NODE_ENV === 'production' ? '/osm-treewarden/' : '/',
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
  }
}) 