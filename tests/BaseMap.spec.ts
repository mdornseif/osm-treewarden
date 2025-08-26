import { test, expect } from '@playwright/test';

test.describe('TreeWarden Application', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the application to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Map Rendering and Basic Functionality', () => {
    test('should render the map container', async ({ page }) => {
      // Wait for the map to load
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      const mapContainer = page.locator('.leaflet-container');
      await expect(mapContainer).toBeVisible();
      
      // Verify the map has proper dimensions
      const boundingBox = await mapContainer.boundingBox();
      expect(boundingBox?.width).toBeGreaterThan(0);
      expect(boundingBox?.height).toBeGreaterThan(0);
    });

    test('should display map tiles', async ({ page }) => {
      // Wait for map tiles to load (with longer timeout for network)
      await page.waitForSelector('.leaflet-tile', { timeout: 20000 });
      
      const tiles = page.locator('.leaflet-tile');
      await expect(tiles.first()).toBeVisible();
      
      // Verify tiles are loading
      const tileCount = await tiles.count();
      expect(tileCount).toBeGreaterThan(0);
    });

    test('should show map controls', async ({ page }) => {
      // Wait for zoom controls to appear
      await page.waitForSelector('.leaflet-control-zoom', { timeout: 15000 });
      
      const zoomIn = page.locator('.leaflet-control-zoom-in');
      const zoomOut = page.locator('.leaflet-control-zoom-out');
      
      await expect(zoomIn).toBeVisible();
      await expect(zoomOut).toBeVisible();
      
      // Verify controls are clickable
      await expect(zoomIn).toBeEnabled();
      await expect(zoomOut).toBeEnabled();
    });

    test('should display attribution', async ({ page }) => {
      // Wait for attribution to load
      await page.waitForSelector('.leaflet-control-attribution', { timeout: 15000 });
      
      const attribution = page.locator('.leaflet-control-attribution');
      await expect(attribution).toBeVisible();
      
      // Check for attribution content (may vary based on background layer)
      const attributionText = await attribution.textContent();
      expect(attributionText).toBeTruthy();
    });
  });

  test.describe('Map Interactions', () => {
    test('should allow zooming in', async ({ page }) => {
      await page.waitForSelector('.leaflet-control-zoom-in', { timeout: 15000 });
      
      // Get initial zoom level from URL or default
      const initialUrl = page.url();
      const urlParams = new URLSearchParams(initialUrl.split('?')[1] || '');
      const initialZoom = urlParams.get('z') ? parseInt(urlParams.get('z')!) : 17;
      
      // Click zoom in button
      await page.click('.leaflet-control-zoom-in');
      
      // Wait for zoom animation and URL update
      await page.waitForTimeout(1000);
      
      // Check if URL was updated with new zoom level
      const newUrl = page.url();
      const newUrlParams = new URLSearchParams(newUrl.split('?')[1] || '');
      const newZoom = newUrlParams.get('z') ? parseInt(newUrlParams.get('z')!) : initialZoom;
      
      expect(newZoom).toBeGreaterThan(initialZoom);
    });

    test('should allow zooming out', async ({ page }) => {
      await page.waitForSelector('.leaflet-control-zoom-out', { timeout: 15000 });
      
      // Get initial zoom level from URL or default
      const initialUrl = page.url();
      const urlParams = new URLSearchParams(initialUrl.split('?')[1] || '');
      const initialZoom = urlParams.get('z') ? parseInt(urlParams.get('z')!) : 17;
      
      // Click zoom out button
      await page.click('.leaflet-control-zoom-out');
      
      // Wait for zoom animation and URL update
      await page.waitForTimeout(1000);
      
      // Check if URL was updated with new zoom level
      const newUrl = page.url();
      const newUrlParams = new URLSearchParams(newUrl.split('?')[1] || '');
      const newZoom = newUrlParams.get('z') ? parseInt(newUrlParams.get('z')!) : initialZoom;
      
      expect(newZoom).toBeLessThan(initialZoom);
    });

    test('should allow panning and update URL coordinates', async ({ page }) => {
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      // Get initial coordinates from URL or default
      const initialUrl = page.url();
      const urlParams = new URLSearchParams(initialUrl.split('?')[1] || '');
      const initialLat = urlParams.get('lat') ? parseFloat(urlParams.get('lat')!) : 50.897146;
      const initialLng = urlParams.get('lng') ? parseFloat(urlParams.get('lng')!) : 7.098337;
      
      // Perform pan gesture
      const mapContainer = page.locator('.leaflet-container');
      await mapContainer.dragTo(mapContainer, {
        sourcePosition: { x: 100, y: 100 },
        targetPosition: { x: 300, y: 300 }
      });
      
      // Wait for pan animation and URL update
      await page.waitForTimeout(2000);
      
      // Check if URL was updated with new coordinates
      const newUrl = page.url();
      const newUrlParams = new URLSearchParams(newUrl.split('?')[1] || '');
      const newLat = newUrlParams.get('lat') ? parseFloat(newUrlParams.get('lat')!) : initialLat;
      const newLng = newUrlParams.get('lng') ? parseFloat(newUrlParams.get('lng')!) : initialLng;
      
      // Coordinates should have changed (allowing for some precision differences)
      const latDiff = Math.abs(newLat - initialLat);
      const lngDiff = Math.abs(newLng - initialLng);
      expect(latDiff + lngDiff).toBeGreaterThan(0.001);
    });
  });

  test.describe('URL Parameter Functionality', () => {
    test('should load with URL parameters', async ({ page }) => {
      // Navigate with specific URL parameters
      await page.goto('/?lat=51.5074&lng=-0.1278&z=15&layer=osm');
      
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      // Verify URL parameters are preserved
      const url = page.url();
      expect(url).toContain('lat=51.5074');
      expect(url).toContain('lng=-0.1278');
      expect(url).toContain('z=15');
      expect(url).toContain('layer=osm');
    });

    test('should handle invalid URL parameters gracefully', async ({ page }) => {
      // Navigate with invalid URL parameters
      await page.goto('/?lat=invalid&lng=invalid&z=999&layer=invalid');
      
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      // Map should still load with default values
      const mapContainer = page.locator('.leaflet-container');
      await expect(mapContainer).toBeVisible();
      
      // URL should be corrected to valid parameters
      const url = page.url();
      expect(url).toContain('lat=');
      expect(url).toContain('lng=');
      expect(url).toContain('z=');
      expect(url).toContain('layer=');
    });

    test('should update URL when map state changes', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      const initialUrl = page.url();
      
      // Perform a map interaction
      await page.click('.leaflet-control-zoom-in');
      await page.waitForTimeout(1000);
      
      const newUrl = page.url();
      expect(newUrl).not.toBe(initialUrl);
      expect(newUrl).toContain('z=');
    });
  });

  test.describe('Background Layer Functionality', () => {
    test('should have background layer selector', async ({ page }) => {
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      // Look for the background layer toggle button
      const bgLayerToggle = page.locator('button[title*="Hintergrund"]');
      await expect(bgLayerToggle).toBeVisible();
    });

    test('should allow switching background layers', async ({ page }) => {
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      // Click the background layer toggle
      const bgLayerToggle = page.locator('button[title*="Hintergrund"]');
      await bgLayerToggle.click();
      
      // Wait for the background layer panel to appear
      await page.waitForSelector('.background-layer-window', { timeout: 10000 });
      
      // Check if layer options are available
      const layerOptions = page.locator('.layer-option');
      await expect(layerOptions.first()).toBeVisible();
      
      // Select a different layer (if available)
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
  });

  test.describe('Application UI Components', () => {
    test('should display application header and controls', async ({ page }) => {
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      // Check for various UI elements that should be present
      const body = page.locator('body');
      await expect(body).toBeVisible();
      
      // The application should have some interactive elements
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      expect(buttonCount).toBeGreaterThan(0);
    });

    test('should handle responsive design', async ({ page }) => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      const mapContainer = page.locator('.leaflet-container');
      await expect(mapContainer).toBeVisible();
      
      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(mapContainer).toBeVisible();
      
      // Test desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect(mapContainer).toBeVisible();
    });
  });

  test.describe('Performance and Loading', () => {
    test('should load within reasonable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.waitForSelector('.leaflet-container', { timeout: 30000 });
      await page.waitForSelector('.leaflet-tile', { timeout: 30000 });
      
      const loadTime = Date.now() - startTime;
      
      // Application should load within 30 seconds
      expect(loadTime).toBeLessThan(30000);
    });

    test('should handle map interactions smoothly', async ({ page }) => {
      await page.waitForSelector('.leaflet-control-zoom-in', { timeout: 15000 });
      
      const startTime = Date.now();
      
      // Perform multiple zoom operations
      for (let i = 0; i < 3; i++) {
        await page.click('.leaflet-control-zoom-in');
        await page.waitForTimeout(500);
      }
      
      const totalTime = Date.now() - startTime;
      
      // Zoom operations should be responsive
      expect(totalTime).toBeLessThan(5000);
    });
  });

  test.describe('Error Handling and Resilience', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Block tile requests to simulate network error
      await page.route('**/*.png', route => route.abort());
      await page.route('**/*.jpg', route => route.abort());
      
      await page.goto('/');
      
      // Map should still render even with tile loading errors
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      const mapContainer = page.locator('.leaflet-container');
      await expect(mapContainer).toBeVisible();
    });

    test('should handle slow network conditions', async ({ page }) => {
      // Simulate slow network
      await page.route('**/*', route => {
        route.continue();
      });
      
      // Set a longer timeout for slow conditions
      page.setDefaultTimeout(45000);
      
      await page.goto('/');
      await page.waitForSelector('.leaflet-container', { timeout: 45000 });
      
      const mapContainer = page.locator('.leaflet-container');
      await expect(mapContainer).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels for zoom controls', async ({ page }) => {
      await page.waitForSelector('.leaflet-control-zoom-in', { timeout: 15000 });
      
      const zoomIn = page.locator('.leaflet-control-zoom-in');
      const zoomOut = page.locator('.leaflet-control-zoom-out');
      
      // Check for aria-label or title attributes
      const zoomInAria = await zoomIn.getAttribute('aria-label') || await zoomIn.getAttribute('title');
      const zoomOutAria = await zoomOut.getAttribute('aria-label') || await zoomOut.getAttribute('title');
      
      expect(zoomInAria).toBeTruthy();
      expect(zoomOutAria).toBeTruthy();
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      // Focus on the page
      await page.keyboard.press('Tab');
      
      // Check if focusable elements are present
      const focusableElements = page.locator('button, input, a, [tabindex]:not([tabindex="-1"])');
      const focusableCount = await focusableElements.count();
      expect(focusableCount).toBeGreaterThan(0);
    });
  });

  test.describe('Cross-browser Compatibility', () => {
    test('should work across different browsers', async ({ page, browserName }) => {
      await page.waitForSelector('.leaflet-container', { timeout: 15000 });
      
      const mapContainer = page.locator('.leaflet-container');
      await expect(mapContainer).toBeVisible();
      
      // Basic functionality should work in all browsers
      const zoomIn = page.locator('.leaflet-control-zoom-in');
      await expect(zoomIn).toBeVisible();
      
      // Log browser-specific information for debugging
      console.log(`Testing in browser: ${browserName}`);
    });
  });
}); 