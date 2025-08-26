import { test, expect } from '@playwright/test';

test.describe('Background Layer Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Wait for the application to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Background Layer Selector UI', () => {
    test('should display background layer toggle button', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      // Look for the background layer toggle button
      const bgLayerToggle = page.locator('button[title*="Hintergrund"]');
      await expect(bgLayerToggle).toBeVisible();
      
      // Verify button has proper styling and is clickable
      await expect(bgLayerToggle).toBeEnabled();
    });

    test('should open background layer panel when clicked', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      // Click the background layer toggle
      const bgLayerToggle = page.locator('button[title*="Hintergrund"]');
      await bgLayerToggle.click();
      
      // Wait for the background layer panel to appear
      await page.waitForSelector('.background-layer-window', { timeout: 10000 });
      
      // Verify panel is visible
      const bgLayerWindow = page.locator('.background-layer-window');
      await expect(bgLayerWindow).toBeVisible();
    });

    test('should close background layer panel when toggle is clicked again', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      // Click the background layer toggle to open
      const bgLayerToggle = page.locator('button[title*="Hintergrund"]');
      await bgLayerToggle.click();
      
      // Wait for panel to appear
      await page.waitForSelector('.background-layer-window', { timeout: 10000 });
      
      // Click toggle again to close
      await bgLayerToggle.click();
      
      // Wait for panel to disappear
      await page.waitForTimeout(500);
      
      // Verify panel is not visible
      const bgLayerWindow = page.locator('.background-layer-window');
      await expect(bgLayerWindow).not.toBeVisible();
    });
  });

  test.describe('Background Layer Options', () => {
    test('should display available layer options', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      // Open background layer panel
      const bgLayerToggle = page.locator('button[title*="Hintergrund"]');
      await bgLayerToggle.click();
      
      await page.waitForSelector('.background-layer-window', { timeout: 10000 });
      
      // Check if layer options are available
      const layerOptions = page.locator('.layer-option');
      const optionCount = await layerOptions.count();
      expect(optionCount).toBeGreaterThan(0);
      
      // Verify at least OSM layer is available
      const osmLayerOption = page.locator('input[value="osm"]');
      await expect(osmLayerOption).toBeVisible();
    });

    test('should display layer information correctly', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      // Open background layer panel
      const bgLayerToggle = page.locator('button[title*="Hintergrund"]');
      await bgLayerToggle.click();
      
      await page.waitForSelector('.background-layer-window', { timeout: 10000 });
      
      // Check for layer names and descriptions
      const layerNames = page.locator('.layer-name');
      const layerDescriptions = page.locator('.layer-description');
      
      const nameCount = await layerNames.count();
      const descCount = await layerDescriptions.count();
      
      expect(nameCount).toBeGreaterThan(0);
      expect(descCount).toBeGreaterThan(0);
    });

    test('should show current layer information', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      // Open background layer panel
      const bgLayerToggle = page.locator('button[title*="Hintergrund"]');
      await bgLayerToggle.click();
      
      await page.waitForSelector('.background-layer-window', { timeout: 10000 });
      
      // Check for current layer section
      const currentLayerSection = page.locator('.background-layer-section').filter({ hasText: 'Aktuelle Karte' });
      await expect(currentLayerSection).toBeVisible();
      
      // Check for current layer name
      const currentLayerName = page.locator('.current-layer-name');
      await expect(currentLayerName).toBeVisible();
    });
  });

  test.describe('Background Layer Switching', () => {
    test('should switch to OSM layer', async ({ page }) => {
      await page.goto('/?layer=nrw-orthophoto');
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      // Open background layer panel
      const bgLayerToggle = page.locator('button[title*="Hintergrund"]');
      await bgLayerToggle.click();
      
      await page.waitForSelector('.background-layer-window', { timeout: 10000 });
      
      // Select OSM layer
      const osmLayerOption = page.locator('input[value="osm"]');
      if (await osmLayerOption.isVisible()) {
        await osmLayerOption.click();
        
        // Wait for layer change and URL update
        await page.waitForTimeout(2000);
        
        // Verify URL was updated
        const url = page.url();
        expect(url).toContain('layer=osm');
      }
    });

    test('should switch to NRW orthophoto layer', async ({ page }) => {
      await page.goto('/?layer=osm');
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      // Open background layer panel
      const bgLayerToggle = page.locator('button[title*="Hintergrund"]');
      await bgLayerToggle.click();
      
      await page.waitForSelector('.background-layer-window', { timeout: 10000 });
      
      // Select NRW orthophoto layer
      const nrwLayerOption = page.locator('input[value="nrw-orthophoto"]');
      if (await nrwLayerOption.isVisible()) {
        await nrwLayerOption.click();
        
        // Wait for layer change and URL update
        await page.waitForTimeout(2000);
        
        // Verify URL was updated
        const url = page.url();
        expect(url).toContain('layer=nrw-orthophoto');
      }
    });

    test('should update URL when layer is changed', async ({ page }) => {
      await page.goto('/?layer=osm');
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      const initialUrl = page.url();
      
      // Open background layer panel
      const bgLayerToggle = page.locator('button[title*="Hintergrund"]');
      await bgLayerToggle.click();
      
      await page.waitForSelector('.background-layer-window', { timeout: 10000 });
      
      // Select different layer
      const nrwLayerOption = page.locator('input[value="nrw-orthophoto"]');
      if (await nrwLayerOption.isVisible()) {
        await nrwLayerOption.click();
        
        await page.waitForTimeout(2000);
        
        const newUrl = page.url();
        expect(newUrl).not.toBe(initialUrl);
        expect(newUrl).toContain('layer=nrw-orthophoto');
      }
    });
  });

  test.describe('Background Layer Persistence', () => {
    test('should remember selected layer on page refresh', async ({ page }) => {
      await page.goto('/?layer=nrw-orthophoto');
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      // Refresh the page
      await page.reload();
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      // Verify layer is still selected
      const url = page.url();
      expect(url).toContain('layer=nrw-orthophoto');
    });

    test('should load with correct layer from URL parameters', async ({ page }) => {
      await page.goto('/?lat=50.897146&lng=7.098337&z=17&layer=nrw-orthophoto');
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      // Open background layer panel
      const bgLayerToggle = page.locator('button[title*="Hintergrund"]');
      await bgLayerToggle.click();
      
      await page.waitForSelector('.background-layer-window', { timeout: 10000 });
      
      // Verify correct layer is selected
      const nrwLayerOption = page.locator('input[value="nrw-orthophoto"]');
      if (await nrwLayerOption.isVisible()) {
        await expect(nrwLayerOption).toBeChecked();
      }
    });
  });

  test.describe('Background Layer Error Handling', () => {
    test('should handle invalid layer parameters gracefully', async ({ page }) => {
      await page.goto('/?layer=invalid-layer');
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      // Map should still load with default layer
      const mapContainer = page.locator('.leaflet-container');
      await expect(mapContainer).toBeVisible();
      
      // URL should be corrected to default layer
      const url = page.url();
      expect(url).toContain('layer=osm');
    });

    test('should handle network errors for tile layers', async ({ page }) => {
      // Block tile requests to simulate network error
      await page.route('**/*.png', route => route.abort());
      await page.route('**/*.jpg', route => route.abort());
      
      await page.goto('/?layer=osm');
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      // Map should still render even with tile loading errors
      const mapContainer = page.locator('.leaflet-container');
      await expect(mapContainer).toBeVisible();
    });
  });

  test.describe('Background Layer Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      // Background layer toggle should still be accessible
      const bgLayerToggle = page.locator('button[title*="Hintergrund"]');
      await expect(bgLayerToggle).toBeVisible();
      
      // Open panel
      await bgLayerToggle.click();
      await page.waitForSelector('.background-layer-window', { timeout: 10000 });
      
      // Panel should be visible and usable
      const bgLayerWindow = page.locator('.background-layer-window');
      await expect(bgLayerWindow).toBeVisible();
    });

    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      // Background layer toggle should still be accessible
      const bgLayerToggle = page.locator('button[title*="Hintergrund"]');
      await expect(bgLayerToggle).toBeVisible();
      
      // Open panel
      await bgLayerToggle.click();
      await page.waitForSelector('.background-layer-window', { timeout: 10000 });
      
      // Panel should be visible and usable
      const bgLayerWindow = page.locator('.background-layer-window');
      await expect(bgLayerWindow).toBeVisible();
    });
  });
});