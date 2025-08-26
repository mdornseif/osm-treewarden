import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  // Clean up any test artifacts or temporary files
  console.log('🧹 Global teardown completed');
}

export default globalTeardown;