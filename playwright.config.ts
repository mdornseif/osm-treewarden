import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Increased retries for flaky tests
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html'], ['json', { outputFile: 'test-results/results.json' }]] : 'html',
  timeout: 60000, // Increased global timeout
  expect: {
    timeout: 10000, // Increased expect timeout
  },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: process.env.CI ? 'retain-on-failure' : 'off',
    // Add more robust waiting
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Add viewport for consistent testing
        viewport: { width: 1280, height: 720 },
      },
    },
    // Only run chromium in CI for faster execution and fewer dependencies
    ...(process.env.CI ? [] : [
      {
        name: 'firefox',
        use: { 
          ...devices['Desktop Firefox'],
          viewport: { width: 1280, height: 720 },
        },
      },
      {
        name: 'webkit',
        use: { 
          ...devices['Desktop Safari'],
          viewport: { width: 1280, height: 720 },
        },
      },
    ]),
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'ignore',
    stderr: 'pipe',
    // Add more robust server startup
    ignoreHTTPSErrors: true,
  },

  // Add global setup and teardown
  globalSetup: './tests/global-setup.ts',
  globalTeardown: './tests/global-teardown.ts',
}); 