import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    // Exclude Playwright tests from Vitest
    exclude: ['**/tests/**', '**/node_modules/**', '**/dist/**', '**/.{idea,git,cache,output,temp}/**'],
    // Suppress React warnings in test output
    silent: false,
    reporter: ['verbose'],
    // Configure test output to be cleaner
    logHeapUsage: false
  },
})