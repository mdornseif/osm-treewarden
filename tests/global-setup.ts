import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  
  // Launch browser to check if the application is accessible
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Navigate to the application and wait for it to load
    await page.goto(baseURL!);
    
    // Wait for the map container to be present (indicating the app has loaded)
    await page.waitForSelector('.leaflet-container', { timeout: 30000 });
    
    console.log('✅ Application is accessible and ready for testing');
  } catch (error) {
    console.error('❌ Application failed to load during global setup:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;